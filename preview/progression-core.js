/* One material-funded graph for work skills, construction recipes and camp improvements. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./harvest-skill-core.js'):root.HarvestSkillCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.ProgressionCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Skills){
 'use strict';
 const word=(ja,en,zh)=>({ja,en,zh});
 const skillNames={
  hand:['鋭い刃先','切り出しの技','熟練の採集','達人の道具','豊かな切り出し','採集の極意'],
  carry:['両手で運ぶ','大きなかご','背負いかご','荷運びの技','大荷物の達人','運び屋の極意'],
  storage:['置き場を広げる','大きな置き場','資材を積み上げる','広い資材置き場','資材の山','蓄えの極意'],
  route:['滑らかなローラー','高速ギア','連動ローラー','精密な歯車','高速搬送','搬送の極意']
 };
 const english={hand:['Sharpened tools','Harvesting skills','Expert harvesting','Master tools','Abundant harvest','Master harvester'],carry:['Both hands','Large basket','Back basket','Packing skills','Expert carrier','Master carrier'],storage:['Expand storage','Large storage','Higher stacks','Spacious storage','Supply mountain','Master stockpile'],route:['Smooth rollers','Faster gears','Linked rollers','Precision gears','Rapid transport','Master transport']};
 const chinese={hand:['锋利刃口','采集技巧','熟练采集','大师工具','丰盛采集','采集大师'],carry:['双手搬运','大篮子','背篓','装载技巧','搬运专家','搬运大师'],storage:['扩充地面存储','大型地面存储','堆叠材料','宽敞地面存储','材料堆积','存储大师'],route:['顺滑滚轮','高速齿轮','联动滚轮','精密齿轮','高速运输','运输大师']};
 const notes={hand:word('一打の採集力を上げ、木・石を切り出す打数を減らす。','Increase gathering power and reduce the strikes needed for wood and stone.','提高每次采集力，减少采集木石所需次数。'),carry:word('一度のドラッグで持てる個別資材を増やす。','Carry more individual items in one drag.','一次拖动可携带更多独立物资。'),storage:word('地面と搬送中の個別資材の上限を増やす。仲間の枠とは別。','Increase loose and travelling item capacity, not ally slots.','提高地面和运输中的物资上限，与伙伴位置无关。'),route:word('自分でつないだコンベアの速度を上げる。','Speed up the conveyors you connect yourself.','提高自行连接的传送带速度。')};
 const nodes=Skills.branches.flatMap(branch=>Array.from({length:Skills.MAX_TIER},(_,i)=>({id:branch+(i+1),kind:'skill',branch,tier:i+1,requires:i?[branch+i]:branch==='route'?['recipe_belt']:[],cost:{...Skills.costs[branch][i]},title:word(skillNames[branch][i],english[branch][i],chinese[branch][i]),description:notes[branch]})));
 function recipe(id,branch,cost,requires,title,description){nodes.push({id:'recipe_'+id,kind:'recipe',recipe:id,cardId:id,branch,tier:0,cost,requires,title,description});}
 recipe('woodcutter','hand',{wood:2},[],word('木こりのレシピ','Lumberjack recipe','伐木工配方'),word('木こりの雇用カードが増える。雇用して自分で配置すると、範囲内の木を伐採する。','Adds the lumberjack card. Hire and place one to chop trees in range.','增加伐木工招募卡。招募并自行放置后，砍伐范围内的树木。'));
 recipe('blower','route',{wood:4},['recipe_woodcutter'],word('送風機のレシピ','Blower recipe','鼓风机配方'),word('送風機の設置カードが増える。落下先に風を当てて物資を運ぶ。','Adds the blower card. Use its wind to move items from their landing points.','增加鼓风机建造卡，用风运送掉落物资。'));
 recipe('arch','carry',{wood:2,stone:2},['recipe_woodcutter'],word('弓兵のレシピ','Archer recipe','弓箭手配方'),word('弓兵の雇用カードが増える。道へ射程を重ねて防衛する。','Adds the archer card. Cover a road with its range to defend it.','增加弓箭手招募卡，让射程覆盖道路进行防守。'));
 recipe('miner','hand',{wood:4,stone:2},['hand1'],word('採掘師のレシピ','Miner recipe','矿工配方'),word('採掘師の雇用カードが増える。範囲内の岩から石材を採る。','Adds the miner card. Mines rocks inside its working range.','增加矿工招募卡，开采作业范围内的岩石。'));
 recipe('sword','carry',{wood:8,stone:4},['recipe_arch'],word('剣士のレシピ','Swordsman recipe','剑士配方'),word('剣士の雇用カードが増える。近くの敵を減速させ、射手を助ける。','Adds the swordsman card. Slows nearby enemies to help your archers.','增加剑士招募卡，减缓附近敌人，协助弓箭手。'));
 recipe('fence','storage',{wood:4},['recipe_blower'],word('誘導柵のレシピ','Guide fence recipe','导流栅栏配方'),word('誘導柵の設置カードが増える。風で流れる資材を誘導する。','Adds guide fences. Direct materials moved by wind.','增加导流栅栏建造卡，引导被风吹动的物资。'));
 recipe('belt','route',{wood:8,stone:4},['recipe_blower','carry2'],word('コンベアのレシピ','Conveyor recipe','传送带配方'),word('コンベアの設置カードが増える。自分で経路をつないで自動搬送する。','Adds the conveyor card. Connect your own route to automate delivery.','增加传送带建造卡，自行连接路线，实现自动运输。'));
 recipe('platform','storage',{wood:8,stone:4},['recipe_belt','storage2'],word('受け土台のレシピ','Receiving platform recipe','接收台配方'),word('受け土台の設置カードが増える。広い面で資材を受けて隣へ運ぶ。','Adds receiving platforms. Catch items over a wide area and move them onward.','增加接收台建造卡，大范围接收物资并向相邻设备运送。'));
 recipe('hopper','storage',{wood:10,stone:6},['recipe_belt','storage2'],word('集積口のレシピ','Hopper recipe','集料斗配方'),word('集積口の設置カードが増える。資材を一個ずつ吸い寄せて送り出す。','Adds hoppers. Draw in individual items and feed them to your route.','增加集料斗建造卡，逐个吸入物资并送入运输路线。'));
 recipe('loader','route',{wood:12,stone:8},['recipe_belt','storage2'],word('積み込み機のレシピ','Loader recipe','装载机配方'),word('積み込み機の設置カードが増える。範囲内の資材を一個ずつ拾い、近くのコンベアに載せる。','Adds the loader card. Picks up individual items in range and puts them onto a nearby conveyor.','增加装载机建造卡，逐个拾取范围内物资，放到附近传送带上。'));
 recipe('farmer','hand',{coins:3},['recipe_miner'],word('農家のレシピ','Farmer recipe','农夫配方'),word('農家の雇用カードが増える。実った作物を食料として収穫する。','Adds the farmer card. Harvest ripe crops as food.','增加农夫招募卡，将成熟作物收获为食物。'));
 recipe('ballista','carry',{coins:4},['recipe_arch'],word('バリスタ隊のレシピ','Ballista crew recipe','弩炮队配方'),word('バリスタ隊の雇用カードが増える。遠くの鎧を貫くが、至近距離は撃てない。','Adds the ballista crew card. Pierces distant armour but cannot fire at close range.','增加弩炮队招募卡，穿透远处护甲，但无法攻击近处目标。'));
 function project(id,branch,cost,requires,title,description){nodes.push({id:'project_'+id,kind:'project',project:id,branch,tier:/2$/.test(id)?2:1,cost,requires,title,description});}
 project('woodTool1','hand',{wood:45,stone:20},['recipe_miner','hand2'],word('伐採道具 I','Woodcutting tools I','伐木工具 I'),word('木こり一人の採集間隔を5秒から2.5秒へ。','Lumberjack gathering interval: 5s → 2.5s.','每位伐木工采集间隔：5秒 → 2.5秒。'));
 project('woodTool2','hand',{wood:100,stone:60},['project_woodTool1','hand3'],word('伐採道具 II','Woodcutting tools II','伐木工具 II'),word('木こり一人の採集間隔を2.5秒から1.5秒へ。','Lumberjack gathering interval: 2.5s → 1.5s.','每位伐木工采集间隔：2.5秒 → 1.5秒。'));
 project('stoneTool1','hand',{wood:30,stone:35},['recipe_miner','hand2'],word('採掘道具 I','Mining tools I','采矿工具 I'),word('採掘師一人の採集間隔を6秒から3秒へ。','Miner gathering interval: 6s → 3s.','每位矿工采集间隔：6秒 → 3秒。'));
 project('stoneTool2','hand',{wood:70,stone:100},['project_stoneTool1','hand3'],word('採掘道具 II','Mining tools II','采矿工具 II'),word('採掘師一人の採集間隔を3秒から2秒へ。','Miner gathering interval: 3s → 2s.','每位矿工采集间隔：3秒 → 2秒。'));
 project('cart','route',{gold:55},['recipe_belt','route1'],word('搬送車輪','Transport wheels','运输车轮'),word('コンベアの実際の搬送速度をさらに25%上げる。','Increase actual conveyor speed by a further 25%.','传送带实际运输速度额外提高25%。'));
 project('gate','storage',{wood:100,stone:60},['recipe_sword','storage3'],word('防衛門','Defence gate','防御门'),word('倉庫前の門を建て、突破してきた敵への対処時間を得る。','Build the gate by the warehouse and gain time to handle escaping enemies.','在仓库前修建防御门，获得应对突破敌人的时间。'));
 project('beacon','carry',{wood:220,stone:160},['project_gate','route3'],word('射手のかがり火','Archer beacon','射手烽火'),word('弓兵の実射程を90から110へ広げる。','Increase actual archer range: 90 → 110.','弓箭手实际射程：90 → 110。'));
 recipe('broom','route',{wood:6,stone:2},['recipe_blower'],word('箒のレシピ','Broom recipe','扫帚配方'),word('箒の製作カードが増える。地面の丸太や石をドラッグで掃く。重い石は動きにくい。','Adds a broom card. Sweep loose logs and stone by dragging; heavy stone moves less.','增加扫帚制作卡。拖动扫动地上的木材与石材，重石较难移动。'));
 project('broomHead','route',{wood:28,stone:16},['recipe_broom','hand1'],word('幅広の箒','Wide broom head','宽扫帚头'),word('掃く幅を60から88へ広げ、押す力を55%上げる。','Sweep width: 60 → 88. Push force +55%.','扫动宽度60→88，推动力量提高55%。'));
 const byId=new Map(nodes.map(n=>[n.id,n])),recipeIds=nodes.filter(n=>n.kind==='recipe').map(n=>n.recipe),types=['wood','stone','gold','coins'];
 const amount=n=>Number.isFinite(n)?Math.max(0,n):0;
 function fresh(){return {version:1,recipes:[],legacyPending:false};}
 function migrate(raw){if(!raw||raw.version!==1)return null;return {version:1,recipes:[...new Set((Array.isArray(raw.recipes)?raw.recipes:[]).filter(id=>recipeIds.includes(id)))],legacyPending:raw.legacyPending===true};}
 function legacyEvidence(S){return !!((S.owned&&Object.values(S.owned).some(n=>amount(n)>0))||(S.harvestSkills&&Object.values(S.harvestSkills).some(n=>amount(n)>0))||amount(S.outpost?.round)>0||amount(S.outpost?.cleared)>0||amount(S.clearedBossWave)>0||amount(S.tutorial?.woodDelivered)+amount(S.tutorial?.stoneDelivered)>0||S.camp?.links?.length||S.camp?.blowers?.length||S.camp?.fences?.length||S.camp?.hoppers?.length||S.camp?.platforms?.length||S.camp?.loaders?.length||S.camp?.gate||S.camp?.beacon||S.camp?.cart||Object.values(S.camp?.tools||{}).some(n=>amount(n)>0)||S.expedition?.unlocks?.farmer||S.expedition?.unlocks?.ballista||S.expedition?.records?.some(r=>r.cleared)||S.expedition?.groups?.some(g=>amount(g.count)>0));}
 function projectBuilt(S,id){const c=S.camp||{};if(/^woodTool[12]$/.test(id))return amount(c.tools?.wood)>=Number(id.slice(-1));if(/^stoneTool[12]$/.test(id))return amount(c.tools?.stone)>=Number(id.slice(-1));return c[id]===true;}
 function inferLegacy(S,p){
  const add=new Set(p.recipes),seeds=[];
  const grant=id=>{if(recipeIds.includes(id)){add.add(id);seeds.push('recipe_'+id);}};
  const seen=new Set(),maxWave=Math.max(amount(S.outpost?.cleared),amount(S.clearedBossWave),...(S.expedition?.records||[]).filter(r=>r?.cleared).map(r=>amount(r.wave)));
  for(const id of ['woodcutter','miner','arch','sword','farmer','ballista'])if(amount(S.owned?.[id])||(S.expedition?.groups||[]).some(g=>g.id===id&&amount(g.count)>0))grant(id);
  const visible=S.tutorial?.visibleOptions||{};
  if(visible.worker||amount(S.tutorial?.woodDelivered)+amount(S.tutorial?.stoneDelivered)>=2)grant('woodcutter');
  if(visible.blower)grant('blower');if(visible.defence)grant('arch');
  if(maxWave>=1){grant('miner');grant('sword');grant('fence');}
  if(maxWave>=3){grant('belt');grant('platform');grant('hopper');}
  for(const [id,key]of [['blower','blowers'],['fence','fences'],['belt','links'],['platform','platforms'],['hopper','hoppers'],['loader','loaders']])if(S.camp?.[key]?.length)grant(id);
  for(const id of ['farmer','ballista'])if(S.expedition?.unlocks?.[id])grant(id);
  if(S.factory?.nodes?.some(n=>n.type==='food'))grant('farmer');
  for(const branch of Skills.branches)for(let tier=1;tier<=amount(S.harvestSkills?.[branch])&&tier<=6;tier++)seeds.push(branch+tier);
  for(const n of nodes.filter(n=>n.kind==='project'))if(projectBuilt(S,n.project))seeds.push(n.id);
  // Infer only recipe ancestors. Never invent skill ranks, camp buildings or materials to tidy the graph.
  function visit(id){if(seen.has(id))return;seen.add(id);const n=byId.get(id);if(!n)return;if(n.kind==='recipe')add.add(n.recipe);for(const req of n.requires)visit(req);}
  seeds.forEach(visit);p.recipes=recipeIds.filter(id=>add.has(id));p.legacyPending=false;
 }
 function ensure(S){
  if(!S.progression||S.progression.version!==1){S.progression=fresh();S.progression.legacyPending=legacyEvidence(S);}
  const p=S.progression;p.recipes=[...new Set((Array.isArray(p.recipes)?p.recipes:[]).filter(id=>recipeIds.includes(id)))];
  if(p.legacyPending===true)inferLegacy(S,p);else p.legacyPending=false;
  if(S.expedition){S.expedition.unlocks??={farmer:false,ballista:false};for(const id of ['farmer','ballista'])if(p.recipes.includes(id))S.expedition.unlocks[id]=true;}
  return p;
 }
 function hasRecipe(S,id){return ensure(S).recipes.includes(String(id).replace(/^recipe_/,''));}
 function built(S,id){const n=byId.get(id);if(!n)return false;if(n.kind==='skill')return (Skills.migrate(S.harvestSkills)[n.branch]||0)>=n.tier;if(n.kind==='recipe')return ensure(S).recipes.includes(n.recipe);return projectBuilt(S,n.project);}
 function balance(S,type){return amount(type==='coins'?S.expedition?.coins:type==='gold'?S.gold:S.factory?.inventory?.[type]);}
 function quote(S,id){
  ensure(S);const n=byId.get(id);if(!n)return null;const learned=built(S,id),missingPrereqs=n.requires.filter(req=>!built(S,req)),cost={wood:0,stone:0,gold:0,coins:0,...n.cost},missing=Object.fromEntries(types.map(type=>[type,Math.max(0,cost[type]-balance(S,type))]));
  const locked=!learned&&missingPrereqs.length>0;return {...n,node:n,cost,built:learned,locked,missing,missingPrereqs,needsPrevious:missingPrereqs.length>0,needsRail:false,ready:!learned&&!locked&&!Object.values(missing).some(Boolean)};
 }
 function available(S){return nodes.map(n=>quote(S,n.id)).filter(q=>q.ready);}
 function pay(S,cost){S.factory??={inventory:{}};S.factory.inventory??={};for(const type of ['wood','stone'])if(cost[type])S.factory.inventory[type]=balance(S,type)-cost[type];if(cost.gold)S.gold=balance(S,'gold')-cost.gold;if(cost.coins)S.expedition.coins=balance(S,'coins')-cost.coins;}
 function purchase(S,id){
  const q=quote(S,id);if(!q?.ready)return false;
  if(q.kind==='skill'&&q.branch!=='route')return Skills.purchase(S,id);
  pay(S,q.cost);
  if(q.kind==='skill'){S.harvestSkills=Skills.migrate(S.harvestSkills);S.harvestSkills[q.branch]=q.tier;}
  else if(q.kind==='recipe'){ensure(S).recipes.push(q.recipe);ensure(S);}
  else{S.camp??={version:1};S.camp.tools??={wood:0,stone:0};if(/^woodTool[12]$/.test(q.project))S.camp.tools.wood=q.tier;else if(/^stoneTool[12]$/.test(q.project))S.camp.tools.stone=q.tier;else S.camp[q.project]=true;}
  return true;
 }
 return {nodes,recipeIds,fresh,migrate,legacyEvidence,ensure,hasRecipe,built,quote,purchase,available};
});
