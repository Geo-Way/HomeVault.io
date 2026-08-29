let db;
let idiomaActual = 'de';
let archivoSeleccionadoGlobal = null;
let categoriasExtra = [];
let rutaActualCarpeta = ""; 

const trads = {
    de: {
        loginTitle: "Anmelden",
        loginPlaceholder: "PIN eingeben",
        loginBtn: "Einloggen",
        loginError: "Falsche PIN.",
        path1Title: "Neues Dokument",
        fileLabel: "📷 Dokument scannen oder Datei hochladen",
        noFile: "Keine Datei ausgewählt",
        formatLabel: "Format:",
        catLabel: "Ordner / Kategorie:",
        defaultCategory: "Allgemein",
        changeCreateBtn: "Ändern / Erstellen",
        comPlaceholder: "Notiz (optional)...",
        saveBtn: "Auf dem Handy speichern",
        path2Title: "Dateien & PC verwalten",
        path2Desc: "Ordner durchsuchen, anzeigen oder mit dem PC synchronisieren.",
        openManagerBtn: "📂 Meine Dokumente öffnen",
        backBtn: "⬅️ Zurück",
        syncBtn: "🔄 Mit PC synchronisieren",
        emptyFolder: "Dieser Ordner ist leer.",
        successSave: "Erfolgreich gespeichert!",
        successSync: "Erfolgreich mit dem PC synchronisiert!",
        errorSync: "Verbindungsfehler zum PC.",
        btnView: "👁️ Ansehen",
        btnPrint: "🖨️ Drucken",
        btnEmail: "✉️ E-Mail",
        btnDelete: "🗑️ Löschen",
        confirmDelete: "Möchten Sie dieses Dokument wirklich löschen?",
        modalTitle: "Ordner verwalten",
        modalSelectExistingLabel: "Vorhandenen Ordner wählen:",
        modalTypeLabel: "Oder neu erstellen:",
        optNone: "-- Oben ausgewähltes verwenden --",
        optMain: "📁 Neuer Hauptordner",
        optSub: "📂 Unterordner erstellen",
        modalParentLabel: "Übergeordneter Ordner:",
        modalNameLabel: "Name des neuen Ordners:",
        modalBtnCancel: "Abbrechen",
        modalBtnSave: "Übernehmen"
    },
    es: {
        loginTitle: "Iniciar Sesión",
        loginPlaceholder: "Introduce el PIN",
        loginBtn: "Entrar",
        loginError: "PIN incorrecto.",
        path1Title: "Nuevo Documento",
        fileLabel: "📷 Tocar para escanear o subir archivo",
        noFile: "Ningún archivo seleccionado",
        formatLabel: "Formato:",
        catLabel: "Carpeta / Categoría:",
        defaultCategory: "General",
        changeCreateBtn: "Cambiar / Crear",
        comPlaceholder: "Nota (opcional)...",
        saveBtn: "Guardar en el Móvil",
        path2Title: "Ver Archivos y PC",
        path2Desc: "Explora tus carpetas guardadas o sincroniza con tu PC.",
        openManagerBtn: "📂 Abrir Mis Documentos",
        backBtn: "⬅️ Volver",
        syncBtn: "🔄 Sincronizar todo con el PC",
        emptyFolder: "Esta carpeta está vacía.",
        successSave: "¡Guardado con éxito!",
        successSync: "¡Sincronizado con el PC correctamente!",
        errorSync: "Error de conexión con el PC.",
        btnView: "👁️ Ver",
        btnPrint: "🖨️ Imprimir",
        btnEmail: "✉️ Email",
        btnDelete: "🗑️ Eliminar",
        confirmDelete: "¿Seguro que quieres eliminar este documento?",
        modalTitle: "Gestión de Carpetas",
        modalSelectExistingLabel: "Seleccionar carpeta existente:",
        modalTypeLabel: "O crear nueva:",
        optNone: "-- Usar la seleccionada arriba --",
        optMain: "📁 Nueva Carpeta Principal",
        optSub: "📂 Crear Subcarpeta",
        modalParentLabel: "Carpeta Principal:",
        modalNameLabel: "Nombre de la nueva carpeta:",
        modalBtnCancel: "Cancelar",
        modalBtnSave: "Aceptar"
    }
};

