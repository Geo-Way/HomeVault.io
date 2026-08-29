let currentLang = 'de';
let mediaStream = null;
let categoryData = {};
let currentExplorerPath = "";

const DEFAULT_CATEGORY = "Gescannte Dokumente";
const LAST_CAT_KEY = "homevault_last_category";
const LAST_SUBCAT_KEY = "homevault_last_subcategory";

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

// Extrae un mensaje de error legible de una respuesta fetch no-OK,
// sin asumir que el cuerpo es JSON válido.
async function extractErrorMessage(res) {
  try {
    const data = await res.json();
    return data.detail || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) {
      alert(`Error del servidor al cargar categorías: ${await extractErrorMessage(res)}`);
      return;
    }
    categoryData = await res.json();

    const catSelect = document.getElementById("cat-select");
    const modalParentSelect = document.getElementById("modal-parent-cat");

    catSelect.innerHTML = "";
    modalParentSelect.innerHTML = `<option value="">-- ${translations[currentLang].newMainCatLabel} --</option>`;

    const sortedCats = Object.keys(categoryData).sort();
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

    // Selecciona por defecto: la última categoría usada > "Gescannte Dokumente" > la primera de la lista.
    // Sin esto, el navegador selecciona la primera alfabética (p.ej. "Alexander Ariza"),
    // y los archivos parecen "perderse" al subirlos sin fijarse en el desplegable.
    const lastCat = localStorage.getItem(LAST_CAT_KEY);
    if (lastCat && sortedCats.includes(lastCat)) {
      catSelect.value = lastCat;
    } else if (sortedCats.includes(DEFAULT_CATEGORY)) {
      catSelect.value = DEFAULT_CATEGORY;
    }

    handleCatChange();

    const lastSubcat = localStorage.getItem(LAST_SUBCAT_KEY);
    if (lastSubcat) {
      const subSelect = document.getElementById("subcat-select");
      if ([...subSelect.options].some(o => o.value === lastSubcat)) {
        subSelect.value = lastSubcat;
      }
    }
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con el servidor. Revisa que server.py siga en marcha.");
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
  localStorage.setItem(LAST_CAT_KEY, selectedCat);
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
  const category = document.getElementById("cat-select").value;
  const subcategory = document.getElementById("subcat-select").value;

  if (!category) {
    alert(currentLang === 'de' ? "Bitte wählen Sie eine Kategorie aus." : "Selecciona una categoría antes de subir.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("category", category);
  formData.append("subcategory", subcategory);
  formData.append("custom_name", document.getElementById("custom-name-input").value);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const dest = subcategory ? `${category} / ${subcategory}` : category;
      alert((currentLang === 'de' ? "Gespeichert in: " : "Guardado en: ") + dest);
      fileInput.value = "";
      document.getElementById("custom-name-input").value = "";
      localStorage.setItem(LAST_SUBCAT_KEY, subcategory);
    } else {
      alert(`Error al guardar archivo: ${await extractErrorMessage(res)}`);
    }
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con el servidor al subir el archivo.");
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

  const category = document.getElementById("cat-select").value;
  const subcategory = document.getElementById("subcat-select").value;

  if (!category) {
    alert(currentLang === 'de' ? "Bitte wählen Sie eine Kategorie aus." : "Selecciona una categoría antes de guardar.");
    return;
  }

  const customName = document.getElementById("cam-custom-name").value;
  const formData = new FormData();
  formData.append("file", blob, `scan_${Date.now()}.${format}`);
  formData.append("category", category);
  formData.append("subcategory", subcategory);
  formData.append("custom_name", customName);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      stopCamera();
      document.getElementById("cam-custom-name").value = "";
      const dest = subcategory ? `${category} / ${subcategory}` : category;
      alert((currentLang === 'de' ? "Gespeichert in: " : "Guardado en: ") + dest);
      localStorage.setItem(LAST_SUBCAT_KEY, subcategory);
    } else {
      alert(`Error guardando el escaneo: ${await extractErrorMessage(res)}`);
    }
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con el servidor al guardar el escaneo.");
  }
}

function stopCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  document.getElementById("camera-modal").classList.add("hidden");
}

async function loadExplorerPath(path = "") {
  currentExplorerPath = path;
  renderBreadcrumbs();

  const grid = document.getElementById("explorer-grid");
  grid.innerHTML = `<p class="empty-msg">${currentLang === 'de' ? 'Lade...' : 'Cargando...'}</p>`;

  let res;
  try {
    res = await fetch(`/api/explorer?path=${encodeURIComponent(path)}`);
  } catch (err) {
    grid.innerHTML = `<p class="empty-msg">⚠️ ${currentLang === 'de' ? 'Server nicht erreichbar' : 'No se pudo conectar con el servidor'}</p>`;
    return;
  }

  if (!res.ok) {
    // Antes, cualquier error del servidor se mostraba como "carpeta vacía".
    // Ahora se muestra el error real para poder diagnosticarlo.
    const msg = await extractErrorMessage(res);
    grid.innerHTML = `<p class="empty-msg">⚠️ Error: ${msg}</p>`;
    return;
  }

  const data = await res.json();
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

  try {
    const res = await fetch("/api/categories", { method: "POST", body: formData });
    if (res.ok) {
      closeCategoryModal();
      document.getElementById("new-cat-input").value = "";
      document.getElementById("new-subcat-input").value = "";
      await loadCategories();
    } else {
      alert(`Error al crear la categoría: ${await extractErrorMessage(res)}`);
    }
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con el servidor al crear la categoría.");
  }
}
