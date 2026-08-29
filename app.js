// --- DICCIONARIO DE IDIOMAS ---
const translations = {
  de: {
    pageTitle: "HomeVault - Mobile Local Edition",
    loginTitle: "🔐 HomeVault Anmelden",
    pinLabel: "PIN eingeben:",
    loginBtn: "Anmelden",
    navScan: "📤 Dokument erfassen",
    navExplore: "📁 Lokaler Speicher",
    navSync: "🔄 Zum PC Sync",
    scanTitle: "📂 Neues Dokument (Lokal)",
    catLabel: "Kategorie (Hauptordner):",
    subcatLabel: "Unterkategorie (Optional):",
    fileLabel: "Datei oder Foto:",
    nameLabel: "Dateiname (Optional):",
    commentLabel: "Kommentar / Metadaten (Optional):",
    saveBtn: "Lokal auf dem Handy speichern",
    exploreTitle: "🗂️ Lokaler Dokumenten-Explorer",
    syncTitle: "💻 Daten zum PC übertragen",
    syncDesc: "Stelle sicher, dass dein PC eingeschaltet ist und das Python-Skript läuft.",
    ipLabel: "PC IP-Adresse (z.B. 192.168.178.27 o localhost):",
    syncBtn: "Jetzt alle Daten zum PC senden",
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
    pageTitle: "HomeVault - Edición Local Móvil",
    loginTitle: "🔐 Acceso HomeVault",
    pinLabel: "Introduce tu PIN:",
    loginBtn: "Entrar",
    navScan: "📤 Nuevo Documento",
    navExplore: "📁 Almacenamiento Local",
    navSync: "🔄 Sincronizar PC",
    scanTitle: "📂 Capturar Documento (Local)",
    catLabel: "Categoría (Carpeta principal):",
    subcatLabel: "Subcategoría (Opcional):",
    fileLabel: "Archivo o Foto:",
    nameLabel: "Nombre personalizado (Opcional):",
    commentLabel: "Comentario / Metadatos (Opcional):",
    saveBtn: "Guardar en el móvil",
    exploreTitle: "🗂️ Explorador Local",
    syncTitle: "💻 Volcar Datos al PC",
    syncDesc: "Asegúrate de que tu ordenador esté encendido y el servidor de Python en marcha.",
    ipLabel: "IP del PC (ej. 192.168.178.27 o localhost):",
    syncBtn: "Enviar todo al PC ahora",
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
  document.getElementById("t-nav-sync").innerText = t.navSync;
  document.getElementById("t-scan-title").innerText = t.scanTitle;
  document.getElementById("t-cat-label").innerText = t.catLabel;
  document.getElementById("t-subcat-label").innerText = t.subcatLabel;
  document.getElementById("t-file-label").innerText = t.fileLabel;
  document.getElementById("t-name-label").innerText = t.nameLabel;
  document.getElementById("t-comment-label").innerText = t.commentLabel;
  document.getElementById("t-save-btn").innerText = t.saveBtn;
  document.getElementById("t-explore-title").innerText = t.exploreTitle;
  document.getElementById("t-sync-title").innerText = t.syncTitle;
  document.getElementById("t-sync-desc").innerText = t.syncDesc;
  document.getElementById("t-ip-label").innerText = t.ipLabel;
  document.getElementById("t-sync-btn").innerText = t.syncBtn;
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

// --- GESTIÓN DE INDEXEDDB ---
const DB_NAME = "HomeVaultLocalDB";
const DB_VERSION = 1;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains("documents")) {
        database.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
      }
      if (!database.objectStoreNames.contains("categories")) {
        database.createObjectStore("categories", { keyPath: "path" });
      }
    };
  });
}

// --- LOGIN Y VISTAS ---
function verifyPin() {
  const pinInput = document.getElementById("pin-input");
  if (pinInput && pinInput.value === "3172") {
    const pinScreen = document.getElementById("pin-screen");
    const appContainer = document.getElementById("app-container");

    if (pinScreen) pinScreen.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");

    initAppStorage();
  } else {
    alert(currentLang === 'de' ? "Falsche PIN (Versuche 3172)" : "PIN incorrecto");
  }
}

function showView(viewId) {
  document.querySelectorAll("#app-container > .view").forEach(v => v.classList.add("hidden"));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove("hidden");
  
  if (viewId === 'explore-view') {
    loadLocalExplorer();
  } else if (viewId === 'sync-view') {
    const savedIp = localStorage.getItem("homevault_pc_ip") || "192.168.178.27";
    const ipInput = document.getElementById("pc-ip-input");
    if (ipInput) ipInput.value = savedIp;
  }
}

// --- CATEGORÍAS Y GUARDADO LOCAL ---
async function initAppStorage() {
  await initDB();
  await ensureDefaultCategory("Gescannte Dokumente");
  await loadCategoriesToUI();
}

