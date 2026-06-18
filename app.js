/* ==========================================================================
   INTERACTIVE LOGIC - LEGADO CARDS
   ========================================================================== */

// Configuración global (fácilmente editable por el cliente)
const CONFIG = {
  whatsappNumber: "51989481296",
  emailDestino: "legadocards@gmail.com",
  appsScriptURL: "", // URL de la Web App de Google Apps Script
  baseUrl: "https://legadocards.vercel.app", // URL base configurable para QR y verify
  cartasEmitidas: 17,
  totalCartas: 2026,
  earlyBirdRestantes: 83,
  rarezasEmitidas: {
    bronce: 8,
    plata: 5,
    oro: 3,
    elite: 1,
    leyenda: 0
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Inicializaciones
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initHeroParticles();
  initCard3DTilt();
  initAnimatedCounters();
  initPackageTabs();
  initFAQAccordion();
  initPaymentSelector();
  initFormUploadPreviews();
  initFormSubmission();
});

/* ==========================================================================
   THEME TOGGLE (LIGHT / DARK MODE)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  // Cargar preferencia guardada o por defecto oscuro
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const currentTheme = document.body.classList.contains("light-theme") ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
  });
}

/* ==========================================================================
   MOBILE MENU
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      
      const spans = menuToggle.querySelectorAll("span");
      if (navLinks.classList.contains("active")) {
        spans[0].style.transform = "rotate(45deg) translate(6px, 6px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
      } else {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      }
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        const spans = menuToggle.querySelectorAll("span");
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      });
    });
  }
}

/* ==========================================================================
   SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(".reveal");
  
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("visible"));
  }
}

/* ==========================================================================
   HERO CANVAS PARTICLES (GOLD DUST)
   ========================================================================== */
function initHeroParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particlesArray = [];
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  window.addEventListener("resize", () => {
    if (!canvas) return;
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = Math.random() * 0.7 + 0.2;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.opacity = Math.random() * 0.5 + 0.15;
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;

      if (this.y < 0 || this.opacity <= 0) {
        this.reset();
      }
    }

    draw() {
      // Usar color dorado marca
      ctx.fillStyle = `rgba(188, 151, 72, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.shadowBlur = this.size * 1.5;
      ctx.shadowColor = "#BC9748";
      ctx.fill();
    }
  }

  const maxParticles = window.innerWidth < 768 ? 30 : 80;
  for (let i = 0; i < maxParticles; i++) {
    particlesArray.push(new Particle());
  }

  function animate() {
    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, width, height);

    particlesArray.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!prefersReduced.matches) {
    animate();
  }
}

/* ==========================================================================
   ADVANCED 3D CARD TILT & HOLOGRAPHIC SHIMMER
   ========================================================================== */
function initCard3DTilt() {
  const cards = document.querySelectorAll(".card-3d");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Asignar delays aleatorios a la animación de flotación para que no floten en paralelo
  document.querySelectorAll(".card-3d-container").forEach((container, idx) => {
    container.style.setProperty("--float-delay", `${idx * -1.2}s`);
  });

  if (prefersReduced.matches) return;

  cards.forEach(card => {
    let mobileInterval = null;
    let angleCycle = 0;

    // Desktop: Inclinación 3D e iluminación dinámica con el cursor
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Rotaciones en base a la posición del puntero (-18 a +18 grados)
      const rX = ((y / rect.height) - 0.5) * -36;
      const rY = ((x / rect.width) - 0.5) * 36;

      // Coordenadas en porcentaje
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;

      // Calcular ángulo dinámico del brillo en base a las coordenadas relativas al centro
      const dx = x - rect.width / 2;
      const dy = y - rect.height / 2;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      card.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.05, 1.05, 1.05)`;
      card.style.setProperty("--x", `${px}%`);
      card.style.setProperty("--y", `${py}%`);
      card.style.setProperty("--angle", `${angle}deg`);
      card.style.setProperty("--opacity", "1");
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      card.style.setProperty("--opacity", "0");
      card.style.transition = "transform 0.5s ease-out, box-shadow 0.5s ease-out";
    });

    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.1s ease-out";
    });

    // Mobile: Animación automática al dar tap
    card.addEventListener("click", () => {
      if (window.innerWidth >= 1024) return; // solo en mobile

      // Si ya está corriendo, la apagamos
      if (mobileInterval) {
        clearInterval(mobileInterval);
        mobileInterval = null;
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        card.style.setProperty("--opacity", "0");
        card.style.transition = "transform 0.5s ease-out";
        return;
      }

      // Detener otros loops activos en otras cartas
      document.querySelectorAll(".card-3d").forEach(c => {
        c.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        c.style.setProperty("--opacity", "0");
      });

      card.style.transition = "transform 0.2s ease-out";
      card.style.setProperty("--opacity", "0.95");

      // Loop de oscilación automática
      mobileInterval = setInterval(() => {
        angleCycle += 0.1;
        const tiltX = Math.sin(angleCycle) * 14;
        const tiltY = Math.cos(angleCycle) * 14;
        const shimX = 50 + Math.sin(angleCycle) * 40;
        const shimY = 50 + Math.cos(angleCycle) * 40;
        const angle = angleCycle * (180 / Math.PI);

        card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;
        card.style.setProperty("--x", `${shimX}%`);
        card.style.setProperty("--y", `${shimY}%`);
        card.style.setProperty("--angle", `${angle}deg`);
      }, 30);

      // Desactivar automáticamente tras 5 segundos para ahorrar batería
      setTimeout(() => {
        if (mobileInterval) {
          clearInterval(mobileInterval);
          mobileInterval = null;
          card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
          card.style.setProperty("--opacity", "0");
          card.style.transition = "transform 0.5s ease-out";
        }
      }, 5000);
    });
  });
}

