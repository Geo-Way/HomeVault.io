// --- DICCIONARIO DE IDIOMAS (Alemán por defecto, Español opcional) ---
const translations = {
  de: {
    pageTitle: "HomeVault - PC Edition",
    loginTitle: "🔐 HomeVault Anmelden",
    pinLabel: "PIN eingeben:",
    loginBtn: "Anmelden",
    navScan: "📤 Hochladen / Scannen",
    navExplore: "📁 PC Durchsuchen",
    scanTitle: "📂 Dokument hochladen oder scannen",
    catLabel: "Kategorie (Hauptordner):",
    subcatLabel: "Unterkategorie (Optional):",
    fileLabel: "Datei oder Foto:",
    nameLabel: "Dateiname (Optional):",
    commentLabel: "Kommentar / Metadaten (Optional):",
    saveBtn: "Auf dem PC speichern",
    exploreTitle: "🗂️ PC Datei-Explorer",
    rootBtn: "🏠 Zum Hauptverzeichnis",
    modalTitle: "Kategorie / Ordner erstellen",
    modalParentLabel: "In bestehende Kategorie verschieben (Optional):",
    modalMainLabel: "Name der neuen Hauptkategorie:",
    modalSubLabel: "Oder Name der Unterkategorie:",
    modalCreateBtn: "Erstellen",
    modalCancelBtn: "Abbrechen",
    noSubcat: "-- Keine --",
    rootOption: "-- Keine (Hauptkategorie erstellen) --",
    detComment: "Kommentar / Notiz:",
    btnPrint: "🖨️ Drucken",
    btnOpen: "👁️ Öffnen",
    btnEmail: "✉️ E-Mail senden",
    btnDelete: "🗑️ Löschen",
    btnClose: "Schließen"
  },
  es: {
    pageTitle: "HomeVault - Edición PC",
    loginTitle: "🔐 Acceso HomeVault",
    pinLabel: "Introduce tu PIN:",
    loginBtn: "Entrar",
    navScan: "📤 Escanear / Subir",
    navExplore: "📁 Explorar PC",
    scanTitle: "📂 Nuevo Documento",
    catLabel: "Categoría (Carpeta principal):",
    subcatLabel: "Subcategoría (Opcional):",
    fileLabel: "Archivo o Foto:",
    nameLabel: "Nombre personalizado (Opcional):",
    commentLabel: "Comentario / Metadatos (Opcional):",
    saveBtn: "Guardar en casa",
    exploreTitle: "🗂️ Explorador de Archivos",
    rootBtn: "🏠 Ir a Raíz",
    modalTitle: "Crear Carpeta / Categoría",
    modalParentLabel: "¿Meter dentro de categoría existente? (Opcional):",
    modalMainLabel: "Nombre de la nueva categoría principal:",
    modalSubLabel: "O nombre de subcategoría:",
    modalCreateBtn: "Crear",
    modalCancelBtn: "Cancelar",
    noSubcat: "-- Ninguna --",
    rootOption: "-- Ninguna (Crear Principal) --",
    detComment: "Comentario / Nota:",
    btnPrint: "🖨️ Imprimir",
    btnOpen: "👁️ Ver",
    btnEmail: "✉️ Enviar por E-mail",
    btnDelete: "🗑️ Eliminar",
    btnClose: "Cerrar"
  }
};

let currentLang = localStorage.getItem("homevault_lang") || "de";

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("homevault_lang", lang);
  const t = translations[lang];

  document.getElementById("page-title").innerText = t.pageTitle;
  document.getElementById("t-login-title").innerText = t.loginTitle;
  document.getElementById("t-pin-label").innerText = t.pinLabel;
  document.getElementById("t-login-btn").innerText = t.loginBtn;
  document.getElementById("t-nav-scan").innerText = t.navScan;
  document.getElementById("t-nav-explore").innerText = t.navExplore;
  document.getElementById("t-scan-title").innerText = t.scanTitle;
  document.getElementById("t-cat-label").innerText = t.catLabel;
  document.getElementById("t-subcat-label").innerText = t.subcatLabel;
  document.getElementById("t-file-label").innerText = t.fileLabel;
  document.getElementById("t-name-label").innerText = t.nameLabel;
  document.getElementById("t-comment-label").innerText = t.commentLabel;
  document.getElementById("t-save-btn").innerText = t.saveBtn;
  document.getElementById("t-explore-title").innerText = t.exploreTitle;
  document.getElementById("t-root-btn").innerText = t.rootBtn;
  document.getElementById("t-modal-title").innerText = t.modalTitle;
  document.getElementById("t-modal-parent-label").innerText = t.modalParentLabel;
  document.getElementById("t-modal-main-label").innerText = t.modalMainLabel;
  document.getElementById("t-modal-sub-label").innerText = t.modalSubLabel;
  document.getElementById("t-modal-create-btn").innerText = t.modalCreateBtn;
  document.getElementById("t-modal-cancel-btn").innerText = t.modalCancelBtn;
  document.getElementById("t-det-comment").innerText = t.detComment;
  document.getElementById("t-btn-print").innerText = t.btnPrint;
  document.getElementById("t-btn-open").innerText = t.btnOpen;
  document.getElementById("t-btn-email").innerText = t.btnEmail;
  document.getElementById("t-btn-delete").innerText = t.btnDelete;
  document.getElementById("t-btn-close").innerText = t.btnClose;

  document.getElementById("lang-select").value = lang;
}

