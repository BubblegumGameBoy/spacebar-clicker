/* Bounded, material-funded work skills. Saved branch levels remain compatible. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HarvestSkillCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const branches=['carry','hand','route','storage'],MAX_TIER=6;
 const prices={carry:[[10,0],[30,0],[60,0],[120,40],[240,100],[480,240]],hand:[[10,0],[30,6],[70,25],[140,60],[280,140],[560,300]],route:[[16,12],[50,35],[100,70],[200,140],[400,280],[800,560]],storage:[[8,2],[24,10],[60,25],[120,60],[240,140],[480,300]]};
 const costs=Object.fromEntries(branches.map(branch=>[branch,prices[branch].map(([wood,stone])=>({wood,stone}))]));
 const values={groundCapacity:[240,360,500,650,800,1000,1200],carryCapacity:[1,2,4,6,8,12,16],manualInterval:[1,.8,.6,.5,.4,.3,.25],manualPower:[1,2,3,5,8,12,18],manualHits:[3,2,1,1,1,1,1],manualYield:[1,2,3,4,5,6,8],cartSpeed:[1,1.25,1.5,1.8,2.1,2.5,3]};
 const level=n=>Number.isInteger(n)?Math.max(0,Math.min(MAX_TIER,n)):0;
 function migrate(raw){return Object.fromEntries(branches.map(id=>[id,level(raw?.[id])]));}
 function effects(raw){const s=migrate(raw);return {groundCapacity:values.groundCapacity[s.storage],carryCapacity:values.carryCapacity[s.carry],manualInterval:values.manualInterval[s.hand],manualPower:values.manualPower[s.hand],manualHits:values.manualHits[s.hand],manualYield:values.manualYield[s.hand],cartSpeed:values.cartSpeed[s.route]};}
 const workRequired=type=>type==='stone'?5:type==='food'?1:3;
 function harvestProfile(raw,type){const power=effects(raw).manualPower,required=workRequired(type);return {power,required,hits:Math.ceil(required/power),yieldPerStrike:power/required};}
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
 // Feedback tiers: tier 3 is a milestone and tier 6 completes the branch.
 function rank(id){const q=/^(carry|hand|route|storage)([1-6])$/.exec(String(id));if(!q)return null;const tier=Number(q[2]);return {id:String(id),branch:q[1],tier,kind:tier===MAX_TIER?'mastery':tier===3?'milestone':'skill'};}
 function nextGoal(state,branch){if(!branches.includes(branch))return null;const level=migrate(state?.harvestSkills)[branch];if(level>=MAX_TIER)return null;const q=quote(state,branch+(level+1)),inventory=state?.factory?.inventory||{},have=type=>Math.max(0,Number.isFinite(inventory[type])?inventory[type]:0);
  const parts=['wood','stone'].filter(type=>q.cost[type]>0),progress=parts.length?Math.min(...parts.map(type=>Math.min(1,have(type)/q.cost[type]))):1;return {...q,progress};}
 function newlyReady(before,after){const old=new Set((before||[]).map(q=>typeof q==='string'?q:q.id));return (after||[]).map(q=>typeof q==='string'?q:q.id).filter(id=>!old.has(id));}
 // One small "you can learn something" notice: after the pickup sound, at most once per 4 s, held while dragging or during a raid.
 const NOTICE={afterPickup:180,cooldown:4000};
 // If the chime itself could not sound (throttled or muted), keep it pending and restore the previous notice time.
 function readyNoticeFailed(memo,previousNotice){return {...memo,pending:true,lastNotice:Number.isFinite(previousNotice)?previousNotice:-Infinity};}
 function readyNotice(memo,{now,ready=[],dragging=false,raid=false,lastPickupAt=-Infinity}={}){
  const ids=(ready||[]).map(q=>typeof q==='string'?q:q.id),prev=memo&&Array.isArray(memo.ids)?memo:null,next={ids,pending:prev?.pending===true,lastNotice:Number.isFinite(prev?.lastNotice)?prev.lastNotice:-Infinity};
  if(!prev)return {memo:next,play:false};
  if(newlyReady(prev.ids,ids).length)next.pending=true;if(!ids.length)next.pending=false;
  if(!next.pending||dragging||raid)return {memo:next,play:false};
  if(now<lastPickupAt+NOTICE.afterPickup)return {memo:next,play:false,waitUntil:lastPickupAt+NOTICE.afterPickup};
  // Inside the cooldown the notice is postponed, never dropped.
  if(now-next.lastNotice<NOTICE.cooldown)return {memo:next,play:false,waitUntil:next.lastNotice+NOTICE.cooldown};
  next.pending=false;next.lastNotice=now;return {memo:next,play:true};
 }
 // Hand pickups climb up to +7 semitones, spread over the current hand capacity (the last item is the highest).
 const PICKUP_SEMITONES=7;
 function pickupRate(held,capacity=2){const cap=Math.max(2,Math.floor(Number(capacity)||2)),n=Math.max(1,Math.min(cap,Math.floor(Number(held)||1)));return Math.pow(2,PICKUP_SEMITONES*(n-1)/(cap-1)/12);}
 // One camp:handpickup event: every newly held item gets its own pickup (the very first grab stays silent as before),
 // 35 ms apart, six sounds at most; the hands-full knock follows the last of them by a fixed 35 ms.
 function pickupSchedule(before,after,capacity){const b=Math.max(0,Math.floor(before)||0),a=Math.max(b,Math.floor(after)||0),cap=Math.max(1,Math.floor(capacity)||1),sounds=[];
  for(let n=Math.max(2,b+1);n<=a&&sounds.length<6;n++)sounds.push({delay:35*sounds.length,rate:pickupRate(n,cap)});
  const full=cap>1&&a>=cap&&b<cap;return {sounds,full:full?{delay:sounds.length?sounds[sounds.length-1].delay+35:35}:null};}
 // From gathering tier 2, each tap adds quiet extra drop sounds: items-1, at most three, 30 ms apart.
 function harvestExtras(handLevel,made){return Number(handLevel)>=2?Math.max(0,Math.min(3,(Math.floor(made)||0)-1)):0;}
 // Branch spine: learned segments full, the next one filled by the share of materials already held.
 function spine(state,branch){const level=migrate(state?.harvestSkills)[branch]??0,next=level<MAX_TIER?nextGoal(state,branch):null;return Array.from({length:MAX_TIER},(_,i)=>i<level?1:i===level&&next?Math.max(0,Math.min(1,next.progress)):0);}
 // Learning from the tree map: the first tap selects, a second tap (>=250 ms later) on the selected ready node learns;
 // the small learn pill learns directly. Nothing learns while the post-purchase lock is active.
 const TAP={second:250};
 function tapAction({id,selected,selectedAt=-Infinity,byTap=false,now=0,ready=false,pill=false,lockUntil=-Infinity}={}){if(now<lockUntil)return id===selected?'none':'select';if(id!==selected)return 'select';if(!ready||now-selectedAt<TAP.second)return 'none';return pill||byTap?'buy':'arm';}
 // A just-learned skill is shown once in the field when its new value is first exceeded.
 function fieldUse(pending,observed){if(!pending)return null;const before=pending.before||{},after=pending.after||{},o=observed||{};
  if(pending.branch==='carry'&&o.held>before.carryCapacity)return {branch:'carry',id:pending.id};
  if(pending.branch==='hand'&&o.harvested>0)return {branch:'hand',id:pending.id,extraSounds:Math.max(0,Math.min(3,Math.min(o.harvested,after.manualYield||o.harvested)-(before.manualYield||1)))};
  if(pending.branch==='storage'&&o.ground>before.groundCapacity)return {branch:'storage',id:pending.id};
  if(pending.branch==='route'&&o.closed)return {branch:'route',id:pending.id,pulse:true};
  return null;}
 return {branches,MAX_TIER,costs,migrate,effects,workRequired,harvestProfile,quote,purchase,available,rank,nextGoal,newlyReady,readyNotice,readyNoticeFailed,pickupRate,pickupSchedule,harvestExtras,spine,tapAction,fieldUse,NOTICE,TAP,PICKUP_SEMITONES};
});
