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
 // Wooden conveyor (M4): one belt is at most MAX_LENGTH long; farther routes join two belts.
 const MAX_LENGTH=240;
 function stretch(points,p,maxLength=Infinity){const end=points.at(-1);let d=distance(end,p),capped=false;
  if(Number.isFinite(maxLength)){const room=maxLength-length(points);if(room<.5)return points;if(d>room){p={x:end.x+(p.x-end.x)*room/d,y:end.y+(p.y-end.y)*room/d};d=room;capped=true;}}
  if(d<10&&!capped)return points;const steps=Math.max(1,Math.ceil(d/20)),out=points.slice();for(let i=1;i<=steps;i++)out.push({x:end.x+(p.x-end.x)*i/steps,y:end.y+(p.y-end.y)*i/steps});return out.slice(0,128);}
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
 // Reference version (M1-M3): steps the whole route. deliveryStatus below gives the same answers from a belt graph.
 function deliveryStatusLegacy(links,platforms,point,speed=SPEED){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!contact(links,point)&&!platformAt(platforms,point))return 'manual';
  if(!Number.isFinite(speed)||speed<=0)return 'unknown';
  const distance=links.reduce((n,l)=>n+length(oriented(l)),0)+platforms.reduce((n,p)=>n+2*Math.hypot(p.w,p.h),0)+WIDTH*links.length+100;
  const probe=dt=>{let item={x:point.x,y:point.y};const visited=new Set(),budget=Math.min(20000,Math.ceil(2*distance/(speed*dt))+120);
   for(let i=0;i<budget;i++){const key=[item.beltId,item.platformKey,Math.round(item.x*1000),Math.round(item.y*1000)].join(':');if(visited.has(key))return 'blocked';visited.add(key);item=step(links,platforms,item,dt,speed);if(item.arrived)return 'warehouse';if(!item.onConveyor)return 'blocked';}
   return 'unknown';};
  // Platform pickup can depend on frame size. Never promise delivery when normal frame sizes disagree.
  const results=[1/60,.05,.1].map(probe);return results.every(r=>r===results[0])?results[0]:'unknown';
 }

 // ---- M4: delivery preview from a precomputed belt graph ----
 // A loose item that rests on belt L (beltId=L, exactly on its centre line, more than 1px from L's head) can only
 // travel along L to its head, whatever the frame size: the preferred-belt contact keeps it on L. What happens at
 // the head (home / bridge to the next belt / stuck) is computed once per belt and frame size, so a new point
 // costs one or two real steps plus a lookup. Anything the graph cannot settle exactly (a platform near a head,
 // a bridge that points back along the belt, a cycle) is stepped for real, skipping straight runs along a belt.
 const PROBES=[1/60,.05,.1],CLEAN_PAD=6;
 let graphCache=null;
 function graphSignature(links,platforms,speed){let out=String(speed)+'|';for(const l of links){out+=l.nodeKey+':'+(l.kind||'')+':';for(const p of l.points||[])out+=p.x+','+p.y+';';out+='|';}out+='#';for(const p of platforms)out+=p.key+':'+p.x+','+p.y+','+p.w+','+p.h+','+(p.dir||0)+'|';return out;}
 function beltGraph(links,platforms,speed){
  const signature=graphSignature(links,platforms,speed);if(graphCache&&graphCache.signature===signature&&links.every(l=>graphCache.byKey.get(String(l.nodeKey))===l)){graphCache.links=links;graphCache.platforms=platforms;return graphCache;}
  const byKey=new Map(),pts=new Map();let unsafe=false;
  for(const l of links){if(!l.points||l.points.length<2)continue;const k=String(l.nodeKey);if(byKey.has(k))unsafe=true;byKey.set(k,l);pts.set(l,oriented(l));}
  // A belt that touches or folds back over itself can hand an item to an earlier stretch of the same belt
  // (the nearest point wins), so items on it are always stepped for real.
  const segDist=(a,b,c,d)=>{const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x),d1=cross(a,b,c),d2=cross(a,b,d),d3=cross(c,d,a),d4=cross(c,d,b);if(((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0)))return 0;const pd=(p,u,v)=>{const q=nearest([u,v],p);return q?q.distance:distance(p,u);};return Math.min(pd(a,c,d),pd(b,c,d),pd(c,a,b),pd(d,a,b));};
  const tangledMemo=new Map(),tangled=l=>{if(tangledMemo.has(l))return tangledMemo.get(l);const ps=pts.get(l);let bad=false;
   for(let i=1;i<ps.length&&!bad;i++){const a=ps[i-1],b=ps[i];if(i>1){const c=ps[i-2],ux=a.x-c.x,uy=a.y-c.y,vx=b.x-a.x,vy=b.y-a.y,lu=Math.hypot(ux,uy),lv=Math.hypot(vx,vy);if(lu&&lv&&(ux*vx+uy*vy)/(lu*lv)<-.999)bad=true;}
    for(let j=i+2;j<ps.length&&!bad;j++)if(segDist(a,b,ps[j-1],ps[j])<1e-3)bad=true;}
   tangledMemo.set(l,bad);return bad;};
  const near=(p,pad)=>platforms.some(a=>Math.abs(p.x-a.x)<=a.w/2+pad&&Math.abs(p.y-a.y)<=a.h/2+pad);
  const cleanMemo=new Map(),clean=l=>{if(cleanMemo.has(l))return cleanMemo.get(l);const ps=pts.get(l),h=ps[0];let ok=!near(h,CLEAN_PAD)&&!tangled(l);
   // the belt must not fold back next to its own head (a stuck item there could snap onto another part)
   if(ok){let run=0;for(let i=1;i<ps.length&&ok;i++){const a=ps[i-1],b=ps[i];const seg=distance(a,b);if(run+seg>10){const q=nearest([a,b],h);if(q&&run+q.along>10&&q.distance<=12.5)ok=false;}run+=seg;}}
   cleanMemo.set(l,ok);return ok;};
  const distanceBudget=links.reduce((n,l)=>n+length(oriented(l)),0)+platforms.reduce((n,p)=>n+2*Math.hypot(p.w,p.h),0)+WIDTH*links.length+100;
  graphCache={signature,links,platforms,speed,byKey,pts,unsafe,clean,tangled,distanceBudget,memo:PROBES.map(()=>new Map())};return graphCache;
 }
 function headFate(G,link,probe,seen){
  const memo=G.memo[probe];if(memo.has(link))return memo.get(link);if(seen.has(link))return 'sim';seen.add(link);
  const ps=G.pts.get(link),h=ps[0],sd=Math.max(0,PROBES[probe]*G.speed);let r;
  if(G.tangled(link))r='sim';
  else if(distance(h,HOME)<60)r='warehouse';
  else if(!G.clean(link))r='sim';
  else{const next=downstream(G.links,h,link);
   if(next&&next.along>1){const gap=distance(h,next),back=(next.x-h.x)*(ps[1].x-h.x)+(next.y-h.y)*(ps[1].y-h.y)>0;
    // A bridge step longer than the belt's own reach (12.5) can leave the belt mid-bridge: phase-dependent, so step it.
    if(gap>1e-6&&(back||sd>=12))r='sim';else if(gap>1e-6&&sd<gap)r='blocked';else r=headFate(G,next.link,probe,seen);}
   else r='blocked';}
  memo.set(link,r);return r;
 }
 function graphProbe(G,point,probe){
  const dt=PROBES[probe],speed=G.speed,sd=Math.max(0,dt*speed),links=G.links,platforms=G.platforms;let item={x:point.x,y:point.y};const visited=new Set(),budget=Math.min(20000,Math.ceil(2*G.distanceBudget/(speed*dt))+120);
  for(let i=0;i<budget;i++){const key=[item.beltId,item.platformKey,Math.round(item.x*1000),Math.round(item.y*1000)].join(':');if(visited.has(key))return 'blocked';visited.add(key);item=step(links,platforms,item,dt,speed);if(item.arrived)return 'warehouse';if(!item.onConveyor)return 'blocked';
   if(item.blocked||item.platformKey!=null||item.beltId==null)continue;const link=G.byKey.get(String(item.beltId));if(!link||G.tangled(link))continue;const ps=G.pts.get(link),q=nearest(ps,item);if(!q||q.distance>1e-7||q.along<=1)continue;
   const fate=headFate(G,link,probe,new Set());if(fate!=='sim')return fate;
   // Straight run along the belt: jump whole steps, keeping the last few before the head real.
   const k=Math.floor((q.along-2*sd-2)/sd);if(k>=1&&i+k<budget-1){const p=at(ps,q.along-k*sd);item={...item,x:p.x,y:p.y};i+=k;}
  }
  return 'unknown';
 }
 function deliveryStatus(links,platforms,point,speed=SPEED){
  links=links||[];platforms=platforms||[];
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!contact(links,point)&&!platformAt(platforms,point))return 'manual';
  if(!Number.isFinite(speed)||speed<=0)return 'unknown';
  const G=beltGraph(links,platforms,speed);if(G.unsafe)return deliveryStatusLegacy(links,platforms,point,speed);
  const results=PROBES.map((_,i)=>graphProbe(G,point,i));return results.every(r=>r===results[0])?results[0]:'unknown';
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

 return {hitLink,removalRefund,releaseItems,deliveryStatus,deliveryStatusLegacy,MAX_LENGTH,WIDTH,SPEED,HOME,distance,length,homeFirst,oriented,nearest,at,contact,cost,stretch,platformAt,outlet,downstream,step};
});
