/* Supplies become spendable only when their visible cargo reaches the house. */
window.OutpostCamp = (() => {
 'use strict';
 const WORLD = {width:960,height:540}, HOME = {x:100,y:340};
 const COST = {wood:32,stone:40};
 const words = {
  warehouse:['おうち','Warehouse','仓库'],workshop:['つくる','Workshop','工坊'],close:['とじる','Close','关闭'],
  wood:['き','Wood','木材'],stone:['いし','Stone','石材'],gold:['おかね','Gold','金币'],
  title:['なかまの しごとば','The camp workshop','营地工坊'],
  intro:['レールで はこぶ。どうぐで はやく。おうちを おおきくしよう。','Connect rails, improve tools, and build the way to town.','连接轨道、升级工具，建设通往城镇的道路。'],
  rail:['レール','Wooden rail','木轨道'],build:['ここを つなぐ','Connect this route','连接这条路线'],
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
  firstRail:['はじめの ごほうびで レール！ ひろう しごとを まかせよう。','Spend the first bounty on a wood rail to automate pickup.','用首次奖励修建木轨道，自动回收物资。'],
  stoneNext:['つぎは いしの ばしょも おうちへ つなごう。','Connect a stone worksite next.','接下来连接采石点。'],
  bothRails:['きと いしが じどうで とどく。なかまを ふやそう！','Wood and stone arrive automatically. Place allies to defend the camp.','木材和石材自动送达，布置伙伴守卫营地。']
 };
 const projectWords={rails:['レール','Rails','轨道'],growth:['どうぐ・おうち','Tools / home','工具·营地'],woodTool:['きこりの どうぐ','Lumberjack tools','伐木工具'],stoneTool:['いしほりの どうぐ','Mining tools','采矿工具'],cart:['おおきな にぐるま','Larger carts','大货车'],gate:['みはりの もん','Watch gate','守望门'],beacon:['まちへの あかり','Town beacon','城镇灯塔'],made:['できた！','Built!','已建成！'],make:['つくる','Build','建造'],locked:['まずは ここまで まもろう','Defend up to this raid first','先守住这一波'],rank:['だんかい','Level','阶段'],materials:['つかうもの','Materials','材料'],faster:['ひとりで はやく はたらける！','Each worker gathers faster.','每位工人采集更快。'],cartEffect:['いちどに 8こ はこべる！','Carry 8 per trip instead of 4.','每趟运送8份，原为4份。'],gateEffect:['おうちの まえで 2.5びょう まにあう！','A 2.5-second rescue window at the house.','房屋前有2.5秒的救援时间。'],beaconEffect:['まちへの みちを ひらく あかり。さいごの むれを まもろう！','Light the way to town, then defend the final raid.','点亮通往城镇的道路，守住最终袭击。'],projectDone:['できた！ なかまの しごとを みてみよう。','Built! Watch your camp work.','建好了！看看营地的变化。']};
 let drag=null,dragGhost=null,dragInstalled=false;
 let activeTab='rails',workshopMessage='';
 let booted=false,activeCamp=null,railClock=0,uiClock=0,houseFlash=0;
 let warehouse=null,overlay=null,goldLabel=null,deliveryLabel=null,workshopStatus=null;
 let statusKey='clickPile',statusUntil=0,visualTime=0,positionKey='',languageKey='',notices=[];
 const language=()=>typeof LANG==='string'?LANG:'ja';
 const tr=key=>(words[key]||projectWords[key])[Math.max(0,['ja','en','zh'].indexOf(language()))];
 const format=n=>typeof fmt==='function'?fmt(n):String(Math.floor(n));
 const current=()=>typeof S==='undefined'?null:S;
 const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 const persist=()=>{if(typeof save==='function')save();};
 const audio=event=>window.ForestAudio?.play(event);
 const clamp=(n,min,max)=>Math.max(min,Math.min(Math.max(min,max),n));
 const keyEqual=(a,b)=>String(a)===String(b);
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
  s.camp.tools??={wood:0,stone:0};for(const type of ['wood','stone'])s.camp.tools[type]=Math.max(0,Math.min(2,Math.floor(Number(s.camp.tools[type])||0)));for(const flag of ['gate','beacon','cart','endingSeen'])s.camp[flag]=s.camp[flag]===true;
  if(activeCamp!==s.camp){
   activeCamp=s.camp;railClock=0;uiClock=0;houseFlash=0;notices=[];
   statusKey='clickPile';statusUntil=0;languageKey='';
  }
  return s;
 }
 const linked=(s,node)=>s.camp.links.some(link=>keyEqual(link.nodeKey,node.key));
 const railExists=type=>{const s=state();return !!s?.camp.links.some(link=>link.type===type);};
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
   const button=e.target.closest('[data-camp-build]');if(button&&!button.disabled)buildRail(button.dataset.campBuild);
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
   const card=overlay.querySelector('[data-camp-option="'+type+'"]'),node=nextNode(s,type),count=s.camp.links.filter(link=>link.type===type).length;
   const button=card.querySelector('button'),enough=s.gold>=COST[type];
   setText(card.querySelector('h3'),tr(type)+' · '+tr('rail'));
   setText(card.querySelector('.camp-rail-count'),count?tr('connected')+' '+count:'');
   setText(card.querySelector('.camp-route-origin'),node?siteName(s,node):tr(type==='wood'?'woodSite':'stoneSite'));
   setText(card.querySelector('.camp-route-home'),tr('warehouse'));
   setText(card.querySelector('.camp-rail-rate'),language()==='ja'?'2びょうごとに '+(s.camp.cart?8:4)+'こずつ はこぶ':language()==='zh'?'每2秒运送'+(s.camp.cart?8:4)+'份物资。':'Carries '+(s.camp.cart?8:4)+' every 2 seconds.');
   const people=node?workersAt(node):0;
   setText(card.querySelector('.camp-rail-workers'),node?(people?tr('worker')+' '+people+tr('people'):tr('noWorker')):tr('automated'));
   setText(button.querySelector('span'),!node?tr('complete'):tr(count?'extend':'build'));
   setText(button.querySelector('strong'),node?COST[type]+' G':'✓');
   setText(card.querySelector('.camp-rail-afford'),node&&!enough?tr('needed')+' '+format(COST[type]-s.gold)+' G':'');
   button.disabled=!node||!enough;card.classList.toggle('is-connected',!node);
   const hasWood=s.camp.links.some(link=>link.type==='wood'),hasStone=s.camp.links.some(link=>link.type==='stone');
   card.classList.toggle('camp-next-route',!!node&&(type==='wood'&&!hasWood||type==='stone'&&hasWood&&!hasStone));
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
   setText(goldLabel,format(s.gold)+' G');
   const hasCargo=s.camp.cargo.length>0;
   setText(deliveryLabel,statusUntil>visualTime?tr(statusKey):tr(hasCargo?'inTransit':'tapHome'));
  }
  if(overlay?.classList.contains('on'))syncWorkshop(s);
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
  const paths={woodTool:'<path d="M9 28L22 5" stroke="#805b36" stroke-width="4"/><path d="M21 4L29 9L24 17L17 12Z" fill="#b8c7b4"/>',stoneTool:'<path d="M9 28L21 6" stroke="#805b36" stroke-width="4"/><path d="M10 11Q22 2 29 15" fill="none" stroke="#b8c7b4" stroke-width="5"/>',cart:'<path d="M4 12H28L25 23H7Z" fill="#97723f"/><path d="M4 10H28M8 12V22M16 12V22M24 12V22" stroke="#d4b272"/><circle cx="9" cy="26" r="3" fill="#b7c6ad"/><circle cx="23" cy="26" r="3" fill="#b7c6ad"/>',gate:'<path d="M5 29V9H10V29M22 29V9H27V29M5 10V5H27V10M10 16H22" fill="#89643b" stroke="#d4b272" stroke-width="2"/><path d="M14 15L17 20L20 15" fill="#779665"/>',beacon:'<path d="M11 29L13 15H21L23 29Z" fill="#9a9d7e"/><path d="M12 15V8H22V15Z" fill="#e3c773" stroke="#d5dfa0"/><path d="M10 8L17 3L24 8Z" fill="#886840"/><path d="M3 11H8M26 11H31M8 2L11 5M26 2L23 5" stroke="#eed38a" stroke-width="2"/>'};
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

 function buildRail(type){
  const s=state();if(!s||!Object.hasOwn(COST,type))return false;
  const node=nextNode(s,type);if(!node||linked(s,node)||s.gold<COST[type])return false;
  s.gold-=COST[type];s.camp.links.push({nodeKey:node.key,type});
  workshopMessage='linked';setText(workshopStatus,tr(workshopMessage));audio('place');
  if(typeof updateHud==='function')updateHud();persist();syncDOM();syncWorkshop(s);return true;
 }
 function openWorkshop(tab){if(tab==='rails'||tab==='growth')activeTab=tab;

  if(!booted)boot();const s=state();if(!s)return false;
  makeWorkshop();workshopMessage='';setText(workshopStatus,'');syncWorkshop(s);
  window.Rework?.openPanel('campWorkshop');if(activeTab==='growth'){const id=nextProject()?.id,target=id?overlay.querySelector('[data-camp-project="'+id+'"]'):null;if(target)requestAnimationFrame(()=>target.scrollIntoView?.({block:'nearest',behavior:'instant'}));}return true;
 }

 function send(s,drop,count,mode,node){
  const index=s.factory.drops.indexOf(drop);if(index<0||!Number.isFinite(count)||count<=0)return false;
  count=Math.min(count,drop.count);if(!(count>0))return false;
  const from=mode==='rail'?{x:node.x,y:node.y+8}:{x:drop.x,y:drop.y};
  s.camp.cargo.push({key:s.camp.nextKey++,type:drop.type,count,from,progress:0,duration:mode==='rail'?1.2+Math.hypot(from.x-HOME.x,from.y-HOME.y)/300:.6,worker:drop.worker===true,source:drop.source??node?.key??null,mode});
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
  dragGhost.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
  dragGhost.classList.toggle('can-deliver',drag.over);document.getElementById('field').classList.toggle('delivery-ready',drag.over);
 }
 function endDrag(e,cancel=false){
  if(!drag||e&&e.pointerId!==drag.pointerId)return;
  const held=drag,s=state(),ok=!cancel&&!window.Rework?.paused&&dragTarget(e)&&s===held.state&&s.factory.drops.includes(held.drop);
  drag=null;dragGhost?.remove();dragGhost=null;const field=document.getElementById('field');field?.classList.remove('dragging-supplies','delivery-ready');
  try{if(field?.hasPointerCapture(held.pointerId))field.releasePointerCapture(held.pointerId);}catch(_){}
  if(ok){
   const count=Math.min(held.count,held.drop.count),index=s.factory.drops.indexOf(held.drop);
   if(count>0&&index>=0){if(count===held.drop.count)s.factory.drops.splice(index,1);else held.drop.count-=count;receive(s,[{type:held.drop.type,count,worker:held.drop.worker===true}]);}
  }else{statusKey='returned';statusUntil=visualTime+1.7;syncDOM();}
  window.SupplyFactory?.translate();
 }
 function installDrag(){
  if(dragInstalled)return;dragInstalled=true;const field=document.getElementById('field');
  field.addEventListener('pointerdown',e=>{
   if(!booted||window.Rework?.paused||window.BattleControl?.placement||e.button!==0||e.isPrimary===false||e.target.closest('button,input,select,#campWarehouse')||!document.getElementById('titleScreen')?.classList.contains('hidden'))return;
   const s=state(),drop=window.SupplyFactory?.pileAt(ArmyView.point(e.clientX,e.clientY));if(!drop||drag)return;
   e.preventDefault();e.stopImmediatePropagation();
   drag={drop,count:drop.count,state:s,pointerId:e.pointerId,x:e.clientX,y:e.clientY,over:false};
   dragGhost=document.createElement('div');dragGhost.id='campDragGhost';dragGhost.setAttribute('aria-hidden','true');dragGhost.innerHTML=(window.SupplyFactory?.icon(drop.type)||'')+'<b>×'+format(drag.count)+'</b>';document.body.append(dragGhost);
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

 function dispatch(s){
  let moved=false;
  for(const link of s.camp.links){
   const node=s.factory.nodes.find(n=>keyEqual(n.key,link.nodeKey));if(!node)continue;
   let capacity=s.camp.cart?8:4;
   const drops=s.factory.drops.filter(d=>d!==drag?.drop&&d.type===link.type&&(d.source!=null?keyEqual(d.source,node.key):Math.hypot(d.x-node.x,d.y-node.y)<=150));
   drops.sort((a,b)=>Math.hypot(a.x-node.x,a.y-node.y)-Math.hypot(b.x-node.x,b.y-node.y));
   for(const drop of drops){if(!capacity)break;const count=Math.min(capacity,drop.count);if(send(s,drop,count,'rail',node)){capacity-=count;moved=true;}}
  }
  return moved;
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
  const s=state();if(!s)return;visualTime+=dt;
  notices.forEach(n=>n.age+=dt);notices=notices.filter(n=>n.age<1.1);
  houseFlash=Math.max(0,houseFlash-dt);if(!houseFlash)warehouse?.classList.remove('camp-received');
  const arrivals=[],remaining=[];
  for(const cargo of s.camp.cargo){
   cargo.progress=Math.min(1,(Number(cargo.progress)||0)+dt/Math.max(.1,Number(cargo.duration)||.6));
   if(cargo.progress>=1)arrivals.push(cargo);else remaining.push(cargo);
  }
  s.camp.cargo=remaining;receive(s,arrivals);
  railClock+=dt;let dispatched=false;
  while(railClock>=2){railClock-=2;dispatched=dispatch(s)||dispatched;}
  if(dispatched){window.SupplyFactory?.translate();persist();}
  uiClock+=dt;if(uiClock>=.25){uiClock=0;syncDOM();}
 }

 function rail(ctx,node){
  const ax=HOME.x,ay=HOME.y,bx=node.x,by=node.y+8,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  ctx.lineCap='round';ctx.strokeStyle='#493b2d';ctx.lineWidth=7;
  for(let t=14;t<length-7;t+=15){const x=ax+dx*t/length,y=ay+dy*t/length;ctx.beginPath();ctx.moveTo(x-nx*9,y-ny*9);ctx.lineTo(x+nx*9,y+ny*9);ctx.stroke();}
  for(const offset of [-5,5]){
   ctx.strokeStyle='#302c23';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ax+nx*offset,ay+ny*offset);ctx.lineTo(bx+nx*offset,by+ny*offset);ctx.stroke();
   ctx.strokeStyle='#b69b65';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(ax+nx*offset,ay+ny*offset-1);ctx.lineTo(bx+nx*offset,by+ny*offset-1);ctx.stroke();
  }
  ctx.fillStyle='#8e7346';ctx.strokeStyle='#3e3427';ctx.lineWidth=1;ctx.fillRect(bx-11,by-4,22,8);ctx.strokeRect(bx-11,by-4,22,8);
 }
 function drawUnder(ctx,{ox,oy,z}){
  if(!booted)return;const s=state();if(!s)return;
  ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);
  for(const link of s.camp.links){const node=s.factory.nodes.find(n=>keyEqual(n.key,link.nodeKey));if(node)rail(ctx,node);}
  drawProjects(ctx,s);
  ctx.restore();
 }
 function cargoArt(ctx,cargo,x,y,z){
  const scale=Math.max(.65,z),cart=railCargo(cargo);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.fillStyle='#17241d44';ctx.beginPath();ctx.ellipse(0,3,cart?12:9,4,0,0,Math.PI*2);ctx.fill();
  if(cart){ctx.fillStyle='#443525';ctx.fillRect(-12,-4,24,7);ctx.strokeStyle='#c5a56c';ctx.lineWidth=1;ctx.strokeRect(-12,-4,24,7);ctx.fillStyle='#262b24';ctx.beginPath();ctx.arc(-7,4,3,0,Math.PI*2);ctx.arc(7,4,3,0,Math.PI*2);ctx.fill();}
  ctx.lineWidth=1;ctx.strokeStyle='#4c3b24';
  if(cargo.type==='wood'){
   for(const [px,py]of [[-7,-10],[1,-10],[-3,-16]]){ctx.fillStyle='#9d6433';ctx.fillRect(px,py,7,8);ctx.strokeRect(px,py,7,8);ctx.fillStyle='#d9ad62';ctx.beginPath();ctx.ellipse(px+3.5,py,3.5,2,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  }else if(cargo.type==='stone'){
   ctx.fillStyle='#969a8c';ctx.strokeStyle='#454d47';ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(-7,-14);ctx.lineTo(0,-18);ctx.lineTo(8,-12);ctx.lineTo(10,-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#c7c9b5';ctx.beginPath();ctx.moveTo(-5,-13);ctx.lineTo(0,-16);ctx.lineTo(3,-11);ctx.stroke();
  }else{ctx.fillStyle='#d6b35b';ctx.fillRect(-7,-15,14,10);}
  ctx.restore();
 }
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
   const x=cargo.from.x+(HOME.x-cargo.from.x)*ease,y=cargo.from.y+(HOME.y-cargo.from.y)*ease;
   cargoArt(ctx,cargo,ox+x*z,oy+y*z-(onRail||reduced?0:Math.sin(t*Math.PI)*14*z),z);
  }
  if(drag){ctx.strokeStyle=drag.over?'#fff2a6':'#e6ce82';ctx.fillStyle=drag.over?'#efd77b35':'#efd77b12';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.roundRect(ox+(HOME.x-57)*z,oy+(HOME.y-94)*z,114*z,109*z,8);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0b0';ctx.fillText(tr('dragging'),ox+HOME.x*z,oy+(HOME.y-104)*z);}
  if(houseFlash){ctx.fillStyle='#f8d77a'+Math.round(houseFlash/.42*100).toString(16).padStart(2,'0');ctx.beginPath();ctx.ellipse(ox+HOME.x*z,oy+(HOME.y-4)*z,26*z,10*z,0,0,Math.PI*2);ctx.fill();}
  notices.forEach((n,i)=>{
   ctx.globalAlpha=Math.min(1,(1.1-n.age)*3);ctx.font='800 '+Math.max(12,14*z)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#25362b';ctx.fillStyle='#ffe7a0';
   const text='+'+format(n.count)+' '+(n.type==='gold'?'G':tr(n.type)),x=ox+HOME.x*z,y=oy+(HOME.y-95)*z-(reduced?0:n.age*17)-i*18;
   ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
  });
  ctx.restore();positionWarehouse(view);
 }
 function hitHouse(point){
  if(!booted||!point)return false;
  const hit=Math.abs(point.x-HOME.x)<=58&&point.y>=HOME.y-94&&point.y<=HOME.y+15;
  if(hit)openWorkshop();return hit;
 }
 function boot(){
  const s=state();if(!s)return false;booted=true;document.body.classList.add('outpost-game');makeDOM();makeWorkshop();installDrag();syncDOM();return true;
 }
 function guide(){
  const s=state();if(!s)return '';
  if(!railExists('wood')&&(s.gold>=COST.wood||s.clearedBossWave>0))return tr('firstRail');
  if(railExists('wood')&&!railExists('stone'))return tr('stoneNext');
  if(railExists('wood')&&railExists('stone'))return tr('bothRails');
  return drag?tr('dragging'):s.camp.cargo.length?tr('inTransit'):tr('clickPile');
 }
 return {boot,tick,quote,build,get dragging(){return !!drag;},isHeld:drop=>drag?.drop===drop,canBuild,canStartWave,get tools(){return {...state().camp.tools};},get campaignReadyWave(){const c=state().camp;return !c.tools.wood&&!c.tools.stone?3:!c.gate?6:!c.beacon?8:9;},get nextProject(){return nextProject();},drawUnder,drawOver,pickup,openWorkshop,hitHouse,get ready(){return booted;},get hasWoodRail(){return railExists('wood');},get hasStoneRail(){return railExists('stone');},get guide(){return guide();}};
})();
