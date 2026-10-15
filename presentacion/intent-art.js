(function(root){'use strict';
const NS='http://www.w3.org/2000/svg',clamp=v=>Math.max(0,Math.min(1,v)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(svg,overlay,map){
overlay.replaceChildren();svg.setAttribute('viewBox','0 0 640 440');let cfg=null,current='',group=null,words=[],step=null,propertyNode=null,mapNode=null;
const text=(x,y,t,cls='label')=>'<text x="'+x+'" y="'+y+'" class="intent-'+cls+'">'+String(t||'').split('|').map((s,i)=>'<tspan x="'+x+'" dy="'+(i?30:0)+'">'+esc(s)+'</tspan>').join('')+'</text>';
const wrap=(s,n=22)=>{const out=[];let row='';for(const w of String(s||'').split(' ')){if(row.length+w.length+1>n&&row){out.push(row);row=w;}else row+=(row?' ':'')+w;}out.push(row);return out.join('|');};
const line=(d,cls='')=>'<path class="intent-line '+cls+'" d="'+d+'"/>';
const box=(x,y,w,h,cls='')=>'<rect class="intent-box '+cls+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9"/>';
const land=(x=190,y=95,w=260,h=265)=>'<g data-object="property-p1">'+box(x,y,w,h,'intent-land')+line('M'+(x-12)+' '+(y+h+20)+'H'+(x+w+12),'intent-street')+'</g>';
const house=(x=220,y=125,scale=1,levels=1)=>{const h=levels>1?100:65;return '<g data-object="property-p1" transform="translate('+x+' '+y+') scale('+scale+')">'+line('M0 150L100 192L205 140L105 98Z','intent-land')+'<g class="intent-building">'+line('M30 130L105 161L175 127V'+(127-h)+'L100 '+(97-h)+'L30 '+(130-h)+'Z','intent-fill')+line('M30 '+(130-h)+'L105 '+(161-h)+'L175 '+(127-h)+'M105 '+(161-h)+'V161','intent-accent')+line('M48 '+(143-h)+'V'+(163-h)+'M72 '+(153-h)+'V'+(173-h)+'M125 '+(156-h)+'V'+(176-h)+'M148 '+(145-h)+'V'+(165-h),'intent-muted')+(levels>1?line('M30 83L105 114L175 80','intent-muted'):'')+'</g></g>';};
const caption=(i,x,y,n=22)=>text(x,y,wrap(words[i],n));
const rows=(ids)=>ids.map((i,k)=>box(100,55+k*88,440,66)+caption(i,320,96+k*88,30)).join('');
function diagram(type){
switch(type){
case 'resources': return [0,1,2].map((i)=>box(70,42+i*117,500,91,i===1?'intent-emphasis':'')+text(110,97+i*117,String(i+1).padStart(2,'0'),'number')+text(340,78+i*117,words[i])+text(340,110+i*117,words[i+3],'small')).join('');
case 'outcome':return house(68,60,.9)+house(368,60,.9,2)+line('M294 164H342M332 156L342 164L332 172','intent-accent')+caption(0,164,292)+caption(1,460,292)+box(160,340,320,62,'intent-emphasis')+caption(3,320,380);
case 'city':case 'zones':return map?'<g data-object="map-camera" transform="translate(26 22) scale(.59 .51)">'+map.roads.map(r=>'<path class="road '+(r[1]==='primary'||r[1]==='trunk'?'major':'')+'" d="'+r[2]+'"/>').join('')+'</g>'+(type==='zones'?[[210,140],[410,200],[290,300]].map((a,i)=>'<circle class="intent-zone" cx="'+a[0]+'" cy="'+a[1]+'" r="53"/>'+text(a[0],a[1]+9,words[i],'zone')).join(''):text(320,400,words[0])):text(320,220,'Cartografía no disponible','small');
case 'market':return [0,1,2,3].map((i)=>{const x=i%2?330:60,y=i<2?65:230;return box(x,y,250,140)+text(x+125,y+49,String(i+1).padStart(2,'0'),'number')+caption(i,x+125,y+91,19);}).join('');
case 'selection':return '<g class="intent-neighborhood">'+[0,1,2,3,4,5].map(i=>box(85+(i%3)*165,65+Math.floor(i/3)*145,140,120,i===4?'intent-emphasis':'')).join('')+line('M60 201H580M60 350H580','intent-street')+'</g>'+ '<g data-object="property-p1">'+box(250,210,140,120,'intent-selected')+'<g class="selection-arrival" opacity="0">'+box(255,150,130,132,'intent-fill')+line('M178 380H462','intent-street')+'</g></g>'+caption(1,320,421);
case 'survey':return land()+box(255,150,130,132,'intent-fill')+caption(1,320,208,14)+caption(0,320,62)+caption(2,320,421);
case 'plan':return land()+box(205,110,65,235,'intent-common')+box(280,110,155,235,'intent-emphasis')+text(237,220,wrap(words[0],7),'small')+text(356,210,wrap(words[1],12))+caption(2,320,421);
case 'capacity':return house(240,3,.76,2)+[0,1,2].map(i=>box(80,220+i*66,480,54)+caption(i,320,256+i*66)).join('');
case 'tenure':return [0,1].map(i=>box(50+i*280,65,260,300)+house(77+i*280,70,.85)+caption(i,180+i*280,291)+text(180+i*280,329,wrap(words[i+2],20),'small')).join('');
case 'cost':return [0,1,2].map((i)=>box(100,30+i*80,440,60)+caption(i,320,69+i*80)).join('')+line('M100 283H540','intent-accent')+box(100,305,440,85,'intent-emphasis')+caption(3,320,356);
case 'margin':return box(90,48,460,82)+caption(0,320,99)+text(320,172,'−','operator')+box(90,192,460,82)+caption(1,320,243)+text(320,315,'=','operator')+box(90,338,460,82,'intent-emphasis')+caption(2,320,389);
case 'sensitivity':return [0,1,2].map(i=>box(65,38+i*127,510,105)+text(200,80+i*127,words[i])+text(200,115+i*127,words[i+3],'small')+line('M365 '+(113+i*127)+'H530','intent-muted')+(i===2?line('M365 '+(88+i*127)+'H540M530 '+(80+i*127)+'L540 '+(88+i*127)+'L530 '+(96+i*127),'intent-accent'):line('M365 '+(i===0?63:107+i*127)+'L530 '+(i===0?105:63+i*127),'intent-accent'))).join('');
case 'checks':return rows([0,1,2])+text(320,377,wrap(words[3],35),'small');
case 'roles':return [0,1,2].map(i=>box(65,30+i*127,510,110,i===2?'intent-emphasis':'')+text(320,73+i*127,words[i])+text(320,107+i*127,wrap(words[i+3],34),'small')).join('');
case 'terms':return [0,1,2,3,4].map(i=>line('M100 '+(95+i*70)+'H540','intent-muted')+caption(i,320,78+i*70,32)).join('');
case 'design':return house(210,0,1.05,2)+[0,1,2].map(i=>box(70,227+i*64,500,52)+caption(i,320,262+i*64)).join('');
case 'build':return house(210,0,1.05,2)+[0,1,2].map(i=>text(320,300+i*48,words[i],'small')+line('M130 '+(310+i*48)+'H510','intent-muted')).join('');
case 'sale':return house(210,0,1.05,2)+[0,1,2].map(i=>box(80,220+i*66,480,54)+caption(i,320,256+i*66)).join('');
case 'cash':return box(115,10,410,72)+caption(0,320,56)+line('M320 88V105M314 99L320 105L326 99','intent-accent')+box(115,112,410,72)+caption(1,320,158)+line('M320 190V207M314 201L320 207L326 201','intent-accent')+box(70,214,500,216,'intent-emphasis')+text(320,250,words[2],'small')+caption(3,320,295)+caption(4,320,340,32)+caption(5,320,392);
case 'closing':return house(60,20,1.05,2)+[0,1,2].map(i=>caption(i,450,75+i*65,21)).join('');
default:return '';
}}
function rebuild(type){svg.setAttribute('viewBox',type==='closing'?'0 0 640 260':'0 0 640 440');svg.querySelector('[data-intent-stage]')?.remove();group=document.createElementNS(NS,'g');group.dataset.intentStage=type;group.dataset.object='responsive-stage';group.innerHTML=diagram(type);const candidate=group.querySelector('[data-object="property-p1"]');if(candidate){if(!propertyNode)propertyNode=candidate;else{propertyNode.innerHTML=candidate.innerHTML;propertyNode.setAttribute('transform',candidate.getAttribute('transform')||'');candidate.replaceWith(propertyNode);}}const mc=group.querySelector('[data-object="map-camera"]');if(mc){if(!mapNode)mapNode=mc;else{mc.replaceWith(mapNode);}}svg.append(group);current=type;svg.dataset.map=map?'real':'unavailable';}
return {configure(c){cfg=c;},labels(v,d,s,j){words=v;step=cfg.scenes[s].steps[j];rebuild(step.visual);},draw(p,reduced){if(!group)return;const f=p-Math.floor(p),a=reduced?1:1-Math.max(0,(f-.84)/.16)*.65;group.style.opacity=String(['selection','survey','design','build','sale','city','zones'].includes(current)?1:a);if(current==='selection'){const q=clamp((f-.40)/.60),t=q*q*(3-2*q),parcel=propertyNode.querySelector('rect');for(const [key,from,to]of [['x',250,190],['y',210,95],['width',140,260],['height',120,265]])parcel.setAttribute(key,from+(to-from)*t);group.querySelector('.intent-neighborhood').style.opacity=String(1-t);group.querySelector('.selection-arrival').style.opacity=String(t);}const building=group.querySelector('.intent-building');if(building&&current==='build'){const t=reduced?1:clamp(f*2);building.style.opacity=String(.65+.35*t);building.setAttribute('transform','translate(0 '+((1-t)*12).toFixed(2)+')');}const camera=group.querySelector('[data-object="map-camera"]');if(camera&&map){const z=current==='zones'?1.12+f*.12:1+f*.10;camera.setAttribute('transform','translate('+(320-map.focus[0]*.59*z)+' '+(200-map.focus[1]*.51*z)+') scale('+(.59*z)+' '+(.51*z)+')');}svg.dataset.frame=p.toFixed(3);}};
}
root.YodSliderArt={mount};
})(window);
