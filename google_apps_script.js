/**
 * LEGADO CARDS - Google Apps Script Backend (Web App)
 * 
 * Este script se encarga de:
 * 1. doPost(e): Procesar las compras, asignar la cantidad de cartas requeridas por el paquete
 *    (individual, dupla, familia, equipo), marcando múltiples filas consecutivas como vendidas,
 *    subiendo las fotos de cada jugador a Drive, enviando un correo de auditoría consolidado
 *    con los QRs e imágenes y un correo de confirmación al comprador.
 * 2. doGet(e): Consultar la autenticidad e información de una carta por ID para verify.html.
 * 3. inicializarSheet(): Crear los encabezados y datos semilla si la hoja de cálculo está vacía.
 */

const CONFIG = {
  SHEET_ID: '1I-nl4EMLidR0B92FefliIcwUpHAha1oOz-mWfXkqDYI',
  SHEET_NAME: 'Registro de Cartas',
  DRIVE_FOLDER_ID: '1lQ7RNLgBvnrwD-9SS3ji5YPza03wWD6t',
  EMAIL_DESTINO: 'legadocards@gmail.com',
  BASE_URL: 'https://legadocards.vercel.app', // Cambiar cuando se conecte legado.cards
};

/* ==========================================
   POST - PROCESAR VENTA MULTICARTA
   ========================================== */
