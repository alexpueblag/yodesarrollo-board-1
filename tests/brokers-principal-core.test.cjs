'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../presentacion/principal-core.js');
function source(){return {width:100,height:100,focus:[50,50],roads:[{d:'M0 50 L50 50 L100 50',kind:'primary',name:'Synthetic avenue'},{d:'M50 0 L50 50 L50 100',kind:'primary',name:'Synthetic cross'}]};}
function config(){
 const labelKeys=['city','mapCaption','propertyCaption','context','references','zoneA','zoneB','zoneC','buyer','demand','prices','sizes','priceM2','competition','access','employment','population','services','compatibleUse','property1','property2','physicalMeasure','constructionFootprint','purchase','contribution','departments','income','investment','profit','adverseCost','adversePrice','adverseTime','review','conditions','formalization','permits','construction','adverse','documentation','sale','cashflow','capital','capitalContribution','land','landContribution','coordination','return','projectVsInvestor','start','scope'];
 return {version:'synthetic-1',brand:'Synthetic brand',headline:'Synthetic heading',lead:'Synthetic lead',theme:{ink:'#AD451C',paper:'#FFF9F1'},labels:{...Object.fromEntries(labelKeys.map(k=>[k,'Synthetic '+k])),decision:['Synthetic advance','Synthetic adjust','Synthetic discard']},scenes:Array.from({length:9},(_,i)=>({id:'synthetic-scene-'+i,title:'Synthetic scene',beats:Array.from({length:4},()=>({title:'Synthetic beat',body:'Synthetic body'}))})),diagram:{schematic:true,zones:[{id:'A',center:[.36,.36],radius:.09},{id:'B',center:[.62,.45],radius:.09},{id:'C',center:[.43,.64],radius:.09}],places:[{id:'P1',zoneId:'A',mode:'purchase'},{id:'P2',zoneId:'B',mode:'contribution'}]}};
}
test('source and complete external configuration are mandatory',()=>{
 assert.throws(()=>C.build(undefined,config()),/cartography/);
 assert.throws(()=>C.build(source(),undefined),/configuration/);
 assert.throws(()=>C.build({width:100,height:100,roads:[]},config()),/cartography/);
 const c=config();c.scenes.pop();assert.throws(()=>C.build(source(),c),/Nine/);
 const c2=config();c2.scenes[0].beats.pop();assert.throws(()=>C.build(source(),c2),/Four/);
 const c3=config();delete c3.labels.propertyCaption;assert.throws(()=>C.normalize(c3),/label/);
});
test('unsafe source paths and invalid normalized zones are rejected',()=>{
 for(const d of ['M0 0 C5 5 5 5 10 10','M0 0 L10','M0 0<script>'])assert.throws(()=>C.build({width:100,height:100,roads:[{d}]},config()));
 for(const n of [NaN,Infinity,-.01,1.01,null,'0.3']){
  const c=config();c.diagram.zones[0].center[0]=n;assert.throws(()=>C.normalize(c),/zone/);
 }
 const c=config();c.diagram.zones[0].radius=0;assert.throws(()=>C.normalize(c),/zone/);
});
test('ABC are zones and P1 P2 are properties with distinct participation routes',()=>{
 const g=C.build(source(),config());
 assert.deepEqual(Object.keys(g.zones),['A','B','C']);assert.deepEqual(Object.keys(g.places),['P1','P2']);
 assert.equal(g.places.P1.zoneId,'A');assert.equal(g.places.P2.zoneId,'B');
 assert.equal(g.places.P1.mode,'purchase');assert.equal(g.places.P2.mode,'contribution');
 for(const p of Object.values(g.places))assert.equal(p.schematic,true);
 for(const field of ['id','mode','zoneId']){
  const c=config();c.diagram.places[1][field]=field==='id'?'A':field==='mode'?'guaranteed':'P1';assert.throws(()=>C.normalize(c),/identity/);
 }
 const c=config();c.diagram.places[1].mode='purchase';assert.throws(()=>C.normalize(c),/Both/);
});
test('the nine-scene world is one open continuous path without subpaths',()=>{
 const g=C.build(source(),config());
 assert.equal((g.d.match(/M/g)||[]).length,1);assert.equal(g.singleM,true);
 assert.ok(!/[CQSAZ]/i.test(g.d));assert.ok(!/NaN|Infinity/.test(g.d));
 for(let i=1;i<g.segments.length;i++)assert.deepEqual(g.segments[i].from,g.segments[i-1].to);
 assert.notDeepEqual(g.points[0],g.points.at(-1));
 assert.ok(g.width>g.height*2,'the world must not be nine stacked vertical boxes');
});
test('all nine scenes have four positive beats with contiguous prefix lengths',()=>{
 const g=C.build(source(),config());assert.equal(g.scenes.length,9);assert.equal(g.marks.length,36);
 for(let i=0;i<36;i++){
  const m=g.marks[i];assert.equal(m.index,i);assert.equal(m.scene,Math.floor(i/4));assert.equal(m.beat,i%4);
  assert.ok(m.endLength>m.startLength);assert.equal(g.scenes[m.scene].beats[m.beat],m);
  if(i)assert.equal(m.startLength,g.marks[i-1].endLength);
 }
 assert.equal(g.marks.at(-1).endLength,g.totalLength);
});
test('semantic progress is 36 equal beats independent of cartography length',()=>{
 const g=C.build(source(),config());
 for(let i=0;i<36;i++){const s=C.locate(g,(i+.5)/36);assert.equal(s.index,i);assert.equal(s.scene,Math.floor(i/4));assert.equal(s.beat,i%4);assert.ok(Math.abs(s.beatLocal-.5)<1e-12);}
 assert.equal(C.locate(g,1).index,35);assert.equal(C.locate(g,1).scene,8);
});
test('disconnected source components are reported and never connected as roads',()=>{
 const map={width:100,height:100,roads:[{d:'M0 0 L10 0 M80 80 L90 80',kind:'primary',name:'Synthetic isolated'}]};
 const g=C.build(map,config());assert.equal(g.mapCoverage.components,2);assert.equal(g.mapCoverage.drawnEdges,1);assert.equal(g.mapCoverage.sourceEdges,2);assert.equal(g.mapCoverage.partial,true);
 const roads=g.segments.filter(e=>e.tag==='verified-city-road'||e.tag==='source-road-visit');
 assert.ok(roads.length);assert.ok(roads.every(e=>e.from.y===e.to.y));
});
test('source and editable configuration are not mutated or embedded in geometry text',()=>{
 const map=source(),cfg=config(),beforeMap=JSON.stringify(map),beforeConfig=JSON.stringify(cfg),g=C.build(map,cfg);
 assert.equal(JSON.stringify(map),beforeMap);assert.equal(JSON.stringify(cfg),beforeConfig);
 assert.ok(g.annotations.find(a=>a.text==='Synthetic avenue'&&a.source));
 assert.ok(!g.d.includes('Synthetic'));
 const normalized=C.normalize({textos:{principal_config:JSON.stringify(cfg)}});assert.deepEqual(normalized,cfg);assert.notEqual(normalized,cfg);
});
test('the principal camera actually opens the city between zone visits',()=>{
 const g=C.build(source(),config()),city=g.cityFocus;
 for(const i of [11,15,19]){
  const end=C.locate(g,(i+.999999)/36);
  assert.ok(Math.abs(end.viewBox[2]-city.width)<.01);assert.ok(Math.abs(end.viewBox[3]-city.height)<.01);
 }
 for(const i of [8,12,16]){
  const start=C.locate(g,(i+.2)/36),close=C.locate(g,(i+.8)/36);
  assert.equal(start.viewBox[2],city.width);assert.equal(start.viewBox[3],city.height);
  assert.ok(close.viewBox[2]<city.width*.75);
 }
});
test('property origins remain traceable to zones and measurement marks stay outside footprints',()=>{
 const g=C.build(source(),config());
 for(const p of Object.values(g.places)){
  assert.ok(g.zones[p.zoneId]);assert.ok(p.measure.x<p.x);assert.equal(p.measure.y,p.y);assert.equal(p.measure.h,p.h);
  const a=g.annotations.find(a=>a.identity===p.id&&a.zoneId===p.zoneId);assert.ok(a);
 }
 assert.deepEqual(g.scenes[5].focus,g.scenes[6].focus);
 assert.ok(g.segments.some(e=>e.tag==='zone-to-schematic-property'));
});
test('review precedes project and the diagram does not declare a winning property or return',()=>{
 const g=C.build(source(),config());
 const review=g.segments.find(e=>e.tag==='review-before-commitment'),project=g.segments.find(e=>e.tag==='conditional-project');
 assert.ok(review&&project);assert.ok(review.start<project.start);assert.equal(g.project.conditional,true);assert.equal(g.project.schematic,true);
 assert.ok(g.annotations.some(a=>a.key==='formalization'&&a.conditional));
 assert.deepEqual(g.annotations.filter(a=>a.key==='decision').map(a=>a.labelIndex),[0,1,2]);
 for(const p of Object.values(g.places)){assert.equal(p.winner,undefined);assert.equal(p.roi,undefined);assert.equal(p.units,undefined);}
});
test('lengths are monotone, every tip is on its prefix and is inside the camera',()=>{
 const g=C.build(source(),config());let prev=-1;
 for(let i=0;i<=720;i++){
  const s=C.locate(g,i/720),e=g.segments[s.point.segment],v=s.viewBox;
  assert.ok(s.length>=prev);prev=s.length;
  assert.ok(Math.abs(e.start+Math.hypot(s.point.x-e.from.x,s.point.y-e.from.y)-s.length)<1e-6);
  assert.ok(v.every(Number.isFinite));assert.ok(v[2]>0&&v[3]>0);
  assert.ok(s.point.x>=v[0]&&s.point.x<=v[0]+v[2]);assert.ok(s.point.y>=v[1]&&s.point.y<=v[1]+v[3]);
 }
 assert.equal(C.locate(g,0).length,0);assert.equal(C.locate(g,1).length,g.totalLength);
});
test('reverse scroll recreates the exact same geometry state and builds are deterministic',()=>{
 const a=C.build(source(),config()),b=C.build(source(),config());
 assert.equal(a.d,b.d);assert.equal(a.totalLength,b.totalLength);
 const progress=[0,.1,.61,.22,.96,.33,1,.5],states=progress.map(p=>C.locate(a,p));
 for(let i=progress.length-1;i>=0;i--)assert.deepEqual(C.locate(a,progress[i]),states[i]);
 assert.deepEqual(C.camera(a,.5),C.locate(a,.5).viewBox);assert.deepEqual(C.pointAt(a,.5),C.locate(a,.5).point);
});
test('every annotation has a temporal and narrative anchor and only source roads carry names',()=>{
 const g=C.build(source(),config());
 for(const a of g.annotations){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.atLength));assert.equal(a.index,a.scene*4+a.beat);assert.ok(a.index>=0&&a.index<36);assert.ok(a.atLength>=g.marks[a.index].startLength&&a.atLength<=g.marks[a.index].endLength);if(a.text)assert.equal(a.source,true);}
 assert.ok(g.annotations.some(a=>a.key==='mapCaption'&&a.schematic));
});

