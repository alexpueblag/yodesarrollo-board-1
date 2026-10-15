/* Architectural storytelling. Geometry is illustrative; all editorial labels come from Sheets. */
(function(root){'use strict';
const NS='http://www.w3.org/2000/svg',clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);},esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(svg,overlay,map){
 overlay.replaceChildren();let cfg,group,current='',words=[],cache=new Map;
 const path=(d,c='')=>'<path class="p-line '+c+'" d="'+d+'"/>';
 const rect=(x,y,w,h,c='',attrs='')=>'<rect class="p-line '+c+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" '+attrs+'/>';
 const txt=(x,y,t,c='',anchor='middle')=>'<text class="p-text '+c+'" x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+String(t||'').split('|').map((v,i)=>'<tspan x="'+x+'" dy="'+(i?31:0)+'">'+esc(v)+'</tspan>').join('')+'</text>';
 const wrap=(s,n=22)=>{let a=[],r='';for(const w of String(s||'').split(' ')){if(r&&r.length+w.length+1>n){a.push(r);r=w;}else r+=(r?' ':'')+w;}return [...a,r].join('|');};
 const label=(i,x,y,c='',n=24)=>txt(x,y,wrap(words[i],n),c);
 const P=(u,v,z=0)=>[320+(u-v)*1.02,265+(u+v)*.44-z];
 const D=(pts,close=true)=>pts.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(2)).join(' ')).join('')+(close?'Z':'');
 const plane=(u,v,w,d,z,c='')=>path(D([P(u,v,z),P(u+w,v,z),P(u+w,v+d,z),P(u,v+d,z)]),c);
 function volume(u,v,w,d,z=0,h=80,c=''){
  return '<g class="p-volume '+c+'">'+path(D([P(u,v+d,z),P(u+w,v+d,z),P(u+w,v+d,z+h),P(u,v+d,z+h)]),'p-wall')+path(D([P(u+w,v,z),P(u+w,v+d,z),P(u+w,v+d,z+h),P(u+w,v,z+h)]),'p-side')+plane(u,v,w,d,z+h,'p-roof')+'</g>';
 }
 const slab=()=>'<g data-object="property-p1">'+plane(-145,-100,290,200,0,'p-ground')+path(D([P(-165,122),P(165,122)],false),'p-street')+'</g>';
 function proposed(){return '<g class="p-proposed">'+volume(-110,-66,220,132,10,100)+[-36,38].map(u=>path(D([P(u,-66,110),P(u,66,110),P(u,66,10)],false),'p-seam')).join('')+[-80,-10,60].map(u=>path(D([P(u,66,35),P(u,66,78),P(u+23,66,78),P(u+23,66,35)],false),'p-opening')).join('')+'</g>';}
 function old(){return volume(-100,-62,125,124,0,46,'p-existing')+path(D([P(-68,62,0),P(-68,62,32),P(-43,62,32),P(-43,62,0)],false),'p-opening')+path(D([P(25,-33,13),P(25,4,13),P(25,4,31),P(25,-33,31)]),'p-opening');}
 const dimension=(x,y,w)=>path('M'+x+' '+y+'h'+w+'m-'+w+' -7v14m'+w+' -14v14','p-dim');
 function groundPlan(x,y,w,h,variant=0){
  const entry=variant?Math.round(w*.32):Math.round(w*.20);
  return rect(x,y,w,h,'p-paper p-strong')+rect(x,y,entry,h,'p-hatch')+
  path('M'+(x+entry)+' '+y+'v'+h+'M'+(x+entry)+' '+(y+h*.48)+'H'+(x+w),'p-strong')+
  path('M'+(x+entry+14)+' '+(y+h*.48)+'a26 26 0 0 0 26 -26M'+(x+entry+14)+' '+(y+h*.48)+'v-26','p-detail')+
  path('M'+(x+entry+14)+' '+(y+h-7)+'a26 26 0 0 0 26 -26','p-detail')+
  rect(x+w-52,y+15,35,h*.25,'p-furniture')+rect(x+entry+16,y+h*.63,Math.max(22,w-entry-36),30,'p-furniture');
 }
 const street=(y=369)=>path('M58 '+y+'H582','p-street');
 function mapMarkup(zones){
  if(!map)return txt(320,210,'Cartografía no disponible','p-small');
  return '<g clip-path="url(#potential-map)"><g data-object="map-camera">'+map.roads.map(r=>path(r[2],r[1]==='primary'||r[1]==='trunk'?'p-road-major':'p-road')).join('')+'</g></g>'+
   (zones?[[190,130],[435,184],[295,290]].map((a,i)=>'<g class="p-area" data-area="'+i+'"><ellipse cx="'+a[0]+'" cy="'+a[1]+'" rx="65" ry="48" class="p-line p-search"/><circle cx="'+a[0]+'" cy="'+a[1]+'" r="21" fill="var(--paper)"/>'+label(i,a[0],a[1]+9,'p-accent-text')+'</g>').join('')+label(3,320,419,'p-small'):
   '<g class="p-focus">'+path('M202 118v-18h28M410 100h28v18M438 286v18h-28M230 304h-28v-18','p-accent p-strong')+'</g>'+label(0,320,421,'p-city'));
 }
 function diagram(type){
  switch(type){
   case 'city':return mapMarkup(false);
   case 'zones':return mapMarkup(true);
   case 'outcome':return slab()+'<g class="p-old">'+old()+'</g><g class="p-future">'+proposed()+'</g>'+label(0,165,390,'p-small')+label(1,460,390,'p-small',22)+path('M77 410H250','p-detail')+path('M365 434H555','p-accent p-dashed');
   case 'market':return groundPlan(126,65,388,265)+'<g class="p-divider">'+path('M350 65V188','p-accent p-strong')+rect(369,85,110,67,'p-furniture')+'</g>'+dimension(126,40,388)+label(1,320,25,'p-small')+label(0,172,381,'p-small')+label(2,468,381,'p-small')+path('M290 369H350','p-accent')+label(3,320,430,'p-accent-text');
   case 'survey':return rect(163,40,314,292,'p-paper p-strong')+rect(238,81,185,178,'p-existing p-paper')+path('M238 173H423M326 81V173','p-detail')+'<rect class="p-circulation p-line p-hatch" x="163" y="40" width="60" height="292"/>'+path('M193 332V276M185 287L193 276L201 287','p-accent')+street(369)+dimension(163,352,314)+label(0,320,419)+label(1,330,124,'p-small',14)+label(2,80,217,'p-small',12)+path('M130 225H160','p-detail');
   case 'plan':return groundPlan(87,70,190,270,1)+groundPlan(363,135,190,205,0)+street(369)+label(0,182,35)+label(1,458,35)+rect(98,402,16,16,'p-hatch')+label(2,218,418,'p-small')+rect(350,402,16,16,'p-tint')+label(3,471,418,'p-small')+'<g class="p-plan-highlight">'+rect(149,76,121,123,'p-tint')+rect(407,141,139,91,'p-tint')+'</g>';
   case 'cost':return '<g class="p-equation">'+
    ['','−','−','='].map((op,i)=>txt(90,76+i*98,op,'p-operator')+txt(134,76+i*98,wrap(words[i],26),i===3?'p-accent-text p-result':'','start')).join('')+
    path('M80 314H560','p-accent')+'<path class="p-line p-accent p-bracket" d="M576 54v245h-17"/>'+'</g>';
   case 'sensitivity':return [0,1,2].map((i)=>'<g class="p-condition" data-condition="'+i+'">'+label(i,165,95+i*89,'',19)+path('M335 '+(85+i*89)+'h160','p-detail')+(i===0?path('M355 69L475 99M463 88L475 99L461 102','p-accent'):i===1?path('M355 190L475 158M461 155L475 158L465 171','p-accent'):path('M355 263H475M463 254L475 263L463 272','p-accent'))+'</g>').join('')+path('M70 330H570','p-detail')+label(3,320,392,'p-accent-text');
   case 'tenure':return '<g transform="translate(-21 70) scale(.55)">'+slab()+old()+'</g><g transform="translate(309 70) scale(.55)">'+slab()+old()+'</g>'+
    label(0,155,53)+label(1,485,53)+path('M155 259v46m-7-10 7 10 7-10','p-accent')+'<path class="p-line p-accent p-owner-link" d="M485 259v46m-7-10 7 10 7-10"/>'+label(2,155,354,'p-small',20)+label(3,485,354,'p-small',20)+path('M320 55V395','p-detail p-dashed');
   case 'roles':return '<g class="p-resource-base">'+slab()+'</g><g class="p-resource-capital">'+plane(-130,-85,260,170,66,'p-hatch')+'</g><g class="p-resource-project">'+proposed()+'</g>'+label(0,105,344,'p-small')+label(1,570,205,'p-small')+label(2,320,32,'p-small')+label(3,320,428,'p-accent-text');
   case 'design':return slab()+'<g class="p-design-existing">'+old()+'</g><g class="p-design-project">'+proposed()+'</g>'+
    label(0,150,401,'p-small')+label(1,495,401,'p-small')+label(2,320,30,'p-accent-text');
   case 'build':return slab()+'<g class="p-structure">'+[-110,0,110].map(u=>path(D([P(u,-66,10),P(u,-66,110),P(u,66,110),P(u,66,10)],false),'p-detail')).join('')+plane(-110,-66,220,132,110,'p-detail')+'</g><g clip-path="url(#potential-build)">'+proposed()+'</g>'+
    [0,1,2].map((i)=>label(i,126+i*194,407,'p-small')+path('M'+(83+i*194)+' 427h86','p-detail')).join('');
   case 'cash':return '<g transform="translate(-55 0) scale(.77)">'+slab()+proposed()+'</g><g class="p-sale-unit">'+volume(60,-20,70,65,70,48)+'</g>'+
    label(0,175,334,'p-small',22)+label(1,500,195,'p-accent-text')+path('M500 215V275H390','p-accent')+
    path('M405 268L390 275L405 282','p-accent')+label(2,320,365,'p-small',40)+label(3,320,430,'p-tiny',55);
   case 'terms':return path('M78 30H534L562 58V427H78Z','p-detail')+path('M534 30V58H562','p-detail')+
    '<g transform="translate(42 -10) scale(.42)">'+slab()+proposed()+'</g>'+
    [0,1,2,3].map((i)=>path('M115 '+(205+i*61)+'h410','p-detail')+txt(115,187+i*61,wrap(words[i],28),'','start')).join('');
   case 'closing':return '<g transform="translate(20 -45) scale(.72)">'+slab()+proposed()+'</g>'+
    path('M465 85H575M563 77L575 85L563 93','p-accent')+label(2,497,148,'p-small',16);
   default:return '';
  }
 }
 function activate(type,key){
  if(group){group.style.display='none';group.removeAttribute('data-intent-stage');}
  let g=cache.get(key);
  if(!g){g=document.createElementNS(NS,'g');g.dataset.stageKey=type;g.dataset.object='responsive-stage';g.innerHTML=diagram(type);svg.append(g);cache.set(key,g);}
  group=g;group.style.display='';group.dataset.intentStage=type;current=type;
  svg.setAttribute('viewBox',type==='closing'?'0 0 640 245':'0 0 640 460');
  svg.dataset.map=map?'real':'unavailable';
 }
 const def=document.createElementNS(NS,'defs');
 def.innerHTML='<pattern id="potential-hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(35)"><path d="M0 0V9" stroke="var(--accent)" stroke-opacity=".32" stroke-width="2"/></pattern><clipPath id="potential-map"><rect x="30" y="12" width="580" height="360"/></clipPath><clipPath id="potential-build"><rect id="potential-build-mask" x="0" y="0" width="640" height="460"/></clipPath>';
 svg.append(def);
 const set=(sel,name,value)=>{const e=group?.querySelector(sel);if(e)e.setAttribute(name,String(value));};
 return {
  configure(c){cfg=c;cache.forEach(g=>g.remove());cache.clear();},
  labels(v,d,s,j){words=v;activate(cfg.scenes[s].steps[j].visual,s+':'+j);},
  draw(p,reduced){
   if(!group)return;const f=p-Math.floor(p),q=reduced?1:ease(f/.88);
   const camera=group.querySelector('[data-object="map-camera"]');
   if(camera&&map){const z=(current==='zones'?1.16:1)+q*.15;camera.setAttribute('transform','translate('+(320-map.focus[0]*.60*z)+' '+(208-map.focus[1]*.50*z)+') scale('+(.60*z)+' '+(.50*z)+')');}
   if(current==='city')set('.p-focus','transform','translate('+(320*(1-(1+.12*q)))+' '+(210*(1-(1+.12*q)))+') scale('+(1+.12*q)+')');
   if(current==='zones')group.querySelectorAll('.p-area').forEach((e,i)=>e.style.opacity=String(.45+.55*ease(q*2-i*.35)));
   if(current==='outcome'){set('.p-future','transform','translate(0 '+((1-q)*52)+')');set('.p-future','opacity',.20+.65*q);set('.p-old','opacity',1-.62*q);}
   if(current==='market')set('.p-divider','transform','translate('+(-55*q)+' 0)');
   if(current==='survey')set('.p-circulation','width',42+25*q);
   if(current==='plan')set('.p-plan-highlight','opacity',.14+.40*q);
   if(current==='cost')set('.p-bracket','stroke-dasharray',(245*q)+' 300');
   if(current==='sensitivity')group.querySelectorAll('.p-condition').forEach((e,i)=>e.style.opacity=String(.45+.55*ease(q*2-i*.35)));
   if(current==='tenure')set('.p-owner-link','d','M485 259v46m-7-10 7 10 7-10'+(q>.45?'M535 280Q575 223 530 195':''));
   if(current==='roles'){set('.p-resource-project','transform','translate(0 '+(-32+26*q)+')');set('.p-resource-capital','transform','translate(0 '+(12*q)+')');}
   if(current==='design'){set('.p-design-project','transform','translate(0 '+(-42+42*q)+')');set('.p-design-project','opacity',.35+.5*q);set('.p-design-existing','opacity',1-.75*q);}
   if(current==='build'){const m=svg.querySelector('#potential-build-mask');m.setAttribute('y',280-230*q);m.setAttribute('height',460);}
   if(current==='cash')set('.p-sale-unit','transform','translate('+(120+30*q)+' '+(-80-12*q)+') scale(.75)');
   svg.dataset.frame=p.toFixed(3);svg.dataset.revision=cfg.surface?.revision||'potential-2';
  }
 };
}
root.YodSliderArt={mount};
})(window);
