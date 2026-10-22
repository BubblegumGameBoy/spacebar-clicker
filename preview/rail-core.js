/* A route contains only the waypoints the player chose; no pathfinder fills gaps. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RailCore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const GRID=24,MAX_SEGMENT=100,MAX_POINTS=128,STATION=8,PRICE=2;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const snap=p=>({x:Math.round(p.x/GRID)*GRID,y:Math.round(p.y/GRID)*GRID});
 const length=points=>points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);
 const cost=points=>STATION+Math.ceil(length(points)/32)*PRICE;
 function validateStep(points,point,options={}){
  if(!finite(point)||point.x<12||point.x>948||point.y<120||point.y>520)return 'bounds';
  if(!points.length)return null;
  if(points.length>=MAX_POINTS)return 'long';
  const a=points[points.length-1],d=distance(a,point);if(d<8)return 'short';if(d>MAX_SEGMENT)return 'gap';
  // Existing gathering sites are obstacles, apart from the source's loading platform.
  for(const n of options.nodes||[]){if(String(n.key)===String(options.source))continue;const w=n.type==='wood'?46:38,h=n.type==='wood'?84:46;for(let t=0;t<=1;t+=.08){const x=a.x+(point.x-a.x)*t,y=a.y+(point.y-a.y)*t;if(Math.abs(x-n.x)<w&&y>n.y-h&&y<n.y+7)return 'object';}}
  return null;
 }
 function at(points,progress){
  const total=length(points);if(!total)return points[0]||{x:0,y:0};let remaining=Math.max(0,Math.min(1,progress))*total;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=distance(a,b);if(remaining<=d)return {x:a.x+(b.x-a.x)*remaining/d,y:a.y+(b.y-a.y)*remaining/d};remaining-=d;}return points[points.length-1];
 }
 return {GRID,MAX_SEGMENT,MAX_POINTS,STATION,PRICE,snap,length,cost,validateStep,at};
});