test('external connectors are orthogonal and do not create diagonal spaghetti',()=>{
 const g=C.build(source(),config());
 const symbolTags=new Set(['source-road-visit','existing-house-outline','decision-gate-outline','project-volume-outline','sale-direction-arrow']);
 const connectors=g.segments.filter(s=>s.scene>=5&&!symbolTags.has(s.tag));
 assert.ok(connectors.length>200);
 assert.ok(connectors.every(s=>s.from.x===s.to.x||s.from.y===s.to.y));
 const zoneRails=g.segments.filter(s=>s.tag==='zone-research-criteria');
 assert.ok(zoneRails.length);assert.ok(zoneRails.every(s=>s.from.x===s.to.x||s.from.y===s.to.y));
 const houseDiagonals=g.segments.filter(s=>s.tag==='existing-house-outline'&&s.from.x!==s.to.x&&s.from.y!==s.to.y);
 assert.ok(houseDiagonals.length);
 assert.ok(houseDiagonals.every(s=>Object.values(g.places).some(p=>[s.from,s.to].every(q=>q.x>=p.x&&q.x<=p.x+p.w&&q.y>=p.y&&q.y<=p.y+p.h))));
});
test('financial and adverse streams stay outside both property interiors',()=>{
 const g=C.build(source(),config());
 const crossesInterior=(s,p)=>{
  if(s.from.x===s.to.x)return s.from.x>p.x&&s.from.x<p.x+p.w&&Math.max(s.from.y,s.to.y)>p.y&&Math.min(s.from.y,s.to.y)<p.y+p.h;
  if(s.from.y===s.to.y)return s.from.y>p.y&&s.from.y<p.y+p.h&&Math.max(s.from.x,s.to.x)>p.x&&Math.min(s.from.x,s.to.x)<p.x+p.w;
  return true;
 };
 for(const s of g.segments.filter(s=>['project-account','adverse-conditions','physical-measure'].includes(s.tag)))for(const p of Object.values(g.places))assert.equal(crossesInterior(s,p),false);
 const account=g.annotations.filter(a=>a.index===25),adverse=g.annotations.filter(a=>a.index===26);
 assert.equal(account.length,3);assert.equal(adverse.length,3);
 assert.deepEqual(account.map(a=>[a.x,a.y]),adverse.map(a=>[a.x,a.y]),'reuse one clean account row instead of accumulating zigzags');
});
test('roles have three named nodes and one shared agreement, not extra circles',()=>{
 const g=C.build(source(),config());
 assert.deepEqual(Object.keys(g.roles),['capital','land','coordination']);
 for(const key of Object.keys(g.roles)){
  const n=g.roles[key],a=g.annotations.find(a=>a.scene===8&&a.key===key);
  assert.ok(n.w>=600&&n.h>=200);assert.equal(a.persistent,true);assert.equal(a.centered,true);assert.equal(a.node,true);
  assert.equal(a.x,n.x+n.w/2);assert.equal(a.y,n.y+n.h/2);
 }
 const a=g.annotations.find(a=>a.index===34&&a.key==='agreement');
 assert.ok(a&&a.persistent&&a.centered);assert.ok(g.agreement.w>g.roles.capital.w);
 assert.deepEqual(g.annotations.filter(a=>a.index===34).map(a=>a.key),['agreement','return','projectVsInvestor']);
 assert.deepEqual(g.annotations.filter(a=>a.index===35).map(a=>a.key),['start','scope']);
 assert.ok(g.annotations.filter(a=>a.index===35).every(a=>a.captionOnly));
 const final=C.locate(g,35.4/36).viewBox;
 for(const n of [...Object.values(g.roles),g.agreement]){assert.ok(n.x>=final[0]&&n.x+n.w<=final[0]+final[2]);assert.ok(n.y>=final[1]&&n.y+n.h<=final[1]+final[3]);}
});

