(function(root){'use strict';
const ids=['opportunity','market','property','product','account','conditions','participation','execution','recovery'];
const clamp=(v,a=0,b=26)=>Math.max(a,Math.min(b,Number(v)||0));
function state(value){const p=clamp(value),beat=Math.min(26,Math.floor(p+.00001));return{p,beat,scene:Math.floor(beat/3),step:beat%3,fraction:p-beat};}
function normalize(payload){let c=(payload.textos||payload).slider_config;if(typeof c==='string')c=JSON.parse(c);if(!c||c.scenes?.length!==9||c.cta?.length!==2)throw Error('El recorrido todavía no está disponible.');for(let i=0;i<9;i++){const s=c.scenes[i];if(s.id!==ids[i]||typeof s.title!=='string'||typeof s.label!=='string'||s.steps?.length!==3)throw Error('Recorrido incompleto.');for(const b of s.steps)if(typeof b.heading!=='string'||typeof b.body!=='string'||b.labels?.length!==3||!b.labels.every(x=>typeof x==='string'))throw Error('Momento incompleto.');}return c;}
function cleanURL(value){const u=new URL(value);u.search='';u.hash='';return u.href;}
function next(value,direction){const p=clamp(value);return clamp(direction>0?Math.floor(p+.00001)+1:Math.ceil(p-.00001)-1);}
const api={ids,clamp,state,normalize,cleanURL,next};if(typeof module!=='undefined')module.exports=api;else root.YodSliderCore=api;
})(typeof window==='undefined'?globalThis:window);
