/* HomeVault - app.js
   Matches index.html (IndexedDB local storage + optional WebDAV sync to server.py)
*/

const DB_NAME = "homevault_db";
const DB_VERSION = 1;
const STORE_CATEGORIES = "categories";
const STORE_DOCUMENTS = "documents";
const LANG_KEY = "homevault_lang";
const LAST_CAT_KEY = "homevault_last_category";
const LAST_SUBCAT_KEY = "homevault_last_subcategory";

let db = null;
let currentLang = "de";
let categoryData = {}; // { [categoryName]: { name, subcategories: [] } }
let currentExplorerPath = ""; // "" | "Cat" | "Cat/Sub"
let currentDetailDocId = null;
let lastObjectUrl = null;

/* ---------------- Translations ---------------- */

const T = {
  de: {
    "t-login-title": "🔐 HomeVault Anmelden",
    "t-pin-label": "PIN eingeben:",
    "t-login-btn": "Anmelden",
    "t-nav-scan": "📤 Erfassen",
    "t-nav-explore": "📁 Lokal",
    "t-nav-sync": "🔄 PC Sync",
    "t-cat-label": "Kategorie (Hauptordner):",
    "t-subcat-label": "Unterkategorie (Optional):",
    "t-file-label": "Datei oder Foto:",
    "t-name-label": "Dateiname (Optional):",
    "t-comment-label": "Kommentar / Metadaten (Optional):",
    "t-save-btn": "Lokal auf dem Handy speichern",
    "t-refresh-btn": "🔄 Aktualisieren",
    "t-sync-desc": "Stelle sicher, dass dein Computer eingeschaltet ist und der Python-Server läuft.",
    "t-ip-label": "IP des PCs (z.B. 192.168.1.50 oder localhost):",
    "t-sync-btn": "Alles jetzt an den PC senden",
    "t-modal-title": "Kategorie / Ordner erstellen",
    "t-modal-parent-label": "In bestehende Kategorie verschieben (Optional):",
    "t-modal-main-label": "Name der neuen Hauptkategorie:",
    "t-modal-sub-label": "Oder Name der Unterkategorie:",
    "t-modal-create-btn": "Erstellen",
    "t-modal-cancel-btn": "Abbrechen",
    "t-det-comment": "Kommentar / Notiz:",
    "t-btn-print": "🖨️ Drucken / Imprimir",
    "t-btn-open": "👁️ Öffnen / Ver",
    "t-btn-delete": "🗑️ Löschen / Eliminar",
    "t-btn-close": "Schließen / Cerrar",
    ph_customName: "z.B. rechnung",
    ph_comment: "Notizen...",
    ph_newCat: "Z.B. Rechnungen",
    ph_newSubcat: "Z.B. Februar",
    noneOption: "-- Keine --",
    createMainOption: "-- Keine (Hauptkategorie erstellen) --",
    emptyFolder: "Ordner ist leer",
    loading: "Lade...",
    wrongPin: "Falscher PIN",
    pickCategory: "Bitte wähle eine Kategorie aus.",
    pickFile: "Bitte wähle eine Datei aus.",
    savedIn: "Gespeichert in: ",
    needMainCat: "Bitte Hauptkategorie angeben.",
    subEqualsParent: "Die Unterkategorie darf nicht denselben Namen wie die Hauptkategorie haben.",
    catCreated: "Kategorie erstellt.",
    confirmDelete: "Dieses Dokument wirklich löschen?",
    noComment: "(kein Kommentar)",
    enterIp: "Bitte gib die IP-Adresse deines PCs ein.",
    noDocsToSync: "Es gibt keine lokalen Dokumente zum Synchronisieren.",
    syncing: "Synchronisiere...",
    syncDone: (ok, fail) => `Synchronisierung abgeschlossen: ${ok} erfolgreich, ${fail} fehlgeschlagen.`,
    syncConnFail: "Verbindung zum PC fehlgeschlagen. Prüfe die IP-Adresse und ob server.py läuft.",
    storageError: "Speicherfehler. Bitte versuche es erneut.",
    root: "Hauptverzeichnis"
  },
  es: {
    "t-login-title": "🔐 Ingreso a HomeVault",
    "t-pin-label": "Ingresa el PIN:",
    "t-login-btn": "Ingresar",
    "t-nav-scan": "📤 Capturar",
    "t-nav-explore": "📁 Local",
    "t-nav-sync": "🔄 Sincronizar PC",
    "t-cat-label": "Categoría (carpeta principal):",
    "t-subcat-label": "Subcategoría (Opcional):",
    "t-file-label": "Archivo o foto:",
    "t-name-label": "Nombre de archivo (Opcional):",
    "t-comment-label": "Comentario / Metadatos (Opcional):",
    "t-save-btn": "Guardar localmente en el teléfono",
    "t-refresh-btn": "🔄 Actualizar",
    "t-sync-desc": "Asegúrate de que tu ordenador esté encendido y el servidor de Python en marcha.",
    "t-ip-label": "IP del PC (ej. 192.168.1.50 o localhost):",
    "t-sync-btn": "Enviar todo al PC ahora",
    "t-modal-title": "Crear categoría / carpeta",
    "t-modal-parent-label": "Mover a categoría existente (Opcional):",
    "t-modal-main-label": "Nombre de la nueva categoría principal:",
    "t-modal-sub-label": "O nombre de la subcategoría:",
    "t-modal-create-btn": "Crear",
    "t-modal-cancel-btn": "Cancelar",
    "t-det-comment": "Comentario / Nota:",
    "t-btn-print": "🖨️ Imprimir",
    "t-btn-open": "👁️ Ver",
    "t-btn-delete": "🗑️ Eliminar",
    "t-btn-close": "Cerrar",
    ph_customName: "ej. factura",
    ph_comment: "Notas...",
    ph_newCat: "Ej. Facturas",
    ph_newSubcat: "Ej. Febrero",
    noneOption: "-- Ninguna --",
    createMainOption: "-- Ninguna (crear categoría principal) --",
    emptyFolder: "La carpeta está vacía",
    loading: "Cargando...",
    wrongPin: "PIN incorrecto",
    pickCategory: "Por favor selecciona una categoría.",
    pickFile: "Por favor selecciona un archivo.",
    savedIn: "Guardado en: ",
    needMainCat: "Por favor indica una categoría principal.",
    subEqualsParent: "La subcategoría no puede llamarse igual que la categoría principal.",
    catCreated: "Categoría creada.",
    confirmDelete: "¿Seguro que quieres eliminar este documento?",
    noComment: "(sin comentario)",
    enterIp: "Por favor ingresa la IP de tu PC.",
    noDocsToSync: "No hay documentos locales para sincronizar.",
    syncing: "Sincronizando...",
    syncDone: (ok, fail) => `Sincronización completa: ${ok} exitosos, ${fail} con error.`,
    syncConnFail: "No se pudo conectar con el PC. Revisa la IP y que server.py esté corriendo.",
    storageError: "Error de almacenamiento. Inténtalo de nuevo.",
    root: "Directorio Principal"
  }
};