/* ==========================================================================
   ANIMATED COUNTERS & SCARCITY BAR
   ========================================================================== */
function initAnimatedCounters() {
  const registeredSpan = document.getElementById("registeredCount");
  const remainingSpan = document.getElementById("remainingCount");
  const progressBarFill = document.getElementById("progressBarFill");
  
  if (registeredSpan) registeredSpan.textContent = CONFIG.cartasEmitidas;
  if (remainingSpan) remainingSpan.textContent = (CONFIG.totalCartas - CONFIG.cartasEmitidas).toLocaleString("en-US");
  
  if (progressBarFill) {
    const percentage = (CONFIG.cartasEmitidas / CONFIG.totalCartas) * 100;
    setTimeout(() => {
      progressBarFill.style.width = `${percentage}%`;
    }, 400);
  }

  const rarezasIdMap = {
    "count-bronce": CONFIG.rarezasEmitidas.bronce,
    "count-plata": CONFIG.rarezasEmitidas.plata,
    "count-oro": CONFIG.rarezasEmitidas.oro,
    "count-elite": CONFIG.rarezasEmitidas.elite,
    "count-leyenda": CONFIG.rarezasEmitidas.leyenda
  };

  Object.keys(rarezasIdMap).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = rarezasIdMap[id];
    }
  });

  const ebRemaining = document.getElementById("ebRemaining");
  if (ebRemaining) {
    ebRemaining.textContent = CONFIG.earlyBirdRestantes;
  }
}

/* ==========================================================================
   PACKAGE TABS
   ========================================================================== */
function initPackageTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
      });

      tab.classList.add("active");

      const targetPane = document.getElementById(target);
      if (targetPane) {
        targetPane.style.display = "grid";
        setTimeout(() => {
          targetPane.classList.add("active");
        }, 50);
      }
    });
  });
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFAQAccordion() {
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach(q => {
    q.addEventListener("click", () => {
      const item = q.parentElement;
      const isActive = item.classList.contains("active");

      document.querySelectorAll(".faq-item").forEach(i => {
        if (i !== item) {
          i.classList.remove("active");
        }
      });

      item.classList.toggle("active");
    });
  });
}

/* ==========================================================================
   INTERACTIVE PAYMENT METHOD SELECTOR
   ========================================================================== */
