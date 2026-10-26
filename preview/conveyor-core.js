/* Physical belts: only a touching item moves; path order runs from home outwards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ConveyorCore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const WIDTH=25,SPEED=45,HOME={x:100,y:340},distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),length=ps=>ps.slice(1).reduce((n,p,i)=>n+distance(ps[i],p),0);
 function homeFirst(points){return distance(points[0],HOME)<=distance(points.at(-1),HOME)?points:points.slice().reverse();}
 function nearest(points,p){let best=null,start=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(!l)continue;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(l*l))),x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(p.x-x,p.y-y);if(!best||d<best.distance)best={x,y,distance:d,along:start+l*t,segment:i};start+=l;}return best;}
 function at(points,s){s=Math.max(0,s);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=distance(a,b);if(s<=l&&l)return{x:a.x+(b.x-a.x)*s/l,y:a.y+(b.y-a.y)*s/l};s-=l;}return {...points.at(-1)};}
 const oriented=link=>link.kind==='conveyor'?link.points:homeFirst(link.points);
 function contact(links,p,radius=WIDTH/2){let hit=null;for(const link of links){if(!link.points||link.points.length<2)continue;const points=oriented(link),q=nearest(points,p);if(q&&q.distance<=radius&&(!hit||q.distance<hit.distance))hit={...q,points,link};}return hit;}
 const cost=points=>Math.max(1,Math.ceil((length(points)-.001)/48));
 function stretch(points,p){const end=points.at(-1),d=distance(end,p);if(d<10)return points;const steps=Math.ceil(d/20),out=points.slice();for(let i=1;i<=steps;i++)out.push({x:end.x+(p.x-end.x)*i/steps,y:end.y+(p.y-end.y)*i/steps});return out.slice(0,128);}
 function platformAt(platforms,p){return (platforms||[]).find(a=>Math.abs(p.x-a.x)<=a.w/2&&Math.abs(p.y-a.y)<=a.h/2)||null;}
 function outlet(a){const dirs=[[-1,0],[0,-1],[1,0],[0,1]],d=dirs[a.dir||0];return{x:a.x+d[0]*a.w/2,y:a.y+d[1]*a.h/2};}
 function downstream(links,p,exclude,radius=WIDTH){return contact(links.filter(l=>l!==exclude),p,radius);}
 function step(links,platforms,item,dt,speed=SPEED){
  const result={x:item.x,y:item.y,arrived:false,onConveyor:false,blocked:false,beltId:item.beltId||null,platformKey:null};let remaining=Math.max(0,dt*speed),visits=0,preferred=item.beltId;
  while(remaining>1e-8&&visits++<64){
   let hit=preferred?contact(links.filter(l=>String(l.nodeKey)===String(preferred)),result):null;if(!hit)hit=contact(links,result);preferred=null;
   const platform=platformAt(platforms,result);if(platform&&hit&&hit.along<1&&distance(outlet(platform),result)>1&&distance(hit.points[0],HOME)>=60)hit=null;
   // An explicitly carried belt item owns its belt at overlap; loose objects on a
   // receiving platform follow the platform's output rather than an arbitrary crossing.
   if(platform&&!hit){result.onConveyor=true;result.platformKey=platform.key;const out=outlet(platform),d=distance(result,out),move=Math.min(remaining,d);if(d>1e-8){result.x+=(out.x-result.x)*move/d;result.y+=(out.y-result.y)*move/d;remaining-=move;}if(move<d)return result;
    const next=downstream(links,out,null,WIDTH/2+1);if(!next){result.blocked=true;return result;}const gap=distance(result,next),bridge=Math.min(remaining,gap);if(gap>1e-8){result.x+=(next.x-result.x)*bridge/gap;result.y+=(next.y-result.y)*bridge/gap;remaining-=bridge;}if(bridge<gap)return result;preferred=next.link.nodeKey;result.beltId=preferred;continue;
   }
   if(!hit)return result;result.onConveyor=true;result.beltId=hit.link.nodeKey;const move=Math.min(remaining,hit.along),p=at(hit.points,hit.along-move);result.x=p.x;result.y=p.y;remaining-=move;if(move<hit.along)return result;
   if(distance(hit.points[0],HOME)<60){result.arrived=true;return result;}
   const next=downstream(links,result,hit.link);if(next&&next.along>1){const gap=distance(result,next),bridge=Math.min(remaining,gap);if(gap>1e-8){result.x+=(next.x-result.x)*bridge/gap;result.y+=(next.y-result.y)*bridge/gap;remaining-=bridge;}if(bridge<gap)return result;preferred=next.link.nodeKey;result.beltId=preferred;continue;}
   const platformNext=platformAt(platforms,result);if(platformNext){const out=outlet(platformNext);if(distance(result,out)>1){result.beltId=null; // Drop a tiny distance onto the platform interior without leaving its footprint.
     const centerDistance=distance(result,platformNext),nudge=Math.min(remaining,Math.min(2,centerDistance));if(centerDistance){result.x+=(platformNext.x-result.x)*nudge/centerDistance;result.y+=(platformNext.y-result.y)*nudge/centerDistance;remaining-=nudge;}return result;}}
   result.blocked=true;return result;
  }
  if(visits>=64)result.blocked=true;return result;
 }
 // Inspect a hypothetical loose item using the exact same directional transfer rules as live cargo.
 function deliveryStatus(links,platforms,point,speed=SPEED){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!contact(links,point)&&!platformAt(platforms,point))return 'manual';
  if(!Number.isFinite(speed)||speed<=0)return 'unknown';
  const distance=links.reduce((n,l)=>n+length(oriented(l)),0)+platforms.reduce((n,p)=>n+2*Math.hypot(p.w,p.h),0)+WIDTH*links.length+100;
  const probe=dt=>{let item={x:point.x,y:point.y};const visited=new Set(),budget=Math.min(20000,Math.ceil(2*distance/(speed*dt))+120);
   for(let i=0;i<budget;i++){const key=[item.beltId,item.platformKey,Math.round(item.x*1000),Math.round(item.y*1000)].join(':');if(visited.has(key))return 'blocked';visited.add(key);item=step(links,platforms,item,dt,speed);if(item.arrived)return 'warehouse';if(!item.onConveyor)return 'blocked';}
   return 'unknown';};
  // Platform pickup can depend on frame size. Never promise delivery when normal frame sizes disagree.
  const results=[1/60,.05,.1].map(probe);return results.every(r=>r===results[0])?results[0]:'unknown';
 }

 // Board selection. Callers give gather/drag/ally/enemy targets priority before asking.
 // Platforms are drawn above belts; among belts touched directly, the newest (drawn last) wins.
 function hitLink(links,platforms,point,tolerance=10){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;const list=platforms||[];
  for(let i=list.length-1;i>=0;i--){const a=list[i];if(Math.abs(point.x-a.x)<=a.w/2&&Math.abs(point.y-a.y)<=a.h/2)return {kind:'platform',key:a.key,platform:a,distance:0,x:point.x,y:point.y};}
  let best=null,top=null;(links||[]).forEach((link,index)=>{if(!link?.points||link.points.length<2)return;const q=nearest(link.points,point);if(!q||q.distance>Math.max(0,tolerance))return;const hit={kind:'belt',key:link.nodeKey,link,index,distance:q.distance,x:q.x,y:q.y};if(q.distance<=WIDTH/2)top=hit;if(!best||q.distance<best.distance)best=hit;});
  return top||best;
 }
 // Removal keeps the half-price rule of the workshop list.
 function removalRefund(piece){if(!piece)return {wood:0,stone:0};if(piece.kind==='platform'){const p=piece.platform||piece;return {wood:Math.max(4,Math.floor((p.costWood||0)*.5)),stone:Math.max(2,Math.floor((p.costStone||0)*.5))}; /* never below the old fixed +4/+2, even when a save lost the stored cost */}const l=piece.link||piece;return {wood:Math.floor((l.costWood||0)*.5),stone:0};}
 // Items riding a removed piece stay where they are as separate ground items (never merged or deleted).
 function releaseItems(drops,piece,links,platforms){const released=[];if(!piece)return released;
  for(const d of drops||[]){const on=piece.kind==='platform'?String(d.platformKey)===String(piece.key)||!!platformAt([piece.platform],d):String(d.beltId)===String(piece.key)||!!contact([piece.link],d);if(!on)continue;
   delete d.beltId;delete d.platformKey;delete d.conveyorBlocked;if(contact(links||[],d)||platformAt(platforms,d))continue;delete d.onConveyor;d.physical=true;released.push(d);}
  return released;
 }

 return {hitLink,removalRefund,releaseItems,deliveryStatus,WIDTH,SPEED,HOME,distance,length,homeFirst,oriented,nearest,at,contact,cost,stretch,platformAt,outlet,downstream,step};
});