function t(key) {
  const val = T[currentLang][key];
  return val !== undefined ? val : T.de[key];
}

function changeLanguage(lang) {
  if (!T[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);

  Object.keys(T[lang]).forEach(key => {
    if (key.startsWith("t-")) {
      const el = document.getElementById(key);
      if (el) el.innerText = T[lang][key];
    }
  });

  document.getElementById("custom-name-input")?.setAttribute("placeholder", t("ph_customName"));
  document.getElementById("meta-comment")?.setAttribute("placeholder", t("ph_comment"));
  document.getElementById("new-cat-input")?.setAttribute("placeholder", t("ph_newCat"));
  document.getElementById("new-subcat-input")?.setAttribute("placeholder", t("ph_newSubcat"));

  const langSelect = document.getElementById("lang-select");
  if (langSelect) langSelect.value = lang;

  // Refresh dynamic option labels without losing current selection
  if (!document.getElementById("app-container")?.classList.contains("hidden")) {
    refreshCategorySelects();
    if (!document.getElementById("explore-view")?.classList.contains("hidden")) {
      loadLocalExplorer();
    }
  }
}

/* ---------------- Path sanitization ---------------- */

function sanitizeSegment(name) {
  return (name || "")
    .toString()
    .replace(/[\/\\]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/* ---------------- IndexedDB helpers (real promises) ---------------- */

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const _db = e.target.result;
      if (!_db.objectStoreNames.contains(STORE_CATEGORIES)) {
        _db.createObjectStore(STORE_CATEGORIES, { keyPath: "name" });
      }
      if (!_db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        _db.createObjectStore(STORE_DOCUMENTS, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function idbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- Login / init ---------------- */

function verifyPin() {
  const val = document.getElementById("pin-input").value;
  if (val === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    initAppStorage().catch(err => {
      console.error(err);
      alert(t("storageError"));
    });
  } else {
    alert(t("wrongPin"));
  }
}

async function initAppStorage() {
  db = await openDatabase();
  await loadCategoriesToUI();
  showView("scan-view");
}

/* ---------------- Categories ---------------- */

async function loadCategoriesToUI() {
  const records = await idbGetAll(STORE_CATEGORIES);
  categoryData = {};
  records.forEach(rec => { categoryData[rec.name] = rec; });
  refreshCategorySelects();
}

function refreshCategorySelects() {
  const catSelect = document.getElementById("cat-select");
  const modalParentSelect = document.getElementById("modal-parent-cat");
  if (!catSelect || !modalParentSelect) return;

  const prevCat = catSelect.value;
  catSelect.innerHTML = "";
  modalParentSelect.innerHTML = `<option value="">${t("createMainOption")}</option>`;

  const sortedCats = Object.keys(categoryData).sort((a, b) => a.localeCompare(b));
  sortedCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.innerText = cat;
    catSelect.appendChild(opt);

    const modalOpt = document.createElement("option");
    modalOpt.value = cat;
    modalOpt.innerText = cat;
    modalParentSelect.appendChild(modalOpt);
  });

  const lastCat = localStorage.getItem(LAST_CAT_KEY);
  if (sortedCats.includes(prevCat)) {
    catSelect.value = prevCat;
  } else if (lastCat && sortedCats.includes(lastCat)) {
    catSelect.value = lastCat;
  } else if (sortedCats.length > 0) {
    catSelect.value = sortedCats[0];
  }

  handleCatChange();
}

function handleCatChange() {
  const selectedCat = document.getElementById("cat-select").value;
  const subSelect = document.getElementById("subcat-select");
  if (!subSelect) return;

  const prevSub = subSelect.value;
  subSelect.innerHTML = `<option value="">${t("noneOption")}</option>`;

  const rec = categoryData[selectedCat];
  if (rec && Array.isArray(rec.subcategories)) {
    rec.subcategories.slice().sort((a, b) => a.localeCompare(b)).forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.innerText = sub;
      subSelect.appendChild(opt);
    });
  }

  const lastSubcat = localStorage.getItem(LAST_SUBCAT_KEY);
  if ([...subSelect.options].some(o => o.value === prevSub) && prevSub) {
    subSelect.value = prevSub;
  } else if (lastSubcat && [...subSelect.options].some(o => o.value === lastSubcat)) {
    subSelect.value = lastSubcat;
  }

  if (selectedCat) localStorage.setItem(LAST_CAT_KEY, selectedCat);
}

function openCategoryModal() {
  document.getElementById("modal-parent-cat").value = "";
  document.getElementById("new-cat-input").value = "";
  document.getElementById("new-subcat-input").value = "";
  document.getElementById("new-cat-modal").classList.remove("hidden");
}

function closeCategoryModal() {
  document.getElementById("new-cat-modal").classList.add("hidden");
}

async function createNewCategory() {
  const selectedParent = document.getElementById("modal-parent-cat").value;
  const rawMain = document.getElementById("new-cat-input").value;
  const rawSub = document.getElementById("new-subcat-input").value;

  try {
    if (selectedParent) {
      // Adding a subcategory to an existing category
      const subName = sanitizeSegment(rawSub);
      if (!subName) {
        alert(t("needMainCat"));
        return;
      }
      if (subName.toLowerCase() === selectedParent.toLowerCase()) {
        alert(t("subEqualsParent"));
        return;
      }
      const rec = categoryData[selectedParent] || { name: selectedParent, subcategories: [] };
      if (!rec.subcategories.some(s => s.toLowerCase() === subName.toLowerCase())) {
        rec.subcategories.push(subName);
      }
      await idbPut(STORE_CATEGORIES, rec);
    } else {
      // Creating a brand new main category (optionally with a subcategory)
      const mainName = sanitizeSegment(rawMain);
      if (!mainName) {
        alert(t("needMainCat"));
        return;
      }
      const subName = sanitizeSegment(rawSub);
      if (subName && subName.toLowerCase() === mainName.toLowerCase()) {
        alert(t("subEqualsParent"));
        return;
      }
      const existing = categoryData[mainName];
      const rec = existing || { name: mainName, subcategories: [] };
      if (subName && !rec.subcategories.some(s => s.toLowerCase() === subName.toLowerCase())) {
        rec.subcategories.push(subName);
      }
      await idbPut(STORE_CATEGORIES, rec);
    }

    await loadCategoriesToUI();
    closeCategoryModal();
  } catch (err) {
    console.error(err);
    alert(t("storageError"));
  }
}

/* ---------------- Views / nav ---------------- */

function showView(viewId) {
  ["scan-view", "explore-view", "sync-view"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById(viewId)?.classList.remove("hidden");
  if (viewId === "explore-view") {
    currentExplorerPath = "";
    loadLocalExplorer();
  }
}

/* ---------------- Save document ---------------- */

async function saveDocumentLocally() {
  const category = document.getElementById("cat-select").value;
  const subcategory = document.getElementById("subcat-select").value;
  const fileInput = document.getElementById("file-input");
  const customNameRaw = document.getElementById("custom-name-input").value;
  const comment = document.getElementById("meta-comment").value;

  if (!category) {
    alert(t("pickCategory"));
    return;
  }
  if (!fileInput.files || fileInput.files.length === 0) {
    alert(t("pickFile"));
    return;
  }

  const file = fileInput.files[0];
  let filename = sanitizeSegment(customNameRaw);
  const extMatch = file.name.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : "";
  if (filename) {
    if (!filename.toLowerCase().endsWith(ext.toLowerCase()) && ext) filename += ext;
  } else {
    filename = file.name;
  }

  const record = {
    category,
    subcategory: subcategory || "",
    filename,
    mime: file.type || "application/octet-stream",
    comment: comment || "",
    blob: file,
    createdAt: Date.now()
  };

  try {
    await idbPut(STORE_DOCUMENTS, record);
    const dest = subcategory ? `${category} / ${subcategory}` : category;
    alert(t("savedIn") + dest);
    fileInput.value = "";
    document.getElementById("custom-name-input").value = "";
    document.getElementById("meta-comment").value = "";
    if (subcategory) localStorage.setItem(LAST_SUBCAT_KEY, subcategory);
  } catch (err) {
    console.error(err);
    alert(t("storageError"));
  }
}

/* ---------------- Explorer ---------------- */

function ensureBreadcrumbBar() {
  let bar = document.getElementById("explorer-breadcrumbs");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "explorer-breadcrumbs";
    bar.style.fontSize = "13px";
    bar.style.marginBottom = "8px";
    bar.style.color = "#475569";
    const grid = document.getElementById("explorer-grid");
    grid.parentNode.insertBefore(bar, grid);
  }
  return bar;
}

function renderBreadcrumbs() {
  const bar = ensureBreadcrumbBar();
  if (!currentExplorerPath) {
    bar.innerHTML = `<strong>📂 ${t("root")}</strong>`;
    return;
  }
  const parts = currentExplorerPath.split("/");
  let acc = "";
  let html = `<a href="javascript:void(0)" onclick="loadLocalExplorer('')">📂 ${t("root")}</a>`;
  parts.forEach((p, i) => {
    acc = i === 0 ? p : `${acc}/${p}`;
    const target = acc;
    if (i === parts.length - 1) {
      html += ` / <strong>${p}</strong>`;
    } else {
      html += ` / <a href="javascript:void(0)" onclick="loadLocalExplorer('${target.replace(/'/g, "\\'")}')">${p}</a>`;
    }
  });
  bar.innerHTML = html;
}

async function loadLocalExplorer(path) {
  if (path !== undefined) currentExplorerPath = path;
  renderBreadcrumbs();

  const grid = document.getElementById("explorer-grid");
  grid.innerHTML = `<p class="empty-msg" style="grid-column:1/-1;color:#888;">${t("loading")}</p>`;

  let categories, documents;
  try {
    [categories, documents] = await Promise.all([
      idbGetAll(STORE_CATEGORIES),
      idbGetAll(STORE_DOCUMENTS)
    ]);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-msg" style="grid-column:1/-1;color:#888;">⚠️ ${t("storageError")}</p>`;
    return;
  }

  grid.innerHTML = "";
  const cards = [];

  if (!currentExplorerPath) {
    // Root: show each category as a folder
    categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(cat => {
        cards.push(makeFolderCard(cat.name, () => loadLocalExplorer(cat.name)));
      });
  } else {
    const parts = currentExplorerPath.split("/");
    const catName = parts[0];
    const subName = parts[1];

    if (!subName) {
      // Inside a category: show its subcategories, then its own files (no subcategory)
      const rec = categoryData[catName] || categories.find(c => c.name === catName);
      if (rec && Array.isArray(rec.subcategories)) {
        rec.subcategories.slice().sort((a, b) => a.localeCompare(b)).forEach(sub => {
          cards.push(makeFolderCard(sub, () => loadLocalExplorer(`${catName}/${sub}`)));
        });
      }
      documents
        .filter(d => d.category === catName && !d.subcategory)
        .forEach(doc => cards.push(makeFileCard(doc)));
    } else {
      // Inside a subcategory: show its files
      documents
        .filter(d => d.category === catName && d.subcategory === subName)
        .forEach(doc => cards.push(makeFileCard(doc)));
    }
  }

  if (cards.length === 0) {
    grid.innerHTML = `<p class="empty-msg" style="grid-column:1/-1;color:#888;">${t("emptyFolder")}</p>`;
    return;
  }
  cards.forEach(c => grid.appendChild(c));
}

function makeFolderCard(name, onClick) {
  const card = document.createElement("div");
  card.className = "explorer-card";
  card.innerHTML = `<div class="icon">📁</div><div class="name">${name}</div>`;
  card.onclick = onClick;
  return card;
}

function makeFileCard(doc) {
  const card = document.createElement("div");
  card.className = "explorer-card";
  card.innerHTML = `<div class="icon">📄</div><div class="name">${doc.filename}</div>`;
  card.onclick = () => openFileDetails(doc.id);
  return card;
}

/* ---------------- File details modal ---------------- */

async function openFileDetails(id) {
  const doc = await idbGet(STORE_DOCUMENTS, id);
  if (!doc) return;
  currentDetailDocId = id;
  document.getElementById("modal-file-title").innerText = `📄 ${doc.filename}`;
  document.getElementById("modal-file-comment").innerText = doc.comment || t("noComment");
  document.getElementById("file-details-modal").classList.remove("hidden");
}

function closeFileDetailsModal() {
  document.getElementById("file-details-modal").classList.add("hidden");
  currentDetailDocId = null;
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = null;
  }
}

