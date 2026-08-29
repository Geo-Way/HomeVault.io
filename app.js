const translations = {
  de: {
    pageTitle: "HomeVault - Mobile Local Edition",
    loginTitle: "🔐 HomeVault Anmelden",
    pinLabel: "PIN eingeben:",
    loginBtn: "Anmelden",
    navScan: "📤 Dokument erfassen",
    navExplore: "📁 Lokaler Speicher",
    navSync: "🔄 Sync mit PC",
    scanTitle: "📂 Neues Dokument",
    catLabel: "Kategorie (Hauptordner):",
    subcatLabel: "Unterkategorie (Optional):",
    fileLabel: "Datei oder Foto:",
    nameLabel: "Dateiname (Optional):",
    commentLabel: "Kommentar (Optional):",
    saveBtn: "Lokal speichern",
    exploreTitle: "🗂️ Explorer & PC Sync",
    syncTitle: "💻 Bidirektionale Synchronisierung",
    syncDesc: "Sichert lokale Daten zum PC und lädt PC-Ordner aufs Handy.",
    ipLabel: "PC IP-Adresse:",
    syncBtn: "Jetzt bidirektional synchronisieren",
    rootBtn: "🏠 Zum Hauptverzeichnis",
    modalTitle: "Kategorie erstellen",
    modalParentLabel: "Übergeordnete Kategorie (Optional):",
    modalMainLabel: "Name der Hauptkategorie:",
    modalSubLabel: "Oder Unterkategorie:",
    modalCreateBtn: "Erstellen",
    modalCancelBtn: "Abbrechen",
    noSubcat: "-- Keine --",
    rootOption: "-- Keine (Hauptkategorie) --",
    detComment: "Kommentar:",
    btnPrint: "🖨️ Drucken",
    btnOpen: "👁️ Öffnen",
    btnEmail: "✉️ E-Mail",
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
    scanTitle: "📂 Capturar Documento",
    catLabel: "Categoría principal:",
    subcatLabel: "Subcategoría (Opcional):",
    fileLabel: "Archivo o Foto:",
    nameLabel: "Nombre personalizado:",
    commentLabel: "Comentario:",
    saveBtn: "Guardar en el móvil",
    exploreTitle: "🗂️ Explorador y Sincronización",
    syncTitle: "💻 Sincronización Bidireccional",
    syncDesc: "Envía tus documentos al PC y descarga los archivos del ordenador al móvil.",
    ipLabel: "IP del PC:",
    syncBtn: "Sincronizar con el PC ahora",
    rootBtn: "🏠 Ir a Raíz",
    modalTitle: "Crear Categoría / Carpeta",
    modalParentLabel: "Categoría padre (Opcional):",
    modalMainLabel: "Nombre de categoría principal:",
    modalSubLabel: "O nombre de subcategoría:",
    modalCreateBtn: "Crear",
    modalCancelBtn: "Cancelar",
    noSubcat: "-- Ninguna --",
    rootOption: "-- Ninguna (Crear Principal) --",
    detComment: "Comentario:",
    btnPrint: "🖨️ Imprimir",
    btnOpen: "👁️ Ver",
    btnEmail: "✉️ Enviar E-mail",
    btnDelete: "🗑️ Eliminar",
    btnClose: "Cerrar"
  }
};

let currentLang = localStorage.getItem("homevault_lang") || "es";

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

const DB_NAME = "HomeVaultLocalDB";
const DB_VERSION = 1;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains("documents")) database.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
      if (!database.objectStoreNames.contains("categories")) database.createObjectStore("categories", { keyPath: "path" });
    };
  });
}

function verifyPin() {
  const pinInput = document.getElementById("pin-input");
  if (pinInput && pinInput.value === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    initAppStorage();
  } else {
    alert("PIN incorrecto (Prueba 3172)");
  }
}