function initPaymentSelector() {
  const paymentButtons = document.querySelectorAll(".payment-sel-btn");
  const detailBoxes = document.querySelectorAll(".payment-detail-box");
  const copyButtons = document.querySelectorAll(".copy-btn");

  paymentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetMethod = btn.dataset.method;

      // Desactivar botones y cajas
      paymentButtons.forEach(b => b.classList.remove("active"));
      detailBoxes.forEach(box => box.classList.remove("active"));

      // Activar botón actual y caja de detalles correspondientes
      btn.classList.add("active");
      const targetBox = document.getElementById(`pay-${targetMethod}`);
      if (targetBox) {
        targetBox.classList.add("active");
      }
    });
  });

  // Funcionalidad para botones Copiar CCI / Cuenta
  copyButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const textToCopy = btn.dataset.copy;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = "¡COPIADO!";
          btn.style.background = "var(--gold-brand)";
          btn.style.color = "#000";
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "none";
            btn.style.color = "var(--gold-brand)";
          }, 2000);
        }).catch(err => {
          console.error("Error al copiar texto: ", err);
        });
      } else {
        // Fallback para navegadores que bloqueen API de portapapeles sin HTTPS
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        
        const originalText = btn.textContent;
        btn.textContent = "¡COPIADO!";
        setTimeout(() => btn.textContent = originalText, 2000);
      }
    });
  });
}

/* ==========================================================================
   IMAGE UPLOAD PREVIEWS
   ========================================================================== */
function initFormUploadPreviews() {
  setupPreview("foto", "previewFotoContainer", "previewFoto");
  setupPreview("comprobante", "previewComprobanteContainer", "previewComprobante");
}

function setupPreview(inputId, containerId, imageId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  const image = document.getElementById(imageId);

  if (input && container && image) {
    input.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          image.src = e.target.result;
          container.style.display = "flex";
        };
        reader.readAsDataURL(file);
      } else {
        container.style.display = "none";
      }
    });
  }
}

/* ==========================================================================
   FORM SUBMISSION (GOOGLE APPS SCRIPT + WHATSAPP REDIRECTION)
   ========================================================================== */
