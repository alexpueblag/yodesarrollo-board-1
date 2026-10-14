'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../presentacion/slider-core.js');
test('manual journey clamps, reverses and preserves 27 named moments',()=>{for(let i=0;i<27;i++){const a=C.state(i);assert.equal(a.scene,Math.floor(i/3));assert.equal(a.step,i%3);assert.equal(C.next(i,1),Math.min(26,i+1));assert.equal(C.next(i,-1),Math.max(0,i-1));}assert.equal(C.state(-100).beat,0);assert.equal(C.state(100).beat,26);for(const p of [0,.2,3.7,12.8,25.99,26])assert.deepEqual(C.state(p),C.state(p));});
test('sharing strips profile, credentials and internal routing',()=>{assert.equal(C.cleanURL('https://example.test/path/?k=private&masterbroker=private#secret'),'https://example.test/path/');});
test('an incomplete narrative cannot silently launch',()=>{assert.throws(()=>C.normalize({textos:{slider_config:'{}'}}));assert.throws(()=>C.normalize({textos:{}}));});

