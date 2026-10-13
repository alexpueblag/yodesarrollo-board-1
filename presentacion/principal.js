
(function(){
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
let cfg=null,payload=null,layout=null,p=0,scene=-1,beat=-1,beta=false,playing=false,raf=0,last=0,scrollRaf=0,resizeRaf=0,pathLength=0,markers=[],spans=[],labels=[];
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),text=(e,s)=>{if(e)e.textContent=String(s??'');};
function el(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)text(e,value);return e;}
function svg(tag){return document.createElementNS(NS,tag);}
function initial(){return clamp(Number(cfg?.motion?.initialProgress)||0,0,.009);}
function cleanUrl(){const url=new URL(location.href);url.search='';url.hash='';return url.href;}
function actionLabel(button,value){text(button.querySelector('.p-action-label'),value);button.setAttribute('aria-label',value);button.title=value;}
function measure(){
 if(!cfg||beta)return;
 const header=$('principalHeader').getBoundingClientRect().height;root.style.setProperty('--p-header',header+'px');$('principal').style.setProperty('--p-header',header+'px');
 const screen=Number(cfg.motion.stepScreens);$('principal').style.setProperty('--p-beat-height',Math.max(260,innerHeight*screen)+'px');
 const line=innerWidth<=760?Math.min(innerHeight-22,header+$('principalStage').offsetHeight+18):Math.min(innerHeight*.43,header+186);
 $('principal').style.setProperty('--p-readline',line+'px');
 const steps=[...document.querySelectorAll('#principalDetails [data-principal-beat]')];markers=steps.map(e=>Math.max(0,e.getBoundingClientRect().top+scrollY-line));spans=steps.map(e=>Math.max(180,e.getBoundingClientRect().height));
 for(let i=1;i<markers.length;i++)markers[i]=Math.max(markers[i],markers[i-1]+1);
 markers.push(Math.max(markers[35]+180,document.documentElement.scrollHeight-innerHeight));
}
function fromScroll(){if(!markers.length||scrollY<=markers[0])return initial();let i=0;while(i<35&&scrollY>=markers[i+1])i++;const local=clamp((scrollY-markers[i])/Math.min(spans[i],markers[i+1]-markers[i]),0,.999999);return clamp((i+local)/36);}
function target(value){if(value>=.999999)return Math.max(0,$('principalClosing').getBoundingClientRect().top+scrollY-$('principalHeader').getBoundingClientRect().height-18);const v=clamp(value)*36,i=Math.min(35,Math.floor(v)),t=v-i;return markers[i]+Math.min(spans[i],markers[i+1]-markers[i])*t;}
function fit(v){
 const box=$('principalSvg').getBoundingClientRect(),aspect=(box.width||390)/(box.height||240),w=v[2],h=v[3],ww=Math.max(w,h*aspect),hh=Math.max(h,w/aspect);
 return[v[0]-(ww-w)/2,v[1]-(hh-h)/2,ww,hh];
}
function labelValue(a){const value=a.text??cfg.labels[a.key];return Array.isArray(value)?value[a.labelIndex]:value;}
function buildLabels(){
 $('principalAnnotations').replaceChildren();labels=[];
 for(const a of layout.annotations||[]){if(a.captionOnly)continue;const value=labelValue(a);if(!value)continue;const e=svg('text');e.setAttribute('x',a.x);e.setAttribute('y',a.y);e.setAttribute('text-anchor',a.align||'middle');e.dataset.key=a.key||'';e.dataset.scene=String(a.scene);$('principalAnnotations').append(e);labels.push({a,e,value:String(value)});}
}
function drawAnnotations(loc,view,scale){
 const prefix=reduce.matches?pathLength:loc.length,font=14/scale,local=beat%4,zoneScene=scene>=2&&scene<=4,overview=scene===1&&local===3;
 const identities=new Set(['zoneA','zoneB','zoneC','property1','property2','purchase','contribution']),seen=new Set();
 const ordered=[...labels].sort((x,y)=>{const rank=i=>overview&&/^zone[ABC]$/.test(i.a.key)?12:i.a.scene===scene&&i.a.beat===local?10:i.a.persistent&&i.a.scene===scene?9:identities.has(i.a.key)?8:i.a.source?1:0;return rank(y)-rank(x)||y.a.scene-x.a.scene;});
 const active=[];let count=0,roadCount=0;
 for(const item of ordered){
  const {a,e}=item,current=a.scene===scene&&a.beat===local,persistent=a.persistent===true&&a.scene===scene&&a.beat<=local,visited=a.atLength<=prefix+.2;
  const identity=identities.has(a.key)&&a.scene<=scene&&visited;
  let eligible=current||persistent||identity||(a.source&&visited&&zoneScene);
  if(zoneScene&&/^zone[ABC]$/.test(a.key))eligible=current&&a.key==='zone'+['A','B','C'][scene-2];
  if(overview&&a.key==='references')eligible=false;
  const inFrame=a.x>=view[0]+font*.5&&a.x<=view[0]+view[2]-font*.5&&a.y>=view[1]+font*.5&&a.y<=view[1]+view[3]-font*.5;
  const key=identities.has(a.key)||a.persistent?a.key:a.key+'|'+Math.round(a.x)+'|'+Math.round(a.y);
  let show=eligible&&inFrame&&!seen.has(key);if(show&&!persistent&&count>=Math.max(3,cfg.diagram.annotationsPerBeat||3))show=false;
  if(show&&a.source&&roadCount)show=false;
  e.style.display=show?'':'none';if(!show)continue;seen.add(key);count++;if(a.source)roadCount++;active.push(item);
 }
 const placed=[];
 for(const {a,e,value} of active){
  e.setAttribute('font-size',font);e.setAttribute('stroke-width',3.8/scale);
  let available=Math.min(view[2]-font*2,a.maxWidth||Infinity);
  if(a.node){const node=layout.roles?.[a.key]||(a.key==='agreement'?layout.agreement:null);if(node)available=Math.min(available,node.w-font*.8);}
  for(const other of active){if(other.a===a)continue;const dx=Math.abs(other.a.x-a.x),dy=Math.abs(other.a.y-a.y);if(dx>font&&dy<font*3.2)available=Math.min(available,dx-font*.8);}
  const maxChars=a.maxChars||(a.node?20:24);
  const lines=[],words=String(value).split(/\s+/);let line='';
  e.textContent='';
  const probe=svg('tspan');e.append(probe);
  for(const word of words){
   const next=line?line+' '+word:word;probe.textContent=next;
   if(line&&(probe.getComputedTextLength()>available||next.length>maxChars)){lines.push(line);line=word;}else line=next;
  }
  if(line)lines.push(line);e.replaceChildren();
  const y=a.centered?a.y-(lines.length-1)*font*.575:a.y;e.setAttribute('y',y);
  lines.forEach((line,i)=>{const t=svg('tspan');t.setAttribute('x',a.x);t.setAttribute('dy',i?'1.15em':'0');text(t,(i?' ':'')+line+(i===lines.length-1?' ':''));e.append(t);});
  let b=e.getBBox(),shiftX=0,shiftY=0;
  if(!a.node){
   shiftX=Math.max(0,view[0]+font*.55-b.x)-Math.max(0,b.x+b.width-(view[0]+view[2]-font*.55));
   shiftY=Math.max(0,view[1]+font*.55-b.y)-Math.max(0,b.y+b.height-(view[1]+view[3]-font*.55));
  }
  e.setAttribute('transform','translate('+shiftX+' '+shiftY+')');
  b={x:b.x+shiftX,y:b.y+shiftY,width:b.width,height:b.height};
  const overlaps=placed.some(r=>b.x<r.x+r.width+font*.35&&b.x+b.width+font*.35>r.x&&b.y<r.y+r.height+font*.25&&b.y+b.height+font*.25>r.y);
  if(a.source&&(overlaps||b.width>available)){e.style.display='none';continue;}placed.push(b);
 }
}
function context(){
 let value=cfg.labels.city,note=cfg.labels.mapCaption;
 if(scene>=2&&scene<=4)value=cfg.labels['zone'+['A','B','C'][scene-2]];
 if(scene>=5){value=scene<7?cfg.labels.purchaseContribution:scene===7?cfg.labels.departments:cfg.brand;note=cfg.labels.propertyCaption;}
 if(scene===8)note=cfg.labels.distribution;
 text($('principalContext'),value);text($('principalContextNote'),note);
 $('principalCriteria').hidden=!(scene>=2&&scene<=4&&beat%4===3);$('principalEquation').hidden=scene!==6;
}
function render(value){
 if(!cfg||beta)return;p=clamp(value);const loc=window.YodPrincipalCore.locate(layout,p);scene=loc.scene;beat=loc.index??(loc.scene*4+loc.beat);
 const s=cfg.scenes[scene],b=s.beats[beat%4];
 text($('principalTitle'),s.shortTitle||s.title);text($('principalKicker'),s.kicker);text($('principalCount'),String(scene+1).padStart(2,'0')+' / 09');text($('principalBeatTitle'),b.title);text($('principalBeatBody'),b.body);text($('principalStep'),String(beat+1).padStart(2,'0')+' / 36');$('principalProgress').value=p;context();const semantic=(layout.annotations||[]).filter(a=>a.captionOnly&&a.scene===scene&&a.beat===beat%4).map(labelValue).filter(Boolean);text($('principalSemantic'),semantic.join(' · '));$('principalSemantic').hidden=!semantic.length;
 document.querySelectorAll('#principalNav button').forEach((button,i)=>{const start=cfg.navigation[i].scene,end=cfg.navigation[i+1]?.scene??9;button.setAttribute('aria-current',scene>=start&&scene<end?'step':'false');});
 const raw=reduce.matches?[layout.bounds.minX,layout.bounds.minY,layout.bounds.maxX-layout.bounds.minX,layout.bounds.maxY-layout.bounds.minY]:loc.viewBox,view=fit(Array.isArray(raw)?raw:[raw.x,raw.y,raw.width,raw.height]),rect=$('principalSvg').getBoundingClientRect(),scale=Math.max(.001,Math.min(rect.width/view[2],rect.height/view[3]));
 $('principalSvg').setAttribute('viewBox',view.join(' '));$('principalPath').style.strokeWidth=String(1.85/scale);$('principalPath').style.strokeDashoffset=String(reduce.matches?0:pathLength-loc.length);drawAnnotations(loc,view,scale);$('principalTip').setAttribute('cx',loc.point.x);$('principalTip').setAttribute('cy',loc.point.y);$('principalTip').setAttribute('r',3/scale);$('principalTip').style.display=reduce.matches?'none':'';
}
function move(value){measure();scrollTo({top:target(value),behavior:'instant'});render(value);}
function seekBeat(index){pause();move((clamp(Number(index),0,35)+.4)/36);}
function seekScene(index){seekBeat(clamp(Number(index),0,8)*4);}
function pause(){playing=false;cancelAnimationFrame(raf);if(cfg){actionLabel($('principalPlay'),cfg.controls.play);text($('principalPlay').querySelector('.p-play-glyph'),'▶');$('principalPlay').setAttribute('aria-pressed','false');}}
function reset(){pause();scrollTo({top:0,behavior:'instant'});render(initial());}
function tick(now){if(!playing)return;if(!last)last=now;const dt=Math.min(150,now-last);last=now;const next=Math.min(1,p+dt/(cfg.motion.durationSeconds*1000));move(next);if(next>=1)pause();else raf=requestAnimationFrame(tick);}
function play(){if(!cfg||beta||reduce.matches)return pause();if(playing)return pause();if(p>=.999)reset();measure();playing=true;last=0;actionLabel($('principalPlay'),cfg.controls.pause);text($('principalPlay').querySelector('.p-play-glyph'),'Ⅱ');$('principalPlay').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);}
function onScroll(){if(!cfg||beta)return;cancelAnimationFrame(scrollRaf);scrollRaf=requestAnimationFrame(()=>{render(fromScroll());});}
function onResize(){if(!cfg||beta)return;pause();cancelAnimationFrame(resizeRaf);resizeRaf=requestAnimationFrame(()=>{if(beta)return;const previous=p;measure();if(previous<=initial()+.0001){scrollTo({top:0,behavior:'instant'});render(initial());}else move(previous);});}
function createDetails(){
 const article=$('principalDetails');article.replaceChildren();
 cfg.scenes.forEach((s,i)=>{const section=el('section','p-detail-scene');section.dataset.principalScene=String(i);section.id='principalScene'+i;const intro=el('div','p-scene-intro');intro.append(el('h2','',s.title),el('p','',s.lead));if(cfg.sharedCriteria.scenes.includes(i)){intro.append(el('p','p-zone-common',cfg.sharedCriteria.title+': '+cfg.sharedCriteria.items.join(' · ')),el('p','p-zone-context',cfg.sharedCriteria.context));}section.append(intro);
 s.beats.forEach((b,j)=>{const step=el('div','p-step');step.dataset.principalBeat=String(i*4+j);const copy=el('div','p-step-copy');copy.append(el('p','p-step-index',String(i+1).padStart(2,'0')+' · '+String(j+1).padStart(2,'0')),el('h3','',b.title),el('p','',b.body));step.append(copy);section.append(step);});
 const groups=el('div','p-detail-groups');groups.append(el('h3','',cfg.controls.details));
 for(const group of s.details){const part=el('div','p-detail-group'),list=el('ul');part.append(el('h4','',group.title));for(const value of group.items)list.append(el('li','',value));part.append(list);groups.append(part);}section.append(groups);article.append(section);});
}
function showBeta(){
 pause();beta=true;document.body.classList.remove('principal-active');$('principal').hidden=true;$('principalMessageDialog').close();window.YodMonoline.mount(payload);
 let back=$('monoBrand');if(back.tagName!=='BUTTON'){const button=el('button',back.className);button.id='monoBrand';button.type='button';back.replaceWith(button);back=button;}text(back,cfg.controls.returnPrincipal);back.onclick=returnPrincipal;
}
function returnPrincipal(){
 window.YodMonoline.api?.pause();window.YodLegacyHide();$('monoline').hidden=true;$('presentation').hidden=true;$('monoBack').hidden=true;document.body.classList.remove('monoline-active');document.body.classList.add('principal-active');beta=false;$('principal').hidden=false;measure();reset();
}
function openMessage(i){const c=cfg.cta[i];text($('principalMessageTitle'),c.label);text($('principalMessageScope'),cfg.closingLead);$('principalMessage').value=c.message+'\n\n'+cleanUrl();text($('principalMessageStatus'),'');$('principalMessageDialog').showModal();}
async function copyMessage(){try{await navigator.clipboard.writeText($('principalMessage').value);text($('principalMessageStatus'),cfg.controls.copied);}catch(_){$('principalMessage').focus();$('principalMessage').select();text($('principalMessageStatus'),cfg.controls.copyFailed);}}
async function share(){pause();const url=cleanUrl();try{if(navigator.share){await navigator.share({title:cfg.controls.shareTitle,url});return;}await navigator.clipboard.writeText(url);}catch(e){if(e.name==='AbortError')return;$('principalMessage').value=url;text($('principalMessageTitle'),cfg.controls.share);text($('principalMessageScope'),cfg.controls.manual);text($('principalMessageStatus'),'');$('principalMessageDialog').showModal();}}
function mount(data){
 payload=data;const raw=(data.textos||data).principal_config;if(!raw){$('principal').hidden=true;return window.YodMonoline.mount(data);}cfg=window.YodPrincipalCore.normalize(data);if(!cfg)throw Error('Incomplete principal configuration');
 const map=window.YodHuntCore.normalize(data)?.map;if(!map)throw Error('Missing territory source');layout=window.YodPrincipalCore.build(map,cfg);
 root.style.setProperty('--p-ink',cfg.theme.ink);root.style.setProperty('--p-paper',cfg.theme.paper);$('principal').style.setProperty('--p-ink',cfg.theme.ink);$('principal').style.setProperty('--p-paper',cfg.theme.paper);$('principalMessageDialog').style.setProperty('--p-ink',cfg.theme.ink);$('principalMessageDialog').style.setProperty('--p-paper',cfg.theme.paper);
 document.title=cfg.brand+' · '+cfg.headline;text($('principalBrand'),cfg.brand);text($('principalIntroKicker'),cfg.brand);text($('principalHeadline'),cfg.headline);text($('principalIntroLead'),cfg.lead);
 text($('principalSvgTitle'),cfg.brand);text($('principalSvgDesc'),cfg.labels.illustrative);createDetails();
 $('principalPath').setAttribute('d',layout.d);pathLength=$('principalPath').getTotalLength();$('principalPath').style.strokeDasharray=pathLength+' '+pathLength;buildLabels();
 const nav=$('principalNav');nav.replaceChildren();cfg.navigation.forEach((n,i)=>{const button=el('button','',n.title);button.type='button';button.dataset.principalGroup=String(i);button.onclick=()=>seekScene(n.scene);nav.append(button);});
 $('principalCriteria').replaceChildren();cfg.sharedCriteria.items.forEach(value=>$('principalCriteria').append(el('span','',value)));
 text($('principalIncome'),cfg.labels.equation.income);text($('principalInvestment'),cfg.labels.equation.investment);text($('principalProfit'),cfg.labels.equation.profit);
 actionLabel($('principalPlay'),cfg.controls.play);actionLabel($('principalShare'),cfg.controls.share);text($('principalReplay'),cfg.controls.replay);text($('principalBeta'),cfg.controls.beta);text($('principalMessageCopy'),cfg.controls.copy);$('principalMessageClose').setAttribute('aria-label',cfg.controls.close);$('principalMessage').setAttribute('aria-label',cfg.controls.copy);$('principalProgress').setAttribute('aria-label',cfg.controls.progress);
 text($('principalClosingTitle'),cfg.scenes[8].title);text($('principalClosingLead'),cfg.closingLead);
 $('principalCtas').replaceChildren();cfg.cta.forEach((c,i)=>{const button=el('button','',c.label);button.type='button';button.dataset.principalCta=String(i);button.onclick=()=>openMessage(i);$('principalCtas').append(button);});
 $('principalFootnotes').replaceChildren();cfg.footnotes.forEach(value=>$('principalFootnotes').append(el('p','',value)));if(map.attribution)$('principalFootnotes').append(el('p','',map.attribution));
 $('loading').hidden=true;$('presentation').hidden=true;$('monoline').hidden=true;$('principal').hidden=false;document.body.classList.remove('monoline-active');document.body.classList.add('principal-active');beta=false;
 measure();render(initial());requestAnimationFrame(()=>{measure();render(p);});document.fonts?.ready.then(()=>{if(!beta)onResize();});
 window.YodPrincipal.api={seekBeat,seekScene,play,pause,reset,state:()=>({p,scene,beat,playing,beta,version:cfg.version,mapCoverage:layout.mapCoverage})};
}
async function load(){try{$('retry').hidden=true;const data=await window.YodPublicCopy();mount(data);}catch(error){$('principal').hidden=true;$('loading').hidden=false;$('retry').hidden=false;text($('load-message'),cfg?.controls.error||$('load-message').textContent);console.warn('Principal presentation unavailable: '+error.message);}}
$('principalPlay').onclick=play;$('principalReplay').onclick=reset;$('principalShare').onclick=share;$('principalBeta').onclick=showBeta;$('principalMessageCopy').onclick=copyMessage;$('principalMessageDialog').addEventListener('click',event=>{if(event.target===$('principalMessageDialog'))$('principalMessageDialog').close();});
window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);
for(const type of ['wheel','touchstart','pointerdown'])window.addEventListener(type,event=>{if(playing&&!event.target.closest('#principalPlay'))pause();},{passive:true});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('button,input,textarea,dialog'))pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});reduce.addEventListener('change',()=>{pause();measure();render(p);});
window.YodPrincipal={mount,api:null};$('retry').onclick=load;load();
})();
