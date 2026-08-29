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

  // Uso de optional chaining: si un id no existe en el HTML actual, no se
  // rompe el resto de la función (antes un solo id ausente abortaba todo).
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };

  setText("page-title", t.pageTitle);
  setText("t-login-title", t.loginTitle);
  setText("t-pin-label", t.pinLabel);
  setText("t-login-btn", t.loginBtn);
  setText("t-nav-scan", t.navScan);
  setText("t-nav-explore", t.navExplore);
  setText("t-nav-sync", t.navSync);
  setText("t-scan-title", t.scanTitle);
  setText("t-cat-label", t.catLabel);
  setText("t-subcat-label", t.subcatLabel);
  setText("t-file-label", t.fileLabel);
  setText("t-name-label", t.nameLabel);
  setText("t-comment-label", t.commentLabel);
  setText("t-save-btn", t.saveBtn);
  setText("t-explore-title", t.exploreTitle);
  setText("t-sync-title", t.syncTitle);
  setText("t-sync-desc", t.syncDesc);
  setText("t-ip-label", t.ipLabel);
  setText("t-sync-btn", t.syncBtn);
  setText("t-modal-title", t.modalTitle);
  setText("t-modal-parent-label", t.modalParentLabel);
  setText("t-modal-main-label", t.modalMainLabel);
  setText("t-modal-sub-label", t.modalSubLabel);
  setText("t-modal-create-btn", t.modalCreateBtn);
  setText("t-modal-cancel-btn", t.modalCancelBtn);
  setText("t-det-comment", t.detComment);
  setText("t-btn-print", t.btnPrint);
  setText("t-btn-open", t.btnOpen);
  setText("t-btn-email", t.btnEmail);
  setText("t-btn-delete", t.btnDelete);
  setText("t-btn-close", t.btnClose);

  const langSelect = document.getElementById("lang-select");
  if (langSelect) langSelect.value = lang;
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

// ---------------------------------------------------------------------
// Utilidades de rutas: evitan la duplicación de carpetas
// (p.ej. "Gescannte Dokumente/Gescannte Dokumente/H/D.jpg")
// ---------------------------------------------------------------------

// Sanea UN segmento individual de ruta: nunca puede contener '/' ni '\',
// así un nombre de categoría jamás puede "inyectar" niveles extra de carpeta.
function sanitizeSegment(str) {
  return String(str ?? "")
    .trim()
    .replace(/[\/\\]+/g, "-")
    .replace(/\s+/g, " ");
}

// Construye una ruta a partir de varios segmentos: descarta vacíos,
// sanea cada uno y colapsa segmentos consecutivos idénticos
// (la causa directa del bug "cat/cat/sub/archivo").
function buildPath(...segments) {
  const clean = segments
    .map(sanitizeSegment)
    .filter((seg) => seg !== "");

  const deduped = clean.filter((seg, idx) => idx === 0 || seg !== clean[idx - 1]);
  return deduped.join("/");
}

// ---------------------------------------------------------------------
// Autolimpieza: corrige, una sola vez al iniciar, cualquier categoría o
// documento que ya haya quedado corrupto en IndexedDB por el bug anterior.
// No hace falta borrar la base de datos del móvil.
// ---------------------------------------------------------------------

function cleanupCorruptedCategories() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["categories"], "readwrite");
    const store = tx.objectStore("categories");
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cats = req.result || [];
      if (cats.length === 0) return resolve();

      let pending = cats.length;
      const seen = new Set();

      cats.forEach((cat) => {
        const clean = buildPath(...String(cat.path).split("/"));
        const isDuplicateOfAnother = clean !== cat.path;
        const alreadyProcessed = seen.has(clean);
        seen.add(clean);

        if (clean === "" || (isDuplicateOfAnother && alreadyProcessed)) {
          // Ruta inválida o ya cubierta por otra categoría corregida: se elimina.
          store.delete(cat.path);
        } else if (isDuplicateOfAnother) {
          store.delete(cat.path);
          store.put({ path: clean, parent: cat.parent || "" });
        }

        pending--;
        if (pending === 0) resolve();
      });
    };
  });
}

function cleanupDocumentPaths() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["documents"], "readwrite");
    const store = tx.objectStore("documents");
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const docs = req.result || [];
      if (docs.length === 0) return resolve();

      let pending = docs.length;
      docs.forEach((doc) => {
        const segments = String(doc.path).split("/");
        const name = segments.pop();
        const cleanPrefix = buildPath(...segments);
        const cleanName = sanitizeSegment(name);
        const cleanPath = cleanPrefix ? `${cleanPrefix}/${cleanName}` : cleanName;

        if (cleanPath !== doc.path) {
          doc.path = cleanPath;
          store.put(doc);
        }
        pending--;
        if (pending === 0) resolve();
      });
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
  try {
    await initDB();
    // Corrige primero cualquier dato ya corrupto de sesiones anteriores.
    await cleanupCorruptedCategories();
    await cleanupDocumentPaths();
    await ensureDefaultCategory("Gescannte Dokumente");
    await loadCategoriesToUI();
  } catch (e) {
    console.error("Error inicializando el almacenamiento local:", e);
    alert("No se pudo inicializar el almacenamiento local. Revisa la consola.");
  }
}

function ensureDefaultCategory(catName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["categories"], "readwrite");
    const store = transaction.objectStore("categories");
    const req = store.get(catName);
    req.onerror = () => reject(req.error);
    req.onsuccess = (e) => {
      if (!e.target.result) store.put({ path: catName, parent: "" });
      resolve();
    };
  });
}

