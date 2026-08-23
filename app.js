let currentLang = 'de';
let mediaStream = null;
let categoryData = {};
let currentExplorerPath = "";

const translations = {
  de: {
    pinTitle: "PIN-Eingabe", loginBtn: "Anmelden", menuUpload: "Dokumente hochladen",
    menuExplore: "Dokumente durchsuchen", uploadHeader: "Dokument hochladen oder scannen",
    catLabel: "Kategorie:", subCatLabel: "Unterkategorie:", newCatBtn: "+ Neue Kategorie / Unterkategorie",
    customNameLabel: "Dateiname (Optional):", uploadFileBtn: "Datei hochladen", useCameraBtn: "Kamera benutzen",
    captureBtn: "Foto machen", saveBtn: "Speichern", closeBtn: "Schließen", exploreHeader: "Dokumente durchsuchen",
    createCatTitle: "Neue Kategorie / Unterkategorie", printBtn: "Drucken", viewBtn: "Anzeigen", emailBtn: "E-Mail",
    upBtn: "Nach oben", rootFolder: "Hauptverzeichnis", selectParentCat: "Bestehende Kategorie wählen:",
    newMainCatLabel: "Neue Hauptkategorie:"
  },
  es: {
    pinTitle: "Ingrese Clave", loginBtn: "Ingresar", menuUpload: "Subir documentos",
    menuExplore: "Explorar documentos", uploadHeader: "Subir o escanear documento",
    catLabel: "Categoría:", subCatLabel: "Subcategoría:", newCatBtn: "+ Nueva Categoría / Subcategoría",
    customNameLabel: "Nombre de archivo (Opcional):", uploadFileBtn: "Subir Archivo", useCameraBtn: "Usar Cámara",
    captureBtn: "Tomar Foto", saveBtn: "Guardar", closeBtn: "Cerrar", exploreHeader: "Explorar documentos",
    createCatTitle: "Nueva Categoría / Subcategoría", printBtn: "Imprimir", viewBtn: "Ver", emailBtn: "Correo",
    upBtn: "Subir nivel", rootFolder: "Directorio Principal", selectParentCat: "Seleccionar categoría existente:",
    newMainCatLabel: "Nueva categoría principal:"
  }
};

function verifyPin() {
  if (document.getElementById("pin-input").value === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    loadCategories();
  } else {
    document.getElementById("pin-error").innerText = currentLang === 'de' ? "Falscher PIN" : "PIN Incorrecto";
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'de' ? 'es' : 'de';
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
  });
  renderBreadcrumbs();
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  if(viewId === 'explore-view') loadExplorerPath(currentExplorerPath);
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    categoryData = await res.json();
    
    const catSelect = document.getElementById("cat-select");
    const modalParentSelect = document.getElementById("modal-parent-cat");
    
    catSelect.innerHTML = "";
    modalParentSelect.innerHTML = `<option value="">-- ${translations[currentLang].newMainCatLabel} --</option>`;

    Object.keys(categoryData).sort().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.innerText = cat;
      catSelect.appendChild(opt);

      const modalOpt = document.createElement("option");
      modalOpt.value = cat;
      modalOpt.innerText = cat;
      modalParentSelect.appendChild(modalOpt);
    });
    handleCatChange();
  } catch (err) {
    alert("Error conectando con el servidor");
  }
}

function handleCatChange() {
  const selectedCat = document.getElementById("cat-select").value;
  const subSelect = document.getElementById("subcat-select");
  subSelect.innerHTML = "<option value=''>-- Keine / Ninguna --</option>";
  if (categoryData[selectedCat] && categoryData[selectedCat].length > 0) {
    categoryData[selectedCat].forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub; 
      opt.innerText = sub;
      subSelect.appendChild(opt);
    });
  }
}

function toggleModalCatInput() {
  const selected = document.getElementById("modal-parent-cat").value;
  const mainCatField = document.getElementById("new-main-cat-field");
  if (selected) {
    mainCatField.classList.add("hidden");
  } else {
    mainCatField.classList.remove("hidden");
  }
}

async function uploadSelectedFile() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput.files.length) {
    alert(currentLang === 'de' ? "Bitte wählen Sie eine Datei aus." : "Por favor seleccione un archivo.");
    return;
  }
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("category", document.getElementById("cat-select").value);
  formData.append("subcategory", document.getElementById("subcat-select").value);
  formData.append("custom_name", document.getElementById("custom-name-input").value);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (res.ok) {
    alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado con éxito!");
    fileInput.value = "";
    document.getElementById("custom-name-input").value = "";
  } else {
    alert("Error al guardar archivo.");
  }
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
    });
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    video.srcObject = mediaStream;
    video.classList.remove("hidden");
    canvas.classList.add("hidden");
    document.getElementById("camera-modal").classList.remove("hidden");
  } catch (err) {
    alert("Kamera konnte nicht geöffnet werden / No se pudo acceder a la cámara");
  }
}

function capturePhoto() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const w = video.videoWidth || video.clientWidth || 640;
  const h = video.videoHeight || video.clientHeight || 480;
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(video, 0, 0, w, h);
  video.classList.add("hidden");
  canvas.classList.remove("hidden");
}

