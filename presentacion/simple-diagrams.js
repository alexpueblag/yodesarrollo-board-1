(function(root){'use strict';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const box=(x,y,w,h)=>'M'+x+' '+y+'h'+w+'v'+h+'h-'+w+'Z';
const circle=(x,y,r)=>'M'+(x-r)+' '+y+'a'+r+' '+r+' 0 1 0 '+r*2+' 0a'+r+' '+r+' 0 1 0 -'+r*2+' 0';
const defs={
 offer:[[0,'M30 175L110 105L190 175'],[0,box(45,175,130,125)],[1,'M260 300V95H380V300Z'],[1,'M260 195H380'],[2,'M420 220H475M457 202L475 220L457 238'],[2,box(485,155,90,145)],[2,'M505 235L525 255L560 205']],
 territory:[[0,'M50 220H590'],[0,circle(110,220,55)],[1,'M320 105V335'],[1,circle(320,220,55)],[2,circle(530,220,55)]],
 select:[[0,'M30 170L110 100L190 170'],[0,box(45,170,130,135)],[1,'M265 225H375M320 185V280M290 280H350'],[2,'M450 170L530 100L610 170'],[2,box(465,170,130,135)]],
 account:[[0,box(40,135,140,150)],[1,'M203 210H237'],[1,box(250,135,140,150)],[2,'M410 194H440M410 226H440'],[2,box(460,135,140,150)]],
 agreement:[[0,box(40,150,140,130)],[0,'M75 210L105 240L150 185'],[1,'M200 215H240M225 200L240 215L225 230'],[1,box(250,150,140,130)],[2,'M410 215H450M435 200L450 215L435 230'],[2,box(460,150,140,130)],[2,'M490 210L515 235L550 185']],
 execution:[[0,box(50,150,130,140)],[0,'M80 200H150M80 235H130'],[1,'M210 225H250M235 210L250 225L235 240'],[1,box(260,95,120,195)],[1,'M260 195H380'],[2,'M415 225H455M440 210L455 225L440 240'],[2,box(475,150,110,140)],[2,'M510 225L530 245L570 195']],
 participation:[[0,circle(110,215,60)],[0,'M170 215H250'],[1,box(250,135,140,160)],[2,'M390 215H470'],[2,'M455 175L530 105L605 175'],[2,box(470,175,120,120)]]
};
function describe(id){if(!defs[id])throw Error('Unknown scene');return{viewBox:[0,70,640,280],paths:defs[id].length,stages:3,strokeWidth:7,anchors:[{x:110,y:350},{x:320,y:350},{x:530,y:350}]};}
function renderSVG(id,progress){describe(id);progress=clamp(progress);const paths=defs[id].map(([stage,d])=>'<path data-stage="'+stage+'" d="'+d+'" pathLength="100" stroke-dasharray="100" stroke-dashoffset="'+((1-clamp(progress*3-stage))*100)+'"/>').join('');return'<svg viewBox="0 70 640 280" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';}
const api={renderSVG,describe,ids:Object.keys(defs)};root.YodSimpleDiagrams=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);