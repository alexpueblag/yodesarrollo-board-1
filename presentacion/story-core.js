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
 c.material_profile=safeUrl(c.material_profile);
 c.nav=c.chapter1_nav||c.kicker;c.chapters=[{...c,number:1}];
 for(let n=2;n<=3;n++){
  const d={number:n};for(const[k,v]of Object.entries(raw))if(k.startsWith('inv'+n+'_'))d[k.slice(5)]=String(v??'').trim();
  if(!d.version)continue;if(c.chapters.length!==n-1||d.version!=='1')throw Error('Secuencia de capítulos inválida.');
  const required=['kicker','nav','title','lead','schema_note','gate','panel_note','group1_title','group2_title','group3_title'];
  if(n===2)for(let i=1;i<=7;i++)required.push('step'+i);
  if(n===3){for(const[t,total]of [['market',6],['finance',7],['stress',3]])for(let i=1;i<=total;i++)required.push(t+i);for(const k of ['bridge_kicker','bridge_title','bridge_body','bridge_1','bridge_2','bridge_3','replay_cta'])required.push(k);}
  for(const k of required)if(!d[k])throw Error('Contenido incompleto: inv'+n+'_'+k);
  d.phases=Array.from({length:3},(_,i)=>{const z=i+1,s={};for(const k of ['label','title','body','nav']){s[k]=d['phase'+z+'_'+k];if(!s[k])throw Error('Fase incompleta.');}return s;});
  d.duration=clamp(Number(d.duration_seconds)||24,10,90)*1000;d.screens=clamp(Number(d.scroll_screens)||3,2,6);c.chapters.push(d);
 }
 c.totalDuration=c.chapters.reduce((a,d)=>a+d.duration,0);c.totalScreens=c.chapters.reduce((a,d)=>a+d.screens,0);
 return c;
}
function publicLink(url){const u=new URL(url);u.search='';u.hash='';return u.href;}
function locate(chapters,p){p=clamp(p);const total=chapters.reduce((a,d)=>a+d.duration,0);let start=0;for(let i=0;i<chapters.length;i++){const end=start+chapters[i].duration/total;if(p<end||i===chapters.length-1){const local=clamp((p-start)/(end-start));return {index:i,local,phase:Math.min(chapters[i].phases.length-1,Math.floor(local*chapters[i].phases.length)),start,end};}start=end;}}
function chapterStart(chapters,index){const total=chapters.reduce((a,d)=>a+d.duration,0);return chapters.slice(0,index).reduce((a,d)=>a+d.duration,0)/total;}
const api={locate,chapterStart,clamp,smooth,phase,progress,safeUrl,normalize,publicLink,fields};if(typeof module!=='undefined')module.exports=api;root.InvestorStoryCore=api;
})(typeof window==='undefined'?globalThis:window);
