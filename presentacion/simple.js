(function(){'use strict';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0)),reduce=matchMedia('(prefers-reduced-motion:reduce)');
let cfg=null,p=0,scene=-1,step=-1,playing=false,frame=0,last=0,scrollFrame=0,range=1,activeSvg=null;
const set=(e,v)=>{if(e)e.textContent=String(v??'');},control=(k,f='')=>cfg?.controls?.[k]||f;
function node(tag,value){const e=document.createElement(tag);if(value!==undefined)set(e,value);return e;}
function cleanURL(){const u=new URL(location.href);u.search='';u.hash='';return u.href;}
function measure(){const h=$('simpleHeader').getBoundingClientRect().height;document.documentElement.style.setProperty('--s-header',h+'px');range=Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function progress(){return clamp(scrollY/range);}
function reveal(local){const paths=activeSvg?.querySelectorAll('[data-stage]')||[],rect=activeSvg?.getBoundingClientRect(),vb=activeSvg?.viewBox.baseVal,scale=rect&&vb?Math.min(rect.width/vb.width,rect.height/vb.height):1;for(const path of paths){path.style.strokeWidth=String(7/Math.max(.001,scale));const stage=Number(path.dataset.stage),v=reduce.matches||(scene===0&&stage===0)?1:clamp(local*3-stage);path.style.strokeDashoffset=String((1-v)*100);}}
function drawScene(s,local){
 $('simpleDiagram').innerHTML=window.YodSimpleDiagrams.renderSVG(s.id,local);
 activeSvg=$('simpleDiagram').querySelector('svg');
 if(activeSvg){activeSvg.setAttribute('focusable','false');if(!reduce.matches)$('simpleDiagram').animate([{opacity:0,clipPath:'inset(0 0 0 100%)'},{opacity:1,clipPath:'inset(0 0 0 0%)'}],{duration:260,easing:'ease-out'});}
}
function labels(s,j){$('simpleLabels').replaceChildren();s.stages[j].labels.forEach((value,i)=>{const e=node('span',value);e.style.opacity=i<=j?'1':'.5';$('simpleLabels').append(e);});}
function render(value){
 if(!cfg)return;p=clamp(value);const g=p*7,n=Math.min(6,Math.floor(g)),local=p===1?1:g-n,j=Math.min(2,Math.floor(local*3)),s=cfg.scenes[n],changed=n!==scene;
 if(changed){scene=n;drawScene(s,local);set($('simpleTitle'),s.title);set($('simpleLead'),s.lead);set($('simpleCount'),String(n+1).padStart(2,'0')+' / 07');}
 if(changed||j!==step){step=j;set($('simpleCaptionTitle'),s.stages[j].title);set($('simpleCaptionBody'),s.stages[j].body);labels(s,j);[...$('simpleSteps').children].forEach((e,i)=>e.classList.toggle('active',i<=j));}
 reveal(local);$('simplePrev').disabled=n===0&&j===0;$('simpleNext').hidden=n===6;$('simpleReplay').hidden=n===6;$('simpleContact').hidden=n!==6;
}
function move(value){measure();scrollTo({top:clamp(value)*range,behavior:'instant'});render(value);}
function pause(){playing=false;cancelAnimationFrame(frame);$('simplePlay').setAttribute('aria-pressed','false');$('simplePlay').setAttribute('aria-label',control('play','Animar'));set($('simplePlay').firstElementChild,'▶');}
function seekScene(n,j=0){pause();move((clamp(n,0,6)+(clamp(j,0,2)+.5)/3)/7);}
function reset(){pause();move(.035/7);}
function tick(now){if(!playing)return;const dt=last?Math.min(120,now-last):0;last=now;const next=Math.min(1,p+dt/(Number(cfg.motion.durationSeconds||63)*1000));move(next);if(next===1)pause();else frame=requestAnimationFrame(tick);}
function play(){if(!cfg||reduce.matches)return pause();if(playing)return pause();if(p>.999)reset();playing=true;last=0;$('simplePlay').setAttribute('aria-label',control('pause','Pausar'));$('simplePlay').setAttribute('aria-pressed','true');set($('simplePlay').firstElementChild,'Ⅱ');frame=requestAnimationFrame(tick);}
function buildReader(){
 const root=$('simpleReaderArticles');root.replaceChildren();
 cfg.scenes.forEach((s,i)=>{const section=node('section');section.id='simpleReading'+i;section.dataset.scene=String(i);section.append(node('h3',s.title),node('p',s.lead));
 for(const block of s.reader||[]){const article=node('article');article.append(node('h4',block.title));if(block.lead)article.append(node('p',block.lead));for(const beat of block.beats||[]){article.append(node('h4',beat.title),node('p',beat.body));}for(const group of block.details||[]){article.append(node('h4',group.title));const list=node('ul');for(const item of group.items||[])list.append(node('li',item));article.append(list);}section.append(article);}root.append(section);});
 $('simpleFootnotes').replaceChildren();for(const f of cfg.footnotes||[])$('simpleFootnotes').append(node('p',f));
}
function openReader(){pause();$('simpleReader').showModal();requestAnimationFrame(()=>document.getElementById('simpleReading'+scene).scrollIntoView({block:'start'}));}
function openContact(i){pause();const c=cfg.cta[i];set($('simpleMessageTitle'),c.label);$('simpleMessage').value=c.message+'\n\n'+cleanURL();set($('simpleCopyStatus'),'');$('simpleMessageDialog').showModal();}
async function copy(){try{await navigator.clipboard.writeText($('simpleMessage').value);set($('simpleCopyStatus'),control('copied','Copiado'));}catch(_){$('simpleMessage').focus();$('simpleMessage').select();}}
async function share(){pause();const url=cleanURL();try{if(navigator.share){await navigator.share({title:cfg.brand,url});return;}await navigator.clipboard.writeText(url);}catch(e){if(e.name==='AbortError')return;set($('simpleMessageTitle'),control('share','Compartir'));$('simpleMessage').value=url;$('simpleMessageDialog').showModal();}}
function normalize(payload){let c=(payload.textos||payload).simple_config;if(typeof c==='string')c=JSON.parse(c);if(!c||!Array.isArray(c.scenes)||c.scenes.length!==7)throw Error('Falta la versión simplificada.');for(const s of c.scenes){if(!s.id||!s.title||!s.lead||s.stages?.length!==3||!Array.isArray(s.reader))throw Error('Escena incompleta.');for(const b of s.stages)if(!b.body||b.labels?.length!==3||!b.labels.every(x=>typeof x==='string'))throw Error('Paso incompleto.');}if(c.cta?.length!==2)throw Error('Falta el contacto.');return c;}
function mount(payload){
 cfg=normalize(payload);for(const key of ['paper','ink','accent'])if(/^#[0-9a-f]{6}$/i.test(cfg.theme?.[key]))document.documentElement.style.setProperty('--s-'+key,cfg.theme[key]);
 document.title=cfg.brand+' · '+cfg.scenes[0].title;set($('simpleBrand'),cfg.brand);set($('simpleDetails'),control('details','Detalle'));set($('simpleReaderTitle'),control('details','Detalle'));set($('simpleNext'),control('next','Siguiente'));set($('simpleArchive'),control('archive','Ver versión anterior'));set($('simpleArchiveTitle'),control('archive','Versión anterior'));set($('simpleCopy'),control('copy','Copiar'));
 for(const id of ['simpleReaderClose','simpleArchiveClose','simpleMessageClose'])$(id).setAttribute('aria-label',control('close','Cerrar'));
 $('simplePrev').setAttribute('aria-label',control('previous','Anterior'));$('simpleReplay').setAttribute('aria-label',control('replay','Reiniciar'));$('simpleShare').setAttribute('aria-label',control('share','Compartir'));
 $('simpleContact').replaceChildren();cfg.cta.forEach((c,i)=>{const b=node('button',c.label);b.type='button';b.dataset.choice=String(i);b.onclick=()=>openContact(i);$('simpleContact').append(b);});buildReader();$('simpleLoading').hidden=true;$('simple').hidden=false;scene=-1;step=-1;measure();render(.035/7);pause();
}
async function load(){try{$('simpleRetry').hidden=true;mount(await window.YodPublicCopy());}catch(error){$('simpleLoading').hidden=false;$('simpleRetry').hidden=false;console.warn(error.message);}}
$('simplePlay').onclick=play;$('simpleReplay').onclick=reset;$('simpleNext').onclick=()=>seekScene(scene+1);$('simplePrev').onclick=()=>seekScene(scene-1);$('simpleDetails').onclick=openReader;$('simpleShare').onclick=share;$('simpleCopy').onclick=copy;$('simpleRetry').onclick=load;
$('simpleReaderClose').onclick=()=>$('simpleReader').close();$('simpleArchiveClose').onclick=()=>{$('simpleArchiveDialog').close();$('simpleArchiveFrame').src='about:blank';};$('simpleMessageClose').onclick=()=>$('simpleMessageDialog').close();
$('simpleArchive').onclick=()=>{pause();$('simpleReader').close();$('simpleArchiveDialog').showModal();$('simpleArchiveFrame').src='archive.html';};
window.addEventListener('scroll',()=>{if(!cfg)return;cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>render(progress()));},{passive:true});window.addEventListener('resize',()=>{if(!cfg)return;pause();move(p);});for(const type of ['wheel','touchstart','pointerdown'])window.addEventListener(type,event=>{if(playing&&!event.target.closest('#simplePlay'))pause();},{passive:true});window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('button,textarea,dialog'))pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});reduce.addEventListener('change',()=>{pause();render(p);});
window.YodSimple={mount,normalize,api:{seekScene,play,pause,reset,state:()=>({p,scene,step,playing,version:cfg?.version})}};load();
})();