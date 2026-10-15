'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{read}=require('./public-story-copy.cjs');
async function shot(p,name){const b=await p.screenshot({type:'jpeg',quality:65});fs.writeFileSync('mobile-'+name+'.jpg',b);b.toString('base64').match(/.{1,1600}/g).forEach((c,i)=>console.log('MOBILE_SCREEN_CHUNK '+name+' '+i+' '+c));}
const wait=p=>p.waitForTimeout(160);
async function gesture(p,x,y,delta,ms,cdp){const steps=24;if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});else{await p.mouse.move(x,y);await p.mouse.down();}for(let i=1;i<=steps;i++){const yy=y-delta*i/steps;if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:yy}]});else await p.mouse.move(x,yy);await p.waitForTimeout(ms/steps);}if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await p.mouse.up();await wait(p);}
(async()=>{
setTimeout(()=>{console.error('Mobile browser deadline');process.exit(1);},240000).unref();
const payload=await read(fs.readFileSync('presentacion/source.js','utf8').match(/url:'([^']+)'/)[1]);
const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9-]+\.(html|css|js)$/.test(n)&&n!=='assets/logo_dark.png'){res.statusCode=404;return res.end();}try{res.setHeader('Content-Type',n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(n.startsWith('assets/')?n:path.join('presentacion',n)));}catch(e){res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
for(const [name,engine]of [['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await context.route('https://**/*',r=>{assert.equal(r.request().method(),'GET');return r.fulfill({contentType:'application/json',body:JSON.stringify(payload)});});
 await p.bringToFront();await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.locator('#journey:not([hidden])').waitFor({timeout:65000});
 const cdp=name==='chromium'?await context.newCDPSession(p):null;
 try{
 for(const size of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){
  await p.setViewportSize(size);await p.waitForFunction(w=>YodSlider.api.mobile().width===w,size.width);await p.evaluate(()=>YodSlider.api.seek(0));await wait(p);
  const fit=await p.evaluate(()=>{const r=document.querySelector('#diagram').getBoundingClientRect(),w=document.querySelector('.workspace').getBoundingClientRect(),rotor=document.querySelector('#mobileRotor').getBoundingClientRect(),logo=document.querySelector('.wordmark').getBoundingClientRect();return{active:YodSlider.api.mobile().active,w:innerWidth,scroll:document.documentElement.scrollWidth,page:document.documentElement.scrollHeight,h:innerHeight,diagram:r.width,workspace:w.width,rotor:{w:rotor.width,right:r.right-rotor.right},logoCenter:logo.x+logo.width/2,font:parseFloat(getComputedStyle(document.querySelector('.mobile-body')).fontSize)};});
  assert.ok(fit.active&&fit.scroll<=fit.w+1&&fit.page<=fit.h+1,'Fixed mobile layout '+JSON.stringify(fit));assert.ok(fit.diagram>=size.width-24,'Canvas has no reserved control column');assert.equal(fit.rotor.w,44);assert.ok(fit.rotor.right>=9&&fit.rotor.right<=12);assert.ok(Math.abs(fit.logoCenter-size.width/2)<2);assert.ok(fit.font>=16);
  for(let i=0;i<27;i++){await p.evaluate(i=>YodSlider.api.seek(i),i);const state=await p.evaluate(()=>({p:YodSlider.api.state().p,title:document.querySelector('.mobile-title').textContent,body:document.querySelector('.mobile-body').textContent}));assert.equal(state.p,i);assert.ok(state.title&&state.body);assert.equal(await p.locator('#actions').isVisible(),i===26);}
  await p.evaluate(()=>{YodSlider.api.seek(26);const s=document.querySelector('.mobile-story');s.scrollTop=s.scrollHeight;});await wait(p);const a=await p.locator('#actions').boundingBox(),d=await p.locator('.dock').boundingBox();assert.ok(a.y+a.height<=d.y+1,'Both closing actions are reachable');
  if(name==='webkit'&&size.width===390){await shot(p,'iphone-close');await p.evaluate(()=>YodSlider.api.seek(0));await shot(p,'iphone-open');await p.evaluate(()=>YodSlider.api.seek(13));await shot(p,'iphone-account');}
  if(name==='webkit'&&size.width===844){await p.evaluate(()=>YodSlider.api.seek(13));await shot(p,'iphone-landscape');}
  if(name==='webkit'&&size.width===320){await shot(p,'iphone-small-close');}
 }
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>YodSlider.api.mobile().width===390);await p.evaluate(()=>YodSlider.api.seek(8));
 const b=await p.locator('#mobileRotor').boundingBox(),x=b.x+b.width/2,y=b.y+b.height-10;assert.ok(b.height>260);
 await gesture(p,x,y,240,1500,cdp);const slow=(await p.evaluate(()=>YodSlider.api.state().p))-8;
 await p.evaluate(()=>YodSlider.api.seek(8));await gesture(p,x,y,240,650,cdp);const fast=(await p.evaluate(()=>YodSlider.api.state().p))-8;assert.ok(slow>.5&&fast>slow*1.03,'Velocity-sensitive gesture '+JSON.stringify({slow,fast}));
 const held=await p.evaluate(()=>YodSlider.api.state().p);await p.waitForTimeout(250);assert.ok(Math.abs((await p.evaluate(()=>YodSlider.api.state().p))-held)<.001,'Brakes after release');
 for(const initial of [0,26]){
  await p.evaluate(v=>YodSlider.api.seek(v),initial);for(let j=0;j<3;j++)await gesture(p,x,b.y+b.height*.5,initial===0?-50:50,100,cdp);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),initial,'No accumulated motion beyond endpoint');
  await gesture(p,x,b.y+b.height*.5,initial===0?80:-80,300,cdp);const v=await p.evaluate(()=>YodSlider.api.state().p);assert.ok(initial===0?v>0:v<26,'Immediate reversal from endpoint');
 }
 for(const fraction of [.1,.3,.5,.7,.9]){await p.evaluate(()=>YodSlider.api.seek(8));const yy=b.y+b.height*fraction;await p.mouse.click(x,yy);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),8,'Tap never jumps');await gesture(p,x,yy,25,150,cdp);assert.ok((await p.evaluate(()=>YodSlider.api.state().p))>8,'Rotor works from any height');}
 await p.locator('#mobileIndex').tap();await p.locator('#mobileChapters nav button').nth(2).tap();assert.equal(await p.evaluate(()=>YodSlider.api.state().p),6);
 await p.locator('#next').tap();await p.waitForFunction(()=>Math.abs(YodSlider.api.state().p-7)<.001);await p.locator('#prev').tap();await p.waitForFunction(()=>Math.abs(YodSlider.api.state().p-6)<.001);
 await p.evaluate(()=>YodSlider.api.seek(8.5));await p.setViewportSize({width:844,height:390});await p.waitForFunction(()=>YodSlider.api.mobile().width===844);assert.equal(await p.evaluate(()=>YodSlider.api.state().p),8.5);
 await p.setViewportSize({width:1440,height:900});await p.waitForFunction(()=>YodSlider.api.mobile().width===1440);assert.equal(await p.evaluate(()=>YodSlider.api.mobile().active),false);assert.ok(await p.locator('#progress').isVisible());
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>YodSlider.api.mobile().width===390);await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>YodSlider.api.seek(0));await p.locator('#next').tap();assert.equal(await p.locator('#progress').inputValue(),'1');
 await p.locator('#mobileRotor').focus();await p.keyboard.press('End');assert.equal(await p.evaluate(()=>YodSlider.api.state().p),26);await p.keyboard.press('Home');assert.equal(await p.evaluate(()=>YodSlider.api.state().p),0);
 await p.locator('#contents').tap();assert.ok(await p.locator('#reader').isVisible());await p.locator('[data-close="reader"]').tap();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({mobileJourney:true,engine:name,moments:135,transparentRotor:true,fullWidth:true,centeredBrand:true,velocity:{slow,fast},endpoints:true,brake:true,tap:true,fiveHeights:true,orientation:true,keyboard:true,closingReachable:true,reducedMotion:true}));
 }catch(e){console.log('MOBILE_DIAGNOSTIC '+JSON.stringify(await p.evaluate(()=>({state:YodSlider.api.state(),mobile:YodSlider.api.mobile(),viewport:[innerWidth,innerHeight]}))));await shot(p,name+'-failure');throw e;}finally{await browser.close();}
}
await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