function ensureDefaultCategory(catName) {
  return new Promise((resolve) => {
    const transaction = db.transaction(["categories"], "readwrite");
    const store = transaction.objectStore("categories");
    store.get(catName).onsuccess = (e) => {
      if (!e.target.result) {
        store.put({ path: catName, parent: "", subcats: [] });
      }
      resolve();
    };
  });
}

async function loadCategoriesToUI() {
  const transaction = db.transaction(["categories"], "readonly");
  const store = transaction.objectStore("categories");
  
  store.getAll().onsuccess = (event) => {
    const categories = event.target.result;
    const catSelect = document.getElementById("cat-select");
    const modalParentSelect = document.getElementById("modal-parent-cat");
    const t = translations[currentLang];

    if (catSelect) catSelect.innerHTML = "";
    if (modalParentSelect) modalParentSelect.innerHTML = `<option value="">${t.rootOption}</option>`;

    categories.forEach(cat => {
      // Solo añadimos las categorías principales al selector principal
      if (!cat.parent) {
        if (catSelect) {
          const opt = document.createElement("option");
          opt.value = cat.path;
          opt.innerText = cat.path;
          catSelect.appendChild(opt);
        }
      }
      // Todas las principales pueden ser padres en el modal
      if (modalParentSelect && !cat.parent) {
        const opt2 = document.createElement("option");
        opt2.value = cat.path;
        opt2.innerText = cat.path;
        modalParentSelect.appendChild(opt2);
      }
    });
    handleCatChange();
  };
}

function handleCatChange() {
  const catSelect = document.getElementById("cat-select");
  const subSelect = document.getElementById("subcat-select");
  const t = translations[currentLang];
  if (!catSelect || !subSelect) return;

  const selectedCat = catSelect.value;
  subSelect.innerHTML = `<option value=''>${t.noSubcat}</option>`;
  
  const transaction = db.transaction(["categories"], "readonly");
  const store = transaction.objectStore("categories");
  
  store.getAll().onsuccess = (event) => {
    const categories = event.target.result;
    categories.forEach(cat => {
      if (cat.parent === selectedCat) {
        const opt = document.createElement("option");
        opt.value = cat.path.split('/').pop(); // Guardamos solo el nombre de la subcategoría
        opt.innerText = cat.path.split('/').pop();
        subSelect.appendChild(opt);
      }
    });
  };
}

async function saveDocumentLocally() {
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

  const fullPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;

  const reader = new FileReader();
  reader.onload = function(e) {
    const fileData = e.target.result;

    const transaction = db.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    
    const docRecord = {
      path: fullPath,
      name: finalName,
      category: cat,
      subcat: subcat,
      comment: comment,
      type: file.type,
      data: fileData,
      date: new Date().toISOString(),
      synced: false
    };

    store.add(docRecord).onsuccess = () => {
      alert(currentLang === 'de' ? "Erfolgreich lokal auf dem Handy gespeichert!" : "¡Guardado con éxito en el móvil!");
      fileInput.value = "";
      if (nameInput) nameInput.value = "";
      if (commentInput) commentInput.value = "";
    };
  };
  reader.readAsArrayBuffer(file);
}

// --- EXPLORADOR LOCAL ---
function loadLocalExplorer() {
  const grid = document.getElementById("explorer-grid");
  if (!grid) return;
  grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px;'>Laden...</div>";

  const transaction = db.transaction(["documents"], "readonly");
  const docStore = transaction.objectStore("documents");

  docStore.getAll().onsuccess = (event) => {
    const docs = event.target.result;
    grid.innerHTML = "";

    if (docs.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#64748b; padding:20px;">${currentLang === 'de' ? 'Keine lokalen Dokumente' : 'No hay documentos locales'}</div>`;
      return;
    }

    docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "explorer-card file-card";
      card.innerHTML = `
        <div class="icon">📄</div>
        <div class="name" title="${doc.name}"><strong>${doc.name}</strong></div>
        <div style="font-size:10px; color:#2563eb;">📂 ${doc.path}</div>
        ${doc.comment ? `<div style="font-size:11px; color:#475569; background:#e2e8f0; padding:3px; border-radius:4px; margin:4px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${doc.comment}">💬 ${doc.comment}</div>` : ''}
        <div style="margin-top:auto; font-size:11px; color:var(--primary); font-weight:600;">${doc.synced ? '✅ Sincronizado' : '⏳ Pendiente PC'}</div>
      `;
      card.onclick = () => openLocalFileDetails(doc);
      grid.appendChild(card);
    });
  };
}

let activeLocalDoc = null;
function openLocalFileDetails(doc) {
  activeLocalDoc = doc;
  const modal = document.getElementById("file-details-modal");
  const titleEl = document.getElementById("modal-file-title");
  const commentEl = document.getElementById("modal-file-comment");

  if (titleEl) titleEl.innerText = doc.name;
  if (commentEl) commentEl.innerText = doc.comment || (currentLang === 'de' ? 'Kein Kommentar.' : 'Sin comentarios.');

  if (modal) modal.classList.remove("hidden");
}

