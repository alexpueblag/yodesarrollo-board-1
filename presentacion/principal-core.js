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
Trace.prototype.ortho=function(p,verticalFirst=false){
 const from=this.points[this.points.length-1];
 this.line(verticalFirst?point(from.x,p.y):point(p.x,from.y));this.line(p);
};
Trace.prototype.box=function(b){
 const origin=this.points[this.points.length-1];
 let anchor;
 if(origin.y>=b.y+b.h)anchor=point(b.x,b.y+b.h);
 else if(origin.y<=b.y)anchor=point(b.x,b.y);
 else if(origin.x<=b.x)anchor=point(b.x,b.y);
 else if(origin.x>=b.x+b.w)anchor=point(b.x+b.w,b.y);
 else throw Error('Box entry must be outside symbol');
 this.retrace(()=>{
  this.ortho(anchor);
  this.loop([point(b.x,b.y),point(b.x+b.w,b.y),point(b.x+b.w,b.y+b.h),point(b.x,b.y+b.h),point(b.x,b.y)]);
 });
};
Trace.prototype.circle=function(center,r){
 const anchor=point(center.x-r,center.y);
 this.retrace(()=>{
  this.ortho(anchor);
  const vertices=Array.from({length:49},(_,i)=>point(center.x+r*Math.cos(Math.PI+Math.PI*2*i/48),center.y+r*Math.sin(Math.PI+Math.PI*2*i/48)));
  this.loop(vertices);
 });
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
  const center=point(40+z.center[0]*880,50+z.center[1]*620),radius=round(z.radius*620),node=nearest(point(center.x-radius,center.y));
  return [z.id,{id:z.id,center,radius,node,focus:{x:center.x-radius*2.9,y:center.y-radius*2.6,width:radius*5.8,height:radius*5.2},schematic:true}];
 }));
 const orderedPlaces=cfg.diagram.places.slice().sort((a,b)=>a.id.localeCompare(b.id));
 const places=Object.fromEntries(orderedPlaces.map((p,i)=>[p.id,{...p,x:1260+i*450,y:340,w:250,h:170,schematic:true,access:point(1260+i*450,620),measure:{x:1225+i*450,y:340,h:170}}]));
 const pair={x:1120,y:120,width:970,height:830};
 const projectBox={x:2260,y:340,w:340,h:220},projectFocus={x:2070,y:150,width:780,height:720};
 const participantFocus={x:2790,y:170,width:920,height:820};
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
 const atZone=(id,draw)=>{const z=zones[id];goNode(z.node);tr.tag='schematic-zone-guide';tr.retrace(()=>{tr.ortho(point(z.center.x-z.radius,z.center.y));draw(z);});};
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
  mark(1,b,()=>atZone(id,z=>{tr.circle(z.center,z.radius);annotate('zone'+id,z.center.x,z.center.y-z.radius-18,{identity:id,schematic:true,persistent:true});}),city,'zones');
 }
 mark(1,3,()=>{goNode(hubKey);tr.tag='common-criteria';tr.retrace(()=>{tr.line(point(100,690));tr.line(point(870,690));});annotate('references',480,663,{captionOnly:true});},city,'zones');
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
    const railX=zone.center.x-zone.radius*2.2,railY=zone.center.y+(b===1?-1:1)*zone.radius*1.65;
    tr.line(point(railX,zone.center.y));tr.line(point(railX,railY));
    for(let j=0;j<3;j++){
     const x=zone.center.x+(j-1)*zone.radius*1.95;
     tr.line(point(x,railY));tr.retrace(()=>tr.line(point(x,railY+(b===1?-8:8))));
     annotate(zoneCriteria[zi][b-1][j],x,railY+(b===1?-14:14),{zoneId:id,criterion:true,centered:true,maxChars:10,maxWidth:zone.radius*1.7-12});
    }
    tr.line(point(railX,railY));tr.line(point(railX,zone.center.y));tr.line(point(zone.center.x-zone.radius,zone.center.y));
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
    tr.line(point(x,streetY));tr.line(point(x,y+h));
    tr.tag='existing-house-outline';tr.loop([point(x,y+h),point(x,y),point(x+w/2,y-30),point(x+w,y),point(x+w,y+h),point(x,y+h)]);
   });
   annotate(p.id==='P1'?'property1':'property2',p.x+p.w/2,p.y-22,{identity:p.id,zoneId:p.zoneId,schematic:true,persistent:true});
  };
  if(id==='P2')draw();else tr.retrace(draw);
 };
 const goStreet=()=>{tr.tag='schematic-street';tr.line(point(2060,streetY));};
 const survey=p=>{
  tr.tag='physical-measure';tr.retrace(()=>{
   tr.line(point(p.measure.x,streetY));tr.line(point(p.measure.x,p.y));
   tr.retrace(()=>tr.line(point(p.measure.x+8,p.y)));
   tr.line(point(p.measure.x,p.y+p.h));tr.retrace(()=>tr.line(point(p.measure.x+8,p.y+p.h)));
   tr.line(point(p.measure.x,p.y+p.h+35));tr.line(point(p.x,p.y+p.h+35));tr.line(point(p.x+p.w,p.y+p.h+35));
  });
  annotate('physicalMeasure',p.x+p.w/2,p.y+p.h+70,{identity:p.id,schematic:true});
 };
 const stream=(tag,keys)=>{
  tr.tag=tag;tr.retrace(()=>{
   tr.line(point(2060,900));tr.line(point(1150,900));
   for(let i=0;i<3;i++){
    const x=[1270,1605,1940][i];
    tr.line(point(x,900));
    tr.retrace(()=>{tr.line(point(x,870));tr.box({x:x-36,y:814,w:72,h:56});});
    annotate(keys[i],x,765,{centered:true,maxChars:tag==='adverse-conditions'?10:12,maxWidth:265});
   }
  });
 };
 s=newScene(5,'properties',pair);
 mark(5,0,()=>{propertyOrigin('P1');propertyOrigin('P2');goStreet();},{x:0,y:0,width:2120,height:960},'properties',{enterFrom:city,enterDelay:0,enterDuration:.15});
 mark(5,1,()=>{for(const p of Object.values(places))survey(p);annotate('constructionFootprint',1605,185,{schematic:true,centered:true});},pair,'properties');
 mark(5,2,()=>{
  for(const p of Object.values(places)){
   tr.tag='participation-route';tr.retrace(()=>{
    const x=p.x+p.w/2;
    tr.line(point(x,streetY));tr.line(point(x,685));tr.retrace(()=>{tr.line(point(x-36,685));tr.line(point(x+36,685));});
   });
   annotate(p.mode,p.x+p.w/2,725,{identity:p.id,zoneId:p.zoneId});
  }
 },pair,'properties');
 mark(5,3,()=>{tr.tag='common-property-criteria';tr.retrace(()=>{tr.line(point(2060,760));tr.line(point(1120,760));});annotate('references',1605,790);},pair,'properties');
 done(s);
 s=newScene(6,'comparison',pair);
 mark(6,0,()=>{
  for(const p of Object.values(places)){
   tr.tag='possible-product';tr.retrace(()=>{tr.line(p.access);tr.box(p);});
  }
  annotate('departments',1605,185,{schematic:true,conditional:true,centered:true});
 },pair,'comparison');
 mark(6,1,()=>stream('project-account',['income','investment','profit']),{x:1090,y:230,width:1030,height:720},'comparison');
 mark(6,2,()=>stream('adverse-conditions',['adverseCost','adversePrice','adverseTime']),{x:1090,y:230,width:1030,height:720},'comparison');
 mark(6,3,()=>{
  tr.tag='conditional-decision';tr.line(point(2100,620));
  tr.tag='decision-gate-outline';tr.line(point(2130,590));tr.line(point(2160,620));tr.line(point(2130,650));tr.line(point(2100,620));tr.line(point(2130,590));tr.line(point(2160,620));
  tr.tag='conditional-decision';tr.line(point(2190,620));
  for(let i=0;i<3;i++){
   const y=510+i*115;
   tr.retrace(()=>{tr.line(point(2190,y));tr.line(point(2260,y));});
   annotate('decision',2330,y+5,{labelIndex:i,conditional:true});
  }
 },{x:1110,y:230,width:1410,height:820},'comparison');
 done(s);
 const gate=point(2210,620);
 s=newScene(7,'development',projectFocus);
 mark(7,0,()=>{
  tr.tag='review-before-commitment';tr.line(gate);tr.retrace(()=>tr.box({x:2160,y:550,w:70,h:70}));
  annotate('review',2170,700,{conditional:true});annotate('conditions',2440,700,{conditional:true});
  tr.line(point(2430,620));annotate('formalization',2430,830,{conditional:true,centered:true});
 },projectFocus,'development');
 mark(7,1,()=>{
  tr.tag='conditional-project';tr.box(projectBox);
  const facade={x:2330,y:385,w:200,h:150};
  tr.retrace(()=>{
   tr.line(point(facade.x,620));tr.box(facade);
   tr.line(point(facade.x,facade.y));
   tr.tag='project-volume-outline';tr.loop([point(facade.x,facade.y),point(facade.x+40,facade.y-30),point(facade.x+facade.w+40,facade.y-30),point(facade.x+facade.w,facade.y),point(facade.x,facade.y)]);
  });
  tr.tag='conditional-project';tr.retrace(()=>{
   tr.line(point(facade.x+facade.w+40,620));tr.line(point(facade.x+facade.w+40,facade.y+facade.h-30));
   tr.tag='project-volume-outline';tr.loop([point(facade.x+facade.w+40,facade.y+facade.h-30),point(facade.x+facade.w+40,facade.y-30),point(facade.x+facade.w,facade.y),point(facade.x+facade.w,facade.y+facade.h),point(facade.x+facade.w+40,facade.y+facade.h-30)]);
  });
  annotate('departments',2430,290,{schematic:true,conditional:true});annotate('permits',2430,690,{conditional:true});
 },projectFocus,'development');
 mark(7,2,()=>{
  tr.tag='construction-and-control';tr.retrace(()=>{
   tr.line(point(2700,620));tr.line(point(2700,300));tr.line(point(2460,300));
   tr.retrace(()=>{tr.line(point(2460,325));tr.line(point(2470,325));});
  });
  annotate('construction',2450,730);annotate('adverse',2680,785);
 },projectFocus,'development');
 mark(7,3,()=>{
  tr.tag='documentation-sale-collections';tr.line(point(2760,620));
  tr.retrace(()=>{
   const doc={x:2760,y:490,w:70,h:105};tr.box(doc);tr.line(point(doc.x,doc.y+20));
   for(const y of [doc.y+20,doc.y+45,doc.y+70]){tr.line(point(doc.x,y));tr.retrace(()=>tr.line(point(doc.x+50,y)));}
  });
  tr.line(point(3245,620));
  tr.tag='sale-direction-arrow';tr.retrace(()=>{tr.line(point(3230,610));tr.line(point(3245,620));tr.line(point(3230,630));});
  tr.tag='documentation-sale-collections';tr.line(point(3650,620));
  tr.retrace(()=>{
   const ledger={x:3650,y:510,w:90,h:85};tr.line(point(ledger.x,ledger.y+ledger.h));tr.box(ledger);
   tr.line(point(ledger.x,ledger.y+28));tr.retrace(()=>tr.line(point(ledger.x+ledger.w,ledger.y+28)));
   tr.line(point(ledger.x,ledger.y+56));tr.retrace(()=>tr.line(point(ledger.x+ledger.w,ledger.y+56)));
  });
  annotate('documentation',2795,750,{centered:true,maxChars:12,maxWidth:420});
  annotate('sale',3245,750,{centered:true,maxChars:10,maxWidth:420});
  annotate('cashflow',3695,750,{centered:true,maxChars:10,maxWidth:420});
 },{x:2070,y:240,width:1850,height:800},'development');
 done(s);
 const projectJoin=point(2860,620),junction=point(2920,620);
 const roles={
  capital:{x:3020,y:230,w:950,h:280},
  land:{x:4050,y:170,w:950,h:400},
  coordination:{x:3535,y:640,w:950,h:280}
 };
 const agreement={x:3435,y:990,w:1150,h:300};
 const capitalFocus={x:2920,y:160,width:1120,height:550};
 const rolesFocus={x:2955,y:110,width:2110,height:970};
 const wholeRoles={x:2955,y:110,width:2110,height:1290};
 const roleNode=key=>{
  const node=roles[key],cy=node.y+node.h/2;
  tr.tag='role-'+key;tr.box(node);
  annotate(key,node.x+node.w/2,cy,{persistent:true,node:true,centered:true,maxChars:18,maxWidth:930});
 };
 s=newScene(8,'participation',wholeRoles);
 mark(8,0,()=>{
  tr.tag='capital-participation';tr.line(projectJoin);tr.line(junction);
  tr.line(point(junction.x,370));tr.line(point(roles.capital.x,370));roleNode('capital');
 },capitalFocus,'participation');
 mark(8,1,()=>{
  tr.tag='role-land';tr.line(point(junction.x,370));tr.line(point(junction.x,140));
  tr.line(point(3990,140));tr.line(point(3990,370));tr.line(point(roles.land.x,370));roleNode('land');
  tr.tag='role-coordination';tr.line(point(3990,370));tr.line(point(3990,140));tr.line(point(3990,610));
  tr.line(point(3495,610));tr.line(point(3495,780));tr.line(point(roles.coordination.x,780));roleNode('coordination');
 },rolesFocus,'participation',{enterFrom:capitalFocus,enterDelay:0,enterDuration:.35});
 mark(8,2,()=>{
  tr.tag='participation-agreement';
  tr.line(point(3300,780));tr.line(point(3300,1140));tr.line(point(agreement.x,1140));tr.box(agreement);
  annotate('agreement',agreement.x+agreement.w/2,agreement.y+agreement.h/2,{persistent:true,node:true,centered:true,maxChars:18,maxWidth:1100});
  annotate('return',agreement.x+agreement.w/2,1320,{captionOnly:true});
  annotate('projectVsInvestor',agreement.x+agreement.w/2,1380,{captionOnly:true});
 },wholeRoles,'participation');
 mark(8,3,()=>{
  tr.tag='open-conversation';
  tr.line(point(3300,1140));tr.line(point(3300,1320));tr.line(point(3435,1320));tr.line(point(3655,1320));
  annotate('start',4010,1320,{captionOnly:true});annotate('scope',4010,1380,{captionOnly:true});
 },wholeRoles,'participation');
 done(s);
 const all=tr.points.concat(annotations.map(a=>point(a.x,a.y))).reduce((b,p)=>({minX:Math.min(b.minX,p.x),minY:Math.min(b.minY,p.y),maxX:Math.max(b.maxX,p.x),maxY:Math.max(b.maxY,p.y)}),{minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity});
 const d='M'+tr.points[0].x+' '+tr.points[0].y+tr.points.slice(1).map(p=>' L'+p.x+' '+p.y).join('');
 return {version:VERSION,d,singleM:true,points:tr.points,segments:tr.segments,totalLength:tr.length,marks,scenes,annotations,labels:annotations,bounds:all,width:all.maxX-all.minX,height:all.maxY-all.minY,zones,places,project:{...projectBox,schematic:true,conditional:true},roles,agreement,mapCoverage:graph.coverage,cityFocus:city};
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