// --- CONFIGURACIÓN E IP TRANSPARENTE ---
function getBaseUrl() {
  let savedIp = localStorage.getItem("homevault_pc_ip");
  if (!savedIp || savedIp.trim() === "" || savedIp === "http://") {
    savedIp = "localhost"; 
    localStorage.setItem("homevault_pc_ip", savedIp);
  }
  return `http://${savedIp.replace(/^https?:\/\//, '').replace(/\/$/, '')}:8080`;
}

// --- COMUNICACIÓN WEBDAV ---
async function webdavRequest(path, method = 'GET', headers = {}, body = null) {
  const baseUrl = getBaseUrl();
  const cleanPath = path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '';
  const url = `${baseUrl}/Public${cleanPath}`;
  
  const options = { method, headers: { ...headers } };
  if (body) options.body = body;

  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    console.error(`Error WebDAV [${method} ${url}]:`, err);
    throw err;
  }
}

async function createWebdavDirectory(dirPath) {
  try {
    const res = await webdavRequest(dirPath, 'MKCOL');
    return res.ok || res.status === 405;
  } catch (e) {
    console.error(`Error creando carpeta: ${dirPath}`, e);
    return false;
  }
}

async function parseWebdavPropfind(path = "") {
  try {
    const res = await webdavRequest(path, 'PROPFIND', { 'Depth': '1' });
    if (!res.ok) return [];
    
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const responses = Array.from(xml.querySelectorAll('response, D\\:response, d\\:response'));
    
    const items = [];
    responses.forEach(resp => {
      const href = resp.querySelector('href, D\\:href, d\\:href')?.textContent || '';
      const decodedHref = decodeURIComponent(href).replace(/\/+$/, "");
      const name = decodedHref.split('/').pop();
      
      if (!name || name === "Public" || name === "HomeVault_PC") return;

      const isCollection = !!resp.querySelector('collection, D\\:collection, d\\:collection');
      const itemPath = path ? `${path}/${name}` : name;

      items.push({ name, isDir: isCollection, path: itemPath });
    });
    return items;
  } catch (e) {
    console.error("Error en PROPFIND:", e);
    return [];
  }
}

// --- LOGIN Y VISTAS ---
function verifyPin() {
  const pinInput = document.getElementById("pin-input");
  if (pinInput && pinInput.value === "3172") {
    const pinScreen = document.getElementById("pin-screen");
    const appContainer = document.getElementById("app-container");

    if (pinScreen) pinScreen.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");

    initWebDAV();
  } else {
    alert(currentLang === 'de' ? "Falsche PIN (Versuche 3172)" : "PIN incorrecto");
  }
}

function showView(viewId) {
  document.querySelectorAll("#app-container > .view").forEach(v => v.classList.add("hidden"));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove("hidden");
  
  if (viewId === 'explore-view') {
    loadExplorerPath("");
  }
}

// --- CATEGORÍAS Y EXPLORADOR ---
let categoryData = {};
let currentExplorerPath = "";
let activeFilepath = "";

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
  const t = translations[currentLang];

  if (catSelect) catSelect.innerHTML = "";
  if (modalParentSelect) modalParentSelect.innerHTML = `<option value="">${t.rootOption}</option>`;

  Object.keys(categoryData).sort().forEach(cat => {
    if (catSelect) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.innerText = cat;
      catSelect.appendChild(opt);
    }
    if (modalParentSelect) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.innerText = cat;
      modalParentSelect.appendChild(opt);
    }
  });

  handleCatChange();
}

