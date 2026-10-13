(function(){
'use strict';
const $=id=>document.getElementById(id),root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),NS='http://www.w3.org/2000/svg';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
let payload=null,cfg=null,layout=null,pathLength=0,p=0,scene=-1,beat=-1,playing=false,raf=0,last=0,scrollRaf=0,markers=[],legacy=false,resizeRaf=0,labelEls=[];
function text(el,value){el.textContent=String(value??'');return el;}
function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)text(el,value);return el;}
function parse(input){const raw=input?.textos||input;if(!raw?.mono_config)return null;const c=typeof raw.mono_config==='string'?JSON.parse(raw.mono_config):raw.mono_config;
 if(!c||!Array.isArray(c.scenes)||c.scenes.length!==7||!Array.isArray(c.navigation)||c.navigation.length!==3||!Array.isArray(c.cta)||c.cta.length!==2)throw Error('Invalid narrative');
 for(const s of c.scenes){if(!s.title||!Array.isArray(s.beats)||s.beats.length!==3||!Array.isArray(s.details))throw Error('Incomplete scene');for(const b of s.beats)if(!b.title||!b.body)throw Error('Incomplete step');for(const d of s.details)if(!d.title||!Array.isArray(d.items))throw Error('Incomplete detail');}
 for(const key of ['ink','paper'])if(!/^#[0-9a-f]{6}$/i.test(c.theme?.[key]||''))throw Error('Invalid theme');
 if(!c.labels?.a||!c.labels?.b||!c.controls?.play)throw Error('Incomplete labels');
 return c;
}
function cleanURL(){const u=new URL(location.href);u.search='';u.hash='';return u.href;}
function stageReadLine(){const stage=$('monoStage').getBoundingClientRect();return innerWidth<=800?Math.min(innerHeight-50,stage.bottom+24):Math.min(innerHeight*.4,stage.top+180);}
function measure(){if(!cfg||legacy)return;const line=stageReadLine();markers=Array.from(document.querySelectorAll('.mono-step'),el=>Math.max(0,scrollY+el.getBoundingClientRect().top-line));const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);markers.push(Math.max(markers[20]+1,Math.min(max,scrollY+$('monoClosing').getBoundingClientRect().top-line)));for(let i=1;i<markers.length;i++)markers[i]=Math.max(markers[i],markers[i-1]+1);}
function scrollAt(v){const t=clamp(v)*21,i=Math.min(20,Math.floor(t)),local=t-i;return markers[i]+(markers[i+1]-markers[i])*local;}
function fromScroll(){if(!markers.length||scrollY<=markers[0])return 0;let i=0;while(i<20&&scrollY>=markers[i+1])i++;return clamp((i+clamp((scrollY-markers[i])/(markers[i+1]-markers[i])))/21);}
function pause(){playing=false;cancelAnimationFrame(raf);raf=0;last=0;if(cfg){text($('monoPlay'),cfg.controls.play);$('monoPlay').setAttribute('aria-pressed','false');}}
function mapLabel(label){if(label.text)return String(label.text);const key=label.key;const lookup={caseA:'a',caseB:'b',areaA:'physicalMeasure',areaB:'physicalMeasure',accountA:'finance',accountB:'finance',legalA:'review',legalB:'review',sectionA:'section',sectionB:'section',saleA:'distribution',saleB:'distribution',cta:'scope'};return cfg.labels[lookup[key]||key]||'';}
function buildLabels(){
 labelEls=[];$('monoAnnotations').replaceChildren();
 const roadPlaced=[];for(const original of layout.labels||[]){const label={...original};if(label.key==='road'){if(roadPlaced.some(p=>Math.hypot(p.x-label.x,p.y-label.y)<75)||roadPlaced.length>=2)continue;roadPlaced.push(label);}let value=mapLabel(label);if(label.key==='caseA'||label.key==='caseB'){const g=layout.scenes[label.scene].cases[label.key==='caseA'?'A':'B'];label.x=g.x+18;label.y=g.y+26;value=value.split(' · ')[0];}if(!value)continue;const el=document.createElementNS(NS,'text');el.setAttribute('x',label.x);el.setAttribute('y',label.y);el.setAttribute('text-anchor',label.anchor||'middle');el.dataset.monoLabel=label.key;
 const words=value.split(/\s+/);let lines=[],line='';for(const word of words){if(line.length&&line.length+word.length>27){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
 lines.forEach((v,i)=>{const span=document.createElementNS(NS,'tspan');span.setAttribute('x',label.x);span.setAttribute('dy',i?'1.22em':'0');span.textContent=v;el.append(span);});$('monoAnnotations').append(el);labelEls.push({el,label});}
}
function viewport(at){const v=at.viewBox;if(Array.isArray(v))return v;if(v&&typeof v==='object')return[v.x,v.y,v.width,v.height];const focus=layout.scenes[at.scene]?.focus;if(Array.isArray(focus)&&focus.length===4)return focus;return[0,0,layout.width||390,460];}
function render(v){
 if(!cfg||!layout)return;p=clamp(v);const at=window.YodMonolineCore.locate(layout,p),nextScene=Math.min(6,Math.floor(p*7)),nextBeat=Math.min(20,Math.floor(p*21)),s=cfg.scenes[nextScene],b=s.beats[nextBeat%3];
 scene=nextScene;beat=nextBeat;$('monoProgress').value=p;
 text($('monoTitle'),s.title);text($('monoLead'),s.lead);text($('monoKicker'),s.kicker);text($('monoCount'),String(scene+1).padStart(2,'0')+' / 07');text($('monoBeatTitle'),b.title);text($('monoBeatBody'),b.body);text($('monoStep'),String(beat+1).padStart(2,'0')+' / 21');
 $('monoStage').dataset.scene=String(scene);$('monoStage').dataset.beat=String(beat);
 for(const btn of $('monoNav').children){const n=Number(btn.dataset.monoGroup),active=scene<2?0:scene===2?1:2;btn.setAttribute('aria-current',n===active?'step':'false');}
 const box=reduce.matches?[0,0,layout.width||390,layout.height]:viewport(at);$('monoSvg').setAttribute('viewBox',box.map(n=>Number(n).toFixed(3)).join(' '));
 if(reduce.matches){$('monoSvg').style.aspectRatio=(layout.width||390)+' / '+layout.height;$('monoPath').style.strokeDashoffset='0';}
 else{$('monoSvg').style.aspectRatio='';const length=clamp(at.length,0,layout.totalLength||pathLength);$('monoPath').style.strokeDashoffset=String(Math.max(0,pathLength-length*(pathLength/(layout.totalLength||pathLength))));}
 const svgWidth=Math.max(1,$('monoSvg').clientWidth),svgHeight=Math.max(1,$('monoSvg').clientHeight),scale=Math.min(svgWidth/box[2],svgHeight/box[3]),font=14/Math.max(.01,scale);
 for(const {el,label}of labelEls){el.setAttribute('font-size',font.toFixed(2));el.style.visibility=(reduce.matches||(label.scene===undefined||label.scene===scene)&&(label.beat===undefined||label.beat<=nextBeat%3))?'visible':'hidden';}
}
function move(v,scroll=true){if(!cfg)return;if(scroll&&markers.length)scrollTo({top:scrollAt(v),behavior:'instant'});render(v);}
function seekBeat(index){pause();const i=clamp(Math.floor(index),0,20);measure();move((i+.25)/21);}
function seekScene(index){seekBeat(clamp(Math.floor(index),0,6)*3);}
function reset(){pause();scrollTo({top:0,behavior:'instant'});render(0);}
function tick(ts){if(!playing||document.hidden||reduce.matches)return pause();if(!last)last=ts;const dt=Math.min(120,ts-last);last=ts;const seconds=clamp(cfg.motion?.durationSeconds||105,20,300);move(p+dt/(seconds*1000));if(p>=1)return pause();raf=requestAnimationFrame(tick);}
function play(){if(!cfg||reduce.matches)return pause();if(playing)return pause();if(p>=.999)reset();measure();playing=true;last=0;text($('monoPlay'),cfg.controls.pause);$('monoPlay').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);}
function onScroll(){if(legacy||!cfg||scrollRaf)return;scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;render(fromScroll());});}
function onResize(){if(!cfg||legacy)return;const preserved=p;pause();cancelAnimationFrame(resizeRaf);resizeRaf=requestAnimationFrame(()=>{measure();if(preserved<.0001){scrollTo(0,0);render(0);}else move(preserved);});}
function createDetails(){
 const out=$('monoDetails');out.replaceChildren();
 cfg.scenes.forEach((s,i)=>{const section=node('section','mono-detail-scene');section.dataset.monoScene=String(i);section.id='monoScene'+i;const intro=node('div','mono-scene-intro');intro.append(node('h2','',s.title),node('p','',s.lead));section.append(intro);
 s.beats.forEach((b,j)=>{const step=node('section','mono-step');step.id='monoMoment'+(i*3+j);step.dataset.monoBeat=String(i*3+j);step.append(node('p','mono-step-num',String(i+1).padStart(2,'0')+' · '+String(j+1).padStart(2,'0')),node('h3','',b.title),node('p','',b.body));section.append(step);});
 const facts=node('div','mono-facts');facts.append(node('h3','',cfg.controls.details));s.details.forEach(d=>{const group=node('section','mono-fact'),list=node('ul');group.append(node('h4','',d.title));d.items.forEach(item=>list.append(node('li','',item)));group.append(list);facts.append(group);});section.append(facts);out.append(section);});
}
async function showLegacy(){if(!payload)return;pause();legacy=true;$('story').hidden=false;$('hunt').hidden=false;$('bridge').hidden=false;$('monoline').hidden=true;document.body.classList.remove('monoline-active');$('monoBack').hidden=false;await window.YodLegacyMount(payload);scrollTo(0,0);}
function showMonoline(){window.YodLegacyHide();$('presentation').hidden=true;$('story').hidden=true;$('hunt').hidden=true;$('bridge').hidden=true;legacy=false;document.body.classList.add('monoline-active');$('monoBack').hidden=true;$('monoline').hidden=false;measure();reset();}
async function share(){const url=cleanURL();if(navigator.share){try{await navigator.share({title:cfg.headline,url});return;}catch(e){if(e.name==='AbortError')return;}}openMessage(-1);}
function openMessage(index){pause();const entry=cfg.cta[index];text($('monoMessageTitle'),entry?.label||cfg.controls.share);text($('monoMessageScope'),cfg.labels.scope);$('monoMessage').value=entry?entry.message+'\n\n'+cleanURL():cleanURL();text($('monoMessageStatus'),'');$('monoMessageDialog').showModal();}
async function copyMessage(){try{await navigator.clipboard.writeText($('monoMessage').value);text($('monoMessageStatus'),cfg.controls.copied||cfg.controls.share);}catch(_){$('monoMessage').focus();$('monoMessage').select();text($('monoMessageStatus'),cfg.controls.manual||cfg.controls.share);}}
function bind(){
 $('monoPlay').onclick=play;$('monoReplay').onclick=reset;$('monoLegacy').onclick=showLegacy;$('monoBack').onclick=showMonoline;$('monoShare').onclick=share;$('monoMessageCopy').onclick=copyMessage;
 $('monoMessageDialog').addEventListener('click',e=>{if(e.target===$('monoMessageDialog'))$('monoMessageDialog').close();});
 window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);
 for(const type of ['wheel','touchstart','pointerdown'])window.addEventListener(type,e=>{if(playing&&!e.target.closest('.mono-controls'))pause();},{passive:true});
 window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest('button,input,textarea,dialog'))pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 reduce.addEventListener('change',()=>{pause();measure();render(p);});
}
function mount(data){
 payload=data;cfg=parse(data);if(!cfg){$('monoBack').hidden=true;legacy=true;return window.YodLegacyMount(data);}
 const map=window.YodHuntCore.normalize(data)?.map;if(!map)throw Error('Territory source missing');
 layout=window.YodMonolineCore.build(390,map);root.style.setProperty('--mono-ink',cfg.theme.ink);root.style.setProperty('--mono-paper',cfg.theme.paper);
 text($('monoBrand'),cfg.brand);text($('monoHeadline'),cfg.headline);text($('monoIntroKicker'),cfg.brand);text($('monoIntroLead'),cfg.lead);document.title=cfg.brand+' · '+cfg.headline;
 text($('monoCaseA'),cfg.labels.a);text($('monoCaseB'),cfg.labels.b);text($('monoSvgTitle'),cfg.brand);text($('monoSvgDesc'),cfg.labels.illustrative);
 $('monoPath').setAttribute('d',layout.d);createDetails();buildLabels();
 $('monoNav').replaceChildren();cfg.navigation.forEach((n,i)=>{const b=node('button','',n.title);b.type='button';b.dataset.monoGroup=String(i);b.onclick=()=>seekScene(n.scene);$('monoNav').append(b);});
 text($('monoPlay'),cfg.controls.play);text($('monoReplay'),cfg.controls.replay);text($('monoShare'),cfg.controls.share);text($('monoLegacy'),cfg.controls.legacy||cfg.controls.previous);text($('monoBack'),cfg.controls.back||cfg.controls.next);text($('monoMessageCopy'),cfg.controls.copy||cfg.controls.share);$('monoMessageClose').setAttribute('aria-label',cfg.controls.close||cfg.controls.previous);
 text($('monoClosingTitle'),cfg.scenes[6].title);text($('monoScope'),cfg.labels.scope);text($('monoClosingLead'),cfg.closingLead||cfg.scenes[6].lead);
 $('monoCtas').replaceChildren();cfg.cta.forEach((entry,i)=>{const b=node('button','',entry.label);b.type='button';b.dataset.monoCta=String(i);b.onclick=()=>openMessage(i);$('monoCtas').append(b);});
 $('monoFootnotes').replaceChildren();for(const foot of cfg.footnotes||[])$('monoFootnotes').append(node('p','',foot));if(map.attribution)$('monoFootnotes').append(node('p','',map.attribution));
 $('loading').hidden=true;$('presentation').hidden=true;$('monoline').hidden=false;document.body.classList.add('monoline-active');
 pathLength=$('monoPath').getTotalLength();$('monoPath').style.strokeDasharray=pathLength+' '+pathLength;measure();render(0);requestAnimationFrame(()=>{measure();render(p);});
 window.YodMonoline.api={seekBeat,seekScene,play,pause,reset,state:()=>({p,scene,beat,playing,legacy,version:cfg.version,mapCoverage:layout.mapCoverage})};
}
async function load(){try{$('retry').hidden=true;const data=await window.YodPublicCopy();await mount(data);}catch(e){$('monoline').hidden=true;$('presentation').hidden=true;$('loading').hidden=false;$('retry').hidden=false;console.warn('Monoline presentation unavailable: '+e.message);}}
window.YodMonoline={mount,api:null};$('retry').onclick=load;bind();load();
})();