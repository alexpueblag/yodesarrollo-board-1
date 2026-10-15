'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch(),context=await browser.newContext();
 await context.route('**/*',r=>r.request().method()==='GET'?r.continue():r.abort());
 const p=await context.newPage();await p.goto('https://gaston-madrid-pintarron.sayri-fraijo.chatgpt.site',{waitUntil:'domcontentloaded',timeout:60000});
 const assets=await p.evaluate(()=>[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>({path:new URL(e.src||e.href,location.href).pathname,url:new URL(e.src||e.href,location.href).href})).filter(x=>new URL(x.url).origin===location.origin));
 console.log('REF_ASSETS '+JSON.stringify(assets.map(x=>x.path)));
 for(const a of assets.filter(x=>/pins|html2canvas/i.test(x.path))){
  const text=await p.evaluate(async u=>{const r=await fetch(u,{credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('Reference asset '+r.status);return r.text();},a.url);
  if(text.length>230000||/224[,.]?982|28178[,.]?318|47[,.]?453[,.]?000|NOI|FlujoRenta|A15_Resumen/i.test(text)){console.log('REF_SOURCE_SKIPPED '+JSON.stringify({path:a.path,length:text.length}));continue;}
  const clean=text.replace(/https?:\/\/[^'"\s<>]+/g,'<PUBLIC_URL>').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,'<EMAIL>').replace(/Gast[oó]n\s*Madrid|Eduardo\s*Coronel/gi,'REFERENCE');
  console.log('REF_GENERIC_SOURCE '+JSON.stringify({path:a.path,text:clean}));
 }
 for(const path of ['assets/caveat.woff2','assets/dm-regular.woff2','assets/dm-bold.woff2']){const base64=await p.evaluate(async path=>{const r=await fetch(path,{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Font read '+r.status);const bytes=new Uint8Array(await r.arrayBuffer());let text='';for(let i=0;i<bytes.length;i++)text+=String.fromCharCode(bytes[i]);return btoa(text);},path);console.log('REF_BINARY '+JSON.stringify({path,base64}));}
 console.log('REF_DONE '+JSON.stringify({readOnly:true,assets:assets.length}));await browser.close();
})().catch(e=>{console.error(e.name+': '+e.message);process.exit(1);});
