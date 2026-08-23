let currentLang = 'de';
let mediaStream = null;
let categoryData = {};
let currentExplorerPath = "";
let db = null;

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

// --- INICIALIZACIÓN DE INDEXEDDB ---
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HomeVaultDB", 1);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains("categories")) {
        database.createObjectStore("categories", { keyPath: "name" });
      }
      if (!database.objectStoreNames.contains("documents")) {
        database.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      seedDefaultCategories().then(resolve);
    };
    request.onerror = (e) => reject(e);
  });
}

async function seedDefaultCategories() {
  const tx = db.transaction("categories", "readwrite");
  const store = tx.objectStore("categories");
  const countReq = store.count();
  return new Promise(resolve => {
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          store.put({ name: cat, subcategories: [] });
        }
      }
      resolve();
    };
  });
}

function verifyPin() {
  const inputPin = document.getElementById("pin-input").value;
  if (inputPin === "3172") {
    document.getElementById("pin-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    initDB().then(() => loadCategories());
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
  const tx = db.transaction("categories", "readonly");
  const store = tx.objectStore("categories");
  const req = store.getAll();
  req.onsuccess = () => {
    categoryData = {};
    req.result.forEach(item => {
      categoryData[item.name] = item.subcategories || [];
    });
    
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
  };
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
  
  const file = fileInput.files[0];
  const cat = document.getElementById("cat-select").value;
  const subcat = document.getElementById("subcat-select").value;
  const customName = document.getElementById("custom-name-input").value;

  const originalExt = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  let finalName = file.name;
  if (customName && customName.trim() !== "") {
    finalName = customName.trim().endsWith(originalExt) ? customName.trim() : `${customName.trim()}${originalExt}`;
  }

  await saveDocumentToDB({
    name: finalName,
    category: cat,
    subcategory: subcat,
    type: file.type,
    blob: file,
    path: subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`
  });

  alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado con éxito!");
  fileInput.value = "";
  document.getElementById("custom-name-input").value = "";
}

function saveDocumentToDB(docRecord) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("documents", "readwrite");
    const store = tx.objectStore("documents");
    const req = store.add(docRecord);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
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

  await saveDocumentToDB({
    name: finalName,
    category: cat,
    subcategory: subcat,
    type: mimeType,
    blob: blob,
    path: subcat ? `${cat}/${subcat}/${finalName}` : `${cat}/${finalName}`
  });

  stopCamera();
  document.getElementById("cam-custom-name").value = "";
  alert(currentLang === 'de' ? "Gespeichert!" : "¡Guardado!");
}

function stopCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  document.getElementById("camera-modal").classList.add("hidden");
}

async function loadExplorerPath(path = "") {
  currentExplorerPath = path;
  renderBreadcrumbs();

  const grid = document.getElementById("explorer-grid");
  grid.innerHTML = "";

  const parts = path ? path.split("/") : [];
  const currentDepth = parts.length;

  if (currentDepth === 0) {
    // RAÍZ: Mostrar carpetas principales
    const tx = db.transaction("categories", "readonly");
    const store = tx.objectStore("categories");
    store.getAll().onsuccess = (e) => {
      const categories = e.target.result.sort((a,b) => a.name.localeCompare(b.name));
      categories.forEach(cat => {
        renderExplorerCard(grid, { name: cat.name, isDir: true, path: cat.name });
      });
    };
  } else if (currentDepth === 1) {
    // DENTRO DE CATEGORÍA: Mostrar subcategorías y archivos en raíz de categoría
    const catName = parts[0];
    const tx = db.transaction(["categories", "documents"], "readonly");
    const catStore = tx.objectStore("categories");
    const docStore = tx.objectStore("documents");

    catStore.get(catName).onsuccess = (e) => {
      const catData = e.target.result;
      if (catData && catData.subcategories) {
        catData.subcategories.sort().forEach(sub => {
          renderExplorerCard(grid, { name: sub, isDir: true, path: `${catName}/${sub}` });
        });
      }
    };

    docStore.getAll().onsuccess = (e) => {
      const docs = e.target.result.filter(d => d.category === catName && !d.subcategory);
      docs.forEach(doc => {
        renderExplorerCard(grid, { name: doc.name, isDir: false, doc: doc });
      });
    };
  } else if (currentDepth === 2) {
    // DENTRO DE SUBCATEGORÍA: Mostrar archivos de la subcategoría
    const [catName, subName] = parts;
    const tx = db.transaction("documents", "readonly");
    const docStore = tx.objectStore("documents");
    docStore.getAll().onsuccess = (e) => {
      const docs = e.target.result.filter(d => d.category === catName && d.subcategory === subName);
      docs.forEach(doc => {
        renderExplorerCard(grid, { name: doc.name, isDir: false, doc: doc });
      });
    };
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
    const fileUrl = URL.createObjectURL(item.doc.blob);
    
    card.innerHTML = `
      <div class="icon">📄</div>
      <div class="name" title="${item.name}">${item.name}</div>
      <div class="card-actions">
        <button onclick="window.open('${fileUrl}')">${translations[currentLang].viewBtn}</button>
        <button onclick="printDoc('${fileUrl}')">${translations[currentLang].printBtn}</button>
        <button onclick="sendEmail('${item.name}')">${translations[currentLang].emailBtn}</button>
        <button onclick="deleteDoc(${item.doc.id})" style="color:red; border-color:red;">${translations[currentLang].deleteBtn}</button>
      </div>
    `;
  }
  container.appendChild(card);
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

function sendEmail(fileName) {
  const subject = encodeURIComponent(`Dokument: ${fileName}`);
  const body = encodeURIComponent(`Hallo,

anbei befindet sich das Dokument "${fileName}".

Viele Grüße`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function printDoc(url) {
  const win = window.open(url, '_blank');
  win.onload = () => win.print();
}

async function deleteDoc(id) {
  if (confirm(currentLang === 'de' ? "Dokument wirklich löschen?" : "¿Desea eliminar este documento?")) {
    const tx = db.transaction("documents", "readwrite");
    tx.objectStore("documents").delete(id);
    tx.oncomplete = () => loadExplorerPath(currentExplorerPath);
  }
}

function openCategoryModal() {
  document.getElementById("modal-parent-cat").value = "";
  toggleModalCatInput();
  document.getElementById("new-cat-modal").classList.remove("hidden");
}
function closeCategoryModal() { document.getElementById("new-cat-modal").classList.add("hidden"); }

async function createNewCategory() {
  const selectedParent = document.getElementById("modal-parent-cat").value;
  const catInput = document.getElementById("new-cat-input").value.trim();
  const subInput = document.getElementById("new-subcat-input").value.trim();

  const tx = db.transaction("categories", "readwrite");
  const store = tx.objectStore("categories");

  if (selectedParent) {
    store.get(selectedParent).onsuccess = (e) => {
      const parentRecord = e.target.result;
      if (parentRecord && subInput) {
        if (!parentRecord.subcategories.includes(subInput)) {
          parentRecord.subcategories.push(subInput);
          store.put(parentRecord);
        }
      }
    };
  } else if (catInput) {
    store.get(catInput).onsuccess = (e) => {
      let record = e.target.result || { name: catInput, subcategories: [] };
      if (subInput && !record.subcategories.includes(subInput)) {
        record.subcategories.push(subInput);
      }
      store.put(record);
    };
  } else {
    alert(currentLang === 'de' ? "Bitte Kategorie eingeben" : "Ingrese una categoría");
    return;
  }

  tx.oncomplete = () => {
    closeCategoryModal();
    document.getElementById("new-cat-input").value = "";
    document.getElementById("new-subcat-input").value = "";
    loadCategories();
  };
}
