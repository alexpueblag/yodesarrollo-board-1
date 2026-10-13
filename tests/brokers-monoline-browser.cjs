'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=process.cwd(),PUBLIC='https://yodesarrollomx.github.io/yodesarrollo-board/presentacion/';
const LEGACY={...require('./brokers-story.test.cjs').fullFixture(),...require('./brokers-hunt.test.cjs').fixture()};
function configFixture(){
 const labels={};for(const key of ['a','b','illustrative','street','city','physicalMeasure','section','market','finance','adverse','review','formalization','project','permits','services','construction','projectEquation','distribution','projectVsInvestor','scope'])labels[key]='Synthetic '+key;
 labels.a='A · Synthetic purchase';labels.b='B · Synthetic contribution';
 const config={version:'4r4.1',brand:'Synthetic Studio',headline:'Understand the example before considering participation.',lead:'A synthetic narrative with no property, price, person or investment promise.',theme:{ink:'#AD451C',paper:'#FFF9F1'},labels,scenes:[],navigation:[{title:'What we do',scene:0},{title:'How we decide',scene:2},{title:'How to participate',scene:3}],cta:[{label:'Discuss a property',message:'Synthetic request to discuss a property.'},{label:'Discuss capital participation',message:'Synthetic request about capital participation.'}],controls:{play:'Play',pause:'Pause',replay:'Replay',share:'Share',details:'Read details',previous:'Previous',next:'Next'},footnotes:['Synthetic public marketing copy. Not an evaluated property.']};
 const ids=['opportunity','market','comparison','agreement','execution','sale','conversation'];
 for(let scene=0;scene<7;scene++)config.scenes.push({id:ids[scene],kicker:String(scene+1).padStart(2,'0'),title:'Synthetic scene '+(scene+1),lead:'Synthetic explanation for scene '+(scene+1)+', written to exercise ordinary mobile reading.',beats:Array.from({length:3},(_,beat)=>({title:'Synthetic scene '+(scene+1)+' step '+(beat+1),body:'Synthetic step explanation '+(beat+1)+' with enough words to verify that copy remains readable on a narrow mobile screen.'})),details:[{title:'Synthetic criteria '+(scene+1),items:['Synthetic visible detail '+(scene+1)+'A','Synthetic visible detail '+(scene+1)+'B'],sourcefieldcoverage:['synthetic.source.'+scene]}]});
 config.scenes[2].details[0].items.push('Synthetic literal <img src=x onerror="window.monoInjected=true">');
 return config;
}
function readConfig(payload){const d=payload.textos||payload;assert.ok(d.mono_config,'Public copy must contain mono_config');return typeof d.mono_config==='string'?JSON.parse(d.mono_config):d.mono_config;}
async function state(page){return page.evaluate(()=>window.YodMonoline.api.state());}
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function seek(page,index){await page.evaluate(n=>window.YodMonoline.api.seekBeat(n),index);await settle(page);}
async function ready(page){await page.waitForFunction(()=>['principal','monoline'].some(id=>{const el=document.getElementById(id);return el&&!el.hidden&&el.offsetWidth>0;}),null,{timeout:60000});if(await page.locator('#principal').isVisible()){await page.locator('#principalBeta').click();}await page.locator('#monoline:not([hidden])').waitFor({timeout:60000});await page.waitForFunction(()=>window.YodMonoline&&window.YodMonoline.api&&Number.isFinite(window.YodMonoline.api.state().p));await page.evaluate(()=>document.fonts.ready);}
async function visibleDetails(page,config){
 assert.equal(await page.locator('#monoDetails [data-mono-scene]').count(),7);
 for(let i=0;i<7;i++){const block=page.locator('#monoDetails [data-mono-scene="'+i+'"]');assert.ok(await block.isVisible(),'Every chapter detail must be in normal document flow');assert.equal(await block.evaluate(e=>Boolean(e.closest('details,[hidden],dialog'))),false,'Details must not require disclosure controls');const text=await block.textContent();for(const group of config.scenes[i].details)for(const item of group.items)assert.ok(text.includes(item),'Missing visible detail from scene '+i);}
}
async function verify(page,config){
 await ready(page);await page.evaluate(()=>window.YodMonoline.api.pause());
 assert.equal(await page.locator('#monoPath').evaluate(e=>getComputedStyle(e).vectorEffect),'none','Stroke reveal must use the same coordinate system as geometric prefix lengths');assert.equal(await page.locator('#monoSvg').count(),1);assert.equal(await page.locator('#monoSvg path').count(),1,'The drawing must be one path, not an overlay connecting independent illustrations');
 const pathHandle=await page.locator('#monoPath').elementHandle(),original=await page.locator('#monoPath').getAttribute('d');assert.equal((original.match(/[Mm]/g)||[]).length,1,'One uninterrupted path origin');assert.ok(original.length>100);
 assert.equal(await page.locator('#monoNav [data-mono-group]').count(),3);
 assert.equal((await page.locator('#monoCaseA').textContent()).trim(),config.labels.a);assert.equal((await page.locator('#monoCaseB').textContent()).trim(),config.labels.b);
 await visibleDetails(page,config);
 assert.equal(await page.locator('#hunt').isVisible(),false);assert.equal(await page.locator('#story').isVisible(),false);
 let lastOffset=Infinity;
 for(let beat=0;beat<21;beat++){
  await seek(page,beat);const value=await state(page);assert.equal(value.beat,beat);assert.equal(value.scene,Math.floor(beat/3));assert.equal(await page.locator('#monoBeatTitle').textContent(),config.scenes[value.scene].beats[beat%3].title);assert.equal(await page.locator('#monoBeatBody').textContent(),config.scenes[value.scene].beats[beat%3].body);
  const offset=await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset));assert.ok(Number.isFinite(offset));assert.ok(offset<=lastOffset+.1,'Drawing must accumulate instead of replacing a scene');lastOffset=offset;
  assert.equal(await pathHandle.evaluate(e=>e.isConnected&&e===document.querySelector('#monoPath')),true,'The same path persists');
  assert.equal(await page.locator('#monoPath').getAttribute('d'),original,'Narrative progress must not change the source geometry');
 }
 const finalOffset=lastOffset;await seek(page,0);const firstOffset=await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset));assert.ok(firstOffset>finalOffset+20,'A real stroke reveal must move across the story');
 await seek(page,13);const forward=await state(page),offset=await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset));await seek(page,5);await seek(page,13);assert.ok(Math.abs((await state(page)).p-forward.p)<.001);assert.ok(Math.abs((await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset)))-offset)<.1,'Reverse must recover the exact prior trace');
 // Test native backward scroll, not only the programmatic seek method.
 await seek(page,20);assert.ok(await page.evaluate(()=>scrollY)>0);await page.evaluate(()=>scrollTo(0,0));await settle(page);assert.ok((await state(page)).p<.05,'Native scroll back to the beginning must rewind the story');await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight-innerHeight));await settle(page);assert.ok((await state(page)).p>.99,'Native forward scroll must reach the closing scene');
 for(let group=0;group<3;group++){await page.locator('#monoNav [data-mono-group="'+group+'"]').click();await settle(page);assert.equal((await state(page)).scene,config.navigation[group].scene,'Group navigation must target the promised chapter');}
 await page.locator('#monoReplay').click();await settle(page);assert.ok((await state(page)).p<.01);
 await page.locator('#monoPlay').click();await page.waitForTimeout(450);assert.ok((await state(page)).p>0);assert.equal((await state(page)).playing,true);
 await page.locator('#monoPlay').click();await settle(page);const paused=await state(page);await page.waitForTimeout(250);assert.equal((await state(page)).playing,false);assert.ok(Math.abs((await state(page)).p-paused.p)<.00001,'Pause freezes narrative progress');
 for(const viewport of [{width:320,height:640},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(viewport);await settle(page);
  for(let scene=0;scene<7;scene++){await seek(page,scene*3+1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow at '+viewport.width+' scene '+scene);
   const metrics=await page.evaluate(()=>{const title=document.querySelector('#monoTitle'),body=document.querySelector('#monoBeatBody'),a=document.querySelector('#monoCaseA'),b=document.querySelector('#monoCaseB'),buttons=[...document.querySelectorAll('#monoline button')].filter(e=>e.offsetWidth&&e.offsetHeight).map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));return{title:parseFloat(getComputedStyle(title).fontSize),body:parseFloat(getComputedStyle(body).fontSize),a:parseFloat(getComputedStyle(a).fontSize),b:parseFloat(getComputedStyle(b).fontSize),buttons};});
   assert.ok(metrics.title>=22&&metrics.body>=16&&metrics.a>=14&&metrics.b>=14,'Declared mobile typography must actually render: '+JSON.stringify(metrics));
   for(const button of metrics.buttons)assert.ok(button.w>=43.5&&button.h>=43.5,'Visible touch targets must be usable: '+JSON.stringify(button));
   assert.ok(await page.locator('#monoPlay').isVisible());const playBox=await page.locator('#monoPlay').boundingBox();assert.ok(playBox.y>=-1&&playBox.y+playBox.height<=viewport.height+1,'Playback must stay available inside the viewport: '+JSON.stringify({viewport,scene,playBox}));assert.ok(await page.locator('#monoCaseA').isVisible()&&await page.locator('#monoCaseB').isVisible());
  }
 }
 await page.setViewportSize({width:390,height:844});await seek(page,11);const preserved=(await state(page)).p;
 await page.setViewportSize({width:400,height:850});await settle(page);assert.ok(Math.abs((await state(page)).p-preserved)<.003,'Resize must preserve narrative progress');
 await page.setViewportSize({width:390,height:844});await settle(page);assert.ok(Math.abs((await state(page)).p-preserved)<.003);
 // Reset during a viewport change must win over a queued resize restoration.
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  await seek(page,20);await page.setViewportSize(viewport);await page.evaluate(()=>window.YodMonoline.api.reset());await settle(page);
  assert.equal(await page.evaluate(()=>scrollY),0,'Reset plus resize must keep the opening headline at the top');
  const opening=await page.locator('#monoHeadline').boundingBox();assert.ok(opening.y>=0&&opening.y+opening.height<=viewport.height,'Opening headline must be visible after reset plus resize');
  assert.ok((await state(page)).p<.01,'Resize must not restore progress from before reset');
 }
 await seek(page,20);await visibleDetails(page,config);
 assert.equal(await page.locator('#monoline [data-mono-cta]').count(),2,'Both investor/property conversation paths must be available');
 await page.locator('#monoline [data-mono-cta="0"]').click();await page.locator('#monoMessageDialog[open]').waitFor();const message=await page.locator('#monoMessage').inputValue();assert.ok(message.includes(config.cta[0].message));assert.ok(!/[?&](?:k|token|masterbroker)=/i.test(message),'Prepared message must not carry credentials or private profile query parameters');await page.locator('#monoMessageClose').click();
}
async function capture(page,prefix){
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.YodMonoline.api.reset());await page.waitForTimeout(80);await shot(page,prefix+'-opening-mobile390');
 for(let scene=0;scene<7;scene++){await seek(page,scene*3+1);await page.waitForTimeout(80);await shot(page,prefix+'-scene'+(scene+1)+'-mobile390');}
 await seek(page,14);await page.waitForTimeout(80);await shot(page,prefix+'-execution-end-mobile390');await seek(page,20);await page.locator('#monoClosing').scrollIntoViewIfNeeded();await page.waitForTimeout(80);await shot(page,prefix+'-closing-mobile390');
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>window.YodMonoline.api.reset());await page.waitForTimeout(80);await shot(page,prefix+'-opening-desktop1440');for(const scene of [0,2]){await seek(page,scene*3+1);await page.waitForTimeout(80);await shot(page,prefix+'-scene'+(scene+1)+'-desktop1440');}
}
async function shot(page,id){const pixels=await page.screenshot({path:'mono-'+id+'.jpg',type:'jpeg',quality:45}),b64=pixels.toString('base64'),total=Math.ceil(b64.length/1600);console.log('MONO_SCREEN_START '+JSON.stringify({id,mime:'image/jpeg',bytes:pixels.length,total}));for(let index=0;index<total;index++)console.log('MONO_SCREEN_CHUNK '+id+' '+index+' '+total+' '+b64.slice(index*1600,(index+1)*1600));console.log('MONO_SCREEN_END '+id);}
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/presentacion/'?'presentacion/index.html':pathname.slice(1);if(req.method!=='GET'||!/^presentacion\/[a-z0-9-]+\.(?:html|js|css|json|svg)$/.test(file)){res.writeHead(404);return res.end();}const full=path.join(ROOT,file);if(!fs.existsSync(full)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(full));}).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']}),errors=[];let writes=0,copyReads=0;
 let payload={textos:{...LEGACY,mono_config:JSON.stringify(configFixture())}};
 await context.route('https://**/*',route=>{if(route.request().method()!=='GET'){writes++;return route.abort('blockedbyclient');}if(route.request().url().includes('recurso=textos')){copyReads++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});}return route.fulfill({status:200,body:'',contentType:'application/javascript'});});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 const base='http://127.0.0.1:'+server.address().port+'/presentacion/';
 await page.goto(base+'?k=synthetic-do-not-share&masterbroker=synthetic-profile');try{await verify(page,readConfig(payload));}catch(error){console.log('MONO_FAILURE_LAYOUT '+JSON.stringify(await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('#monoline *')].map(e=>({tag:e.tagName,id:e.id,rect:e.getBoundingClientRect()})).filter(x=>x.rect.width&&x.rect.right>innerWidth+1).slice(0,12).map(x=>({tag:x.tag,id:x.id,left:x.rect.left,right:x.rect.right,width:x.rect.width}))}))));await shot(page,'synthetic-failure');throw error;}assert.notEqual(await page.evaluate(()=>window.monoInjected),true);assert.equal(await page.locator('#monoDetails img').count(),0,'Remote text must be rendered as text, never trusted markup');
 const readsBefore=copyReads;await page.locator('#monoLegacy').click();await page.locator('#story:not([hidden])').waitFor();await page.locator('#hunt:not([hidden])').waitFor();assert.equal(copyReads,readsBefore,'Showing the retained draft must reuse the loaded public payload');assert.equal(await page.locator('button[data-chapter]').count(),7);await page.locator('#monoBack').click();await ready(page);assert.equal(await page.locator('#story').isVisible(),false);assert.equal(copyReads,readsBefore);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await ready(page);const stable=await page.locator('#monoPath').getAttribute('d');assert.ok(stable.length>100);assert.ok(Math.abs(await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset)))<.1,'Reduced motion keeps the complete master path visible');assert.equal(await page.locator('#monoSvg path').count(),1);
 assert.notEqual(await page.locator('#monoStage').evaluate(e=>getComputedStyle(e).position),'fixed');assert.notEqual(await page.locator('#monoStage').evaluate(e=>getComputedStyle(e).position),'sticky');await visibleDetails(page,readConfig(payload));
 await page.locator('#monoPlay').click();await page.waitForTimeout(150);assert.equal((await state(page)).playing,false,'Reduced motion must not start automated camera movement');await page.locator('#monoNav [data-mono-group="2"]').click();await settle(page);assert.equal((await state(page)).scene,3);assert.equal(await page.locator('#monoPath').getAttribute('d'),stable);assert.ok(Math.abs(await page.locator('#monoPath').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset)))<.1,'Reduced navigation must not hide the static path');await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(writes,0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({syntheticMonoline:true,onePath:true,oneOrigin:true,beats:21,chapters:7,persistentCases:true,nativeReverse:true,replay:true,pause:true,groupNavigation:true,visibleDetails:true,textIsNotMarkup:true,resizePreservesProgress:true,mobile320:true,mobile390:true,desktop1440:true,reducedMotion:true,retainedDraft:true,noExtraLegacyFetch:true,businessWrites:writes}));
 // Fetch only public marketing copy. It is neither persisted in Git nor printed in logs.
 const url=fs.readFileSync('presentacion/source.js','utf8').match(/url:'([^']+)'/)[1],response=await fetch(url,{signal:AbortSignal.timeout(60000)});assert.ok(response.ok);payload=await response.json();const real=readConfig(payload);assert.equal(real.scenes.length,7);assert.equal(real.scenes.reduce((n,s)=>n+s.beats.length,0),21);await page.goto(base);try{await verify(page,real);}catch(error){await shot(page,'public-copy-failure');throw error;}assert.deepEqual(errors,[]);
 if(process.env.VERIFY_PUBLISHED_STORY!=='1')await capture(page,'preview');
 if(process.env.VERIFY_PUBLISHED_STORY==='1'){
  const files=['monoline.js','monoline-core.js','monoline.css'],publicContext=await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']}),published=await publicContext.newPage(),publicErrors=[];published.on('pageerror',error=>publicErrors.push(error.message));let readyFlag=false,productionWrites=0;
  await publicContext.route('**/*',route=>{if(route.request().method()!=='GET'){productionWrites++;return route.abort('blockedbyclient');}return route.continue();});
  for(let attempt=0;attempt<15&&!readyFlag;attempt++){try{let match=true;for(const file of files){const r=await fetch(PUBLIC+file+'?v='+Date.now(),{signal:AbortSignal.timeout(20000)});if(!r.ok||(await r.text()).trim()!==fs.readFileSync('presentacion/'+file,'utf8').trim()){match=false;break;}}if(match){await published.goto(PUBLIC,{waitUntil:'domcontentloaded',timeout:30000});await ready(published);readyFlag=true;}}catch(_){}if(!readyFlag)await new Promise(resolve=>setTimeout(resolve,8000));}
  assert.ok(readyFlag,'The anonymous published page must serve the exact candidate files');await verify(published,real);await capture(published,'public');assert.equal(productionWrites,0);assert.deepEqual(publicErrors,[]);assert.deepEqual(await published.evaluate(()=>Object.keys(localStorage)),[]);console.log(JSON.stringify({productionMonoline:true,anonymous:true,exactPublishedCode:true,publicMarketingCopy:true,actualProductionScreenshots:13,businessWrites:0}));await publicContext.close();
 }
 await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(error=>{console.error(error);process.exit(1)});
