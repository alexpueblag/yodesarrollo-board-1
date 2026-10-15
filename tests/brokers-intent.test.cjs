'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function core(){const window={YodSliderCore:require('../presentacion/atlas-core.js')};vm.runInNewContext(fs.readFileSync('presentacion/intent-core.js','utf8'),{window,URL});return window.YodSliderCore;}
test('variable scene lengths preserve every boundary and reversibility',()=>{const c=core(),sizes=[2,4,3,4,3,4,1];c.configure(sizes.map(n=>({steps:Array(n).fill({})})));assert.equal(c.max(),20);let p=0;for(let i=0;i<sizes.length;i++){assert.equal(c.start(i),p);for(let j=0;j<sizes[i];j++){const s=c.state(p);assert.equal(s.scene,i);assert.equal(s.step,j);assert.equal(c.next(p,-1),Math.max(0,p-1));assert.equal(c.next(p,1),Math.min(20,p+1));p++;}}assert.equal(c.state(-4).p,0);assert.equal(c.state(999).p,20);assert.equal(c.sceneNext(8,1),9);});
test('new contract rejects missing journey instead of showing unapproved fallback',()=>{const c=core(),old=require('../presentacion/atlas-core.js');const cfg={scenes:old.ids.map(id=>({id,label:'Synthetic',title:'Synthetic',steps:Array.from({length:3},()=>({heading:'Heading',body:'Body',labels:['a','b','c']}))})),cta:[{},{}]};assert.throws(()=>c.normalize({atlas_config:cfg}),/recorrido/);});

test('additive editorial replaces the active story while preserving all original sources',()=>{
 const c=core(),ids=require('../presentacion/atlas-core.js').ids;
 const source=ids.map(id=>({id,label:'Source',title:'Source',steps:Array.from({length:3},()=>({heading:'Heading',body:'Body',labels:['a','b','c']}))}));
 const original={version:'intent-1',scenes:ids.slice(0,7).map(id=>({id,label:'Beta',steps:[{visual:'city',heading:'Beta heading',caption:'Beta caption',labels:['Beta'],note:''}]})),cta:[{kind:'message'},{kind:'evaluator',url:'https://script.google.com/macros/s/synthetic/exec?app=evaluador'}]};
 const next=JSON.parse(JSON.stringify(original));next.revision='synthetic-next';next.theme={paper:'#ffffff',ink:'#111111',accent:'#222222'};next.scenes[0].steps.push({...next.scenes[0].steps[0],heading:'New heading'});
 const cfg={scenes:source,cta:[{},{}],journey:original,journeyNext:next};
 const result=c.normalize({atlas_config:cfg});
 assert.equal(result.scenes,next.scenes);assert.equal(result.sourceScenes,source);assert.equal(result.previousJourney,original);assert.equal(result.theme,next.theme);assert.equal(result.surface.revision,'synthetic-next');assert.equal(c.max(),7);
 assert.equal(original.scenes[0].steps.length,1);assert.equal(cfg.scenes.length,9);
});