function showView(viewId) {
  document.querySelectorAll("#app-container > .view").forEach(v => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  if (viewId === 'explore-view') loadLocalExplorer();
  else if (viewId === 'sync-view') {
    document.getElementById("pc-ip-input").value = localStorage.getItem("homevault_pc_ip") || "192.168.178.27";
  }
}

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
      if (!e.target.result) store.put({ path: catName, parent: "" });
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
      // Solo categorías puras principales (que no contengan barras '/')
      if (!cat.path.includes('/') && catSelect) {
        const opt = document.createElement("option");
        opt.value = cat.path; opt.innerText = cat.path;
        catSelect.appendChild(opt);
      }
      if (!cat.path.includes('/') && modalParentSelect) {
        const opt2 = document.createElement("option");
        opt2.value = cat.path; opt2.innerText = cat.path;
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
  transaction.objectStore("categories").getAll().onsuccess = (event) => {
    event.target.result.forEach(cat => {
      // Buscar subcategorías que pertenezcan estrictamente a la categoría principal seleccionada
      if (cat.path.startsWith(selectedCat + '/') && cat.path.split('/').length === 2) {
        const subName = cat.path.split('/')[1];
        const opt = document.createElement("option");
        opt.value = subName; opt.innerText = subName;
        subSelect.appendChild(opt);
      }
    });
  };
}

async function saveDocumentLocally() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput || !fileInput.files.length) {
    alert("Selecciona un archivo."); return;
  }
  const file = fileInput.files[0];
  const cat = document.getElementById("cat-select").value;
  const subcat = document.getElementById("subcat-select").value;
  const customName = document.getElementById("custom-name-input").value.trim();
  const comment = document.getElementById("meta-comment").value.trim();

  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const finalName = customName ? (customName.endsWith(ext) ? customName : `${customName}${ext}`) : file.name;
  
  // Evitar duplicidades extrañas en la ruta
  const fullPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;

  const reader = new FileReader();
  reader.onload = function(e) {
    const transaction = db.transaction(["documents"], "readwrite");
    transaction.objectStore("documents").add({
      path: fullPath, name: finalName, category: cat, subcat: subcat,
      comment: comment, type: file.type, data: e.target.result,
      date: new Date().toISOString(), synced: false
    }).onsuccess = () => {
      alert("¡Guardado con éxito en el móvil!");
      fileInput.value = "";
      document.getElementById("custom-name-input").value = "";
      document.getElementById("meta-comment").value = "";
    };
  };
  reader.readAsArrayBuffer(file);
}

