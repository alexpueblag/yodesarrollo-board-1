(function(root){'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
function act(p){p=clamp(p);return p<.125?0:p<.5?1:p<.875?2:3;}
function state(p){p=clamp(p);return {p,act:act(p),stage:Math.min(7,Math.floor(p*8)),map:1-smooth(.47,.57,p),blocks:smooth(.47,.57,p),housing:smooth(.75,.86,p),comparison:smooth(.875,.94,p),criteria:[smooth(.11,.16,p),smooth(.235,.285,p),smooth(.36,.41,p)],trace:.08+.92*smooth(0,.08,p)};}
function homeLayout(count,side){if(!Number.isInteger(count)||count<1||count>8)throw Error('Invalid unit count');const cols=side==='B'&&count<=4?count:Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/cols),scale=Math.min(1,3/cols,2/rows);return Array.from({length:count},(_,i)=>({index:i,x:(side==='A'?210:630)+(i%cols)*85*scale,y:280+Math.floor(i/cols)*92*scale,scale}));}
function curve(tail,head,width){const dx=head.x-tail.x,dy=head.y-tail.y,bend=Math.min(width*.13,55);return 'M'+tail.x+' '+tail.y+' C'+(tail.x+bend)+' '+(tail.y+Math.min(25,dy*.1))+' '+(tail.x+dx*.35)+' '+(head.y+35)+' '+(tail.x+dx*.6)+' '+(head.y+18)+' S'+(head.x-bend*.6)+' '+(head.y-10)+' '+head.x+' '+head.y;}
function interpolate(p,anchors){p=clamp(p);const i=Math.min(anchors.length-2,Math.floor(p*(anchors.length-1))),t=smooth(0,1,p*(anchors.length-1)-i);return {x:anchors[i].x+(anchors[i+1].x-anchors[i].x)*t,y:anchors[i].y+(anchors[i+1].y-anchors[i].y)*t};}
function headAt(p,points){p=clamp(p);return p<=.875?interpolate(p/.875,points.slice(0,8)):interpolate((p-.875)/.125,[points[7],points[8],points[9]]);}
const api={headAt,clamp,smooth,act,state,homeLayout,curve,interpolate};if(typeof module!=='undefined')module.exports=api;root.YodThreadCore=api;
})(typeof window==='undefined'?globalThis:window);
