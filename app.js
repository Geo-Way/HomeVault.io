const state = {
  lang: localStorage.getItem("hv_lang") || "de",
  server: localStorage.getItem("hv_server") || location.origin,
  currentPath: "",
  currentFile: null,
  currentFolder: ""
};

const T = {
  de: {
    login:"Anmelden", pin:"PIN", wrong:"Falsche PIN.", pc:"PC-Adresse", save:"PC-Adresse speichern",
    notice:"Das Dokument wird direkt auf dem PC gespeichert. Es gibt keine Synchronisation.",
    capture:"📤 Erfassen", local:"📁 Lokal", category:"Kategorie", sub:"Unterkategorie (optional)",
    file:"Foto / PDF / Datei", name:"Dateiname (optional)", comment:"Kommentar (optional)",
    upload:"📸 Direkt auf dem PC speichern", refresh:"🔄 Aktualisieren", back:"📤 Erfassen",
    newcat:"Neue Kategorie", folder:"Name", create:"Erstellen", cancel:"Abbrechen",
    open:"Öffnen", del:"Löschen", close:"Schließen", empty:"Keine Dateien oder Ordner.",
    saved:"Gespeichert.", choose:"Bitte Kategorie und Datei auswählen.", deleted:"Gelöscht.",
    error:"Fehler", root:"HomeVault", details:"Details", commentLabel:"Kommentar"
  },
  es: {
    login:"Iniciar sesión", pin:"PIN", wrong:"PIN incorrecto.", pc:"Dirección del PC", save:"Guardar dirección del PC",
    notice:"El documento se guarda directamente en el PC. No existe sincronización.",
    capture:"📤 Capturar", local:"📁 Local", category:"Categoría", sub:"Subcategoría (opcional)",
    file:"Foto / PDF / archivo", name:"Nombre del archivo (opcional)", comment:"Comentario (opcional)",
    upload:"📸 Guardar directamente en el PC", refresh:"🔄 Actualizar", back:"📤 Capturar",
    newcat:"Nueva categoría", folder:"Nombre", create:"Crear", cancel:"Cancelar",
    open:"Abrir", del:"Eliminar", close:"Cerrar", empty:"No hay archivos ni carpetas.",
    saved:"Guardado.", choose:"Selecciona una categoría y un archivo.", deleted:"Eliminado.",
    error:"Error", root:"HomeVault", details:"Detalles", commentLabel:"Comentario"
  }
};