function loadLocalExplorer() {
  const grid = document.getElementById("explorer-grid");
  if (!grid) return;
  grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px;'>Cargando...</div>";

  db.transaction(["documents"], "readonly").objectStore("documents").getAll().onsuccess = (event) => {
    const docs = event.target.result;
    grid.innerHTML = "";
    if (docs.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#64748b; padding:20px;">No hay documentos locales</div>`;
      return;
    }
    docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "explorer-card file-card";
      card.innerHTML = `
        <div class="icon">📄</div>
        <div class="name" title="${doc.name}"><strong>${doc.name}</strong></div>
        <div style="font-size:10px; color:#2563eb;">📂 ${doc.path}</div>
        ${doc.comment ? `<div style="font-size:11px; color:#475569; background:#e2e8f0; padding:3px; border-radius:4px; margin:4px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">💬 ${doc.comment}</div>` : ''}
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
  document.getElementById("modal-file-title").innerText = doc.name;
  document.getElementById("modal-file-comment").innerText = doc.comment || 'Sin comentarios.';
  document.getElementById("file-details-modal").classList.remove("hidden");
}
function closeFileDetailsModal() { document.getElementById("file-details-modal").classList.add("hidden"); }
function viewCurrentDoc() {
  const blob = new Blob([activeLocalDoc.data], { type: activeLocalDoc.type });
  window.open(URL.createObjectURL(blob), '_blank');
  closeFileDetailsModal();
}
function printCurrentDoc() {
  const blob = new Blob([activeLocalDoc.data], { type: activeLocalDoc.type });
  const w = window.open(URL.createObjectURL(blob), '_blank');
  if (w) w.onload = () => w.print();
  closeFileDetailsModal();
}
function deleteCurrentDoc() {
  if (confirm("¿Eliminar documento local?")) {
    db.transaction(["documents"], "readwrite").objectStore("documents").delete(activeLocalDoc.id).onsuccess = () => {
      closeFileDetailsModal(); loadLocalExplorer();
    };
  }
}

function getBaseUrl() {
  let pcIp = document.getElementById("pc-ip-input")?.value.trim() || localStorage.getItem("homevault_pc_ip") || "192.168.178.27";
  localStorage.setItem("homevault_pc_ip", pcIp);
  return `http://${pcIp.replace(/^https?:\/\//, '').replace(/\/$/, '')}:8080`;
}

async function syncToPC() {
  const baseUrl = getBaseUrl();
  let sentCount = 0;
  let downloadedCount = 0;

  const transaction = db.transaction(["documents"], "readwrite");
  const store = transaction.objectStore("documents");
  
  await new Promise((resolve) => {
    store.getAll().onsuccess = async (event) => {
      const docs = event.target.result;
      const pending = docs.filter(d => !d.synced);
      for (const doc of pending) {
        try {
          const url = `${baseUrl}/Public/${doc.path.split('/').map(encodeURIComponent).join('/')}`;
          const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': doc.type || 'application/octet-stream', 'X-Category': doc.category, 'X-Comment': doc.comment || '' },
            body: doc.data
          });
          if (res.ok || res.status === 201) { doc.synced = true; store.put(doc); sentCount++; }
        } catch (e) { console.error("Error subiendo:", e); }
      }
      resolve();
    };
  });

  try {
    const res = await fetch(`${baseUrl}/Public/`, { method: 'PROPFIND', headers: { 'Depth': 'infinity' } });
    if (res.ok) {
      const text = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const responses = xmlDoc.getElementsByTagName("D:response");

      for (let i = 0; i < responses.length; i++) {
        const href = responses[i].getElementsByTagName("D:href")[0]?.textContent;
        if (!href || href.endsWith('/')) continue;

        const urlParts = href.split('/Public/');
        if (urlParts.length < 2) continue;
        const relPath = decodeURIComponent(urlParts[1]);

        const fileRes = await fetch(`${baseUrl}/Public/${relPath.split('/').map(encodeURIComponent).join('/')}`);
        if (fileRes.ok) {
          const blob = await fileRes.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const name = relPath.split('/').pop();
          const parts = relPath.split('/');
          const category = parts.length > 1 ? parts[0] : "Gescannte Dokumente";
          const subcat = parts.length > 2 ? parts[1] : "";

          await new Promise((resolve) => {
            const tx = db.transaction(["documents"], "readwrite");
            const st = tx.objectStore("documents");
            st.add({
              path: relPath, name: name, category: category, subcat: subcat,
              comment: "", type: blob.type, data: arrayBuffer,
              date: new Date().toISOString(), synced: true
            });
            tx.oncomplete = () => { downloadedCount++; resolve(); };
            tx.onerror = () => resolve();
          });
        }
      }
    }
  } catch (e) {
    console.error("Error descargando del PC:", e);
  }

  alert(`Sincronización completada:\n- Enviados al PC: ${sentCount}\n- Descargados del PC: ${downloadedCount}`);
  loadLocalExplorer();
}

function openCategoryModal() { document.getElementById("new-cat-modal").classList.remove("hidden"); }
function closeCategoryModal() { document.getElementById("new-cat-modal").classList.add("hidden"); }

async function createNewCategory() {
  const parent = document.getElementById("modal-parent-cat").value.trim();
  const mainCat = document.getElementById("new-cat-input").value.trim();
  const subCat = document.getElementById("new-subcat-input").value.trim();

  let targetPath = "";
  if (parent) {
    if (subCat) targetPath = `${parent}/${subCat}`;
    else { alert("Indica el nombre de la subcategoría"); return; }
  } else if (mainCat) {
    targetPath = mainCat;
    if (subCat) targetPath = `${mainCat}/${subCat}`;
  } else {
    alert("Indica un nombre para la categoría principal");
    return;
  }

  const transaction = db.transaction(["categories"], "readwrite");
  transaction.objectStore("categories").put({ path: targetPath }).onsuccess = async () => {
    closeCategoryModal();
    document.getElementById("new-cat-input").value = "";
    document.getElementById("new-subcat-input").value = "";
    await loadCategoriesToUI();

    try {
      const baseUrl = getBaseUrl();
      await fetch(`${baseUrl}/Public/${targetPath.split('/').map(encodeURIComponent).join('/')}`, { method: 'MKCOL' });
    } catch(e) { console.error("No se pudo crear en el PC", e); }

    alert("¡Carpeta creada con éxito!");
  };
}

document.addEventListener("DOMContentLoaded", () => { changeLanguage(currentLang); });

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