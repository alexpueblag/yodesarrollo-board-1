'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../presentacion/atlas-core.js');
test('evaluator handoff strips credential and broker query; rejects other destinations',()=>{
assert.equal(C.evaluatorURL('https://script.google.com/macros/s/test-deployment/exec?app=evaluador&k=private&masterbroker=private#private'),'https://script.google.com/macros/s/test-deployment/exec?app=evaluador');
for(const url of ['javascript:alert(1)','https://evil.test/macros/s/id/exec?app=evaluador','https://script.google.com/other?app=evaluador','https://script.google.com/macros/s/id/exec?app=admin'])assert.equal(C.evaluatorURL(url),'');
});
test('cartography is validated, not fabricated when absent or unsafe',()=>{
assert.equal(C.mapData({}),null);
const m={width:1000,height:700,focus:[500,300],roads:[['Street','primary','M1 2L3 4',[1,2]]]};
assert.ok(C.mapData({hunt_map_geometry:JSON.stringify(m),hunt_street_geometry:JSON.stringify(m.roads)}));
m.roads[0][2]='<script>';assert.equal(C.mapData({hunt_map_geometry:JSON.stringify(m),hunt_street_geometry:JSON.stringify(m.roads)}),null);
});
test('all 27 moments remain reachable and reversible',()=>{for(let i=0;i<27;i++){assert.equal(C.state(i).beat,i);assert.equal(C.next(i,1),Math.min(26,i+1));assert.equal(C.next(i,-1),Math.max(0,i-1));}});