async function saveCapture() {
  const canvas = document.getElementById("canvas");
  if (canvas.width === 0 || canvas.classList.contains("hidden")) capturePhoto();
  
  const format = document.getElementById("format-select").value;
  let blob;
  
  if (format === "pdf") {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
    blob = pdf.output("blob");
  } else {
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    blob = await new Promise(r => canvas.toBlob(r, mime, 0.95));
  }

  const customName = document.getElementById("cam-custom-name").value;
  const formData = new FormData();
  formData.append("file", blob, `scan_${Date.now()}.${format}`);
  formData.append("category", document.getElementById("cat-select").value);
  formData.append("subcategory", document.getElementById("subcat-select").value);
  formData.append("custom_name", customName);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (res.ok) {
    stopCamera();
    document.getElementById("cam-custom-name").value = "";
    alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado!");
  } else {
    alert("Error guardando el escaneo.");
  }
}

function stopCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  document.getElementById("camera-modal").classList.add("hidden");
}

async function loadExplorerPath(path = "") {
  currentExplorerPath = path;
  renderBreadcrumbs();

  const res = await fetch(`/api/explorer?path=${encodeURIComponent(path)}`);
  const data = await res.json();
  const grid = document.getElementById("explorer-grid");
  grid.innerHTML = "";

  if (!data.items || data.items.length === 0) {
    grid.innerHTML = `<p class="empty-msg">${currentLang === 'de' ? 'Ordner ist leer' : 'La carpeta está vacía'}</p>`;
    return;
  }

  data.items.forEach(item => {
    const card = document.createElement("div");
    card.className = item.isDir ? "explorer-card folder-card" : "explorer-card file-card";
    
    if (item.isDir) {
      card.innerHTML = `
        <div class="icon">📁</div>
        <div class="name">${item.name}</div>
      `;
      card.onclick = () => loadExplorerPath(item.path);
    } else {
      const fileUrl = `/api/file/${encodeURIComponent(item.path)}`;
      const absoluteUrl = `${window.location.origin}${fileUrl}`;
      
      card.innerHTML = `
        <div class="icon">📄</div>
        <div class="name" title="${item.name}">${item.name}</div>
        <div class="card-actions">
          <button onclick="window.open('${fileUrl}')">${translations[currentLang].viewBtn}</button>
          <button onclick="printDoc('${fileUrl}')">${translations[currentLang].printBtn}</button>
          <button onclick="sendEmail('${item.name}', '${absoluteUrl}')">${translations[currentLang].emailBtn}</button>
        </div>
      `;
    }
    grid.appendChild(card);
  });
}

function renderBreadcrumbs() {
  const container = document.getElementById("breadcrumbs");
  const backBtn = document.getElementById("back-btn");
  
  if (!currentExplorerPath) {
    container.innerHTML = `<span>📂 ${translations[currentLang].rootFolder}</span>`;
    backBtn.disabled = true;
    return;
  }

  backBtn.disabled = false;
  const parts = currentExplorerPath.split("/");
  let accPath = "";
  
  let html = `<a onclick="loadExplorerPath('')">📂 ${translations[currentLang].rootFolder}</a>`;
  parts.forEach((p, index) => {
    accPath += (index === 0 ? "" : "/") + p;
    const isLast = index === parts.length - 1;
    if (isLast) {
      html += ` / <span>${p}</span>`;
    } else {
      const target = accPath;
      html += ` / <a onclick="loadExplorerPath('${target}')">${p}</a>`;
    }
  });
  container.innerHTML = html;
}

function navigateUp() {
  if (!currentExplorerPath) return;
  const parts = currentExplorerPath.split("/");
  parts.pop();
  loadExplorerPath(parts.join("/"));
}

function sendEmail(fileName, fileUrl) {
  const subject = encodeURIComponent(`Dokument: ${fileName}`);
  const body = encodeURIComponent(`Hallo,

anbei befindet sich der Link zum Dokument "${fileName}":

${fileUrl}

Viele Grüße`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function printDoc(url) {
  const win = window.open(url, '_blank');
  win.onload = () => win.print();
}

function openCategoryModal() {
  document.getElementById("modal-parent-cat").value = "";
  toggleModalCatInput();
  document.getElementById("new-cat-modal").classList.remove("hidden");
}
function closeCategoryModal() { document.getElementById("new-cat-modal").classList.add("hidden"); }

async function createNewCategory() {
  const selectedParent = document.getElementById("modal-parent-cat").value;
  const catInput = document.getElementById("new-cat-input").value;
  const subInput = document.getElementById("new-subcat-input").value;

  let mainCat = selectedParent ? selectedParent : catInput;

  if (!mainCat) {
    alert(currentLang === 'de' ? "Bitte Hauptkategorie angeben" : "Ingrese una categoría principal");
    return;
  }

  const formData = new FormData();
  formData.append("category", mainCat);
  if (subInput) formData.append("subcategory", subInput);

  const res = await fetch("/api/categories", { method: "POST", body: formData });
  if (res.ok) {
    closeCategoryModal();
    document.getElementById("new-cat-input").value = "";
    document.getElementById("new-subcat-input").value = "";
    loadCategories();
  } else {
    alert("Error al crear la categoría.");
  }
}