test('agreement camera preserves all three actors and the pact throughout the beat',()=>{
 const g=C.build(source(),config());
 for(const index of [34,35])for(const local of [.05,.4,.75,.99]){
  const v=C.locate(g,(index+local)/36).viewBox;
  for(const n of [...Object.values(g.roles),g.agreement]){
   assert.ok(n.x>=v[0]&&n.x+n.w<=v[0]+v[2]);
   assert.ok(n.y>=v[1]&&n.y+n.h<=v[1]+v[3]);
  }
  for(const n of Object.values(g.roles))assert.ok(n.w/v[2]*288>=120,'role words need real room on a 320 px phone');
 }
 const land=g.roles.land;
 assert.ok(land.h/C.locate(g,34.4/36).viewBox[2]*288>=50.4,'land role must fit three 14 px lines');
 assert.equal(g.annotations.find(a=>a.key==='land'&&a.scene===8).maxChars,18);
});
test('criterion and adverse labels reserve centered non-overlapping columns',()=>{
 const g=C.build(source(),config());
 for(const index of [9,10,13,14,17,18]){
  const slots=g.annotations.filter(a=>a.index===index).sort((a,b)=>a.x-b.x);
  assert.equal(slots.length,3);
  for(const a of slots){assert.equal(a.centered,true);assert.equal(a.maxChars,10);assert.ok(a.maxWidth>0);}
  for(let i=1;i<slots.length;i++)assert.ok(slots[i-1].x+slots[i-1].maxWidth/2<slots[i].x-slots[i].maxWidth/2);
 }
 const adverse=g.annotations.filter(a=>a.index===26);
 assert.ok(adverse.every(a=>a.centered&&a.maxChars===10&&a.maxWidth>0));
 const overview=g.annotations.find(a=>a.index===7&&a.key==='references');
 assert.equal(overview.captionOnly,true);
 const doc=g.annotations.find(a=>a.index===31&&a.key==='documentation'),cash=g.annotations.find(a=>a.index===31&&a.key==='cashflow');
 assert.ok(doc.x+doc.maxWidth/2<cash.x-cash.maxWidth/2);
});
