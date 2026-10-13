'use strict';
const fs=require('node:fs');
(async()=>{
 const url=fs.readFileSync('presentacion/source.js','utf8').match(/url:'([^']+)'/)[1],r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Editorial source unavailable');
 const raw=await r.json(),t=raw.textos||raw,bbox=JSON.parse(t.hunt_geo_bbox),local=JSON.parse(t.hunt_geo_local_bbox),focus=JSON.parse(t.hunt_geo_focus);
 for(const b of [bbox,local])if(!Array.isArray(b)||b.length!==4||b.some(v=>!Number.isFinite(v))||b[2]<=b[0]||b[3]<=b[1]||b[2]-b[0]>.5||b[3]-b[1]>.5)throw Error('Invalid public map bounds');
 const W=1000,H=700,[south,west,north,east]=bbox,project=(lat,lon)=>[(lon-west)/(east-west)*W,(north-lat)/(north-south)*H].map(v=>Math.round(v*10)/10);
 function dist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],v=dx*dx+dy*dy;if(!v)return Math.hypot(p[0]-a[0],p[1]-a[1]);const u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/v));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);}
 function simplify(p,tol=.45){if(p.length<3)return p;let max=tol,i=-1;for(let j=1;j<p.length-1;j++){const d=dist(p[j],p[0],p[p.length-1]);if(d>max){max=d;i=j;}}return i<0?[p[0],p[p.length-1]]:[...simplify(p.slice(0,i+1),tol).slice(0,-1),...simplify(p.slice(i),tol)];}
 async function get(b,types){const query='[out:json][timeout:35];way["highway"~"^('+types+')$"]('+b.join(',')+');out geom;';let last;
  for(const host of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter']){try{const response=await fetch(host,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json','User-Agent':'YoDesarrollo-Public-Map-Preview/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(55000)});if(!response.ok)throw Error('HTTP '+response.status+' '+(await response.text()).replace(/<[^>]+>/g,' ').slice(0,160));const data=await response.json();if(!data.elements?.length)throw Error('Empty roads');return {data,host};}catch(e){last=e;console.log('PUBLIC_MAP_SOURCE_RETRY '+host+' '+e.message);}}throw last;
 }
 function trace(elements){const roads=[];for(const e of elements){let part=[];const flush=()=>{if(part.length>1){const pts=simplify(part);roads.push({name:e.tags?.name||'',kind:e.tags?.highway||'road',d:pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(''),label:pts[Math.floor(pts.length/2)]});}part=[];};for(const g of e.geometry||[]){if(g.lat>=south&&g.lat<=north&&g.lon>=west&&g.lon<=east)part.push(project(g.lat,g.lon));else flush();}flush();}return roads;}
 const major=await get(bbox,'trunk|primary|secondary'),streets=await get(local,'residential|tertiary|unclassified|primary|secondary');
 const result={width:W,height:H,focus:project(focus[0],focus[1]),roads:trace(major.data.elements),streets:trace(streets.data.elements),attribution:'© OpenStreetMap contributors',source:'https://www.openstreetmap.org/copyright',checked_at:new Date().toISOString()};
 const text=JSON.stringify(result);if(result.roads.length<10||result.streets.length<10)throw Error('Insufficient map geometry');
 // Split for the Google Sheets cell limit. Only public, attributed road geometry enters these logs.
 const main=JSON.stringify({...result,streets:undefined}),detail=JSON.stringify(result.streets);if(main.length>49000||detail.length>49000)throw Error('Map exceeds editorial cell limit');
 for(const [name,value]of [['MAP',main],['STREETS',detail]])for(let i=0;i<value.length;i+=2000)console.log('PUBLIC_HUNT_'+name+' '+(i/2000)+' '+value.slice(i,i+2000));
 console.log(JSON.stringify({publicRoads:result.roads.length,publicStreets:result.streets.length,mapBytes:main.length,streetBytes:detail.length,businessWrites:0}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
