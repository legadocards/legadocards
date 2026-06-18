/**
 * LEGADO CARDS - Google Apps Script Backend (Web App)
 * 
 * Este script se encarga de:
 * 1. doPost(e): Procesar las compras, asignar la siguiente carta libre, marcarla como vendida,
 *    subir la foto a Google Drive, enviar un correo de auditoría con el QR y foto adjuntos, 
 *    y enviar un correo de confirmación al cliente.
 * 2. doGet(e): Consultar el estado y atributos de una carta por ID para verify.html.
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
   POST - PROCESAR VENTA
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

    // Validar campos obligatorios
    if (!data.nombre || !data.email || !data.whatsapp || !data.pais || !data.paquete) {
      return responseJson({ success: false, message: "Faltan campos obligatorios en el formulario." });
    }

    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      return responseJson({ success: false, message: "Hoja de cálculo '" + CONFIG.SHEET_NAME + "' no encontrada." });
    }

    // Buscar la primera fila libre (Columna K / Vendida vacía)
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return responseJson({ success: false, message: "El Sheet no tiene cartas inicializadas. Ejecute la función inicializarSheet primero." });
    }

    var foundRow = -1;
    var range = sheet.getRange(2, 11, lastRow - 1, 1).getValues(); // Valores de columna K (Vendida)
    
    for (var i = 0; i < range.length; i++) {
      var val = range[i][0];
      if (val === "" || val === undefined || val === null) {
        foundRow = i + 2; // +2 por índice 0 y fila de cabecera
        break;
      }
    }

    if (foundRow === -1) {
      return responseJson({ success: false, message: "La colección está completa. No quedan cartas fundadoras disponibles." });
    }

    // Leer los datos pre-generados de la carta asignada
    var cardId = sheet.getRange(foundRow, 1).getValue().toString().trim();
    var noCarta = sheet.getRange(foundRow, 2).getValue();
    var rareza = sheet.getRange(foundRow, 3).getValue().toString().trim();
    var ovr = sheet.getRange(foundRow, 4).getValue();
    
    var attrRange = sheet.getRange(foundRow, 5, 1, 6).getValues()[0];
    var atributos = {
      energia: attrRange[0],
      inteligencia: attrRange[1],
      resistencia: attrRange[2],
      liderazgo: attrRange[3],
      precision: attrRange[4],
      ambicion: attrRange[5]
    };

    // Extraer el precio numérico del paquete (ej: "Fundador Físico — S/34.90" -> 34.90)
    var precio = 0;
    var priceMatch = data.paquete.match(/S\/(\d+(\.\d+)?)/);
    if (priceMatch && priceMatch[1]) {
      precio = parseFloat(priceMatch[1]);
    }

    // Guardar los datos de venta del cliente en la hoja
    sheet.getRange(foundRow, 11).setValue("S");
    sheet.getRange(foundRow, 12).setValue(data.nombre);
    sheet.getRange(foundRow, 13).setValue(data.pais);
    
    var today = new Date();
    var dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy");
    sheet.getRange(foundRow, 14).setValue(dateString);
    sheet.getRange(foundRow, 15).setValue(precio);

    // Subida de la foto de perfil a Google Drive
    var driveUrl = "No proporcionada";
    var attachments = [];
    
    if (data.fotoBase64 && data.fotoName) {
      try {
        var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        var base64Foto = data.fotoBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        var fotoBlob = Utilities.newBlob(Utilities.base64Decode(base64Foto), "image/jpeg", cardId + "_" + data.nombre.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg");
        var fotoFile = folder.createFile(fotoBlob);
        fotoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveUrl = fotoFile.getUrl();
        attachments.push(fotoBlob.setName(cardId + "_FotoCliente.jpg"));
      } catch (err) {
        driveUrl = "FOTO: Error al subir — revisar manualmente (" + err.message + ")";
      }
    }

    // Subida del comprobante de pago a Google Drive (Opcional, pero se añade al correo)
    if (data.comcomprobanteBase64 || data.comprobanteBase64) {
      try {
        var base64Comp = (data.comprobanteBase64 || data.comcomprobanteBase64).replace(/^data:(.*);base64,/, "");
        var compBlob = Utilities.newBlob(Utilities.base64Decode(base64Comp), "image/jpeg", cardId + "_Comprobante_" + data.nombre.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg");
        attachments.push(compBlob);
      } catch (err) {
        // Ignorar error de comprobante secundario
      }
    }

    // Generar el código QR apuntando a la URL de verificación
    var verifyUrl = CONFIG.BASE_URL + "/verify/" + cardId;
    var qrBlob = null;
    try {
      var qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + encodeURIComponent(verifyUrl);
      var qrResponse = UrlFetchApp.fetch(qrApiUrl);
      qrBlob = qrResponse.getBlob().setName("QR_" + cardId + ".png");
      attachments.push(qrBlob);
    } catch (err) {
      // Si la API de QR falla, continuamos sin adjuntar el QR físico, pero mantenemos la URL
    }

    // ENVIAR CORREO DE AUDITORÍA A LEGADO CARDS
    var asuntoAuditoria = "[LEGADO] Nueva carta — " + cardId + " — " + data.nombre + " — " + rareza;
    var cuerpoAuditoria = 
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "NUEVA VENTA LEGADO CARDS\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "ID CARTA:     " + cardId + "\n" +
      "N° CARTA:     #" + String(noCarta).padStart(4, "0") + " / 2026\n" +
      "RAREZA:       " + rareza + "\n" +
      "OVR:          " + ovr + "\n\n" +
      "CLIENTE\n" +
      "Nombre:       " + data.nombre + "\n" +
      "País:         " + data.pais + "\n" +
      "Rol/Apodo:    " + (data.rol ? data.rol : 'Ninguno') + "\n" +
      "Email:        " + data.email + "\n" +
      "WhatsApp:     " + data.whatsapp + "\n" +
      "Paquete:      " + data.paquete + "\n" +
      "Precio:       S/" + precio.toFixed(2) + "\n" +
      "Fecha:        " + dateString + "\n\n" +
      "ATRIBUTOS\n" +
      "Energía:        " + atributos.energia + "\n" +
      "Inteligencia:   " + atributos.inteligencia + "\n" +
      "Resistencia:    " + atributos.resistencia + "\n" +
      "Liderazgo:      " + atributos.liderazgo + "\n" +
      "Precisión:      " + atributos.precision + "\n" +
      "Ambición:       " + atributos.ambicion + "\n\n" +
      "FOTO DEL CLIENTE: " + driveUrl + "\n\n" +
      "URL VERIFICACIÓN: \n" + verifyUrl + "\n\n" +
      "COMENTARIOS: " + (data.comentarios ? data.comentarios : 'Ninguno') + "\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━";

    MailApp.sendEmail({
      to: CONFIG.EMAIL_DESTINO,
      subject: asuntoAuditoria,
      body: cuerpoAuditoria,
      attachments: attachments
    });

    // ENVIAR CORREO DE CONFIRMACIÓN AL CLIENTE
    var asuntoCliente = "LEGADO Cards — Tu solicitud fue recibida ✅";
    var cuerpoCliente = 
      "Hola " + data.nombre + ",\n\n" +
      "Tu solicitud fue recibida exitosamente.\n\n" +
      "Tu número de referencia es: " + cardId + "\n\n" +
      "En menos de 12 horas recibirás tu carta digital directamente en este correo.\n\n" +
      "Para consultas escríbenos:\n" +
      "📱 WhatsApp: +51989481296\n" +
      "📧 legadocards@gmail.com\n" +
      "📸 @legadocards\n\n" +
      "— El equipo de LEGADO";

    MailApp.sendEmail({
      to: data.email,
      subject: asuntoCliente,
      body: cuerpoCliente
    });

    // Retornar respuesta exitosa al frontend
    return responseJson({
      success: true,
      cardId: cardId,
      noCarta: noCarta,
      rareza: rareza,
      ovr: ovr,
      atributos: atributos,
      verifyUrl: verifyUrl
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
      fecha: cardData[13]
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
   INITIALIZE SHEET (DATOS SEMILLA)
   ========================================== */
function inicializarSheet() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  // Si la pestaña no existe, la crea
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  } else {
    sheet.clear();
  }

  // Escribir cabeceras oficiales
  var headers = [
    "ID", "N° Carta", "Rareza", "OVR", 
    "Energía", "Inteligencia", "Resistencia", "Liderazgo", "Precisión", "Ambición", 
    "Vendida", "Nombre cliente", "País", "Fecha venta", "Ingresos", "Acumulado"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Generar datos semilla: 100 cartas pre-diseñadas disponibles para la Founders Edition
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
    
    // Determinar rareza según probabilidades (40% Bronce, 30% Plata, 20% Oro, 8% Elite, 2% Leyenda)
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
    
    // Atributos numéricos de rendimiento aleatorios
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
      ""  // Acumulado (vacía)
    ]);
  }

  // Escribir los datos semilla en la hoja
  sheet.getRange(2, 1, dataSemilla.length, headers.length).setValues(dataSemilla);
  Logger.log("Hoja de cálculo inicializada con éxito y 100 cartas semilla.");
}
