/* Small, saved outpost rounds. Only enemies move; presentation and payment live outside this module. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.OutpostCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WORLD=Object.freeze({width:960,height:540,home:Object.freeze({x:100,y:340}),entryX:925,turnX:190,upper:185,lower:435});
 const MAX_WAVE=9,GATE_SECONDS=1,EPS=1e-9,MAX_COUNT=1e6,MAX_KEY=1e12;
 const finite=(value,fallback=0,min=0,max=1e9)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
 const integer=(value,fallback=0,min=0,max=1e9)=>Math.floor(finite(value,fallback,min,max));
 const waveNumber=value=>integer(value,1,1,MAX_WAVE);
 const laneY=lane=>WORLD[lane==='lower'?'lower':'upper'];
 const pathLength=lane=>WORLD.entryX-WORLD.turnX+Math.hypot(WORLD.turnX-WORLD.home.x,laneY(lane)-WORLD.home.y);

 function fresh(){
  return {version:1,phase:'prep',wave:1,cleared:0,round:0,prepRemaining:150,prepScheduledRound:0,elapsed:0,gateSeconds:1,boxes:3,enemies:[],spawned:0,nextKey:1,kills:0,escaped:0,claimedFirst:[],completed:false,completedAtRound:0,journey:{seconds:0,handWood:0,handStone:0,crewWood:0,crewStone:0,handFood:0,crewFood:0},result:null};
 }
 // The preparation clock is advanced explicitly by the live game, separately from battle simulation.
 function preparationSeconds(state){if(!state||state.round===0)return 150;const next=state.result?.win?Math.min(MAX_WAVE,state.result.wave+1):state.wave;return state.result&&!state.result.win?90:next<=3?90:120;}
 function preparationTick(state,dt){
  if(!state||state.phase==='active'||state.completed||!Number.isFinite(dt)||dt<=0)return false;
  if(state.prepScheduledRound!==state.round){state.prepScheduledRound=state.round;state.prepRemaining=preparationSeconds(state);}
  state.prepRemaining=Math.max(0,finite(state.prepRemaining,preparationSeconds(state),0,150)-dt);
  return state.prepRemaining<=EPS;
 }
 function chapter(value){return Math.min(3,Math.ceil(waveNumber(value)/3));}
 function plan(value){
  const wave=waveNumber(value),spawns=[],duration=wave<=3?50:wave<=6?60:70;
  const specs={rat:{hp:wave<=3?wave===1?14:wave===2?18:22:26,speed:wave===1?22:wave===2?24:25,armor:0,r:13},scout:{hp:16,speed:34,armor:0,r:10},guard:{hp:42,speed:19,armor:2,r:16},chief:{hp:240,speed:19,armor:2,r:25}};
  const add=(kind,lane,at)=>spawns.push({at,lane,kind,...specs[kind]});
  if(wave<=3){const count=wave===1?3:wave===2?4:6;for(let i=0;i<count;i++)add('rat',wave===1?'upper':wave===2?'lower':i%2?'lower':'upper',wave===3?Math.floor(i/2)*1.5:i*(wave===1?6:5));}
  if(wave===4){for(let i=0;i<10;i++)add(i<8?'scout':'rat',i%2?'lower':'upper',Math.floor(i/2)*2.5);}
  if(wave===5){for(let i=0;i<4;i++)add('guard',i%2?'lower':'upper',Math.floor(i/2)*1.5);for(let i=0;i<10;i++)add('rat',i%2?'lower':'upper',5+Math.floor(i/2)*1.5);}
  if(wave===6){for(let i=0;i<2;i++)add('guard',i?'lower':'upper',0);for(let i=0;i<16;i++)add(i%4<2?'rat':'scout',i%2?'lower':'upper',4+Math.floor(i/2)*1.3);}
  if(wave===7){for(let i=0;i<6;i++)add('guard',i%2?'lower':'upper',Math.floor(i/2));for(let i=0;i<16;i++)add(i%4<2?'scout':'rat',i%2?'lower':'upper',3+Math.floor(i/2)*.8);}
  if(wave===8){for(let i=0;i<28;i++)add(i%7===0?'guard':i%3===0?'scout':'rat',i%2?'lower':'upper',Math.floor(i/2)*.55);}
  if(wave===9){for(let i=0;i<6;i++)add('guard',i%2?'lower':'upper',Math.floor(i/2)*1.5);for(let i=0;i<22;i++)add('rat',i%2?'lower':'upper',3+Math.floor(i/2)*.8);for(let i=0;i<8;i++)add('scout',i%2?'lower':'upper',12+Math.floor(i/2)*1.1);add('chief','upper',14);}
  spawns.sort((a,b)=>a.at-b.at);spawns.forEach((e,i)=>e.spawnIndex=i);
  const patterns=['single','single','pack','scout','guard','mixed','guard','swarm','final'];
  return {wave,duration,chapter:chapter(wave),pattern:patterns[wave-1],spawns,counts:{upper:spawns.filter(e=>e.lane==='upper').length,lower:spawns.filter(e=>e.lane==='lower').length},kinds:[...new Set(spawns.map(e=>e.kind))]};
 }
 function nextRequirement(state){
  if(!state)return null;const next=state.phase==='result'&&state.result?.win?Math.min(MAX_WAVE,state.result.wave+1):waveNumber(state.wave);
  return next===4?'workshop':next===7?'gate':next===9?'beacon':null;
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
  const kills=integer(raw.kills,0,0,count),escaped=integer(raw.escaped,0,0,count-kills),success=win&&(wave!==MAX_WAVE||raw.chiefDefeated===true),first=success&&raw.first===true;
  return {wave,win:success,boxes,kills,escaped,gold:goldFor(wave,success,boxes,first),first,...(wave===MAX_WAVE?{chiefDefeated:raw.chiefDefeated===true}:{})};
 }
 function migrate(raw){
  const state=fresh();
  if(!raw||typeof raw!=='object'||raw.version!==1)return state;
  state.phase=['prep','active','result'].includes(raw.phase)?raw.phase:'prep';
  state.wave=waveNumber(raw.wave);state.cleared=integer(raw.cleared,0,0,MAX_WAVE);state.round=integer(raw.round,0,0,1e9);
  state.prepScheduledRound=Number.isInteger(raw.prepScheduledRound)&&raw.prepScheduledRound>=0&&raw.prepScheduledRound<=state.round?raw.prepScheduledRound:-1;state.prepRemaining=finite(raw.prepRemaining,150,0,150);
  state.elapsed=finite(raw.elapsed,0,0,plan(state.wave).duration);state.gateSeconds=finite(raw.gateSeconds,1,1,2.5);state.boxes=integer(raw.boxes,3,0,3);
  state.claimedFirst=[...new Set((Array.isArray(raw.claimedFirst)?raw.claimedFirst:[]).slice(0,1024).filter(n=>Number.isInteger(n)&&n>=1&&n<=MAX_WAVE))];
  for(let wave=1;wave<=state.cleared;wave++)if(!state.claimedFirst.includes(wave))state.claimedFirst.push(wave);
  const result=normalizedResult(raw.result);
  // A stored settlement is authoritative: never turn it back into a payable active round.
  if(result&&(state.phase==='result'||state.phase==='active')){state.phase='result';state.result=result;state.wave=result.wave;state.elapsed=finite(raw.elapsed,plan(state.wave).duration,0,plan(state.wave).duration);}
  else if(state.phase==='result')state.phase='prep';
  if(state.result?.win){state.cleared=Math.max(state.cleared,state.result.wave);if(!state.claimedFirst.includes(state.result.wave))state.claimedFirst.push(state.result.wave);}
  state.claimedFirst.sort((a,b)=>a-b);
  const definition=plan(state.wave),seen=new Set(),seenSpawns=new Set();
  for(const row of (Array.isArray(raw.enemies)?raw.enemies:[]).slice(0,definition.spawns.length)){
   if(!row||!['rat','scout','guard','chief'].includes(row.kind)||!['upper','lower'].includes(row.lane)||!Number.isInteger(row.key)||row.key<1||row.key>MAX_KEY||seen.has(row.key))continue;
   const spawnIndex=Number.isInteger(row.spawnIndex)?row.spawnIndex:definition.spawns.findIndex((item,i)=>!seenSpawns.has(i)&&item.kind===row.kind&&item.lane===row.lane),item=definition.spawns[spawnIndex];
   if(!item||seenSpawns.has(spawnIndex)||item.kind!==row.kind||item.lane!==row.lane)continue;
   seen.add(row.key);seenSpawns.add(spawnIndex);
   const maxHp=item.hp,travel=finite(row.travel,0,0,pathLength(item.lane)),atGate=row.atGate===true||travel>=pathLength(item.lane)-EPS;
   const hp=finite(row.hp,maxHp,0,maxHp),gateTime=atGate?finite(row.gateTime,0,0,state.gateSeconds):0;
   const enemy={key:row.key,spawnIndex,kind:item.kind,lane:item.lane,x:0,y:0,r:item.r,speed:item.speed,armor:item.armor,hp,maxHp,travel:atGate?pathLength(item.lane):travel,slowUntil:finite(row.slowUntil,0,0,definition.duration+1.5),alive:row.alive===true&&hp>0&&gateTime<state.gateSeconds,atGate,gateTime};
   if(!enemy.alive)enemy.resolvedAt=finite(row.resolvedAt,state.elapsed,0,state.elapsed);position(enemy);state.enemies.push(enemy);
  }
  state.spawned=Math.max(integer(raw.spawned,0,0,definition.spawns.length),state.enemies.length);
  if(state.phase==='active'&&state.elapsed>0)state.spawned=Math.max(state.spawned,definition.spawns.filter(e=>e.at<state.elapsed-EPS).length);
  const missing=state.phase==='active'?state.spawned-state.enemies.length:0;
  state.kills=integer(raw.kills,0,0,state.spawned);
  state.escaped=Math.max(integer(raw.escaped,0,0,state.spawned-state.kills),Math.min(missing,state.spawned-state.kills));
  state.boxes=Math.min(state.boxes,Math.max(0,3-state.escaped));
  state.nextKey=Math.max(integer(raw.nextKey,1,1,MAX_KEY+1),...state.enemies.map(e=>e.key+1));
  if(state.result){state.boxes=state.result.boxes;state.kills=state.result.kills;state.escaped=state.result.escaped;}
  for(const key of Object.keys(state.journey))state.journey[key]=finite(raw.journey?.[key],0,0,key==='seconds'?1e9:1e12);
  state.completed=state.cleared===MAX_WAVE;state.completedAtRound=state.completed?integer(raw.completedAtRound,state.round,0,state.round):0;
  return state;
 }
 function start(state,options={}){
  if(!state||!['prep','result'].includes(state.phase)||state.phase==='result'&&state.result?.win&&state.result.wave===MAX_WAVE&&options.replay!==true)return false;
  state.wave=state.phase==='result'&&state.result?waveNumber(state.result.wave+(state.result.win?1:0)):waveNumber(state.wave);
  state.phase='active';state.round=integer(state.round,0,0,1e9)+1;state.elapsed=0;state.boxes=3;state.enemies=[];state.spawned=0;state.kills=0;state.escaped=0;state.result=null;
  state.nextKey=integer(state.nextKey,1,1,MAX_KEY+1);
  return true;
 }
 function spawnDue(state,definition){
  while(state.spawned<definition.spawns.length&&definition.spawns[state.spawned].at<=state.elapsed+EPS){
   const item=definition.spawns[state.spawned++];
   state.enemies.push({key:state.nextKey++,spawnIndex:item.spawnIndex,kind:item.kind,lane:item.lane,x:WORLD.entryX,y:laneY(item.lane),r:item.r,speed:item.speed,armor:item.armor,hp:item.hp,maxHp:item.hp,travel:0,slowUntil:0,alive:true,atGate:false,gateTime:0});
  }
 }
 function escape(state,enemy,at=state.elapsed){
  if(!enemy.alive)return;
  enemy.alive=false;enemy.resolvedAt=at;state.escaped++;state.boxes=Math.max(0,state.boxes-1);
 }
 function advance(state,enemy,from,to,speed){
  let time=from;
  while(enemy.alive&&time<to-EPS){
   if(enemy.atGate){
    const delta=Math.min(to-time,state.gateSeconds-enemy.gateTime);
    enemy.gateTime+=delta;time+=delta;
    if(enemy.gateTime>=state.gateSeconds-EPS){enemy.gateTime=state.gateSeconds;escape(state,enemy,time);}
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
  const chiefDefeated=state.enemies.some(e=>e.kind==='chief'&&e.hp===0)&&state.enemies.filter(e=>e.kind==='chief').every(e=>e.hp===0),win=state.boxes>0&&(state.wave!==MAX_WAVE||chiefDefeated),first=win&&!state.claimedFirst.includes(state.wave);
  if(win){state.cleared=Math.max(state.cleared,state.wave);if(first)state.claimedFirst.push(state.wave);if(state.wave===MAX_WAVE){state.completed=true;if(!state.completedAtRound)state.completedAtRound=state.round;}}
  const result={wave:state.wave,win,boxes:state.boxes,kills:state.kills,escaped:state.escaped,gold:goldFor(state.wave,win,state.boxes,first),first,...(state.wave===MAX_WAVE?{chiefDefeated}:{})};
  state.phase='result';state.result=result;
  return {type:'settle',result:{...result}};
 }
 function resolved(state,definition){return state.spawned===definition.spawns.length&&state.enemies.length===definition.spawns.length&&state.enemies.every(e=>!e.alive);}
 function finishResolved(state){state.elapsed=Math.min(state.elapsed,Math.max(...state.enemies.map(e=>e.resolvedAt??state.elapsed)));return [settle(state)];}
 function tick(state,dt,context){
  if(!state||state.phase!=='active'||!Number.isFinite(dt)||dt<0)return [];
  if(context&&Object.hasOwn(context,'gateBuilt'))state.gateSeconds=context.gateBuilt===true?2.5:1;
  const definition=plan(state.wave),end=Math.min(definition.duration,state.elapsed+dt);
  spawnDue(state,definition);if(resolved(state,definition))return finishResolved(state);
  while(state.elapsed<end-EPS){
   const nextSpawn=definition.spawns[state.spawned]?.at??Infinity;
   const next=Math.min(end,state.elapsed+.25,nextSpawn);
   for(const enemy of state.enemies)if(enemy.alive)advance(state,enemy,state.elapsed,next,enemy.speed);
   state.elapsed=next;spawnDue(state,definition);if(resolved(state,definition))return finishResolved(state);
  }
  state.elapsed=end;
  if(resolved(state,definition))return finishResolved(state);
  if(state.elapsed>=definition.duration-EPS){state.elapsed=definition.duration;return [settle(state)];}
  return [];
 }
 function hit(state,key,amount,role){
  if(!state||state.phase!=='active'||!Number.isFinite(amount)||amount<=0)return {applied:0,killed:false};
  const enemy=state.enemies.find(e=>e.key===key&&e.alive);
  if(!enemy)return {applied:0,killed:false};
  const applied=Math.min(enemy.hp,Math.max(0,amount-((role==='sword'||role==='ballista')?0:enemy.armor||0)));enemy.hp-=applied;
  const killed=enemy.hp<=0;
  if(killed){enemy.hp=0;enemy.alive=false;enemy.resolvedAt=state.elapsed;state.kills++;}
  else if(role==='sword')enemy.slowUntil=state.elapsed+1.5;
  return {applied,killed};
 }
 function target(state,point,range,options={}){
  if(!state||state.phase!=='active'||!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(range)||range<0)return null;
  let best=null,bestDistance=Infinity,bestRemaining=Infinity;
  for(const enemy of state.enemies){
   if(!enemy.alive)continue;
   const distance=Math.hypot(point.x-enemy.x,point.y-enemy.y);
   if(distance>range+(options?.includeEnemyRadius?finite(enemy.r,13,0,100):0)||distance<(options?.minRange||0))continue;
   const remaining=pathLength(enemy.lane)-enemy.travel;
   if(!best||remaining<bestRemaining-EPS||(Math.abs(remaining-bestRemaining)<=EPS&&(distance<bestDistance-EPS||(Math.abs(distance-bestDistance)<=EPS&&enemy.key<best.key)))){best=enemy;bestDistance=distance;bestRemaining=remaining;}
  }
  return best;
 }
 const RECIPES={woodcutter:{wood:[6,4],stone:[0,0]},miner:{wood:[8,4],stone:[4,2]},arch:{wood:[12,6],stone:[6,3]},sword:{wood:[10,5],stone:[8,4]},farmer:{wood:[16,6],stone:[6,2]},ballista:{wood:[28,8],stone:[16,4]}};
 function recipe(id,owned,n=1){
  if(!Object.hasOwn(RECIPES,id))return null;
  const count=integer(n,0,0,MAX_COUNT),existing=integer(owned,0,0,MAX_COUNT),indices=count*existing+count*(count-1)/2,definition=RECIPES[id];
  return {wood:count*definition.wood[0]+indices*definition.wood[1],stone:count*definition.stone[0]+indices*definition.stone[1],gold:0};
 }
 function stats(id,camp){
  const tools=camp?.tools||{},wood=integer(tools.wood,0,0,2),stone=integer(tools.stone,0,0,2);
  if(id==='woodcutter')return {damage:0,interval:[5,2.5,1.5][wood],range:0};
  if(id==='farmer')return {damage:0,interval:8,range:0};
  if(id==='ballista')return {damage:20,interval:6,range:160,minRange:60};
  if(id==='miner')return {damage:0,interval:[6,3,2][stone],range:0};
  if(id==='arch')return {damage:5,interval:1.3,range:camp?.beacon===true?110:90};
  if(id==='sword')return {damage:3,interval:1.2,range:28};
  return null;
 }
 return {WORLD,MAX_WAVE,fresh,migrate,preparationSeconds,preparationTick,chapter,plan,nextRequirement,start,tick,hit,target,recipe,stats};
});
