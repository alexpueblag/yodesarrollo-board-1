(function(root){
'use strict';
const VERSION='principal-1';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const round=n=>Math.round(n*1000)/1000;
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const point=(x,y)=>{x=Number(x);y=Number(y);if(!finite(x)||!finite(y))throw Error('Non-finite geometry');return {x:round(x),y:round(y)};};
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const boxMix=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),width:mix(a.width,b.width,t),height:mix(a.height,b.height,t)});
const text=v=>typeof v==='string'&&v.trim().length>0;
function normalize(input){
 const raw=input&&input.textos?input.textos:input;
 let c=raw&&raw.principal_config!==undefined?raw.principal_config:raw;
 if(typeof c==='string')c=JSON.parse(c);
 if(!c||typeof c!=='object'||Array.isArray(c))throw Error('Principal configuration is required');
 c=JSON.parse(JSON.stringify(c));
 for(const k of ['version','brand','headline','lead'])if(!text(c[k]))throw Error('Missing principal '+k);
 if(!c.theme||!/^#[0-9a-f]{6}$/i.test(c.theme.ink)||!/^#[0-9a-f]{6}$/i.test(c.theme.paper))throw Error('Invalid principal theme');
 if(!Array.isArray(c.scenes)||c.scenes.length!==9)throw Error('Nine principal scenes are required');
 for(const s of c.scenes){
  if(!s||!text(s.id)||!text(s.title)||!Array.isArray(s.beats)||s.beats.length!==4)throw Error('Four beats per scene are required');
  for(const b of s.beats)if(!b||!text(b.title)||!text(b.body))throw Error('Incomplete principal beat');
 }
 if(new Set(c.scenes.map(s=>s.id)).size!==9)throw Error('Duplicate principal scene');
 if(!c.labels||typeof c.labels!=='object')throw Error('Principal labels are required');
 const keys=['city','mapCaption','propertyCaption','context','references','zoneA','zoneB','zoneC','buyer','demand','prices','sizes','priceM2','competition','access','employment','population','services','compatibleUse','property1','property2','physicalMeasure','constructionFootprint','purchase','contribution','departments','income','investment','profit','adverseCost','adversePrice','adverseTime','review','conditions','formalization','permits','construction','adverse','documentation','sale','cashflow','capital','capitalContribution','land','landContribution','coordination','return','projectVsInvestor','start','scope'];
 for(const k of keys)if(!text(c.labels[k]))throw Error('Missing principal label '+k);
 if(!Array.isArray(c.labels.decision)||c.labels.decision.length!==3||!c.labels.decision.every(text))throw Error('Decision labels are required');
 const d=c.diagram;
 if(!d||d.schematic!==true||!Array.isArray(d.zones)||d.zones.length!==3||!Array.isArray(d.places)||d.places.length!==2)throw Error('Schematic zones and properties are required');
 if(new Set(d.zones.map(z=>z&&z.id)).size!==3||!d.zones.every(z=>z&&['A','B','C'].includes(z.id)))throw Error('A B C must identify zones');
 for(const z of d.zones)if(!Array.isArray(z.center)||z.center.length!==2||!z.center.every(n=>finite(n)&&n>=0&&n<=1)||!finite(z.radius)||z.radius<=0||z.radius>.25)throw Error('Invalid normalized zone geometry');
 if(new Set(d.places.map(p=>p&&p.id)).size!==2||!d.places.every(p=>p&&['P1','P2'].includes(p.id)&&['A','B','C'].includes(p.zoneId)&&['purchase','contribution'].includes(p.mode)))throw Error('Invalid property identity');
 if(new Set(d.places.map(p=>p.mode)).size!==2)throw Error('Both participation routes are required');
 return c;
}
function polylines(road){
 if(Array.isArray(road))road={d:road[2],name:road[0],kind:road[1],label:road[3]};
 if(!road||typeof road!=='object')throw Error('Invalid road');
 if(Array.isArray(road.points)){
  if(road.points.length<2)throw Error('Road has no length');
  return [{points:road.points.map(p=>Array.isArray(p)?point(p[0],p[1]):point(p.x,p.y)),name:String(road.name||''),kind:String(road.kind||'')}];
 }
 const d=road.d;
 if(typeof d!=='string'||!d.length||d.length>20000||!/^[ML0-9.\s-]+$/.test(d))throw Error('Invalid source road path');
 const tokens=d.match(/[ML]|-?(?:\d+\.?\d*|\.\d+)/g)||[];
 const out=[];let points=[],mode='',i=0;
 while(i<tokens.length){
  if(tokens[i]==='M'||tokens[i]==='L'){mode=tokens[i++];if(mode==='M'&&points.length){if(points.length>1)out.push({points,name:String(road.name||''),kind:String(road.kind||'')});points=[];}}
  if(!mode||i+1>=tokens.length||tokens[i]==='M'||tokens[i]==='L'||tokens[i+1]==='M'||tokens[i+1]==='L')throw Error('Incomplete road coordinates');
  points.push(point(tokens[i++],tokens[i++]));mode='L';
 }
 if(points.length>1)out.push({points,name:String(road.name||''),kind:String(road.kind||'')});
 if(!out.length)throw Error('Road has no usable segments');
 return out;
}

function sourceGraph(source){
 const map=source&&source.map?source.map:source;
 if(!map||!finite(map.width)||!finite(map.height)||Number(map.width)<=0||Number(map.height)<=0||!Array.isArray(map.roads)||!map.roads.length)throw Error('Source cartography is required');
 if(map.roads.length>2500)throw Error('Too many source roads');
 const all=map.roads.flatMap(polylines);
 const principal=all.filter(r=>/^(motorway|trunk|primary|secondary)(?:_link)?$/.test(r.kind));
 const selected=principal.length?principal:all;
 const nodes=new Map(),edges=[];
 const node=p=>{const k=p.x+','+p.y;if(!nodes.has(k))nodes.set(k,{key:k,point:p,edges:[]});return nodes.get(k);};
 for(const r of selected)for(let i=1;i<r.points.length;i++){
  const a=node(r.points[i-1]),b=node(r.points[i]);if(a.key===b.key)continue;
  const edge={index:edges.length,a:a.key,b:b.key,name:r.name};edges.push(edge);a.edges.push(edge.index);b.edges.push(edge.index);
  if(edges.length>12000)throw Error('Source graph is too large');
 }
 if(!edges.length)throw Error('Cartography has no connected edge');
 const components=[],seen=new Set();
 for(const n of nodes.values()){
  if(seen.has(n.key))continue;
  const keys=[],stack=[n.key],edgeIds=new Set();seen.add(n.key);
  while(stack.length){const k=stack.pop();keys.push(k);for(const ei of nodes.get(k).edges){edgeIds.add(ei);const e=edges[ei],next=e.a===k?e.b:e.a;if(!seen.has(next)){seen.add(next);stack.push(next);}}}
  if(edgeIds.size)components.push({keys,edges:[...edgeIds]});
 }
 components.sort((a,b)=>b.edges.length-a.edges.length);
 const component=components[0];
 const focus=Array.isArray(map.focus)&&map.focus.length===2&&map.focus.every(finite)?point(map.focus[0],map.focus[1]):point(Number(map.width)/2,Number(map.height)/2);
 const distance=p=>Math.hypot(p.x-focus.x,p.y-focus.y);
 const junctions=component.keys.filter(k=>nodes.get(k).edges.length>=3),candidates=junctions.length?junctions:component.keys;
 const hub=candidates.reduce((best,k)=>distance(nodes.get(k).point)<distance(nodes.get(best).point)?k:best,candidates[0]);
 const allowed=new Set(component.edges),visited=new Set(),tour=[nodes.get(hub).point];
 const walk=[{key:hub,parent:null,edge:null,index:0}];
 while(walk.length){
  const f=walk[walk.length-1],list=nodes.get(f.key).edges;let ei=null;
  while(f.index<list.length){const candidate=list[f.index++];if(allowed.has(candidate)&&!visited.has(candidate)){ei=candidate;break;}}
  if(ei!==null){visited.add(ei);const e=edges[ei],next=e.a===f.key?e.b:e.a;tour.push(nodes.get(next).point);walk.push({key:next,parent:f.key,edge:ei,index:0});}
  else{walk.pop();if(f.parent!==null)tour.push(nodes.get(f.parent).point);}
 }
 const bounds=component.keys.reduce((b,k)=>{const p=nodes.get(k).point;return {minX:Math.min(b.minX,p.x),minY:Math.min(b.minY,p.y),maxX:Math.max(b.maxX,p.x),maxY:Math.max(b.maxY,p.y)};},{minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity});
 const exit=component.keys.reduce((best,k)=>nodes.get(k).point.y>nodes.get(best).point.y?k:best,hub);
 const parents=new Map([[hub,null]]),queue=[hub];
 for(let qi=0;qi<queue.length&&!parents.has(exit);qi++){const k=queue[qi];for(const ei of nodes.get(k).edges){if(!allowed.has(ei))continue;const e=edges[ei],next=e.a===k?e.b:e.a;if(!parents.has(next)){parents.set(next,k);queue.push(next);}}}
 const exitKeys=[];for(let k=exit;k!==null;k=parents.get(k))exitKeys.push(k);exitKeys.reverse();
 const names=new Map();
 for(const ei of component.edges){const e=edges[ei];if(e.name&&!names.has(e.name))names.set(e.name,nodes.get(e.a).point);}
 return {map,nodes,edges,component,hub: nodes.get(hub).point,tour,exitRoute:exitKeys.map(k=>nodes.get(k).point),bounds,names:[...names].slice(0,6),coverage:{sourceEdges:edges.length,drawnEdges:component.edges.length,components:components.length,partial:component.edges.length!==edges.length}};
}


function Trace(start){
 this.points=[start];this.segments=[];this.length=0;this.tag='';this.scene=0;this.beat=0;
}
Trace.prototype.line=function(p){
 p=point(p.x,p.y);const from=this.points[this.points.length-1];if(same(from,p))return;
 const length=Math.hypot(p.x-from.x,p.y-from.y);
 this.segments.push({from,to:p,start:this.length,end:this.length+length,length,scene:this.scene,beat:this.beat,tag:this.tag});
 this.length+=length;this.points.push(p);
};
Trace.prototype.loop=function(vertices){const origin=this.points[this.points.length-1];for(const p of vertices)this.line(p);this.line(origin);};
Trace.prototype.retrace=function(fn){const start=this.points.length-1;fn();const route=this.points.slice(start);for(let i=route.length-2;i>=0;i--)this.line(route[i]);};
Trace.prototype.box=function(b){this.loop([point(b.x,b.y+b.h/2),point(b.x,b.y),point(b.x+b.w,b.y),point(b.x+b.w,b.y+b.h),point(b.x,b.y+b.h),point(b.x,b.y+b.h/2)]);};
Trace.prototype.circle=function(center,r){
 const vertices=Array.from({length:49},(_,i)=>point(center.x+r*Math.cos(Math.PI*2*i/48),center.y+r*Math.sin(Math.PI*2*i/48)));
 this.loop(vertices);
};
function hull(points){
 const ps=[...new Map(points.map(p=>[p.x+','+p.y,p])).values()].sort((a,b)=>a.x-b.x||a.y-b.y);
 if(ps.length<3)return ps;
 const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const low=[],high=[];
 for(const p of ps){while(low.length>=2&&cross(low.at(-2),low.at(-1),p)<=0)low.pop();low.push(p);}
 for(let i=ps.length-1;i>=0;i--){const p=ps[i];while(high.length>=2&&cross(high.at(-2),high.at(-1),p)<=0)high.pop();high.push(p);}
 return low.slice(0,-1).concat(high.slice(0,-1));
}
function build(sourceMap,config){
 const cfg=normalize(config),graph=sourceGraph(sourceMap),bounds=graph.bounds;
 const spanX=Math.max(1,bounds.maxX-bounds.minX),spanY=Math.max(1,bounds.maxY-bounds.minY);
 const scale=Math.min(880/spanX,620/spanY),dx=480-(bounds.minX+spanX/2)*scale,dy=360-(bounds.minY+spanY/2)*scale;
 const project=p=>point(dx+p.x*scale,dy+p.y*scale);
 const city={x:0,y:0,width:960,height:720};
 const component=new Set(graph.component.keys),allowed=new Set(graph.component.edges);
 const nearest=p=>graph.component.keys.reduce((best,k)=>Math.hypot(project(graph.nodes.get(k).point).x-p.x,project(graph.nodes.get(k).point).y-p.y)<Math.hypot(project(graph.nodes.get(best).point).x-p.x,project(graph.nodes.get(best).point).y-p.y)?k:best,graph.component.keys[0]);
 const hubKey=nearest(project(graph.hub)),tr=new Trace(project(graph.hub));
 const zones=Object.fromEntries(cfg.diagram.zones.map(z=>{
  const center=point(40+z.center[0]*880,50+z.center[1]*620),radius=round(z.radius*620),node=nearest(center);
  return [z.id,{id:z.id,center,radius,node,focus:{x:center.x-radius*2.9,y:center.y-radius*2.6,width:radius*5.8,height:radius*5.2},schematic:true}];
 }));
 const orderedPlaces=cfg.diagram.places.slice().sort((a,b)=>a.id.localeCompare(b.id));
 const places=Object.fromEntries(orderedPlaces.map((p,i)=>[p.id,{...p,x:1260+i*450,y:340,w:250,h:170,schematic:true,access:point(1260+i*450,620),measure:{x:1225+i*450,y:340,h:170}}]));
 const pair={x:1120,y:230,width:970,height:720};
 const projectBox={x:2260,y:340,w:340,h:220},projectFocus={x:2070,y:150,width:780,height:720};
 const participantFocus={x:2790,y:160,width:850,height:720};
 const annotations=[],marks=[],scenes=[];
 let graphKey=hubKey;
 const annotate=(key,x,y,extra={})=>annotations.push({key,x:round(x),y:round(y),scene:tr.scene,beat:tr.beat,index:tr.scene*4+tr.beat,atLength:tr.length,...extra});
 const route=(from,to)=>{
  if(!component.has(from)||!component.has(to))throw Error('Invalid road route');
  const parent=new Map([[from,null]]),queue=[from];
  for(let i=0;i<queue.length&&!parent.has(to);i++)for(const ei of graph.nodes.get(queue[i]).edges){
   if(!allowed.has(ei))continue;const edge=graph.edges[ei],next=edge.a===queue[i]?edge.b:edge.a;
   if(!parent.has(next)){parent.set(next,queue[i]);queue.push(next);}
  }
  if(!parent.has(to))throw Error('Unreachable source road');
  const keys=[];for(let k=to;k!==null;k=parent.get(k))keys.push(k);return keys.reverse();
 };
 const goNode=key=>{tr.tag='source-road-visit';for(const k of route(graphKey,key).slice(1))tr.line(project(graph.nodes.get(k).point));graphKey=key;};
 const atZone=(id,draw)=>{const z=zones[id];goNode(z.node);tr.tag='schematic-zone-guide';tr.retrace(()=>{tr.line(z.center);draw(z);});};
 const mark=(scene,beat,draw,focus,context,options={})=>{
  tr.scene=scene;tr.beat=beat;const startLength=tr.length,segmentStart=tr.segments.length;
  draw();
  if(tr.length<=startLength)throw Error('Empty narrative beat');
  const m={scene,beat,index:scene*4+beat,startLength,endLength:tr.length,segmentStart,segmentEnd:tr.segments.length,focus:{...focus},context,anchor:{...tr.points.at(-1)},...options};
  marks.push(m);scenes[scene].beats.push(m);
 };
 const newScene=(index,context,focus)=>{const s={index,id:cfg.scenes[index].id,context,focus:{...focus},startLength:tr.length,endLength:0,beats:[]};scenes.push(s);return s;};
 const done=s=>{s.endLength=tr.length;};
 const tour=graph.tour.map(project),mid=Math.max(1,Math.floor((tour.length-1)/2));
 let s=newScene(0,'city',city);
 mark(0,0,()=>{tr.tag='verified-city-road';for(const p of tour.slice(1,mid+1))tr.line(p);annotate('city',480,38);},city,'city');
 mark(0,1,()=>{tr.tag='verified-city-road';for(const p of tour.slice(mid+1))tr.line(p);for(const [name,p]of graph.names){const q=project(p);annotate('road',q.x,q.y-10,{text:name,source:true});}},city,'city');
 mark(0,2,()=>{
  const h=hull(graph.component.keys.map(k=>project(graph.nodes.get(k).point))),first=h[0];goNode(nearest(first));tr.tag='illustrative-envelope';
  if(h.length>2)tr.loop(h.concat(h[0]));else tr.retrace(()=>{for(const p of h)tr.line(p);});
  annotate('mapCaption',480,700,{schematic:true});goNode(hubKey);
 },city,'city');
 mark(0,3,()=>{tr.tag='territory-context';tr.retrace(()=>{tr.line(point(480,690));tr.line(point(590,690));});annotate('context',480,660);},city,'city');
 done(s);
 s=newScene(1,'zones',city);
 for(let b=0;b<3;b++){
  const id=['A','B','C'][b];
  mark(1,b,()=>atZone(id,z=>{tr.circle(z.center,z.radius);annotate('zone'+id,z.center.x,z.center.y-z.radius-18,{identity:id,schematic:true});}),city,'zones');
 }
 mark(1,3,()=>{goNode(hubKey);tr.tag='common-criteria';tr.retrace(()=>{tr.line(point(100,690));tr.line(point(870,690));});annotate('references',480,663);},city,'zones');
 done(s);
 const zoneCriteria=[
  [['buyer','demand','prices'],['sizes','priceM2','competition']],
  [['access','employment','population'],['services','compatibleUse','references']],
  [['prices','priceM2','competition'],['buyer','sizes','demand']]
 ];
 for(let zi=0;zi<3;zi++){
  const scene=zi+2,id=['A','B','C'][zi],z=zones[id];
  s=newScene(scene,'zone-'+id,z.focus);
  mark(scene,0,()=>atZone(id,zone=>{tr.circle(zone.center,zone.radius*.92);annotate('zone'+id,zone.center.x,zone.center.y-zone.radius-18,{identity:id,schematic:true});}),z.focus,'zone-'+id,{enterFrom:city});
  for(let b=1;b<=2;b++){
   mark(scene,b,()=>atZone(id,zone=>{
    tr.tag='zone-research-criteria';
    for(let j=0;j<3;j++){
     const angle=(-150+j*60+(b-1)*180)*Math.PI/180,tip=point(zone.center.x+zone.radius*1.6*Math.cos(angle),zone.center.y+zone.radius*1.6*Math.sin(angle));
     tr.retrace(()=>{tr.line(tip);tr.line(point(tip.x+8,tip.y));});
     annotate(zoneCriteria[zi][b-1][j],tip.x,tip.y+(Math.sin(angle)>0?20:-20),{zoneId:id,criterion:true});
    }
   }),z.focus,'zone-'+id);
  }
  mark(scene,3,()=>{goNode(hubKey);tr.tag='zone-reference';tr.retrace(()=>{tr.line(point(100+zi*210,690));tr.line(point(220+zi*210,690));});annotate('references',480,660);},z.focus,'zone-'+id,{exitTo:city});
  done(s);
 }
 const streetY=620;
 const propertyOrigin=id=>{
  const p=places[id],z=zones[p.zoneId];goNode(z.node);
  tr.tag='zone-to-schematic-property';
  const n=project(graph.nodes.get(z.node).point),lane=point(1030,streetY);
  const draw=()=>{
   tr.line(point(1030,n.y));tr.line(lane);tr.line(p.access);
   tr.tag='schematic-property';tr.box(p);
   tr.retrace(()=>{
    const x=p.x+45,y=p.y+55,w=p.w-90,h=p.h-80;
    tr.line(point(x,y+h));tr.loop([point(x,y+h),point(x,y),point(x+w/2,y-30),point(x+w,y),point(x+w,y+h),point(x,y+h)]);
   });
   annotate(p.id==='P1'?'property1':'property2',p.x+p.w/2,p.y-22,{identity:p.id,zoneId:p.zoneId,schematic:true});
  };
  if(id==='P2')draw();else tr.retrace(draw);
 };
 const goStreet=()=>{tr.tag='schematic-street';tr.line(point(2060,streetY));};
 const survey=p=>{
  tr.tag='physical-measure';tr.retrace(()=>{
   tr.line(point(p.measure.x,streetY));tr.line(point(p.measure.x,p.y));tr.retrace(()=>tr.line(point(p.measure.x+8,p.y)));
   tr.line(point(p.measure.x,p.y+p.h));tr.retrace(()=>tr.line(point(p.measure.x+8,p.y+p.h)));
   tr.line(point(p.x,p.y+p.h+35));tr.line(point(p.x+p.w,p.y+p.h+35));
  });
  annotate('physicalMeasure',p.x+p.w/2,p.y+p.h+70,{identity:p.id,schematic:true});
 };
 s=newScene(5,'properties',pair);
 mark(5,0,()=>{propertyOrigin('P1');propertyOrigin('P2');goStreet();},{x:0,y:0,width:2120,height:960},'properties',{enterFrom:city,enterDelay:0,enterDuration:.15});
 mark(5,1,()=>{for(const p of Object.values(places))survey(p);annotate('constructionFootprint',1605,265,{schematic:true});},pair,'properties');
 mark(5,2,()=>{
  for(const p of Object.values(places)){
   tr.tag='participation-route';tr.retrace(()=>{tr.line(p.access);tr.circle(point(p.x+p.w/2,680),24);});
   annotate(p.mode,p.x+p.w/2,725,{identity:p.id,zoneId:p.zoneId});
  }
 },pair,'properties');
 mark(5,3,()=>{tr.tag='common-property-criteria';tr.retrace(()=>{tr.line(point(1120,780));tr.line(point(2000,780));});annotate('references',1605,815);},pair,'properties');
 done(s);
 s=newScene(6,'comparison',pair);
 mark(6,0,()=>{
  for(const p of Object.values(places)){
   tr.tag='possible-product';tr.retrace(()=>{tr.line(p.access);tr.line(point(p.x+p.w/2,p.y+p.h/2));tr.line(point(p.x+p.w/2,p.y+20));});
  }
  annotate('departments',1605,265,{schematic:true,conditional:true});
 },pair,'comparison');
 mark(6,1,()=>{
  tr.tag='project-account';tr.retrace(()=>{tr.line(point(1150,855));tr.line(point(2050,855));for(const x of [1270,1605,1940])tr.retrace(()=>tr.box({x:x-30,y:800,w:60,h:50}));});
  annotate('income',1270,770);annotate('investment',1605,770);annotate('profit',1940,770);
 },{x:1090,y:230,width:1030,height:720},'comparison');
 mark(6,2,()=>{
  tr.tag='adverse-conditions';tr.retrace(()=>{tr.line(point(1150,930));for(const x of [1270,1605,1940]){tr.line(point(x,930));tr.retrace(()=>tr.loop([point(x-25,930),point(x,890),point(x+25,930)]));}});
  annotate('adverseCost',1270,970);annotate('adversePrice',1605,970);annotate('adverseTime',1940,970);
 },{x:1090,y:260,width:1030,height:780},'comparison');
 mark(6,3,()=>{
  tr.tag='conditional-decision';tr.line(point(2060,620));
  tr.retrace(()=>tr.loop([point(2060,620),point(2100,580),point(2140,620),point(2100,660),point(2060,620)]));
  for(let i=0;i<3;i++){
   const y=510+i*115;tr.retrace(()=>{tr.line(point(2180,y));tr.line(point(2230,y));});
   annotate('decision',2240,y+5,{labelIndex:i,conditional:true});
  }
 },{x:1110,y:230,width:1410,height:820},'comparison');
 done(s);
 const gate=point(2210,620);
 s=newScene(7,'development',projectFocus);
 mark(7,0,()=>{
  tr.tag='review-before-commitment';tr.line(gate);tr.retrace(()=>tr.box({x:2185,y:580,w:50,h:80}));
  annotate('review',2205,260,{conditional:true});annotate('conditions',2450,260,{conditional:true});
  tr.line(point(2430,620));annotate('formalization',2430,665,{conditional:true});
 },projectFocus,'development');
 mark(7,1,()=>{
  tr.tag='conditional-project';tr.box(projectBox);
  tr.retrace(()=>{
   const x=projectBox.x+70,y=projectBox.y+55,w=projectBox.w-140,h=projectBox.h-80;
   tr.line(point(x,y+h));tr.loop([point(x,y+h),point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)]);
  });
  annotate('departments',2430,300,{schematic:true,conditional:true});annotate('permits',2430,605,{conditional:true});
 },projectFocus,'development');
 mark(7,2,()=>{
  tr.tag='construction-and-control';tr.retrace(()=>{
   tr.line(point(2650,620));tr.line(point(2650,355));tr.line(point(2580,355));
   tr.retrace(()=>{tr.line(point(2580,315));tr.line(point(2530,315));});
   tr.line(point(2580,580));
  });
  annotate('construction',2450,730);annotate('adverse',2650,780);
 },projectFocus,'development');
 mark(7,3,()=>{
  tr.tag='documentation-sale-collections';tr.line(point(2690,620));
  tr.retrace(()=>tr.box({x:2655,y:470,w:70,h:105}));
  tr.line(point(2790,620));tr.retrace(()=>tr.circle(point(2790,620),27));
  annotate('documentation',2620,850);annotate('sale',2790,690);annotate('cashflow',2790,775);
 },{x:2120,y:250,width:970,height:650},'development');
 done(s);
 const projectJoin=point(2860,620),capital=point(3290,320),land=point(3290,790),coordination=point(3070,550),agreement=point(3470,550);
 s=newScene(8,'participation',participantFocus);
 mark(8,0,()=>{
  tr.tag='capital-participation';tr.line(projectJoin);tr.retrace(()=>{tr.line(capital);tr.circle(capital,40);});
  annotate('capital',3290,230);annotate('capitalContribution',3290,395);
 },participantFocus,'participation');
 mark(8,1,()=>{
  tr.tag='property-participation';tr.retrace(()=>{tr.line(land);tr.box({x:land.x-60,y:land.y-35,w:120,h:70});});
  tr.tag='coordination';tr.line(coordination);tr.retrace(()=>tr.circle(coordination,45));
  annotate('land',3290,855);annotate('landContribution',3290,725);annotate('coordination',3030,460);
 },participantFocus,'participation');
 mark(8,2,()=>{
  tr.tag='participation-agreement';tr.line(agreement);tr.retrace(()=>tr.box({x:agreement.x-50,y:agreement.y-65,w:100,h:130}));
  annotate('return',3300,980);annotate('projectVsInvestor',3300,1030);
 },{x:2820,y:300,width:850,height:790},'participation');
 mark(8,3,()=>{
  tr.tag='open-conversation';tr.line(point(3470,900));tr.line(point(3330,900));tr.line(point(3330,940));tr.line(point(3470,940));
  annotate('start',3240,640);annotate('scope',3240,690);
 },{x:2870,y:450,width:800,height:600},'participation');
 done(s);
 const all=tr.points.concat(annotations.map(a=>point(a.x,a.y))).reduce((b,p)=>({minX:Math.min(b.minX,p.x),minY:Math.min(b.minY,p.y),maxX:Math.max(b.maxX,p.x),maxY:Math.max(b.maxY,p.y)}),{minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity});
 const d='M'+tr.points[0].x+' '+tr.points[0].y+tr.points.slice(1).map(p=>' L'+p.x+' '+p.y).join('');
 return {version:VERSION,d,singleM:true,points:tr.points,segments:tr.segments,totalLength:tr.length,marks,scenes,annotations,labels:annotations,bounds:all,width:all.maxX-all.minX,height:all.maxY-all.minY,zones,places,project:{...projectBox,schematic:true,conditional:true},mapCoverage:graph.coverage,cityFocus:city};
}
function pointAtLength(layout,length){
 if(!layout||!Array.isArray(layout.segments)||!layout.segments.length)throw Error('Empty trace');
 length=clamp(length,0,layout.totalLength);let lo=0,hi=layout.segments.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(layout.segments[m].end<length)lo=m+1;else hi=m;}
 const s=layout.segments[lo],t=s.length?clamp((length-s.start)/s.length):0;
 return {x:mix(s.from.x,s.to.x,t),y:mix(s.from.y,s.to.y,t),segment:lo};
}
function locate(layout,p){
 p=clamp(p);const n=layout.marks.length,g=p*n,index=Math.min(n-1,Math.floor(g)),mark=layout.marks[index],beatLocal=p===1?1:g-index;
 const length=mix(mark.startLength,mark.endLength,beatLocal),position=pointAtLength(layout,length);
 let focus={...mark.focus};
 if(mark.enterFrom){const delay=mark.enterDelay===undefined?.4:mark.enterDelay,duration=mark.enterDuration===undefined?.6:mark.enterDuration;focus=boxMix(mark.enterFrom,mark.focus,ease(clamp((beatLocal-delay)/duration)));}
 if(mark.exitTo)focus=boxMix(mark.focus,mark.exitTo,ease(clamp((beatLocal-.7)/.3)));
 const next=layout.marks[index+1];
 if(next&&!mark.exitTo&&!next.enterFrom&&beatLocal>.82)focus=boxMix(focus,next.focus,ease((beatLocal-.82)/.18));
 const pad=Math.min(focus.width,focus.height)*.055;
 if(position.x<focus.x+pad)focus.x=position.x-pad;
 if(position.x>focus.x+focus.width-pad)focus.x=position.x-focus.width+pad;
 if(position.y<focus.y+pad)focus.y=position.y-pad;
 if(position.y>focus.y+focus.height-pad)focus.y=position.y-focus.height+pad;
 return {p,index,scene:mark.scene,beat:mark.beat,local:p===1?1:p*layout.scenes.length-mark.scene,beatLocal,length,point:position,viewBox:[focus.x,focus.y,focus.width,focus.height],focus,context:mark.context,anchor:mark.anchor};
}
function pointAt(layout,p){return locate(layout,p).point;}
function camera(layout,p){return locate(layout,p).viewBox;}
const api={VERSION,clamp,normalize,build,locate,pointAtLength,pointAt,camera,polylines};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.YodPrincipalCore=api;
})(typeof window==='undefined'?globalThis:window);
