'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createReader}=require('./public-story-copy.cjs');
const URL_PUBLIC='https://script.google.com/macros/s/synthetic-public-source/exec?recurso=textos';
function probe(fetchImpl){const logs=[],waits=[];return{logs,waits,read:createReader({fetchImpl,log:item=>logs.push(item),wait:async ms=>waits.push(ms),now:()=>100})};}
test('public source rejects 403 immediately and never logs source content or private query',async()=>{
 let calls=0;const p=probe(async(url,options)=>{calls++;assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');return new Response('synthetic-body-not-for-logs',{status:403,headers:{'content-type':'text/html'}});});
 await assert.rejects(()=>p.read(URL_PUBLIC+'&k=synthetic-private-query'),e=>e.name==='PublicSourceHttpError'&&!e.message.includes('synthetic-private-query'));
 assert.equal(calls,1);assert.deepEqual(p.waits,[]);assert.equal(p.logs[0].status,403);
 const serialized=JSON.stringify(p.logs);assert.equal(serialized.includes('synthetic-body-not-for-logs'),false);assert.equal(serialized.includes('synthetic-private-query'),false);
 assert.deepEqual(Object.keys(p.logs[0]).sort(),['attempt','contentType','elapsedMs','errorName','finalHost','publicSourceProbe','status'].sort());
});
test('public source bounds repeated 503 to three GET attempts and two one-second backoffs',async()=>{
 let calls=0;const p=probe(async(_,options)=>{calls++;assert.equal(options.method,'GET');return new Response('synthetic-service-unavailable',{status:503});});
 await assert.rejects(()=>p.read(URL_PUBLIC),e=>e.name==='PublicSourceHttpError'&&e.message.includes('3 attempts'));
 assert.equal(calls,3);assert.deepEqual(p.waits,[1000,1000]);assert.deepEqual(p.logs.map(x=>x.attempt),[1,2,3]);assert.ok(p.logs.every(x=>x.status===503));
});
test('invalid JSON is terminal rather than replaced by a synthetic fallback',async()=>{
 let calls=0;const p=probe(async()=>{calls++;return new Response('not-json-synthetic-secret',{status:200,headers:{'content-type':'application/json'}});});
 await assert.rejects(()=>p.read(URL_PUBLIC),e=>e.name==='PublicSourceJsonError'&&!e.message.includes('not-json'));
 assert.equal(calls,1);assert.deepEqual(p.waits,[]);assert.equal(JSON.stringify(p.logs).includes('not-json-synthetic-secret'),false);
});
test('a transient reset retries once and returns payload without logging or persisting it',async()=>{
 let calls=0;const payload={textos:{synthetic_note:'synthetic-contents-stay-in-memory'}},p=probe(async()=>{if(++calls===1){const error=new TypeError('synthetic transport failure with a private URL');error.cause={code:'ECONNRESET'};throw error;}return new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json; charset=utf-8'}});});
 assert.deepEqual(await p.read(URL_PUBLIC),payload);assert.equal(calls,2);assert.deepEqual(p.waits,[1000]);assert.equal(JSON.stringify(p.logs).includes('synthetic-contents-stay-in-memory'),false);assert.equal(JSON.stringify(p.logs).includes('private URL'),false);assert.equal(p.logs[1].contentType,'application/json');
});
test('source and final redirect must stay within the public Google HTTPS provider',async()=>{
 let calls=0;const p=probe(async()=>{calls++;return{ok:true,status:200,url:'https://example.invalid/secret?token=synthetic',headers:new Headers(),json:async()=>({})};});
 await assert.rejects(()=>p.read('http://script.google.com/macros/s/synthetic/exec'),{name:'PublicSourceUrlError'});assert.equal(calls,0);
 await assert.rejects(()=>p.read(URL_PUBLIC),{name:'PublicSourceUrlError'});assert.equal(calls,1);assert.deepEqual(p.waits,[]);assert.equal(JSON.stringify(p.logs).includes('synthetic'),false);
});

test('a transient 404 at the Google content redirect can recover within the same three-GET budget',async()=>{let calls=0;const p=probe(async()=>{if(++calls===1)return{ok:false,status:404,url:'https://script.googleusercontent.com/macros/echo?synthetic=1',headers:new Headers({'content-type':'text/html'}),body:{cancel:async()=>{}}};return new Response('{}',{status:200});});assert.deepEqual(await p.read(URL_PUBLIC),{});assert.equal(calls,2);assert.deepEqual(p.waits,[1000]);});
test('a 404 at the deployment endpoint remains terminal',async()=>{let calls=0;const p=probe(async()=>{calls++;return{ok:false,status:404,url:URL_PUBLIC,headers:new Headers(),body:{cancel:async()=>{}}};});await assert.rejects(p.read(URL_PUBLIC),{name:'PublicSourceHttpError'});assert.equal(calls,1);});
