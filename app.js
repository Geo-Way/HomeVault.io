let db;
let idiomaActual = 'de'; // Por defecto Alemán

const trads = {
    de: {
        loginTitle: "Anmelden",
        loginSub: "Standard-PIN: 3172",
        loginPlaceholder: "PIN eingeben",
        loginBtn: "Einloggen",
        loginError: "Falsche PIN. Versuche es mit 3172.",
        path1Title: "1️⃣ Neues Dokument hinzufügen",
        fileLabel: "📷 Kamera / Scanner öffnen oder Datei wählen",
        noFile: "Keine Datei ausgewählt",
        catLabel: "Kategorie wählen:",
        defaultCategory: "Allgemein",
        newCatOption: "➕ Neue Kategorie / Unterkategorie erstellen...",
        comPlaceholder: "Kommentar (optional)...",
        saveBtn: "Auf dem Handy speichern",
        path2Title: "2️⃣ Dokumente verwalten & PC",
        path2Desc: "Sehen, drucken, löschen oder an den PC senden.",
        syncBtn: "🔄 Mit PC synchronisieren",
        emptyList: "Keine Dokumente gespeichert.",
        successSave: "Erfolgreich gespeichert!",
        successSync: "Erfolgreich mit dem PC synchronisiert!",
        errorSync: "Verbindungsfehler zum PC. Überprüfen Sie das WLAN.",
        btnView: "👁️ Ansehen",
        btnPrint: "🖨️ Drucken",
        btnEmail: "✉️ E-Mail",
        btnDelete: "🗑️ Löschen",
        confirmDelete: "Möchten Sie dieses Dokument wirklich löschen?",
        modalTitle: "Kategorie verwalten",
        modalTypeLabel: "Art:",
        optMain: "📁 Neue Hauptkategorie (Hauptordner)",
        optSub: "📂 Unterkategorie zu bestehender",
        modalParentLabel: "Hauptkategorie wählen:",
        modalNameLabel: "Name:",
        modalBtnCancel: "Abbrechen",
        modalBtnSave: "Erstellen"
    },
    es: {
        loginTitle: "Iniciar Sesión",
        loginSub: "PIN por defecto: 3172",
        loginPlaceholder: "Introduce el PIN",
        loginBtn: "Entrar",
        loginError: "PIN incorrecto. Prueba con 3172.",
        path1Title: "1️⃣ Añadir Nuevo Documento",
        fileLabel: "📷 Abrir Cámara / Escáner o Seleccionar Archivo",
        noFile: "Ningún archivo seleccionado",
        catLabel: "Seleccionar Categoría:",
        defaultCategory: "General",
        newCatOption: "➕ Crear nueva categoría o subcategoría...",
        comPlaceholder: "Comentario (opcional)...",
        saveBtn: "Guardar en el Móvil",
        path2Title: "2️⃣ Ver Documentos y PC",
        path2Desc: "Ver, imprimir, eliminar o enviar al ordenador.",
        syncBtn: "🔄 Sincronizar con el PC",
        emptyList: "No hay documentos guardados.",
        successSave: "¡Guardado con éxito!",
        successSync: "¡Sincronizado con el PC correctamente!",
        errorSync: "Error de conexión con el PC. Revisa la red Wi-Fi.",
        btnView: "👁️ Ver",
        btnPrint: "🖨️ Imprimir",
        btnEmail: "✉️ Email",
        btnDelete: "🗑️ Eliminar",
        confirmDelete: "¿Seguro que quieres eliminar este documento?",
        modalTitle: "Gestión de Categorías",
        modalTypeLabel: "Tipo de creación:",
        optMain: "📁 Nueva Categoría Principal (Carpeta)",
        optSub: "📂 Subcategoría dentro de una existente",
        modalParentLabel: "Categoría Principal existente:",
        modalNameLabel: "Nombre:",
        modalBtnCancel: "Cancelar",
        modalBtnSave: "Crear"
    }
};