async function viewCurrentDoc() {
  if (currentDetailDocId === null) return;
  const doc = await idbGet(STORE_DOCUMENTS, currentDetailDocId);
  if (!doc) return;
  if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
  lastObjectUrl = URL.createObjectURL(doc.blob);
  window.open(lastObjectUrl, "_blank");
}

async function printCurrentDoc() {
  if (currentDetailDocId === null) return;
  const doc = await idbGet(STORE_DOCUMENTS, currentDetailDocId);
  if (!doc) return;
  if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
  lastObjectUrl = URL.createObjectURL(doc.blob);
  const win = window.open(lastObjectUrl, "_blank");
  if (win) win.onload = () => win.print();
}

async function deleteCurrentDoc() {
  if (currentDetailDocId === null) return;
  if (!confirm(t("confirmDelete"))) return;
  try {
    await idbDelete(STORE_DOCUMENTS, currentDetailDocId);
    closeFileDetailsModal();
    loadLocalExplorer(currentExplorerPath);
  } catch (err) {
    console.error(err);
    alert(t("storageError"));
  }
}

/* ---------------- Sync to PC ---------------- */

function buildSyncBaseUrl(rawIp) {
  let ip = rawIp.trim();
  if (!/^https?:\/\//i.test(ip)) ip = `http://${ip}`;
  if (!/:\d+$/.test(ip)) ip = `${ip}:8080`;
  return ip;
}

async function syncToPC() {
  const ipInput = document.getElementById("pc-ip-input");
  const rawIp = ipInput.value;
  if (!rawIp.trim()) {
    alert(t("enterIp"));
    return;
  }

  let documents;
  try {
    documents = await idbGetAll(STORE_DOCUMENTS);
  } catch (err) {
    console.error(err);
    alert(t("storageError"));
    return;
  }

  if (documents.length === 0) {
    alert(t("noDocsToSync"));
    return;
  }

  const baseUrl = buildSyncBaseUrl(rawIp);
  let ok = 0, fail = 0;

  for (const doc of documents) {
    const segments = [doc.category, doc.subcategory, doc.filename]
      .filter(Boolean)
      .map(s => encodeURIComponent(s));
    const targetUrl = `${baseUrl}/Public/${segments.join("/")}`;

    try {
      const res = await fetch(targetUrl, {
        method: "PUT",
        headers: {
          "X-Category": encodeURIComponent(doc.category || ""),
          "X-Comment": encodeURIComponent((doc.comment || "").replace(/[\r\n]+/g, " "))
        },
        body: doc.blob
      });
      if (res.ok) ok++; else fail++;
    } catch (err) {
      console.error("Sync error for", doc.filename, err);
      fail++;
    }
  }

  if (ok === 0 && fail > 0) {
    alert(t("syncConnFail"));
  } else {
    alert(t("syncDone")(ok, fail));
  }
}

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem(LANG_KEY);
  if (savedLang && T[savedLang]) changeLanguage(savedLang);

  document.getElementById("pin-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyPin();
  });
});
