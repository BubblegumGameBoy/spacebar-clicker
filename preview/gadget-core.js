/* Hand tools act on existing loose objects. No inventory grants or position teleporting. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GadgetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MATERIALS=Object.freeze({wood:Object.freeze({mass:1}),stone:Object.freeze({mass:2.5}),food:Object.freeze({mass:.6})});
 const COST=Object.freeze({wood:6,stone:2});
 const effects=camp=>({radius:camp?.broomHead?44:30,strength:camp?.broomHead?1.55:1,maxSpeed:260});
 const mass=d=>(MATERIALS[d?.type]?.mass||3)*Math.max(1,Number(d?.count)||1);
 function quote(S){const stock=S.factory?.inventory||{},owned=S.camp?.broom===true,locked=!S.progression?.recipes?.includes('broom'),missing={wood:Math.max(0,COST.wood-(stock.wood||0)),stone:Math.max(0,COST.stone-(stock.stone||0))};return {owned,locked,cost:COST,missing,ready:!owned&&!locked&&!Object.values(missing).some(Boolean)};}
 function build(S){const q=quote(S);if(!q.ready)return false;S.factory.inventory.wood-=COST.wood;S.factory.inventory.stone-=COST.stone;S.camp.broom=true;return true;}
 function sweep(items,a,b,seconds=.02,fx=effects(),eligible=()=>true){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length<1||!Number.isFinite(seconds)||seconds<=0)return {moved:0,heavy:0};
  const ux=dx/length,uy=dy/length,impulse=Math.min(150,length/Math.max(.012,seconds)*.22)*fx.strength;let moved=0,heavy=0;
  for(const d of items){if(!eligible(d)||d.anchored===true||!Number.isFinite(d.count)||d.count<=0||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!MATERIALS[d.type])continue;const t=Math.max(0,Math.min(1,((d.x-a.x)*dx+(d.y-a.y)*dy)/(length*length))),distance=Math.hypot(d.x-a.x-dx*t,d.y-a.y-dy*t);if(distance>fx.radius)continue;
   const push=impulse*(1-.55*distance/fx.radius)/mass(d);if(push<1)continue;let vx=(d.vx||0)+ux*push,vy=(d.vy||0)+uy*push;const speed=Math.hypot(vx,vy),cap=fx.maxSpeed/Math.sqrt(Math.max(1,mass(d))),scale=speed>cap?cap/speed:1;d.vx=vx*scale;d.vy=vy*scale;d.physical=true;d.swept=true;moved++;if(mass(d)>1)heavy++;
  }return {moved,heavy};
 }
 return {MATERIALS,COST,effects,mass,quote,build,sweep};
});
