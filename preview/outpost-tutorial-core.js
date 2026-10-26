/* First worksite journey. Prices are paid by the game; progress never grants materials. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OutpostTutorialCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const number=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,Math.floor(n))):0;
 function state(s){if(s.tutorial?.version!==1)s.tutorial={version:1,started:(s.outpost?.round||0)>0,first10:false,stock30:false,woodDelivered:0,stoneDelivered:0,automaticWood:0,blownWood:0,workerDelivered:!!s.firstWorkerPickup};return s.tutorial;}
 // via 'blower': pushed into the warehouse by ground physics (not a belt, so automaticWood stays belt-only).
 function delivered(s,type,count,automatic=false,worker=false,via=null){const t=state(s);if(!['wood','stone'].includes(type)||!Number.isFinite(count)||count<=0)return;const key=type+'Delivered';t[key]=number(number(t[key])+count);if(type==='wood'&&via==='blower')t.blownWood=number(number(t.blownWood)+count);else if(type==='wood'&&automatic)t.automaticWood=number(number(t.automaticWood)+count);if(type==='wood'&&worker)t.workerDelivered=true;}
 function step(s,facts={}){const t=state(s),wood=number(s.factory?.inventory?.wood),carry=number(s.harvestSkills?.carry),workers=number(s.owned?.woodcutter),pending=number(s.pending?.woodcutter);
  if(wood>=10)t.first10=true;if(wood>=30)t.stock30=true;
  if(t.started)return carry<3?{id:wood<60?'gather60':'carry3',progress:Math.min(60,wood),goal:60,skill:'carry3'}:{id:'complete',progress:1,goal:1};
  if(!workers)return {id:'worker',progress:Math.min(6,wood),goal:6};
  if(pending>=workers||facts.workerPlaced===false)return {id:'workerPlace',progress:0,goal:1};
  if(!t.workerDelivered)return {id:'workerDrop',progress:0,goal:1};
  const defenceSoon=s.outpost?.prepRemaining<=90;
  if(!defenceSoon&&!legacyBelts(s)){
   if(!(s.camp?.blowers?.length>0))return {id:'blower',progress:Math.min(4,wood),goal:4};
   if(!number(t.blownWood))return {id:'blowerDeliver',progress:0,goal:1};
  }
  if(!facts.defendersReady)return {id:'defenders',progress:Math.min(2,number(facts.defenders)),goal:2};
  return {id:'ready',progress:1,goal:1};
 }
 function legacyBelts(s){const t=state(s);return number(t.automaticWood)>0||s.camp?.links?.length>0;}
 function begin(s,facts){if(step(s,facts).id!=='ready')return false;const t=state(s);t.started=true;s.outpost.prepRemaining=90;s.outpost.prepScheduledRound=s.outpost.round;return true;}
 return {state,delivered,step,begin,legacyBelts};
});
