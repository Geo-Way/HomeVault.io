import os
import mimetypes
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
STORAGE_DIR = BASE_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_CATEGORIES = [
    "Alexander Ariza",
    "Auto",
    "Benutzerdefinierte Office-Vorlagen",
    "Bewerbungsunterlagen Anja",
    "Caritas_HKP",
    "e-bike",
    "Elster",
    "Eltern",
    "Familie",
    "Fax",
    "Gehaltsnachweise",
    "Gescannte Dokumente",
    "Gesundheit Anja",
    "Hausfinanzierung",
    "Hausunterlagen",
    "Katze",
    "Laura Hyronimus",
    "Lohnsteuer",
    "Lucas Hyronimus",
    "Maria Heimsuchung",
    "Outlook-Dateien",
    "Polizei",
    "Rechnungen",
    "Rentenversicherung",
    "Schmerzklinik",
    "Schule - Kopie",
    "Tagesklinik",
    "Telekom",
    "Trennung",
    "Urlaub",
    "VDK",
    "Versicherungen Anja",
    "Zoom"
]

def init_storage():
    for cat in DEFAULT_CATEGORIES:
        (STORAGE_DIR / cat).mkdir(parents=True, exist_ok=True)

init_storage()

@app.get("/api/categories")
def get_categories():
    structure = {}
    init_storage()
    for item in sorted(os.listdir(STORAGE_DIR)):
        item_path = STORAGE_DIR / item
        if item_path.is_dir():
            subdirs = sorted([sub for sub in os.listdir(item_path) if (item_path / sub).is_dir()])
            structure[item] = subdirs
    return structure

@app.post("/api/categories")
def create_category(category: str = Form(...), subcategory: str = Form(None)):
    try:
        target = STORAGE_DIR / category
        if subcategory and subcategory.strip():
            target = target / subcategory.strip()
        target.mkdir(parents=True, exist_ok=True)
        return {"status": "success", "path": str(target)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    subcategory: str = Form(""),
    custom_name: str = Form("")
):
    try:
        subfolder = subcategory.strip() if subcategory else ""
        target_dir = STORAGE_DIR / category / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        
        original_ext = Path(file.filename).suffix
        if custom_name and custom_name.strip():
            clean_name = custom_name.strip()
            if not clean_name.lower().endswith(original_ext.lower()):
                final_filename = f"{clean_name}{original_ext}"
            else:
                final_filename = clean_name
        else:
            final_filename = file.filename

        file_path = target_dir / final_filename
        content = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        return {"status": "success", "filename": final_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/explorer")
def list_explorer(path: str = ""):
    try:
        target_dir = (STORAGE_DIR / path).resolve()
        if not str(target_dir).startswith(str(STORAGE_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Acceso denegado")

        if not target_dir.exists():
            return {"currentPath": path, "items": []}

        items = []
        for entry in os.scandir(target_dir):
            rel_entry_path = (Path(path) / entry.name).as_posix() if path else entry.name
            items.append({
                "name": entry.name,
                "isDir": entry.is_dir(),
                "path": rel_entry_path
            })
            
        items.sort(key=lambda x: (not x["isDir"], x["name"].lower()))
        return {"currentPath": path, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/file/{file_path:path}")
def get_file(file_path: str):
    full_path = STORAGE_DIR / file_path
    if full_path.exists() and full_path.is_file():
        return FileResponse(str(full_path))
    raise HTTPException(status_code=404, detail="Archivo no encontrado")

app.mount("/", StaticFiles(directory=str(PUBLIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print("Servidor activo en: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