function cambiarTextos() {
    const t = trads[idiomaActual];
    document.getElementById('ui-login-title').innerText = t.loginTitle;
    document.getElementById('pinInput').placeholder = t.loginPlaceholder;
    document.getElementById('ui-login-btn').innerText = t.loginBtn;
    
    document.getElementById('ui-path1-title').innerText = "📄 " + t.path1Title;
    document.getElementById('ui-file-label').innerHTML = `<span>${t.fileLabel}</span>`;
    document.getElementById('ui-format-label').innerText = t.formatLabel;
    document.getElementById('ui-cat-label').innerText = t.catLabel;
    document.getElementById('ui-change-create-btn').innerText = t.changeCreateBtn;
    document.getElementById('commentInput').placeholder = t.comPlaceholder;
    document.getElementById('ui-save-btn').innerText = "💾 " + t.saveBtn;
    
    document.getElementById('ui-path2-title').innerText = "📂 " + t.path2Title;
    document.getElementById('ui-path2-desc').innerText = t.path2Desc;
    document.getElementById('ui-open-manager-btn').innerText = t.openManagerBtn;
    document.getElementById('ui-back-btn').innerText = t.backBtn;
    document.getElementById('ui-sync-btn').innerText = t.syncBtn;

    document.getElementById('modalTitle').innerText = t.modalTitle;
    document.getElementById('modalSelectExistingLabel').innerText = t.modalSelectExistingLabel;
    document.getElementById('modalTypeLabel').innerText = t.modalTypeLabel;
    document.getElementById('optNone').innerText = t.optNone;
    document.getElementById('optMain').innerText = t.optMain;
    document.getElementById('optSub').innerText = t.optSub;
    document.getElementById('modalParentLabel').innerText = t.modalParentLabel;
    document.getElementById('modalNameLabel').innerText = t.modalNameLabel;
    document.getElementById('modalBtnCancel').innerText = t.modalBtnCancel;
    document.getElementById('modalBtnSave').innerText = t.modalBtnSave;
    
    actualizarSelectCategorias();
}

function toggleIdioma() {
    idiomaActual = idiomaActual === 'de' ? 'es' : 'de';
    cambiarTextos();
    cargarExplorador();
}

const request = indexedDB.open("HomeVaultDB", 1);

request.onerror = (event) => console.error("Error BD");
request.onsuccess = (event) => {
    db = event.target.result;
    actualizarSelectCategorias();
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("docs")) {
        db.createObjectStore("docs", { keyPath: "id", autoIncrement: true });
    }
};

function verificarPin() {
    const pin = document.getElementById('pinInput').value;
    const errorBox = document.getElementById('errorLogin');
    
    if (pin === "3172") {
        document.getElementById('bodyTag').classList.remove('login-background');
        document.getElementById('ui-title').style.color = "#1e3a8a";
        
        document.getElementById('loginCard').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        cambiarTextos();
    } else {
        errorBox.innerText = trads[idiomaActual].loginError;
        errorBox.style.display = "block";
    }
}

function actualizarNombreArchivo(input) {
    const t = trads[idiomaActual];
    const display = document.getElementById('fileNameDisplay');
    const formatSelect = document.getElementById('formatSelect');

    if (input.files.length > 0) {
        archivoSeleccionadoGlobal = input.files[0];
        display.innerText = "📄 " + archivoSeleccionadoGlobal.name;

        if (archivoSeleccionadoGlobal.type === 'application/pdf') {
            formatSelect.value = 'pdf';
        } else {
            formatSelect.value = 'jpg';
        }
    } else {
        archivoSeleccionadoGlobal = null;
        display.innerText = t.noFile;
    }
}

function actualizarSelectCategorias(categoriaSeleccionada = null) {
    if (!db) return;
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = function() {
        const docs = request.result;
        const t = trads[idiomaActual];
        
        const categoriasSet = new Set();
        categoriasSet.add(t.defaultCategory);
        
        docs.forEach(doc => {
            if (doc.category) categoriasSet.add(doc.category);
        });

        categoriasExtra.forEach(cat => {
            categoriasSet.add(cat);
        });

        const hiddenInput = document.getElementById('categorySelect');
        const displayText = document.getElementById('currentCategoryText');
        
        let catActual = categoriaSeleccionada || hiddenInput.value || t.defaultCategory;
        
        hiddenInput.value = catActual;
        displayText.innerText = "📁 " + catActual;
    };
}

