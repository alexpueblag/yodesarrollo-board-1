(function(root){'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const mix=(a,b,t)=>a+(b-a)*t;
function ramp(p,a,b){const t=clamp((p-a)/(b-a));return t*t*(3-2*t);}
const windowed=(p,a,b,c,d)=>ramp(p,a,b)*(1-ramp(p,c,d));
function frame(value){
 const p=clamp(value,0,14),compare=windowed(p,5.65,6.25,7.0,7.7),account=windowed(p,6.65,7.25,7.75,8.2),roles=windowed(p,8.55,9.15,9.7,10.35),finish=ramp(p,10.65,11.8),dossier=ramp(p,12.5,13.25),close=ramp(p,13.3,14);
 return {p,map:1-ramp(p,2.35,3.25),zones:windowed(p,1.25,2,2.5,3.1),zoom:mix(.57,1.12,ramp(p,0,2.6)),
 block:windowed(p,2.25,2.95,3.2,4.1),hero:ramp(p,2.3,3.15),tilt:ramp(p,4.5,5.45),roofLift:ramp(p,3.1,4.2),roof:1-ramp(p,4.0,4.75),existing:1-ramp(p,4.45,5.2),plan:ramp(p,3.5,4.5),proposal:ramp(p,4.75,5.5),height:mix(.32,1,ramp(p,4.7,5.6)),compare,account,
 scale:1-.30*compare-.10*account-.15*dossier,heroX:320-145*compare-115*account,
 heroY:238-57*account-34*dossier,roles,resources:roles*38,tenure:windowed(p,7.8,8.25,8.65,9.2),
 checks:windowed(p,9.65,10.15,10.6,11.0),build:ramp(p,10.25,11.6),finish,
 sale:windowed(p,11.65,12.2,12.8,13.4),dossier,close,
 thread:windowed(p,7.8,8.5,10.2,10.8),cityReturn:.14*close};
}
const api={clamp,mix,ramp,windowed,frame};
if(typeof module!=='undefined')module.exports=api;else root.YodFilmMotion=api;
})(typeof window==='undefined'?globalThis:window);
