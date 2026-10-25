/* Saved squad slots and expedition settlement. No DOM, timers, or free material grants. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./outpost-core.js'):root.OutpostCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.ExpeditionCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Outpost){
 'use strict';
 const IDS=['woodcutter','miner','farmer','arch','sword','ballista'],COUNTS=[1,3,6,10],LIMIT=4,UNLOCKS={farmer:3,ballista:4};
 const integer=(n,f=0,max=1e9)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):f;
 const bucket=id=>['woodcutter','miner','farmer'].includes(id)?'production':IDS.includes(id)?'combat':null;
 const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:Math.max(15,Math.min(945,p.x)),y:Math.max(105,Math.min(515,p.y))}:null;
 const copyCost=c=>({wood:integer(c?.wood),stone:integer(c?.stone),food:integer(c?.food),gold:integer(c?.gold)});
 function fresh(){return {version:1,initialized:false,groups:[],nextKey:1,unlocks:{farmer:false,ballista:false},coins:0,claimed:0,records:[],trainingBest:0,awaitingDecision:false,awaitingReady:false,run:1,settled:[],lastReceipt:null};}
 function migrate(raw){
  if(!raw||raw.version!==1)return null;const e=fresh();e.initialized=raw.initialized===true;e.nextKey=integer(raw.nextKey,1)||1;e.coins=integer(raw.coins);e.claimed=integer(raw.claimed);e.trainingBest=integer(raw.trainingBest,0,10);e.run=Math.max(1,integer(raw.run,1));e.awaitingDecision=raw.awaitingDecision===true;e.awaitingReady=raw.awaitingReady===true;
  e.unlocks={farmer:raw.unlocks?.farmer===true,ballista:raw.unlocks?.ballista===true};const seen=new Set();
  for(const g of(Array.isArray(raw.groups)?raw.groups:[]).slice(0,10000)){const key=integer(g?.key,0,1e12);if(!key||seen.has(key)||!IDS.includes(g.id))continue;seen.add(key);const count=Math.max(1,integer(g.count,1,100000));e.groups.push({key,id:g.id,count,tier:integer(g.tier,0,3),active:g.active===true,pending:integer(g.pending,0,count),anchor:point(g.anchor),positions:(Array.isArray(g.positions)?g.positions:[]).slice(0,count).map(point),receipt:g.receipt?copyCost(g.receipt):null,legacy:g.legacy===true});e.nextKey=Math.max(e.nextKey,key+1);}
  for(let wave=1;wave<=Outpost.MAX_WAVE;wave++){const r=(Array.isArray(raw.records)?raw.records:[]).find(r=>r?.wave===wave);if(!r)continue;const total=Outpost.plan(wave).spawns.length;e.records.push({wave,total,bestKills:integer(r.bestKills,0,total),cleared:r.cleared===true});}
  e.settled=[...new Set((Array.isArray(raw.settled)?raw.settled:[]).filter(v=>typeof v==='string'&&/^\d+:\d+$/.test(v)))].slice(-1000);
  if(raw.lastReceipt&&Number.isInteger(raw.lastReceipt.run))e.lastReceipt={run:integer(raw.lastReceipt.run),award:integer(raw.lastReceipt.award),balance:integer(raw.lastReceipt.balance)};
  return e;
 }
 function ensure(S){
  if(!S.expedition||S.expedition.version!==1)S.expedition=fresh();const e=S.expedition;
  if(!e.initialized){
   const rows=new Map((S.battle?.units||[]).map(r=>[r[0]+':'+r[1],r]));
   for(const id of IDS){const total=integer(S.owned?.[id],0,100000),pending=integer(S.pending?.[id],0,total),placed=total-pending;
    for(let at=0;at<placed;at+=10){const count=Math.min(10,placed-at),positions=Array.from({length:count},(_,i)=>{const r=rows.get(id+':'+(at+i));return r?point({x:r[2],y:r[3]}):null;}),anchor=positions.find(Boolean)||null;e.groups.push({key:e.nextKey++,id,count,tier:count>=10?3:count>=6?2:count>=3?1:0,active:true,pending:0,anchor,positions,receipt:null,legacy:true});}
    for(let i=0;i<pending;i++){const receipt=S.pendingRefunds?.[id]?.[i];e.groups.push({key:e.nextKey++,id,count:1,tier:0,active:true,pending:1,anchor:null,positions:[],receipt:receipt?copyCost(receipt):null,legacy:true});}
   }
   for(let wave=1;wave<=Math.min(Outpost.MAX_WAVE,integer(S.outpost?.cleared));wave++){if(!e.records.some(r=>r.wave===wave))e.records.push({wave,total:Outpost.plan(wave).spawns.length,bestKills:Outpost.plan(wave).spawns.length,cleared:true});}
   if(S.outpost?.phase==='result'&&S.outpost.result&&!S.outpost.result.win)e.awaitingDecision=true;
   e.initialized=true;
  }
  return e;
 }
 function groups(S){return ensure(S).groups;}
 function canEdit(S){return S.outpost?.phase!=='active';}
 function available(S,id){const e=ensure(S);return IDS.includes(id)&&(!Object.hasOwn(UNLOCKS,id)||e.unlocks[id]);}
 function assignments(S){const result=[],indices={};for(const g of groups(S).filter(g=>g.active).sort((a,b)=>Number(!!a.pending)-Number(!!b.pending)||a.key-b.key)){for(let member=0;member<g.count;member++){const index=indices[g.id]||0;indices[g.id]=index+1;result.push({id:g.id,index,groupKey:g.key,member,anchor:g.anchor,pending:member>=g.count-g.pending});}}return result;}
 function groupFor(S,id,index){const a=assignments(S).find(a=>a.id===id&&a.index===index);return a?groups(S).find(g=>g.key===a.groupKey):null;}
 function capture(S){const rows=new Map((S.battle?.units||[]).map(r=>[r[0]+':'+r[1],r]));for(const a of assignments(S)){const r=rows.get(a.id+':'+a.index);if(!r)continue;const g=groups(S).find(g=>g.key===a.groupKey);g.positions[a.member]=point({x:r[2],y:r[3]});if(!a.member&&!g.pending)g.anchor=g.positions[0];}}
 function formation(g,member){if(g.positions[member])return g.positions[member];if(!g.anchor)return null;if(!member)return {...g.anchor};const angle=(member*2.399963)+(g.key*.17),radius=23*Math.sqrt(member);return point({x:g.anchor.x+Math.cos(angle)*radius,y:g.anchor.y+Math.sin(angle)*radius});}
 function project(S){S.owned??={};S.pending??={};S.pendingRefunds??={};for(const id of IDS){S.owned[id]=0;S.pending[id]=0;S.pendingRefunds[id]=[];}const rows=(S.battle?.units||[]).filter(r=>!IDS.includes(r[0]));for(const a of assignments(S)){const g=groups(S).find(g=>g.key===a.groupKey);S.owned[a.id]++;if(a.pending){S.pending[a.id]++;if(g.receipt)S.pendingRefunds[a.id].push({wood:g.receipt.wood,stone:g.receipt.stone,gold:g.receipt.gold});continue;}const p=formation(g,a.member);if(p){g.positions[a.member]=p;rows.push([a.id,a.index,p.x,p.y,-1,-1]);}}
  S.battle={...(S.battle||{}),width:S.battle?.width||960,height:S.battle?.height||540,captain:S.battle?.captain||{x:150,y:370},units:rows};return S;
 }
 function funds(S,cost){return Object.fromEntries(['wood','stone','food','gold'].map(t=>[t,Math.max(0,cost[t]-(t==='gold'?integer(S.gold):integer(S.factory?.inventory?.[t])))]));}
 function payable(missing){return !Object.values(missing).some(Boolean);}
 function pay(S,cost){for(const type of ['wood','stone','food'])if(cost[type])S.factory.inventory[type]=(S.factory.inventory[type]||0)-cost[type];if(cost.gold)S.gold-=cost.gold;}
 function refund(S,cost){S.factory??={inventory:{wood:0,stone:0}};S.factory.inventory??={};for(const t of ['wood','stone','food'])if(cost[t])S.factory.inventory[t]=integer(S.factory.inventory[t])+cost[t];if(cost.gold)S.gold=integer(S.gold)+cost.gold;}
 function recipe(S,id){const count=groups(S).filter(g=>g.id===id).length;return copyCost(Outpost.recipe(id,count,1)||({farmer:{wood:18,stone:8},ballista:{wood:24,stone:16}}[id]));}
 function slotQuote(S,id){const kind=bucket(id),list=groups(S),cost=recipe(S,id),missing=funds(S,cost),locked=!available(S,id),active=list.filter(g=>g.active&&bucket(g.id)===kind).length,full=active>=LIMIT,waiting=list.some(g=>g.active&&g.pending>0);const reason=!kind?'unknown':!canEdit(S)?'active':locked?'locked':waiting?'pending':full?'full':!payable(missing)?'materials':'';return {id,bucket:kind,cost,missing,locked,full,waiting,active,limit:LIMIT,ready:!reason,reason};}
 function recruit(S,id){const q=slotQuote(S,id);if(!q.ready)return false;capture(S);pay(S,q.cost);const e=ensure(S),g={key:e.nextKey++,id,count:1,tier:0,active:true,pending:1,anchor:null,positions:[],receipt:{...q.cost},legacy:false};e.groups.push(g);project(S);return g;}
 function setAnchor(S,id,index,p){const destination=point(p),a=assignments(S).find(a=>a.id===id&&a.index===index);if(!destination||!a||!canEdit(S))return false;capture(S);const g=groups(S).find(g=>g.key===a.groupKey),old=g.positions[a.member]||g.anchor;
  if(!a.member){const dx=old?destination.x-old.x:0,dy=old?destination.y-old.y:0;g.anchor=destination;g.positions=g.positions.map(v=>v?point({x:v.x+dx,y:v.y+dy}):null);g.positions[0]=destination;}else g.positions[a.member]=destination;
  if(g.pending){g.pending=Math.max(0,g.pending-1);g.receipt=null;if(!g.anchor)g.anchor=destination;}return true;
 }
 function cancelPending(S,id){if(!canEdit(S))return false;capture(S);const e=ensure(S),pending=e.groups.filter(g=>g.active&&g.pending>0&&(!id||g.id===id));if(!pending.length)return false;for(const g of pending){if(g.receipt)refund(S,g.receipt);if(g.pending===g.count)e.groups.splice(e.groups.indexOf(g),1);else{g.count-=g.pending;g.pending=0;g.receipt=null;g.positions=g.positions.slice(0,g.count);}}project(S);return true;}
 function bench(S,key){if(!canEdit(S))return false;capture(S);const g=groups(S).find(g=>g.key===key);if(!g||!g.active||g.pending)return false;g.active=false;project(S);return true;}
 function resume(S,key){if(!canEdit(S))return false;capture(S);const g=groups(S).find(g=>g.key===key);if(!g||g.active||groups(S).filter(v=>v.active&&bucket(v.id)===bucket(g.id)).length>=LIMIT||groups(S).some(v=>v.active&&v.pending))return false;g.active=true;if(!g.anchor)g.pending=g.count;project(S);return true;}
 function swap(S,fromKey,toKey){if(!canEdit(S))return false;capture(S);const list=groups(S),from=list.find(g=>g.key===fromKey),to=list.find(g=>g.key===toKey);if(!from||!to||!from.active||to.active||from.pending||bucket(from.id)!==bucket(to.id)||list.some(g=>g.active&&g.pending))return false;from.active=false;to.active=true;if(from.anchor){const previous=to.anchor,dx=previous?from.anchor.x-previous.x:0,dy=previous?from.anchor.y-previous.y:0;to.anchor={...from.anchor};to.positions=previous?to.positions.map(p=>p?point({x:p.x+dx,y:p.y+dy}):null):[];to.positions[0]={...to.anchor};to.pending=0;}else if(!to.anchor)to.pending=to.count;project(S);return true;}
 function trainQuote(S,key){const g=groups(S).find(g=>g.key===key);if(!g)return {key,ready:false,reason:'unknown'};const next=COUNTS.find(n=>n>g.count),tier=next?COUNTS.indexOf(next):3,added=next?next-g.count:0,scale=bucket(g.id)==='production'?1:1.5;const cost=copyCost({wood:Math.ceil(added*8*scale),stone:Math.ceil(added*4*scale),food:tier>=2?added*3:tier===1?0:0}),missing=funds(S,cost);const reason=!canEdit(S)?'active':!g.active?'reserve':g.pending?'pending':!g.anchor?'placement':!next?'max':!payable(missing)?'materials':'';return {key,id:g.id,from:g.count,to:next||g.count,tier,cost,missing,ready:!reason,reason};}
 function train(S,key){const q=trainQuote(S,key);if(!q.ready)return false;capture(S);pay(S,q.cost);const g=groups(S).find(g=>g.key===key);g.count=q.to;g.tier=q.tier;project(S);return g;}
 function buyFoodQuote(S){const gold=integer(S.gold);return {cost:15,count:5,ready:canEdit(S)&&gold>=15,missing:Math.max(0,15-gold)};}
 function buyFood(S){if(!buyFoodQuote(S).ready)return false;S.factory??={inventory:{wood:0,stone:0}};S.factory.inventory??={wood:0,stone:0};S.gold-=15;S.factory.inventory.food=integer(S.factory.inventory.food)+5;return true;}
 function unlockQuote(S,id){const e=ensure(S),cost=UNLOCKS[id]||0,owned=available(S,id),missing=Math.max(0,cost-e.coins);return {id,cost,owned,missing,ready:!!cost&&!owned&&canEdit(S)&&!missing};}
 function unlock(S,id){const q=unlockQuote(S,id);if(!q.ready)return false;const e=ensure(S);e.coins-=q.cost;e.unlocks[id]=true;return true;}
 function record(S,result){const e=ensure(S),wave=integer(result?.wave,0,Outpost.MAX_WAVE),round=integer(S.outpost?.round),token=e.run+':'+round;if(!wave||!round||S.outpost?.phase!=='result'||wave!==S.outpost.wave||e.settled.includes(token))return false;const total=Outpost.plan(wave).spawns.length,kills=integer(result.kills,0,total);let row=e.records.find(r=>r.wave===wave);if(!row){row={wave,total,bestKills:0,cleared:false};e.records.push(row);}row.bestKills=Math.max(row.bestKills,kills);row.cleared=row.cleared||result.win===true;const trained=e.groups.filter(g=>g.active&&!g.pending&&g.anchor&&bucket(g.id)==='combat').reduce((n,g)=>n+g.tier,0);if(kills)e.trainingBest=Math.max(e.trainingBest,Math.min(10,trained));e.settled.push(token);if(e.settled.length>1000)e.settled.shift();if(!result.win){e.awaitingDecision=true;e.awaitingReady=false;}return true;}
 function entitlement(S){const e=ensure(S),clears=e.records.filter(r=>r.cleared).length,points=e.records.reduce((n,r)=>n+Math.floor(10*r.bestKills/r.total)+(r.cleared?10:0),0);return Math.floor((points+Math.min(10,clears*2,e.trainingBest))/5);}
 function quoteReturn(S){const e=ensure(S),total=entitlement(S),reason=S.outpost?.phase==='active'?'active':S.outpost?.phase!=='result'?'no_result':'';return {ready:!reason,award:Math.max(0,total-e.claimed),coins:e.coins,total,claimed:e.claimed,run:e.run,reason,kept:['camp','materials','conveyors','workSkills','unlocks'],reset:['wave','combatTraining']};}
 function returnHome(S){const q=quoteReturn(S);if(!q.ready)return false;capture(S);cancelPending(S);const e=ensure(S);e.coins+=q.award;e.claimed=Math.max(e.claimed,q.total);e.lastReceipt={run:e.run,award:q.award,balance:e.coins};const receipt={...e.lastReceipt};e.run++;for(const g of e.groups){if(bucket(g.id)==='combat'){g.count=1;g.tier=0;g.pending=0;g.positions=g.anchor?[{...g.anchor}]:[];g.receipt=null;}}
  S.outpost=Outpost.fresh();S.clearedBossWave=0;S.bossWave=1;S.bossCycle=1;S.gameCleared=false;S.tutorial??={version:1};S.tutorial.started=true;e.awaitingDecision=false;e.awaitingReady=true;project(S);return receipt;
 }
 function retry(S){const e=ensure(S);if(!canEdit(S)||S.outpost?.phase!=='result'||S.outpost.result?.win)return false;e.awaitingDecision=false;e.awaitingReady=true;return true;}
 function beginPreparation(S){const e=ensure(S);if(!canEdit(S)||!e.awaitingReady||e.groups.some(g=>g.active&&g.pending))return false;e.awaitingReady=false;e.awaitingDecision=false;S.outpost.prepRemaining=90;S.outpost.prepScheduledRound=S.outpost.round;return true;}
 return {IDS,COUNTS,LIMIT,UNLOCKS,bucket,migrate,ensure,groups,available,canEdit,assignments,groupFor,project,slotQuote,recruit,setAnchor,cancelPending,bench,resume,swap,trainQuote,train,buyFoodQuote,buyFood,unlockQuote,unlock,record,entitlement,quoteReturn,returnHome,retry,beginPreparation};
});