function abrirModalSeleccionOCreacion() {
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = function() {
        const docs = request.result;
        const t = trads[idiomaActual];
        
        const categoriasSet = new Set();
        categoriasSet.add(t.defaultCategory);
        
        docs.forEach(doc => {
            if (doc.category) categoriasSet.add(doc.category);
        });

        categoriasExtra.forEach(cat => {
            categoriasSet.add(cat);
        });

        const categoriasOrdenadas = Array.from(categoriasSet).sort((a, b) => a.localeCompare(b));

        // Rellenar select de existentes
        const existingSelect = document.getElementById('modalExistingSelect');
        existingSelect.innerHTML = "";
        const valorActual = document.getElementById('categorySelect').value;

        categoriasOrdenadas.forEach(cat => {
            const partes = cat.split('/');
            const nivel = partes.length - 1; 
            const nombreActual = partes[partes.length - 1];

            const opt = document.createElement('option');
            opt.value = cat;

            if (nivel === 0) {
                opt.innerText = "📁 " + nombreActual;
            } else {
                const indentacion = "      ".repeat(nivel) + "└─ 📂 ";
                opt.innerText = indentacion + nombreActual;
            }
            existingSelect.appendChild(opt);
        });

        if (valorActual) {
            existingSelect.value = valorActual;
        }

        // Rellenar select de padres para subcategorías
        const parentSelect = document.getElementById('modalParentSelect');
        parentSelect.innerHTML = "";
        categoriasOrdenadas.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            parentSelect.appendChild(opt);
        });

        document.getElementById('modalCreationType').value = "none";
        document.getElementById('parentCategoryGroup').classList.add('hidden');
        document.getElementById('modalInputName').value = "";

        document.getElementById('categoryModal').classList.remove('hidden');
    };
}

function cambiarModoModal() {
    const tipo = document.getElementById('modalCreationType').value;
    const parentGroup = document.getElementById('parentCategoryGroup');
    if (tipo === "sub") {
        parentGroup.classList.remove('hidden');
    } else {
        parentGroup.classList.add('hidden');
    }
}

function cerrarModalCategoria() {
    document.getElementById('categoryModal').classList.add('hidden');
}

function guardarSeleccionOCreacionModal() {
    const tipo = document.getElementById('modalCreationType').value;
    let categoriaFinal = "";

    if (tipo === "none") {
        categoriaFinal = document.getElementById('modalExistingSelect').value;
    } else {
        const nombreInput = document.getElementById('modalInputName').value.trim();
        if (!nombreInput) {
            alert(idiomaActual === 'de' ? "Bitte geben Sie einen Namen ein." : "Por favor, introduce un nombre.");
            return;
        }

        if (tipo === "main") {
            categoriaFinal = nombreInput;
        } else if (tipo === "sub") {
            const parentCat = document.getElementById('modalParentSelect').value;
            categoriaFinal = `${parentCat}/${nombreInput}`;
        }

        if (!categoriasExtra.includes(categoriaFinal)) {
            categoriasExtra.push(categoriaFinal);
        }
    }

    document.getElementById('categoryModal').classList.add('hidden');
    actualizarSelectCategorias(categoriaFinal);
}