function handleCatChange() {
  const catSelect = document.getElementById("cat-select");
  const subSelect = document.getElementById("subcat-select");
  const t = translations[currentLang];
  if (!catSelect || !subSelect) return;

  const selectedCat = catSelect.value;
  subSelect.innerHTML = `<option value=''>${t.noSubcat}</option>`;
  
  if (categoryData[selectedCat] && categoryData[selectedCat].length > 0) {
    categoryData[selectedCat].forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.innerText = sub;
      subSelect.appendChild(opt);
    });
  }
}

async function loadExplorerPath(path = "") {
  currentExplorerPath = path;
  const grid = document.getElementById("explorer-grid");
  if (!grid) return;
  grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px;'>Laden...</div>";

  const items = await parseWebdavPropfind(path);
  
  const jsonFiles = {};
  items.filter(i => i.name.endsWith('.json')).forEach(j => {
    jsonFiles[j.name.replace('.json', '')] = j.path;
  });

  const filtered = items.filter(i => !i.name.endsWith('.json'));
  filtered.sort((a, b) => (a.isDir === b.isDir) ? a.name.localeCompare(b.name) : (a.isDir ? -1 : 1));

  grid.innerHTML = "";
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#64748b; padding:20px;">${currentLang === 'de' ? 'Ordner ist leer' : 'Carpeta vacía'}</div>`;
    return;
  }

  filtered.forEach(async item => {
    const card = document.createElement("div");
    card.className = item.isDir ? "explorer-card folder-card" : "explorer-card file-card";
    
    if (item.isDir) {
      card.innerHTML = `<div class="icon">📁</div><div class="name"><strong>${item.name}</strong></div>`;
      card.onclick = () => loadExplorerPath(item.path);
    } else {
      let commentPreview = "";
      const jsonPath = jsonFiles[item.name];
      if (jsonPath) {
        try {
          const resJson = await webdavRequest(jsonPath, 'GET');
          if (resJson.ok) {
            const data = await resJson.json();
            if (data.comment) commentPreview = data.comment;
          }
        } catch(e) {}
      }

      card.innerHTML = `
        <div class="icon">📄</div>
        <div class="name" title="${item.name}"><strong>${item.name}</strong></div>
        ${commentPreview ? `<div style="font-size:11px; color:#475569; background:#e2e8f0; padding:3px; border-radius:4px; margin:4px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${commentPreview}">💬 ${commentPreview}</div>` : ''}
        <div style="margin-top:auto; font-size:11px; color:var(--primary); font-weight:600;">Details ⚙️</div>
      `;
      card.onclick = () => openFileDetails(item.path, encodeURIComponent(commentPreview));
    }
    grid.appendChild(card);
  });
}

function openFileDetails(path, encodedComment) {
  activeFilepath = path;
  const modal = document.getElementById("file-details-modal");
  const titleEl = document.getElementById("modal-file-title");
  const commentEl = document.getElementById("modal-file-comment");

  const fileName = path.split('/').pop();
  if (titleEl) titleEl.innerText = fileName;
  if (commentEl) {
    const decoded = decodeURIComponent(encodedComment);
    commentEl.innerText = decoded && decoded !== "undefined" && decoded !== "" 
      ? decoded 
      : (currentLang === 'de' ? 'Kein Kommentar hinterlegt.' : 'Sin comentarios registrados.');
  }

  if (modal) modal.classList.remove("hidden");
}

function closeFileDetailsModal() {
  const modal = document.getElementById("file-details-modal");
  if (modal) modal.classList.add("hidden");
}