function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(ex) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    // Nombre de contacto (comprador)
    var contacto = data.compradorNombre || data.nombre;

    // Validar campos obligatorios
    if (!contacto || !data.email || !data.whatsapp || !data.paquete) {
      return responseJson({ success: false, message: "Faltan campos obligatorios en el formulario de compra." });
    }

    // Obtener array de jugadores
    var jugadores = [];
    if (data.jugadores) {
      if (typeof data.jugadores === 'string') {
        try {
          jugadores = JSON.parse(data.jugadores);
        } catch(ex) {}
      } else if (Array.isArray(data.jugadores)) {
        jugadores = data.jugadores;
      }
    }

    // Fallback a un único jugador si no viene array
    if (jugadores.length === 0) {
      jugadores.push({
        nombre: contacto,
        rol: data.rol || "Ninguno",
        fechaNacimiento: data.fechaNacimiento || "",
        pais: data.pais || "Perú",
        historia: data.historia || "",
        fotoBase64: data.fotoBase64 || "",
        fotoName: data.fotoName || ""
      });
    }

    var N = jugadores.length;

    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      return responseJson({ success: false, message: "Hoja de cálculo '" + CONFIG.SHEET_NAME + "' no encontrada." });
    }

    // Asegurar que existan las cabeceras extras en columnas Q a U (17 a 21)
    var lastCol = sheet.getLastColumn();
    if (lastCol < 21) {
      sheet.getRange(1, 17, 1, 5).setValues([["Paquete", "QR URL", "Rol / Posición", "Fecha Nacimiento", "Historia / Descripción"]]);
    }

    // Buscar la primera fila libre en la hoja
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return responseJson({ success: false, message: "El Sheet no tiene cartas inicializadas. Ejecute inicializarSheet primero." });
    }

    var range = sheet.getRange(2, 11, lastRow - 1, 1).getValues(); // Columna K (Vendida)
    var foundRows = [];

    // Algoritmo: Buscar N filas consecutivas vacías
    for (var i = 0; i < range.length - N + 1; i++) {
      var isMatch = true;
      for (var j = 0; j < N; j++) {
        var val = range[i + j][0];
        if (val !== "" && val !== undefined && val !== null) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        for (var j = 0; j < N; j++) {
          foundRows.push(i + j + 2); // +2 por índice 0 y cabecera
        }
        break;
      }
    }

    // Fallback: Si no hay consecutivas, tomar las primeras N individuales que estén libres
    if (foundRows.length < N) {
      foundRows = [];
      for (var i = 0; i < range.length; i++) {
        var val = range[i][0];
        if (val === "" || val === undefined || val === null) {
          foundRows.push(i + 2);
          if (foundRows.length === N) {
            break;
          }
        }
      }
    }

    if (foundRows.length < N) {
      return responseJson({ success: false, message: "La colección está completa. No quedan suficientes cartas fundadoras disponibles (solicitadas: " + N + ")." });
    }

    // Extraer precio
    var precioTotal = 0;
    var priceMatch = data.paquete.match(/S\/(\d+(\.\d+)?)/);
    if (priceMatch && priceMatch[1]) {
      precioTotal = parseFloat(priceMatch[1]);
    }
    var precioPorCarta = Math.round((precioTotal / N) * 100) / 100;

    var today = new Date();
    var dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy");

    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    var attachments = [];
    var cartasRetornar = [];
    var jugadoresDetallesTexto = "";

    // Procesar cada jugador y asignarle su respectiva carta
    for (var idx = 0; idx < N; idx++) {
      var row = foundRows[idx];
      var jugador = jugadores[idx];

      // Leer datos semilla de la carta pre-generada
      var cardId = sheet.getRange(row, 1).getValue().toString().trim();
      var noCarta = sheet.getRange(row, 2).getValue();
      var rareza = sheet.getRange(row, 3).getValue().toString().trim();
      var ovr = sheet.getRange(row, 4).getValue();

      var attrRange = sheet.getRange(row, 5, 1, 6).getValues()[0];
      var atributos = {
        energia: attrRange[0],
        inteligencia: attrRange[1],
        resistencia: attrRange[2],
        liderazgo: attrRange[3],
        precision: attrRange[4],
        ambicion: attrRange[5]
      };

      var verifyUrl = CONFIG.BASE_URL + "/verify/" + cardId;

      // Subir foto del jugador a Drive
      var driveUrl = "No proporcionada";
      if (jugador.fotoBase64 && jugador.fotoName) {
        try {
          var base64Foto = jugador.fotoBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
          var fotoBlob = Utilities.newBlob(Utilities.base64Decode(base64Foto), "image/jpeg", cardId + "_" + jugador.nombre.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg");
          var fotoFile = folder.createFile(fotoBlob);
          fotoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          driveUrl = fotoFile.getUrl();
          attachments.push(fotoBlob.setName(cardId + "_Foto_" + jugador.nombre.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg"));
        } catch (err) {
          driveUrl = "FOTO: Error al subir — revisar manualmente (" + err.message + ")";
        }
      }

      // Generar código QR
      var qrBlob = null;
      try {
        var qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + encodeURIComponent(verifyUrl);
        var qrResponse = UrlFetchApp.fetch(qrApiUrl);
        qrBlob = qrResponse.getBlob().setName("QR_" + cardId + ".png");
        attachments.push(qrBlob);
      } catch (err) {
        // Ignorar error de QR en el correo
      }

      // Guardar datos en el Google Sheet
      sheet.getRange(row, 11).setValue("S"); // K: Estado Vendida
      sheet.getRange(row, 12).setValue(jugador.nombre); // L: Nombre
      sheet.getRange(row, 13).setValue(jugador.pais); // M: País
      sheet.getRange(row, 14).setValue(dateString); // N: Fecha
      sheet.getRange(row, 15).setValue(precioPorCarta); // O: Ingresos
      
      // Columnas Q a U
      sheet.getRange(row, 17).setValue(data.paquete); // Q: Paquete
      sheet.getRange(row, 18).setValue(verifyUrl); // R: QR URL
      sheet.getRange(row, 19).setValue(jugador.rol); // S: Rol o Posición
      sheet.getRange(row, 20).setValue(jugador.fechaNacimiento || ""); // T: Fecha de Nacimiento
      sheet.getRange(row, 21).setValue(jugador.historia || ""); // U: Historia / Descripción

      // Texto consolidado para el correo de auditoría
      jugadoresDetallesTexto += 
        "--------------------------------------------------\n" +
        "JUGADOR #" + (idx + 1) + " — CARTA: " + cardId + "\n" +
        "--------------------------------------------------\n" +
        "Nombre:       " + jugador.nombre + "\n" +
        "Posición:     " + jugador.rol + "\n" +
        "Nacimiento:   " + (jugador.fechaNacimiento ? jugador.fechaNacimiento : 'No especificada') + "\n" +
        "País:         " + jugador.pais + "\n" +
        "Historia:     " + (jugador.historia ? jugador.historia : 'Ninguna') + "\n" +
        "Rareza:       " + rareza + " | OVR: " + ovr + "\n" +
        "Atributos:    ENE:" + atributos.energia + " | INT:" + atributos.inteligencia + " | RES:" + atributos.resistencia + " | LID:" + atributos.liderazgo + " | PRE:" + atributos.precision + " | AMB:" + atributos.ambicion + "\n" +
        "Foto Drive:   " + driveUrl + "\n" +
        "Verificación: " + verifyUrl + "\n\n";

      cartasRetornar.push({
        cardId: cardId,
        noCarta: noCarta,
        rareza: rareza,
        ovr: ovr,
        atributos: atributos,
        verifyUrl: verifyUrl,
        nombreJugador: jugador.nombre
      });
    }

    // Subir comprobante general de pago a Google Drive
    if (data.comprobanteBase64 && data.comprobanteName) {
      try {
        var base64Comp = data.comprobanteBase64.replace(/^data:(.*);base64,/, "");
        var compBlob = Utilities.newBlob(Utilities.base64Decode(base64Comp), "image/jpeg", "COMPROBANTE_" + contacto.replace(/[^a-zA-Z0-9]/g, "_") + "_" + today.getTime() + ".jpg");
        var compFile = folder.createFile(compBlob);
        compFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        attachments.push(compBlob);
      } catch (err) {
        // Ignorar
      }
    }

    // ENVIAR CORREO DE AUDITORÍA CONSOLIDADO A LEGADO CARDS
    var asuntoAuditoria = "[LEGADO] Nueva venta — " + data.paquete + " — " + N + " Carta(s) — " + contacto;
    var cuerpoAuditoria = 
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "NUEVA VENTA LEGADO CARDS — " + data.paquete.toUpperCase() + "\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "CONTACTO / COMPRADOR\n" +
      "Nombre:       " + contacto + "\n" +
      "Email:        " + data.email + "\n" +
      "WhatsApp:     " + data.whatsapp + "\n" +
      "Método Pago:  " + metodoPago + "\n" +
      "Precio Total: S/" + precioTotal.toFixed(2) + "\n" +
      "Fecha:        " + dateString + "\n" +
      "Comentarios:  " + (data.comentarios ? data.comentarios : 'Ninguno') + "\n\n" +
      "DETALLE DE CARTAS COMPRADAS:\n" +
      jugadoresDetallesTexto +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    MailApp.sendEmail({
      to: CONFIG.EMAIL_DESTINO,
      subject: asuntoAuditoria,
      body: cuerpoAuditoria,
      attachments: attachments
    });

    // ENVIAR CORREO DE CONFIRMACIÓN AL CLIENTE (LISTANDO SUS IDS)
    var listIds = cartasRetornar.map(function(c) { return c.cardId; }).join(", ");
    var asuntoCliente = "LEGADO Cards — Tu solicitud fue recibida ✅";
    var cuerpoCliente = 
      "Hola " + contacto + ",\n\n" +
      "Tu solicitud de pack ha sido recibida exitosamente.\n\n" +
      "Tus números de referencia de las cartas son: " + listIds + "\n\n" +
      "En menos de 12 horas recibirás tus cartas digitales directamente en tu correo.\n\n" +
      "Para cualquier consulta escríbenos:\n" +
      "📱 WhatsApp: +51989481296\n" +
      "📧 legadocards@gmail.com\n" +
      "📸 @legadocards\n\n" +
      "— El equipo de LEGADO";

    MailApp.sendEmail({
      to: data.email,
      subject: asuntoCliente,
      body: cuerpoCliente
    });

    // Devolver lista de cartas procesadas al frontend
    return responseJson({
      success: true,
      cartas: cartasRetornar
    });

  } catch(error) {
    return responseJson({ success: false, message: "Error interno: " + error.toString() });
  }
}

/* ==========================================
   GET - CONSULTA DE AUTENTICIDAD
   ========================================== */
function doGet(e) {
  try {
    var cardId = e.parameter.id;
    if (!cardId) {
      return responseJson({ success: false, message: "ID no proporcionado." });
    }

    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      return responseJson({ success: false, message: "Hoja de cálculo no encontrada." });
    }

    var values = sheet.getDataRange().getValues();
    var cardData = null;

    // Buscar coincidencia en la columna A (ID)
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] && values[i][0].toString().trim() === cardId.trim()) {
        cardData = values[i];
        break;
      }
    }

    if (!cardData) {
      return responseJson({ success: true, found: false, active: false });
    }

    var vendida = cardData[10]; // Columna K (Vendida)

    if (vendida !== "S") {
      return responseJson({ success: true, found: true, active: false, message: "Carta no emitida aún." });
    }

    // Carta vendida y activa
    return responseJson({
      success: true,
      found: true,
      active: true,
      id: cardData[0],
      noCarta: cardData[1],
      rareza: cardData[2],
      ovr: cardData[3],
      atributos: {
        energia: cardData[4],
        inteligencia: cardData[5],
        resistencia: cardData[6],
        liderazgo: cardData[7],
        precision: cardData[8],
        ambicion: cardData[9]
      },
      cliente: cardData[11],
      pais: cardData[12],
      fecha: cardData[13],
      rol: (cardData.length > 18 && cardData[18]) ? cardData[18].toString().trim() : "",
      fechaNacimiento: (cardData.length > 19 && cardData[19]) ? cardData[19].toString().trim() : "",
      historia: (cardData.length > 20 && cardData[20]) ? cardData[20].toString().trim() : ""
    });

  } catch(error) {
    return responseJson({ success: false, message: "Error en consulta GET: " + error.toString() });
  }
}

