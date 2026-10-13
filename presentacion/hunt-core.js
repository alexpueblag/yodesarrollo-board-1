(function(root){
'use strict';
function clamp(v,a=0,b=1){v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):a;}
function smooth(a,b,p){const t=clamp((p-a)/(b-a));return t*t*(3-2*t);}
function stage(p){return Math.min(7,Math.floor(clamp(p)*8));}
function caseValue(v){if(typeof v==='string')v=JSON.parse(v);if(!v||typeof v!=='object')throw Error('Caso inválido.');for(const k of ['units','land','build','sale'])if(!Number.isInteger(v[k])||v[k]<0||v[k]>12)throw Error('Símbolos inválidos.');if(v.units<1||v.units>8)throw Error('Viviendas inválidas.');return {...v,cost:v.land+v.build,balance:v.sale-v.land-v.build};}
function normalize(input){const raw=input?.textos||input;if(!raw?.hunt_version)return null;const c={};for(const[k,v]of Object.entries(raw))if(k.startsWith('hunt_'))c[k.slice(5)]=String(v??'').trim();if(c.version!=='1')throw Error('Apertura inválida.');
 for(const k of ['city_name','kicker','title','play_label','pause_label','repeat_label','compare_label','continue_label','map_note','blocks_note','symbol_note','contribution_note','cost_label','land_label','build_label','units_label','sale_label','balance_label','caseA_label','caseB_label','caseA_land_label','caseB_land_label','source_label','source_url','zoning_label','zoning_url'])if(!c[k])throw Error('Falta hunt_'+k);
 if(!/^#[0-9a-f]{6}$/i.test(c.orange))throw Error('Color inválido.');for(const k of ['source_url','zoning_url'])if(!/^https:\/\/[^\s]+$/.test(c[k]))throw Error('Fuente inválida.');
 c.stages=Array.from({length:8},(_,i)=>{const s={};for(const k of ['label','title','body','nav']){s[k]=c['phase'+(i+1)+'_'+k];if(!s[k])throw Error('Momento incompleto.');}return s;});
 c.caseA=caseValue(c.caseA);c.caseB=caseValue(c.caseB);
 c.map=JSON.parse(c.map_geometry);const streets=JSON.parse(c.street_geometry);
 if(!c.map||!Number.isFinite(c.map.width)||!Number.isFinite(c.map.height)||c.map.width<100||c.map.width>3000||c.map.height<100||c.map.height>3000||!Array.isArray(c.map.focus)||c.map.focus.length!==2||c.map.focus.some(x=>!Number.isFinite(x)))throw Error('Mapa inválido.');
 const validateRoads=roads=>{if(!Array.isArray(roads)||roads.length<1||roads.length>2500)throw Error('Vías inválidas.');return roads.map(r=>{if(Array.isArray(r))r={name:r[0],kind:r[1],d:r[2],label:r[3]};if(typeof r.d!=='string'||r.d.length>6000||!/^[ML0-9.\s-]+$/.test(r.d))throw Error('Trazado inseguro.');return {d:r.d,name:String(r.name||'').slice(0,100),kind:String(r.kind||'').slice(0,30),label:Array.isArray(r.label)&&r.label.length===2&&r.label.every(Number.isFinite)?r.label:null};});};
 c.map.roads=validateRoads(c.map.roads);c.map.streets=validateRoads(streets);if(!c.map.attribution)throw Error('Falta atribución.');
 c.duration=clamp(Number(c.duration_seconds)||54,20,100)*1000;c.screens=clamp(Number(c.scroll_screens)||8,4,12);return c;
}
function camera(map,p){const t=smooth(.02,.48,p),z=1+smooth(.07,.5,p)*5,cx=map.width/2+(map.focus[0]-map.width/2)*t,cy=map.height/2+(map.focus[1]-map.height/2)*t;return {zoom:z,x:500-cx*z,y:325-cy*z};}
const api={clamp,smooth,stage,caseValue,normalize,camera};if(typeof module!=='undefined')module.exports=api;root.YodHuntCore=api;
})(typeof window==='undefined'?globalThis:window);