function closeFileDetailsModal() {
  const modal = document.getElementById("file-details-modal");
  if (modal) modal.classList.add("hidden");
}

function viewCurrentDoc() {
  if (!activeLocalDoc) return;
  const blob = new Blob([activeLocalDoc.data], { type: activeLocalDoc.type });
  window.open(URL.createObjectURL(blob), '_blank');
  closeFileDetailsModal();
}

function printCurrentDoc() {
  if (!activeLocalDoc) return;
  const blob = new Blob([activeLocalDoc.data], { type: activeLocalDoc.type });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => printWindow.print();
  }
  closeFileDetailsModal();
}

function deleteCurrentDoc() {
  if (confirm(currentLang === 'de' ? "Lokales Dokument wirklich löschen?" : "¿Eliminar documento local?")) {
    const transaction = db.transaction(["documents"], "readwrite");
    transaction.objectStore("documents").delete(activeLocalDoc.id).onsuccess = () => {
      closeFileDetailsModal();
      loadLocalExplorer();
    };
  }
}

// --- SINCRONIZACIÓN CON EL PC ---
function getBaseUrl() {
  const ipInput = document.getElementById("pc-ip-input");
  let pcIp = ipInput ? ipInput.value.trim() : "";
  if (!pcIp) {
    pcIp = localStorage.getItem("homevault_pc_ip") || "192.168.178.27";
  }
  localStorage.setItem("homevault_pc_ip", pcIp);
  return `http://${pcIp.replace(/^https?:\/\//, '').replace(/\/$/, '')}:8080`;
}

async function syncToPC() {
  const transaction = db.transaction(["documents"], "readwrite");
  const store = transaction.objectStore("documents");

  store.getAll().onsuccess = async (event) => {
    const docs = event.target.result;
    const pending = docs.filter(d => !d.synced);

    if (pending.length === 0) {
      alert(currentLang === 'de' ? "Alle Dokumente sind bereits synchronisiert!" : "¡Todos los documentos ya están sincronizados!");
      return;
    }

    let successCount = 0;
    for (const doc of pending) {
      try {
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/Public/${doc.path.split('/').map(encodeURIComponent).join('/')}`;

        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': doc.type || 'application/octet-stream',
            'X-Category': doc.category,
            'X-Comment': doc.comment || ''
          },
          body: doc.data
        });

        if (res.ok || res.status === 201) {
          doc.synced = true;
          store.put(doc);
          successCount++;
        }
      } catch (err) {
        console.error("Error sincronizando archivo:", doc.name, err);
      }
    }

    alert(currentLang === 'de' ? `Synchronisierung abgeschlossen: ${successCount} von ${pending.length} gesendet.` : `Sincronización completada: ${successCount} de ${pending.length} enviados al PC.`);
  };
}

// --- CREAR CATEGORÍAS LOCALES ---
function openCategoryModal() {
  document.getElementById("new-cat-modal").classList.remove("hidden");
}
function closeCategoryModal() {
  document.getElementById("new-cat-modal").classList.add("hidden");
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
    else { alert(currentLang === 'de' ? "Unterkategorie angeben" : "Indica subcategoría"); return; }
  } else if (mainCat) {
    targetPath = mainCat;
    if (subCat) targetPath = `${mainCat}/${subCat}`;
  } else {
    alert(currentLang === 'de' ? "Kategoriename angeben" : "Indica categoría");
    return;
  }

  const transaction = db.transaction(["categories"], "readwrite");
  const store = transaction.objectStore("categories");
  
  store.put({ path: targetPath, parent: parent || (subCat ? mainCat : "") }).onsuccess = () => {
    closeCategoryModal();
    if (mainInput) mainInput.value = "";
    if (subInput) subInput.value = "";
    loadCategoriesToUI(); // Recarga automática de la lista de categorías
    alert(currentLang === 'de' ? "Ordner lokal erstellt!" : "¡Carpeta creada localmente!");
  };
}

document.addEventListener("DOMContentLoaded", () => {
  changeLanguage(currentLang);
});

// Exposición global
window.verifyPin = verifyPin;
window.showView = showView;
window.handleCatChange = handleCatChange;
window.loadLocalExplorer = loadLocalExplorer;
window.openLocalFileDetails = openLocalFileDetails;
window.closeFileDetailsModal = closeFileDetailsModal;
window.viewCurrentDoc = viewCurrentDoc;
window.printCurrentDoc = printCurrentDoc;
window.deleteCurrentDoc = deleteCurrentDoc;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.createNewCategory = createNewCategory;
window.saveDocumentLocally = saveDocumentLocally;
window.syncToPC = syncToPC;
window.changeLanguage = changeLanguage;