/* ==========================================
   HELPERS
   ========================================== */
function responseJson(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================
   INITIALIZE SHEET (CON NUEVAS COLUMNAS)
   ========================================== */
function inicializarSheet() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  } else {
    sheet.clear();
  }

  // Escribir cabeceras oficiales
  var headers = [
    "ID", "N° Carta", "Rareza", "OVR", 
    "Energía", "Inteligencia", "Resistencia", "Liderazgo", "Precisión", "Ambición", 
    "Vendida", "Nombre cliente", "País", "Fecha venta", "Ingresos", "Acumulado",
    "Paquete", "QR URL", "Rol / Posición", "Fecha Nacimiento", "Historia / Descripción"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Generar datos semilla: 100 cartas pre-diseñadas
  var dataSemilla = [];
  var rarezasList = [
    { name: "BRONCE", ovrMin: 60, ovrMax: 74 },
    { name: "PLATA", ovrMin: 75, ovrMax: 84 },
    { name: "ORO", ovrMin: 85, ovrMax: 89 },
    { name: "ÉLITE", ovrMin: 90, ovrMax: 94 },
    { name: "LEYENDA", ovrMin: 95, ovrMax: 99 }
  ];

  for (var num = 1; num <= 100; num++) {
    var paddedNum = String(num).padStart(4, "0");
    var id = "LGD-2026-" + paddedNum;
    
    var rand = Math.random() * 100;
    var rarezaObj;
    if (rand < 40) {
      rarezaObj = rarezasList[0];
    } else if (rand < 70) {
      rarezaObj = rarezasList[1];
    } else if (rand < 90) {
      rarezaObj = rarezasList[2];
    } else if (rand < 98) {
      rarezaObj = rarezasList[3];
    } else {
      rarezaObj = rarezasList[4];
    }

    var ovr = Math.floor(Math.random() * (rarezaObj.ovrMax - rarezaObj.ovrMin + 1)) + rarezaObj.ovrMin;
    
    var energia = Math.floor(Math.random() * (99 - 50 + 1)) + 50;
    var inteligencia = Math.floor(Math.random() * (99 - 50 + 1)) + 50;
    var resistencia = Math.floor(Math.random() * (99 - 50 + 1)) + 50;
    var liderazgo = Math.floor(Math.random() * (99 - 50 + 1)) + 50;
    var precision = Math.floor(Math.random() * (99 - 50 + 1)) + 50;
    var ambicion = Math.floor(Math.random() * (99 - 50 + 1)) + 50;

    dataSemilla.push([
      id,
      num,
      rarezaObj.name,
      ovr,
      energia,
      inteligencia,
      resistencia,
      liderazgo,
      precision,
      ambicion,
      "", // Vendida (vacía)
      "", // Nombre cliente (vacía)
      "", // País (vacía)
      "", // Fecha venta (vacía)
      "", // Ingresos (vacía)
      "", // Acumulado (vacía)
      "", // Paquete (vacía)
      "", // QR URL (vacía)
      "", // Rol / Posición (vacía)
      "", // Fecha Nacimiento (vacía)
      ""  // Historia / Descripción (vacía)
    ]);
  }

  sheet.getRange(2, 1, dataSemilla.length, headers.length).setValues(dataSemilla);
  Logger.log("Hoja de cálculo inicializada con éxito y 100 cartas semilla.");
}
