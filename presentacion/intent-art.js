(function(root){'use strict';
function mount(svg,overlay,map){
 const NS='http://www.w3.org/2000/svg',M=root.YodFilmMotion;
 let cfg,words=[],group,refs={},current='city',last=-1;
 const el=(tag,attrs={},parent=group)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent?.append(n);return n;};
 const path=(c,parent=group)=>el('path',{class:'film-line '+c},parent);
 const set=(n,k,v)=>n?.setAttribute(k,String(v));
 const opacity=(n,v)=>{set(n,'opacity',v.toFixed(4));set(n,'visibility',v<.001?'hidden':'visible');};
 const D=(pts,close=true)=>pts.map((a,i)=>(i?'L':'M')+a.map(v=>v.toFixed(3)).join(' ')).join(' ')+(close?'Z':'');
 const line=(n,pts,close=false)=>set(n,'d',D(pts,close));
 function build(){
  svg.querySelectorAll('[data-film-root],defs[data-film-defs]').forEach(n=>n.remove());overlay.replaceChildren();
  svg.setAttribute('viewBox','0 0 640 460');
  const defs=el('defs',{'data-film-defs':''},null);svg.append(defs);
  const clip=el('clipPath',{id:'film-map-clip'},defs);el('rect',{x:12,y:10,width:616,height:360,rx:5},clip);
  const hatch=el('pattern',{id:'film-hatch',width:9,height:9,patternUnits:'userSpaceOnUse',patternTransform:'rotate(35)'},defs);el('path',{d:'M0 0V9',stroke:'var(--accent)','stroke-opacity':'.25','stroke-width':1.2},hatch);
  group=el('g',{'data-film-root':'','data-intent-stage':'continuous','data-object':'responsive-stage'},null);svg.append(group);
  const mapWrap=el('g',{'clip-path':'url(#film-map-clip)'});refs.map=el('g',{'data-object':'city-context'},mapWrap);
  refs.camera=el('g',{'data-object':'map-camera'},refs.map);
  if(map)map.roads.forEach(r=>{const major=['primary','trunk','secondary'].includes(r[1]);el('path',{d:r[2],class:'film-road '+(major?'film-road-major':'')},refs.camera);});
  refs.zones=el('g',{},refs.map);refs.zoneRings=Array.from({length:3},(_,i)=>el('ellipse',{cx:[205,430,335][i],cy:[142,195,280][i],rx:[58,68,52][i],ry:[37,44,35][i],class:'film-zone'},refs.zones));
  refs.returnMap=el('g',{'clip-path':'url(#film-map-clip)'});if(map)el('g',{transform:'translate(18 15) scale(.60 .48)'},refs.returnMap).innerHTML=map.roads.filter(r=>['primary','trunk'].includes(r[1])).map(r=>'<path class="film-road" d="'+r[2]+'"/>').join('');
  refs.block=el('g',{'data-object':'illustrative-block'});refs.neighbors=[];
  for(const [x,y,w,h]of [[35,58,105,94],[35,173,105,126],[500,55,103,99],[500,178,103,121],[173,16,124,25],[328,16,135,25]])refs.neighbors.push(el('rect',{x,y,width:w,height:h,class:'film-neighbor'},refs.block));
  refs.street=path('film-street');refs.thread=path('film-thread');
  refs.dossier=path('film-dossier');
  refs.hero=el('g',{'data-object':'property-p1'});
  refs.ground=path('film-ground',refs.hero);refs.front=path('film-front',refs.hero);
  refs.existing=el('g',{'data-object':'existing-house'},refs.hero);refs.oldWall=path('film-wall',refs.existing);refs.oldSide=path('film-side',refs.existing);refs.oldRoof=path('film-roof',refs.existing);refs.oldDoor=path('film-door',refs.existing);
  refs.plan=el('g',{'data-object':'same-floorplan'},refs.hero);refs.floor=path('film-floor',refs.plan);refs.corridor=path('film-corridor',refs.plan);refs.dividers=path('film-partition',refs.plan);refs.planDoor=path('film-door',refs.plan);
  refs.proposed=el('g',{'data-object':'proposed-project'},refs.hero);refs.wall=path('film-wall',refs.proposed);refs.side=path('film-side',refs.proposed);refs.roof=path('film-roof',refs.proposed);refs.seam=path('film-seam',refs.proposed);refs.windows=path('film-windows',refs.proposed);
  refs.resources=path('film-capital',refs.hero);
  refs.entry=path('film-entry',refs.hero);
  refs.structure=path('film-structure',refs.hero);refs.buildLine=path('film-build-line',refs.hero);
  refs.alternative=el('g',{'data-object':'alternative-property'});refs.altGround=path('film-ground',refs.alternative);refs.altPlan=path('film-floor',refs.alternative);refs.altWall=path('film-proposal',refs.alternative);refs.altSide=path('film-proposal',refs.alternative);refs.altRoof=path('film-proposal',refs.alternative);refs.altSeam=path('film-partition',refs.alternative);
  refs.account=el('g',{'data-object':'entry-limit'});refs.accountRule=path('film-account-rule',refs.account);refs.equation=Array.from({length:4},(_,i)=>el('text',{x:385,y:99+i*53,class:'film-equation'+(i===3?' film-result':''),'text-anchor':'start'},refs.account));
  refs.tenure=el('g',{'data-object':'purchase-contribution'});refs.tenureLine=path('film-relation',refs.tenure);refs.tenureLeft=path('film-document',refs.tenure);refs.tenureRight=path('film-document',refs.tenure);
  refs.guide=path('film-direction');refs.conditions=el('g',{'data-object':'conditions'});refs.checkPaths=Array.from({length:3},()=>path('film-check',refs.conditions));
  refs.sale=el('g',{'data-object':'same-unit-to-sale'});refs.saleShape=path('film-sale-outline',refs.sale);refs.saleLines=path('film-sale-lines',refs.sale);
  refs.recovery=path('film-recovery');
  refs.words=Array.from({length:2},(_,i)=>el('text',{x:320,y:410+i*32,class:'film-label'+(i?' film-label-secondary':''),'text-anchor':'middle'}));
 }
 function draw(value,reduced){
  if(!cfg)return;const p=M.clamp(value,0,14),f=M.frame(p);
  // Every attribute depends only on position: reverse is the exact same film.
  // No stage replacement, random motion, CSS timer or frame-history dependency.
  const ramp=M.ramp,mix=M.mix,win=M.windowed;
  svg.dataset.frame=p.toFixed(3);svg.dataset.revision=cfg.surface?.revision||'journey-3';svg.dataset.map=map?'real':'unavailable';svg.dataset.continuity='single-property';
  opacity(refs.map,f.map);opacity(refs.zones,f.zones);opacity(refs.returnMap,f.cityReturn);
  if(map){const z=f.zoom;set(refs.camera,'transform','translate('+(320-map.focus[0]*z)+' '+(205-map.focus[1]*z*.80)+') scale('+z+' '+z*.80+')');}
  refs.zoneRings.forEach((n,i)=>{set(n,'stroke-dasharray',((.25+.75*ramp(p,1.25+i*.12,2.1+i*.12))*400)+' 500');});
  opacity(refs.block,f.block);
  const streetY=mix(228,354,ramp(p,1.2,3.1)),streetSpan=mix(80,540,ramp(p,0,2.9));
  line(refs.street,[[320-streetSpan/2,streetY],[320+streetSpan/2,streetY]]);
  opacity(refs.street,(.45+.55*ramp(p,1,3))*(1-ramp(p,4.7,5.4)));
  line(refs.thread,[[320-streetSpan/2,streetY],[320+streetSpan/2,streetY]]);
  opacity(refs.thread,win(p,.1,.65,3.25,4));
  opacity(refs.hero,f.hero);
  const tilt=f.tilt,scale=f.scale,cx=f.heroX,cy=f.heroY;
  const P=(u,v,z=0)=>[cx+scale*mix(u*1.12,(u-v)*1.03,tilt),cy+scale*(mix(v*1.1,(u+v)*.43,tilt)-z)];
  const plane=(n,u,v,w,d,z=0)=>line(n,[[u,v],[u+w,v],[u+w,v+d],[u,v+d]].map(a=>P(a[0],a[1],z)),true);
  const facade=(n,u,v,w,z,h)=>line(n,[P(u,v,z),P(u+w,v,z),P(u+w,v,z+h),P(u,v,z+h)],true);
  plane(refs.ground,-135,-100,270,200);
  line(refs.front,[P(-135,100),P(135,100)]);
  opacity(refs.front,.65+.35*f.plan);
  opacity(refs.existing,f.existing);
  const oldHeight=42*(1-ramp(p,3.5,4.4));
  facade(refs.oldWall,-100,65,170,0,oldHeight);
  line(refs.oldSide,[P(70,-65),P(70,65),P(70,65,oldHeight),P(70,-65,oldHeight)],true);
  plane(refs.oldRoof,-100,-65,170,130,42+f.roofLift*100);
  opacity(refs.oldRoof,f.roof);
  line(refs.oldDoor,[P(-65,65),P(-65,65,29),P(-40,65,29),P(-40,65)]);
  opacity(refs.plan,f.plan*(1-.80*f.finish));
  plane(refs.floor,-110,-70,220,140);
  plane(refs.corridor,-110,43,220,27);
  const division=mix(-27,-39,ramp(p,4.0,4.65));
  line(refs.dividers,[P(division,-70),P(division,43),P(39,43),P(39,-70)],false);
  line(refs.planDoor,[P(-88,70),P(-88,96),P(-71,96)]);
  const h=86*f.height;
  opacity(refs.proposed,f.proposal);
  const solid=f.finish;
  for(const n of [refs.wall,refs.side,refs.roof]){set(n,'fill-opacity',solid*.93);set(n,'stroke-dasharray',solid>.95?'none':'5 5');}
  facade(refs.wall,-110,70,220,0,h);
  line(refs.side,[P(110,-70),P(110,70),P(110,70,h),P(110,-70,h)],true);
  const explode=f.roles*46;
  plane(refs.roof,-110,-70,220,140,h+explode);
  line(refs.seam,[P(-38,70),P(-38,70,h),P(38,70,h),P(38,70)],false);
  let windowD='';
  for(const u of [-92,-16,60])windowD+=D([P(u,70,23),P(u+31,70,23),P(u+31,70,57),P(u,70,57)])+' ';
  set(refs.windows,'d',windowD);opacity(refs.windows,solid);
  plane(refs.resources,-127,-89,254,178,43+f.resources);opacity(refs.resources,f.roles*.75);
  line(refs.entry,[P(-85,100),P(-85,70),P(-64,70)]);
  opacity(refs.entry,f.plan);
  let sk='';
  for(const u of [-110,-38,38,110])sk+=D([P(u,-70),P(u,-70,h),P(u,70,h),P(u,70)],false)+' ';
  sk+=D([P(-110,-70,h),P(110,-70,h),P(110,70,h),P(-110,70,h)])+' ';
  set(refs.structure,'d',sk);opacity(refs.structure,win(p,10.2,10.65,11.4,11.8));
  const buildZ=h*(1-ramp(p,10.6,11.7));plane(refs.buildLine,-112,-72,224,144,buildZ);opacity(refs.buildLine,win(p,10.4,10.7,11.5,11.8));
  // The alternative shares a baseline and scale; it never replaces our property.
  const A=(u,v,z=0)=>[482+(u-v)*.72,238+(u+v)*.30-z*.70];
  const ap=(n,u,v,w,d,z=0)=>line(n,[[u,v],[u+w,v],[u+w,v+d],[u,v+d]].map(a=>A(a[0],a[1],z)),true);
  opacity(refs.alternative,f.compare);ap(refs.altGround,-105,-80,210,160);ap(refs.altPlan,-80,-55,160,110);
  line(refs.altWall,[A(-80,55),A(80,55),A(80,55,78),A(-80,55,78)],true);
  ap(refs.altRoof,-80,-55,160,110,78);line(refs.altSide,[A(80,-55),A(80,55),A(80,55,78),A(80,-55,78)],true);
  line(refs.altSeam,[A(0,-55),A(0,55),A(0,55,78)],false);
  opacity(refs.account,f.account);line(refs.accountRule,[[380,225],[602,225]]);refs.equation.forEach((n,i)=>n.textContent=cfg.surface.equation?.[i]||'');
  opacity(refs.tenure,f.tenure);line(refs.tenureLine,[[130,322],[130,341],[510,341],[510,322]]);
  line(refs.tenureLeft,[[102,286],[144,286],[158,300],[158,326],[102,326]],true);line(refs.tenureRight,[[482,286],[524,286],[538,300],[538,326],[482,326]],true);
  const relation=f.thread;line(refs.guide,[[89,282],[89,99],[320,99],[551,99],[551,282]]);
  opacity(refs.guide,relation);
  opacity(refs.conditions,f.checks);refs.checkPaths.forEach((n,i)=>{const x=170+i*150;line(n,[[x-13,337],[x-3,348],[x+18,323]]);});
  const sale=f.sale,t=ramp(p,11.75,12.85),unit=[P(38,70,0),P(110,70,0),P(110,70,h),P(38,70,h)],doc=[[466,126],[552,126],[552,248],[466,248]];
  line(refs.saleShape,unit.map((a,i)=>[mix(a[0],doc[i][0],t),mix(a[1],doc[i][1],t)]),true);
  let sd='';for(let i=0;i<3;i++)sd+=D([[481,162+i*23],[536-i*6,162+i*23]],false)+' ';set(refs.saleLines,'d',sd);
  opacity(refs.sale,sale);opacity(refs.saleLines,ramp(p,12.1,12.75));
  line(refs.recovery,[[510,258],[510,316],[379,316],[379,335]]);opacity(refs.recovery,win(p,12.15,12.6,13.0,13.45));
  line(refs.dossier,[[80,53],[526,53],[560,87],[560,359],[80,359]],true);opacity(refs.dossier,f.dossier*.65);
  // Labels occupy their own baseline, never overlap the architectural drawing.
  refs.words.forEach((n,i)=>{n.textContent=words[i]||'';set(n,'opacity',1);});
  last=p;
 }
 return{
  configure(c){cfg=c;refs={};build();},
  labels(v,d,s,j){words=v;current=cfg.scenes[s].steps[j].visual;group.dataset.visual=current;},
  draw,
  inspect:()=>({position:last,rootCount:svg.querySelectorAll('[data-film-root]').length,property:refs.hero,revision:cfg?.surface?.revision})
 };
}
root.YodSliderArt={mount};
})(window);
