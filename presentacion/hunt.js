(function(){
'use strict';
const H=window.YodHuntCore,$=id=>document.getElementById(id),reduce=matchMedia('(prefers-reduced-motion: reduce)'),section=$('hunt');
let c=null,p=0,current=-1,playing=false,raf=0,last=0,bound=false,scrollRaf=0;
const ns='http://www.w3.org/2000/svg';
function svg(name,attrs={}){const el=document.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
function symbol(kind){const el=svg('svg',{viewBox:'0 0 24 24','aria-hidden':'true'});el.classList.add('hunt-symbol',kind);if(kind==='coin'){el.append(svg('circle',{cx:12,cy:12,r:9,fill:'none',stroke:'currentColor','stroke-width':1.5}),svg('path',{d:'M9 6v12M14 6v12M7 9h10M7 15h10',fill:'none',stroke:'currentColor','stroke-width':1.2}));}else{el.append(svg('path',{d:'M3 10 12 3l9 7v11H3Zm6 11v-8h6v8',fill:'none',stroke:'currentColor','stroke-width':1.5}));}return el;}
function icons(kind,count){const r=document.createElement('span');r.className='symbol-row';for(let i=0;i<count;i++)r.append(symbol(kind));return r;}
function row(parent,label,kind,count){const r=document.createElement('p'),s=document.createElement('span');s.textContent=label;r.append(s,icons(kind,count));parent.append(r);}
function paintCases(stage){$('huntCases').replaceChildren();for(const[key,v]of [['A',c.caseA],['B',c.caseB]]){const card=document.createElement('section');card.className='hunt-case';card.dataset.case=key;const h=document.createElement('h3');h.textContent=c['case'+key+'_label'];card.append(h);
 if(stage===4){row(card,c.land_label,'home',1);}
 if(stage===5){row(card,c['case'+key+'_land_label'],'coin',v.land);row(card,c.build_label,'coin',v.build);row(card,c.cost_label,'coin',v.cost);}
 if(stage===6){row(card,c.units_label,'home',v.units);row(card,c.cost_label,'coin',v.cost);}
 if(stage===7){row(card,c.sale_label,'coin',v.sale);row(card,c.cost_label,'coin',v.cost);const eq=document.createElement('div');eq.className='equation';const math=document.createElement('b');math.textContent=v.sale+' − '+v.cost+' = '+(v.balance>0?'+':'')+v.balance;eq.append(math,icons('coin',Math.abs(v.balance)));const label=document.createElement('p');label.textContent=c.balance_label;card.append(eq,label);card.dataset.balance=String(v.balance);}
 $('huntCases').append(card);}}
function buildMap(){
 for(const[id,roads,local]of [['huntRoads',c.map.roads,false],['huntStreets',c.map.streets,true]]){$(id).replaceChildren();for(const r of roads)$(id).append(svg('path',{d:r.d,fill:'none',stroke:'currentColor','stroke-width':local?1:2.5,'stroke-opacity':local?.14:.38,'vector-effect':'non-scaling-stroke'}));}
 $('huntRoadLabels').replaceChildren();const named=c.map.roads.filter(r=>r.name&&r.label).sort((a,b)=>b.d.length-a.d.length),seen=new Set();for(const r of named){if(seen.has(r.name))continue;seen.add(r.name);const text=svg('text',{x:r.label[0],y:r.label[1]-7,'font-size':11,'paint-order':'stroke',stroke:'var(--paper)','stroke-width':3});text.textContent=r.name;$('huntRoadLabels').append(text);if(seen.size>=5)break;}
 const [x,y]=c.map.focus;$('huntFocus').setAttribute('cx',x);$('huntFocus').setAttribute('cy',y);
 $('huntSearchZones').replaceChildren();for(const [dx,dy,rx,ry]of [[-90,-15,120,62],[95,80,92,56],[15,-100,110,55]])$('huntSearchZones').append(svg('ellipse',{cx:x+dx,cy:y+dy,rx,ry,fill:'var(--hunt-orange)','fill-opacity':.17,stroke:'var(--hunt-orange)','stroke-width':1,'stroke-dasharray':'5 7','vector-effect':'non-scaling-stroke'}));
 $('huntEnvironment').replaceChildren();for(const [dx,dy,kind]of [[-58,48,'people'],[75,-45,'work']]){const g=svg('g',{transform:'translate('+(x+dx)+' '+(y+dy)+')'});g.append(svg('circle',{r:13,fill:'var(--paper)',stroke:'var(--hunt-orange)','stroke-width':1}));g.append(svg('path',{d:kind==='work'?'M-7-3H7V6H-7ZM-3-3V-7H3V-3':'M-6 7V2Q-6-4 0-4Q6-4 6 2V7M-10 5V1M10 5V1',fill:'none',stroke:'currentColor','stroke-width':1.5}));$('huntEnvironment').append(g);}
 for(const[key,v,offset]of [['A',c.caseA,26],['B',c.caseB,536]]){const group=$('huntPlot'+key+'Units');group.replaceChildren();for(let i=0;i<v.units;i++){const g=svg('g',{class:'hunt-unit','data-unit':i});g.dataset.x=String(offset+(i%2)*48);g.dataset.y=String(20+Math.floor(i/2)*45);g.append(svg('path',{d:'M0 15 17 1l17 14v27H0Zm12 27V25h10v17',fill:'var(--paper)',stroke:'currentColor','stroke-width':1.4}));group.append(g);}}
}
function bounds(){return {start:scrollY+section.getBoundingClientRect().top,travel:Math.max(1,section.offsetHeight-innerHeight)};}
function move(v){p=H.clamp(v);if(!reduce.matches){const b=bounds();scrollTo(0,b.start+p*b.travel);}render(p);}
function stop(){playing=false;cancelAnimationFrame(raf);last=0;if(c){$('huntPlay').textContent=c.play_label;$('huntPlay').setAttribute('aria-pressed','false');}}
function frame(ts){if(!playing||document.hidden)return stop();if(!last)last=ts;p=H.clamp(p+Math.min(100,ts-last)/c.duration);last=ts;move(p);if(p>=1)return stop();raf=requestAnimationFrame(frame);}
function play(){if(reduce.matches)return move(1);if(playing)return stop();if(p>.999)move(0);playing=true;$('huntPlay').textContent=c.pause_label;$('huntPlay').setAttribute('aria-pressed','true');last=0;raf=requestAnimationFrame(frame);}
function render(v){
 if(!c)return;p=H.clamp(v);$('huntProgress').value=p;const index=H.stage(p),active=c.stages[index];section.dataset.stage=String(index);
 if(index!==current){current=index;$('huntKicker').textContent=c.kicker+' · '+String(index+1).padStart(2,'0')+' / 08';$('huntTitle').textContent=active.title;$('huntBody').textContent=active.body;$('huntCases').hidden=index<4;if(index>=4)paintCases(index);$('huntContribution').hidden=index<5;$('huntLegend').textContent=index<4?c.map_note:index<5?c.blocks_note:c.symbol_note;document.querySelectorAll('[data-hunt-stage]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.huntStage)===index?'step':'false'));const b=$('huntStages').querySelector('[data-hunt-stage="'+index+'"]');if(b&&!reduce.matches)$('huntStages').scrollLeft=Math.max(0,b.offsetLeft-($('huntStages').clientWidth-b.offsetWidth)/2);if(!reduce.matches)$('huntTitle').animate([{opacity:.2},{opacity:1}],{duration:300});}
 const camera=H.camera(c.map,p);$('huntCamera').setAttribute('transform','translate('+camera.x+' '+camera.y+') scale('+camera.zoom+')');$('huntCamera').style.opacity=1-H.smooth(.47,.56,p);$('huntCitySign').style.opacity=1-H.smooth(.045,.145,p);$('huntCitySign').setAttribute('transform','translate(0 '+(-120*H.smooth(.03,.16,p))+')');
 $('huntSearchZones').style.opacity=H.smooth(.1,.22,p);$('huntEnvironment').style.opacity=H.smooth(.24,.34,p);$('huntFocus').style.opacity=H.smooth(.34,.43,p);$('huntBlocks').style.opacity=H.smooth(.46,.55,p);$('huntBlocks').setAttribute('transform','translate(0 '+(65*(1-H.smooth(.46,.56,p)))+')');
 const building=H.smooth(.745,.86,p);$('huntPlotA').style.opacity=1-building;$('huntPlotB').style.opacity=1-building;document.querySelectorAll('.hunt-unit').forEach(el=>{const n=Number(el.dataset.unit),k=H.smooth(.75+n*.018,.79+n*.018,p);el.style.opacity=k;el.setAttribute('transform','translate('+el.dataset.x+' '+(Number(el.dataset.y)+25*(1-k))+')');});
 const box=section.getBoundingClientRect();if(box.top<=1&&box.bottom>innerHeight*.6)document.querySelector('.chapter-label').textContent=c.city_name+' / '+active.nav;
 $('huntGuide').style.opacity=H.smooth(.22,.42,p);$('huntGuide').setAttribute('transform','translate('+(350+330*H.smooth(.3,1,p))+' '+(500-80*H.smooth(.35,1,p))+')');
}
function resize(){if(!c)return;section.style.setProperty('--hunt-vh',innerHeight+'px');section.style.height=reduce.matches?'auto':innerHeight*c.screens+'px';if(!reduce.matches)onScroll();}
function onScroll(){if(scrollRaf)return;scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;if(!c||reduce.matches)return;const b=section.getBoundingClientRect();render(H.clamp(-b.top/Math.max(1,section.offsetHeight-innerHeight)));});}
function mount(raw){c=H.normalize(raw);if(!c){section.hidden=true;return false;}section.hidden=false;section.style.setProperty('--hunt-orange',c.orange);current=-1;
 $('huntCityText').textContent=c.city_name.toUpperCase();$('huntSvgTitle').textContent=c.title;$('huntSvgDesc').textContent=c.map_note+' '+c.blocks_note;$('huntContribution').textContent=c.contribution_note;
 for(const[id,key]of [['huntPlay','play_label'],['huntRepeat','repeat_label'],['huntCompare','compare_label'],['huntContinue','continue_label']])$(id).textContent=c[key];
 $('huntSource').textContent=c.source_label;$('huntSource').href=c.source_url;$('huntZoning').textContent=c.zoning_label;$('huntZoning').href=c.zoning_url;$('huntAttribution').textContent=c.map.attribution;
 $('huntStages').replaceChildren();c.stages.forEach((s,i)=>{const b=document.createElement('button');b.dataset.huntStage=String(i);b.textContent=String(i+1).padStart(2,'0')+' '+s.nav;b.onclick=()=>{stop();move((i+.3)/8);};$('huntStages').append(b);});buildMap();
 if(!bound){bound=true;$('huntPlay').onclick=play;$('huntRepeat').onclick=()=>{stop();move(0);};$('huntCompare').onclick=()=>{stop();move(1);};$('huntContinue').onclick=()=>{stop();window.YodStoryStart();};addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{stop();resize();});for(const type of ['wheel','touchstart','pointerdown'])addEventListener(type,e=>{if(playing&&!e.target.closest('.hunt-controls'))stop();},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});reduce.addEventListener('change',()=>{stop();resize();render(reduce.matches?1:p);});}
 resize();render(reduce.matches?1:0);return true;
}
window.YodHunt={mount,stop};
})();
