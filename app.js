let currentLang = localStorage.getItem("homevault_lang") || "es";
function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("homevault_lang", lang);
}

const DB_NAME = "HomeVaultSimpleDB";
const DB_VERSION = 1;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains("documents")) {
        database.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function verifyPin() {
  const pinInput = document.getElementById("pin-input");
  if (pinInput && pinInput.value === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    initDB();
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

async function saveDocumentLocally() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput || !fileInput.files.length) {
    alert("Selecciona un archivo."); return;
  }
  const file = fileInput.files[0];
  const cat = document.getElementById("cat-input").value.trim() || "Gescannte Dokumente";
  const subcat = document.getElementById("subcat-input").value.trim();
  const customName = document.getElementById("custom-name-input").value.trim();
  const comment = document.getElementById("meta-comment").value.trim();

  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const finalName = customName ? (customName.endsWith(ext) ? customName : `${customName}${ext}`) : file.name;
  
  // Construcción de ruta 100% limpia sin duplicaciones
  let fullPath = subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`;
  fullPath = fullPath.replace(/\/+/g, '/'); // Evita barras dobles

  const reader = new FileReader();
  reader.onload = function(e) {
    if (!db) { initDB().then(() => storeDoc(fullPath, finalName, cat, subcat, comment, file.type, e.target.result)); }
    else { storeDoc(fullPath, finalName, cat, subcat, comment, file.type, e.target.result); }
  };
  reader.readAsArrayBuffer(file);
}

function storeDoc(path, name, category, subcat, comment, type, data) {
  const transaction = db.transaction(["documents"], "readwrite");
  transaction.objectStore("documents").add({
    path, name, category, subcat, comment, type, data,
    date: new Date().toISOString(), synced: false
  }).onsuccess = () => {
    alert("¡Guardado con éxito en el móvil!");
    document.getElementById("file-input").value = "";
    document.getElementById("custom-name-input").value = "";
    document.getElementById("meta-comment").value = "";
  };
}

function loadLocalExplorer() {
  const grid = document.getElementById("explorer-grid");
  if (!grid) return;
  grid.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px;'>Cargando...</div>";

  if (!db) {
    initDB().then(() => fetchDocsForGrid(grid));
  } else {
    fetchDocsForGrid(grid);
  }
}

function fetchDocsForGrid(grid) {
  db.transaction(["documents"], "readonly").objectStore("documents").getAll().onsuccess = (event) => {
    const docs = event.target.result;
    grid.innerHTML = "";
    if (docs.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#64748b; padding:20px;">No hay documentos locales</div>`;
      return;
    }
    docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "explorer-card";
      card.innerHTML = `
        <div style="font-size:24px;">📄</div>
        <div style="font-size:12px; font-weight:bold; word-break:break-all;">${doc.name}</div>
        <div style="font-size:10px; color:#2563eb;">📂 ${doc.path}</div>
        <div style="font-size:11px; color:var(--primary); font-weight:600; margin-top:4px;">${doc.synced ? '✅ Sync' : '⏳ Pendiente'}</div>
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
  if (confirm("¿Eliminar documento?")) {
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

  if (!db) await initDB();

  // 1. Subir pendientes al PC
  await new Promise((resolve) => {
    const tx = db.transaction(["documents"], "readwrite");
    const store = tx.objectStore("documents");
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

  // 2. Descargar del PC
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

window.verifyPin = verifyPin;
window.showView = showView;
window.saveDocumentLocally = saveDocumentLocally;
window.loadLocalExplorer = loadLocalExplorer;
window.openLocalFileDetails = openLocalFileDetails;
window.closeFileDetailsModal = closeFileDetailsModal;
window.viewCurrentDoc = viewCurrentDoc;
window.printCurrentDoc = printCurrentDoc;
window.deleteCurrentDoc = deleteCurrentDoc;
window.syncToPC = syncToPC;
window.changeLanguage = changeLanguage;