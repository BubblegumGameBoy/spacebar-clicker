/* A flat, expandable worksite. Original coordinates remain valid. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WORLD=Object.freeze({width:1600,height:900,home:Object.freeze({x:100,y:340}),entryX:925,turnX:190,upper:185,lower:435});
 const HOLES=Object.freeze([{id:'north',lane:'upper',x:925,y:185,name:['北の巣穴','North burrow','北部巢穴']},{id:'south',lane:'lower',x:925,y:435,name:['南の巣穴','South burrow','南部巢穴']},{id:'east-north',lane:'upper',x:1450,y:185,name:['東の北穴','Far north burrow','东部北穴']},{id:'east-south',lane:'lower',x:1450,y:435,name:['東の南穴','Far south burrow','东部南穴']}].map(Object.freeze));
 const EXTRA_SOURCES=Object.freeze([{type:'wood',x:1120,y:580},{type:'wood',x:1430,y:740},{type:'stone',x:1100,y:815},{type:'stone',x:1470,y:555}].map(Object.freeze));
 const hole=id=>HOLES.find(h=>h.id===id)||HOLES[0];
 function sourceFor(wave,lane,index){const far=wave>=7?index%2===1:wave>=4&&index%3===2;return HOLES.find(h=>h.lane===lane&&h.id.startsWith('east-')===far);}
 function expand(factory,camp){if(!factory||!camp||camp.fieldVersion===1)return false;
  factory.width=WORLD.width;factory.height=WORLD.height;factory.next=Math.max(factory.next||1,...factory.nodes.map(n=>Number(n.key)+1));
  for(const p of EXTRA_SOURCES)if(!factory.nodes.some(n=>n.type===p.type&&Math.hypot(n.x-p.x,n.y-p.y)<1))factory.nodes.push({key:factory.next++,type:p.type,x:p.x,y:p.y,stock:300,radius:p.type==='wood'?16:19,regrow:0,work:0});
  camp.fieldVersion=1;return true;
 }
 const IRON_SOURCES=Object.freeze([{x:1240,y:655},{x:1480,y:815}].map(Object.freeze));
 function revealOre(factory,camp){if(!factory||!camp?.oreMining||camp.oreVersion===1)return false;factory.next=Math.max(factory.next||1,...factory.nodes.map(n=>Number(n.key)+1));for(const p of IRON_SOURCES)if(!factory.nodes.some(n=>n.type==='iron'&&Math.hypot(n.x-p.x,n.y-p.y)<1))factory.nodes.push({key:factory.next++,type:'iron',x:p.x,y:p.y,stock:120,radius:19,regrow:0,work:0});factory.inventory.iron=Number.isFinite(factory.inventory.iron)?factory.inventory.iron:0;camp.oreVersion=1;return true;}
 function forecast(plan,state){return HOLES.map(h=>{const complete=state?.completed&&state.phase==='result'&&state.result?.win,list=complete?[]:plan.spawns.filter(e=>(e.holeId||((e.lane==='upper'?'north':'south')))===h.id),next=list.filter(e=>state?.phase!=='active'||e.spawnIndex>=state.spawned),first=next.length?Math.min(...next.map(e=>e.at)):null;
  return {id:h.id,count:list.length,remaining:next.length,kinds:[...new Set(list.map(e=>e.kind))],firstAt:first,seconds:first===null?null:Math.max(0,state?.phase==='active'?first-state.elapsed:(state?.prepRemaining||0)+first),held:state?.held===true};});}
 return {WORLD,HOLES,EXTRA_SOURCES,IRON_SOURCES,revealOre,hole,sourceFor,expand,forecast};
});
