(function(root){'use strict';
const NS='http://www.w3.org/2000/svg',clamp=x=>Math.max(0,Math.min(1,x)),ease=t=>t*t*(3-2*t);
function n(tag,attrs={},children=[]){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);e.append(...children);return e;}
const path=(d,cls='line')=>n('path',{d,class:cls}),rect=(x,y,w,h,cls='line',rx=0)=>n('rect',{x,y,width:w,height:h,rx,class:cls}),g=(id,c=[])=>n('g',{'data-object':id},c);
const text=(x,y,t,cls='')=>{const e=n('text',{x,y,class:cls});e.textContent=t;return e;};
const arrow=(x,y,xx,yy)=>path('M'+x+' '+y+'L'+xx+' '+yy+'m-7-5l7 5-7 5','line accent');
function building(id){const b=g(id),land=path('M-135 38L15 110 155 35 5-37Z','line land');b.append(land);const floors=[];
for(let i=0;i<3;i++){const y=25-i*48,level=g(id+'-level-'+i);
level.append(path('M-106 '+y+'L12 '+(y+57)+' 123 '+y+'V'+(y-48)+'L5 '+(y-105)+'-106 '+(y-48)+'Z','line slab'),
path('M-106 '+(y-48)+'L12 '+(y+9)+' 123 '+(y-48)+'M12 '+(y+9)+'V'+(y+57),'line'),
path('M-83 '+(y-25)+'v23l25 12v-23ZM-41 '+(y-5)+'v23l25 12v-23ZM34 '+(y+8)+'v22l25-13v-22ZM78 '+(y-14)+'v22l25-13v-22Z','line glazing'));floors.push(level);b.append(level);}
b.append(path('M-150 60L0 132 175 43M-155 55v10M175 38v10','line dimension'));return {node:b,floors};}
function mount(svg,overlay,map){
const defs=n('defs',{},[n('pattern',{id:'drawing-grid',width:32,height:32,patternUnits:'userSpaceOnUse'},[path('M32 0H0V32','grid-line')]),n('clipPath',{id:'map-window'},[rect(14,22,612,330)])]);svg.append(defs,rect(0,0,640,420,'drawing-bg'),rect(0,0,640,420,'drawing-grid'));
const scenes=Array.from({length:9},(_,i)=>g('scene-'+i));svg.append(...scenes);
const city=g('real-city'),streets=g('real-streets'),mapCamera=g('map-camera',[city,streets]),mapClip=g('map-clip',[mapCamera]);mapClip.setAttribute('clip-path','url(#map-window)');
if(map){map.roads.forEach(r=>city.append(path(r[2],'road '+(/primary|trunk/.test(r[1])?'major':''))));map.streets.forEach(r=>streets.append(path(r[2],'road local')));}
scenes[1].append(mapClip);
const scan=g('search-areas');[[225,112,100,72],[350,200,92,70],[180,237,88,63]].forEach(([x,y,w,h],i)=>scan.append(rect(x,y,w,h,'line scan-area'),text(x+10,y+23,String.fromCharCode(65+i),'zone-id')));if(map){scan.setAttribute('transform','translate('+((map.focus[0]*.61-320)/.61)+' '+((map.focus[1]*.47-175)/.47)+') scale('+(1/.61)+' '+(1/.47)+')');mapCamera.append(scan);}else scenes[1].append(scan);
const context=g('city-context');if(map)map.roads.forEach(r=>context.append(path(r[2],'road')));context.setAttribute('transform','translate(20 0) scale(.6 .5)');scenes[0].append(context);
const primary=building('property-p1');svg.append(primary.node);const second=building('property-p2');scenes[2].append(second.node);second.node.setAttribute('transform','translate(480 235) scale(.66)');second.floors.forEach((e,i)=>e.style.opacity=i===0?'1':'0');
scenes[0].append(path('M98 320H542','line ghost'),arrow(142,320,230,320),arrow(400,320,490,320));
const propertyLines=g('property-comparison',[path('M50 295H590M50 310H590','line ghost'),text(160,75,'P1','parcel-id'),text(480,75,'P2','parcel-id'),path('M300 80V290','line dashed'),path('M74 274H242M74 268V280M242 268V280M400 274H564M400 268V280M564 268V280','line dimension')]);scenes[2].append(propertyLines);
const plan=g('plan',[rect(135,55,370,260,'line land'),rect(160,80,320,210,'line slab'),rect(302,80,36,210,'line corridor'),path('M160 180H302M338 180H480','line'),path('M135 330H505M135 322V338M505 322V338M116 55V315M108 55H124M108 315H124','line dimension')]);
const units=[[162,82,138,96],[340,82,138,96],[162,182,138,106],[340,182,138,106]].map((r,i)=>rect(...r,'unit unit-'+i));plan.append(...units,path('M302 290V320H338V290','line accent'));scenes[3].append(plan);
const account=g('account');const accountBoxes=[70,250,430].map((x,i)=>rect(x,105,140,170,'line account-box'));account.append(...accountBoxes);const ops=[text(230,200,'+','operator'),text(410,200,'+','operator')];account.append(...ops);const symbols=[text(140,170,'','money-symbol'),text(320,170,'','money-symbol'),text(500,170,'','money-symbol')];account.append(...symbols);scenes[4].append(account);
const checks=g('conditions');for(let i=0;i<3;i++){checks.append(rect(65+i*180,95,150,190,'line condition-card'),path('M'+(85+i*180)+' 135h110m-110 25h85m-85 25h98','line ghost'),text(140+i*180,240,'0'+(i+1),'phase-digit'));}scenes[5].append(checks);
const party=g('agreement',[rect(55,75,170,105,'line slab'),rect(415,75,170,105,'line slab'),rect(215,265,210,95,'line slab'),path('M140 180V222H320V265M500 180V222H320','line accent'),n('circle',{cx:320,cy:222,r:5,class:'joint'})]);scenes[6].append(party);
const execution=g('execution',[path('M68 318H570','line ghost'),rect(440,92,130,165,'line slab'),path('M463 125H546M463 149H546M463 173H522M463 197H538','line ghost'),path('M463 230h30m-15-15v30','line accent')]);scenes[7].append(execution);
const final=g('recovery',[rect(245,65,150,85,'line slab'),rect(80,240,180,90,'line slab'),rect(380,240,180,90,'line slab'),path('M320 150V192M170 240V192H470V240','line accent'),n('circle',{cx:320,cy:192,r:5,class:'joint'})]);scenes[8].append(final);
const miniMap=g('evaluation-map',[rect(112,65,416,260,'line slab'),path('M130 135H510M130 245H510M235 83V307M405 83V307','line ghost'),path('M253 151H386V225H253Z','line accent'),path('M275 169H361V207H275Z','line'),n('circle',{cx:253,cy:151,r:5,class:'joint'}),n('circle',{cx:386,cy:151,r:5,class:'joint'}),n('circle',{cx:386,cy:225,r:5,class:'joint'}),n('circle',{cx:253,cy:225,r:5,class:'joint'})]);scenes[8].append(miniMap);
const labels=Array.from({length:3},()=>{const el=document.createElement('span');el.className='art-label';overlay.append(el);return el;});
let words=[],diagrams={},labelScene=0,labelStep=0;
function draw(p,reduced){const beat=Math.min(26,Math.floor(p+.00001)),s=Math.floor(beat/3),j=beat%3,t=p-beat,blend=reduced?0:ease(clamp((t-.65)/.35));
scenes.forEach((el,i)=>el.style.opacity=i===s?String(s<8&&j===2?1-blend:1):i===s+1&&j===2?String(blend):'0');
const show=[0,2,7].includes(s),incoming=j===2&&[2,7].includes(s+1),ps=show?s:incoming?s+1:s,pj=incoming?0:j,pt=incoming?0:t;primary.node.style.opacity=show?String(j===2&&s<8?1-blend:1):incoming?String(blend):'0';
let x=ps===2?160:ps===7?250:320,y=ps===7?285:ps===2?235:255,z=ps===2?.66:ps===7?.95:1.03;
primary.node.setAttribute('transform','translate('+x+' '+y+') scale('+z+')');
primary.floors.forEach((el,i)=>{let a=ps===2?(i===0?1:0):ps===7?.2+.8*clamp((pj+pt)*1.6-i):i===0?1:clamp((pj+pt)*1.2-i+.2);el.style.opacity=String(a);el.setAttribute('transform','translate(0 '+((1-a)*-20).toFixed(3)+')');});
context.style.opacity=String(.18*(1-clamp((j+t)/2)));
if(map){let zoom=1+.2*(j+t),fx=map.focus[0],fy=map.focus[1];mapCamera.setAttribute('transform','translate('+(320-fx*.61*zoom).toFixed(3)+' '+(175-fy*.47*zoom).toFixed(3)+') scale('+(.61*zoom).toFixed(4)+' '+(.47*zoom).toFixed(4)+')');streets.style.opacity=String(clamp((j+t)/2));}
scan.style.opacity=String(.55+clamp(j+t)*.45);
scenes[2].querySelectorAll('.parcel-id').forEach((el,i)=>el.setAttribute('class','parcel-id '+(j===i?'accent-text':'')));
units.forEach((el,i)=>{el.style.opacity=String(clamp((j+t)*2-i*.35));});
ops[0].textContent=j===0?'+':j===1?'−':'';ops[1].textContent=j===0?'+':j===1?'=':'';
symbols.forEach((el,i)=>el.textContent=j===0?['▱','▥','＋'][i]:j===1?' ':['↓','↑','→'][i]);
accountBoxes.forEach((el,i)=>el.setAttribute('class','line account-box '+(j===1&&i===2?'highlight':'')));
checks.querySelectorAll('.condition-card').forEach((el,i)=>el.setAttribute('class','line condition-card '+(j<2&&i===j?'highlight':'')));
party.querySelectorAll('rect').forEach((el,i)=>el.setAttribute('class','line slab '+(i===j?'highlight':'')));
final.style.opacity=s===8&&j===2?'0':'1';miniMap.style.opacity=s===8&&j===2?'1':'0';
const positions=s===6?[[140,128],[500,128],[320,313]]:s===8&&j<2?[[320,108],[170,285],[470,285]]:s===4?[[140,j===1?190:239],[320,j===1?190:239],[500,j===1?190:239]]:s===5?[[140,310],[320,310],[500,310]]:[[120,357],[320,357],[520,357]];
const texts=s===2?diagrams.properties:s===3?diagrams.product:s===6?diagrams.participants:s===8&&j<2?diagrams.recovery:words;
labels.forEach((el,i)=>{el.textContent=texts?.[i]||'';el.style.left=positions[i][0]/640*100+'%';el.style.top=positions[i][1]/420*100+'%';el.classList.toggle('is-active',s===6?i===j:s===4&&j===1?i===2:false);});
overlay.style.opacity=String(j===2&&s<8?1-blend:1);svg.dataset.frame=p.toFixed(3);svg.dataset.map=map?'real':'unavailable';
}
return {draw,labels(v,d,s,j){words=v;diagrams=d;labelScene=s;labelStep=j;}};
}
root.YodSliderArt={mount};
})(window);
