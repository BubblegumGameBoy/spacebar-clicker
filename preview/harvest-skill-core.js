/* Bounded, material-funded work skills. Saved branch levels remain compatible. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HarvestSkillCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const branches=['carry','hand','route','storage'],MAX_TIER=6;
 const prices={carry:[[10,0],[30,0],[60,0],[120,40],[240,100],[480,240]],hand:[[15,0],[35,10],[70,25],[140,60],[280,140],[560,300]],route:[[16,12],[50,35],[100,70],[200,140],[400,280],[800,560]],storage:[[8,2],[24,10],[60,25],[120,60],[240,140],[480,300]]};
 const costs=Object.fromEntries(branches.map(branch=>[branch,prices[branch].map(([wood,stone])=>({wood,stone}))]));
 const values={groundCapacity:[12,24,48,80,120,180,240],carryCapacity:[1,2,4,6,8,12,16],manualInterval:[1,.8,.6,.5,.4,.3,.25],manualHits:[1,1,1,1,1,1,1],manualYield:[1,2,3,4,5,6,8],cartSpeed:[1,1.25,1.5,1.8,2.1,2.5,3]};
 const level=n=>Number.isInteger(n)?Math.max(0,Math.min(MAX_TIER,n)):0;
 function migrate(raw){return Object.fromEntries(branches.map(id=>[id,level(raw?.[id])]));}
 function effects(raw){const s=migrate(raw);return {groundCapacity:values.groundCapacity[s.storage],carryCapacity:values.carryCapacity[s.carry],manualInterval:values.manualInterval[s.hand],manualHits:values.manualHits[s.hand],manualYield:values.manualYield[s.hand],cartSpeed:values.cartSpeed[s.route]};}
 function quote(state,id){
  const match=/^(carry|hand|route|storage)([1-6])$/.exec(String(id));if(!match)return null;
  const branch=match[1],tier=Number(match[2]),skills=migrate(state?.harvestSkills),cost={...costs[branch][tier-1]},built=skills[branch]>=tier;
  const needsPrevious=skills[branch]<tier-1,needsRail=branch==='route'&&!(state?.camp?.links?.length>0||state?.camp?.platforms?.length>0),locked=needsPrevious||needsRail;
  const inventory=state?.factory?.inventory||{},stock=type=>Number.isFinite(inventory[type])?Math.max(0,inventory[type]):0;
  const missing={wood:Math.max(0,cost.wood-stock('wood')),stone:Math.max(0,cost.stone-stock('stone'))};
  return {id,branch,tier,cost,built,locked,needsPrevious,needsRail,missing,ready:!built&&!locked&&!missing.wood&&!missing.stone};
 }
 function available(state){return branches.flatMap(branch=>Array.from({length:MAX_TIER},(_,i)=>quote(state,branch+(i+1)))).filter(q=>q.ready);}
 function purchase(state,id){const q=quote(state,id);if(!q?.ready)return false;for(const type of ['wood','stone'])if(q.cost[type])state.factory.inventory[type]-=q.cost[type];state.harvestSkills=migrate(state.harvestSkills);state.harvestSkills[q.branch]=q.tier;return true;}
 return {branches,MAX_TIER,costs,migrate,effects,quote,purchase,available};
});
