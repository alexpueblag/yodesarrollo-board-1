'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
function reader(){const mock={};new Function('window',fs.readFileSync('presentacion/source.js','utf8'))(mock);return mock.YodPublicCopy;}
test('browser public copy retries a transient status and keeps a fresh read-only Google URL',async()=>{
 let calls=0;const read=reader();const payload={textos:{synthetic:'synthetic-public-copy'}};
 const actual=await read(async(url,options)=>{calls++;const value=new URL(url);assert.equal(value.hostname,'script.google.com');assert.equal(value.searchParams.get('recurso'),'textos');assert.ok(Number(value.searchParams.get('t'))>0);assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');return calls===1?{ok:false,status:503}:{ok:true,json:async()=>payload};});
 assert.equal(actual,payload);assert.equal(calls,2);
});
test('browser copy does not retry a terminal permission response or invent replacement content',async()=>{
 let calls=0;await assert.rejects(()=>reader()(async()=>{calls++;return{ok:false,status:403};}));assert.equal(calls,1);
});
test('browser copy stops after three transient responses',async()=>{
 let calls=0;await assert.rejects(()=>reader()(async()=>{calls++;return{ok:false,status:502};}));assert.equal(calls,3);
});
