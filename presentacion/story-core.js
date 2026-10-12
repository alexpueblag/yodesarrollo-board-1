(function(root){
'use strict';
const fields=['brand','logo_url','kicker','title','lead','schema_note','bridge_kicker','bridge_title','bridge_body','bridge_1','bridge_2','bridge_3','play_label','pause_label','repeat_label','complete_label','share_label','scroll_hint','replay_cta','capital_label','property_label','development_label','sale_label','recovery_label','material_title','material_body','material_open','material_copy'];
function clamp(x,a=0,b=1){const n=Number(x);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;}
function smooth(a,b,p){const x=clamp((p-a)/(b-a));return x*x*(3-2*x);}
function phase(p){return Math.min(3,Math.floor(clamp(p)*4));}
function progress(top,total,viewport){return total>viewport?clamp(-top/(total-viewport)):0;}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch(_){return '';}}
function normalize(input){
 const raw=input&&input.textos?input.textos:input;if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Contenido no disponible.');
 const c={};for(const [k,v]of Object.entries(raw)){if(k.startsWith('inv1_'))c[k.slice(5)]=String(v??'').trim();}
 if(c.version!=='1')throw Error('La presentación todavía no tiene contenido disponible.');
 for(const key of fields)if(!c[key])throw Error('Falta contenido de la presentación: '+key);
 c.phases=Array.from({length:4},(_,i)=>{const n=i+1,p={label:c['phase'+n+'_label'],title:c['phase'+n+'_title'],body:c['phase'+n+'_body'],nav:c['phase'+n+'_nav']||c['phase'+n+'_label']};if(Object.values(p).some(x=>!x))throw Error('Contenido incompleto.');return p;});
 if(!safeUrl(c.logo_url))throw Error('La imagen de marca no está disponible.');
 for(const k of ['primary','ink','paper'])if(!/^#[a-f0-9]{6}$/i.test(c[k]||''))throw Error('Configuración visual inválida.');
 c.duration=clamp(Number(c.duration_seconds)||22,10,90)*1000;c.screens=clamp(Number(c.scroll_screens)||3.5,2,6);
 c.material_profile=safeUrl(c.material_profile);return c;
}
function publicLink(url){const u=new URL(url);u.search='';u.hash='';return u.href;}
const api={clamp,smooth,phase,progress,safeUrl,normalize,publicLink,fields};if(typeof module!=='undefined')module.exports=api;root.InvestorStoryCore=api;
})(typeof window==='undefined'?globalThis:window);
