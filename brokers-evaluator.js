(function(root){
 'use strict';
 const marker=/\[PREEVALUACION:(EV-[a-f0-9]{20})\]/g;
 function caseId(notes){return [...String(notes||'').matchAll(marker)].at(-1)?.[1]||'';}
 function hasCase(notes,id){return [...String(notes||'').matchAll(marker)].some(m=>m[1]===id);}
 function recordFromEvaluation(e,existing){
  if(!e||!/^EV-[a-f0-9]{20}$/.test(e.id)||!e.broker_id)throw Error('Preevaluación inválida.');
  if(existing&&!(existing.broker_ids||[]).includes(e.broker_id))throw Error('La preevaluación pertenece a otra cartera.');
  const r=Object.assign({},existing||{kind:'Terreno',stage:'Recibido',broker_ids:[e.broker_id]});
  r.title=r.title||e.title;r.location=r.location||e.location;r.documents_url=r.documents_url||e.folder_url;
  const line='[PREEVALUACION:'+e.id+'] '+(typeof e.site_area==='number'?e.site_area.toLocaleString('es-MX')+' m² de terreno. ':'')+'Revisión '+e.revision+'. Resultado preliminar; revisar supuestos y fuentes antes de solicitar el plan.';
  const notes=String(r.notes||''),tag='\n\n[YOD-CASE v1]\n',at=notes.lastIndexOf(tag);
  let body=notes,suffix='';
  if(at>=0)try{const meta=JSON.parse(notes.slice(at+tag.length));if(meta.v===1){body=notes.slice(0,at);suffix=notes.slice(at);}}catch{}
  const prior=body.split('\n'),prefix='[PREEVALUACION:'+e.id+']';
  const found=prior.findIndex(x=>x.startsWith(prefix));
  if(found>=0)prior.splice(found,1);
  r.notes=[prior.join('\n'),line].filter(Boolean).join('\n')+suffix;
  if(r.notes.length>4000)throw Error('Las notas no tienen espacio para la referencia. Conserva la evaluación y ajusta las notas del expediente.');
  return r;
 }
 function create(config,token,fetcher){
  async function request(op,extra){
   const key=token();if(!key)throw Error('Entra a YOD OS para validar tu sesión.');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
   try{
    const response=await fetcher(config.evaluatorUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action:'evaluator_broker',op,k:key},extra)),signal:controller.signal,cache:'no-store',credentials:'omit'});
    const data=await response.json();
    if(token()!==key)throw Error('La sesión cambió. Vuelve a abrir la preevaluación.');
    if(!response.ok||!data.ok)throw Error(({broker_not_linked:'Dirección debe vincular tu correo verificado con tu perfil de Masterbroker.',forbidden:'Esta preevaluación no pertenece a tu cartera.',expired_link:'El acceso venció. Vuelve a abrirlo desde el tablero.',broker_connection:'No se pudo verificar la cartera con el CRM.'})[data.error]||'No se confirmó la conexión con el evaluador.');
    return data;
   }catch(e){if(e.name==='AbortError')throw Error('La conexión tardó demasiado. Vuelve a abrir la preevaluación.');throw e;}finally{clearTimeout(timer);}
  }
  return {launch:async data=>{
   const r=await request('broker_launch',data),u=new URL(r.url),base=new URL(config.evaluatorUrl);
   if(u.origin!==base.origin||u.pathname!==base.pathname||u.searchParams.get('app')!=='evaluador'||!/^[a-f0-9]{64}$/.test(u.searchParams.get('handoff')||''))throw Error('Destino de preevaluación inválido.');
   return u.href;
  },summary:async id=>(await request('broker_summary',{case_id:id})).evaluation};
 }
 const api={caseId,hasCase,recordFromEvaluation,create};if(typeof module!=='undefined')module.exports=api;root.BrokerEvaluator=api;
})(typeof window==='undefined'?globalThis:window);
