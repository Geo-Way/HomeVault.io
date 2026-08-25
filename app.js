let currentLang = 'de';
let mediaStream = null;
let categoryData = {};
let currentExplorerPath = "";

// --- CONFIGURACIÓN BACKEND WEBDAV (NAS) ---
const WEBDAV_CONFIG = {
  baseUrl: "https://earlier-framing-event-unexpected.trycloudflare.com/Public",
  username: "admin",
  password: "@L3x1974"
};

const DEFAULT_CATEGORIES = [
  "Alexander Ariza", "Auto", "Benutzerdefinierte Office-Vorlagen", "Bewerbungsunterlagen Anja",
  "Caritas_HKP", "e-bike", "Elster", "Eltern", "Familie", "Fax", "Gehaltsnachweise",
  "Gescannte Dokumente", "Gesundheit Anja", "Hausfinanzierung", "Hausunterlagen", "Katze",
  "Laura Hyronimus", "Lohnsteuer", "Lucas Hyronimus", "Maria Heimsuchung", "Outlook-Dateien",
  "Polizei", "Rechnungen", "Rentenversicherung", "Schmerzklinik", "Schule - Kopie",
  "Tagesklinik", "Telekom", "Trennung", "Urlaub", "VDK", "Versicherungen Anja", "Zoom"
];

const translations = {
  de: {
    pinTitle: "PIN-Eingabe", loginBtn: "Anmelden", menuUpload: "Dokumente hochladen",
    menuExplore: "Dokumente durchsuchen", uploadHeader: "Dokument hochladen oder scannen",
    catLabel: "Kategorie:", subCatLabel: "Unterkategorie:", newCatBtn: "+ Neue Kategorie / Unterkategorie",
    customNameLabel: "Dateiname (Optional):", uploadFileBtn: "Datei hochladen", useCameraBtn: "Kamera benutzen",
    captureBtn: "Foto machen", saveBtn: "Speichern", closeBtn: "Schließen", exploreHeader: "Dokumente durchsuchen",
    createCatTitle: "Neue Kategorie / Unterkategorie", printBtn: "Drucken", viewBtn: "Anzeigen", emailBtn: "E-Mail",
    deleteBtn: "Löschen", upBtn: "Nach oben", rootFolder: "Hauptverzeichnis", selectParentCat: "Bestehende Kategorie wählen:",
    newMainCatLabel: "Neue Hauptkategorie:"
  },
  es: {
    pinTitle: "Ingrese Clave", loginBtn: "Ingresar", menuUpload: "Subir documentos",
    menuExplore: "Explorar documentos", uploadHeader: "Subir o escanear documento",
    catLabel: "Categoría:", subCatLabel: "Subcategoría:", newCatBtn: "+ Nueva Categoría / Subcategoría",
    customNameLabel: "Nombre de archivo (Opcional):", uploadFileBtn: "Subir Archivo", useCameraBtn: "Usar Cámara",
    captureBtn: "Tomar Foto", saveBtn: "Guardar", closeBtn: "Cerrar", exploreHeader: "Explorar documentos",
    createCatTitle: "Nueva Categoría / Subcategoría", printBtn: "Imprimir", viewBtn: "Ver", emailBtn: "Correo",
    deleteBtn: "Eliminar", upBtn: "Subir nivel", rootFolder: "Directorio Principal", selectParentCat: "Seleccionar categoría existente:",
    newMainCatLabel: "Nueva categoría principal:"
  }
};

// --- WEBDAV HTTP CLIENT HELPERS ---
function getAuthHeader() {
  return 'Basic ' + btoa(unescape(encodeURIComponent(`${WEBDAV_CONFIG.username}:${WEBDAV_CONFIG.password}`)));
}

function getWebdavUrl(relativePath = "") {
  const cleanBase = WEBDAV_CONFIG.baseUrl.replace(/\/+$/, "");
  const cleanPath = relativePath ? '/' + relativePath.split('/').map(encodeURIComponent).join('/') : "";
  return cleanBase + cleanPath;
}

async function webdavRequest(path, method = 'GET', body = null, headers = {}) {
  const url = getWebdavUrl(path);
  const reqHeaders = {
    'Authorization': getAuthHeader(),
    ...headers
  };

  const response = await fetch(url, { method, headers: reqHeaders, body });
  if (!response.ok && response.status !== 207 && response.status !== 404) {
    throw new Error(`WebDAV Error (${response.status}): ${response.statusText}`);
  }
  return response;
}

async function createWebdavDirectory(path) {
  try {
    const res = await webdavRequest(path, 'MKCOL');
    return res.ok || res.status === 405; // 405 = ya existe
  } catch (err) {
    console.error(`Error creando carpeta WebDAV: ${path}`, err);
    return false;
  }
}