function cambiarTextos() {
    const t = trads[idiomaActual];
    document.getElementById('ui-login-title').innerText = t.loginTitle;
    document.getElementById('ui-login-sub').innerText = t.loginSub;
    document.getElementById('pinInput').placeholder = t.loginPlaceholder;
    document.getElementById('ui-login-btn').innerText = t.loginBtn;
    
    document.getElementById('ui-path1-title').innerText = t.path1Title;
    document.getElementById('ui-file-label').innerHTML = `📷 <span>${t.fileLabel.replace('📷 ', '')}</span>`;
    document.getElementById('ui-cat-label').innerText = t.catLabel;
    document.getElementById('commentInput').placeholder = t.comPlaceholder;
    document.getElementById('ui-save-btn').innerText = t.saveBtn;
    
    document.getElementById('ui-path2-title').innerText = t.path2Title;
    document.getElementById('ui-path2-desc').innerText = t.path2Desc;
    document.getElementById('ui-sync-btn').innerText = t.syncBtn;

    document.getElementById('modalTitle').innerText = t.modalTitle;
    document.getElementById('modalTypeLabel').innerText = t.modalTypeLabel;
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
    cargarDocumentos();
}

// Configuración de IndexedDB
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
        document.getElementById('ui-title').style.color = "#2c3e50";
        
        document.getElementById('loginCard').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        cambiarTextos();
        cargarDocumentos();
    } else {
        errorBox.innerText = trads[idiomaActual].loginError;
        errorBox.style.display = "block";
    }
}

function actualizarNombreArchivo(input) {
    const t = trads[idiomaActual];
    const display = document.getElementById('fileNameDisplay');
    if (input.files.length > 0) {
        display.innerText = "📄 " + input.files[0].name;
    } else {
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

        const select = document.getElementById('categorySelect');
        select.innerHTML = "";

        categoriasSet.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            select.appendChild(opt);
        });

        const optNueva = document.createElement('option');
        optNueva.value = "__nueva_modal__";
        optNueva.innerText = t.newCatOption;
        select.appendChild(optNueva);

        if (categoriaSeleccionada) {
            select.value = categoriaSeleccionada;
        }
    };
}

function verificarOpcionCategoria(selectElement) {
    if (selectElement.value === "__nueva_modal__") {
        abrirModalCategoria();
    }
}

function abrirModalCategoria() {
    document.getElementById('modalCreationType').value = "main";
    document.getElementById('modalInputName').value = "";
    document.getElementById('parentCategoryGroup').classList.add('hidden');
    
    const parentSelect = document.getElementById('modalParentSelect');
    parentSelect.innerHTML = "";
    
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = function() {
        const docs = request.result;
        const principales = new Set();
        principales.add(trads[idiomaActual].defaultCategory);
        docs.forEach(doc => {
            if (doc.category) {
                const principal = doc.category.split('/')[0];
                principales.add(principal);
            }
        });

        principales.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            parentSelect.appendChild(opt);
        });

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
    document.getElementById('categorySelect').value = trads[idiomaActual].defaultCategory;
}

function guardarNuevaCategoriaModal() {
    const tipo = document.getElementById('modalCreationType').value;
    const nombreInput = document.getElementById('modalInputName').value.trim();

    if (!nombreInput) {
        alert(idiomaActual === 'de' ? "Bitte geben Sie einen Namen ein." : "Por favor, introduce un nombre.");
        return;
    }

    let categoriaFinal = nombreInput;

    if (tipo === "sub") {
        const parentCat = document.getElementById('modalParentSelect').value;
        categoriaFinal = `${parentCat}/${nombreInput}`;
    }

    const select = document.getElementById('categorySelect');
    const opt = document.createElement('option');
    opt.value = categoriaFinal;
    opt.innerText = "📁 " + categoriaFinal;
    select.insertBefore(opt, select.lastElementChild);
    select.value = categoriaFinal;

    document.getElementById('categoryModal').classList.add('hidden');
}

