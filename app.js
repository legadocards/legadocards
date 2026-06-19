/* ==========================================================================
   INTERACTIVE LOGIC - LEGADO CARDS
   ========================================================================== */

// Configuración global (fácilmente editable por el cliente)
const CONFIG = {
  whatsappNumber: "51989481296",
  emailDestino: "legadocards@gmail.com",
  appsScriptURL: "https://script.google.com/macros/s/AKfycbzXB7uLMGqWhzlmgN-zlstu0JIJIAW7xwTHZ6P6Z3cztVvy27p0eckLU6fyxYqnw1DR/exec", // URL de la Web App de Google Apps Script
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
  const packageSelect = document.getElementById("paquete");
  const dynamicContainer = document.getElementById("dynamicPlayersContainer");
  
  if (!form) return;

  // Determinar cantidad de jugadores según el paquete
  function getPlayerCount(packageName) {
    if (!packageName) return 1;
    const name = packageName.toLowerCase();
    if (name.includes("dupla")) return 2;
    if (name.includes("4p") || name.includes("4 personas") || name.includes("4 persona")) return 4;
    if (name.includes("5p") || name.includes("5 personas") || name.includes("5 persona") || name.includes("familia 5")) return 5;
    if (name.includes("7p") || name.includes("7 personas") || name.includes("7 persona")) return 7;
    if (name.includes("11p") || name.includes("11 personas") || name.includes("11 persona") || name.includes("equipo 11") || name.includes("equipo fundador")) return 11;
    return 1;
  }

  // Generar dinámicamente los bloques del formulario por jugador
  function renderPlayerFields() {
    if (!packageSelect || !dynamicContainer) return;
    const qty = getPlayerCount(packageSelect.value);
    dynamicContainer.innerHTML = "";

    for (let i = 1; i <= qty; i++) {
      const playerBlock = document.createElement("div");
      playerBlock.className = "player-block-card";
      playerBlock.style.border = "1px solid var(--card-border)";
      playerBlock.style.padding = "24px";
      playerBlock.style.borderRadius = "8px";
      playerBlock.style.marginBottom = "24px";
      playerBlock.style.background = "rgba(255, 255, 255, 0.01)";

      playerBlock.innerHTML = `
        <h4 style="color: var(--gold-brand); font-family: var(--font-title); font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; border-bottom: 1px solid rgba(188, 151, 72, 0.15); padding-bottom: 8px;">Datos del Jugador #${i}</h4>
        
        <div class="form-row-2">
          <div class="form-group">
            <label for="p${i}_nombre">Nombre Completo *</label>
            <input type="text" id="p${i}_nombre" class="form-control player-nombre" placeholder="Ej. Carlos Gutiérrez" required>
          </div>
          
          <div class="form-group">
            <label for="p${i}_rol">Posición / Relación *</label>
            <input type="text" id="p${i}_rol" class="form-control player-rol" placeholder="Ej. DELANTERO, PAPÁ, CAPITÁN" required maxlength="20">
          </div>
        </div>

        <div class="form-row-2" style="margin-top: 15px;">
          <div class="form-group">
            <label for="p${i}_fecha">Fecha de Nacimiento (Opcional)</label>
            <input type="date" id="p${i}_fecha" class="form-control player-fecha">
          </div>

          <div class="form-group">
            <label for="p${i}_pais">País Representado *</label>
            <select id="p${i}_pais" class="form-control player-pais" required>
              <option value="" disabled selected>Selecciona su país</option>
              <option value="Perú">Perú 🇵🇪</option>
              <option value="Argentina">Argentina 🇦🇷</option>
              <option value="Brasil">Brasil 🇧🇷</option>
              <option value="Colombia">Colombia 🇨🇴</option>
              <option value="México">México 🇲🇽</option>
              <option value="Chile">Chile 🇨🇱</option>
              <option value="Ecuador">Ecuador 🇪🇨</option>
              <option value="España">España 🇪🇸</option>
              <option value="Estados Unidos">Estados Unidos 🇺🇸</option>
              <option value="Otro">Otro País</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-top: 15px;">
          <label for="p${i}_historia">Historia o Descripción (Opcional)</label>
          <textarea id="p${i}_historia" class="form-control player-historia" placeholder="Ej. Breve descripción de sus logros o datos curiosos..." style="height: 70px; resize: vertical;"></textarea>
        </div>

        <div class="form-group" style="margin-top: 15px;">
          <label>Sube su Fotografía de Perfil *</label>
          <div class="upload-box" id="p${i}_uploadBox" style="position: relative; cursor: pointer;">
            <span class="upload-icon" style="font-size: 24px;">📷</span>
            <p id="p${i}_uploadText" style="font-size: 12px; margin-top: 4px;">Haz clic para subir la foto del Jugador #${i}</p>
            <input type="file" id="p${i}_foto" class="file-input player-foto" accept="image/*" required style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
          </div>
          <div class="preview-container" id="p${i}_previewContainer" style="display: none; margin-top: 12px; text-align: center;">
            <img src="#" alt="Vista previa de foto ${i}" class="img-preview" id="p${i}_previewFoto" style="max-height: 120px; border-radius: 4px; border: 1px solid var(--gold-brand); display: inline-block;">
          </div>
        </div>
      `;

      dynamicContainer.appendChild(playerBlock);

      const fileInput = playerBlock.querySelector(`#p${i}_foto`);
      const previewContainer = playerBlock.querySelector(`#p${i}_previewContainer`);
      const previewFoto = playerBlock.querySelector(`#p${i}_previewFoto`);
      const uploadText = playerBlock.querySelector(`#p${i}_uploadText`);

      fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            previewFoto.src = e.target.result;
            previewContainer.style.display = "block";
            uploadText.textContent = "✓ Foto cargada con éxito";
            uploadText.style.color = "#00E676";
          };
          reader.readAsDataURL(file);
        } else {
          previewContainer.style.display = "none";
          uploadText.textContent = `Haz clic para subir la foto del Jugador #${i}`;
          uploadText.style.color = "";
        }
      });
    }
  }

  // Escuchar cambios en selector y botón de pre-seleccionar
  if (packageSelect) {
    packageSelect.addEventListener("change", renderPlayerFields);
  }

  window.seleccionarPaquete = function(packageName) {
    const selector = document.getElementById("paquete");
    if (selector) {
      selector.value = packageName;
      selector.dispatchEvent(new Event("change"));
      const formSection = document.getElementById("formulario");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Inicializar 1 jugador por defecto
  renderPlayerFields();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const compradorNombre = document.getElementById("contactoNombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    const paquete = document.getElementById("paquete").value;
    const comentarios = document.getElementById("comentarios").value.trim();
    const comprobanteFile = document.getElementById("comprobante").files[0];

    const activePaymentBtn = document.querySelector(".payment-sel-btn.active");
    const metodoPago = activePaymentBtn ? activePaymentBtn.dataset.method.toUpperCase() : "NO ESPECIFICADO";

    if (!compradorNombre || !email || !whatsapp || !paquete || !comprobanteFile) {
      alert("Por favor, completa todos los campos obligatorios y sube el comprobante de pago.");
      return;
    }

    const qty = getPlayerCount(paquete);
    const jugadores = [];

    // Recopilar datos de cada jugador
    for (let i = 1; i <= qty; i++) {
      const nombreEl = document.getElementById(`p${i}_nombre`);
      const rolEl = document.getElementById(`p${i}_rol`);
      const fechaEl = document.getElementById(`p${i}_fecha`);
      const paisEl = document.getElementById(`p${i}_pais`);
      const historiaEl = document.getElementById(`p${i}_historia`);
      const fotoEl = document.getElementById(`p${i}_foto`);

      if (!nombreEl || !rolEl || !paisEl || !fotoEl || !fotoEl.files[0]) {
        alert(`Por favor, completa los datos y sube la foto para el Jugador #${i}.`);
        return;
      }

      const fotoFile = fotoEl.files[0];
      const base64Foto = await fileToBase64(fotoFile);

      jugadores.push({
        nombre: nombreEl.value.trim(),
        rol: rolEl.value.trim(),
        fechaNacimiento: fechaEl ? fechaEl.value : "",
        pais: paisEl.value,
        historia: historiaEl ? historiaEl.value.trim() : "",
        fotoBase64: base64Foto,
        fotoName: fotoFile.name
      });
    }

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "ENVIANDO DATOS...";
    submitBtn.disabled = true;

    try {
      if (!CONFIG.appsScriptURL) {
        console.warn("Apps Script URL no configurada. Ejecutando fallback mailto.");
        alert("Enlace con el servidor no configurado. Se abrirá tu correo para registrar la solicitud de cartas manualmente.");
        ejecutarFallbackMailto({ compradorNombre, email, whatsapp, paquete, metodoPago, comentarios, jugadores });
        return;
      }

      const comprobanteBase64 = await fileToBase64(comprobanteFile);

      const payload = {
        compradorNombre,
        email,
        whatsapp,
        paquete,
        metodoPago,
        comentarios,
        comprobanteBase64,
        comprobanteName: comprobanteFile.name,
        jugadores: jugadores
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
        const cartas = data.cartas;
        
        // Cargar dinámicamente cada tarjeta y QR en el modal
        const modalCardsContainer = document.getElementById("modalCardsContainer");
        if (modalCardsContainer) {
          modalCardsContainer.innerHTML = "";
          
          cartas.forEach((carta, idx) => {
            const cardBlock = document.createElement("div");
            cardBlock.style.borderBottom = "1px solid rgba(188, 151, 72, 0.15)";
            cardBlock.style.paddingBottom = "20px";
            cardBlock.style.marginBottom = "15px";
            
            const qrCanvasId = `qrCanvas_${idx}`;
            const downloadBtnId = `downloadQR_${idx}`;
            
            cardBlock.innerHTML = `
              <div style="font-family: var(--font-title); font-size: 11px; font-weight: 800; color: var(--gold-brand); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                CARTA #${idx+1} — ${carta.nombreJugador}
              </div>
              <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                <div>
                  <div class="modal-card-id" style="font-size: 15px; padding: 6px 12px; margin-bottom: 0;">${carta.cardId}</div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; font-weight: 700;">
                    RAREZA: <span style="color: var(--gold-brand);">${carta.rareza}</span> | OVR: ${carta.ovr}
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <div id="${qrCanvasId}" style="background: #FFF; padding: 8px; border-radius: 4px; border: 1px solid var(--gold-brand); display: inline-block;"></div>
                  <a id="${downloadBtnId}" href="#" download="QR_${carta.cardId}.png" style="font-family: var(--font-title); font-size: 10px; font-weight: 800; letter-spacing: 0.5px; color: var(--gold-brand); text-decoration: underline; text-transform: uppercase;">Descargar QR</a>
                </div>
              </div>
            `;
            
            modalCardsContainer.appendChild(cardBlock);
            
            // Generar el QR localmente
            setTimeout(() => {
              const canvasEl = document.getElementById(qrCanvasId);
              if (canvasEl) {
                new QRCode(canvasEl, {
                  text: carta.verifyUrl,
                  width: 100,
                  height: 100,
                  colorDark: "#000000",
                  colorLight: "#ffffff",
                  correctLevel: QRCode.CorrectLevel.H
                });
                
                // Habilitar descarga
                setTimeout(() => {
                  const qrImg = canvasEl.querySelector("img");
                  const qrCanvas = canvasEl.querySelector("canvas");
                  let downloadUrl = "";
                  if (qrImg && qrImg.src) {
                    downloadUrl = qrImg.src;
                  } else if (qrCanvas) {
                    downloadUrl = qrCanvas.toDataURL("image/png");
                  }
                  const downloadBtn = document.getElementById(downloadBtnId);
                  if (downloadBtn && downloadUrl) {
                    downloadBtn.href = downloadUrl;
                  }
                }, 350);
              }
            }, 50);
          });
        }

        // WhatsApp
        const idsList = cartas.map(c => c.cardId).join(", ");
        const wppMessage = `Hola LEGADO, acabo de registrarme. Mis IDs asignados son: ${idsList} y mi paquete es ${paquete}`;
        const encodedMessage = encodeURIComponent(wppMessage);
        const wppUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

        const modalWhatsappBtn = document.getElementById("modalWhatsappBtn");
        if (modalWhatsappBtn) {
          modalWhatsappBtn.href = wppUrl;
        }

        if (modal) {
          modal.classList.add("active");
        }

        if (closeModalBtn) {
          closeModalBtn.onclick = () => {
            modal.classList.remove("active");
            form.reset();
            renderPlayerFields();
            document.getElementById("previewComprobanteContainer").style.display = "none";
            document.querySelectorAll(".payment-sel-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".payment-detail-box").forEach(box => box.classList.remove("active"));
          };
        }

      } else {
        if (data.message && data.message.includes("completa")) {
          alert("La colección está completa o no quedan suficientes cartas fundadoras libres.");
        } else {
          alert("Error: " + (data.message || "No se pudo procesar tu solicitud en este momento."));
          ejecutarFallbackMailto({ compradorNombre, email, whatsapp, paquete, metodoPago, comentarios, jugadores });
        }
      }

    } catch (error) {
      console.error("Error en el envío del formulario:", error);
      alert("Hubo un problema de conexión al procesar tu registro. Abriremos tu correo para enviar los datos directamente.");
      ejecutarFallbackMailto({ compradorNombre, email, whatsapp, paquete, metodoPago, comentarios, jugadores });
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
  const asunto = `[LEGADO] Solicitud de Pack - ${datos.compradorNombre}`;
  
  const hoy = new Date();
  const dateString = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  
  let jugadoresTexto = "";
  datos.jugadores.forEach((jugador, idx) => {
    jugadoresTexto += `\nJUGADOR #${idx + 1}\n` +
                      `- Nombre:       ${jugador.nombre}\n` +
                      `- Posición:     ${jugador.rol}\n` +
                      `- Nacimiento:   ${jugador.fechaNacimiento ? jugador.fechaNacimiento : "No especificada"}\n` +
                      `- País:         ${jugador.pais}\n` +
                      `- Historia:     ${jugador.historia ? jugador.historia : "Ninguna"}\n`;
  });

  const cuerpo = 
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `NUEVA VENTA LEGADO CARDS (FALLBACK OFFLINE)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `COMPRADOR / CONTACTO\n` +
    `Nombre:       ${datos.compradorNombre}\n` +
    `Email:        ${datos.email}\n` +
    `WhatsApp:     ${datos.whatsapp}\n` +
    `Paquete:      ${datos.paquete}\n` +
    `Método de Pago: ${datos.metodoPago}\n` +
    `Fecha:        ${dateString}\n` +
    `COMENTARIOS: ${datos.comentarios ? datos.comentarios : 'Ninguno'}\n` +
    `\nINTEGRANTES DEL PACK:${jugadoresTexto}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Nota: Por favor, adjunte manualmente las FOTOS DE TODOS LOS JUGADORES y el COMPROBANTE DE PAGO a este correo.`;

  const mailtoUrl = `mailto:${emailDestino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.open(mailtoUrl, "_self");
}
