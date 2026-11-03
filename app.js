/* Transportes JLB · Prototipo escolar. Datos guardados localmente en el navegador. */
"use strict";
const STORAGE_KEY = "transportesJLB_v1_viajes";
const ESTADOS = ["Programado", "En curso", "Finalizado"];
const FACTURAS = ["Pendiente", "Facturada", "Pagada"];
const $ = (id) => document.getElementById(id);
const dinero = (num) => new Intl.NumberFormat("es-MX", {style: "currency", currency: "MXN"}).format(Number(num) || 0);
const n = (value) => { const x = Number(value); return Number.isFinite(x) && x >= 0 ? x : 0; };
const seguro = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function leerViajes() {
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
function guardarViajes(viajes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(viajes)); return true; }
  catch { alert("No se pudo guardar. El navegador podría tener poco espacio (especialmente si adjuntaste fotografías)."); return false; }
}
const gasto = (v) => n(v.diesel) + n(v.casetas) + n(v.extras);
const resultado = (v) => n(v.flete) - gasto(v);
function fechaLocal(cad) { const f = new Date(String(cad || "").slice(0,10) + "T12:00:00"); return Number.isNaN(f.getTime()) ? new Date() : f; }
function isoDia(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function nuevaFecha(d, dias) { const x = new Date(d.getTime()); x.setDate(x.getDate() + dias); return x; }
function lunesDe(d) { const x = new Date(d.getTime()); x.setHours(12,0,0,0); x.setDate(x.getDate() - (x.getDay()+6)%7); return x; }
function fechaBonita(f) { if(!f) return "Sin fecha"; const d = new Date(f); return Number.isNaN(d.getTime()) ? String(f) : d.toLocaleString("es-MX", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}); }
function fechaCorta(d) { return d.toLocaleDateString("es-MX", {day:"numeric",month:"short"}); }
function rangoSemana(lunes) {return `${fechaCorta(lunes)} – ${fechaCorta(nuevaFecha(lunes,6))} de ${nuevaFecha(lunes,6).getFullYear()}`;}
function viajesSemana(viajes, lunes) { const ini = isoDia(lunes); const fin = isoDia(nuevaFecha(lunes,6)); return viajes.filter(v => {const d=String(v.cita || "").slice(0,10);return d >= ini && d <= fin;}); }
function claseEstado(e){return e==="En curso"?"status-en-curso":e==="Finalizado"?"status-finalizado":"status-programado";}
const badgeEstado = e => `<span class="badge-status ${claseEstado(e)}">${seguro(e)}</span>`;
function tituloVacio(id, vacio) { const el=$(id); if(el) el.classList.toggle("d-none",!vacio); }
function idNuevo() { return "jlb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,7); }
function demoViajes(){
  const hoy=lunesDe(new Date());
  const cita=(d,h)=>isoDia(nuevaFecha(hoy,d))+"T"+h;
  return [
    {folio:"JLB-001",cliente:"Walmart",destino:"CEDIS Cuautitlán",carga:"Alimentos",solicitud:cita(0,"07:00"),cita:cita(1,"10:00"),chofer:"Juan Pérez",caja:"C-12",estado:"Programado",flete:7800,diesel:2150,casetas:480,extras:120,factura:"Pendiente"},
    {folio:"JLB-002",cliente:"Cremería San José",destino:"Tlalnepantla",carga:"Lácteos",solicitud:cita(1,"06:00"),cita:cita(2,"09:30"),chofer:"Luis García",caja:"C-07",estado:"En curso",flete:5900,diesel:1600,casetas:350,extras:0,factura:"Facturada"},
    {folio:"JLB-003",cliente:"Walmart",destino:"Toluca",carga:"Abarrotes",solicitud:cita(1,"12:00"),cita:cita(3,"07:30"),chofer:"Marco Ruiz",caja:"C-04",estado:"Programado",flete:8400,diesel:2300,casetas:630,extras:210,factura:"Pendiente"},
    {folio:"JLB-004",cliente:"Xhalostoc",destino:"Ecatepec",carga:"Mercancía general",solicitud:cita(-2,"07:15"),cita:cita(-1,"11:00"),chofer:"Pedro López",caja:"C-09",estado:"Finalizado",flete:4300,diesel:980,casetas:180,extras:60,factura:"Pagada"}
  ].map(v=>({id:idNuevo(),evidencia:null,...v}));
}
function inicio(){
  const viajes=leerViajes();
  $("kpiTotal").textContent=viajes.length;
  $("kpiProgramados").textContent=viajes.filter(v=>v.estado==="Programado").length;
  $("kpiCurso").textContent=viajes.filter(v=>v.estado==="En curso").length;
  $("kpiCobrar").textContent=dinero(viajes.filter(v=>v.factura!=="Pagada").reduce((a,v)=>a+n(v.flete),0));
  const hoy=isoDia(new Date());
  const proximos=viajes.filter(v=>String(v.cita).slice(0,10)>=hoy).sort((a,b)=>String(a.cita).localeCompare(String(b.cita))).slice(0,6);
  $("tablaInicio").innerHTML=proximos.map(v=>`<tr><td><strong>${seguro(v.folio)}</strong></td><td>${seguro(v.cliente)}</td><td>${seguro(v.destino)}</td><td>${seguro(fechaBonita(v.cita))}</td><td>${badgeEstado(v.estado)}</td></tr>`).join("");
  if(viajes.length && !proximos.length) $("tablaInicio").innerHTML='<tr><td colspan="5" class="text-center py-4 text-secondary">No hay citas próximas. Revisa el historial desde Registro de viajes.</td></tr>';
  tituloVacio("emptyHome",viajes.length===0);
  $("btnDemo")?.addEventListener("click",()=>{if(leerViajes().length) return; if(confirm("¿Cargar cuatro viajes ficticios para conocer el funcionamiento?")){if(guardarViajes(demoViajes())) location.reload();}});
}
function viajes(){
  const form=$("formViaje"); const campos=["folio","cliente","destino","carga","chofer","caja","solicitud","cita","estado","flete"];
  function limpiar(){form.reset();$("viajeId").value="";$("formTitle").textContent="Registrar nuevo viaje";$("btnGuardar").textContent="Guardar viaje";}
  function pintar(){
    const q=$("buscarViajes").value.trim().toLocaleLowerCase("es-MX");
    const lista=leerViajes().filter(v=>[v.folio,v.cliente,v.destino,v.chofer].join(" ").toLocaleLowerCase("es-MX").includes(q)).sort((a,b)=>String(b.cita).localeCompare(String(a.cita)));
    $("tablaViajes").innerHTML=lista.map(v=>`<tr><td><strong>${seguro(v.folio)}</strong></td><td><strong>${seguro(v.cliente)}</strong><br><span class="text-muted">${seguro(v.destino)}</span></td><td>${seguro(v.chofer)}<br><span class="text-muted">Caja ${seguro(v.caja)}</span></td><td>${seguro(fechaBonita(v.cita))}</td><td>${dinero(v.flete)}</td><td>${badgeEstado(v.estado)}</td><td><div class="d-flex gap-1"><button type="button" class="btn btn-sm btn-outline-primary" data-accion="editar" data-id="${seguro(v.id)}">Editar</button><button type="button" class="btn btn-sm btn-outline-danger" data-accion="borrar" data-id="${seguro(v.id)}">Borrar</button></div></td></tr>`).join("");
    tituloVacio("emptyViajes",lista.length===0);
  }
  form.addEventListener("submit",ev=>{
    ev.preventDefault();if(!form.reportValidity())return;
    const v=Object.fromEntries(campos.map(id=>[id,$(id).value.trim()]));
    v.flete=n(v.flete);const lista=leerViajes();
    const id=$("viajeId").value;
    if(lista.some(x=>x.folio.toLowerCase()===v.folio.toLowerCase()&&x.id!==id)){alert("Ya existe un viaje con ese folio. Usa otro.");return;}
    if(id){const idx=lista.findIndex(x=>x.id===id);if(idx<0){alert("El viaje no se encontró.");return;}lista[idx]={...lista[idx],...v};}
    else lista.push({id:idNuevo(),...v,diesel:0,casetas:0,extras:0,factura:"Pendiente",evidencia:null});
    if(guardarViajes(lista)){
      const aviso=$("avisoViaje");aviso.textContent=id?"¡Viaje actualizado correctamente!":"¡Viaje registrado correctamente!";aviso.classList.remove("d-none");
      limpiar();pintar();
    }
  });
  $("tablaViajes").addEventListener("click",ev=>{
    const btn=ev.target.closest("button[data-accion]");if(!btn)return;
    const lista=leerViajes();const v=lista.find(x=>x.id===btn.dataset.id);if(!v)return;
    if(btn.dataset.accion==="borrar"){
      if(confirm(`¿Eliminar el viaje ${v.folio}? También se eliminarán sus gastos, factura y evidencia.`)){
        if(guardarViajes(lista.filter(x=>x.id!==v.id))){if($("viajeId").value===v.id)limpiar();pintar();}
      }
    }else{
      campos.forEach(c=>$(c).value=v[c]??"");$("viajeId").value=v.id;
      $("formTitle").textContent="Editar viaje: " + v.folio;$("btnGuardar").textContent="Guardar cambios";
      $("avisoViaje").classList.add("d-none");form.scrollIntoView({behavior:"smooth",block:"start"});
    }
  });
  $("btnCancelar").addEventListener("click",()=>{limpiar();$("avisoViaje").classList.add("d-none");});
  $("buscarViajes").addEventListener("input",pintar);pintar();
}
function calendario(){
  let lunes=lunesDe(new Date());const dias=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  function pintar(){
    const lista=viajesSemana(leerViajes(),lunes);
    $("rangoSemana").textContent=rangoSemana(lunes);$("cuentaSemana").textContent=lista.length+" viaje(s)";
    $("calendarGrid").innerHTML=dias.map((nombre,i)=>{
      const d=nuevaFecha(lunes,i);const fech=isoDia(d);const hoy=fech===isoDia(new Date());
      const eventos=lista.filter(v=>String(v.cita).startsWith(fech)).sort((a,b)=>a.cita.localeCompare(b.cita));
      return `<article class="day-column"><div class="day-header ${hoy?"today":""}">${nombre}<strong>${d.getDate()}</strong></div><div class="day-body">${eventos.length?eventos.map(v=>`<div class="event ${v.estado==="Finalizado"?"done":v.estado==="En curso"?"course":""}"><div class="event-time">${seguro(String(v.cita).slice(11,16))}</div><div class="event-client">${seguro(v.cliente)}</div><div class="event-detail">${seguro(v.folio)} · ${seguro(v.destino)}</div></div>`).join(""):"<div class='day-empty'>Sin entregas</div>"}</div></article>`;
    }).join("");
  }
  $("prevWeek").addEventListener("click",()=>{lunes=nuevaFecha(lunes,-7);pintar();});
  $("nextWeek").addEventListener("click",()=>{lunes=nuevaFecha(lunes,7);pintar();});
  $("todayWeek").addEventListener("click",()=>{lunes=lunesDe(new Date());pintar();});pintar();
}
function csvCelda(s){return '"'+String(s??"").replace(/"/g,'""')+'"';}
function reportes(){
  let lunes=lunesDe(new Date());
  function pintar(){
    const lista=viajesSemana(leerViajes(),lunes).sort((a,b)=>a.cita.localeCompare(b.cita));
    const total=(campo)=>lista.reduce((a,v)=>a+n(v[campo]),0);
    $("rangoReporte").textContent=rangoSemana(lunes);
    $("sumaFletes").textContent=dinero(total("flete"));$("sumaDiesel").textContent=dinero(total("diesel"));
    $("sumaOtros").textContent=dinero(total("casetas")+total("extras"));
    $("sumaResultado").textContent=dinero(lista.reduce((a,v)=>a+resultado(v),0));
    $("tablaGastos").innerHTML=lista.map(v=>`<tr data-id="${seguro(v.id)}"><td><strong>${seguro(v.folio)}</strong><br><small class="text-muted">${seguro(v.cliente)}</small></td><td>${dinero(v.flete)}</td><td><input class="form-control form-control-sm" type="number" min="0" step="0.01" data-campo="diesel" value="${n(v.diesel)}" aria-label="Diésel ${seguro(v.folio)}"></td><td><input class="form-control form-control-sm" type="number" min="0" step="0.01" data-campo="casetas" value="${n(v.casetas)}" aria-label="Casetas ${seguro(v.folio)}"></td><td><input class="form-control form-control-sm" type="number" min="0" step="0.01" data-campo="extras" value="${n(v.extras)}" aria-label="Gastos extra ${seguro(v.folio)}"></td><td><strong>${dinero(resultado(v))}</strong></td><td><button class="btn btn-jlb btn-sm" data-save="${seguro(v.id)}" type="button">Guardar</button></td></tr>`).join("");
    tituloVacio("emptyGastos",lista.length===0);
  }
  $("tablaGastos").addEventListener("click",ev=>{
    const btn=ev.target.closest("button[data-save]");if(!btn)return;
    const tr=btn.closest("tr");const lista=leerViajes();const v=lista.find(x=>x.id===btn.dataset.save);if(!v)return;
    const inputs=[...tr.querySelectorAll("input[data-campo]")];
    if(inputs.some(x=>x.value===""||Number(x.value)<0||!Number.isFinite(Number(x.value)))){alert("Escribe cantidades válidas, iguales o mayores a cero.");return;}
    inputs.forEach(input=>v[input.dataset.campo]=n(input.value));
    if(guardarViajes(lista)){pintar();alert("Gastos guardados correctamente.");}
  });
  $("btnCSV").addEventListener("click",()=>{
    const lista=viajesSemana(leerViajes(),lunes);
    const lineas=[["Folio","Cliente","Destino","Fecha de cita","Flete sin IVA","Diesel","Casetas","Extras","Resultado","Factura"],...lista.map(v=>[v.folio,v.cliente,v.destino,v.cita,n(v.flete),n(v.diesel),n(v.casetas),n(v.extras),resultado(v),v.factura])];
    const csv="\uFEFF"+lineas.map(linea=>linea.map(csvCelda).join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="reporte_JLB_"+isoDia(lunes)+".csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  });
  $("prevReport").addEventListener("click",()=>{lunes=nuevaFecha(lunes,-7);pintar();});
  $("nextReport").addEventListener("click",()=>{lunes=nuevaFecha(lunes,7);pintar();});
  $("currentReport").addEventListener("click",()=>{lunes=lunesDe(new Date());pintar();});pintar();
}
function reducirFoto(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith("image/")){reject(new Error("Selecciona una imagen."));return;}
    if(file.size>6*1024*1024){reject(new Error("La imagen supera 6 MB."));return;}
    const r=new FileReader();r.onerror=()=>reject(new Error("No se pudo leer la imagen."));
    r.onload=()=>{
      const img=new Image();img.onerror=()=>reject(new Error("El archivo no es una fotografía válida."));
      img.onload=()=>{
        const m=900;const scale=Math.min(1,m/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",.68));
      };img.src=String(r.result);
    };r.readAsDataURL(file);
  });
}
function facturas(){
  function pintar(){
    const lista=leerViajes().sort((a,b)=>String(b.cita).localeCompare(String(a.cita)));
    $("factPendientes").textContent=lista.filter(v=>v.factura==="Pendiente").length;
    $("factFacturadas").textContent=lista.filter(v=>v.factura==="Facturada").length;
    $("factPagadas").textContent=lista.filter(v=>v.factura==="Pagada").length;
    $("listaFacturas").innerHTML=lista.map(v=>`<div class="col-lg-6"><article class="invoice-card" data-id="${seguro(v.id)}"><div class="d-flex justify-content-between gap-2 align-items-start"><div><h3>🚚 ${seguro(v.folio)} · ${seguro(v.cliente)}</h3><div class="invoice-meta">${seguro(v.destino)} · ${seguro(fechaBonita(v.cita))}</div></div><span class="soft-tag">${dinero(v.flete)}</span></div><label class="form-label" for="f_${seguro(v.id)}">Estado de la factura</label><div class="d-flex gap-2 flex-wrap"><select class="form-select form-select-sm flex-grow-1" style="max-width:190px" id="f_${seguro(v.id)}" data-factura>${FACTURAS.map(f=>`<option ${v.factura===f?"selected":""}>${f}</option>`).join("")}</select><button class="btn btn-jlb btn-sm" type="button" data-accion="save">Guardar estado</button></div><hr><label class="form-label">Fotografía del folio de entrega</label><input class="form-control form-control-sm mb-2" type="file" accept="image/*" data-photo aria-label="Adjuntar foto del folio ${seguro(v.folio)}"><div class="invoice-actions"><button class="btn btn-outline-danger btn-sm" type="button" data-accion="upload">Guardar fotografía</button>${v.evidencia?`<button class="btn btn-outline-secondary btn-sm" type="button" data-accion="remove">Quitar fotografía</button>`:""}</div>${v.evidencia?`<img class="invoice-img" alt="Fotografía del folio ${seguro(v.folio)}" src="${v.evidencia}">`:`<p class="form-help mt-2 mb-0">Aún no se ha subido evidencia.</p>`}</article></div>`).join("");
    tituloVacio("emptyFacturas",lista.length===0);
  }
  $("listaFacturas").addEventListener("click",async ev=>{
    const btn=ev.target.closest("button[data-accion]");if(!btn)return;
    const card=btn.closest("article[data-id]");if(!card)return;
    const lista=leerViajes();const v=lista.find(x=>x.id===card.dataset.id);if(!v)return;
    if(btn.dataset.accion==="save"){
      v.factura=card.querySelector("select[data-factura]").value;
      if(guardarViajes(lista)){pintar();alert("Estado de factura actualizado.");}
    }else if(btn.dataset.accion==="remove"){
      if(confirm("¿Quitar esta fotografía del folio?")){v.evidencia=null;if(guardarViajes(lista))pintar();}
    }else if(btn.dataset.accion==="upload"){
      const input=card.querySelector("input[data-photo]");const file=input.files?.[0];if(!file){alert("Primero selecciona una fotografía.");return;}
      btn.disabled=true;btn.textContent="Guardando…";
      try {v.evidencia=await reducirFoto(file);if(guardarViajes(lista)){pintar();alert("Fotografía guardada en este navegador.");}}
      catch(err){alert(err.message);btn.disabled=false;btn.textContent="Guardar fotografía";}
    }
  });pintar();
}
document.addEventListener("DOMContentLoaded",()=>{
  switch(document.body.dataset.page){
    case "index.html": inicio();break;
    case "viajes.html": viajes();break;
    case "calendario.html": calendario();break;
    case "reportes.html": reportes();break;
    case "facturas.html": facturas();break;
  }
});
