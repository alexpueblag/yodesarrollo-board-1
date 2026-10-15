'use strict';
// Two HTTPS origins, real capture/composer/storage; all network effects are synthetic.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://yodesarrollomx.github.io',external='https://gaston-madrid-pintarron.sayri-fraijo.chatgpt.site';
const fixture=fs.readFileSync(path.join(__dirname,'brokers-pins-browser.cjs'),'utf8');
const base=vm.runInNewContext(fixture.slice(fixture.indexOf('const markup='),fixture.indexOf('const server='))+';html');
function html(site){let s=base.replace('<script src="/presentacion/atlas-pins.js">','<script src="/presentacion/pin-delivery.js"></script><script src="/presentacion/atlas-pins.js">');
 if(site)s=s.replaceAll('id="journey"','id="app-shell"').replaceAll('id="art"','id="board"').replaceAll('#journey','#app-shell').replaceAll('#art','#board')
  .replace('id="surface-menu"','id="index-dialog"').replaceAll('/presentacion/atlas-pins.js','/site-pins.js')
  .replace('<script src="/presentacion/vendor/html2canvas.min.js">','<script>window.__whiteboard={getState:()=>({chapter:0,stage:0,progress:3}),story:{version:"synthetic-review",base:"synthetic",chapters:[{id:"demo",short:"Demo",stages:[{title:"Synthetic stage"}]}]}};</script><script src="/presentacion/vendor/html2canvas.min.js">');
 return s;
}
async function records(p){return p.evaluate(()=>new Promise(ok=>{const q=indexedDB.open('yodChinche',1);q.onsuccess=()=>{const db=q.result,r=db.transaction('chinches').objectStore('chinches').getAll();r.onsuccess=()=>{ok(r.result);db.close();};};}));}
async function capture(p){await p.locator('#pin-button').click();await p.waitForFunction(()=>document.body.dataset.pinMode==='selecting');await p.touchscreen.tap(180,260);await p.locator('.chn-txt').waitFor();await p.locator('.chn-txt').fill('PRIVATE SYNTHETIC REVIEW');}
(async()=>{const results=[];for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const b=await type.launch({headless:true,...(process.env[engine.toUpperCase()+'_EXECUTABLE_PATH']?{executablePath:process.env[engine.toUpperCase()+'_EXECUTABLE_PATH']}:{})});try{for(const site of (process.env.SITE_PINS_PATH?[false,true]:[false])){
  console.log('DELIVERY_CASE '+engine+' '+site);const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await ctx.newPage(),rows=[],posts=[],errors=[],unknown=[];
  const missing=site;let login=!missing;
  await ctx.addInitScript(({origin,login})=>{if(location.origin===origin&&login)localStorage.setItem('pyod_clave_v1','SYNTHETIC-SESSION');},{origin,login});
  ctx.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));p.on('pageerror',e=>errors.push(e.message));
  await ctx.route('**/*',async r=>{const req=r.request(),u=new URL(req.url());if(['blob:','data:'].includes(u.protocol))return r.continue();
   if(u.pathname==='/sala-edicion/presentation-reviews.json')return r.fulfill({json:{contract:'sala-presentation-reviews-v1',privateProjection:true,receipt:'id-sha256'}});
   if(u.hostname==='script.google.com'){
    if(req.method()==='POST'){const body=JSON.parse(req.postData());assert.equal(body.clave,'SYNTHETIC-SESSION');rows.unshift(body);posts.push(body);return r.abort();} // Accepted POST, lost response.
    return r.fulfill({headers:{'Access-Control-Allow-Origin':'*'},json:{produccion:rows,cache:false}});
   }
   if((u.origin===origin&&u.pathname==='/yodesarrollo-board/presentacion/')||(u.origin===external&&u.pathname==='/'))return r.fulfill({contentType:'text/html',body:html(site)});
   let file;
   if(u.pathname==='/site-pins.js')file=process.env.SITE_PINS_PATH;
   else if(u.pathname.startsWith('/yodesarrollo-board/presentacion/'))file=path.join(root,'presentacion',u.pathname.split('/presentacion/')[1]);
   else if(u.pathname.startsWith('/presentacion/'))file=path.join(root,u.pathname.slice(1));
   if(file&&fs.existsSync(file))return r.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(file)});
   unknown.push(req.url());return r.abort();
  });
  p.setDefaultTimeout(12000);await p.goto(site?external+'/':origin+'/yodesarrollo-board/presentacion/');await capture(p);
  const popupPromise=site?p.waitForEvent('popup'):null;await p.locator('[data-ok]').click();const popup=popupPromise?await popupPromise:null;
  await p.locator('#pin-review[open]').waitFor();
  if(missing){await popup.locator('#auth:not([hidden])').waitFor();assert.equal(posts.length,0);assert.equal((await records(p))[0].delivery?.state,'auth-required');
   await popup.evaluate(()=>localStorage.setItem('pyod_clave_v1','SYNTHETIC-SESSION'));await popup.locator('#retry').click();}
  try{await p.waitForFunction(()=>document.querySelector('[data-delivery]')?.textContent.startsWith('Recibida en Sala'),null,{timeout:12000});}catch(e){console.log(JSON.stringify({engine,site,posts:posts.length,rows:rows.length,status:await p.locator('#pin-review-content').innerText(),records:await records(p),errors,unknown}));throw e;}
  const saved=(await records(p))[0],detail=JSON.parse(posts[0].detalle);assert.equal(posts.length,1);assert.equal(saved.delivery.state,'received');assert.equal(detail.id,saved.id);assert.equal(detail.objeto.huella,saved.delivery.hash);
  assert.equal(detail.objeto.revision.comment,'PRIVATE SYNTHETIC REVIEW');assert.ok(Buffer.from(detail.objeto.revision.capture.data,'base64').length>500);assert.equal(detail.kind,'yod-presentation-private-v1');
  if(site)assert.equal(await p.evaluate(()=>localStorage.getItem('pyod_clave_v1')),null,'No session credential is copied to the external origin');
  await p.locator('#pin-review-close').click();await p.waitForFunction(()=>!document.body.classList.contains('pin-review-mode'));await p.reload();await p.waitForFunction(()=>document.body.dataset.pinMode==='idle');
  assert.equal((await records(p))[0].delivery.state,'received');assert.equal(posts.length,1,'Reload must not append again');assert.deepEqual(errors,[]);assert.deepEqual(unknown,[]);
  results.push({engine,site,realCapture:true,privateSessionConfined:true,lostAckRecovered:true,reloaded:true,posts:posts.length});await ctx.close();
 }}finally{await b.close();}}
 console.log('DELIVERY_RESULT '+JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
