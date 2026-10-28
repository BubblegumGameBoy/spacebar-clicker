/* Ground physics for loose items: blowers push, fences guide, nothing is random.
   Pure functions. Items never collide with each other (N^2 and unstable results). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GroundPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const DT=1/30;
 // Provisional values chosen with tools/sim_ground_logistics.cjs (see dev/M3_PHYSICS_NOTES.md).
 const PARAMS=Object.freeze({
  blowerRadius:90,      // fan radius (px)
  blowerAngle:50,       // full fan angle (deg)
  blowerAccel:600,      // push (px/s^2) at the blower; falls off linearly to blowerFalloff at the rim
  blowerFalloff:.45,    // share of the push left at the rim
  blowerBody:12,        // the box itself is a small solid circle
  dragLinear:0.4,       // per second, proportional to speed
  dragConstant:30,      // px/s^2, ground friction
  stopSpeed:6,          // below this (and outside every fan) the item rests
  itemRadius:6,         // items are points inflated by this radius against walls
  fenceHalf:2,          // half thickness of a fence
  receiveRadius:60,     // same as the belt arrival check (ConveyorCore: distance to HOME < 60)
  maxSubstep:3,         // px per collision sub-step (no tunnelling through 4px fences)
  boostFactor:2,boostSeconds:3,boostExtend:1,boostMax:5,
  // M4 hopper: draws loose items within its radius (not from the outlet side) one at a time, and lets them out
  // of the outlet every hopperInterval seconds. It never merges, creates or removes items.
  hopperRadius:60,hopperBody:14,hopperFrontCos:.5,hopperMouth:24,hopperExit:70,hopperInterval:.6,hopperPull:150
 });
 const DIRS=Object.freeze(Array.from({length:8},(_,k)=>Object.freeze({x:Math.round(Math.cos(k*Math.PI/4)*1e9)/1e9,y:Math.round(Math.sin(k*Math.PI/4)*1e9)/1e9})));// 0=E, clockwise on screen (y down)
 const FENCE_MIN=24,FENCE_MAX=120,FENCE_UNIT=24;
 const HOME={x:100,y:340};
 // Solid parts of the house: the roof/back, and the strip under the warehouse card. The receiving circle (r60)
 // is checked before walls, so items entering it from the field are received; others slide along the roof
 // or the card's lower edge instead of coming to rest where the card would hide them.
 // The crates beside the door (drawn by Outpost at home.x+36..+106) receive too: a log that stops against them
 // reads as delivered to a player, and the field side of the house is otherwise only the 60px circle.
 const PORCH=Object.freeze({left:130,right:212,top:326,bottom:358});
 const HOUSE=Object.freeze([Object.freeze({left:42,right:158,top:246,bottom:300}),Object.freeze({left:36,right:164,top:392,bottom:432})]);
 const finite=Number.isFinite,hyp=Math.hypot;

 function normalizeWorld(raw={}){
  const params={...PARAMS,...(raw.params||{})};
  const nodes=(raw.nodes||[]).filter(n=>finite(n?.x)&&finite(n?.y)).map(n=>({x:n.x,y:n.y,r:finite(n.radius)?n.radius:n.type==='stone'?19:16}));
  const fences=(raw.fences||[]).filter(f=>f&&finite(f.a?.x)&&finite(f.b?.y)&&finite(f.a?.y)&&finite(f.b?.x)).map(f=>({a:{x:f.a.x,y:f.a.y},b:{x:f.b.x,y:f.b.y}}));
  const blowers=(raw.blowers||[]).filter(b=>finite(b?.x)&&finite(b?.y)).map(b=>({x:b.x,y:b.y,dir:((Math.floor(b.dir)||0)%8+8)%8,boostUntil:finite(b.boostUntil)?b.boostUntil:-Infinity}));
  const hoppers=(raw.hoppers||[]).filter(h=>finite(h?.x)&&finite(h?.y)).map(h=>({x:h.x,y:h.y,dir:((Math.floor(h.dir)||0)%8+8)%8,key:h.key??null}));
  const home=finite(raw.home?.x)&&finite(raw.home?.y)?{x:raw.home.x,y:raw.home.y}:{...HOME};
  const shift=r=>({left:r.left+home.x-HOME.x,right:r.right+home.x-HOME.x,top:r.top+home.y-HOME.y,bottom:r.bottom+home.y-HOME.y});
  const house=raw.house===null?[]:raw.house?[].concat(raw.house):HOUSE.map(shift),porch=raw.porch===null?null:raw.porch||shift(PORCH);
  const bounds=raw.bounds||{left:8,top:96,right:(raw.width||960)-8,bottom:(raw.height||540)-8};
  const cos=Math.cos(params.blowerAngle*Math.PI/360);
  return {params,nodes,fences,blowers,hoppers,home,house,porch,bounds,cosHalf:cos,belt:typeof raw.belt==='function'?raw.belt:null,normalized:true};
 }
 const world=w=>w&&w.normalized?w:normalizeWorld(w);

 // ---- blower ----
 function boostFactor(blower,now,params=PARAMS){return finite(now)&&finite(blower?.boostUntil)&&now<blower.boostUntil?params.boostFactor:1;}
 // Returns the new boostUntil. First press: 3s. Presses while active: +1s, never more than 5s ahead.
 function tapBlower(blower,now,params=PARAMS){
  if(!finite(now))return blower?.boostUntil??-Infinity;
  const until=finite(blower?.boostUntil)?blower.boostUntil:-Infinity;
  return now<until?Math.min(now+params.boostMax,until+params.boostExtend):now+params.boostSeconds;
 }
 function inFan(blower,p,w){
  const P=w.params,dx=p.x-blower.x,dy=p.y-blower.y,d=hyp(dx,dy);if(d>P.blowerRadius||d<1e-6)return 0;
  const dir=DIRS[blower.dir];if((dx*dir.x+dy*dir.y)/d<w.cosHalf)return 0;return d;
 }
 // Push away from the blower (radial), so fan edges spread and leave room for fences.
 function accelAt(raw,p,now=0){
  const w=world(raw),P=w.params;let ax=0,ay=0;
  for(const b of w.blowers){const d=inFan(b,p,w);if(!d)continue;const a=P.blowerAccel*(1-(1-P.blowerFalloff)*d/P.blowerRadius)*boostFactor(b,now,P);ax+=(p.x-b.x)/d*a;ay+=(p.y-b.y)/d*a;}
  return {x:ax,y:ay};
 }

 // ---- collision ----
 function pushOut(p,v,nx,ny,depth){p.x+=nx*depth;p.y+=ny*depth;const into=v.x*nx+v.y*ny;if(into<0){v.x-=into*nx;v.y-=into*ny;}}
 function collideCircle(p,v,c,r){const dx=p.x-c.x,dy=p.y-c.y;if(dx*dx+dy*dy>=r*r)return;const d=hyp(dx,dy);if(d>=r)return;if(d<1e-9){pushOut(p,v,0,-1,r);return;}pushOut(p,v,dx/d,dy/d,r-d);}
 function closestOnSegment(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return {x:a.x+dx*t,y:a.y+dy*t,t};}
 function collideSegment(p,v,f,r){
  if(p.x<Math.min(f.a.x,f.b.x)-r||p.x>Math.max(f.a.x,f.b.x)+r||p.y<Math.min(f.a.y,f.b.y)-r||p.y>Math.max(f.a.y,f.b.y)+r)return;
  const q=closestOnSegment(f.a,f.b,p),dx=p.x-q.x,dy=p.y-q.y,d=hyp(dx,dy);if(d>=r)return;
  if(d<1e-9){const lx=f.b.x-f.a.x,ly=f.b.y-f.a.y,l=hyp(lx,ly)||1;let nx=-ly/l,ny=lx/l;if(v.x*nx+v.y*ny>0){nx=-nx;ny=-ny;}pushOut(p,v,nx,ny,r);return;}
  pushOut(p,v,dx/d,dy/d,r-d);
 }
 function collideRect(p,v,b,r){
  if(p.x<b.left-r||p.x>b.right+r||p.y<b.top-r||p.y>b.bottom+r)return;
  const cx=Math.max(b.left,Math.min(b.right,p.x)),cy=Math.max(b.top,Math.min(b.bottom,p.y)),dx=p.x-cx,dy=p.y-cy,d=hyp(dx,dy);
  if(d>0){if(d<r)pushOut(p,v,dx/d,dy/d,r-d);return;}
  // Inside: leave by the nearest edge.
  const e=[[p.x-b.left,-1,0],[b.right-p.x,1,0],[p.y-b.top,0,-1],[b.bottom-p.y,0,1]].sort((m,n)=>m[0]-n[0])[0];pushOut(p,v,e[1],e[2],e[0]+r);
 }
 function collide(w,p,v){
  const P=w.params,r=P.itemRadius;
  for(let pass=0;pass<2;pass++){
   for(const n of w.nodes)collideCircle(p,v,n,n.r+r);
   for(const b of w.blowers)collideCircle(p,v,b,P.blowerBody+r);
   for(const h of w.hoppers)collideCircle(p,v,h,P.hopperBody+r);
   for(const f of w.fences)collideSegment(p,v,f,P.fenceHalf+r);
   for(const h of w.house)collideRect(p,v,h,r);
  }
  const B=w.bounds;if(p.x<B.left){p.x=B.left;if(v.x<0)v.x=0;}if(p.x>B.right){p.x=B.right;if(v.x>0)v.x=0;}if(p.y<B.top){p.y=B.top;if(v.y<0)v.y=0;}if(p.y>B.bottom){p.y=B.bottom;if(v.y>0)v.y=0;}
 }
 // ---- hopper ----
 // The hopper (index) that draws an item at p: inside its radius and not on its outlet side; nearest wins.
 function hopperAt(raw,p){const w=world(raw),P=w.params;let best=-1,bd=Infinity;
  for(let i=0;i<w.hoppers.length;i++){const h=w.hoppers[i],dx=p.x-h.x,dy=p.y-h.y,d=hyp(dx,dy);if(d>P.hopperRadius||d>=bd)continue;const o=DIRS[h.dir];if(d>1e-6&&(dx*o.x+dy*o.y)/d>P.hopperFrontCos)continue;best=i;bd=d;}
  return best;}
 // Where an item leaves a hopper, and with what speed (along the outlet direction).
 function hopperOutlet(h,params=PARAMS){const o=DIRS[((h.dir|0)%8+8)%8];return {x:h.x+o.x*params.hopperMouth,y:h.y+o.y*params.hopperMouth,vx:o.x*params.hopperExit,vy:o.y*params.hopperExit};}
 // One fixed step of every hopper. states[i] belongs to world.hoppers[i]: {pull,inside,lastOut} (runtime only).
 // eligible(item): a loose item the hopper may take (not held, airborne or on a belt); held(item): a hand took it
 // back from the hopper. Items are moved, never merged, created or removed.
 // Order: the pulled item moves to the mouth; when the hopper is empty it drops inside; an item inside leaves by
 // the outlet once hopperInterval has passed since the previous one; then the nearest waiting item is chosen.
 // Successive items leave a few px apart across the outlet and a little faster/slower (fixed order, no randomness),
 // so single logs at rest never stack into what looks like one log. The preview uses the centre and the mean speed.
 const HOPPER_SIDE=Object.freeze([0,-5,5,-2.5,2.5]),HOPPER_PACE=Object.freeze([1,.86,1.14,.93,1.07]);
 function hopperStep(raw,states,items,now,dt=DT,eligible=()=>true,held=()=>false){
  const w=world(raw),P=w.params,emitted=[];
  for(let i=0;i<w.hoppers.length;i++){const h=w.hoppers[i],st=states[i]||(states[i]={pull:null,inside:null,lastOut:-Infinity});
   for(const slot of ['pull','inside'])if(st[slot]&&(!items.includes(st[slot])||held(st[slot])||st[slot].hopperKey!==(h.key??i))){if(st[slot].hopperKey===(h.key??i))delete st[slot].hopperKey;st[slot]=null;}
   if(st.pull){const d=st.pull,dx=h.x-d.x,dy=h.y-d.y,dist=hyp(dx,dy),m=P.hopperPull*dt;d.vx=0;d.vy=0;if(dist<=m+1e-9){d.x=h.x;d.y=h.y;if(!st.inside){st.inside=d;st.pull=null;}}else{d.x+=dx/dist*m;d.y+=dy/dist*m;}}
   if(st.inside&&now>=st.lastOut+P.hopperInterval-1e-9){const d=st.inside,o=hopperOutlet(h,P),k=(st.n=(st.n||0)+1)%HOPPER_SIDE.length,side=HOPPER_SIDE[k],q=DIRS[h.dir];d.x=o.x-q.y*side;d.y=o.y+q.x*side;d.vx=o.vx*HOPPER_PACE[k];d.vy=o.vy*HOPPER_PACE[k];delete d.hopperKey;st.inside=null;st.lastOut=now;emitted.push({item:d,hopper:i});}
   if(!st.pull){let best=null,bd=Infinity;for(const d of items){if(d.hopperKey!=null)continue;const dd=hyp(d.x-h.x,d.y-h.y);if(dd>P.hopperRadius||dd>bd)continue;if(hopperAt(w,d)!==i||!eligible(d))continue;if(dd<bd||(Number(d.key)||0)<(Number(best.key)||0)){best=d;bd=dd;}}
    if(best){best.hopperKey=h.key??i;best.vx=0;best.vy=0;st.pull=best;}}
  }
  return {emitted};
 }
 const received=(w,p)=>hyp(p.x-w.home.x,p.y-w.home.y)<w.params.receiveRadius||!!w.porch&&p.x>=w.porch.left&&p.x<=w.porch.right&&p.y>=w.porch.top&&p.y<=w.porch.bottom;

 // One fixed step for one item. Returns a new object; the input is not changed.
 // status: 'delivered' | 'belt' (hand to ConveyorCore.step) | 'moving' | 'rest'
 function step(raw,item,now=0,dt=DT){
  const w=world(raw),P=w.params,p={x:item.x,y:item.y},v={x:finite(item.vx)?item.vx:0,y:finite(item.vy)?item.vy:0};
  // A held magnet is a continuous force. Let its small per-frame impulses build
  // against friction instead of discarding them at the resting speed threshold.
  const a=accelAt(w,p,now),pushed=a.x!==0||a.y!==0||item.magnetPull===true;
  // A resting, unpushed item never acts on its own (an old pile beside the house is not auto-delivered).
  if(!pushed&&v.x===0&&v.y===0){if(w.hoppers.length&&!(w.belt&&w.belt(p))){const k=hopperAt(w,p);if(k>=0)return {x:p.x,y:p.y,vx:0,vy:0,status:'hopper',hopper:k};}return {x:p.x,y:p.y,vx:0,vy:0,status:'rest'};}
  if(received(w,p))return {x:p.x,y:p.y,vx:0,vy:0,status:'delivered'};
  if(w.belt&&w.belt(p))return {x:p.x,y:p.y,vx:0,vy:0,status:'belt'};
  if(w.hoppers.length){const k=hopperAt(w,p);if(k>=0)return {x:p.x,y:p.y,vx:0,vy:0,status:'hopper',hopper:k};}
  v.x+=a.x*dt;v.y+=a.y*dt;
  const s=hyp(v.x,v.y),s2=Math.max(0,s*(1-P.dragLinear*dt)-P.dragConstant*dt);
  if(s2<P.stopSpeed&&!pushed)return {x:p.x,y:p.y,vx:0,vy:0,status:'rest'};
  if(s>0){v.x*=s2/s;v.y*=s2/s;}
  const n=Math.max(1,Math.min(24,Math.ceil(s2*dt/P.maxSubstep))),h=dt/n;
  for(let i=0;i<n;i++){
   p.x+=v.x*h;p.y+=v.y*h;
   if(received(w,p))return {x:p.x,y:p.y,vx:0,vy:0,status:'delivered'};
   collide(w,p,v);
   if(w.belt&&w.belt(p))return {x:p.x,y:p.y,vx:0,vy:0,status:'belt'};
   if(w.hoppers.length){const k=hopperAt(w,p);if(k>=0)return {x:p.x,y:p.y,vx:0,vy:0,status:'hopper',hopper:k};}
  }
  // Held against a wall or the screen edge inside a fan: no movement and no speed left, so it rests
  // (nothing to save, and the preview stops here exactly like the live item).
  if(Math.abs(p.x-item.x)<1e-3&&Math.abs(p.y-item.y)<1e-3&&hyp(v.x,v.y)<P.stopSpeed)return {x:p.x,y:p.y,vx:0,vy:0,status:'rest',pinned:pushed};
  return {x:p.x,y:p.y,vx:v.x,vy:v.y,status:'moving'};
 }
 // Advance many items in place by one fixed step. Delivered/belt items are reported, not removed.
 function stepAll(raw,items,now=0,dt=DT,skip=null){
  const w=world(raw),delivered=[],belt=[],hopper=[];let moving=0;
  for(const item of items){if(skip&&skip(item))continue;const next=step(w,item,now,dt);item.x=next.x;item.y=next.y;item.vx=next.vx;item.vy=next.vy;
   if(next.status==='delivered')delivered.push(item);else if(next.status==='belt')belt.push(item);else if(next.status==='hopper')hopper.push({item,hopper:next.hopper});else if(next.status==='moving')moving++;}
  return {delivered,belt,hopper,moving};
 }
 // Frame-rate independent driver: returns how many fixed steps to run and the leftover time.
 function fixedSteps(accumulator,frameDt,dt=DT,maxSteps=8){const total=Math.max(0,(finite(accumulator)?accumulator:0)+(finite(frameDt)?Math.min(frameDt,.25):0));const steps=Math.min(maxSteps,Math.floor(total/dt+1e-9));return {steps,rest:steps>=maxSteps?0:total-steps*dt};}

 // ---- prediction ----
 // Same fixed step as live items. Boost is player-driven, so the default preview assumes none.
 function predict(raw,start,opts={}){
  const w=world(raw),now=finite(opts.now)?opts.now:0,maxSteps=opts.maxSteps||900,path=[{x:start.x,y:start.y}];
  let item={x:start.x,y:start.y,vx:start.vx||0,vy:start.vy||0},still=0,hops=0;const via=[];
  for(let i=1;i<=maxSteps;i++){
   const next=step(w,item,opts.boost?now+i*DT:-Infinity,DT);
   // A hopper takes the item and lets it out of its outlet (queue time is not modelled: it changes when, not where).
   if(next.status==='hopper'){const h=w.hoppers[next.hopper],o=hopperOutlet(h,w.params);via.push(next.hopper);path.push({x:h.x,y:h.y},{x:o.x,y:o.y});if(++hops>12)return {status:'stopped',looped:true,end:{x:h.x,y:h.y},steps:i,time:i*DT,path,via};item={x:o.x,y:o.y,vx:o.vx,vy:o.vy};still=0;continue;}
   path.push({x:next.x,y:next.y});
   const extra=via.length?{via}:{};
   if(next.status==='delivered')return {status:'warehouse',end:{x:next.x,y:next.y},steps:i,time:i*DT,path,...extra};
   if(next.status==='belt')return {status:'belt',end:{x:next.x,y:next.y},steps:i,time:i*DT,path,...extra};
   if(next.status==='rest')return {status:'stopped',...(next.pinned?{pinned:true}:{}),end:{x:next.x,y:next.y},steps:i,time:i*DT,path,...extra};
   // Pinned against a wall inside a fan: it never moves again, so it stops here.
   still=hyp(next.x-item.x,next.y-item.y)<.02?still+1:0;if(still>=15)return {status:'stopped',pinned:true,end:{x:next.x,y:next.y},steps:i,time:i*DT,path,...extra};
   item=next;
  }
  return {status:'timeout',end:{x:item.x,y:item.y},steps:maxSteps,time:maxSteps*DT,path};
 }
 // Shape signature: what can change a non-boosted trajectory. Boost times are excluded.
 function signature(raw){const w=world(raw);return JSON.stringify([w.params,w.nodes,w.fences,w.blowers.map(b=>[b.x,b.y,b.dir]),w.hoppers.map(h=>[h.x,h.y,h.dir]),w.home,w.house,w.porch,w.bounds]);}
 function createPredictor(limit=256){
  let key='',cache=new Map(),hits=0,misses=0;
  return {
   // opts.shapeKey: the caller's description of what world.belt reads (e.g. camp.links + platforms).
   // Without it a belt callback is opaque, so nothing is cached.
   predict(raw,start,opts={}){if(opts.boost)return predict(raw,start,opts);const w=world(raw),cacheable=!w.belt||typeof opts.shapeKey==='string',sig=signature(w)+'|'+(opts.shapeKey||'');if(sig!==key||!cacheable){key=cacheable?sig:'';cache=new Map();}
    const k=Math.round(start.x*100)+':'+Math.round(start.y*100)+':'+(start.vx||0)+':'+(start.vy||0);
    if(cacheable&&cache.has(k)){hits++;return cache.get(k);}misses++;const r=predict(w,start,opts);if(cacheable){if(cache.size>=limit)cache.clear();cache.set(k,r);}return r;},
   clear(){key='';cache=new Map();},get stats(){return {hits,misses,size:cache.size};}
  };
 }

 // ---- drop points (deterministic scatter, no random) ----
 // Hand harvest: the n-th piece from a node lands on one of 3..5 spots around outputPort.
 const HAND_SPOTS=Object.freeze([{x:0,y:0},{x:34,y:-20},{x:20,y:26},{x:-24,y:20},{x:50,y:4}]);
 // Woodcutter output: a tighter cluster around outputForWorker (so a blower is not all-or-nothing).
 const WORKER_SPOTS=Object.freeze([{x:0,y:0},{x:-6,y:8},{x:7,y:-6},{x:-2,y:-10},{x:9,y:5},{x:-9,y:-3},{x:3,y:11},{x:2,y:26}]);// the 8th log rolls a little further
 const STRIDE=[0,0,0,2,3,2,5,3,3];// coprime with the count, so consecutive pieces jump between spots
 function scatterIndex(index,count,max=8){const i=Math.max(0,Math.floor(finite(index)?index:0)),c=Math.max(3,Math.min(max,Math.floor(count)||4));return (i*STRIDE[c])%c;}
 function handDropPoint(node,index,count=4){const k=scatterIndex(index,count,5),o=HAND_SPOTS[k];return {x:node.x+72+o.x,y:node.y+28+o.y,spot:k};}
 function workerDropPoint(base,index,count=8){const k=scatterIndex(index,count,8),o=WORKER_SPOTS[k];return {x:base.x+o.x,y:base.y+o.y,spot:k};}

 // ---- fences ----
 const fenceLength=f=>hyp(f.b.x-f.a.x,f.b.y-f.a.y);
 const fenceValid=f=>!!f&&fenceLength(f)>=FENCE_MIN-1e-9&&fenceLength(f)<=FENCE_MAX+1e-9;
 const fenceCost=f=>Math.max(1,Math.ceil((fenceLength(f)-.001)/FENCE_UNIT));
 // Clamp a dragged fence to the allowed length along the drag direction.
 function clampFence(a,b){const d=hyp(b.x-a.x,b.y-a.y);if(d<1e-9)return {a:{...a},b:{x:a.x+FENCE_MIN,y:a.y}};const l=Math.max(FENCE_MIN,Math.min(FENCE_MAX,d));return {a:{...a},b:{x:a.x+(b.x-a.x)*l/d,y:a.y+(b.y-a.y)*l/d}};}
 // Fan polygon for drawing (apex + arc).
 function fanPoints(blower,params=PARAMS,segments=10){const d=DIRS[((blower.dir|0)%8+8)%8],base=Math.atan2(d.y,d.x),half=params.blowerAngle*Math.PI/360,out=[{x:blower.x,y:blower.y}];for(let i=0;i<=segments;i++){const a=base-half+2*half*i/segments;out.push({x:blower.x+Math.cos(a)*params.blowerRadius,y:blower.y+Math.sin(a)*params.blowerRadius});}return out;}

 return {DT,PARAMS,DIRS,HOME,HOUSE,PORCH,FENCE_MIN,FENCE_MAX,FENCE_UNIT,HAND_SPOTS,WORKER_SPOTS,normalizeWorld,boostFactor,tapBlower,accelAt,step,stepAll,fixedSteps,predict,signature,createPredictor,scatterIndex,handDropPoint,workerDropPoint,fenceLength,fenceValid,fenceCost,clampFence,fanPoints,closestOnSegment,hopperAt,hopperOutlet,hopperStep};
});