// Ahora es una promesa REAL: el await de quien la llama espera a que el
// <select> ya esté repoblado, evitando la carrera entre llamadas solapadas
// que dejaba el desplegable atascado con datos viejos.
function loadCategoriesToUI() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["categories"], "readonly");
    const store = transaction.objectStore("categories");
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = async (event) => {
      const categories = event.target.result || [];
      const catSelect = document.getElementById("cat-select");
      const modalParentSelect = document.getElementById("modal-parent-cat");
      const t = translations[currentLang];

      if (catSelect) catSelect.innerHTML = "";
      if (modalParentSelect) modalParentSelect.innerHTML = `<option value="">${t.rootOption}</option>`;

      // Solo categorías puras principales (sin '/'), sin duplicados de valor.
      const topLevel = [...new Set(
        categories.filter(cat => !cat.path.includes('/')).map(cat => cat.path)
      )];

      topLevel.forEach(path => {
        if (catSelect) {
          const opt = document.createElement("option");
          opt.value = path; opt.innerText = path;
          catSelect.appendChild(opt);
        }
        if (modalParentSelect) {
          const opt2 = document.createElement("option");
          opt2.value = path; opt2.innerText = path;
          modalParentSelect.appendChild(opt2);
        }
      });

      try {
        await handleCatChange();
      } catch (e) {
        console.error("Error actualizando subcategorías:", e);
      }
      resolve();
    };
  });
}

// También promisificada por consistencia y para poder esperar su resultado.
function handleCatChange() {
  return new Promise((resolve, reject) => {
    const catSelect = document.getElementById("cat-select");
    const subSelect = document.getElementById("subcat-select");
    const t = translations[currentLang];
    if (!catSelect || !subSelect) return resolve();

    const selectedCat = catSelect.value;
    subSelect.innerHTML = `<option value=''>${t.noSubcat}</option>`;

    const transaction = db.transaction(["categories"], "readonly");
    const req = transaction.objectStore("categories").getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = (event) => {
      (event.target.result || []).forEach(cat => {
        // Buscar subcategorías que pertenezcan estrictamente a la categoría principal seleccionada
        if (selectedCat && cat.path.startsWith(selectedCat + '/') && cat.path.split('/').length === 2) {
          const subName = cat.path.split('/')[1];
          const opt = document.createElement("option");
          opt.value = subName; opt.innerText = subName;
          subSelect.appendChild(opt);
        }
      });
      resolve();
    };
  });
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

  if (!cat) {
    alert("No hay ninguna categoría seleccionada. Crea o elige una categoría antes de guardar.");
    return;
  }

  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const finalName = customName ? (customName.endsWith(ext) ? customName : `${customName}${ext}`) : file.name;

  // buildPath sanea cada segmento y colapsa duplicados consecutivos,
  // así "cat" nunca puede acabar repetido junto a sí mismo en la ruta.
  const fullPath = buildPath(cat, subcat, finalName);

  const reader = new FileReader();
  reader.onload = function(e) {
    const transaction = db.transaction(["documents"], "readwrite");
    const req = transaction.objectStore("documents").add({
      path: fullPath, name: finalName, category: cat, subcat: subcat,
      comment: comment, type: file.type, data: e.target.result,
      date: new Date().toISOString(), synced: false
    });
    req.onerror = () => {
      console.error("Error guardando documento:", req.error);
      alert("No se pudo guardar el documento localmente.");
    };
    req.onsuccess = () => {
      alert("¡Guardado con éxito en el móvil!");
      fileInput.value = "";
      document.getElementById("custom-name-input").value = "";
      document.getElementById("meta-comment").value = "";
    };
  };
  reader.onerror = () => alert("No se pudo leer el archivo seleccionado.");
  reader.readAsArrayBuffer(file);
}

function loadLocalExplorer() {
  const grid = document.getElementById("explorer-grid");
  if (!grid) return;
  grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px;'>Cargando...</div>";

  const req = db.transaction(["documents"], "readonly").objectStore("documents").getAll();
  req.onerror = () => {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#dc2626; padding:20px;">Error cargando documentos locales</div>`;
  };
  req.onsuccess = (event) => {
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
    const req = db.transaction(["documents"], "readwrite").objectStore("documents").delete(activeLocalDoc.id);
    req.onerror = () => alert("No se pudo eliminar el documento.");
    req.onsuccess = () => {
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

  await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = async (event) => {
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
  }).catch(e => console.error("Error leyendo documentos pendientes:", e));

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
        // buildPath también sanea lo que llega del PC, por si el servidor
        // ya tenía rutas duplicadas guardadas de antes.
        const relPath = buildPath(...decodeURIComponent(urlParts[1]).split('/'));
        if (!relPath) continue;

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
  const parent = sanitizeSegment(document.getElementById("modal-parent-cat").value);
  const mainCat = sanitizeSegment(document.getElementById("new-cat-input").value);
  const subCat = sanitizeSegment(document.getElementById("new-subcat-input").value);

  let targetPath = "";
  if (parent) {
    if (!subCat) { alert("Indica el nombre de la subcategoría"); return; }
    if (subCat === parent) {
      alert("La subcategoría no puede llamarse igual que la categoría padre.");
      return;
    }
    targetPath = buildPath(parent, subCat);
  } else if (mainCat) {
    targetPath = subCat ? buildPath(mainCat, subCat) : buildPath(mainCat);
  } else {
    alert("Indica un nombre para la categoría principal");
    return;
  }

  if (!targetPath) {
    alert("El nombre de la categoría no es válido.");
    return;
  }

  const transaction = db.transaction(["categories"], "readwrite");
  const req = transaction.objectStore("categories").put({ path: targetPath, parent: parent || "" });
  req.onerror = () => alert("No se pudo crear la categoría localmente.");
  req.onsuccess = async () => {
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