function guardarLocalmente() {
    const fileInput = document.getElementById('fileInput');
    const t = trads[idiomaActual];
    
    const categorySelect = document.getElementById('categorySelect');
    let category = categorySelect.value;
    
    if (category === "__nueva_modal__" || !category) {
        category = t.defaultCategory;
    }

    const comment = document.getElementById('commentInput').value || "";

    if (fileInput.files.length === 0) {
        alert(idiomaActual === 'de' ? "Bitte wählen Sie eine Datei oder einen Scanner aus." : "Por favor, selecciona un archivo o escanea uno.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const transaction = db.transaction(["docs"], "readwrite");
        const store = transaction.objectStore("docs");
        
        const nuevoDoc = {
            name: file.name,
            type: file.type,
            data: event.target.result,
            category: category,
            comment: comment,
            date: new Date().toLocaleString()
        };

        store.add(nuevoDoc);

        transaction.oncomplete = function() {
            alert(t.successSave);
            fileInput.value = "";
            document.getElementById('fileNameDisplay').innerText = "";
            document.getElementById('commentInput').value = "";
            actualizarSelectCategorias();
            cargarDocumentos();
        };
    };

    reader.readAsDataURL(file);
}

function cargarDocumentos() {
    if (!db) return;
    const transaction = db.transaction(["docs"], "readonly");
    const store = transaction.objectStore("docs");
    const request = store.getAll();

    request.onsuccess = function() {
        const docs = request.result;
        const contenedor = document.getElementById('listaDocs');
        contenedor.innerHTML = "";
        const t = trads[idiomaActual];

        if (docs.length === 0) {
            contenedor.innerHTML = `<p style='color: #888; font-style: italic;'>${t.emptyList}</p>`;
            return;
        }

        docs.reverse().forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            
            // Generar miniatura si es imagen, o icono genérico si es PDF
            let miniaturaHtml = '';
            if (doc.type && doc.type.startsWith('image/')) {
                miniaturaHtml = `<img src="${doc.data}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px; float: left; margin-right: 10px; border: 1px solid #ccc;">`;
            } else {
                miniaturaHtml = `<span style="font-size: 1.8rem; float: left; margin-right: 10px;">📄</span>`;
            }

            div.innerHTML = `
                <div style="overflow: hidden; margin-bottom: 8px;">
                    ${miniaturaHtml}
                    <strong>📁 ${doc.category}</strong>
                    <p style="margin: 2px 0;"><em>${doc.name}</em></p>
                </div>
                ${doc.comment ? `<p style="clear: both; margin: 4px 0;">💬 <strong>Info:</strong> ${doc.comment}</p>` : ''}
                <p style="font-size: 0.75rem; color: #666; margin: 4px 0;">📅 ${doc.date}</p>
                <div class="actions-group">
                    <button class="action-btn" onclick="verDocumento('${doc.id}')">${t.btnView}</button>
                    <button class="action-btn" onclick="imprimirDocumento('${doc.id}')">${t.btnPrint}</button>
                    <button class="action-btn" onclick="enviarPorEmail('${doc.id}')">${t.btnEmail}</button>
                    <button class="action-btn btn-red" onclick="eliminarDocumento('${doc.id}')">${t.btnDelete}</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
        
        actualizarSelectCategorias();
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
        const body = encodeURIComponent((idiomaActual === 'de' ? "Dokument Details:\nKategorie: " : "Detalles del documento:\nCategoría: ") + doc.category + "\n" + (doc.comment ? "Kommentar/Comentario: " + doc.comment + "\n" : "") + "Datum/Fecha: " + doc.date);
        
        // Si el navegador soporta Web Share API con archivos (muy útil en móviles)
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
            // Fallback clásico a enlace mailto (abre el cliente de correo)
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
        transaction.oncomplete = () => cargarDocumentos();
    }
}

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
            alert(t.emptyList);
            return;
        }

        try {
            for (const doc of docs) {
                const base64Data = doc.data.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
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
            }
            alert(t.successSync);
        } catch (error) {
            console.error(error);
            alert(t.errorSync);
        }
    };
}