function t(k){ return T[state.lang][k] || k; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function server(){ return state.server.replace(/\/+$/,""); }

function setLang(v){
  state.lang=v; localStorage.setItem("hv_lang",v);
  document.documentElement.lang=v; renderTexts();
}
function renderTexts(){
  const map={loginTitle:"login",pinLabel:"pin",loginBtn:"login",pcLabel:"pc",savePc:"save",
    instantNotice:"notice",navCapture:"capture",navLocal:"local",catLabel:"category",subLabel:"sub",
    fileLabel:"file",nameLabel:"name",commentLabel:"comment",uploadBtn:"upload",refresh:"refresh",
    backCapture:"back",modalTitle:"newcat",folderLabel:"folder",createBtn:"create",cancelBtn:"cancel",
    openBtn:"open",deleteBtn:"del",closeBtn:"close",detailCommentLabel:"commentLabel"};
  for(const [id,key] of Object.entries(map)){ const el=document.getElementById(id); if(el) el.textContent=t(key); }
}
async function api(path, opts={}){
  const r=await fetch(server()+path,{credentials:"include",...opts});
  let data={}; try{data=await r.json()}catch{}
  if(!r.ok) throw new Error(data.error || `${r.status}`);
  return data;
}
async function login(){
  try{
    await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin:document.getElementById("pin").value})});
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    await loadCategories(); show("capture");
  }catch(e){ showMsg("loginMsg",t("wrong"),true); }
}
function saveServer(){
  let v=document.getElementById("serverUrl").value.trim().replace(/\/+$/,"");
  if(!/^https?:\/\//i.test(v)) v="http://"+v;
  state.server=v; localStorage.setItem("hv_server",v);
  showMsg("uploadMsg", "✓ "+t("save"));
  loadCategories();
}
function show(view){
  document.getElementById("capture").classList.toggle("hidden",view!=="capture");
  document.getElementById("local").classList.toggle("hidden",view!=="local");
  if(view==="local") loadRoot();
}
async function loadCategories(){
  document.getElementById("serverUrl").value=state.server;
  try{
    const data=await api("/api/list?path=");
    const cat=document.getElementById("cat");
    cat.innerHTML="";
    data.items.filter(x=>x.dir).forEach(x=>cat.add(new Option("📁 "+x.name,x.name)));
    if(!cat.options.length) cat.innerHTML='<option value="">—</option>';
    await loadSubcats();
  }catch(e){ showMsg("uploadMsg",t("error")+": "+e.message,true); }
}
async function loadSubcats(){
  const parent=document.getElementById("cat").value;
  const sub=document.getElementById("sub"); sub.innerHTML='<option value="">— '+(state.lang==="de"?"Keine":"Ninguna")+' —</option>';
  if(!parent)return;
  try{
    const data=await api("/api/list?path="+encodeURIComponent(parent));
    data.items.filter(x=>x.dir).forEach(x=>sub.add(new Option("📁 "+x.name,x.name)));
  }catch(e){}
}
function newFolder(){
  document.getElementById("folderName").value="";
  document.getElementById("folderName").focus();
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
async function createFolder(){
  const name=document.getElementById("folderName").value.trim();
  const parent=document.getElementById("cat").value;
  if(!name)return;
  try{
    await api("/api/mkdir",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({parent,name})});
    closeModal(); await loadCategories();
  }catch(e){alert(t("error")+": "+e.message)}
}
function filename(){
  const f=document.getElementById("file").files[0];
  let custom=document.getElementById("name").value.trim();
  if(!f)return "";
  if(!custom) return f.name;
  const ext=f.name.includes(".") ? "."+f.name.split(".").pop().toLowerCase() : "";
  return custom.replace(/[\/\\:*?"<>|]/g,"_") + ext;
}
async function upload(){
  const cat=document.getElementById("cat").value, sub=document.getElementById("sub").value, f=document.getElementById("file").files[0];
  if(!cat||!f){showMsg("uploadMsg",t("choose"),true);return}
  const target=[cat,sub,filename()].filter(Boolean).map(encodeURIComponent).join("/");
  try{
    document.getElementById("uploadBtn").disabled=true;
    await api("/Public/"+target,{method:"PUT",headers:{"Content-Type":f.type||"application/octet-stream","X-Category":sub?cat+"/"+sub:cat,"X-Comment":document.getElementById("comment").value},body:f});
    showMsg("uploadMsg","✓ "+t("saved"));
    document.getElementById("file").value="";document.getElementById("name").value="";document.getElementById("comment").value="";
  }catch(e){showMsg("uploadMsg",t("error")+": "+e.message,true)}
  finally{document.getElementById("uploadBtn").disabled=false}
}
async function loadRoot(){await loadExplorer("");}
async function loadExplorer(path){
  state.currentPath=path;
  document.getElementById("path").textContent=t("root")+(path?"/"+path:"");
  const box=document.getElementById("explorer"); box.innerHTML="";
  try{
    const data=await api("/api/list?path="+encodeURIComponent(path));
    if(path){
      const back=document.createElement("div"); back.className="card"; back.innerHTML='<div class="icon">↩️</div><div class="name">..</div>';
      back.onclick=()=>loadExplorer(path.split("/").slice(0,-1).join("/")); box.appendChild(back);
    }
    data.items.forEach(item=>{
      const c=document.createElement("div");c.className="card";
      c.innerHTML=`<div class="icon">${item.dir?"📁":"📄"}</div><div class="name">${esc(item.name)}</div><div class="muted">${item.dir?"Ordner":formatBytes(item.size)}</div>`;
      c.onclick=()=>item.dir?loadExplorer(item.path):showDetails(item); box.appendChild(c);
    });
    if(!box.children.length) box.innerHTML=`<div class="notice">${t("empty")}</div>`;
  }catch(e){box.innerHTML=`<div class="notice error">${t("error")}: ${esc(e.message)}</div>`}
}
function formatBytes(n){if(n<1024)return n+" B";if(n<1048576)return (n/1024).toFixed(1)+" KB";return (n/1048576).toFixed(1)+" MB"}
async function showDetails(item){
  state.currentFile=item;
  document.getElementById("detailName").textContent="📄 "+item.name;
  document.getElementById("detailInfo").textContent=formatBytes(item.size||0);
  try{
    const m=await api("/api/meta?path="+encodeURIComponent(item.path));
    document.getElementById("detailComment").textContent=m.meta?.comment||"—";
  }catch{document.getElementById("detailComment").textContent="—"}
  document.getElementById("details").classList.remove("hidden");
}
function closeDetails(){document.getElementById("details").classList.add("hidden")}
function openCurrent(){
  if(!state.currentFile)return;
  window.open(server()+"/Public/"+state.currentFile.path.split("/").map(encodeURIComponent).join("/"),"_blank");
}
async function deleteCurrent(){
  if(!state.currentFile)return;
  if(!confirm(state.lang==="de"?"Datei wirklich löschen?":"¿Eliminar el archivo?"))return;
  try{
    await api("/Public/"+state.currentFile.path.split("/").map(encodeURIComponent).join("/"),{method:"DELETE"});
    closeDetails(); await loadExplorer(state.currentPath); showMsg("uploadMsg",t("deleted"));
  }catch(e){alert(t("error")+": "+e.message)}
}
function showMsg(id,msg,error=false){const el=document.getElementById(id);el.textContent=msg;el.classList.remove("hidden","error");if(error)el.classList.add("error");setTimeout(()=>el.classList.add("hidden"),4000)}
renderTexts();
document.getElementById("serverUrl").value=state.server;
document.getElementById("pin").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
