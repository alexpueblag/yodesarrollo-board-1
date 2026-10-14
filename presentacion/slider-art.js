(function(root){'use strict';
const NS='http://www.w3.org/2000/svg',clamp=(x)=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const shape=(tag,attrs={},children=[])=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);for(const c of children)n.append(c);return n;};
const path=(d,cls='ink',extra={})=>shape('path',{d,class:cls,...extra});
const group=(id,children=[])=>shape('g',{'data-object':id},children);
const rect=(x,y,w,h,cls='ink wash',r=6)=>shape('rect',{x,y,width:w,height:h,rx:r,class:cls});
const circle=(cx,cy,r,cls='ink wash')=>shape('circle',{cx,cy,r,class:cls});
const txt=(x,y,value,cls='')=>{const n=shape('text',{x,y,class:cls});n.textContent=value;return n;};
const arrow=(x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;return path('M'+x1+' '+y1+' L'+x2+' '+y2+' M'+(x2-ux*12-uy*6)+' '+(y2-uy*12+ux*6)+' L'+x2+' '+y2+' L'+(x2-ux*12+uy*6)+' '+(y2-uy*12-ux*6),'ink accent');};
function parcel(id){const g=group(id),land=path('M-120 35 L0 90 L145 20 L25-35 Z','ink wash');g.append(land);
const footprint=path('M-75 20 L0 54 L100 6 L25-27 Z','ink accent active-fill');
const house=group(id+'-existing',[path('M-60 15 L-60-38 L10-4 L10 48 M10-4 L75-35 L75 16 M-77-45 L-30-93 L90-43 L10-4 Z','ink wash'),path('M-38 25 L-38-5 L-16 5 L-16 36','ink')]);
const building=group(id+'-project');for(let f=0;f<2;f++){const y=18-f*53;building.append(group(id+'-floor'+f,[path('M-75 '+y+' L0 '+(y+34)+' L100 '+(y-14)+' L100 '+(y-67)+' L25 '+(y-101)+' L-75 '+(y-53)+' Z','ink wash'),path('M-75 '+(y-53)+' L0 '+(y-19)+' L100 '+(y-67)+' M0 '+(y-19)+' L0 '+(y+34),'ink'),path('M-53 '+(y-27)+' L-53 '+(y-4)+' L-33 '+(y+5)+' L-33 '+(y-18)+' Z M24 '+(y-20)+' L24 '+(y+3)+' L45 '+(y-7)+' L45 '+(y-30)+' Z M64 '+(y-40)+' L64 '+(y-17)+' L85 '+(y-27)+' L85 '+(y-50)+' Z','ink accent') ]));}
const access=path('M-92 48 L-59 33 L-30 47 L-65 62','ink accent');
g.append(footprint,house,building,access);return{g,footprint,house,building,access};}
function mount(svg){
const city=group('territory',[path('M126 100 Q250 28 390 80 L488 139 Q548 239 455 312 L263 359 Q134 345 94 250 Z','ink ghost soft'),
path('M97 224 L512 145 M191 65 L324 359 M153 315 L419 81 M112 264 L476 215','ink ghost')]);
const zones=group('zones');[[225,165,'A'],[370,205,'B'],[282,286,'C']].forEach(([x,y,t])=>{zones.append(circle(x,y,38,'ink accent active-fill'),txt(x,y+10,t,'accent-text'));});city.append(zones);
const streets=group('block',[path('M36 143 L586 143 M36 334 L586 334 M317 70 L317 375','ink ghost'),path('M38 157 L585 157 M38 348 L585 348','ink ghost',{'stroke-dasharray':'8 12'})]);
const main=parcel('property-p1'),second=parcel('property-p2');
const product=group('program',[path('M140 340 L498 340 M140 328 L140 352 M498 328 L498 352','ink accent'),path('M515 312 L559 291 L559 151','ink ghost')]);
const ledger=group('project-account'),ledgerLabels=[],ledgerOps=[txt(224,290,'+','accent-text'),txt(414,290,'+','accent-text')];const boxCenters=[130,320,510];boxCenters.forEach((x,i)=>{const t=txt(x,286,'');t.style.fontSize='25px';ledgerLabels.push(t);ledger.append(rect(x-78,228,156,95,'ink '+(i===2?'accent active-fill':'wash')),t);});ledgerOps.forEach(n=>ledger.append(n));
const ledgerTop=group('account-inputs',[path('M156 110 L156 180 L510 180 L510 218','ink accent'),path('M320 180 L320 218','ink ghost'),path('M130 180 L130 218','ink ghost')]);ledger.append(ledgerTop);
const review=group('review',[rect(98,66,138,94),rect(405,66,138,94),rect(251,302,138,72),path('M232 160 L274 193 M405 160 L365 193 M320 280 L320 299','ink accent')]);
review.append(path('M124 92 L203 92 M124 115 L185 115 M431 92 L510 92 M431 115 L492 115 M276 329 L366 329 M276 351 L344 351','ink ghost'));
const participants=group('participants',[circle(113,195,40),circle(527,195,40),circle(320,347,33),arrow(157,196,213,212),arrow(483,196,427,212),arrow(320,312,320,284)]);
participants.append(path('M100 195 L113 183 L127 195 L127 212 L100 212 Z M511 193 Q527 178 543 193 Q527 209 511 193 M527 177 L527 212 M308 351 L320 333 L332 351','ink accent'));
const timeline=group('execution-controls',[path('M115 353 L525 353','ink ghost'),circle(135,353,9,'ink accent wash'),circle(320,353,9,'ink accent wash'),circle(505,353,9,'ink accent wash')]);
const flow=group('recovery-flow',[arrow(320,170,320,209),rect(229,216,182,64,'ink accent active-fill'),arrow(320,282,320,309),path('M141 327 L141 310 L499 310 L499 327','ink accent'),rect(57,330,170,63),rect(414,330,170,63)]);
const reviewLabels=[txt(166,53,''),txt(474,53,''),txt(320,408,'')],partyLabels=[txt(113,136,''),txt(527,136,''),txt(320,405,'')];reviewLabels.forEach(n=>review.append(n));partyLabels.forEach(n=>participants.append(n));
const titleNodes=[txt(320,257,''),txt(142,369,''),txt(499,369,'')];titleNodes.forEach(n=>flow.append(n));
const badges=group('badges',[txt(165,380,'P1'),txt(466,380,'P2')]);
svg.append(city,streets,second.g,main.g,product,ledger,review,participants,timeline,flow,badges);
const aux=[city,streets,product,ledger,review,participants,timeline,flow,badges];
function layout(i){const s=Math.floor(i/3),j=i%3;const mainPositions=[[320,274,1.2],[318,246,.28],[184,262,.79],[320,270,1.13],[110,166,.40],[320,245,.65],[320,250,.72],[320,272,1.08],[320,134,.43]];
const [x,y,z]=mainPositions[s];return{x,y,z,second:s===2?1:0,secondBuilding:s===2&&j===2?.2:0,house:s===0?1-j/2:s===1||s===2?1:0,building:s===0?j/2:s===1||s===2?0:s===3?j/2:1,foot:s===3?1:0,access:s===3?1:0,city:s===1?1:0,streets:s===2?1:0,product:s===3&&j===2?1:0,ledger:s===4?1:0,review:s===5?1:0,participants:s===6?1:0,timeline:s===7?1:0,flow:s===8?1:0,badges:s===2?1:0};}
function draw(p,reduced=false){p=Math.max(0,Math.min(26,p));const a=Math.floor(p),b=Math.min(26,a+1),t=reduced?0:smooth(p-a),l=layout(a),r=layout(b),v={};for(const k of Object.keys(l))v[k]=mix(l[k],r[k],t);
main.g.setAttribute('transform','translate('+v.x+' '+v.y+') scale('+v.z+')');main.house.style.opacity=v.house;main.building.style.opacity=v.building;main.footprint.style.opacity=v.foot;main.access.style.opacity=v.access;
second.g.setAttribute('transform','translate(464 262) scale(.79)');second.g.style.opacity=v.second;second.house.style.opacity=1;second.building.style.opacity=0;second.footprint.style.opacity=0;second.access.style.opacity=0;
const vals=[v.city,v.streets,v.product,v.ledger,v.review,v.participants,v.timeline,v.flow,v.badges];aux.forEach((g,i)=>g.style.opacity=vals[i]);ledgerOps[0].textContent=a===13?'−':a===14?'↓':'+';ledgerOps[1].textContent=a===13?'=':a===14?'↑':'+';svg.dataset.frame=p.toFixed(3);
}
return{draw,labels(values,diagrams){titleNodes.forEach((n,i)=>n.textContent=values[i]);ledgerLabels.forEach((n,i)=>n.textContent=values[i]);reviewLabels.forEach((n,i)=>n.textContent=diagrams?.review?.[i]||'');partyLabels.forEach((n,i)=>n.textContent=diagrams?.participants?.[i]||'');}};
}
root.YodSliderArt={mount};
})(window);
