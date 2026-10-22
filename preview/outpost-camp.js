/* Supplies become spendable only when their visible cargo reaches the house. */
window.OutpostCamp = (() => {
 'use strict';
 const WORLD = {width:960,height:540}, HOME = {x:100,y:340};
 const COST = {wood:32,stone:40},BELT_PORT={x:162,y:328};
 const words = {
  warehouse:['おうち','Warehouse','仓库'],workshop:['つくる','Workshop','工坊'],close:['とじる','Close','关闭'],
  wood:['き','Wood','木材'],stone:['いし','Stone','石材'],gold:['おかね','Gold','金币'],
  title:['なかまの しごとば','The camp workshop','营地工坊'],
  intro:['コンベアの うえに おくと、おうちへ ながれるよ。おうちから ひっぱって つくろう。','Items on a conveyor move into the house. Drag from the house to build.','放在传送带上的物资会运入房屋。从房屋拖动建造。'],
  rail:['コンベア','Conveyor','传送带'],build:['ここを つなぐ','Connect this route','连接这条路线'],
  extend:['つぎも つなぐ','Connect another worksite','延伸至下个采集点'],
  complete:['ぜんぶ つながった！','All worksites connected','全部已连接'],
  woodSite:['きの ばしょ','Wood site','伐木点'],stoneSite:['いしの ばしょ','Stone site','采石点'],
  carries:['2秒ごとに最大4個ずつ、倉庫へ運びます。','Carries up to 4 supplies every 2 seconds.','每2秒最多运送4份物资。'],
  available:['おうちに とどいた き・いしを つかうよ。','Supplies can be spent after they arrive home.','物资送达仓库后即可使用。'],
  worker:['はたらく なかま','Workers nearby:','附近作业中'],people:['にん','','人'],
  noWorker:['ここに なかまを おくと、あつめて はこんでくれるよ。','Place a worker here to automate gathering and delivery.','在此布置采集伙伴，即可自动采集并运送。'],
  automated:['き・いしが レールで おうちへ とどくよ。','Supplies travel to the warehouse by rail.','物资沿轨道送达仓库。'],
  needed:['あと','Need','还需'],connected:['つながった','Connected','已连接'],
  linked:['つながった！ にもつが おうちへ とどくよ。','Route connected. Watch the cargo travel home.','已连接仓库，等待货物送达。'],
  inTransit:['はこんでいるよ','On the way','运送中'],arrived:['おうちに とどいた！','Delivered home','已送达仓库'],
  tapHome:['おうちを おすと つくれるよ。','Tap the house to open the workshop.','点击房屋打开工坊。'],
  clickPile:['き・いしを つかんで おうちへ！','Drag fallen supplies into the house.','将掉落物资拖到房屋！'],dragging:['おうちへ はなしてね！','Release over the house!','拖到房屋后松开！'],returned:['もどしたよ。つかんで おうちへ！','Returned. Drag it into the house.','已放回，请拖到房屋！'],
  firstRail:['コンベアを おして、おうちから ひっぱろう！','Choose Conveyor, then drag out from the house!','选择传送带，再从房屋向外拖动！'],
  stoneNext:['つぎは いしの ばしょも おうちへ つなごう。','Connect a stone worksite next.','接下来连接采石点。'],
  bothRails:['うごく ベルトに のせると おうちへ とどく！','Place items on the moving belt to send them home!','放在移动的传送带上，物资就会运入房屋！']
 };
 const beltWords={platformBlocked:['ここには おけないよ。べつの ばしょに おこう。','Choose another clear place for the platform.','这里不能放置，请选择其他空地。'],platformBuild:['▦ うけとるだい','▦ Receiving platform','▦ 接料平台'],platformHint:['だいを おこう。やじるしの さきに ベルトを つなごう。','Place a platform. Connect a belt at its output arrow.','放置平台，并把传送带连接到箭头出口。'],platformCost:['き8・いし4','8 wood · 4 stone','8木材·4石材'],rotate:['むき ↻','Turn ↻','转向 ↻'],freeBeltHint:['とどけたい ばしょから ひっぱろう！ やじるしは はじめの ばしょへ。','Drag from the destination toward the incoming items. Arrows point back to your starting point.','从接收处向来料方向拖动，箭头指向起点。'],beltCollect:['まず きを おうちへ はこぼう（き 2〜）','First carry wood into the house (2+ wood).','先把木材送入房屋（至少2木材）。'],beltBuild:['▰ コンベア','▰ Conveyor','▰ 传送带'],beltHint:['とどけたい ところから ひっぱって のばそう！','Drag from the destination toward incoming items!','从接收处向来料方向拖动延伸！'],beltRelease:['はなすと つくれるよ。き ','Release to build. Wood ','松开建造。木材 '],beltWood:['きが たりないよ。みじかく ひこう。','Not enough wood. Draw a shorter belt.','木材不足，请缩短传送带。'],beltPlaced:['できた！ うえに き・いしを のせよう！','Built! Drop wood or stone onto the belt!','建好了！把木石放到传送带上！'],beltFeed:['コンベアか おうちへ はなそう！','Release on a conveyor or the house!','在传送带或房屋上松开！']};
 const railWords={chooseSource:['どこから はこぶ？ き・いしの ○ を おそう。','Choose a worksite: click its loading circle.','选择采集点，点击装货圆圈。'],layRoute:['ちかくの じめんを おして レールを のばそう。おうちまで つなごう。','Click nearby ground to extend the rails. Reach the house.','点击附近地面延伸轨道，直到房屋。'],confirmRoute:['おうちに つながった！ ねだんを みて つくろう。','Connected to the house. Check the price and build.','已连接房屋，确认费用后建造。'],undo:['ひとつ もどす','Undo point','撤销一点'],cancelRail:['やめる','Cancel','取消'],layRail:['この みちを つくる','Build this route','修建此路线'],gap:['とおすぎるよ。ちかくに ひとつずつ おこう。','Too far. Place one short section at a time.','太远了，请逐段铺设。'],object:['き・いわを よけて おこう。','Go around trees and rocks.','请绕开树木和岩石。'],bounds:['じめんの なかに おこう。','Keep the rails on the field.','请在场地内铺设。'],short:['もうすこし はなれた ところへ。','Choose a point farther away.','请选择稍远一点的位置。'],long:['みちが ながすぎるよ。もどして みじかくしよう。','Route too long. Undo some points.','路线过长，请撤销部分节点。'],remove:['こわす・はんぶん もどる','Remove / half refund','拆除·退还一半'],railPrice:['8G ＋ ながさ32ごとに2G','8G station + 2G per 32 distance','站点8G＋每32距离2G'],draw:['じぶんで レールを しく','Lay rails yourself','手动铺设轨道']};
 const projectWords={rails:['コンベア','Conveyors','传送带'],growth:['どうぐ・おうち','Tools / home','工具·营地'],woodTool:['きこりの どうぐ','Lumberjack tools','伐木工具'],stoneTool:['いしほりの どうぐ','Mining tools','采矿工具'],cart:['コンベアの モーター','Conveyor motor','传送带马达'],gate:['みはりの もん','Watch gate','守望门'],beacon:['まちへの あかり','Town beacon','城镇灯塔'],made:['できた！','Built!','已建成！'],make:['つくる','Build','建造'],locked:['まずは ここまで まもろう','Defend up to this raid first','先守住这一波'],rank:['だんかい','Level','阶段'],materials:['つかうもの','Materials','材料'],faster:['ひとりで はやく はたらける！','Each worker gathers faster.','每位工人采集更快。'],cartEffect:['ベルトの はやさ ×1.25！','Belt speed ×1.25!','传送带速度×1.25！'],gateEffect:['おうちの まえで 2.5びょう まにあう！','A 2.5-second rescue window at the house.','房屋前有2.5秒的救援时间。'],beaconEffect:['まちへの みちを ひらく あかり。さいごの むれを まもろう！','Light the way to town, then defend the final raid.','点亮通往城镇的道路，守住最终袭击。'],projectDone:['できた！ なかまの しごとを みてみよう。','Built! Watch your camp work.','建好了！看看营地的变化。']};
 let drag=null,dragGhost=null,dragInstalled=false;
 let railDraft=null,railPanel=null,railHover=null,railError='',beltPointer=null,beltButton=null,beltHistory=[],platformButton=null,platformMode=false,platformPreview=null,platformDir=0;
 let activeTab='rails',workshopMessage='';
 let booted=false,activeCamp=null,railClock=0,uiClock=0,houseFlash=0;
 let warehouse=null,overlay=null,goldLabel=null,deliveryLabel=null,workshopStatus=null;
 let statusKey='clickPile',statusUntil=0,visualTime=0,positionKey='',languageKey='',notices=[];
 const language=()=>typeof LANG==='string'?LANG:'ja';
 const tr=key=>(words[key]||projectWords[key]||railWords[key]||beltWords[key])[Math.max(0,['ja','en','zh'].indexOf(language()))];
 const format=n=>typeof fmt==='function'?fmt(n):String(Math.floor(n));
 const current=()=>typeof S==='undefined'?null:S;
 const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 const persist=()=>{if(typeof save==='function')save();};
 const audio=event=>window.ForestAudio?.play(event);
 const clamp=(n,min,max)=>Math.max(min,Math.min(Math.max(min,max),n));
 const keyEqual=(a,b)=>String(a)===String(b);
 const skillEffects=()=>window.HarvestSkillCore?.effects?.(current()?.harvestSkills)||{carryCapacity:1,cartSpeed:1};
 const handCapacity=()=>Math.max(1,Math.min(4,Math.floor(skillEffects().carryCapacity||1)));
 const heldDrop=drop=>drag?.items.some(item=>item.drop===drop)===true;
 const railCargo=cargo=>cargo.mode==='rail'||(!cargo.mode&&cargo.duration>.61);

 function state(){
  const s=current();if(!s)return null;
  if(!s.factory)s.factory=SupplyCore.fresh(WORLD.width,WORLD.height);
  if(!s.camp){
   s.camp={version:1,links:[],cargo:[],nextKey:1,tools:{wood:0,stone:0},gate:false,beacon:false,cart:false,endingSeen:false};
   s.factory.width=WORLD.width;s.factory.height=WORLD.height;s.factory.depot={...HOME};
   s.factory.nodes=[{key:1,type:'wood',x:280,y:300},{key:2,type:'wood',x:470,y:300},{key:3,type:'stone',x:330,y:395},{key:4,type:'stone',x:490,y:395}].map(n=>({...n,stock:300,radius:n.type==='wood'?16:19,regrow:0}));
   s.factory.next=Math.max(5,s.factory.next||1,...s.factory.drops.map(d=>(Number(d.key)||0)+1));
  }
  s.camp.platforms??=[];s.camp.tools??={wood:0,stone:0};for(const type of ['wood','stone'])s.camp.tools[type]=Math.max(0,Math.min(2,Math.floor(Number(s.camp.tools[type])||0)));for(const flag of ['gate','beacon','cart','endingSeen'])s.camp[flag]=s.camp[flag]===true;
  if(activeCamp!==s.camp){
   activeCamp=s.camp;railClock=0;uiClock=0;houseFlash=0;notices=[];railDraft=null;railHover=null;
   statusKey='clickPile';statusUntil=0;languageKey='';
  }
  return s;
 }
 const linked=(s,node)=>s.camp.links.some(link=>keyEqual(link.nodeKey,node.key));
 const railExists=type=>{const s=state(),id=type==='wood'?'woodcutter':'miner';return (window.ArmyView?.sim?.soldiers||[]).some(p=>{if(p.id!==id)return false;const n=s.factory.nodes.filter(n=>n.type===type).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!n)return false;const out=window.SupplyFactory?.outputForWorker?.(p,n)||{x:p.x+Math.sign(p.x-n.x)*24,y:p.y+24};return !!ConveyorCore.contact(s.camp.links,out)||!!ConveyorCore.platformAt(s.camp.platforms,out);});};
 function workersAt(node){
  const id=node.type==='wood'?'woodcutter':'miner';
  return (window.ArmyView?.sim?.soldiers||[]).filter(p=>p.id===id&&Math.hypot(p.x-node.x,p.y-node.y)<72).length;
 }
 function nextNode(s,type){
  return s.factory.nodes.filter(n=>n.type===type&&!linked(s,n)).sort((a,b)=>workersAt(b)-workersAt(a)||Math.hypot(a.x-HOME.x,a.y-HOME.y)-Math.hypot(b.x-HOME.x,b.y-HOME.y))[0];
 }
 function siteName(s,node){
  const number=s.factory.nodes.filter(n=>n.type===node.type).findIndex(n=>keyEqual(n.key,node.key))+1;
  return tr(node.type==='wood'?'woodSite':'stoneSite')+' '+number;
 }

 function makeDOM(){
  const field=document.getElementById('field'),inventory=document.getElementById('supplyInventory');
  if(!field||!inventory)return;
  if(!warehouse){
   warehouse=document.createElement('aside');warehouse.id='campWarehouse';
   warehouse.innerHTML='<button type="button" class="camp-house-label"><b></b><span></span></button><div class="camp-gold"><span></span><strong id="campGold"></strong></div><small id="campDeliveryNote" role="status" aria-live="polite"></small>';
   field.append(warehouse);warehouse.querySelector('.camp-house-label').onclick=openWorkshop;
   warehouse.addEventListener('pointerdown',e=>e.stopPropagation());
   warehouse.insertBefore(inventory,warehouse.querySelector('#campDeliveryNote'));
   goldLabel=warehouse.querySelector('#campGold');deliveryLabel=warehouse.querySelector('#campDeliveryNote');
  }else if(inventory.parentElement!==warehouse)warehouse.insertBefore(inventory,deliveryLabel);
  const toolbar=document.getElementById('rxToolbar'),tools=document.getElementById('hudTools');
  if(toolbar&&tools&&tools.parentElement!==toolbar)toolbar.append(tools);
 }

 function makeWorkshop(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='campWorkshop';overlay.className='rx-overlay';
  overlay.innerHTML='<section class="rx-dialog camp-workshop" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="campWorkshopTitle"><button type="button" class="rx-close"></button><span class="rx-kicker">CAMP WORKSHOP</span><h2 id="campWorkshopTitle"></h2><p class="camp-workshop-intro"></p><p class="camp-workshop-wallet"><span></span> <strong></strong></p><p class="camp-stock-wallet"></p><div class="camp-workshop-tabs"><button type="button" data-camp-tab="rails"></button><button type="button" data-camp-tab="growth"></button></div><div class="camp-rail-options">'+['wood','stone'].map(type=>'<section class="camp-rail-option" data-camp-option="'+type+'"><div class="camp-rail-heading"><h3></h3><span class="camp-rail-count"></span></div><div class="camp-route"><b class="camp-route-origin"></b><span class="camp-route-track" aria-hidden="true"></span><b class="camp-route-home"></b></div><p class="camp-rail-rate"></p><p class="camp-rail-workers"></p><button type="button" data-camp-build="'+type+'"><span></span><strong></strong></button><small class="camp-rail-afford"></small></section>').join('')+'</div><div class="camp-projects" hidden></div><p class="camp-workshop-status" role="status" aria-live="polite"></p><p class="camp-workshop-note"></p></section>';
  document.body.append(overlay);workshopStatus=overlay.querySelector('.camp-workshop-status');
  overlay.querySelector('.rx-close').onclick=()=>window.Rework?.close();
  overlay.addEventListener('click',e=>{
   if(e.target===overlay){window.Rework?.close();return;}
   const tab=e.target.closest('[data-camp-tab]');if(tab){activeTab=tab.dataset.campTab;syncWorkshop(state());return;}const project=e.target.closest('[data-camp-project]');if(project&&!project.disabled){build(project.dataset.campProject);return;}
   const turn=e.target.closest('[data-platform-turn]');if(turn){const p=state().camp.platforms.find(p=>p.key===Number(turn.dataset.platformTurn));if(p){p.dir=(p.dir+1)%4;persist();syncWorkshop(state());}return;}const platformRemove=e.target.closest('[data-platform-remove]');if(platformRemove){const i=state().camp.platforms.findIndex(p=>p.key===Number(platformRemove.dataset.platformRemove));if(i>=0){state().camp.platforms.splice(i,1);state().factory.inventory.wood+=4;state().factory.inventory.stone+=2;persist();syncWorkshop(state());}return;}const remove=e.target.closest('[data-camp-remove]');if(remove){removeRail(remove.dataset.campRemove);return;}const button=e.target.closest('[data-camp-build]');if(button&&!button.disabled)buildRail(button.dataset.campBuild);
  });
 }

 function syncWorkshop(s){
  if(!overlay)return;
  if(workshopMessage)setText(workshopStatus,tr(workshopMessage));
  overlay.querySelector('.rx-close').setAttribute('aria-label',tr('close'));
  setText(overlay.querySelector('.rx-close'),'×');setText(overlay.querySelector('h2'),tr('title'));
  setText(overlay.querySelector('.camp-workshop-intro'),tr('intro'));
  setText(overlay.querySelector('.camp-workshop-wallet span'),tr('gold'));
  setText(overlay.querySelector('.camp-workshop-wallet strong'),format(s.gold)+' G');
  const stocks=overlay.querySelector('.camp-stock-wallet');if(stocks){const key=language()+':'+Math.floor(s.factory.inventory.wood)+':'+Math.floor(s.factory.inventory.stone);if(stocks.dataset.value!==key){stocks.dataset.value=key;stocks.innerHTML=['wood','stone'].map(type=>'<span>'+((window.SupplyFactory?.icon(type))||tr(type))+'<b>'+format(Math.floor(s.factory.inventory[type]))+'</b></span>').join('');}}
  setText(overlay.querySelector('.camp-workshop-note'),tr('available'));
  for(const button of overlay.querySelectorAll('[data-camp-tab]')){setText(button,tr(button.dataset.campTab));button.setAttribute('aria-pressed',String(activeTab===button.dataset.campTab));}overlay.querySelector('.camp-rail-options').hidden=activeTab!=='rails';overlay.querySelector('.camp-projects').hidden=activeTab!=='growth';overlay.querySelector('.camp-rail-options').style.display=activeTab==='rails'?'grid':'none';overlay.querySelector('.camp-projects').style.display=activeTab==='growth'?'grid':'none';syncProjects(s);
  for(const type of ['wood','stone']){
   const card=overlay.querySelector('[data-camp-option="'+type+'"]');card.hidden=type==='stone';card.style.display=type==='stone'?'none':'';if(type==='stone')continue;
   setText(card.querySelector('h3'),tr('rail'));setText(card.querySelector('.camp-rail-count'),String(s.camp.links.length));
   setText(card.querySelector('.camp-route-origin'),tr('wood')+' / '+tr('stone'));setText(card.querySelector('.camp-route-home'),tr('warehouse'));
   setText(card.querySelector('.camp-rail-rate'),tr('intro'));setText(card.querySelector('.camp-rail-workers'),tr('beltHint'));
   const button=card.querySelector('[data-camp-build]');setText(button.querySelector('span'),tr('beltBuild'));setText(button.querySelector('strong'),language()==='ja'?'き 2〜':language()==='zh'?'木材 2起':'Wood: 2+');button.disabled=s.factory.inventory.wood<1;
   setText(card.querySelector('.camp-rail-afford'),s.factory.inventory.wood<1?tr('beltWood'):'');
   let routes=card.querySelector('.camp-existing-routes');if(!routes){routes=document.createElement('div');routes.className='camp-existing-routes';card.append(routes);}routes.replaceChildren(...s.camp.links.map(l=>{const b=document.createElement('button');b.type='button';b.dataset.campRemove=l.nodeKey;b.textContent=tr('rail')+' '+l.nodeKey+' ×';return b;}),...s.camp.platforms.flatMap(p=>{const turn=document.createElement('button'),remove=document.createElement('button');turn.type=remove.type='button';turn.dataset.platformTurn=p.key;remove.dataset.platformRemove=p.key;turn.textContent=tr('platformBuild')+' '+p.key+' ↻';remove.textContent=tr('platformBuild')+' '+p.key+' ×';return[turn,remove];}));
  }
 }

 function syncDOM(){
  const s=state();if(!s)return;makeDOM();
  if(warehouse){
   const lang=language();if(lang!==languageKey){
    languageKey=lang;warehouse.setAttribute('aria-label',tr('warehouse'));
    setText(warehouse.querySelector('.camp-house-label b'),tr('warehouse'));
    setText(warehouse.querySelector('.camp-house-label span'),tr('workshop')+' ›');
    setText(warehouse.querySelector('.camp-gold span'),tr('gold'));
    for(const type of ['wood','stone'])document.getElementById(type==='wood'?'gatherWood':'gatherStone')?.setAttribute('data-camp-label',tr(type));
   }
   setText(goldLabel,format(s.gold)+' G');if(beltButton)setText(beltButton,tr('beltBuild'));if(platformButton)setText(platformButton,tr('platformBuild'));
   const hasCargo=s.camp.cargo.length>0||s.factory.drops.some(d=>!heldDrop(d)&&ConveyorCore.contact(s.camp.links,d));
   setText(deliveryLabel,statusUntil>visualTime?tr(statusKey):tr(hasCargo?'inTransit':'tapHome'));
  }
  if(overlay?.classList.contains('on'))syncWorkshop(s);if(railDraft)syncRailPanel();
 }

 function cleared(s=state()){return Math.max(0,s?.outpost?.cleared||0,s?.clearedBossWave||0);}
 function quote(id){
  const s=state();if(!s)return null;const c=s.camp;let cost={wood:0,stone:0,gold:0},unlock=3,level=0,done=false,effect='';
  if(id==='woodTool'||id==='stoneTool'){
   const type=id==='woodTool'?'wood':'stone';level=c.tools[type];done=level>=2;unlock=level>=1?6:3;
   cost=type==='wood'?(level?{wood:100,stone:60,gold:0}:{wood:45,stone:20,gold:0}):(level?{wood:70,stone:100,gold:0}:{wood:30,stone:35,gold:0});
   effect=language()==='ja'?(type==='wood'?'き':'いし')+' 1こ / '+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'びょう':language()==='zh'?'每'+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'秒采集1份':'1 / '+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'s per worker';
  }else if(id==='cart'){cost={wood:0,stone:0,gold:55};done=c.cart;effect=tr('cartEffect');}
  else if(id==='gate'){cost={wood:100,stone:60,gold:0};unlock=6;done=c.gate;effect=tr('gateEffect');}
  else if(id==='beacon'){cost={wood:220,stone:160,gold:0};unlock=8;done=c.beacon;effect=tr('beaconEffect');}
  else return null;
  const locked=cleared(s)<unlock,inventory=s.factory.inventory;
  const affordable=s.gold>=cost.gold&&inventory.wood>=cost.wood&&inventory.stone>=cost.stone;
  return {id,cost,unlock,level,tier:Math.min(2,level+1),done,built:done,locked,affordable,ready:!done&&!locked&&affordable,title:tr(id),effect};
 }
 function canBuild(id){return quote(id)?.ready===true;}
 function canStartWave(wave){const s=state();if(!s)return false;const c=s.camp;return (wave<4||c.tools.wood+c.tools.stone>0)&&(wave<7||c.gate)&&(wave<9||c.beacon);}
 function nextProject(){
  const s=state();if(!s)return null;const c=s.camp,n=cleared(s);
  if(n>=8&&!c.beacon)return quote('beacon');if(n>=6&&!c.gate)return quote('gate');
  if(n>=3&&!c.tools.wood&&!c.tools.stone)return {...quote('woodTool'),alternatives:['woodTool','stoneTool']};
  if(n>=6&&(c.tools.wood<2||c.tools.stone<2))return quote(c.tools.wood<2?'woodTool':'stoneTool');
  if(n>=3&&(c.tools.wood<1||c.tools.stone<1))return quote(c.tools.wood<1?'woodTool':'stoneTool');
  if(n>=3&&!c.cart)return quote('cart');return null;
 }
 function projectIcon(id){
  const paths={woodTool:'<path d="M9 28L22 5" stroke="#805b36" stroke-width="4"/><path d="M21 4L29 9L24 17L17 12Z" fill="#b8c7b4"/>',stoneTool:'<path d="M9 28L21 6" stroke="#805b36" stroke-width="4"/><path d="M10 11Q22 2 29 15" fill="none" stroke="#b8c7b4" stroke-width="5"/>',cart:'<path d="M5 12H29V26H5Z" fill="#71856d" stroke="#d6c58b"/><circle cx="17" cy="18" r="7" fill="#384c3d" stroke="#dfd497"/><path d="M17 8V28M7 18H27" stroke="#dfd497" stroke-width="3"/>',gate:'<path d="M5 29V9H10V29M22 29V9H27V29M5 10V5H27V10M10 16H22" fill="#89643b" stroke="#d4b272" stroke-width="2"/><path d="M14 15L17 20L20 15" fill="#779665"/>',beacon:'<path d="M11 29L13 15H21L23 29Z" fill="#9a9d7e"/><path d="M12 15V8H22V15Z" fill="#e3c773" stroke="#d5dfa0"/><path d="M10 8L17 3L24 8Z" fill="#886840"/><path d="M3 11H8M26 11H31M8 2L11 5M26 2L23 5" stroke="#eed38a" stroke-width="2"/>'};
  return '<svg viewBox="0 0 34 34" width="42" height="42" aria-hidden="true">'+paths[id]+'</svg>';
 }
 function priceHTML(cost){return ['wood','stone'].filter(type=>cost[type]).map(type=>'<span class="camp-material-price">'+(window.SupplyFactory?.icon(type)||tr(type))+' <b>'+format(cost[type])+'</b></span>').join('')+(cost.gold?'<span class="camp-gold-price">'+format(cost.gold)+' G</span>':'');}
 function syncProjects(s){
  const container=overlay.querySelector('.camp-projects');if(!container)return;
  const signature=JSON.stringify([language(),cleared(s),s.camp.tools,s.camp.cart,s.camp.gate,s.camp.beacon,Math.floor(s.gold),Math.floor(s.factory.inventory.wood),Math.floor(s.factory.inventory.stone)]);
  if(container.dataset.signature===signature)return;container.dataset.signature=signature;
  const focused=document.activeElement?.dataset?.campProject;container.innerHTML=['woodTool','stoneTool','cart','gate','beacon'].map(id=>{const q=quote(id);const missing=['wood','stone','gold'].filter(t=>(t==='gold'?s.gold:s.factory.inventory[t])<q.cost[t]).map(t=>((t==='gold'?'G':window.SupplyFactory?.icon(t)||tr(t))+' '+Math.ceil(q.cost[t]-(t==='gold'?s.gold:s.factory.inventory[t])))).join(' · ');const status=q.done?tr('made'):q.locked?tr('locked')+' '+q.unlock:!q.affordable?tr('needed')+' '+missing:tr('make');return '<button type="button" data-camp-project="'+id+'" class="camp-project'+(q.done?' is-built':'')+'" '+(!q.ready?'disabled':'')+'><span class="camp-project-icon">'+projectIcon(id)+'</span><b>'+q.title+(id.endsWith('Tool')?' · '+(language()==='ja'?'いま ':language()==='zh'?'当前 ':'Now ')+q.level+' / 2':'')+'</b><span class="camp-project-effect">'+(!q.done?(language()==="ja"?"つぎ：":language()==="zh"?"下级：":"Next: "):"")+q.effect+'</span><span class="camp-project-price">'+(q.done?'✓':priceHTML(q.cost))+'</span><small>'+status+'</small></button>';}).join('');
  if(focused){const same=container.querySelector('[data-camp-project="'+focused+'"]'),next=same&&!same.disabled?same:container.querySelector('button:not(:disabled)')||overlay.querySelector('.camp-workshop');next?.focus?.({preventScroll:true});}
 }
 function build(id){
  const s=state(),q=quote(id);if(!s||!q?.ready)return false;
  s.gold-=q.cost.gold;s.factory.inventory.wood-=q.cost.wood;s.factory.inventory.stone-=q.cost.stone;
  if(id==='woodTool'||id==='stoneTool')s.camp.tools[id==='woodTool'?'wood':'stone']++;
  else s.camp[id]=true;
  workshopMessage='projectDone';setText(workshopStatus,tr(workshopMessage));audio('build');
  if(typeof renderUnits==='function')renderUnits();if(typeof renderCards==='function')renderCards();if(typeof updateHud==='function')updateHud();
  window.Outpost?.update();window.Rework?.track?.('camp_build',{project:id,level:q.tier});persist();syncDOM();syncWorkshop(s);return true;
 }
 function drawProjects(ctx,s){
  // Permanent additions stay still, so the camp's growth is visible without camera motion.
  for(const type of ['wood','stone'])if(s.camp.tools[type]){
   const n=s.factory.nodes.find(n=>n.type===type);if(!n)continue;const x=n.x+38,y=n.y+7;
   ctx.fillStyle='#3b3927';ctx.fillRect(x-18,y-19,36,20);ctx.fillStyle=type==='wood'?'#a07c45':'#95987a';ctx.fillRect(x-15,y-17,30,14);
   ctx.fillStyle='#d5be83';ctx.fillRect(x-20,y-21,40,4);ctx.fillStyle='#55452e';ctx.fillRect(x-14,y-1,4,12);ctx.fillRect(x+10,y-1,4,12);
   ctx.fillStyle=s.camp.tools[type]>1?'#f0d47f':'#a9bf90';ctx.fillRect(x-5,y-15,10,9);
  }
  if(s.camp.gate){const x=180,y=330;ctx.fillStyle='#473c28';ctx.fillRect(x-27,y-40,9,46);ctx.fillRect(x+18,y-40,9,46);ctx.fillStyle='#a78750';ctx.fillRect(x-30,y-43,60,10);ctx.fillStyle='#d9c18c';ctx.fillRect(x-28,y-43,56,3);ctx.fillStyle='#6f8d61';ctx.beginPath();ctx.moveTo(x-9,y-30);ctx.lineTo(x+9,y-30);ctx.lineTo(x+9,y-13);ctx.lineTo(x,y-6);ctx.lineTo(x-9,y-13);ctx.closePath();ctx.fill();}
  if(s.camp.beacon){const x=82,y=248;ctx.fillStyle='#4d5140';ctx.fillRect(x-15,y-34,30,37);ctx.fillStyle='#929779';ctx.fillRect(x-11,y-34,22,34);ctx.fillStyle='#dbca85';ctx.fillRect(x-13,y-48,26,17);ctx.fillStyle='#f4e5a7';ctx.fillRect(x-8,y-45,16,10);ctx.fillStyle='#705739';ctx.beginPath();ctx.moveTo(x-18,y-48);ctx.lineTo(x,y-61);ctx.lineTo(x+18,y-48);ctx.closePath();ctx.fill();ctx.strokeStyle='#dfd08b88';ctx.lineWidth=2;for(const dx of [-1,1]){ctx.beginPath();ctx.moveTo(x+dx*20,y-40);ctx.lineTo(x+dx*34,y-40);ctx.stroke();}}
 }

 function buildRail(){
  platformMode=false;platformPreview=null;const s=state();if(!s)return false;endDrag(null,true);window.SupplyFactory?.stopHold?.();window.BattleControl?.setPlacement(false);window.Rework?.close();
  railDraft={points:[],owner:s};railHover=null;railError='';document.getElementById('field').classList.add('laying-rails');syncRailPanel();return true;
 }
 function stopRails(){platformMode=false;platformPreview=null;railDraft=null;railHover=null;railError='';beltPointer=null;document.getElementById('field')?.classList.remove('laying-rails');if(railPanel)railPanel.hidden=true;}
 function syncRailPanel(){
  if(!railPanel){railPanel=document.createElement('section');railPanel.id='railEditor';railPanel.innerHTML='<b role="status"></b><strong class="rail-price"></strong><div><button type="button" data-rail-action="rotate"></button><button type="button" data-rail-action="undo"></button><button type="button" data-rail-action="cancel"></button></div>';document.getElementById('deckMain').prepend(railPanel);railPanel.onclick=e=>{const action=e.target.closest('[data-rail-action]')?.dataset.railAction;if(action==='cancel')stopRails();if(action==='undo')undoBelt();if(action==='rotate'){platformDir=(platformDir+1)%4;syncRailPanel();}};}
  railPanel.hidden=!railDraft;if(!railDraft)return;railPanel.querySelector('[data-rail-action="rotate"]').hidden=!platformMode;setText(railPanel.querySelector('[data-rail-action="rotate"]'),tr('rotate'));if(platformMode){setText(railPanel.querySelector('b'),railError?tr(railError==='area'?'platformBlocked':'beltWood'):tr('platformHint'));setText(railPanel.querySelector('.rail-price'),tr('platformCost'));setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));return;}const price=railDraft.points.length>1?ConveyorCore.cost(railDraft.points)-(railDraft.oldCost||0):0;
  const missing=Math.max(0,Math.max(1,price)-state().factory.inventory.wood);setText(railPanel.querySelector('b'),beltPointer!==null&&price>0&&missing>0?(language()==='ja'?'きが あと '+Math.ceil(missing)+'こ。みじかく のばそう。':language()==='zh'?'还缺'+Math.ceil(missing)+'木材，请缩短。':'Need '+Math.ceil(missing)+' more wood. Draw a shorter belt.'):railError?tr('beltWood'):state().factory.inventory.wood<2?tr('beltCollect'):beltPointer!==null?tr('beltRelease')+Math.max(1,price):tr('beltHint'));
  setText(railPanel.querySelector('.rail-price'),(language()==='ja'?'き ':language()==='zh'?'木材 ':'Wood ')+Math.max(0,Math.floor(state().factory.inventory.wood)));
  setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));railPanel.querySelector('[data-rail-action="undo"]').disabled=!beltHistory.length;
 }
 function commitRails(){
  const s=state(),d=railDraft;if(!d||d.owner!==s||d.points.length<2)return false;if(ConveyorCore.length(d.points)-(d.startLength||0)<10)return false;const fullCost=ConveyorCore.cost(d.points),price=Math.max(d.link?1:2,fullCost-(d.oldCost||0));if(s.factory.inventory.wood<price){railError='wood';syncRailPanel();return false;}
  const old=d.link?{...d.link,points:d.link.points.map(p=>({...p}))}:null;s.factory.inventory.wood-=price;
  if(d.link){d.link.points=d.points.map(p=>({...p}));d.link.costWood=(d.link.costWood||d.oldCost||0)+price;d.link.kind='conveyor';}
  else{const nodeKey=Math.max(0,...s.camp.links.map(l=>Number(l.nodeKey)||0))+1;s.camp.links.push({nodeKey,type:'wood',kind:'conveyor',points:d.points.map(p=>({...p})),costWood:price});}
  beltHistory.push({nodeKey:d.link?.nodeKey||s.camp.links.at(-1).nodeKey,old,price});railDraft={points:[],owner:s};railError='';statusKey='beltPlaced';statusUntil=visualTime+4;audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();return true;
 }
 function undoBelt(){const h=beltHistory.pop(),s=state();if(!h)return;if(h.platform){const j=s.camp.platforms.findIndex(p=>p.key===h.platform);if(j>=0){s.camp.platforms.splice(j,1);s.factory.inventory.wood+=8;s.factory.inventory.stone+=4;}persist();window.SupplyFactory?.translate();syncRailPanel();return;}const i=s.camp.links.findIndex(l=>keyEqual(l.nodeKey,h.nodeKey));if(i<0)return;if(h.old)s.camp.links[i]=h.old;else s.camp.links.splice(i,1);s.factory.inventory.wood+=h.price;persist();window.SupplyFactory?.translate();syncRailPanel();}
 function removeRail(key){const s=state(),i=s.camp.links.findIndex(l=>keyEqual(l.nodeKey,key));if(i<0)return false;const link=s.camp.links[i];s.camp.links.splice(i,1);s.factory.inventory.wood+=Math.floor((link.costWood||0)*.5);persist();syncDOM();syncWorkshop(s);return true;}
 function buildPlatform(){buildRail();platformMode=true;platformPreview=null;railError='';syncRailPanel();return true;}
 function platformFits(point){const s=state();return point.x>=50&&point.x<=910&&point.y>=170&&point.y<=500&&Math.hypot(point.x-HOME.x,point.y-HOME.y)>=75&&!s.camp.platforms.some(p=>Math.abs(p.x-point.x)<96&&Math.abs(p.y-point.y)<64);}
 function placePlatform(point){const s=state();if(s.factory.inventory.wood<8||s.factory.inventory.stone<4){railError='materials';syncRailPanel();return false;}if(!platformFits(point)){railError='area';syncRailPanel();return false;}
  const key=Math.max(0,...s.camp.platforms.map(p=>p.key))+1;s.factory.inventory.wood-=8;s.factory.inventory.stone-=4;s.camp.platforms.push({key,x:point.x,y:point.y,w:96,h:64,dir:platformDir,costWood:8,costStone:4});beltHistory.push({platform:key});railError='';audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();return true;
 }
 function beltStart(point){
  const s=state();if(!railDraft||Rework.paused)return false;const max=Math.max(18,16/ArmyView.camera.scale);let start=null,link=null;
  for(const l of s.camp.links){if(!l.points?.length)continue;const ps=ConveyorCore.oriented(l);if(ConveyorCore.distance(ps.at(-1),point)<max){start=ps;link=l;break;}}
  if(!start&&(ConveyorCore.distance(point,BELT_PORT)<max||Math.hypot(point.x-HOME.x,point.y-HOME.y)<30))start=[{...HOME},{...BELT_PORT}];
  if(!start){const near=ConveyorCore.contact(s.camp.links,point,ConveyorCore.WIDTH);start=[near?{x:near.x,y:near.y}:{x:clamp(point.x,14,946),y:clamp(point.y,140,520)}];}
  railDraft.points=start.map(p=>({...p}));railDraft.link=link;railDraft.oldCost=link?ConveyorCore.cost(start):0;railDraft.startLength=ConveyorCore.length(start);railError='';return true;
 }

 function installRails(){
  const field=document.getElementById('field');beltButton=document.createElement('button');beltButton.id='conveyorBuild';beltButton.type='button';beltButton.textContent=tr('beltBuild');beltButton.onclick=()=>railDraft&&!platformMode?stopRails():buildRail();document.getElementById('rxToolbar').prepend(beltButton);platformButton=document.createElement('button');platformButton.id='conveyorPlatformBuild';platformButton.type='button';platformButton.textContent=tr('platformBuild');platformButton.onclick=()=>platformMode?stopRails():buildPlatform();beltButton.after(platformButton);
  field.addEventListener('pointerdown',e=>{if(!railDraft||e.target.closest('button,input,select'))return;e.preventDefault();e.stopImmediatePropagation();if(e.button!==0||e.isPrimary===false)return;if(platformMode){platformPreview=ArmyView.point(e.clientX,e.clientY);}else if(!beltStart(ArmyView.point(e.clientX,e.clientY)))return;beltPointer=e.pointerId;try{field.setPointerCapture(e.pointerId);}catch(_){}syncRailPanel();},true);
  field.addEventListener('pointermove',e=>{if(platformMode&&railDraft){platformPreview=ArmyView.point(e.clientX,e.clientY);if(beltPointer!==e.pointerId)return;}if(!railDraft||beltPointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const p=ArmyView.point(e.clientX,e.clientY);p.x=clamp(p.x,14,946);p.y=clamp(p.y,140,520);if(platformMode)platformPreview=p;else railDraft.points=ConveyorCore.stretch(railDraft.points,p);railHover=p;syncRailPanel();},true);
  field.addEventListener('pointerup',e=>{if(beltPointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();beltPointer=null;if(platformMode){placePlatform(ArmyView.point(e.clientX,e.clientY));}else commitRails();if(railDraft){railDraft.points=[];railDraft.link=null;railDraft.oldCost=0;}try{field.releasePointerCapture(e.pointerId);}catch(_){}syncRailPanel();},true);
  field.addEventListener('pointercancel',e=>{if(beltPointer!==e.pointerId)return;beltPointer=null;if(railDraft)railDraft.points=[];syncRailPanel();},true);
  window.addEventListener('keydown',e=>{if(!railDraft)return;if(e.key==='Escape')stopRails();if(e.key==='Backspace'){e.preventDefault();undoBelt();}});window.addEventListener('blur',()=>{beltPointer=null;if(railDraft)railDraft.points=[];});window.addEventListener('pagehide',stopRails);
 }

 function openWorkshop(tab){if(tab==='rails'||tab==='growth')activeTab=tab;

  if(!booted)boot();const s=state();if(!s)return false;
  makeWorkshop();workshopMessage='';setText(workshopStatus,'');syncWorkshop(s);
  window.Rework?.openPanel('campWorkshop');if(activeTab==='growth'){const id=nextProject()?.id,target=id?overlay.querySelector('[data-camp-project="'+id+'"]'):null;if(target)requestAnimationFrame(()=>target.scrollIntoView?.({block:'nearest',behavior:'instant'}));}return true;
 }

 function send(s,drop,count,mode,node){
  const index=s.factory.drops.indexOf(drop);if(index<0||!Number.isFinite(count)||count<=0)return false;
  count=Math.min(count,drop.count);if(!(count>0))return false;
  const from=mode==='rail'?{x:node.x,y:node.y+12}:{x:drop.x,y:drop.y},link=mode==='rail'?s.camp.links.find(l=>keyEqual(l.nodeKey,node.key)):null,path=link?.points?.length>1?link.points.map(p=>({...p})):null;
  s.camp.cargo.push({key:s.camp.nextKey++,type:drop.type,count,from,progress:0,duration:mode==='rail'?.6+(path?RailCore.length(path):Math.hypot(from.x-HOME.x,from.y-HOME.y))/(120*Math.max(1,skillEffects().cartSpeed||1)):.6,...(path?{path}:{}),worker:drop.worker===true,source:drop.source??node?.key??null,mode});
  if(count>=drop.count)s.factory.drops.splice(index,1);else drop.count-=count;
  return true;
 }
 // A click never transports supplies: manual delivery requires a complete drag.
 function pickup(){statusKey='clickPile';statusUntil=visualTime+2;syncDOM();return false;}
 function houseContains(point){return !!point&&Math.abs(point.x-HOME.x)<=58&&point.y>=HOME.y-94&&point.y<=HOME.y+15;}
 function dragTarget(e){
  // Accept the pictured building, not the inventory panel or another UI control.
  const target=document.elementFromPoint(e.clientX,e.clientY);return !target?.closest?.('button,input,select,#campWarehouse,#raidBoard,#campaignGoal')&&houseContains(ArmyView.point(e.clientX,e.clientY));
 }
 function refreshDrag(e){
  if(!drag)return;drag.x=e.clientX;drag.y=e.clientY;drag.over=dragTarget(e);
  if(!drag.over&&drag.items.length<handCapacity()){const extra=window.SupplyFactory?.pileAt(ArmyView.point(e.clientX,e.clientY));if(extra&&!heldDrop(extra)){drag.items.push({drop:extra,count:1});audio('pickup');}}
  dragGhost.innerHTML='<b>'+drag.items.length+' / '+handCapacity()+'</b>';
  dragGhost.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
  dragGhost.classList.toggle('can-deliver',drag.over);document.getElementById('field').classList.toggle('delivery-ready',drag.over);
 }
 function endDrag(e,cancel=false){
  if(!drag||e&&e.pointerId!==drag.pointerId)return;
  const held=drag,s=state(),allowed=!cancel&&!window.Rework?.paused&&s===held.state,ok=allowed&&dragTarget(e),point=allowed?ArmyView.point(e.clientX,e.clientY):null,belt=point?ConveyorCore.contact(s.camp.links,point,ConveyorCore.WIDTH):null,platform=point?ConveyorCore.platformAt(s.camp.platforms,point):null;
  drag=null;dragGhost?.remove();dragGhost=null;const field=document.getElementById('field');field?.classList.remove('dragging-supplies','delivery-ready');
  try{if(field?.hasPointerCapture(held.pointerId))field.releasePointerCapture(held.pointerId);}catch(_){}
  if(ok){
   const arrivals=[];for(const item of held.items){const drop=item.drop,count=Math.min(item.count,drop.count),index=s.factory.drops.indexOf(drop);if(count>0&&index>=0){if(count===drop.count)s.factory.drops.splice(index,1);else drop.count-=count;arrivals.push({type:drop.type,count,worker:drop.worker===true});}}receive(s,arrivals);
  }else if(allowed&&platform&&!belt){for(let i=0;i<held.items.length;i++){const d=held.items[i].drop;d.x=clamp(point.x+i*16,platform.x-platform.w/2+4,platform.x+platform.w/2-4);d.y=clamp(point.y,platform.y-platform.h/2+4,platform.y+platform.h/2-4);d.onConveyor=true;}persist();syncDOM();}else if(allowed&&belt){for(let i=0;i<held.items.length;i++){const drop=held.items[i].drop,p=ConveyorCore.at(belt.points,Math.max(0,belt.along+i*18));drop.x=p.x;drop.y=p.y;drop.onConveyor=true;}statusKey='inTransit';statusUntil=visualTime+2;persist();syncDOM();}else{statusKey='returned';statusUntil=visualTime+1.7;syncDOM();}
  window.SupplyFactory?.translate();
 }
 function installDrag(){
  if(dragInstalled)return;dragInstalled=true;const field=document.getElementById('field');
  field.addEventListener('pointerdown',e=>{
   if(railDraft||!booted||window.Rework?.paused||window.BattleControl?.placement||e.button!==0||e.isPrimary===false||e.target.closest('button,input,select,#campWarehouse')||!document.getElementById('titleScreen')?.classList.contains('hidden'))return;
   const s=state(),drop=window.SupplyFactory?.pileAt(ArmyView.point(e.clientX,e.clientY));if(!drop||drag)return;
   e.preventDefault();e.stopImmediatePropagation();
   const view=document.getElementById('battleWorld').getBoundingClientRect(),z=ArmyView.camera.scale;drag={drop,count:1,items:[{drop,count:1}],state:s,pointerId:e.pointerId,x:e.clientX,y:e.clientY,offset:{x:view.left+drop.x*z-e.clientX,y:view.top+drop.y*z-e.clientY},over:false};
   dragGhost=document.createElement('div');dragGhost.id='campDragGhost';dragGhost.setAttribute('aria-hidden','true');dragGhost.innerHTML='<b>1 / '+handCapacity()+'</b>';document.body.append(dragGhost);
   field.classList.add('dragging-supplies');try{field.setPointerCapture(e.pointerId);}catch(_){}
   refreshDrag(e);statusKey='dragging';statusUntil=visualTime+3600;syncDOM();
  },true);
  field.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();e.stopImmediatePropagation();refreshDrag(e);}},true);
  field.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();e.stopImmediatePropagation();endDrag(e);}},true);
  field.addEventListener('pointercancel',e=>endDrag(e,true),true);
  field.addEventListener('lostpointercapture',e=>endDrag(e,true),true);
  window.addEventListener('blur',()=>endDrag(null,true));window.addEventListener('pagehide',()=>endDrag(null,true));
  window.addEventListener('keydown',e=>{if(e.key==='Escape')endDrag(null,true);});
 }

 function dispatch(s,dt=0){
  let moved=false;const arrivals=[],speed=ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*(s.camp.cart?1.25:1),occupied=[];
  for(const drop of s.factory.drops.slice().filter(d=>!heldDrop(d)&&!window.SupplyFactory?.isAirborne?.(d))){const next=ConveyorCore.step(s.camp.links,s.camp.platforms,drop,dt,speed);if(!next.onConveyor)continue;drop.onConveyor=true;
   if(next.arrived){const index=s.factory.drops.indexOf(drop);if(index>=0){s.factory.drops.splice(index,1);arrivals.push({type:drop.type,count:drop.count,worker:drop.worker});}moved=true;continue;}
   if(!occupied.some(p=>Math.hypot(p.x-next.x,p.y-next.y)<13)){drop.x=next.x;drop.y=next.y;drop.beltId=next.beltId;drop.platformKey=next.platformKey;drop.conveyorBlocked=next.blocked;occupied.push(next);moved=true;}
  }
  receive(s,arrivals);return moved;
 }

 function receive(s,arrivals){
  if(!arrivals.length)return;
  const totals={wood:0,stone:0,gold:0};let first=false;
  for(const cargo of arrivals){
   if(!['wood','stone','gold'].includes(cargo.type)||!Number.isFinite(cargo.count)||cargo.count<=0)continue;
   totals[cargo.type]+=cargo.count;
   if(cargo.type==='gold'){if(typeof earnGold==='function')earnGold(cargo.count);else s.gold+=cargo.count;}
   else s.factory.inventory[cargo.type]=Math.min(1e9,(s.factory.inventory[cargo.type]||0)+cargo.count);
   s.factory.delivered=(s.factory.delivered||0)+cargo.count;
   if(cargo.worker&&cargo.type==='wood'&&!s.firstWorkerPickup){s.firstWorkerPickup=true;first=true;}
  }
  for(const type of ['wood','stone','gold'])if(totals[type])notices.push({type,count:totals[type],age:0});
  notices=notices.slice(-4);houseFlash=.42;warehouse?.classList.add('camp-received');
  statusKey='arrived';statusUntil=visualTime+1.7;audio('pickup');
  if(first){if(typeof renderCards==='function')renderCards();window.Rework?.revealAllies?.('arch');}
  if(typeof updateHud==='function')updateHud();window.SupplyFactory?.translate();syncDOM();persist();
 }
 function tick(dt){
  if(!booted||!Number.isFinite(dt)||dt<=0)return;
  const s=state();if(!s)return;if(railDraft&&railDraft.owner!==s)stopRails();visualTime+=dt;
  notices.forEach(n=>n.age+=dt);notices=notices.filter(n=>n.age<1.1);
  houseFlash=Math.max(0,houseFlash-dt);if(!houseFlash)warehouse?.classList.remove('camp-received');
  const arrivals=[],remaining=[];
  for(const cargo of s.camp.cargo){
   cargo.progress=Math.min(1,(Number(cargo.progress)||0)+dt/Math.max(.1,Number(cargo.duration)||.6));
   if(cargo.progress>=1)arrivals.push(cargo);else remaining.push(cargo);
  }
  s.camp.cargo=remaining;receive(s,arrivals);
  const dispatched=dispatch(s,dt);railClock+=dt;if(dispatched&&railClock>=1){railClock=0;persist();}
  uiClock+=dt;if(uiClock>=.25){uiClock=0;syncDOM();}
 }

 function railSegment(ctx,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1)return;const nx=-dy/len,ny=dx/len;ctx.lineCap='butt';ctx.strokeStyle='#252e2c';ctx.lineWidth=29;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#778b80';ctx.lineWidth=25;ctx.stroke();ctx.strokeStyle='#344c40';ctx.lineWidth=19;ctx.stroke();
  const phase=(visualTime*ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*(state().camp.cart?1.25:1))%10;ctx.strokeStyle='#849879';ctx.lineWidth=2;for(let t=-phase;t<len;t+=10){if(t<0)continue;const x=a.x+dx*t/len,y=a.y+dy*t/len;ctx.beginPath();ctx.moveTo(x-nx*9,y-ny*9);ctx.lineTo(x+nx*9,y+ny*9);ctx.stroke();}
  for(let t=Math.min(10,len/2);t<len;t+=60){const x=a.x+dx*t/len,y=a.y+dy*t/len;ctx.strokeStyle='#f3d17a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+dx/len*5+nx*5,y+dy/len*5+ny*5);ctx.lineTo(x-dx/len*3,y-dy/len*3);ctx.lineTo(x+dx/len*5-nx*5,y+dy/len*5-ny*5);ctx.stroke();}
 }
 function drawPlatform(ctx,p,preview=false){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=preview?(p.invalid?'#995d4b99':'#62775299'):'#61775c';ctx.strokeStyle='#b9c69e';ctx.lineWidth=3;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.strokeRect(-p.w/2,-p.h/2,p.w,p.h);ctx.strokeStyle='#40583f';ctx.lineWidth=4;const horizontal=(p.dir||0)%2===0,phase=((p.dir||0)>=2?-1:1)*(visualTime*ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*(state().camp.cart?1.25:1))%12;for(let t=-48-phase;t<48;t+=12){ctx.beginPath();if(horizontal){ctx.moveTo(t,-p.h/2+3);ctx.lineTo(t,p.h/2-3);}else{ctx.moveTo(-p.w/2+3,t);ctx.lineTo(p.w/2-3,t);}ctx.stroke();}ctx.rotate((p.dir||0)*Math.PI/2);ctx.fillStyle='#ffe295';ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-7,-12);ctx.lineTo(-7,-5);ctx.lineTo(17,-5);ctx.lineTo(17,5);ctx.lineTo(-7,5);ctx.lineTo(-7,12);ctx.closePath();ctx.fill();ctx.restore();const out=ConveyorCore.outlet(p);const ready=ConveyorCore.downstream(state().camp.links,out,null,ConveyorCore.WIDTH/2+1);ctx.strokeStyle=ready?'#bfe69b':'#e8a76b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(out.x,out.y,7,0,Math.PI*2);ctx.stroke();if(!ready){ctx.fillStyle='#e8a76b';ctx.fillRect(out.x-4,out.y-5,3,10);ctx.fillRect(out.x+2,out.y-5,3,10);}}
 function drawUnder(ctx,{ox,oy,z}){
  if(!booted)return;const s=state();if(!s)return;ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);
  for(const link of s.camp.links){const node=s.factory.nodes.find(n=>keyEqual(n.key,link.nodeKey)),points=link.points?.length>1?ConveyorCore.oriented(link):node?[HOME,{x:node.x,y:node.y+12}]:null;if(!points)continue;if(!link.points)link.points=points;for(let i=1;i<points.length;i++)railSegment(ctx,points[i-1],points[i]);const end=points[0],connected=ConveyorCore.distance(end,HOME)<60||!!ConveyorCore.downstream(s.camp.links,end,link)||!!ConveyorCore.platformAt(s.camp.platforms,end);if(!connected){ctx.fillStyle='#dc9c64';ctx.strokeStyle='#3b302a';ctx.lineWidth=2;ctx.fillRect(end.x-7,end.y-7,14,14);ctx.strokeRect(end.x-7,end.y-7,14,14);ctx.fillStyle='#513a2b';ctx.fillRect(end.x-3,end.y-4,2,8);ctx.fillRect(end.x+2,end.y-4,2,8);}}
  for(const platform of s.camp.platforms)drawPlatform(ctx,platform);if(platformMode&&platformPreview)drawPlatform(ctx,{...platformPreview,w:96,h:64,dir:platformDir,invalid:s.factory.inventory.wood<8||s.factory.inventory.stone<4||!platformFits(platformPreview)},true);drawProjects(ctx,s);if(railDraft){if(railDraft.points.length>1){ctx.globalAlpha=.7;for(let i=1;i<railDraft.points.length;i++)railSegment(ctx,railDraft.points[i-1],railDraft.points[i]);ctx.globalAlpha=1;if(Math.max(1,ConveyorCore.cost(railDraft.points)-(railDraft.oldCost||0))>s.factory.inventory.wood){ctx.strokeStyle='#ec9b80';ctx.lineWidth=5;ctx.setLineDash([6,5]);ctx.beginPath();railDraft.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}}}
  ctx.restore();
 }

 function cargoArt(ctx,cargo,x,y,z){window.SupplyFactory?.drawItem?.(ctx,cargo.type,x,y,Math.max(20*z,10));}

 function positionWarehouse({ox,oy,z}){
  if(!warehouse)return;const field=document.getElementById('field'),canvas=document.getElementById('armyCanvas');if(!field||!canvas)return;
  const rect=field.getBoundingClientRect(),view=canvas.getBoundingClientRect(),w=warehouse.offsetWidth,h=warehouse.offsetHeight;
  const x=clamp(view.left-rect.left+ox+HOME.x*z-w*.5,8,rect.width-w-8);
  const y=clamp(view.top-rect.top+oy+HOME.y*z+12,8,rect.height-h-8);
  const value=Math.round(x)+'px,'+Math.round(y)+'px';if(value!==positionKey){positionKey=value;warehouse.style.transform='translate('+value+')';}
 }
 function drawOver(ctx,view){
  if(!booted)return;const s=state();if(!s)return;const {ox,oy,z}=view;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  ctx.save();
  for(const cargo of s.camp.cargo){
   const t=clamp(cargo.progress||0,0,1),onRail=railCargo(cargo),ease=onRail?t:1-Math.pow(1-t,2);
   const p=onRail&&cargo.path?.length>1?RailCore.at(cargo.path,t):{x:cargo.from.x+(HOME.x-cargo.from.x)*ease,y:cargo.from.y+(HOME.y-cargo.from.y)*ease},x=p.x,y=p.y;
   cargoArt(ctx,cargo,ox+x*z,oy+y*z-(onRail||reduced?0:Math.sin(t*Math.PI)*14*z),z);
  }
  if(railDraft&&!platformMode){const handles=[BELT_PORT,...s.camp.links.filter(l=>l.points?.length).map(l=>ConveyorCore.oriented(l).at(-1))];for(const p of handles){const x=ox+p.x*z,y=oy+p.y*z,r=Math.max(15,24*z);ctx.fillStyle='#45623bea';ctx.strokeStyle='#ffe9a2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff1b0';ctx.font='bold '+Math.max(19,23*z)+'px system-ui';ctx.textAlign='center';ctx.fillText('↔',x,y+7);}}
  if(drag){const rect=document.getElementById('armyCanvas').getBoundingClientRect();for(let i=0;i<drag.items.length;i++){const item=drag.items[i],geometry=window.SupplyFactory?.itemGeometry?.(item.drop),h=geometry?.h||Math.max(20*z,10);window.SupplyFactory?.drawItem?.(ctx,item.drop.type,drag.x-rect.left+(drag.offset?.x||0)+i*(h+3),drag.y-rect.top+(drag.offset?.y||0),h);}}
  if(drag){ctx.strokeStyle=drag.over?'#fff2a6':'#e6ce82';ctx.fillStyle=drag.over?'#efd77b35':'#efd77b12';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.roundRect(ox+(HOME.x-57)*z,oy+(HOME.y-94)*z,114*z,109*z,8);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0b0';ctx.fillText(tr('beltFeed'),ox+HOME.x*z,oy+(HOME.y-104)*z);}
  if(houseFlash){ctx.fillStyle='#f8d77a'+Math.round(houseFlash/.42*100).toString(16).padStart(2,'0');ctx.beginPath();ctx.ellipse(ox+HOME.x*z,oy+(HOME.y-4)*z,26*z,10*z,0,0,Math.PI*2);ctx.fill();}
  notices.forEach((n,i)=>{
   ctx.globalAlpha=Math.min(1,(1.1-n.age)*3);ctx.font='800 '+Math.max(12,14*z)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#25362b';ctx.fillStyle='#ffe7a0';
   const text='+'+format(n.count)+' '+(n.type==='gold'?'G':tr(n.type)),x=ox+HOME.x*z,y=oy+(HOME.y-95)*z-(reduced?0:n.age*17)-i*18;
   ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
  });
  ctx.restore();positionWarehouse(view);
 }
 function hitHouse(point){
  if(railDraft)return true;
  if(!booted||!point)return false;
  const hit=Math.abs(point.x-HOME.x)<=58&&point.y>=HOME.y-94&&point.y<=HOME.y+15;
  if(hit)openWorkshop();return hit;
 }
 function boot(){
  const s=state();if(!s)return false;booted=true;document.body.classList.add('outpost-game');makeDOM();makeWorkshop();installDrag();installRails();syncDOM();return true;
 }
 function guide(){
  const s=state();if(!s)return '';
  if(railDraft)return tr(platformMode?'platformHint':'freeBeltHint');
  if(!s.camp.links.length&&s.factory.inventory.wood>=1)return tr('firstRail');
  if(s.camp.links.length)return tr('bothRails');
  if(railExists('wood')&&railExists('stone'))return tr('bothRails');
  return drag?tr('beltFeed'):s.camp.cargo.length?tr('inTransit'):tr('clickPile');
 }
 return {boot,tick,quote,build,isTransported:d=>d.onConveyor===true||!!ConveyorCore.contact(state().camp.links,d)||!!ConveyorCore.platformAt(state().camp.platforms,d),onBelt:d=>!!ConveyorCore.contact(state().camp.links,d)||!!ConveyorCore.platformAt(state().camp.platforms,d),beltAt:p=>ConveyorCore.contact(state().camp.links,p),platformAt:p=>ConveyorCore.platformAt(state().camp.platforms,p),prepareForRaid:()=>{},beginRail:buildRail,buildPlatform,commitRails,cancelRails:stopRails,removeRail,get layingRails(){return !!railDraft;},get draftRoute(){return railDraft?{points:railDraft.points.map(p=>({...p})),cost:railDraft.points.length>1?ConveyorCore.cost(railDraft.points):0}:null;},get dragging(){return !!drag;},isHeld:heldDrop,canBuild,canStartWave,get tools(){return {...state().camp.tools};},get campaignReadyWave(){const c=state().camp;return !c.tools.wood&&!c.tools.stone?3:!c.gate?6:!c.beacon?8:9;},get nextProject(){return nextProject();},drawUnder,drawOver,pickup,openWorkshop,hitHouse,get ready(){return booted;},get hasWoodRail(){return railExists('wood');},get hasStoneRail(){return railExists('stone');},get guide(){return guide();}};
})();
