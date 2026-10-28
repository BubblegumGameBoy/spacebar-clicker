/* Hand tools act on existing loose objects. No inventory grants or position teleporting. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./materials-core.js'):root.MaterialsCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.GadgetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Materials){
 'use strict';
 const MATERIALS=Materials.definitions;
 const COST=Object.freeze({wood:6,stone:2}),COSTS=Object.freeze({broom:COST,magnet:Object.freeze({wood:10,stone:6})});
 const effects=(camp,kind='broom')=>kind==='magnet'?{radius:camp?.magnetHead?125:85,strength:camp?.magnetHead?460:300,maxSpeed:camp?.magnetHead?180:130}:{radius:camp?.broomHead?44:30,strength:camp?.broomHead?1.55:1,maxSpeed:260};
 const mass=d=>(MATERIALS[d?.type]?.mass||3)*Math.max(1,Number(d?.count)||1);
 function quote(S,kind='broom'){const cost=COSTS[kind];if(!cost)return {owned:false,locked:true,ready:false,cost:{},missing:{}};const stock=S.factory?.inventory||{},owned=S.camp?.[kind]===true,locked=!S.progression?.recipes?.includes(kind),missing=Object.fromEntries(Object.entries(cost).map(([type,n])=>[type,Math.max(0,n-(stock[type]||0))]));return {owned,locked,cost,missing,ready:!!S.camp&&!owned&&!locked&&!Object.values(missing).some(Boolean)};}
 function build(S,kind='broom'){const q=quote(S,kind);if(!q.ready)return false;for(const [type,n]of Object.entries(q.cost))S.factory.inventory[type]-=n;S.camp[kind]=true;return true;}
 function sweep(items,a,b,seconds=.02,fx=effects(),eligible=()=>true){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length<1||!Number.isFinite(seconds)||seconds<=0)return {moved:0,heavy:0};
  const ux=dx/length,uy=dy/length,impulse=Math.min(150,length/Math.max(.012,seconds)*.22)*fx.strength;let moved=0,heavy=0;
  for(const d of items){if(!eligible(d)||d.anchored===true||!Number.isFinite(d.count)||d.count<=0||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!MATERIALS[d.type])continue;const t=Math.max(0,Math.min(1,((d.x-a.x)*dx+(d.y-a.y)*dy)/(length*length))),distance=Math.hypot(d.x-a.x-dx*t,d.y-a.y-dy*t);if(distance>fx.radius)continue;
   const push=impulse*(1-.55*distance/fx.radius)/mass(d);if(push<1)continue;let vx=(d.vx||0)+ux*push,vy=(d.vy||0)+uy*push;const speed=Math.hypot(vx,vy),cap=fx.maxSpeed/Math.sqrt(Math.max(1,mass(d))),scale=speed>cap?cap/speed:1;d.vx=vx*scale;d.vy=vy*scale;d.physical=true;d.swept=true;d.manualTool='broom';moved++;if(mass(d)>1)heavy++;
  }return {moved,heavy};
 }
 function pull(items,point,seconds,fx=effects(null,'magnet'),eligible=()=>true){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(seconds)||seconds<=0)return {moved:0};const dt=Math.min(.05,seconds);let moved=0;
  for(const d of items){if(!MATERIALS[d.type]?.magnetic||d.anchored===true||!Number.isFinite(d.count)||d.count<=0||!eligible(d))continue;const dx=point.x-d.x,dy=point.y-d.y,distance=Math.hypot(dx,dy);if(!Number.isFinite(distance)||distance<8||distance>fx.radius)continue;
   const impulse=fx.strength*(.65+.35*(1-distance/fx.radius))*dt/mass(d),vx=(d.vx||0)+dx/distance*impulse,vy=(d.vy||0)+dy/distance*impulse,speed=Math.hypot(vx,vy),scale=speed>fx.maxSpeed?fx.maxSpeed/speed:1;d.vx=vx*scale;d.vy=vy*scale;d.physical=true;d.swept=true;d.manualTool='magnet';d.magnetPull=true;moved++;
  }return {moved};
 }
 return {MATERIALS,COST,COSTS,effects,mass,quote,build,sweep,pull};
});