function initFormSubmission() {
  const form = document.getElementById("legadoForm");
  const modal = document.getElementById("confirmacionModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  
  if (!form) return;

  window.seleccionarPaquete = function(packageName) {
    const selector = document.getElementById("paquete");
    if (selector) {
      selector.value = packageName;
      const formSection = document.getElementById("formulario");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    const pais = document.getElementById("pais").value;
    const paquete = document.getElementById("paquete").value;
    const rol = document.getElementById("rol").value.trim();
    const comentarios = document.getElementById("comentarios").value.trim();
    const fotoFile = document.getElementById("foto").files[0];
    const comprobanteFile = document.getElementById("comprobante").files[0];

    // Verificar si seleccionó método de pago
    const activePaymentBtn = document.querySelector(".payment-sel-btn.active");
    const metodoPago = activePaymentBtn ? activePaymentBtn.dataset.method.toUpperCase() : "NO ESPECIFICADO";

    if (!nombre || !email || !whatsapp || !pais || !paquete || !fotoFile || !comprobanteFile) {
      alert("Por favor, completa todos los campos obligatorios y sube las imágenes requeridas.");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "ENVIANDO DATOS...";
    submitBtn.disabled = true;

    try {
      if (!CONFIG.appsScriptURL) {
        // Fallback inmediato si no hay URL configurada
        console.warn("Apps Script URL no configurada. Ejecutando fallback mailto.");
        alert("Enlace con servidor no configurado. Se abrirá tu correo para registrar la solicitud manualmente.");
        ejecutarFallbackMailto({ nombre, email, whatsapp, pais, paquete, rol, metodoPago, comentarios });
        return;
      }

      // Convertir archivos a Base64
      const fotoBase64 = await fileToBase64(fotoFile);
      const comprobanteBase64 = await fileToBase64(comprobanteFile);

      // Crear objeto payload para evitar CORS preflight (OPTIONS request) enviándolo como simple text/plain
      const payload = {
        nombre,
        email,
        whatsapp,
        pais,
        paquete,
        rol,
        metodoPago,
        comentarios,
        fotoBase64,
        fotoName: fotoFile.name,
        comprobanteBase64,
        comprobanteName: comprobanteFile.name
      };

      const response = await fetch(CONFIG.appsScriptURL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta de la red (status: " + response.status + ")");
      }

      const data = await response.json();

      if (data.success) {
        // Asignación correcta
        const assignedCardId = data.cardId;
        const noCarta = data.noCarta;
        const rareza = data.rareza;
        const ovr = data.ovr;
        const verifyUrl = data.verifyUrl || `${CONFIG.baseUrl}/verify/${assignedCardId}`;

        // Mostrar ID en el modal
        const modalCardIdElement = document.getElementById("modalCardId");
        if (modalCardIdElement) {
          modalCardIdElement.textContent = assignedCardId;
        }

        // Generar código QR usando la librería local qrcode.js
        const canvasQR = document.getElementById("canvasQR");
        if (canvasQR) {
          canvasQR.innerHTML = "";
          new QRCode(canvasQR, {
            text: verifyUrl,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });

          // Configurar link de descarga del QR
          setTimeout(() => {
            const qrImg = canvasQR.querySelector("img");
            const qrCanvas = canvasQR.querySelector("canvas");
            let downloadUrl = "";
            if (qrImg && qrImg.src) {
              downloadUrl = qrImg.src;
            } else if (qrCanvas) {
              downloadUrl = qrCanvas.toDataURL("image/png");
            }
            const downloadBtn = document.getElementById("downloadQRBtn");
            if (downloadBtn && downloadUrl) {
              downloadBtn.href = downloadUrl;
              downloadBtn.download = `QR_${assignedCardId}.png`;
            }
          }, 400);
        }

        // Configurar enlace de WhatsApp en el modal
        const wppMessage = `Hola LEGADO, acabo de registrarme. Mi ID es ${assignedCardId} y mi paquete es ${paquete}`;
        const encodedMessage = encodeURIComponent(wppMessage);
        const wppUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

        const modalWhatsappBtn = document.getElementById("modalWhatsappBtn");
        if (modalWhatsappBtn) {
          modalWhatsappBtn.href = wppUrl;
        }

        // Activar modal
        if (modal) {
          modal.classList.add("active");
        }

        // Configurar comportamiento al cerrar el modal
        if (closeModalBtn) {
          closeModalBtn.onclick = () => {
            modal.classList.remove("active");
            form.reset();
            
            document.getElementById("previewFotoContainer").style.display = "none";
            document.getElementById("previewComprobanteContainer").style.display = "none";
            
            // Reset selector de pagos
            document.querySelectorAll(".payment-sel-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".payment-detail-box").forEach(box => box.classList.remove("active"));
          };
        }

      } else {
        // El script devolvió un error (ej: colección completa)
        if (data.message && data.message.includes("completa")) {
          alert("La colección está completa. No quedan cartas fundadoras disponibles.");
        } else {
          alert("Error: " + (data.message || "No se pudo procesar tu solicitud en este momento."));
          // Ejecutar el fallback de correo
          ejecutarFallbackMailto({ nombre, email, whatsapp, pais, paquete, rol, metodoPago, comentarios });
        }
      }

    } catch (error) {
      console.error("Error en el envío del formulario:", error);
      alert("Hubo un problema de conexión al procesar tu registro. Abriremos tu correo para enviar los datos directamente.");
      ejecutarFallbackMailto({ nombre, email, whatsapp, pais, paquete, rol, metodoPago, comentarios });
    } finally {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

function ejecutarFallbackMailto(datos) {
  const emailDestino = CONFIG.emailDestino || "legadocards@gmail.com";
  const asunto = `[LEGADO] Solicitud de Carta - ${datos.nombre}`;
  
  const hoy = new Date();
  const dateString = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  
  const cuerpo = 
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `NUEVA VENTA LEGADO CARDS (FALLBACK OFFLINE)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `CLIENTE\n` +
    `Nombre:       ${datos.nombre}\n` +
    `País:         ${datos.pais}\n` +
    `Rol/Apodo:    ${datos.rol ? datos.rol : 'Ninguno'}\n` +
    `Email:        ${datos.email}\n` +
    `WhatsApp:     ${datos.whatsapp}\n` +
    `Paquete:      ${datos.paquete}\n` +
    `Método de Pago: ${datos.metodoPago}\n` +
    `Fecha:        ${dateString}\n\n` +
    `COMENTARIOS: ${datos.comentarios ? datos.comentarios : 'Ninguno'}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Nota: Por favor, adjunte manualmente su FOTO DE PERFIL y el COMPROBANTE DE PAGO a este correo.`;

  const mailtoUrl = `mailto:${emailDestino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.open(mailtoUrl, "_self");
}
