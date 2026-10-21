/* Shared, deterministic rules for the Mythos Slayers rework. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MythosCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const Supply=typeof module==='object'&&module.exports?require('./supply-core.js'):globalThis.SupplyCore;
 const Outpost=typeof module==='object'&&module.exports?require('./outpost-core.js'):null;
 const VERSION=3, MAX_LEVEL=500;
 const SKILLS={strike:3,critical:3,rhythm:3,storm:1,haste:3,quartermaster:3,awakening:3,camp:3,covenant:1,fortune:3,bounty:3,memory:3,aurora:1};
 const BRANCHES={storm:['strike','critical','rhythm'],covenant:['haste','quartermaster','awakening','camp'],aurora:['fortune','bounty','memory']};
 const num=(v,f=0,max=1e150)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Number(v))):f;
 const integer=(v,f=0,max=MAX_LEVEL)=>Math.floor(num(v,f,max));
 const skill=(s,id)=>integer(s.skills?.[id],0,SKILLS[id]||0);
 function fresh(ids=[]){return {version:VERSION,gold:350,earned:0,globalWave:1,bossWave:1,bossCycle:1,clearedBossWave:0,runBest:0,prestige:0,renown:0,souls:0,soulsEarned:0,skills:{},goldBonus:1,gameCleared:false,owned:Object.fromEntries(ids.map(id=>[id,0])),ulvl:Object.fromEntries(ids.map(id=>[id,0])),hero:{click:0,gpk:0,crate:0,cmult:0,gold:0,combo:0,aspd:0,vitality:0,armor:0},bossKills:{},codex:[],measureBests:{},measureGift:false,lastSeen:Date.now(),factory:null,outpost:null,camp:null,battle:null,pending:{},pendingRefunds:{},firstWorkerPickup:false,activity:'gather',captainHp:100,bossHp:0,bossHpMax:0};}
 function migrateCamp(raw,factory){
  if(!raw||raw.version!==1||!factory)return null;
  const key=value=>Number.isInteger(value)&&value>=1&&value<=1e12;
  const coordinate=(value,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,value)):null;
  const camp={version:1,links:[],cargo:[],nextKey:1,tools:{wood:integer(raw.tools?.wood,0,2),stone:integer(raw.tools?.stone,0,2)},gate:raw.gate===true,beacon:raw.beacon===true,cart:raw.cart===true,endingSeen:raw.endingSeen===true},links=new Set(),cargoKeys=new Set();
  for(const link of (Array.isArray(raw.links)?raw.links:[]).slice(0,500)){
   if(!link||!key(link.nodeKey)||!['wood','stone'].includes(link.type)||links.has(link.nodeKey))continue;
   if(!factory.nodes.some(node=>node.key===link.nodeKey&&node.type===link.type))continue;
   links.add(link.nodeKey);camp.links.push({nodeKey:link.nodeKey,type:link.type});
  }
  for(const item of (Array.isArray(raw.cargo)?raw.cargo:[]).slice(0,10000)){
   if(!item||!key(item.key)||cargoKeys.has(item.key)||!['wood','stone','gold'].includes(item.type)||!Number.isFinite(item.count)||item.count<=0)continue;
   const x=coordinate(item.from?.x,960),y=coordinate(item.from?.y,540);
   if(x===null||y===null)continue;
   const duration=Number.isFinite(item.duration)?Math.max(.1,Math.min(30,item.duration)):.6;
   const mode=['manual','rail'].includes(item.mode)?item.mode:duration>.61?'rail':'manual';
   cargoKeys.add(item.key);camp.cargo.push({key:item.key,type:item.type,count:Math.min(1e9,item.count),from:{x,y},progress:Number.isFinite(item.progress)?Math.max(0,Math.min(1,item.progress)):0,duration,worker:item.worker===true,source:key(item.source)?item.source:null,mode});
  }
  camp.nextKey=Math.max(key(raw.nextKey)?raw.nextKey:1,...camp.cargo.map(item=>item.key+1));
  return camp;
 }
 function migrate(raw,ids=[],now=Date.now()){
  const r=raw&&typeof raw==='object'?raw:{},s=fresh(ids);
  s.gold=num(r.gold,150);s.globalWave=integer(r.globalWave,1,1e12)||1;s.bossWave=Math.max(1,integer(r.bossWave,1,40));s.bossCycle=Math.max(1,integer(r.bossCycle,1,100));
  s.clearedBossWave=integer(r.clearedBossWave,0,40);s.runBest=Math.max(s.clearedBossWave,integer(r.runBest,0,40));s.prestige=integer(r.prestige,0,1e6);s.gameCleared=r.gameCleared===true;
  const legacy=r.version!==VERSION;
  s.renown=legacy?Math.max(s.prestige*10,num(r.goldBonus,1)>1?Math.round(Math.log1p(num(r.goldBonus,1))*8):0):num(r.renown,0,1e9);
  s.souls=integer(r.souls,legacy?Math.min(8,s.prestige*2):0,1e6);s.soulsEarned=integer(r.soulsEarned,s.souls,1e6);
  for(const id of Object.keys(SKILLS))s.skills[id]=legacy?0:integer(r.skills?.[id],0,SKILLS[id]);
  s.firstWorkerPickup=r.firstWorkerPickup===true||(r.clearedBossWave>0&&(r.owned?.woodcutter||0)>0);s.pending={};s.activity=r.activity==='battle'?'battle':'gather';
  for(const id of ids){s.owned[id]=integer(r.owned?.[id],0,100000);s.ulvl[id]=integer(r.ulvl?.[id]);s.pending[id]=integer(r.pending?.[id],0,s.owned[id]);
   const refunds=Array.isArray(r.pendingRefunds?.[id])?r.pendingRefunds[id]:[];
   if(refunds.length)s.pendingRefunds[id]=refunds.slice(0,s.pending[id]).map(item=>({wood:Number.isFinite(item?.wood)?Math.max(0,Math.min(1e9,item.wood)):0,stone:Number.isFinite(item?.stone)?Math.max(0,Math.min(1e9,item.stone)):0,gold:Number.isFinite(item?.gold)?Math.max(0,Math.min(1e150,item.gold)):0}));
  }
  // Early sequel prototypes used the old coin collectors. Retain their people as supply workers.
  for(const [old,id] of [['farmer','woodcutter'],['villager','porter']])if(ids.includes(id)&&!ids.includes(old)){
   s.owned[id]=Math.min(100000,s.owned[id]+integer(r.owned?.[old],0,100000));s.ulvl[id]=Math.max(s.ulvl[id],integer(r.ulvl?.[old]));
  }
  for(const id of Object.keys(s.hero))s.hero[id]=integer(r.hero?.[id],0,id==='crate'?35:id==='aspd'?40:MAX_LEVEL);
  for(const [key,value]of Object.entries(r.bossKills||{}))if(/^(?:[1-9]|[1-3][0-9]|40)$/.test(key))s.bossKills[key]=integer(value,0,1e9);
  s.codex=[...new Set((Array.isArray(r.codex)?r.codex:legacy?Array.from({length:s.gameCleared?40:s.clearedBossWave},(_,i)=>i+1):[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=40))];
  for(const sec of [5,10,30]){const entry=r.measureBests?.[sec];if(entry&&Number.isInteger(entry.count)&&entry.count>=0&&entry.count<=sec*100)s.measureBests[sec]={count:entry.count,at:num(entry.at,now,now)};}
  s.respecUsed=r.respecUsed===true;s.measureGift=legacy||r.measureGift===true;s.lastSeen=num(r.lastSeen,now,now);s.bossHp=num(r.bossHp);s.bossHpMax=num(r.bossHpMax);
  if(r.battle&&Number.isFinite(r.battle.width)&&Number.isFinite(r.battle.height)){
   const known=new Set(ids),rows=Array.isArray(r.battle.units)?r.battle.units:[];
   s.battle={width:Math.max(1,num(r.battle.width,1100,1e6)),height:Math.max(1,num(r.battle.height,500,1e6)),captain:{x:num(r.battle.captain?.x,150,1e6),y:num(r.battle.captain?.y,370,1e6)},units:rows.filter(a=>Array.isArray(a)&&a.length===6&&known.has(a[0])&&a.slice(1).every(Number.isFinite)).map(a=>[a[0],integer(a[1],0,100000),num(a[2],0,1e6),num(a[3],0,1e6),a[4]>=0?num(a[4],0,1e6):-1,a[5]>=0?num(a[5],0,1e6):-1])};
  }
  s.factory=Supply.migrate(r.factory);s.outpost=(Outpost||globalThis.OutpostCore)?.migrate(r.outpost)||null;s.camp=migrateCamp(r.camp,s.factory);s.captainHp=num(r.captainHp,heroMax(s),heroMax(s));s.goldBonus=mastery(s);if(legacy)s.migrated=true;
  return s;
 }
 const mastery=s=>(1+.35*Math.sqrt(num(s.renown,0,1e9)))*(1+.05*skill(s,'memory'));
 const cycleHp=s=>Math.pow(4,Math.max(0,s.bossCycle-1));
 const cycleGold=s=>Math.pow(2.5,Math.max(0,s.bossCycle-1));
 const hp=s=>Math.floor(300*Math.pow(2.23,s.bossWave-1)*cycleHp(s));
 const goldMultiplier=s=>(1+.1*s.hero.gold)*mastery(s)*(1+.08*skill(s,'fortune'));
 const baseGold=s=>180*Math.pow(1.9,s.bossWave-1)*cycleGold(s)*goldMultiplier(s);
 const killGold=s=>Math.floor(baseGold(s)*(1+.2*s.hero.gpk));
 function contract(s){const base=killGold(s),first=s.clearedBossWave<s.bossWave?base:0,repeat=((s.bossKills[s.bossWave]||0)+1)%5===0?Math.floor(base*.5*(1+.1*skill(s,'bounty'))*(skill(s,'aurora')?2:1)):0;return {base,first,repeat,total:base+first+repeat};}
 const comboCap=s=>.2+.03*skill(s,'rhythm')+.01*Math.min(30,s.hero.combo);
 const discount=s=>1-.05*skill(s,'quartermaster');
 const trainingBase=u=>u.base<=600?u.base:600*Math.pow(u.base/600,.82);
 const unitCost=(s,u,count=s.owned[u.id]||0)=>u.worker?0:Math.ceil(trainingBase(u)*Math.pow(1+count/25,1.15)*discount(s));
 const upgradeCost=(s,u,lv=s.ulvl[u.id]||0)=>lv>=MAX_LEVEL?Infinity:Math.ceil(trainingBase(u)*1.2*Math.pow(1.14,lv)*discount(s)*(1-.04*skill(s,'awakening')));
 const heroScale={click:1.30,gpk:1.35,crate:1.4,cmult:1.45,gold:1.38,combo:1.4,aspd:1.25,vitality:1.35,armor:1.4};
 const heroCost=(s,h)=>Math.ceil(h.base*Math.pow(heroScale[h.id]||h.scale,s.hero[h.id]));
 const tier=lv=>lv>=50?3:lv>=25?2:lv>=10?1:0;
 const nextEvolution=lv=>lv<10?10:lv<25?25:lv<50?50:Math.ceil((lv+1)/25)*25;
 const awaken=lv=>Math.pow(1.8,tier(lv))*Math.pow(1.03,Math.max(0,lv-50));
 const damage=(s,u,lv=s.ulvl[u.id]||0)=>u.worker||u.healer?0:Math.max(u.dmg||0,.035*Math.pow(u.powerBase||u.base,.85)*u.iv)*(1+.3*lv)*Math.pow(1.06,lv)*awaken(lv);
 const interval=(s,u)=>u.iv/Math.min(3.5,(1+.05*s.hero.aspd)*(1+.05*skill(s,'haste'))*(u.worker?Math.min(4,1+.06*(s.ulvl[u.id]||0)):1));
 const unitDps=(s,u,lv=s.ulvl[u.id]||0)=>u.healer||u.worker||!s.owned[u.id]?0:damage(s,u,lv)*Math.max(0,(s.owned[u.id]||0)-(s.pending?.[u.id]||0))/interval(s,u);
 const formation=(s,units)=>1+.13*Math.max(0,Math.min(3,new Set(units.filter(u=>(s.owned[u.id]||0)>(s.pending?.[u.id]||0)).map(role)).size-1));
 const armyDps=(s,units)=>units.reduce((n,u)=>n+unitDps(s,u),0)*formation(s,units);
 const clickBase=lv=>Math.max(1,Math.round(3*Math.pow(1.18,lv)*Math.pow(1.25,Math.floor(lv/10))));
 const clickDamage=(s,armyDps=0)=>(clickBase(s.hero.click)+armyDps*Math.min(.25,.04+s.hero.click*.0015))*(1+.08*skill(s,'strike'));
 const soulsFor=s=>Math.floor(s.clearedBossWave/5)+Math.max(0,s.bossCycle-1)*2;
 function rebirth(s,ids){const n=fresh(ids);for(const k of ['skills','codex','measureBests','measureGift','gameCleared','soulsEarned'])n[k]=structuredClone(s[k]);const reward=soulsFor(s);n.prestige=s.prestige+1;n.renown=s.renown+s.clearedBossWave+Math.max(0,s.bossCycle-1)*10;n.souls=s.souls+reward;n.soulsEarned+=reward;n.goldBonus=mastery(n);return n;}
 function canBuySkill(s,id){if(!Object.hasOwn(SKILLS,id)||skill(s,id)>=SKILLS[id])return false;const cap=Object.hasOwn(BRANCHES,id);return s.souls>=(cap?4:1)&&(!cap||BRANCHES[id].reduce((n,key)=>n+skill(s,key),0)>=4);}
 function buySkill(s,id){if(!canBuySkill(s,id))return false;const cost=Object.hasOwn(BRANCHES,id)?4:1;s.skills[id]=skill(s,id)+1;s.souls-=cost;s.goldBonus=mastery(s);return cost;}
 function refund(s){const spent=Object.keys(SKILLS).reduce((n,id)=>n+skill(s,id)*(Object.hasOwn(BRANCHES,id)?4:1),0);s.skills={};s.souls+=spent;s.goldBonus=mastery(s);return spent;}
 function offline(s,units,now=Date.now()){
  const seconds=Math.min(8*3600,Math.max(0,(now-s.lastSeen)/1000));if(seconds<60)return {seconds:0,gold:0};
  // Patrol only a cleared contract. Neither selecting a harder boss nor collector counts mint money.
  const wave=s.clearedBossWave;if(!wave)return {seconds,gold:0};
  const patrol={...s,bossWave:wave},dps=armyDps(s,units),killSeconds=dps>0?Math.max(30,hp(patrol)/dps+1.5):Infinity;
  return {seconds,gold:Math.min(1e150,Math.floor(seconds*(.5+.05*skill(s,'camp'))*killGold(patrol)/killSeconds))};
 }
 const heroMax=s=>100+15*(s.hero.vitality||0)+3*s.hero.click;
 const healPower=(s,u)=>2*Math.pow(1.06,s.ulvl[u.id]||0)*Math.pow(1.8,tier(s.ulvl[u.id]||0));
 const role=u=>u.worker?'gather':u.healer?'healer':u.proj==='cannonball'||['heavy','dwarfb','dwarfw','dark','darkgod'].includes(u.id)?'breaker':u.ranged?'piercer':'vanguard';
 const chapter=wave=>Math.min(7,Math.floor((wave-1)/5));
 return {heroMax,healPower,VERSION,MAX_LEVEL,SKILLS,BRANCHES,num,integer,skill,fresh,migrate,mastery,cycleHp,cycleGold,hp,goldMultiplier,baseGold,killGold,contract,comboCap,trainingBase,unitCost,upgradeCost,heroCost,tier,nextEvolution,awaken,damage,interval,unitDps,formation,armyDps,clickBase,clickDamage,soulsFor,rebirth,canBuySkill,buySkill,refund,offline,role,chapter};
});
