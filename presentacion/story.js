(function(){
'use strict';
const C=window.InvestorStoryCore,$=id=>document.getElementById(id);
const story=$('story'),root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
let content=null,p=0,phase=-1,playing=false,raf=0,last=0,lastScroll=0,bound=false,scrollFrame=0;
function bounds(){return {start:window.scrollY+story.getBoundingClientRect().top,travel:Math.max(1,story.offsetHeight-innerHeight)};}
function moveTo(v){const b=bounds();window.scrollTo(0,b.start+C.clamp(v)*b.travel);render(C.clamp(v));}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;if(content){$('play').textContent=content.play_label;$('play').setAttribute('aria-pressed','false');}}
function frame(ts){if(!playing||document.hidden)return stop();if(!last)last=ts;const dt=Math.min(100,ts-last);last=ts;const next=C.clamp(p+dt/content.duration);moveTo(next);if(next>=1)return stop();raf=requestAnimationFrame(frame);}
function play(){if(!content)return;if(reduce.matches){moveTo(1);return;}if(playing)return stop();if(p>=.999)moveTo(0);playing=true;last=0;$('play').textContent=content.pause_label;$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(frame);}
function render(v){
 if(!content)return;p=C.clamp(v);root.style.setProperty('--p',p);$('progress').value=p;
 const ph=C.phase(p);if(ph!==phase){phase=ph;const s=content.phases[ph];$('phaseLabel').textContent=s.label;$('phaseTitle').textContent=s.title;$('phaseBody').textContent=s.body;$('stepCount').textContent=String(ph+1).padStart(2,'0')+' / 04';document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.phase)===ph?'step':'false'));}
 const build=C.smooth(.43,.73,p),envelope=C.smooth(.18,.35,p)*(1-C.smooth(.61,.78,p)),evaluation=C.smooth(.78,.96,p);
 document.querySelectorAll('.existing-house').forEach(el=>el.style.opacity=1-build);
 document.querySelectorAll('.envelope').forEach(el=>el.style.opacity=envelope);
 document.querySelectorAll('.new-building').forEach(el=>{el.style.opacity=build;el.setAttribute('transform','translate(0 '+(90*(1-build)).toFixed(2)+')');});
 document.querySelectorAll('.valuation-frame').forEach(el=>el.style.opacity=evaluation);
 document.querySelectorAll('.scanline').forEach(el=>el.setAttribute('transform','translate(0 '+(175*evaluation).toFixed(2)+')'));
 for(const [cls,o] of [['capital',1-C.smooth(.24,.47,p)],['property',C.smooth(.12,.28,p)*(1-C.smooth(.62,.8,p))],['development',C.smooth(.46,.65,p)],['sale',C.smooth(.64,.84,p)],['return',C.smooth(.71,.9,p)]])document.querySelectorAll('.callout-'+cls).forEach(el=>el.style.opacity=o);
 const route=$('capitalRoute');if(route){const length=route.getTotalLength(),at=route.getPointAtLength(length*C.clamp(p*.94+.025));document.querySelectorAll('.investor-token').forEach(el=>el.setAttribute('transform','translate('+at.x.toFixed(2)+' '+at.y.toFixed(2)+')'));const guide=route.getPointAtLength(length*C.clamp(p*.85+.08));document.querySelectorAll('.guide').forEach(el=>el.setAttribute('transform','translate('+guide.x.toFixed(2)+' '+(guide.y-22).toFixed(2)+')'));const stride=reduce.matches?5:3+Math.abs(Math.sin(p*75))*4;document.querySelectorAll('.guide-legs').forEach(el=>el.setAttribute('d','M0 0l-'+stride.toFixed(1)+' 14M0 0l'+stride.toFixed(1)+' 14'));document.querySelectorAll('.capital-trace').forEach(el=>{el.style.strokeDasharray=length;el.style.strokeDashoffset=length*(1-C.smooth(.03,.95,p));});}
}
function onScroll(){if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(!content)return;if(reduce.matches)return render(1);const box=story.getBoundingClientRect();render(C.progress(box.top,story.offsetHeight,innerHeight));lastScroll=window.scrollY;});}
function resize(){if(!content)return;root.style.setProperty('--vh',innerHeight+'px');root.classList.toggle('smallheight',innerHeight<740);story.style.height=reduce.matches?'auto':(innerHeight*content.screens)+'px';onScroll();}
function repeat(){stop();moveTo(reduce.matches?1:0);$('play').focus({preventScroll:true});}
async function share(){
 const url=C.publicLink(location.href);$('shareUrl').value=url;$('shareStatus').textContent='';
 if(navigator.share){try{await navigator.share({title:content.title,url});return;}catch(e){if(e.name==='AbortError')return;}}
 $('shareDialog').showModal();$('shareUrl').focus();$('shareUrl').select();
 try{await navigator.clipboard.writeText(url);$('shareStatus').textContent='Enlace copiado.';}catch(_){$('shareStatus').textContent='Puedes copiar el enlace desde este campo.';}
}
function bind(){
 if(bound)return;bound=true;$('play').onclick=play;$('repeat').onclick=repeat;$('complete').onclick=()=>{stop();moveTo(1);};$('replayEnd').onclick=repeat;$('share').onclick=share;$('copyShare').onclick=async()=>{try{await navigator.clipboard.writeText($('shareUrl').value);$('shareStatus').textContent='Enlace copiado.';}catch(_){$('shareUrl').focus();$('shareUrl').select();$('shareStatus').textContent='Selecciona y copia el enlace.';}};
 document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{stop();moveTo(reduce.matches?1:(Number(b.dataset.phase)+.15)/4);});
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
  document.querySelectorAll('[data-phase]').forEach(b=>b.querySelector('b').textContent=content.phases[Number(b.dataset.phase)].nav);
  if(!$('bridgeModel').children.length){const clone=document.querySelector('.diagram').cloneNode(true);clone.removeAttribute('aria-labelledby');clone.setAttribute('aria-hidden','true');clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));$('bridgeModel').append(clone);}
  $('loading').hidden=true;$('presentation').hidden=false;bind();resize();render(reduce.matches?1:0);onScroll();
 }catch(e){content=null;$('presentation').hidden=true;$('loading').hidden=false;$('load-message').textContent=e.name==='AbortError'?'La conexión tardó. Vuelve a intentar.':'No se pudo cargar la presentación. Vuelve a intentar.';$('retry').hidden=false;console.warn('Presentation content unavailable');}
}
$('retry').onclick=load;load();
})();