async function parseWebdavPropfind(path = "") {
  const response = await webdavRequest(path, 'PROPFIND', null, { 'Depth': '1' });
  if (response.status === 404) return [];
  
  const text = await response.text();
  const xml = new DOMParser().parseFromString(text, 'text/xml');
  const responses = Array.from(xml.querySelectorAll('response, D\\:response, d\\:response'));
  
  const items = [];
  const targetBaseUrl = new URL(getWebdavUrl(path)).pathname.replace(/\/+$/, "");

  responses.forEach(resp => {
    const href = resp.querySelector('href, D\\:href, d\\:href')?.textContent || '';
    const decodedHref = decodeURIComponent(href).replace(/\/+$/, "");
    
    // Ignorar el propio directorio consultado
    if (decodedHref === targetBaseUrl || decodedHref === targetBaseUrl + '/') return;

    const isCollection = !!resp.querySelector('collection, D\\:collection, d\\:collection');
    const name = decodedHref.split('/').pop();
    const itemPath = path ? `${path}/${name}` : name;

    if (name) {
      items.push({ name, isDir: isCollection, path: itemPath });
    }
  });

  return items;
}

// --- INICIALIZACIÓN Y WEBDAV SEEDING ---
async function initWebDAV() {
  try {
    await seedDefaultCategories();
    await loadCategories();
  } catch (err) {
    alert(currentLang === 'de' 
      ? "Verbindung zum NAS/WebDAV fehlgeschlagen." 
      : "Error al conectar con la NAS por WebDAV.");
    console.error(err);
  }
}

async function seedDefaultCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await createWebdavDirectory(cat);
  }
}

function verifyPin() {
  const inputPin = document.getElementById("pin-input").value;
  if (inputPin === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    initWebDAV();
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
  if (viewId === 'explore-view') loadExplorerPath(currentExplorerPath);
}

// --- GESTIÓN DE CATEGORÍAS EN WEBDAV ---
async function loadCategories() {
  categoryData = {};
  const rootItems = await parseWebdavPropfind("");
  const mainCategories = rootItems.filter(i => i.isDir);

  for (const cat of mainCategories) {
    const subItems = await parseWebdavPropfind(cat.name);
    categoryData[cat.name] = subItems.filter(i => i.isDir).map(i => i.name);
  }

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

// --- CARGA DE ARCHIVOS A LA NAS VIA WEBDAV ---
async function uploadSelectedFile() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput.files.length) {
    alert(currentLang === 'de' ? "Bitte wählen Sie eine Datei aus." : "Por favor seleccione un archivo.");
    return;
  }

  const file = fileInput.files[0];
  const cat = document.getElementById("cat-select").value;
  const subcat = document.getElementById("subcat-select").value;
  const customName = document.getElementById("custom-name-input").value;

  const originalExt = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  let finalName = file.name;
  if (customName && customName.trim() !== "") {
    finalName = customName.trim().endsWith(originalExt) ? customName.trim() : `${customName.trim()}${originalExt}`;
  }

  const targetPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;

  try {
    await webdavRequest(targetPath, 'PUT', file, { 'Content-Type': file.type || 'application/octet-stream' });
    alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado con éxito en la NAS!");
    fileInput.value = "";
    document.getElementById("custom-name-input").value = "";
  } catch (err) {
    alert("Fehler beim Hochladen / Error al subir el archivo");
    console.error(err);
  }
}

// --- CAPTURA DE CÁMARA ---
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
  let mimeType = 'image/png';

  if (format === "pdf") {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
    blob = pdf.output("blob");
    mimeType = 'application/pdf';
  } else {
    mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    blob = await new Promise(r => canvas.toBlob(r, mimeType, 0.95));
  }

  const cat = document.getElementById("cat-select").value;
  const subcat = document.getElementById("subcat-select").value;
  const customName = document.getElementById("cam-custom-name").value;
  const ext = format === 'jpg' ? '.jpg' : format === 'pdf' ? '.pdf' : '.png';
  let finalName = `scan_${Date.now()}${ext}`;

  if (customName && customName.trim()) {
    finalName = customName.trim().endsWith(ext) ? customName.trim() : `${customName.trim()}${ext}`;
  }

  const targetPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;

  try {
    await webdavRequest(targetPath, 'PUT', blob, { 'Content-Type': mimeType });
    stopCamera();
    document.getElementById("cam-custom-name").value = "";
    alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado en la NAS!");
  } catch (err) {
    alert("Fehler beim Hochladen / Error al subir el escaneo");
    console.error(err);
  }
}

function stopCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  document.getElementById("camera-modal").classList.add("hidden");
}

// --- EXPLORADOR DE ARCHIVOS DE LA NAS ---
async function loadExplorerPath(path = "") {
  currentExplorerPath = path;
  renderBreadcrumbs();

  const grid = document.getElementById("explorer-grid");
  grid.innerHTML = "";

  try {
    const items = await parseWebdavPropfind(path);
    items.sort((a, b) => {
      if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
      return a.isDir ? -1 : 1;
    });

    items.forEach(item => {
      renderExplorerCard(grid, item);
    });
  } catch (err) {
    console.error("Error al explorar el directorio:", err);
  }
}

function renderExplorerCard(container, item) {
  const card = document.createElement("div");
  card.className = item.isDir ? "explorer-card folder-card" : "explorer-card file-card";

  if (item.isDir) {
    card.innerHTML = `
      <div class="icon">📁</div>
      <div class="name">${item.name}</div>
    `;
    card.onclick = () => loadExplorerPath(item.path);
  } else {
    card.innerHTML = `
      <div class="icon">📄</div>
      <div class="name" title="${item.name}">${item.name}</div>
      <div class="card-actions">
        <button onclick="viewDoc('${item.path}')">${translations[currentLang].viewBtn}</button>
        <button onclick="printDoc('${item.path}')">${translations[currentLang].printBtn}</button>
        <button onclick="sendEmail('${item.name}')">${translations[currentLang].emailBtn}</button>
        <button onclick="deleteDoc('${item.path}')" style="color:red; border-color:red;">${translations[currentLang].deleteBtn}</button>
      </div>
    `;
  }
  container.appendChild(card);
}

// --- OPERACIONES SOBRE ARCHIVOS (VER, IMPRIMIR, ELIMINAR) ---
async function fetchFileBlobUrl(path) {
  const res = await webdavRequest(path, 'GET');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function viewDoc(path) {
  try {
    const url = await fetchFileBlobUrl(path);
    window.open(url, '_blank');
  } catch (err) {
    alert("Fehler beim Laden der Datei / Error al abrir archivo");
  }
}

async function printDoc(path) {
  try {
    const url = await fetchFileBlobUrl(path);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => win.print();
    }
  } catch (err) {
    alert("Fehler beim Drucken / Error al imprimir");
  }
}

async function deleteDoc(path) {
  if (confirm(currentLang === 'de' ? "Dokument wirklich löschen?" : "¿Desea eliminar este documento?")) {
    try {
      await webdavRequest(path, 'DELETE');
      loadExplorerPath(currentExplorerPath);
    } catch (err) {
      alert("Fehler beim Löschen / Error al eliminar");
    }
  }
}

// --- NAVEGACIÓN Y BREADCRUMBS ---
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

function sendEmail(fileName) {
  const subject = encodeURIComponent(`Dokument: ${fileName}`);
  const body = encodeURIComponent(`Hallo,\n\nanbei befindet sich das Dokument "${fileName}".\n\nViele Grüße`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// --- CREAR NUEVA CATEGORÍA EN LA NAS ---
function openCategoryModal() {
  document.getElementById("modal-parent-cat").value = "";
  toggleModalCatInput();
  document.getElementById("new-cat-modal").classList.remove("hidden");
}

function closeCategoryModal() {
  document.getElementById("new-cat-modal").classList.add("hidden");
}

async function createNewCategory() {
  const selectedParent = document.getElementById("modal-parent-cat").value;
  const catInput = document.getElementById("new-cat-input").value.trim();
  const subInput = document.getElementById("new-subcat-input").value.trim();

  let targetPath = "";

  if (selectedParent) {
    if (subInput) {
      targetPath = `${selectedParent}/${subInput}`;
    } else {
      alert(currentLang === 'de' ? "Bitte Unterkategorie eingeben" : "Ingrese una subcategoría");
      return;
    }
  } else if (catInput) {
    targetPath = catInput;
    if (subInput) {
      await createWebdavDirectory(catInput);
      targetPath = `${catInput}/${subInput}`;
    }
  } else {
    alert(currentLang === 'de' ? "Bitte Kategorie eingeben" : "Ingrese una categoría");
    return;
  }

  try {
    await createWebdavDirectory(targetPath);
    closeCategoryModal();
    document.getElementById("new-cat-input").value = "";
    document.getElementById("new-subcat-input").value = "";
    await loadCategories();
  } catch (err) {
    alert("Fehler beim Erstellen der Kategorie / Error al crear categoría en la NAS");
  }
}