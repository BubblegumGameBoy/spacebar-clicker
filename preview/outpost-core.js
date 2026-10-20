/* Small, saved outpost rounds. Only enemies move; presentation and payment live outside this module. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.OutpostCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WORLD=Object.freeze({width:960,height:540,home:Object.freeze({x:100,y:340}),entryX:925,turnX:190,upper:185,lower:435});
 const DURATION=50,GATE_SECONDS=1,EPS=1e-9,MAX_COUNT=1e6,MAX_KEY=1e12;
 const finite=(value,fallback=0,min=0,max=1e9)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
 const integer=(value,fallback=0,min=0,max=1e9)=>Math.floor(finite(value,fallback,min,max));
 const waveNumber=value=>integer(value,1,1,3);
 const laneY=lane=>WORLD[lane==='lower'?'lower':'upper'];
 const pathLength=lane=>WORLD.entryX-WORLD.turnX+Math.hypot(WORLD.turnX-WORLD.home.x,laneY(lane)-WORLD.home.y);

 function fresh(){
  return {version:1,phase:'prep',wave:1,cleared:0,round:0,elapsed:0,boxes:3,enemies:[],spawned:0,nextKey:1,kills:0,escaped:0,claimedFirst:[],result:null};
 }
 function plan(value){
  const wave=waveNumber(value),count=wave===1?3:wave===2?4:6,spawns=[];
  for(let i=0;i<count;i++)spawns.push({at:wave===3?Math.floor(i/2)*1.5:i*(wave===1?6:5),lane:wave===1?'upper':wave===2?'lower':i%2?'lower':'upper',kind:'rat',hp:wave===1?14:wave===2?18:22,speed:wave===1?22:wave===2?24:25});
  return {wave,duration:DURATION,spawns,counts:{upper:spawns.filter(e=>e.lane==='upper').length,lower:spawns.filter(e=>e.lane==='lower').length}};
 }
 function position(enemy){
  const straight=WORLD.entryX-WORLD.turnX,y=laneY(enemy.lane);
  if(enemy.travel<=straight){enemy.x=WORLD.entryX-enemy.travel;enemy.y=y;return;}
  const turnLength=pathLength(enemy.lane)-straight,t=Math.min(1,(enemy.travel-straight)/turnLength);
  enemy.x=WORLD.turnX+(WORLD.home.x-WORLD.turnX)*t;
  enemy.y=y+(WORLD.home.y-y)*t;
 }
 function goldFor(wave,win,boxes,first){return win?12+(first?12+wave*8:0)+boxes*2:8;}
 function normalizedResult(raw){
  if(!raw||typeof raw!=='object')return null;
  const wave=waveNumber(raw.wave),boxes=integer(raw.boxes,0,0,3),win=raw.win===true&&boxes>0,count=plan(wave).spawns.length;
  const kills=integer(raw.kills,0,0,count),escaped=integer(raw.escaped,0,0,count-kills),first=win&&raw.first===true;
  return {wave,win,boxes,kills,escaped,gold:goldFor(wave,win,boxes,first),first};
 }
 function migrate(raw){
  const state=fresh();
  if(!raw||typeof raw!=='object'||raw.version!==1)return state;
  state.phase=['prep','active','result'].includes(raw.phase)?raw.phase:'prep';
  state.wave=waveNumber(raw.wave);state.cleared=integer(raw.cleared,0,0,3);state.round=integer(raw.round,0,0,1e9);
  state.elapsed=finite(raw.elapsed,0,0,DURATION);state.boxes=integer(raw.boxes,3,0,3);
  state.claimedFirst=[...new Set((Array.isArray(raw.claimedFirst)?raw.claimedFirst:[]).slice(0,1024).filter(n=>Number.isInteger(n)&&n>=1&&n<=3))];
  for(let wave=1;wave<=state.cleared;wave++)if(!state.claimedFirst.includes(wave))state.claimedFirst.push(wave);
  const result=normalizedResult(raw.result);
  // A stored settlement is authoritative: never turn it back into a payable active round.
  if(result&&(state.phase==='result'||state.phase==='active')){state.phase='result';state.result=result;state.wave=result.wave;state.elapsed=DURATION;}
  else if(state.phase==='result')state.phase='prep';
  if(state.result?.win){state.cleared=Math.max(state.cleared,state.result.wave);if(!state.claimedFirst.includes(state.result.wave))state.claimedFirst.push(state.result.wave);}
  state.claimedFirst.sort((a,b)=>a-b);
  const definition=plan(state.wave),seen=new Set();
  for(const row of (Array.isArray(raw.enemies)?raw.enemies:[]).slice(0,definition.spawns.length)){
   if(!row||row.kind!=='rat'||!['upper','lower'].includes(row.lane)||!Number.isInteger(row.key)||row.key<1||row.key>MAX_KEY||seen.has(row.key))continue;
   seen.add(row.key);
   const maxHp=definition.spawns[0].hp,travel=finite(row.travel,0,0,pathLength(row.lane)),atGate=row.atGate===true||travel>=pathLength(row.lane)-EPS;
   const hp=finite(row.hp,maxHp,0,maxHp),gateTime=atGate?finite(row.gateTime,0,0,GATE_SECONDS):0;
   const enemy={key:row.key,kind:'rat',lane:row.lane,x:0,y:0,r:13,hp,maxHp,travel:atGate?pathLength(row.lane):travel,slowUntil:finite(row.slowUntil,0,0,DURATION+1.5),alive:row.alive===true&&hp>0&&gateTime<GATE_SECONDS,atGate,gateTime};
   position(enemy);state.enemies.push(enemy);
  }
  state.spawned=Math.max(integer(raw.spawned,0,0,definition.spawns.length),state.enemies.length);
  if(state.phase==='active'&&state.elapsed>0)state.spawned=Math.max(state.spawned,definition.spawns.filter(e=>e.at<state.elapsed-EPS).length);
  const missing=state.phase==='active'?state.spawned-state.enemies.length:0;
  state.kills=integer(raw.kills,0,0,state.spawned);
  state.escaped=Math.max(integer(raw.escaped,0,0,state.spawned-state.kills),Math.min(missing,state.spawned-state.kills));
  state.boxes=Math.min(state.boxes,Math.max(0,3-state.escaped));
  state.nextKey=Math.max(integer(raw.nextKey,1,1,MAX_KEY+1),...state.enemies.map(e=>e.key+1));
  if(state.result){state.boxes=state.result.boxes;state.kills=state.result.kills;state.escaped=state.result.escaped;}
  return state;
 }
 function start(state){
  if(!state||!['prep','result'].includes(state.phase))return false;
  state.wave=state.phase==='result'&&state.result?waveNumber(state.result.wave+(state.result.win?1:0)):waveNumber(state.wave);
  state.phase='active';state.round=integer(state.round,0,0,1e9)+1;state.elapsed=0;state.boxes=3;state.enemies=[];state.spawned=0;state.kills=0;state.escaped=0;state.result=null;
  state.nextKey=integer(state.nextKey,1,1,MAX_KEY+1);
  return true;
 }
 function spawnDue(state,definition){
  while(state.spawned<definition.spawns.length&&definition.spawns[state.spawned].at<=state.elapsed+EPS){
   const item=definition.spawns[state.spawned++];
   state.enemies.push({key:state.nextKey++,kind:item.kind,lane:item.lane,x:WORLD.entryX,y:laneY(item.lane),r:13,hp:item.hp,maxHp:item.hp,travel:0,slowUntil:0,alive:true,atGate:false,gateTime:0});
  }
 }
 function escape(state,enemy){
  if(!enemy.alive)return;
  enemy.alive=false;state.escaped++;state.boxes=Math.max(0,state.boxes-1);
 }
 function advance(state,enemy,from,to,speed){
  let time=from;
  while(enemy.alive&&time<to-EPS){
   if(enemy.atGate){
    const delta=Math.min(to-time,GATE_SECONDS-enemy.gateTime);
    enemy.gateTime+=delta;time+=delta;
    if(enemy.gateTime>=GATE_SECONDS-EPS){enemy.gateTime=GATE_SECONDS;escape(state,enemy);}
    continue;
   }
   const length=pathLength(enemy.lane),slowed=enemy.slowUntil>time+EPS,velocity=speed*(slowed?.35:1);
   const delta=Math.min(to-time,slowed?enemy.slowUntil-time:Infinity,Math.max(0,(length-enemy.travel)/velocity));
   enemy.travel=Math.min(length,enemy.travel+velocity*delta);time+=delta;
   if(enemy.travel>=length-EPS){enemy.travel=length;enemy.atGate=true;enemy.gateTime=0;}
   position(enemy);
  }
 }
 function settle(state){
  for(const enemy of state.enemies)if(enemy.alive)escape(state,enemy);
  const win=state.boxes>0,first=win&&!state.claimedFirst.includes(state.wave);
  if(win){state.cleared=Math.max(state.cleared,state.wave);if(first)state.claimedFirst.push(state.wave);}
  const result={wave:state.wave,win,boxes:state.boxes,kills:state.kills,escaped:state.escaped,gold:goldFor(state.wave,win,state.boxes,first),first};
  state.phase='result';state.result=result;
  return {type:'settle',result:{...result}};
 }
 function tick(state,dt){
  if(!state||state.phase!=='active'||!Number.isFinite(dt)||dt<0)return [];
  const definition=plan(state.wave),end=Math.min(DURATION,state.elapsed+dt);
  spawnDue(state,definition);
  while(state.elapsed<end-EPS){
   const nextSpawn=definition.spawns[state.spawned]?.at??Infinity;
   const next=Math.min(end,state.elapsed+.25,nextSpawn);
   for(const enemy of state.enemies)if(enemy.alive)advance(state,enemy,state.elapsed,next,definition.spawns[0].speed);
   state.elapsed=next;spawnDue(state,definition);
  }
  state.elapsed=end;
  if(state.elapsed>=DURATION-EPS){state.elapsed=DURATION;return [settle(state)];}
  return [];
 }
 function hit(state,key,amount,role){
  if(!state||state.phase!=='active'||!Number.isFinite(amount)||amount<=0)return {applied:0,killed:false};
  const enemy=state.enemies.find(e=>e.key===key&&e.alive);
  if(!enemy)return {applied:0,killed:false};
  const applied=Math.min(enemy.hp,amount);enemy.hp-=applied;
  const killed=enemy.hp<=0;
  if(killed){enemy.hp=0;enemy.alive=false;state.kills++;}
  else if(role==='sword')enemy.slowUntil=state.elapsed+1.5;
  return {applied,killed};
 }
 function target(state,point,range){
  if(!state||state.phase!=='active'||!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(range)||range<0)return null;
  let best=null,bestDistance=Infinity,bestRemaining=Infinity;
  for(const enemy of state.enemies){
   if(!enemy.alive)continue;
   const distance=Math.hypot(point.x-enemy.x,point.y-enemy.y);
   if(distance>range)continue;
   const remaining=pathLength(enemy.lane)-enemy.travel;
   if(!best||remaining<bestRemaining-EPS||(Math.abs(remaining-bestRemaining)<=EPS&&(distance<bestDistance-EPS||(Math.abs(distance-bestDistance)<=EPS&&enemy.key<best.key)))){best=enemy;bestDistance=distance;bestRemaining=remaining;}
  }
  return best;
 }
 const RECIPES={woodcutter:{wood:[6,4],stone:[0,0]},miner:{wood:[8,4],stone:[4,2]},arch:{wood:[12,6],stone:[6,3]},sword:{wood:[10,5],stone:[8,4]}};
 function recipe(id,owned,n=1){
  if(!Object.hasOwn(RECIPES,id))return null;
  const count=integer(n,0,0,MAX_COUNT),existing=integer(owned,0,0,MAX_COUNT),indices=count*existing+count*(count-1)/2,definition=RECIPES[id];
  return {wood:count*definition.wood[0]+indices*definition.wood[1],stone:count*definition.stone[0]+indices*definition.stone[1],gold:0};
 }
 function stats(id){
  if(id==='woodcutter')return {damage:0,interval:5,range:0};
  if(id==='miner')return {damage:0,interval:6,range:0};
  if(id==='arch')return {damage:5,interval:1.3,range:90};
  if(id==='sword')return {damage:3,interval:1.2,range:28};
  return null;
 }
 return {WORLD,fresh,migrate,plan,start,tick,hit,target,recipe,stats};
});
