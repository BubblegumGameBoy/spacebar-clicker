/* Small, saved outpost rounds. Only enemies move; presentation and payment live outside this module. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.OutpostCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const WORLD=Object.freeze({width:960,height:540,home:Object.freeze({x:100,y:340}),entryX:925,turnX:190,upper:185,lower:435});
 const MAX_WAVE=9,GATE_SECONDS=1,EPS=1e-9,MAX_COUNT=1e6,MAX_KEY=1e12,PLAN_VERSION=3,PIERCE=['sword','ballista'];
 const finite=(value,fallback=0,min=0,max=1e9)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
 const integer=(value,fallback=0,min=0,max=1e9)=>Math.floor(finite(value,fallback,min,max));
 const waveNumber=value=>integer(value,1,1,MAX_WAVE);
 const laneY=lane=>WORLD[lane==='lower'?'lower':'upper'];
 const pathLength=lane=>WORLD.entryX-WORLD.turnX+Math.hypot(WORLD.turnX-WORLD.home.x,laneY(lane)-WORLD.home.y);
 const flightLength=lane=>Math.hypot(WORLD.entryX-WORLD.home.x,laneY(lane)-WORLD.home.y);
 /* One row per enemy. Rules read `traits` and the trait's own numbers; drawing reads `height`, `bar` and `art`.
    art.sheet is the production 2x2 sheet; art.fallback is the provisional look (tinted rat + canvas overlay) used if that sheet fails to load. */
 const fallback=(tint,overlay)=>({sheet:'mob-rat',tint,overlay});
 const ENEMIES=Object.freeze({
  rat:{hp:26,speed:25,armor:0,r:13,height:43,bar:'#e1a084',traits:[],art:{sheet:'mob-rat',tint:null,scale:1,overlay:null},name:['ネズミ','Rat','老鼠'],note:['基本の敵','Basic raider','基础敌人']},
  scout:{hp:16,speed:34,armor:0,r:10,height:34,bar:'#e1a084',traits:[],art:{sheet:'mob-rat',tint:null,scale:1,overlay:null},name:['俊足ネズミ','Runner','迅捷鼠'],note:['足が速い。弓兵で止める','Fast. Stop it with archers','速度快，用弓兵拦截']},
  guard:{hp:42,speed:19,armor:2,r:16,height:51,bar:'#c5cabb',traits:[],art:{sheet:'mob-rat',tint:null,scale:1,overlay:'guard'},name:['鎧ネズミ','Armoured rat','铁甲鼠'],note:['鎧2：弓の矢が通りにくい。剣士・バリスタは貫通','Armour 2: arrows lose damage. Swords and ballistas pierce','护甲2：箭矢伤害降低。剑士和弩炮可贯穿']},
  chief:{hp:240,speed:19,armor:2,r:25,height:110,bar:'#e1a084',traits:['boss'],art:{sheet:'mob-captain',tint:null,scale:1,overlay:null,death:3},name:['頭領','Captain','首领'],note:['倒すと章の勝利','Defeat it to win the chapter','击败它即可赢得本章']},
  shield:{hp:30,speed:20,armor:1,r:14,height:50,bar:'#b9a27a',traits:['shield'],shield:3,art:{sheet:'mob-shield',uniform:true,death:3,fallback:fallback({hue:20,light:.95},'shield')},name:['盾持ちネズミ','Shield Rat','持盾鼠'],note:['盾が弓の矢を3発まで防ぎ、鎧1。剣士かバリスタの1撃で盾が割れる','Its shield stops 3 arrows (armour 1). One sword or ballista hit breaks it','盾牌可挡下3支箭（护甲1）。剑士或弩炮一击即可击碎']},
  bat:{hp:14,speed:32,armor:0,r:11,height:40,lift:30,bar:'#b59ac7',traits:['fly'],art:{sheet:'mob-bat',uniform:true,death:3,fallback:fallback({hue:250,light:.8},'wings')},name:['夜コウモリ','Night Bat','夜蝠'],note:['飛行：道を通らず倉庫へ直進。剣士とバリスタは届かない。倉庫寄りの弓兵で','Flies straight to the camp. Swords and ballistas cannot hit it; keep archers near home','飞行：直扑仓库。剑士和弩炮打不到，在仓库附近布置弓兵']},
  ooze:{hp:28,speed:18,armor:0,r:15,height:38,bar:'#c6d460',traits:['split'],split:{kind:'oozelet',count:2},art:{sheet:'mob-ooze',uniform:true,death:3,fallback:fallback({hue:70,light:1.1},'slime')},name:['分裂粘菌','Splitting Ooze','分裂黏菌'],note:['倒すと小さな粘菌2体に分かれる。連射の弓兵が有効','Splits into 2 oozelets. Rapid archers deal with them','被击败后分裂成2只小黏菌。连射的弓兵有效']},
  oozelet:{hp:8,speed:26,armor:0,r:9,height:22,bar:'#c6d460',traits:[],art:{sheet:'mob-oozelet',uniform:true,death:3,fallback:fallback({hue:70,light:1.1},'slime')},name:['小粘菌','Oozelet','小黏菌'],note:['分裂粘菌から出る小さな粘菌','A small piece of a splitting ooze','分裂黏菌分出的小黏菌']},
  mole:{hp:34,speed:24,armor:1,r:14,height:40,bar:'#b08a64',traits:['burrow'],burrow:[.25,.62],art:{sheet:'mob-mole',uniform:true,death:3,burrow:'mob-mole-burrow',fallback:fallback({hue:30,light:.7},'claws')},name:['穴掘りモグラ','Burrowing Mole','掘地鼹鼠'],note:['道の中ほどは地中で狙えない。曲がり角の手前で地上に出る','Underground mid-road and cannot be hit. Surfaces before the bend','道路中段在地下无法攻击，在拐角前钻出']},
  shaman:{hp:30,speed:17,armor:0,r:13,height:52,bar:'#9fd39a',traits:['heal'],heal:{radius:50,amount:4,every:2},art:{sheet:'mob-shaman',uniform:true,death:3,fallback:fallback({hue:110,light:.85},'staff')},name:['祈祷ネズミ','Rat Shaman','鼠巫'],note:['列の後ろから、近くの味方を2秒ごとに4回復。射程の長いバリスタで','Heals nearby raiders by 4 every 2s from the back. Reach it with a ballista','在队尾每2秒为附近敌人回复4点。用远射程的弩炮']},
  beetle:{hp:90,speed:12,armor:2,r:17,height:42,bar:'#a7adb3',traits:['carapace'],carapace:2,art:{sheet:'mob-beetle',uniform:true,death:3,fallback:fallback({hue:200,light:.6},'shell')},name:['鉄甲虫','Iron Beetle','铁甲虫'],note:['遅いが、前からの矢をほぼ弾く。剣士・バリスタは貫通','Slow, but its shell deflects arrows from the front. Swords and ballistas pierce','速度慢，但甲壳几乎弹开正面的箭。剑士和弩炮可贯穿']},
  swarm:{hp:50,speed:30,armor:0,r:16,height:30,bar:'#c9b8a8',traits:['pack'],pack:{count:10,each:5},art:{sheet:'mob-swarm',uniform:true,death:3,fallback:fallback({hue:0,light:1.2},'pack')},name:['子ネズミの群れ','Mouse Swarm','鼠群'],note:['10匹の群れ。1撃で倒せるのは1匹だけ。弓の連射で','A pack of 10. Each hit fells one mouse; rapid arrows win','10只一群，每次攻击只能击倒1只。用弓的连射']},
  wisp:{hp:18,speed:30,armor:0,r:11,height:40,lift:10,bar:'#7fd7d9',traits:['hidden'],reveal:44,art:{sheet:'mob-wisp',uniform:true,death:3,fallback:fallback({hue:180,light:1.3},'flame')},name:['鬼火','Will-o\'-Wisp','鬼火'],note:['近くの仲間にしか見えない。道のそばの剣士が見つけ、足止めする','Only visible to allies right beside the road. Swords there reveal and slow it','只有贴近道路的伙伴才能看见。路边的剑士能发现并拖住它']},
  siegecart:{hp:80,speed:13,armor:3,r:22,height:56,bar:'#b9915c',traits:['cargo'],split:{kind:'rat',count:3,hp:14},art:{sheet:'mob-siegecart',uniform:true,death:3,fallback:fallback({hue:35,light:.8},'cart')},name:['攻城荷車','Siege Cart','攻城车'],note:['鎧3で硬い。壊すと中から鼠が3匹出る','Armour 3. Breaking it releases 3 rats','护甲3，击毁后会冲出3只老鼠']},
  slinger:{hp:18,speed:26,armor:0,r:12,height:44,bar:'#d0a070',traits:['sling'],sling:{at:230,seconds:8},art:{sheet:'mob-slinger',uniform:true,death:3,fallback:fallback({hue:15,light:1},'sling')},name:['石投げネズミ','Slinger Rat','投石鼠'],note:['道の途中で止まり、離れた所から箱に石を投げる。前に届く射程で','Stops mid-road and stones the crates from afar. Reach forward','在道路中途停下，远程向箱子投石。需要能打到前方的射程']},
  toad:{hp:260,speed:15,armor:1,r:28,height:86,bar:'#a8c070',traits:['boss','leap'],leap:{every:6,distance:70},art:{sheet:'mob-toad',uniform:true,death:3,fallback:fallback({hue:90,light:.8},null)},name:['大ガマ','Giant Toad','巨蟾']},
  boar:{hp:220,speed:20,armor:4,r:28,height:80,bar:'#b08a64',traits:['boss','charge'],art:{sheet:'mob-boar',uniform:true,death:3,fallback:fallback({hue:20,light:.6},null)},name:['鉄牙の猪','Iron-tusk Boar','铁牙野猪']},
  envoy:{hp:200,speed:22,armor:0,r:24,height:100,lift:40,bar:'#9a8aa8',traits:['boss','fly'],art:{sheet:'mob-envoy',uniform:true,death:3,fallback:fallback({hue:270,light:.4},'wings')},name:['異界の使い','Otherworld Envoy','异界使者']}
 });
 ENEMIES.toad.note=['ときどき大きく跳んで前へ出る','Leaps forward every few seconds','不时向前大跳'];ENEMIES.boar.note=['鎧4。剣士の足止めが効かない','Armour 4. Sword slows do not stop it','护甲4，剑士的减速无效'];ENEMIES.envoy.note=['飛行の頭領。弓兵だけが届く','A flying boss: only archers reach it','飞行首领，只有弓兵能打到'];
 for(const row of Object.values(ENEMIES)){Object.freeze(row.traits);Object.freeze(row);}
 const KINDS=Object.freeze(Object.keys(ENEMIES));
 const has=(enemy,trait)=>!!ENEMIES[enemy?.kind]?.traits.includes(trait);
 const def=kind=>ENEMIES[kind]||ENEMIES.rat;
 function lengthOf(enemy){const d=def(enemy.kind);return d.sling?Math.min(d.sling.at,pathLength(enemy.lane)):d.traits.includes('fly')?flightLength(enemy.lane):pathLength(enemy.lane);}
 function gateLimit(state,enemy){const d=def(enemy.kind);return d.sling?d.sling.seconds:state.gateSeconds;}
 function burrowed(enemy){const d=def(enemy.kind);if(!d.burrow||!enemy.alive)return false;const t=enemy.travel/pathLength(enemy.lane);return t>d.burrow[0]+EPS&&t<d.burrow[1]-EPS;}
 // Visible to allies: hidden kinds only while `seen` (set by the battle sim from real ally positions). Burrowed moles never.
 function exposed(enemy){return !burrowed(enemy)&&(!has(enemy,'hidden')||enemy.seen===true);}
 function canStrike(enemy,role){if(!exposed(enemy))return false;if(has(enemy,'fly')&&PIERCE.includes(role))return false;return true;}
 /* Threat (M5): conditions chosen at departure, fixed for the whole run. Points add up to the threat level.
    Each one changes a decision (who, where, what first); none simply multiplies enemy HP. Rules live in plan()/start()/preparationSeconds(),
    the crew slot rule in ExpeditionCore. `decide` is the decision it asks of the player (shown in the picker). */
 const HEAT=Object.freeze({
  horde:{points:1,name:['群れ増加','Larger packs','鼠群增多'],note:['ネズミと俊足が増え、間を詰めて来る（章1・2は50%、章3は20%増）','More rats and runners, packed closer (50% more in chapters 1–2; 20% in chapter 3)','老鼠和迅捷鼠增加，间隔更密（第1、2章增加50%，第3章增加20%）'],decide:['弓兵の数と位置','How many archers, and where','弓兵的数量与位置']},
  ironhide:{points:1,name:['鉄の毛皮','Iron hide','铁皮'],note:['鎧ネズミの鎧+2、ネズミにも鎧1','Armoured rats +2 armour; rats gain armour 1','铁甲鼠护甲+2，老鼠也有护甲1'],decide:['剣士・バリスタの比率と優先目標','Swords/ballistas vs archers, and target priority','剑士·弩炮的比例与优先目标']},
  rush:{points:1,name:['急襲','Rush','突袭'],note:['準備時間が30秒短い','30 s less preparation time','准备时间缩短30秒'],decide:['自動化に先に投資するか','Whether automation is built first','是否先投资自动化']},
  thin:{points:2,name:['薄い備え','Thin stores','物资稀薄'],note:['物資箱2つで始まる','Start each raid with 2 crates','每波只有2个物资箱'],decide:['取りこぼしを許さない配置','Placement that lets nothing through','不放过任何敌人的布阵']},
  narrow:{points:2,name:['狭い陣地','Cramped camp','阵地狭窄'],note:['使っている防衛部隊の1つが封鎖され、枠は3つ（どれかは出発前に予告）','One of your defence squads is sealed for the run; 3 slots (shown before you depart)','你的一支防守部队被封锁，只剩3个位置（出发前预告）'],decide:['抜けた役を誰が埋めるか','Who covers the sealed squad’s job','由谁接替被封锁队伍的职责']},
  flank:{points:1,name:['片寄り','Flanking','偏路'],note:['俊足が片方の道に集まり、増える（予告あり）','Runners mass on one road, with extras (forecast)','迅捷鼠集中到一条路并增加（有预告）'],decide:['道ごとの配置','Which road gets more cover','各条道路的布阵']},
  wings:{points:1,name:['夜の羽音','Night wings','夜翼'],note:['夜コウモリが毎回飛んで来る','Night bats join every raid','每波都有夜蝠飞来'],decide:['倉庫寄りに弓兵を残す','Keep archers near home','在仓库附近留下弓兵']},
  shieldwall:{points:1,name:['盾の列','Shield wall','盾阵'],note:['盾持ちネズミが列の先頭に並ぶ','Shield rats lead every column','持盾鼠在队伍前排'],decide:['盾を割る剣士・バリスタを前に','Swords/ballistas up front to break shields','把能破盾的剑士·弩炮放在前面']},
  burrow:{points:1,name:['地中から','From below','地底来袭'],note:['穴掘りモグラが道の中ほどを潜って来る','Burrowing moles tunnel under mid-road','掘地鼹鼠从道路中段地下穿过'],decide:['曲がり角の近くを守る','Guard near the bends','守住拐角附近']},
  procession:{points:2,name:['祈祷の行列','Prayer procession','祈祷队列'],note:['祈祷ネズミが列の中で味方を回復する','Rat shamans heal the column as it walks','鼠巫在队伍中为同伴回复'],decide:['バリスタの方針を回復役に','Set a ballista to Healers first','把弩炮方针设为优先治疗者']},
  siege:{points:2,name:['攻城','Siege','攻城'],note:['攻城荷車と石投げが来る（Wave4から荷車）','Siege carts and slingers (carts from raid 4)','攻城车与投石鼠来袭（第4波起有攻城车）'],decide:['前に届く射程と鎧貫通','Forward reach and armour piercing','能打到前方的射程与穿甲']}
 });
 for(const row of Object.values(HEAT))Object.freeze(row);
 const HEAT_IDS=Object.freeze(Object.keys(HEAT)),BOSSES=Object.freeze(['toad','boar','envoy']);
 // Saved threat: the level is always recomputed from the conditions, never trusted from the save. `seed` varies flank/boss per run.
 function heat(raw){const conditions=HEAT_IDS.filter(id=>Array.isArray(raw?.conditions)&&raw.conditions.includes(id)),sealed=conditions.includes('narrow')&&Number.isInteger(raw?.sealed)&&raw.sealed>0&&raw.sealed<=1e12?{sealed:raw.sealed}:{};return {level:conditions.reduce((n,id)=>n+HEAT[id].points,0),conditions,seed:integer(raw?.seed,0,0,1e9),...sealed};}
 /* Tuning table for threat (M5). Per-chapter counts are [chapter1, chapter2, chapter3]. Exported unfrozen so tuning tools can sweep it;
    the game never writes to it. hordeEvery: every Nth authored rat/runner brings a partner (2 → ×1.5, 3 → ×1.33). */
 const HEAT_TUNE={hordeEvery:[2,2,5],flankExtra:[2,3,4],shields:[2,4,6],bats:[2,4,6],moles:[2,3,4],moleGap:[2,2.5,2.5],shamans:[2,2,4],slingers:[2,2,4],carts:[0,2,2],siegeExtraTime:20,prepCut:30,bossLevel:3,ironRatArmor:[1,1,1]};
 // The modifiers one wave gets from the run's threat (merged with any extra round modifiers by roundModifiers()).
 function heatModifiers(value,raw){
  const h=heat(raw);if(!h.level)return null;const wave=waveNumber(value),c=chapter(wave),T=HEAT_TUNE,at=list=>list[c-1],on=id=>h.conditions.includes(id),mix=[],out={heat:h.level};
  if(on('horde'))out.horde=at(T.hordeEvery);if(on('ironhide'))out.ironhide=at(T.ironRatArmor)?true:'guards';if(on('thin'))out.boxes=2;
  if(on('flank')){out.flank=(wave+h.seed)%2?'lower':'upper';mix.push({kind:'scout',lane:out.flank,count:at(T.flankExtra),at:9,gap:1.2});}
  if(on('shieldwall'))mix.push({kind:'shield',lane:'both',count:at(T.shields),at:0,gap:1.5});
  if(on('wings'))mix.push({kind:'bat',lane:'both',count:at(T.bats),at:8,gap:2.5});
  // Burrow turns rats of the column into moles (same head count); waves without enough rats get the rest as an added group.
  if(on('burrow')){const rats=plan(wave,PLAN_VERSION,null).spawns.filter(e=>e.kind==='rat').length,swapped=Math.min(rats,at(T.moles));if(swapped)out.swap=[{from:'rat',to:'mole',count:swapped}];if(at(T.moles)>swapped)mix.push({kind:'mole',lane:'both',count:at(T.moles)-swapped,at:5,gap:at(T.moleGap)});}
  if(on('procession'))mix.push({kind:'shaman',lane:'both',count:at(T.shamans),at:6,gap:4});
  if(on('siege')){if(at(T.carts)){mix.push({kind:'siegecart',lane:'both',count:at(T.carts),at:2,gap:4});out.duration=(wave<=3?50:wave<=6?60:70)+T.siegeExtraTime;}mix.push({kind:'slinger',lane:'both',count:at(T.slingers),at:4,gap:3});}
  // High threat: the wave-9 captain is replaced by another chapter boss, changing with each run.
  if(wave===MAX_WAVE&&h.level>=T.bossLevel)out.boss=BOSSES[h.seed%3];
  if(mix.length)out.mix=mix;return out;
 }
 function roundModifiers(state,wave,extra){
  const a=heatModifiers(wave,state?.heat),b=extra&&typeof extra==='object'?extra:null;
  if(b?.replace)return modifiers(b);if(!a)return modifiers(b);if(!b)return modifiers(a);
  return modifiers({...a,...b,mix:[...(a.mix||[]),...(b.mix||[])]});
 }
 function preparationCut(state){return heat(state?.heat).conditions.includes('rush')?HEAT_TUNE.prepCut:0;}

 function fresh(){
  return {version:1,heat:{level:0,conditions:[],seed:0},planVersion:PLAN_VERSION,phase:'prep',wave:1,cleared:0,round:0,prepRemaining:150,prepScheduledRound:0,elapsed:0,gateSeconds:1,boxes:3,enemies:[],spawned:0,nextKey:1,kills:0,escaped:0,claimedFirst:[],completed:false,completedAtRound:0,journey:{seconds:0,handWood:0,handStone:0,crewWood:0,crewStone:0,handFood:0,crewFood:0},result:null};
 }
 // The preparation clock is advanced explicitly by the live game, separately from battle simulation.
 function preparationSeconds(state){if(!state)return 150;const cut=preparationCut(state);if(state.round===0)return 150-cut;const next=state.result?.win?Math.min(MAX_WAVE,state.result.wave+1):state.wave;return (state.result&&!state.result.win?90:next<=3?90:120)-cut;}
 function preparationTick(state,dt){
  if(!state||state.phase==='active'||state.completed||!Number.isFinite(dt)||dt<=0)return false;
  if(state.prepScheduledRound!==state.round){state.prepScheduledRound=state.round;state.prepRemaining=preparationSeconds(state);}
  state.prepRemaining=Math.max(0,finite(state.prepRemaining,preparationSeconds(state),0,150)-dt);
  return state.prepRemaining<=EPS;
 }
 function chapter(value){return Math.min(3,Math.ceil(waveNumber(value)/3));}
 /* Extra enemy groups for later threat levels / loops / test waves: [{kind,lane:'upper'|'lower'|'both',count,at,gap}].
    replace:true drops the authored wave; duration overrides the round length (30–180 s). Unknown kinds are ignored. */
 function modifiers(raw){
  if(!raw||typeof raw!=='object')return null;
  const mix=(Array.isArray(raw.mix)?raw.mix:[]).slice(0,24).filter(m=>m&&Object.hasOwn(ENEMIES,m.kind)).map(m=>({kind:m.kind,lane:['upper','lower','both'].includes(m.lane)?m.lane:'both',count:integer(m.count,1,1,60),at:finite(m.at,0,0,170),gap:finite(m.gap,1.5,0,30)}));
  // Threat flags (M5). boss must be a kind with the boss trait; boxes is the crate count the round starts with.
  // swap: turn authored enemies of one kind into another (same lane and time), e.g. rats → moles. Bosses cannot be swapped in or out.
  const swap=(Array.isArray(raw.swap)?raw.swap:[]).slice(0,8).filter(w=>w&&Object.hasOwn(ENEMIES,w.from)&&Object.hasOwn(ENEMIES,w.to)&&!ENEMIES[w.from].traits.includes('boss')&&!ENEMIES[w.to].traits.includes('boss')).map(w=>({from:w.from,to:w.to,count:integer(w.count,1,1,60)}));
  const flags={...(swap.length?{swap}:{}),...(raw.horde===true?{horde:true}:Number.isInteger(raw.horde)&&raw.horde>=2&&raw.horde<=10?{horde:raw.horde}:{}),...(raw.ironhide===true||raw.ironhide==='guards'?{ironhide:raw.ironhide}:{}),...(['upper','lower'].includes(raw.flank)?{flank:raw.flank}:{}),...(Number.isFinite(raw.boxes)&&raw.boxes<3?{boxes:integer(raw.boxes,3,1,3)}:{}),...(Object.hasOwn(ENEMIES,raw.boss)&&ENEMIES[raw.boss].traits.includes('boss')&&raw.boss!=='chief'?{boss:raw.boss}:{}),...(Number.isFinite(raw.heat)&&raw.heat>0?{heat:integer(raw.heat,0,0,99)}:{})};
  if(!mix.length&&raw.replace!==true&&!Number.isFinite(raw.duration)&&!Object.keys(flags).length)return null;
  return {mix,replace:raw.replace===true,...(Number.isFinite(raw.duration)?{duration:finite(raw.duration,60,30,180)}:{}),...flags};
 }
 function plan(value,planVersion=PLAN_VERSION,options=null){
  const wave=waveNumber(value),spawns=[],mods=modifiers(options),duration=mods?.duration??(wave<=3?50:wave<=6?60:70),v=planVersion===1?1:planVersion===2?2:3;
  const stat=kind=>{const d=ENEMIES[kind];return {hp:d.hp,speed:d.speed,armor:d.armor,r:d.r};};
  const specs={rat:{hp:wave<=3?wave===1?14:wave===2?18:22:26,speed:wave===1?22:wave===2?24:25,armor:0,r:13}};
  const add=(kind,lane,at)=>spawns.push({at,lane,kind,...(specs[kind]||stat(kind))});
  if(!mods?.replace){
   if(wave<=3){const count=wave===1?3:wave===2?4:6;for(let i=0;i<count;i++)add('rat',wave===1?'upper':wave===2?'lower':i%2?'lower':'upper',wave===3?Math.floor(i/2)*1.5:i*(wave===1?6:5));}
   if(wave===4&&v===1){for(let i=0;i<10;i++)add(i<8?'scout':'rat',i%2?'lower':'upper',Math.floor(i/2)*2.5);}
   if(wave===4&&v!==1){add('guard','upper',0);add('guard','lower',2);for(let i=0;i<8;i++)add('scout',i%2?'lower':'upper',5+Math.floor(i/2)*2.5);}
   // Plan 3: the second armoured pair of wave 5 carries shields; two runners of wave 7 become bats. Same head counts as plan 2.
   if(wave===5){for(let i=0;i<4;i++)add(v>=3&&i>=2?'shield':'guard',i%2?'lower':'upper',Math.floor(i/2)*1.5);for(let i=0;i<10;i++)add('rat',i%2?'lower':'upper',5+Math.floor(i/2)*1.5);}
   if(wave===6){for(let i=0;i<2;i++)add('guard',i?'lower':'upper',0);for(let i=0;i<16;i++)add(i%4<2?'rat':'scout',i%2?'lower':'upper',4+Math.floor(i/2)*1.3);}
   if(wave===7){for(let i=0;i<6;i++)add('guard',i%2?'lower':'upper',Math.floor(i/2));for(let i=0;i<16;i++)add(i%4<2?v>=3&&i>=12?'bat':'scout':'rat',i%2?'lower':'upper',3+Math.floor(i/2)*.8);}
   if(wave===8){for(let i=0;i<28;i++)add(i%7===0?'guard':i%3===0?'scout':'rat',i%2?'lower':'upper',Math.floor(i/2)*.55);}
   if(wave===9){for(let i=0;i<6;i++)add('guard',i%2?'lower':'upper',Math.floor(i/2)*1.5);for(let i=0;i<22;i++)add('rat',i%2?'lower':'upper',3+Math.floor(i/2)*.8);for(let i=0;i<8;i++)add('scout',i%2?'lower':'upper',12+Math.floor(i/2)*1.1);add(mods?.boss||'chief','upper',14);}
   // Threat: larger packs (every second authored rat or runner brings a partner 0.6 s behind), runners massed on one road.
   if(mods?.horde){const every=mods.horde===true?2:mods.horde;for(const kind of ['rat','scout'])spawns.filter(e=>e.kind===kind).forEach((e,i)=>{if(i%every===every-1&&e.at+.6<duration)add(kind,e.lane,e.at+.6);});}
   if(mods?.flank)for(const e of spawns)if(e.kind==='scout')e.lane=mods.flank;
   for(const w of mods?.swap||[]){const list=spawns.filter(e=>e.kind===w.from),step=list.length/Math.max(1,w.count);for(let i=0;i<Math.min(w.count,list.length);i++){const e=list[Math.floor(i*step)],d=ENEMIES[w.to];Object.assign(e,{kind:w.to,hp:d.hp,speed:d.speed,armor:d.armor,r:d.r});}}
  }
  for(const m of mods?.mix||[])for(let i=0;i<m.count;i++){const lane=m.lane==='both'?(i%2?'lower':'upper'):m.lane,at=m.at+(m.lane==='both'?Math.floor(i/2):i)*m.gap;if(at<duration)add(m.kind,lane,at);}
  if(mods?.ironhide)for(const e of spawns){if(e.kind==='guard')e.armor+=2;else if(e.kind==='rat'&&mods.ironhide!=='guards')e.armor=Math.max(e.armor,1);}
  spawns.sort((a,b)=>a.at-b.at);spawns.forEach((e,i)=>e.spawnIndex=i);
  const patterns=['single','single','pack','scout','guard','mixed','guard','swarm','final'],kinds=[...new Set(spawns.map(e=>e.kind))];
  const potential=spawns.reduce((n,e)=>n+1+(ENEMIES[e.kind].split?.count||0),0);
  return {wave,duration,chapter:chapter(wave),pattern:mods?.replace?'custom':wave===4&&v!==1?'vanguard':patterns[wave-1],spawns,potential,counts:{upper:spawns.filter(e=>e.lane==='upper').length,lower:spawns.filter(e=>e.lane==='lower').length},kinds,special:kinds.filter(k=>!['rat','scout','guard','chief'].includes(k)),boxes:mods?.boxes||3,heat:mods?.heat||0,...(mods?.flank?{flank:mods.flank}:{}),boss:wave===MAX_WAVE?mods?.boss||'chief':null};
 }
 function planFor(state){return plan(state.wave,state.planVersion,state.modifiers);}
 function nextRequirement(state){
  if(!state)return null;const next=state.phase==='result'&&state.result?.win?Math.min(MAX_WAVE,state.result.wave+1):waveNumber(state.wave);
  return next===4?'workshop':next===7?'gate':next===9?'beacon':null;
 }
 function position(enemy){
  const y=laneY(enemy.lane);
  if(has(enemy,'fly')){const t=Math.min(1,enemy.travel/flightLength(enemy.lane));enemy.x=WORLD.entryX+(WORLD.home.x-WORLD.entryX)*t;enemy.y=y+(WORLD.home.y-y)*t;return;}
  const straight=WORLD.entryX-WORLD.turnX;
  if(enemy.travel<=straight){enemy.x=WORLD.entryX-enemy.travel;enemy.y=y;return;}
  const turnLength=pathLength(enemy.lane)-straight,t=Math.min(1,(enemy.travel-straight)/turnLength);
  enemy.x=WORLD.turnX+(WORLD.home.x-WORLD.turnX)*t;
  enemy.y=y+(WORLD.home.y-y)*t;
 }
 // Unit vector of the enemy's current heading (used for the beetle's frontal shell).
 function heading(enemy){if(has(enemy,'fly')){const dx=WORLD.home.x-WORLD.entryX,dy=WORLD.home.y-laneY(enemy.lane),d=Math.hypot(dx,dy);return {x:dx/d,y:dy/d};}if(enemy.travel<WORLD.entryX-WORLD.turnX)return {x:-1,y:0};const dx=WORLD.home.x-WORLD.turnX,dy=WORLD.home.y-laneY(enemy.lane),d=Math.hypot(dx,dy);return {x:dx/d,y:dy/d};}
 function goldFor(wave,win,boxes,first){return win?12+(first?12+wave*8:0)+boxes*2:8;}
 function normalizedResult(raw,mods){
  if(!raw||typeof raw!=='object')return null;
  const wave=waveNumber(raw.wave),boxes=integer(raw.boxes,0,0,3),win=raw.win===true&&boxes>0,count=Math.max(...[1,2,3].map(v=>plan(wave,v,mods).potential));
  const kills=integer(raw.kills,0,0,count),escaped=integer(raw.escaped,0,0,count-kills),success=win&&(wave!==MAX_WAVE||raw.chiefDefeated===true),trial=!!mods?.replace,first=success&&!trial&&raw.first===true;
  return {wave,win:success,boxes,kills,escaped,gold:trial?0:goldFor(wave,success,boxes,first),first,...(trial?{trial:true}:{}),...(wave===MAX_WAVE?{chiefDefeated:raw.chiefDefeated===true}:{})};
 }
 function makeEnemy(state,item,extra){const d=def(item.kind),enemy={key:state.nextKey++,spawnIndex:item.spawnIndex,kind:item.kind,lane:item.lane,x:WORLD.entryX,y:laneY(item.lane),r:item.r,speed:item.speed,armor:item.armor,hp:item.hp,maxHp:item.hp,travel:0,slowUntil:0,alive:true,atGate:false,gateTime:0,...extra};
  if(d.shield)enemy.shield=d.shield;if(d.heal)enemy.healAt=state.elapsed+d.heal.every;if(d.leap)enemy.leapAt=state.elapsed+d.leap.every;position(enemy);return enemy;}
 function migrate(raw){
  const state=fresh();
  if(!raw||typeof raw!=='object'||raw.version!==1)return state;
  state.planVersion=raw.planVersion===3?3:raw.planVersion===2?2:1;state.heat=heat(raw.heat);
  const mods=modifiers(raw.modifiers);if(mods)state.modifiers=mods;
  state.phase=['prep','active','result'].includes(raw.phase)?raw.phase:'prep';
  state.wave=waveNumber(raw.wave);state.cleared=integer(raw.cleared,0,0,MAX_WAVE);state.round=integer(raw.round,0,0,1e9);
  state.prepScheduledRound=Number.isInteger(raw.prepScheduledRound)&&raw.prepScheduledRound>=0&&raw.prepScheduledRound<=state.round?raw.prepScheduledRound:-1;state.prepRemaining=finite(raw.prepRemaining,150,0,150);
  state.elapsed=finite(raw.elapsed,0,0,planFor(state).duration);state.gateSeconds=finite(raw.gateSeconds,1,1,2.5);state.boxes=integer(raw.boxes,3,0,3);
  state.claimedFirst=[...new Set((Array.isArray(raw.claimedFirst)?raw.claimedFirst:[]).slice(0,1024).filter(n=>Number.isInteger(n)&&n>=1&&n<=MAX_WAVE))];
  for(let wave=1;wave<=state.cleared;wave++)if(!state.claimedFirst.includes(wave))state.claimedFirst.push(wave);
  const result=normalizedResult(raw.result,mods);
  // A stored settlement is authoritative: never turn it back into a payable active round.
  if(result&&(state.phase==='result'||state.phase==='active')){state.phase='result';state.result=result;state.wave=result.wave;state.elapsed=finite(raw.elapsed,planFor(state).duration,0,planFor(state).duration);}
  else if(state.phase==='result')state.phase='prep';
  if(state.result?.win&&!state.result.trial){state.cleared=Math.max(state.cleared,state.result.wave);if(!state.claimedFirst.includes(state.result.wave))state.claimedFirst.push(state.result.wave);}
  state.claimedFirst.sort((a,b)=>a-b);
  const definition=planFor(state),seen=new Set(),seenSpawns=new Set(),rows=(Array.isArray(raw.enemies)?raw.enemies:[]).slice(0,definition.potential);
  const restore=(row,item)=>{const d=def(item.kind),maxHp=item.hp,length=lengthOf(item),travel=finite(row.travel,0,0,length),limit=gateLimit(state,item),atGate=row.atGate===true||travel>=length-EPS;
   const hp=finite(row.hp,maxHp,0,maxHp),gateTime=atGate?finite(row.gateTime,0,0,limit):0;
   const enemy={key:row.key,spawnIndex:item.spawnIndex,kind:item.kind,lane:item.lane,x:0,y:0,r:item.r,speed:item.speed,armor:item.armor,hp,maxHp,travel:atGate?length:travel,slowUntil:finite(row.slowUntil,0,0,definition.duration+1.5),alive:row.alive===true&&hp>0&&gateTime<limit,atGate,gateTime};
   if(item.parent)enemy.parent=item.parent;if(d.shield)enemy.shield=integer(row.shield,d.shield,0,d.shield);if(d.heal)enemy.healAt=finite(row.healAt,state.elapsed+d.heal.every,0,state.elapsed+d.heal.every);if(d.leap)enemy.leapAt=finite(row.leapAt,state.elapsed+d.leap.every,0,state.elapsed+d.leap.every);
   if(!enemy.alive)enemy.resolvedAt=finite(row.resolvedAt,state.elapsed,0,state.elapsed);position(enemy);state.enemies.push(enemy);seen.add(row.key);};
  const validRow=row=>row&&Object.hasOwn(ENEMIES,row.kind)&&['upper','lower'].includes(row.lane)&&Number.isInteger(row.key)&&row.key>=1&&row.key<=MAX_KEY&&!seen.has(row.key);
  for(const row of rows){
   if(!validRow(row)||Number.isInteger(row.parent))continue;
   const spawnIndex=Number.isInteger(row.spawnIndex)?row.spawnIndex:definition.spawns.findIndex((item,i)=>!seenSpawns.has(i)&&item.kind===row.kind&&item.lane===row.lane),item=definition.spawns[spawnIndex];
   if(!item||seenSpawns.has(spawnIndex)||item.kind!==row.kind||item.lane!==row.lane)continue;
   seenSpawns.add(spawnIndex);restore(row,item);
  }
  // Pieces released by a defeated parent (ooze, siege cart): only a parent that is really dead, only its kind, at most its count.
  const children=new Map();
  for(const row of rows){
   if(!validRow(row)||!Number.isInteger(row.parent))continue;
   const parent=state.enemies.find(e=>e.key===row.parent&&!e.parent),split=parent&&def(parent.kind).split;
   if(!split||parent.alive||parent.hp>0||row.kind!==split.kind||row.lane!==parent.lane||(children.get(parent.key)||0)>=split.count)continue;
   children.set(parent.key,(children.get(parent.key)||0)+1);const d=def(split.kind);
   restore(row,{kind:split.kind,lane:parent.lane,hp:split.hp||d.hp,speed:d.speed,armor:d.armor,r:d.r,parent:parent.key});
  }
  const fromPlan=state.enemies.filter(e=>!e.parent).length;
  state.spawned=Math.max(integer(raw.spawned,0,0,definition.spawns.length),fromPlan);
  if(state.phase==='active'&&state.elapsed>0)state.spawned=Math.max(state.spawned,definition.spawns.filter(e=>e.at<state.elapsed-EPS).length);
  const missing=state.phase==='active'?state.spawned-fromPlan:0,total=state.spawned+state.enemies.length-fromPlan;
  state.kills=integer(raw.kills,0,0,total);
  state.escaped=Math.max(integer(raw.escaped,0,0,total-state.kills),Math.min(missing,total-state.kills));
  state.boxes=Math.min(state.boxes,Math.max(0,(state.phase==='active'?state.modifiers?.boxes||3:3)-state.escaped));
  state.nextKey=Math.max(integer(raw.nextKey,1,1,MAX_KEY+1),...state.enemies.map(e=>e.key+1));
  if(state.result){state.boxes=state.result.boxes;state.kills=state.result.kills;state.escaped=state.result.escaped;}
  for(const key of Object.keys(state.journey))state.journey[key]=finite(raw.journey?.[key],0,0,key==='seconds'?1e9:1e12);
  state.completed=state.cleared===MAX_WAVE;state.completedAtRound=state.completed?integer(raw.completedAtRound,state.round,0,state.round):0;
  return state;
 }
 function start(state,options={}){
  if(!state||!['prep','result'].includes(state.phase)||state.phase==='result'&&state.result?.win&&state.result.wave===MAX_WAVE&&options.replay!==true)return false;
  state.wave=state.phase==='result'&&state.result?waveNumber(state.result.wave+(state.result.win?1:0)):waveNumber(state.wave);
  state.planVersion=PLAN_VERSION;state.phase='active';state.round=integer(state.round,0,0,1e9)+1;state.elapsed=0;state.enemies=[];state.spawned=0;state.kills=0;state.escaped=0;state.result=null;
  // Modifiers belong to one round: the run's threat for this wave, merged with any extra (loop variation, test wave), or none.
  const mods=roundModifiers(state,state.wave,options.modifiers);if(mods)state.modifiers=mods;else delete state.modifiers;state.boxes=mods?.boxes||3;
  state.nextKey=integer(state.nextKey,1,1,MAX_KEY+1);
  return true;
 }
 function spawnDue(state,definition){
  while(state.spawned<definition.spawns.length&&definition.spawns[state.spawned].at<=state.elapsed+EPS){
   const item=definition.spawns[state.spawned++];
   state.enemies.push(makeEnemy(state,item));
  }
 }
 function release(state,parent){
  const split=def(parent.kind).split;if(!split)return [];const d=def(split.kind),out=[];
  for(let i=0;i<split.count;i++){const child=makeEnemy(state,{kind:split.kind,lane:parent.lane,hp:split.hp||d.hp,speed:d.speed,armor:d.armor,r:d.r},{parent:parent.key,travel:Math.max(0,Math.min(lengthOf({kind:split.kind,lane:parent.lane}),parent.travel-i*9))});
   if(child.travel>=lengthOf(child)-EPS){child.travel=lengthOf(child);child.atGate=true;}position(child);state.enemies.push(child);out.push(child);}
  return out;
 }
 function escape(state,enemy,at=state.elapsed){
  if(!enemy.alive)return;
  enemy.alive=false;enemy.resolvedAt=at;state.escaped++;state.boxes=Math.max(0,state.boxes-1);
 }
 function advance(state,enemy,from,to,speed){
  let time=from;const d=def(enemy.kind);
  while(enemy.alive&&time<to-EPS){
   if(enemy.atGate){
    const limit=gateLimit(state,enemy),delta=Math.min(to-time,limit-enemy.gateTime);
    enemy.gateTime+=delta;time+=delta;
    if(enemy.gateTime>=limit-EPS){enemy.gateTime=limit;escape(state,enemy,time);}
    continue;
   }
   const length=lengthOf(enemy),slowed=!d.traits.includes('charge')&&enemy.slowUntil>time+EPS,velocity=speed*(slowed?.35:1);
   const leapIn=d.leap&&enemy.leapAt>time+EPS?enemy.leapAt-time:Infinity;
   const delta=Math.min(to-time,slowed?enemy.slowUntil-time:Infinity,leapIn,Math.max(0,(length-enemy.travel)/velocity));
   enemy.travel=Math.min(length,enemy.travel+velocity*delta);time+=delta;
   if(d.leap&&enemy.leapAt<=time+EPS){enemy.travel=Math.min(length,enemy.travel+d.leap.distance);enemy.leapAt=time+d.leap.every;}
   if(enemy.travel>=length-EPS){enemy.travel=length;enemy.atGate=true;enemy.gateTime=0;}
   position(enemy);
  }
 }
 // Shamans heal other living raiders within their radius at fixed times; a burrowed or dead shaman does nothing.
 function chant(state,time){
  for(const shaman of state.enemies){const heal=def(shaman.kind).heal;if(!heal||!shaman.alive)continue;
   while(shaman.healAt<=time+EPS){for(const other of state.enemies)if(other!==shaman&&other.alive&&other.hp<other.maxHp&&!burrowed(other)&&Math.hypot(other.x-shaman.x,other.y-shaman.y)<=heal.radius+EPS){const before=other.hp,pack=def(other.kind).pack,cap=pack?Math.ceil(other.hp/pack.each-EPS)*pack.each:other.maxHp;other.hp=Math.min(other.maxHp,cap,other.hp+heal.amount);shaman.healed=(shaman.healed||0)+other.hp-before;}shaman.healAt+=heal.every;}}
 }
 function settle(state){
  for(const enemy of state.enemies)if(enemy.alive)escape(state,enemy);
  const boss=state.modifiers?.boss||'chief',chiefDefeated=state.enemies.some(e=>e.kind===boss&&e.hp===0)&&state.enemies.filter(e=>e.kind===boss).every(e=>e.hp===0),win=state.boxes>0&&(state.wave!==MAX_WAVE||chiefDefeated),trial=!!state.modifiers?.replace,first=win&&!trial&&!state.claimedFirst.includes(state.wave);
  // A replaced (test) wave is not that wave: no progress, no first-clear, no gold.
  if(win&&!trial){state.cleared=Math.max(state.cleared,state.wave);if(first)state.claimedFirst.push(state.wave);if(state.wave===MAX_WAVE){state.completed=true;if(!state.completedAtRound)state.completedAtRound=state.round;}}
  const result={wave:state.wave,win,boxes:state.boxes,kills:state.kills,escaped:state.escaped,gold:trial?0:goldFor(state.wave,win,state.boxes,first),first,...(trial?{trial:true}:{}),...(state.wave===MAX_WAVE?{chiefDefeated}:{})};
  state.phase='result';state.result=result;
  return {type:'settle',result:{...result}};
 }
 function resolved(state,definition){return state.spawned===definition.spawns.length&&state.enemies.filter(e=>!e.parent).length===definition.spawns.length&&state.enemies.every(e=>!e.alive);}
 function finishResolved(state){state.elapsed=Math.min(state.elapsed,Math.max(...state.enemies.map(e=>e.resolvedAt??state.elapsed)));return [settle(state)];}
 function tick(state,dt,context){
  if(!state||state.phase!=='active'||!Number.isFinite(dt)||dt<0)return [];
  if(context&&Object.hasOwn(context,'gateBuilt'))state.gateSeconds=context.gateBuilt===true?2.5:1;
  const definition=planFor(state),end=Math.min(definition.duration,state.elapsed+dt);
  spawnDue(state,definition);if(resolved(state,definition))return finishResolved(state);
  while(state.elapsed<end-EPS){
   const nextSpawn=definition.spawns[state.spawned]?.at??Infinity;
   const next=Math.min(end,state.elapsed+.25,nextSpawn);
   for(const enemy of state.enemies)if(enemy.alive)advance(state,enemy,state.elapsed,next,enemy.speed);
   chant(state,next);
   state.elapsed=next;spawnDue(state,definition);if(resolved(state,definition))return finishResolved(state);
  }
  state.elapsed=end;
  if(resolved(state,definition))return finishResolved(state);
  if(state.elapsed>=definition.duration-EPS){state.elapsed=definition.duration;return [settle(state)];}
  return [];
 }
 /* `from` is the attacker's position (beetle shell faces forward). Returns what the enemy really lost.
    blocked: a shield took the arrow. spawned: pieces released by this kill. */
 function hit(state,key,amount,role,from){
  if(!state||state.phase!=='active'||!Number.isFinite(amount)||amount<=0)return {applied:0,killed:false};
  const enemy=state.enemies.find(e=>e.key===key&&e.alive);
  if(!enemy||burrowed(enemy)||has(enemy,'fly')&&PIERCE.includes(role)||role==='manual'&&!exposed(enemy))return {applied:0,killed:false};
  const d=def(enemy.kind),pierce=PIERCE.includes(role);
  if(enemy.shield>0){if(!pierce){enemy.shield--;return {applied:0,killed:false,blocked:true,shieldBlocked:amount};}enemy.shield=0;}
  const armor=pierce?0:enemy.armor||0;let shell=0,capped=0;
  if(d.carapace&&!pierce){const h=heading(enemy),fx=Number.isFinite(from?.x)?from.x-enemy.x:h.x,fy=Number.isFinite(from?.y)?from.y-enemy.y:h.y;if(fx*h.x+fy*h.y>0)shell=Math.min(d.carapace,Math.max(0,amount-armor));}
  let applied=Math.min(enemy.hp,Math.max(0,amount-armor-shell));
  if(d.pack){const member=enemy.hp-(Math.ceil(enemy.hp/d.pack.each-EPS)-1)*d.pack.each;capped=Math.max(0,applied-member);applied=Math.min(applied,member);}
  enemy.hp-=applied;
  const killed=enemy.hp<=EPS;
  const extra={...(shell?{shellBlocked:shell}:{}),...(capped?{packCapped:capped}:{})};
  if(killed){enemy.hp=0;enemy.alive=false;enemy.resolvedAt=state.elapsed;state.kills++;const spawned=release(state,enemy);return spawned.length?{applied,killed,spawned,...extra}:{applied,killed,...extra};}
  if(role==='sword'&&!d.traits.includes('charge'))enemy.slowUntil=state.elapsed+1.5;
  return {applied,killed,...extra};
 }
 // Hidden enemies become visible only near a real ally body; called by the battle simulation every step.
 function reveal(state,allies){
  if(!state?.enemies)return;
  for(const enemy of state.enemies){const d=def(enemy.kind);if(!d.reveal)continue;enemy.seen=enemy.alive&&(allies||[]).some(p=>Math.hypot(p.x-enemy.x,p.y-enemy.y)<=d.reveal+(p.r||0)+enemy.r);}
 }
 function target(state,point,range,options={}){
  if(!state||state.phase!=='active'||!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(range)||range<0)return null;
  let best=null,bestDistance=Infinity,bestRemaining=Infinity,bestPriority=-1;
  for(const enemy of state.enemies){
   if(!enemy.alive||!canStrike(enemy,options?.role))continue;
   const distance=Math.hypot(point.x-enemy.x,point.y-enemy.y);
   if(distance>range+(options?.includeEnemyRadius?finite(enemy.r,13,0,100):0)||distance<(options?.minRange||0))continue;
   const priority=options.priority==='armor'&&(enemy.armor>0||enemy.shield>0||has(enemy,'carapace'))||options.priority==='healer'&&has(enemy,'heal')?1:0,remaining=lengthOf(enemy)-enemy.travel;
   if(!best||priority>bestPriority||priority===bestPriority&&(remaining<bestRemaining-EPS||(Math.abs(remaining-bestRemaining)<=EPS&&(distance<bestDistance-EPS||(Math.abs(distance-bestDistance)<=EPS&&enemy.key<best.key))))){bestPriority=priority;best=enemy;bestDistance=distance;bestRemaining=remaining;}
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
 // Road geometry for placement previews: the parts of each road an ally at `center` can reach.
 function roadPath(lane){const y=laneY(lane);return [{x:WORLD.entryX,y},{x:WORLD.turnX,y},{x:WORLD.home.x,y:WORLD.home.y}];}
 function circleSpan(a,b,c,r){const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-c.x,fy=a.y-c.y,A=dx*dx+dy*dy,B=2*(fx*dx+fy*dy),C=fx*fx+fy*fy-r*r;if(!(r>0)||!A)return null;const disc=B*B-4*A*C;if(disc<0)return null;const q=Math.sqrt(disc),t0=Math.max(0,(-B-q)/(2*A)),t1=Math.min(1,(-B+q)/(2*A));return t1>t0?[t0,t1]:null;}
 function coveredSpans(points,center,radius,minRadius=0){
  const spans=[];if(!Array.isArray(points)||!Number.isFinite(center?.x)||!Number.isFinite(center?.y)||!Number.isFinite(radius))return spans;
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],outer=circleSpan(a,b,center,radius);if(!outer)continue;const inner=minRadius>0?circleSpan(a,b,center,minRadius):null;
   const parts=inner?[[outer[0],Math.min(outer[1],inner[0])],[Math.max(outer[0],inner[1]),outer[1]]]:[outer];
   for(const [t0,t1] of parts){if(t1-t0<=1e-9)continue;const from=lerp(a,b,t0),to=lerp(a,b,t1),last=spans.at(-1),tail=last?.points.at(-1);if(last&&last.segment===i-1&&t0<=1e-9&&Math.hypot(tail.x-from.x,tail.y-from.y)<1e-6){last.points.push(to);last.segment=i;}else spans.push({points:[from,to],segment:i});}}
  return spans.map(({points})=>({from:points[0],to:points.at(-1),points,length:points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.y-points[i].y),0)}));
 }
 function roadCoverage(center,radius,minRadius=0){return ['upper','lower'].flatMap(lane=>coveredSpans(roadPath(lane),center,radius,minRadius).map(span=>({lane,...span})));}
 return {HEAT_TUNE,HEAT,HEAT_IDS,BOSSES,heat,heatModifiers,roundModifiers,preparationCut,roadPath,coveredSpans,roadCoverage,WORLD,MAX_WAVE,PLAN_VERSION,ENEMIES,KINDS,has,burrowed,exposed,canStrike,lengthOf,reveal,modifiers,planFor,fresh,migrate,preparationSeconds,preparationTick,chapter,plan,nextRequirement,start,tick,hit,target,recipe,stats};
});
