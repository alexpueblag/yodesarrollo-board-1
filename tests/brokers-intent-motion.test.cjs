'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../presentacion/intent-motion.js');
test('continuous film has no jump at any narrative boundary',()=>{
 for(let p=1;p<14;p++)for(const [key,value]of Object.entries(M.frame(p-1e-6))){const after=M.frame(p+1e-6)[key];assert.ok(Number.isFinite(value)&&Number.isFinite(after));assert.ok(Math.abs(after-value)<.001,key+' continuous at '+p);}
});
test('reversing, repeated seeks and endpoint visits do not change film state',()=>{
 const frames=Array.from({length:113},(_,i)=>M.frame(i/8));
 for(let i=112;i>=0;i--)assert.deepEqual(M.frame(i/8),frames[i]);
 assert.deepEqual(M.frame(-50),M.frame(0));assert.deepEqual(M.frame(50),M.frame(14));
 assert.ok(M.frame(3.3).hero>.99);assert.equal(M.frame(14).finish,1);
});
test('comparison, capital, construction and sale remain in their intended order',()=>{
 assert.ok(M.frame(6.3).compare>.9);assert.ok(M.frame(7.4).account>.9);
 assert.ok(M.frame(9.3).roles>.9);assert.ok(M.frame(10.3).checks>.9);
 assert.ok(M.frame(11.5).build>.9);assert.ok(M.frame(12.3).sale>.9);
 assert.equal(M.frame(14).dossier,1);assert.equal(M.frame(14).close,1);
});
