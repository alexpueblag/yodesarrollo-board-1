(function(){
'use strict';
const C=window.InvestorStoryCore,$=id=>document.getElementById(id);
const story=$('story'),root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
let content=null,p=0,phase=-1,playing=false,raf=0,last=0,lastScroll=0,chapter=-1,bound=false,scrollFrame=0;
function bounds(){return {start:window.scrollY+story.getBoundingClientRect().top,travel:Math.max(1,story.offsetHeight-innerHeight)};}
function moveTo(v){const b=bounds();window.scrollTo(0,b.start+C.clamp(v)*b.travel);render(C.clamp(v));}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;if(content){$('play').textContent=content.play_label;$('play').setAttribute('aria-pressed','false');}}
function frame(ts){if(!playing||document.hidden)return stop();if(!last)last=ts;const dt=Math.min(100,ts-last);last=ts;const next=C.clamp(p+dt/content.totalDuration);moveTo(next);if(next>=1)return stop();raf=requestAnimationFrame(frame);}
function play(){if(!content)return;if(reduce.matches){goPhase(content.chapters[chapter].phases.length-1);return;}if(playing)return stop();if(p>=.999)moveTo(0);playing=true;last=0;$('play').textContent=content.pause_label;$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(frame);}
function render(v){
 if(!content)return;p=C.clamp(v);root.style.setProperty('--p',p);$('progress').value=p;

 const at=C.locate(content.chapters,p),ch=content.chapters[at.index],local=at.local;
 if(chapter!==at.index){
  chapter=at.index;phase=-1;root.dataset.chapter=String(ch.number);
  $('chapterKicker').textContent=ch.kicker;$('chapterTitle').textContent=ch.title;$('chapterLead').textContent=ch.lead;$('schemaNote').textContent=ch.schema_note;
  document.querySelector('.chapter-label').textContent=ch.kicker;
  document.querySelectorAll('button[data-chapter]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.chapter)===chapter?'step':'false'));
  const nav=document.querySelector('.phase-nav');nav.replaceChildren();
  ch.phases.forEach((s,i)=>{const b=document.createElement('button'),num=document.createElement('span'),label=document.createElement('b');b.dataset.phase=String(i);num.textContent=String(i+1).padStart(2,'0');label.textContent=s.nav;b.append(num,label);b.onclick=()=>goPhase(i);nav.append(b);});nav.style.gridTemplateColumns='repeat('+ch.phases.length+',minmax(0,1fr))';
  $('nextChapter').hidden=content.chapters.length<2;
  $('analysisPanel').replaceChildren();$('analysisPanel').hidden=chapter===0;
  if(chapter>0){
   const groups=ch.number===2?[[ch.step1,ch.step2,ch.step3],[ch.step4,ch.step5],[ch.step6,ch.step7]]:[Array.from({length:6},(_,i)=>ch['market'+(i+1)]),Array.from({length:7},(_,i)=>ch['finance'+(i+1)]),Array.from({length:3},(_,i)=>ch['stress'+(i+1)])];
   const cards=document.createElement('div');cards.className='analysis-cards';let step=0;
   groups.forEach((items,i)=>{const card=document.createElement('section');card.className='analysis-card';card.dataset.group=String(i);const h=document.createElement('h3');h.textContent=ch['group'+(i+1)+'_title'];const list=document.createElement('ol');items.forEach(text=>{const li=document.createElement('li');if(ch.number===2){const n=document.createElement('span');n.className='step-number';n.textContent=String(++step).padStart(2,'0');li.append(n);}const t=document.createElement('span');t.textContent=text;li.append(t);list.append(li);});card.append(h,list);cards.append(card);});
   const gate=document.createElement('p');gate.className='decision-gate';gate.textContent=ch.gate;const note=document.createElement('p');note.className='panel-note';note.textContent=ch.panel_note;$('analysisPanel').append(cards,gate,note);
  }
 }
 const ph=at.phase;
 if(ph!==phase){phase=ph;const s=ch.phases[ph];$('phaseLabel').textContent=s.label;$('phaseTitle').textContent=s.title;$('phaseBody').textContent=s.body;$('stepCount').textContent=String(chapter+1).padStart(2,'0')+' · '+String(ph+1).padStart(2,'0')+' / '+String(ch.phases.length).padStart(2,'0');document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.phase)===ph?'step':'false'));document.querySelectorAll('[data-group]').forEach(el=>el.classList.toggle('active',Number(el.dataset.group)===ph));}
 // The property stays in the same SVG; only the first chapter transforms it.
 const diagramP=chapter===0?local:1,build=C.smooth(.43,.73,diagramP),envelope=C.smooth(.18,.35,diagramP)*(1-C.smooth(.61,.78,diagramP)),evaluation=C.smooth(.78,.96,diagramP);
 document.querySelectorAll('.existing-house').forEach(el=>el.style.opacity=1-build);
 document.querySelectorAll('.envelope').forEach(el=>el.style.opacity=envelope);
 document.querySelectorAll('.new-building').forEach(el=>{el.style.opacity=build;el.setAttribute('transform','translate(0 '+(90*(1-build)).toFixed(2)+')');});
 document.querySelectorAll('.valuation-frame').forEach(el=>el.style.opacity=evaluation);
 document.querySelectorAll('.scanline').forEach(el=>el.setAttribute('transform','translate(0 '+(175*evaluation).toFixed(2)+')'));
 for(const [cls,o] of [['capital',1-C.smooth(.24,.47,diagramP)],['property',C.smooth(.12,.28,diagramP)*(1-C.smooth(.62,.8,diagramP))],['development',C.smooth(.46,.65,diagramP)],['sale',C.smooth(.64,.84,diagramP)],['return',C.smooth(.71,.9,diagramP)]])document.querySelectorAll('.callout-'+cls).forEach(el=>el.style.opacity=o);
 const route=$('capitalRoute');if(route){const length=route.getTotalLength(),at=route.getPointAtLength(length*C.clamp(p*.94+.025));document.querySelectorAll('.investor-token').forEach(el=>el.setAttribute('transform','translate('+at.x.toFixed(2)+' '+at.y.toFixed(2)+')'));const guide=route.getPointAtLength(length*C.clamp(p*.85+.08));document.querySelectorAll('.guide').forEach(el=>el.setAttribute('transform','translate('+guide.x.toFixed(2)+' '+(guide.y-22).toFixed(2)+')'));const stride=reduce.matches?5:3+Math.abs(Math.sin(p*75))*4;document.querySelectorAll('.guide-legs').forEach(el=>el.setAttribute('d','M0 0l-'+stride.toFixed(1)+' 14M0 0l'+stride.toFixed(1)+' 14'));document.querySelectorAll('.capital-trace').forEach(el=>{el.style.strokeDasharray=length;el.style.strokeDashoffset=length*(1-C.smooth(.03,.95,p));});}
}
function goPhase(index){stop();const d=content.chapters[chapter],start=C.chapterStart(content.chapters,chapter);const v=start+((index+.15)/d.phases.length)*d.duration/content.totalDuration;moveTo(v);}
function goChapter(index){stop();const n=Math.max(0,Math.min(content.chapters.length-1,index));moveTo(C.chapterStart(content.chapters,n)+.0001);}
function onScroll(){if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(!content)return;if(reduce.matches)return;const box=story.getBoundingClientRect();render(C.progress(box.top,story.offsetHeight,innerHeight));lastScroll=window.scrollY;});}
function resize(){if(!content)return;root.style.setProperty('--vh',innerHeight+'px');root.classList.toggle('smallheight',innerHeight<740);story.style.height=reduce.matches?'auto':(innerHeight*content.totalScreens)+'px';onScroll();}
function repeat(){stop();moveTo(reduce.matches?1:0);$('play').focus({preventScroll:true});}
async function share(){
 const url=C.publicLink(location.href);$('shareUrl').value=url;$('shareStatus').textContent='';
 if(navigator.share){try{await navigator.share({title:content.title,url});return;}catch(e){if(e.name==='AbortError')return;}}
 $('shareDialog').showModal();$('shareUrl').focus();$('shareUrl').select();
 try{await navigator.clipboard.writeText(url);$('shareStatus').textContent='Enlace copiado.';}catch(_){$('shareStatus').textContent='Puedes copiar el enlace desde este campo.';}
}
function bind(){
 if(bound)return;bound=true;$('play').onclick=play;$('repeat').onclick=repeat;$('complete').onclick=()=>{stop();moveTo(1);};$('replayEnd').onclick=repeat;$('share').onclick=share;$('copyShare').onclick=async()=>{try{await navigator.clipboard.writeText($('shareUrl').value);$('shareStatus').textContent='Enlace copiado.';}catch(_){$('shareUrl').focus();$('shareUrl').select();$('shareStatus').textContent='Selecciona y copia el enlace.';}};
 $('nextChapter').onclick=()=>{if(chapter<content.chapters.length-1)goChapter(chapter+1);else{stop();$('bridge').scrollIntoView();}};
 $('chapterNav').addEventListener('click',e=>{const b=e.target.closest('button[data-chapter]');if(b)goChapter(Number(b.dataset.chapter));});
 window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',()=>{stop();resize();});
 for(const type of ['wheel','touchstart','pointerdown'])window.addEventListener(type,e=>{if(playing&&!e.target.closest('.playback'))stop();},{passive:true});
 window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest('button,input,dialog'))stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduce.addEventListener('change',()=>{stop();resize();render(reduce.matches?1:p);});
 $('shareDialog').addEventListener('click',e=>{if(e.target===$('shareDialog'))$('shareDialog').close();});
}
async function load(){
 $('retry').hidden=true;$('load-message').textContent='Preparando la presentación…';
 try{
  content=C.normalize(await window.YodPublicCopy());document.title=content.title+' · '+content.brand;
  for(const k of ['primary','ink','paper'])root.style.setProperty('--'+k,content[k]);
  document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=content[el.dataset.copy]||'');
  $('brandLogo').alt=content.brand;$('brandLogo').src=content.logo_url;$('brandLogo').onerror=()=>{$('brandLogo').hidden=true;$('brandText').hidden=false;$('brandText').textContent=content.brand;};
  $('chapterNav').replaceChildren();content.chapters.forEach((ch,i)=>{const b=document.createElement('button');b.dataset.chapter=String(i);const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');const label=document.createElement('b');label.textContent=ch.nav;b.append(n,label);$('chapterNav').append(b);});$('chapterNav').hidden=content.chapters.length<2;
  const final=content.chapters[content.chapters.length-1];document.querySelectorAll('#bridge [data-copy]').forEach(el=>el.textContent=final[el.dataset.copy]||content[el.dataset.copy]||'');
  phase=-1;chapter=-1;
  if(!$('bridgeModel').children.length){const clone=document.querySelector('.diagram').cloneNode(true);clone.removeAttribute('aria-labelledby');clone.setAttribute('aria-hidden','true');clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));$('bridgeModel').append(clone);}
  $('loading').hidden=true;$('presentation').hidden=false;bind();resize();render(reduce.matches?1:0);onScroll();
 }catch(e){content=null;$('presentation').hidden=true;$('loading').hidden=false;$('load-message').textContent=e.name==='AbortError'?'La conexión tardó. Vuelve a intentar.':'No se pudo cargar la presentación. Vuelve a intentar.';$('retry').hidden=false;console.warn('Presentation content unavailable');}
}
$('retry').onclick=load;load();
})();
