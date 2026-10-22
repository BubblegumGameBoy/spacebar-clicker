/* Resource-funded abilities. No souls, free grants, or exponential multipliers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HarvestSkillCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const branches=['carry','hand','route','storage'];
 const costs={storage:[{wood:8,stone:2},{wood:24,stone:10}],carry:[{wood:12,stone:4},{wood:40,stone:20}],hand:[{wood:12,stone:6},{wood:36,stone:18}],route:[{wood:16,stone:12},{wood:50,stone:35}]};
 const level=n=>Number.isInteger(n)?Math.max(0,Math.min(2,n)):0;
 function migrate(raw){return Object.fromEntries(branches.map(id=>[id,level(raw?.[id]) ]));}
 function effects(raw){const s=migrate(raw);return {groundCapacity:[12,24,48][s.storage],carryCapacity:[1,2,4][s.carry],manualInterval:[1,.8,.6][s.hand],cartSpeed:[1,1.25,1.5][s.route]};}
 function quote(state,id){
  const match=/^(carry|hand|route|storage)([12])$/.exec(String(id));if(!match)return null;
  const branch=match[1],tier=Number(match[2]),skills=migrate(state?.harvestSkills),cost={...costs[branch][tier-1]},built=skills[branch]>=tier;
  const needsPrevious=skills[branch]<tier-1,needsRail=branch==='route'&&!(state?.camp?.links?.length>0),locked=needsPrevious||needsRail;
  const inventory=state?.factory?.inventory||{},missing={wood:Math.max(0,cost.wood-(Number.isFinite(inventory.wood)?inventory.wood:0)),stone:Math.max(0,cost.stone-(Number.isFinite(inventory.stone)?inventory.stone:0))};
  return {id,branch,tier,cost,built,locked,needsPrevious,needsRail,missing,ready:!built&&!locked&&!missing.wood&&!missing.stone};
 }
 function purchase(state,id){const q=quote(state,id);if(!q?.ready)return false;state.factory.inventory.wood-=q.cost.wood;state.factory.inventory.stone-=q.cost.stone;state.harvestSkills=migrate(state.harvestSkills);state.harvestSkills[q.branch]=q.tier;return true;}
 return {branches,costs,migrate,effects,quote,purchase};
});