async function viewCurrentDoc() {
  if (!activeFilepath) return;
  try {
    const res = await webdavRequest(activeFilepath, 'GET');
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (err) {
    alert(currentLang === 'de' ? "Fehler beim Öffnen" : "Error al abrir archivo");
  }
  closeFileDetailsModal();
}

async function printCurrentDoc() {
  if (!activeFilepath) return;
  try {
    const res = await webdavRequest(activeFilepath, 'GET');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (err) {
    alert(currentLang === 'de' ? "Fehler beim Drucken" : "Error al intentar imprimir");
  }
  closeFileDetailsModal();
}

async function emailCurrentDoc() {
  if (!activeFilepath) return;
  try {
    const res = await webdavRequest(activeFilepath, 'GET');
    const blob = await res.blob();
    const fileName = activeFilepath.split('/').pop();
    const file = new File([blob], fileName, { type: blob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'HomeVault Document',
        text: document.getElementById("modal-file-comment").innerText
      });
    } else {
      const url = URL.createObjectURL(blob);
      const comment = document.getElementById("modal-file-comment").innerText;
      const mailtoLink = `mailto:?subject=${encodeURIComponent("HomeVault: " + fileName)}&body=${encodeURIComponent("Kommentar / Notiz:\n" + comment + "\n\n(Hinweis: Die Datei muss aus dem Download-Ordner angehängt werden).")}`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.location.href = mailtoLink;
    }
  } catch (err) {
    alert(currentLang === 'de' ? "Fehler beim Senden" : "Error al preparar el correo");
  }
  closeFileDetailsModal();
}

async function deleteCurrentDoc() {
  if (confirm(currentLang === 'de' ? "Dokument und Metadaten wirklich löschen?" : "¿Eliminar documento y sus metadatos?")) {
    await webdavRequest(activeFilepath, 'DELETE');
    try {
      await webdavRequest(activeFilepath + '.json', 'DELETE');
    } catch(e) {}

    closeFileDetailsModal();
    loadExplorerPath(currentExplorerPath);
  }
}

function openCategoryModal() {
  const modal = document.getElementById("new-cat-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeCategoryModal() {
  const modal = document.getElementById("new-cat-modal");
  if (modal) modal.classList.add("hidden");
}

async function createNewCategory() {
  const parentSelect = document.getElementById("modal-parent-cat");
  const mainInput = document.getElementById("new-cat-input");
  const subInput = document.getElementById("new-subcat-input");

  const parent = parentSelect ? parentSelect.value : "";
  const mainCat = mainInput ? mainInput.value.trim() : "";
  const subCat = subInput ? subInput.value.trim() : "";

  let targetPath = "";
  if (parent) {
    if (subCat) targetPath = `${parent}/${subCat}`;
    else { alert(currentLang === 'de' ? "Bitte Unterkategorie angeben" : "Indica una subcategoría"); return; }
  } else if (mainCat) {
    targetPath = mainCat;
    if (subCat) targetPath = `${mainCat}/${subCat}`;
  } else {
    alert(currentLang === 'de' ? "Bitte Kategoriename angeben" : "Indica un nombre de categoría");
    return;
  }

  await createWebdavDirectory(targetPath);
  closeCategoryModal();
  if (mainInput) mainInput.value = "";
  if (subInput) subInput.value = "";
  await loadCategories();
  alert(currentLang === 'de' ? "Erfolgreich erstellt!" : "¡Categoría creada con éxito!");
}

async function uploadHomeVaultFile() {
  const fileInput = document.getElementById("file-input");
  const catSelect = document.getElementById("cat-select");
  const subSelect = document.getElementById("subcat-select");
  const nameInput = document.getElementById("custom-name-input");
  const commentInput = document.getElementById("meta-comment");

  if (!fileInput || !fileInput.files.length) {
    alert(currentLang === 'de' ? "Bitte Datei auswählen." : "Por favor selecciona un archivo.");
    return;
  }

  const file = fileInput.files[0];
  const cat = catSelect ? catSelect.value : "Gescannte Dokumente";
  const subcat = subSelect ? subSelect.value : "";
  const customName = nameInput ? nameInput.value.trim() : "";
  const comment = commentInput ? commentInput.value.trim() : "";

  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  let finalName = customName ? (customName.endsWith(ext) ? customName : `${customName}${ext}`) : file.name;

  const targetPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;

  await createWebdavDirectory(subcat ? `${cat}/${subcat}` : cat);

  const headers = {
    'Content-Type': file.type || 'application/octet-stream',
    'X-Category': cat,
    'X-Comment': comment
  };

  const res = await webdavRequest(targetPath, 'PUT', headers, file);
  if (res.ok || res.status === 201) {
    alert(currentLang === 'de' ? "Erfolgreich auf dem PC gespeichert!" : "¡Guardado con éxito en el PC!");
    fileInput.value = "";
    if (nameInput) nameInput.value = "";
    if (commentInput) commentInput.value = "";
  } else {
    alert("Error. Status: " + res.status);
  }
}

async function initWebDAV() {
  await loadCategories();
}

document.addEventListener("DOMContentLoaded", () => {
  changeLanguage(currentLang);
});

// Exposición global estricta
window.verifyPin = verifyPin;
window.showView = showView;
window.handleCatChange = handleCatChange;
window.loadExplorerPath = loadExplorerPath;
window.openFileDetails = openFileDetails;
window.closeFileDetailsModal = closeFileDetailsModal;
window.viewCurrentDoc = viewCurrentDoc;
window.printCurrentDoc = printCurrentDoc;
window.emailCurrentDoc = emailCurrentDoc;
window.deleteCurrentDoc = deleteCurrentDoc;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.createNewCategory = createNewCategory;
window.uploadHomeVaultFile = uploadHomeVaultFile;
window.changeLanguage = changeLanguage;