function guardarLocalmente() {
    const t = trads[idiomaActual];
    const categorySelect = document.getElementById('categorySelect');
    let category = categorySelect.value || t.defaultCategory;

    const comment = document.getElementById('commentInput').value || "";
    const format = document.getElementById('formatSelect').value;

    if (!archivoSeleccionadoGlobal) {
        alert(idiomaActual === 'de' ? "Bitte wählen Sie eine Datei oder scannen Sie ein Dokument." : "Por favor, selecciona un archivo o escanea un documento.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const transaction = db.transaction(["docs"], "readwrite");
        const store = transaction.objectStore("docs");
        
        let nombreFinal = archivoSeleccionadoGlobal.name;
        let tipoFinal = archivoSeleccionadoGlobal.type;

        if (format === 'jpg') {
            if (!nombreFinal.toLowerCase().endsWith('.jpg') && !nombreFinal.toLowerCase().endsWith('.jpeg')) {
                nombreFinal = nombreFinal.substring(0, nombreFinal.lastIndexOf('.')) + '.jpg';
            }
            tipoFinal = 'image/jpeg';
        } else if (format === 'pdf') {
            if (!nombreFinal.toLowerCase().endsWith('.pdf')) {
                nombreFinal = nombreFinal.substring(0, nombreFinal.lastIndexOf('.')) + '.pdf';
            }
            tipoFinal = 'application/pdf';
        }

        const nuevoDoc = {
            name: nombreFinal,
            type: tipoFinal,
            data: event.target.result,
            category: category,
            comment: comment,
            date: new Date().toLocaleString()
        };

        store.add(nuevoDoc);

        transaction.oncomplete = function() {
            alert(t.successSave);
            archivoSeleccionadoGlobal = null;
            document.getElementById('fileInput').value = "";
            document.getElementById('fileNameDisplay').innerText = "";
            document.getElementById('commentInput').value = "";
            actualizarSelectCategorias();
        };
    };

    reader.readAsDataURL(archivoSeleccionadoGlobal);
}

// --- GESTIÓN DE PANTALLAS (EXPLORADOR INTUITIVO) ---

function abrirPantallaGestion() {
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('managerContent').classList.remove('hidden');
    rutaActualCarpeta = ""; 
    cargarExplorador();
}

function cerrarPantallaGestion() {
    document.getElementById('managerContent').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
}

function entrarCarpeta(nombreCarpeta) {
    rutaActualCarpeta = nombreCarpeta;
    cargarExplorador();
}

function subirNivelCarpeta() {
    if (!rutaActualCarpeta.includes('/')) {
        rutaActualCarpeta = "";
    } else {
        const partes = rutaActualCarpeta.split('/');
        partes.pop();
        rutaActualCarpeta = partes.join('/');
    }
    cargarExplorador();
}

function cargarExplorador() {
    if (!db) return;
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = function() {
        const docs = request.result;
        const contenedor = document.getElementById('explorerContainer');
        const breadcrumb = document.getElementById('breadcrumbContainer');
        const breadcrumbText = document.getElementById('breadcrumbText');
        const headerTitle = document.getElementById('managerHeaderTitle');
        contenedor.innerHTML = "";
        const t = trads[idiomaActual];

        if (rutaActualCarpeta === "") {
            headerTitle.innerText = "📁 Mis Carpetas Principales";
            breadcrumb.classList.add('hidden');
        } else {
            headerTitle.innerText = `📂 ${rutaActualCarpeta}`;
            breadcrumb.classList.remove('hidden');
            breadcrumbText.innerText = `Volver (Subir un nivel)`;
        }

        const todasLasCategorias = new Set();
        todasLasCategorias.add(t.defaultCategory);
        docs.forEach(doc => { if (doc.category) todasLasCategorias.add(doc.category); });
        categoriasExtra.forEach(cat => todasLasCategorias.add(cat));

        const subcarpetasSet = new Set();
        const documentosAqui = [];

        docs.forEach(doc => {
            const cat = doc.category || t.defaultCategory;
            if (rutaActualCarpeta === "") {
                if (!cat.includes('/')) {
                    if (cat === t.defaultCategory) {
                        documentosAqui.push(doc);
                    }
                }
            } else {
                if (cat === rutaActualCarpeta) {
                    documentosAqui.push(doc);
                }
            }
        });

        todasLasCategorias.forEach(cat => {
            if (rutaActualCarpeta === "") {
                if (cat.includes('/')) {
                    const principal = cat.split('/')[0];
                    subcarpetasSet.add(principal);
                }
            } else {
                if (cat.startsWith(rutaActualCarpeta + '/')) {
                    const resto = cat.substring(rutaActualCarpeta.length + 1);
                    const siguienteNivel = resto.split('/')[0];
                    subcarpetasSet.add(rutaActualCarpeta + '/' + siguienteNivel);
                }
            }
        });

        const hayContenido = subcarpetasSet.size > 0 || documentosAqui.length > 0;

        if (!hayContenido) {
            contenedor.innerHTML = `<p style='color: #888; font-style: italic; text-align: center; padding: 20px;'>${t.emptyFolder}</p>`;
            return;
        }

        Array.from(subcarpetasSet).sort().forEach(subCat => {
            const nombreMostrar = subCat.split('/').pop();
            const divFolder = document.createElement('div');
            divFolder.className = 'folder-item';
            divFolder.innerHTML = `<span>📁 ${nombreMostrar}</span> <span>➡️</span>`;
            divFolder.onclick = () => entrarCarpeta(subCat);
            contenedor.appendChild(divFolder);
        });

        documentosAqui.reverse().forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            
            let miniaturaHtml = '';
            if (doc.type && doc.type.startsWith('image/')) {
                miniaturaHtml = `<img src="${doc.data}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; float: left; margin-right: 12px; border: 1px solid #ccc;">`;
            } else {
                miniaturaHtml = `<span style="font-size: 2rem; float: left; margin-right: 12px;">📄</span>`;
            }

            div.innerHTML = `
                <div style="overflow: hidden; margin-bottom: 8px;">
                    ${miniaturaHtml}
                    <p style="margin: 2px 0; font-weight: bold;"><em>${doc.name}</em></p>
                    <p style="font-size: 0.75rem; color: #666; margin: 2px 0;">📅 ${doc.date}</p>
                </div>
                ${doc.comment ? `<p style="clear: both; margin: 4px 0; font-size: 0.9rem;">💬 <strong>Nota:</strong> ${doc.comment}</p>` : ''}
                <div class="actions-group">
                    <button class="action-btn" onclick="verDocumento('${doc.id}')">${t.btnView}</button>
                    <button class="action-btn" onclick="imprimirDocumento('${doc.id}')">${t.btnPrint}</button>
                    <button class="action-btn" onclick="enviarPorEmail('${doc.id}')">${t.btnEmail}</button>
                    <button class="action-btn btn-red" onclick="eliminarDocumento('${doc.id}')">${t.btnDelete}</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    };
}

function obtenerDocPorId(id, callback) {
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.get(Number(id));
    request.onsuccess = () => callback(request.result);
}

function verDocumento(id) {
    obtenerDocPorId(id, (doc) => {
        if (!doc) return;
        const w = window.open("");
        w.document.write(`<iframe src="${doc.data}" style="width:100%; height:100%; border:none;"></iframe>`);
    });
}

function imprimirDocumento(id) {
    obtenerDocPorId(id, (doc) => {
        if (!doc) return;
        const w = window.open("");
        w.document.write(`
            <html>
            <head><title>Drucken / Imprimir</title></head>
            <body onload="window.print();window.close()">
                <img src="${doc.data}" style="max-width:100%;">
            </body>
            </html>
        `);
    });
}

function enviarPorEmail(id) {
    obtenerDocPorId(id, (doc) => {
        if (!doc) return;
        const subject = encodeURIComponent("HomeVault: " + doc.name + " (" + doc.category + ")");
        const body = encodeURIComponent((idiomaActual === 'de' ? "Dokument Details:\nOrdner: " : "Detalles:\nCarpeta: ") + doc.category + "\n" + (doc.comment ? "Notiz: " + doc.comment + "\n" : "") + "Datum: " + doc.date);
        
        if (navigator.canShare && navigator.canShare({ files: [] })) {
            fetch(doc.data)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], doc.name, { type: doc.type });
                    navigator.share({
                        title: doc.name,
                        text: decodeURIComponent(body),
                        files: [file]
                    }).catch(() => {});
                });
        } else {
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    });
}

function eliminarDocumento(id) {
    const t = trads[idiomaActual];
    if (confirm(t.confirmDelete)) {
        const transaction = db.transaction(["docs"], "readwrite");
        const store = transaction.objectStore("docs");
        store.delete(Number(id));
        transaction.oncomplete = () => cargarExplorador();
    }
}

// --- SINCRONIZACIÓN CON BARRA AZUL DE PROGRESO ---
async function sincronizarConPC() {
    const t = trads[idiomaActual];
    const pcIp = prompt("Introduce la IP del PC (ej: http://192.168.178.27:8080):", "http://192.168.178.27:8080");
    if (!pcIp) return;

    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = async function() {
        const docs = request.result;
        if (docs.length === 0) {
            alert(t.emptyFolder);
            return;
        }

        const progressContainer = document.getElementById('syncProgressContainer');
        const progressBar = document.getElementById('syncProgressBar');
        const statusText = document.getElementById('syncStatusText');
        
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressBar.innerText = '0%';

        const totalDocs = docs.length;
        let completados = 0;

        try {
            for (let i = 0; i < totalDocs; i++) {
                const doc = docs[i];
                
                statusText.innerText = (idiomaActual === 'de' ? "Wird synchronisiert: " : "Sincronizando: ") + doc.name;

                const base64Data = doc.data.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(j);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: doc.type });

                const folderPath = doc.category.replace(/[^a-zA-Z0-9\/]/g, "_");
                const targetUrl = `${pcIp}/Public/${folderPath}/${doc.name}`;

                await fetch(targetUrl, {
                    method: 'PUT',
                    body: blob,
                    headers: {
                        'X-Category': doc.category,
                        'X-Comment': doc.comment || ''
                    }
                });

                if (doc.comment) {
                    const metaUrl = `${pcIp}/Public/${folderPath}/${doc.name}.json`;
                    await fetch(metaUrl, {
                        method: 'PUT',
                        body: JSON.stringify({ category: doc.category, comment: doc.comment })
                    });
                }

                completados++;
                const porcentaje = Math.round((completados / totalDocs) * 100);
                progressBar.style.width = porcentaje + '%';
                progressBar.innerText = porcentaje + '%';
            }

            statusText.innerText = idiomaActual === 'de' ? "Erfolgreich synchronisiert! ✔️" : "¡Sincronizado con éxito! ✔️";
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                alert(t.successSync);
            }, 800);

        } catch (error) {
            console.error(error);
            progressContainer.classList.add('hidden');
            alert(t.errorSync);
        }
    };
}