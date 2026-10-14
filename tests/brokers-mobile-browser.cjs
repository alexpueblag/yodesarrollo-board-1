'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{read}=require('./public-story-copy.cjs');
async function shot(p,name){const b=await p.screenshot({type:'jpeg',quality:65});fs.writeFileSync('mobile-'+name+'.jpg',b);b.toString('base64').match(/.{1,1600}/g).forEach((c,i)=>console.log('MOBILE_SCREEN_CHUNK '+name+' '+i+' '+c));}
(async()=>{
setTimeout(()=>{console.error('Mobile browser test deadline');process.exit(1);},240000).unref();
const payload=await read(fs.readFileSync('presentacion/source.js','utf8').match(/url:'([^']+)'/)[1]);
const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9-]+\.(html|css|js)$/.test(n)&&n!=='assets/logo_dark.png'){res.statusCode=404;return res.end();}try{res.setHeader('Content-Type',n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(n.startsWith('assets/')?n:path.join('presentacion',n)));}catch(e){res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
for(const [name,engine]of [['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await context.route('https://**/*',r=>{assert.equal(r.request().method(),'GET');return r.fulfill({contentType:'application/json',body:JSON.stringify(payload)});});
 await p.addInitScript(()=>{window.scrollTrace=[];window.scrollEvents=[];for(const target of [document,window])target.addEventListener('scroll',e=>scrollEvents.push({target:e.target.nodeName||'window',y:scrollY,time:performance.now()}),{capture:true});const fn=window.scrollTo;window.scrollTo=function(...args){const result=fn.apply(this,args);scrollTrace.push({args,y:scrollY,stack:new Error().stack});if(scrollTrace.length>12)scrollTrace.shift();return result;};});
 await p.bringToFront();await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.locator('#journey:not([hidden])').waitFor({timeout:65000});await p.screenshot();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
 try{
 for(const size of [{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){
  await p.setViewportSize(size);await p.waitForFunction(w=>YodSlider.api.mobile().width===w,size.width);await p.evaluate(()=>YodSlider.api.seek(0));await p.waitForTimeout(60);
  const geometry=await p.evaluate(()=>({m:YodSlider.api.mobile(),scroll:document.documentElement.scrollWidth,w:innerWidth}));assert.ok(geometry.m.active);assert.ok(geometry.scroll<=geometry.w+1);assert.ok(geometry.m.bounds[1]>=350,'Long reading travel');
  await p.evaluate(()=>scrollTo(0,YodSlider.api.mobile().bounds[1]*.45));await p.waitForFunction(()=>YodSlider.api.state().p>.4&&YodSlider.api.state().p<.5,{},{timeout:10000,polling:50});const halfway=await p.evaluate(()=>YodSlider.api.state().p);assert.ok(halfway>.4&&halfway<.5,'Native scroll controls fractional progression '+JSON.stringify(await p.evaluate(()=>({p:YodSlider.api.state().p,y:scrollY,m:YodSlider.api.mobile(),height:innerHeight,doc:document.documentElement.scrollHeight,ready:document.readyState,trace:window.scrollTrace,scrolling:document.scrollingElement?.tagName,overflow:getComputedStyle(document.documentElement).overflow,open:[...document.querySelectorAll('dialog[open]')].map(x=>x.id)}))));
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);assert.equal(await p.locator('#progress').inputValue(),'0');
  await p.evaluate(()=>YodSlider.api.seek(10.35));await p.waitForTimeout(80);assert.ok(Math.abs((await p.evaluate(()=>YodSlider.api.state().p))-10.35)<.01);
  const bb=await p.locator('#progress').boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height*.4);await p.mouse.down();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height*.64,{steps:8});await p.mouse.up();await p.waitForTimeout(100);const v=await p.evaluate(()=>YodSlider.api.state().p);assert.ok(v>14&&v<19,'Vertical slider goes forward downward');assert.ok(Math.abs(v-Math.round(v))>.001,'Release does not snap to a whole scene');
  await p.locator('#mobileIndex').tap();await p.locator('#mobileChapters nav button').nth(2).tap();await p.waitForTimeout(750);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),6);
  await p.locator('#next').tap();await p.waitForTimeout(750);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),7);
  await p.locator('#prev').tap();await p.waitForTimeout(750);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),6);
  const layout=await p.evaluate(()=>({font:parseFloat(getComputedStyle(document.querySelector('.mobile-body')).fontSize),buttons:[...document.querySelectorAll('.transport button')].map(n=>{const r=n.getBoundingClientRect();return[r.width,r.height,r.right,r.bottom];})}));assert.ok(layout.font>=16);assert.ok(layout.buttons.every(b=>b[0]>=44&&b[1]>=44&&b[2]<=size.width+1&&b[3]<=size.height+1));
  await p.evaluate(()=>YodSlider.api.seek(26));await p.locator('#actions').evaluate(e=>e.scrollIntoView({block:'end',behavior:'instant'}));await p.waitForTimeout(80);const actions=await p.locator('#actions').boundingBox(),dock=await p.locator('.dock').boundingBox();assert.ok(actions.y+actions.height<=dock.y+1,'Closing is reachable above safe controls');assert.ok(await p.locator('#actions a').isVisible());
  if(name==='webkit'&&size.width===390){await shot(p,'iphone-close');await p.evaluate(()=>YodSlider.api.seek(0));await shot(p,'iphone-open');await p.evaluate(()=>YodSlider.api.seek(13));await shot(p,'iphone-account');}
  if(name==='webkit'&&size.width===375)await shot(p,'iphone-small-close');
 }
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await p.evaluate(()=>YodSlider.api.seek(8.5));await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);assert.ok(Math.abs((await p.evaluate(()=>YodSlider.api.state().p))-8.5)<.01,'Rotation preserves moment');
 await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>YodSlider.api.mobile().active),false);assert.equal(await p.locator('#progress').getAttribute('aria-orientation'),'horizontal');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>YodSlider.api.seek(0));await p.locator('#next').tap();assert.equal(await p.locator('#progress').inputValue(),'1');
 await p.locator('#contents').tap();assert.ok(await p.locator('#reader').isVisible());await p.locator('[data-close="reader"]').tap();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({mobileJourney:true,engine:name,nativeScroll:true,verticalRail:true,noSnap:true,orientation:true,shortPhone:true,landscape:true,closingReachable:true,touchButtons:true,reducedMotion:true}));
 }catch(e){console.log('MOBILE_DIAGNOSTIC '+JSON.stringify(await p.evaluate(()=>({state:YodSlider.api.state(),y:scrollY,trace:window.scrollTrace?.slice(-5),events:window.scrollEvents?.slice(-5),errors:window.mobileErrors,visibility:document.visibilityState}))));await shot(p,name+'-failure');throw e;}finally{await browser.close();}
}
await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
