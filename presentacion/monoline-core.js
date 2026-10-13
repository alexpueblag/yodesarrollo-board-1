(function(root){
'use strict';
const VERSION='1';
const finite=n=>Number.isFinite(Number(n));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const round=n=>Math.round(n*1000)/1000;
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const point=(x,y)=>{if(!finite(x)||!finite(y))throw Error('Non-finite geometry');return {x:round(Number(x)),y:round(Number(y))};};
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};

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
Trace.prototype.loop=function(vertices){
 const origin=this.points[this.points.length-1];for(const p of vertices)this.line(p);this.line(origin);
};
Trace.prototype.retrace=function(fn){
 const start=this.points.length-1;fn();const route=this.points.slice(start);
 for(let i=route.length-2;i>=0;i--)this.line(route[i]);
};
Trace.prototype.box=function(b){
 this.loop([point(b.x,b.y+b.h/2),point(b.x,b.y),point(b.x+b.w,b.y),point(b.x+b.w,b.y+b.h),point(b.x,b.y+b.h),point(b.x,b.y+b.h/2)]);
};

function build(width,sourceMap){
 width=width===undefined?390:Number(width);
 if(!Number.isFinite(width)||width<280||width>1200)throw Error('Invalid canvas width');
 const W=round(width),ratio=W/390,H=round(460*ratio),cityH=round(400*ratio),firstH=round(cityH+H);
 const graph=sourceGraph(sourceMap),pad=20*ratio;
 const bx=graph.bounds,spanX=Math.max(bx.maxX-bx.minX,1),spanY=Math.max(bx.maxY-bx.minY,1);
 const scale=Math.min((W-pad*2)/spanX,(cityH-pad*2)/spanY);
 const dx=(W-spanX*scale)/2-bx.minX*scale,dy=(cityH-spanY*scale)/2-bx.minY*scale;
 const project=p=>point(dx+p.x*scale,dy+p.y*scale);
 const axis=round(W*.08),caseX=round(W*.22),caseW=round(W*.64),caseH=round(H*.178);
 const labels=[],scenes=[],marks=[],tr=new Trace(project(graph.tour[0]));
 const label=(key,x,y,extra={})=>labels.push({key,x:round(x),y:round(y),scene:tr.scene,beat:tr.beat,atLength:tr.length,...extra});
 const pair=base=>{
  const A={id:'A',mode:'purchase',x:caseX,y:round(base+H*.15),w:caseW,h:caseH};
  const B={id:'B',mode:'contribution',x:caseX,y:round(base+H*.53),w:caseW,h:caseH};
  for(const g of [A,B]){g.access=point(axis,g.y+g.h/2);g.account={x:caseX,y:round(g.y+g.h+H*.06),w:caseW,h:round(H*.12)};g.accountAnchor=point(axis,g.account.y+g.account.h/2);g.threshold=point((axis+caseX)/2,g.access.y);g.section={...g.account};}
  return {A,B};
 };
 const axisTo=y=>tr.line(point(axis,y));
 const outline=g=>{
  axisTo(g.access.y);tr.tag='plot-'+g.id;tr.box(g);
  label('case'+g.id,g.x+g.w/2,g.y-12*ratio,{identity:g.id});
 };
 const both=c=>{outline(c.A);outline(c.B);};
 const margin=(g,key,kind)=>{
  axisTo(g.access.y);tr.tag=kind+'-'+g.id;
  tr.retrace(()=>{axisTo(g.accountAnchor.y);tr.box(g.account);});
  label(key,g.account.x+g.account.w/2,g.account.y-7*ratio,{identity:g.id});
 };
 const survey=g=>{
  axisTo(g.access.y);tr.tag='physical-cota-'+g.id;
  tr.retrace(()=>{
   tr.line(point(axis,g.y-24*ratio));tr.line(point(g.x,g.y-24*ratio));
   tr.retrace(()=>tr.line(point(g.x,g.y-29*ratio)));
   tr.line(point(g.x+g.w,g.y-24*ratio));
   tr.retrace(()=>tr.line(point(g.x+g.w,g.y-29*ratio)));
  });
  label('area'+g.id,g.x+g.w/2,g.y-29*ratio,{identity:g.id});
 };
 const gate=g=>{
  axisTo(g.access.y);tr.tag='review-threshold-'+g.id;
  const x=g.threshold.x,h=36*ratio,w=14*ratio;
  tr.retrace(()=>tr.loop([point(x-w/2,g.access.y),point(x-w/2,g.access.y-h/2),point(x+w/2,g.access.y-h/2),point(x+w/2,g.access.y+h/2),point(x-w/2,g.access.y+h/2),point(x-w/2,g.access.y)]));
  label('legal'+g.id,g.x+g.w/2,g.y+g.h+12*ratio,{identity:g.id});
 };
 const plan=g=>{
  axisTo(g.access.y);tr.tag='conceptual-plan-'+g.id;
  tr.retrace(()=>{
   tr.line(point(g.x,g.access.y));
   tr.line(point(g.x+g.w*.45,g.access.y));
   tr.retrace(()=>tr.line(point(g.x+g.w*.45,g.y+g.h*.25)));
   tr.line(point(g.x+g.w*.72,g.access.y));
   tr.retrace(()=>tr.line(point(g.x+g.w*.72,g.y+g.h*.75)));
  });
  label('plan'+g.id,g.x+g.w/2,g.y+g.h+12*ratio,{identity:g.id});
 };
 const section=g=>{
  axisTo(g.access.y);tr.tag='external-section-'+g.id;
  tr.retrace(()=>{
   axisTo(g.accountAnchor.y);
   const b=g.section;tr.line(point(b.x,b.y+b.h));
   tr.loop([point(b.x,b.y+b.h),point(b.x,b.y+b.h*.4),point(b.x+b.w*.5,b.y),point(b.x+b.w,b.y+b.h*.4),point(b.x+b.w,b.y+b.h),point(b.x,b.y+b.h)]);
  });
  label('section'+g.id,g.section.x+g.section.w/2,g.section.y-7*ratio,{identity:g.id,schematic:true});
 };
 const beat=(scene,index,fn,focus)=>{
  tr.scene=scene;tr.beat=index;const start=tr.length,segmentStart=tr.segments.length;fn();
  if(tr.length===start)throw Error('Empty narrative beat');
  const m={scene,beat:index,index:scene*3+index,startLength:start,endLength:tr.length,segmentStart,segmentEnd:tr.segments.length,focus};
  marks.push(m);scenes[scene].beats.push(m);
 };
 const finish=(s,base,extras)=>{
  tr.tag='external-street-bridge';axisTo(base+H-12*ratio);
  if(s<6)axisTo(base+H+18*ratio);
  if(extras)extras();
 };
 for(let s=0;s<7;s++){
  const top=s===0?0:firstH+(s-1)*H,base=s===0?cityH:top,c=pair(base);
  const focus={x:0,y:base,width:W,height:H};
  const sc={index:s,top,height:s===0?firstH:H,startLength:tr.length,endLength:0,cases:c,focus,beats:[],anchors:{P0:s===0?project(graph.hub):point(axis,base+18*ratio),SA:c.A.access,SB:c.B.access,CA:c.A.accountAnchor,CB:c.B.accountAnchor,UA:c.A.threshold,UB:c.B.threshold,TA:point(c.A.section.x,c.A.section.y),TB:point(c.B.section.x,c.B.section.y)}};
  scenes.push(sc);
  if(s===0){
   beat(s,0,()=>{
    tr.tag='verified-city-road';for(const p of graph.tour.slice(1))tr.line(project(p));
    label('city',W/2,30*ratio,{source:true});
    for(const [name,p]of graph.names){const q=project(p);label('road',q.x,q.y-8*ratio,{text:name,source:true});}
   },{x:0,y:0,width:W,height:cityH});
   beat(s,1,()=>{
    tr.tag='city-focus-frame';const hub=project(graph.hub),fw=W*.26,fh=cityH*.18;
    tr.box({x:hub.x-fw/2,y:hub.y-fh/2,w:fw,h:fh});
    tr.tag='verified-city-exit';for(const p of graph.exitRoute.slice(1))tr.line(project(p));
   },{x:0,y:0,width:W,height:cityH});
   beat(s,2,()=>{
    tr.tag='territory-to-schematic-bridge';const end=tr.points[tr.points.length-1];
    tr.line(point(end.x,cityH+12*ratio));tr.line(point(axis,cityH+12*ratio));
    both(c);label('schematic',W/2,base+H-6*ratio);finish(s,base);
   },focus);
  }else if(s===1){
   beat(s,0,()=>{both(c);survey(c.A);},focus);
   beat(s,1,()=>{survey(c.B);margin(c.A,'contextA','market-context');},focus);
   beat(s,2,()=>{margin(c.B,'contextB','market-context');finish(s,base);},focus);
  }else if(s===2){
   beat(s,0,()=>{both(c);survey(c.A);survey(c.B);},focus);
   beat(s,1,()=>margin(c.A,'accountA','project-account'),focus);
   beat(s,2,()=>{margin(c.B,'accountB','project-account');finish(s,base);},focus);
  }else if(s===3){
   beat(s,0,()=>{both(c);gate(c.A);gate(c.B);},focus);
   beat(s,1,()=>{margin(c.A,'conditionsA','participation-conditions');margin(c.B,'conditionsB','participation-conditions');},focus);
   beat(s,2,()=>{tr.tag='conditional-formalization';axisTo(base+H-42*ratio);tr.retrace(()=>tr.line(point(W*.56,base+H-42*ratio)));label('formalize',W*.56,base+H-50*ratio,{conditional:true});finish(s,base);},focus);
  }else if(s===4){
   beat(s,0,()=>{both(c);plan(c.A);plan(c.B);},focus);
   beat(s,1,()=>{gate(c.A);gate(c.B);},focus);
   beat(s,2,()=>{section(c.A);section(c.B);finish(s,base);},focus);
  }else if(s===5){
   beat(s,0,()=>{both(c);gate(c.A);gate(c.B);},focus);
   beat(s,1,()=>{margin(c.A,'saleA','sale-and-collection');margin(c.B,'saleB','sale-and-collection');},focus);
   beat(s,2,()=>{
    tr.tag='return-to-agreement';axisTo(c.A.access.y);axisTo(c.B.access.y);
    label('agreementA',c.A.x+c.A.w/2,c.A.y+c.A.h+12*ratio,{identity:'A',referenceScene:3});
    label('agreementB',c.B.x+c.B.w/2,c.B.y+c.B.h+12*ratio,{identity:'B',referenceScene:3});
    finish(s,base);
   },focus);
  }else{
   beat(s,0,()=>both(c),focus);
   beat(s,1,()=>{tr.tag='return-to-common-intersection';axisTo(base+24*ratio);tr.retrace(()=>tr.line(point(W*.5,base+24*ratio)));label('conversation',W*.5,base+42*ratio);},focus);
   beat(s,2,()=>{
    tr.tag='open-conversation-frame';const left=caseX,right=caseX+caseW,fy=base+H-72*ratio;
    axisTo(fy);tr.line(point(left,fy));tr.line(point(left,fy-20*ratio));tr.line(point(right,fy-20*ratio));tr.line(point(right,fy+32*ratio));tr.line(point(W*.5,fy+32*ratio));
    sc.anchors.F=point(W*.5,fy+32*ratio);label('cta',W*.5,fy+12*ratio);
   },focus);
  }
  sc.endLength=tr.length;sc.startProgress=s/7;sc.endProgress=(s+1)/7;
 }
 const d='M'+tr.points[0].x+' '+tr.points[0].y+tr.points.slice(1).map(p=>' L'+p.x+' '+p.y).join('');
 return {version:VERSION,width:W,height:firstH+6*H,sceneHeight:H,d,points:tr.points,segments:tr.segments,totalLength:tr.length,scenes,marks,labels,identities:{A:{mode:'purchase'},B:{mode:'contribution'}},mapCoverage:graph.coverage};
}

function pointAtLength(layout,length){
 const segments=layout.segments;if(!segments.length)throw Error('Empty trace');
 length=clamp(length,0,layout.totalLength);let lo=0,hi=segments.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(segments[m].end<length)lo=m+1;else hi=m;}
 const s=segments[lo],t=s.length?clamp((length-s.start)/s.length):0;
 return {x:mix(s.from.x,s.to.x,t),y:mix(s.from.y,s.to.y,t),segment:lo};
}
function locate(layout,p){
 p=clamp(p);const global=p*21,index=Math.min(20,Math.floor(global)),mark=layout.marks[index],beatLocal=p===1?1:global-index;
 const length=mix(mark.startLength,mark.endLength,beatLocal),position=pointAtLength(layout,length);
 let focus={...mark.focus};const next=layout.marks[index+1];
 if(next){const t=ease(clamp((beatLocal-.7)/.3));focus={x:mix(focus.x,next.focus.x,t),y:mix(focus.y,next.focus.y,t),width:mix(focus.width,next.focus.width,t),height:mix(focus.height,next.focus.height,t)};}
 const padding=Math.min(focus.width,focus.height)*.05;
 if(position.y<focus.y+padding)focus.y=position.y-padding;
 if(position.y>focus.y+focus.height-padding)focus.y=position.y-focus.height+padding;
 if(position.x<focus.x+padding)focus.x=position.x-padding;
 if(position.x>focus.x+focus.width-padding)focus.x=position.x-focus.width+padding;
 return {p,scene:mark.scene,beat:mark.beat,local:p===1?1:p*7-mark.scene,beatLocal,length,point:position,viewBox:[focus.x,focus.y,focus.width,focus.height],focus,index};
}
function pointAt(layout,p){return locate(layout,p).point;}
function camera(layout,p){return locate(layout,p).viewBox;}
const api={VERSION,clamp,build,locate,pointAt,pointAtLength,camera,polylines};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.YodMonolineCore=api;
})(typeof window==='undefined'?globalThis:window);
