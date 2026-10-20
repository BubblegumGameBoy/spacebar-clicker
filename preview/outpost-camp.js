/* Supplies become spendable only when their visible cargo reaches the house. */
window.OutpostCamp = (() => {
 'use strict';
 const WORLD = {width:960,height:540}, HOME = {x:100,y:340};
 const COST = {wood:32,stone:40};
 const words = {
  warehouse:['倉庫','Warehouse','仓库'],workshop:['工房','Workshop','工坊'],close:['閉じる','Close','关闭'],
  wood:['木','Wood','木材'],stone:['石','Stone','石材'],gold:['資金','Gold','金币'],
  title:['拾う仕事を、レールへ。','Let the rails carry supplies.','让轨道运送物资。'],
  intro:['作業場と倉庫をつなぐと、落ちた資材が自動で届きます。','Connect a worksite to the warehouse. Fallen supplies travel home automatically.','连接采集点与仓库，让掉落物资自动运回。'],
  rail:['木製レール','Wooden rail','木轨道'],build:['この道をつなぐ','Connect this route','连接这条路线'],
  extend:['次の作業場へ延ばす','Connect another worksite','延伸至下个采集点'],
  complete:['すべて接続済み','All worksites connected','全部已连接'],
  woodSite:['木の作業場','Wood site','伐木点'],stoneSite:['石の作業場','Stone site','采石点'],
  carries:['2秒ごとに最大4個ずつ、倉庫へ運びます。','Carries up to 4 supplies every 2 seconds.','每2秒最多运送4份物资。'],
  available:['倉庫に着いた資材から使えます。','Supplies can be spent after they arrive home.','物资送达仓库后即可使用。'],
  worker:['近くで作業中','Workers nearby:','附近作业中'],people:['人','','人'],
  noWorker:['ここに仲間を置くと、採集から搬送まで任せられます。','Place a worker here to automate gathering and delivery.','在此布置采集伙伴，即可自动采集并运送。'],
  automated:['資材がレールで倉庫へ届きます。','Supplies travel to the warehouse by rail.','物资沿轨道送达仓库。'],
  needed:['あと','Need','还需'],connected:['接続済み','Connected','已连接'],
  linked:['倉庫へつながりました。荷物の到着を待とう。','Route connected. Watch the cargo travel home.','已连接仓库，等待货物送达。'],
  inTransit:['運んでいます','On the way','运送中'],arrived:['倉庫に届きました','Delivered home','已送达仓库'],
  tapHome:['家を押すと工房が開きます。','Tap the house to open the workshop.','点击房屋打开工坊。'],
  clickPile:['落ちた資材を押して、倉庫へ運ぼう。','Tap fallen supplies to send them home.','点击掉落物资，运回仓库。'],
  firstRail:['初回報酬で木製レール。拾う仕事を任せよう。','Spend the first bounty on a wood rail to automate pickup.','用首次奖励修建木轨道，自动回收物资。'],
  stoneNext:['次は石の作業場も、倉庫へつなごう。','Connect a stone worksite next.','接下来连接采石点。'],
  bothRails:['木と石が自動で届く。仲間を置いて拠点を守ろう。','Wood and stone arrive automatically. Place allies to defend the camp.','木材和石材自动送达，布置伙伴守卫营地。']
 };
 let booted=false,activeCamp=null,railClock=0,uiClock=0,houseFlash=0;
 let warehouse=null,overlay=null,goldLabel=null,deliveryLabel=null,workshopStatus=null;
 let statusKey='clickPile',statusUntil=0,visualTime=0,positionKey='',languageKey='',notices=[];
 const language=()=>typeof LANG==='string'?LANG:'ja';
 const tr=key=>words[key][Math.max(0,['ja','en','zh'].indexOf(language()))];
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
   s.camp={version:1,links:[],cargo:[],nextKey:1};
   s.factory.width=WORLD.width;s.factory.height=WORLD.height;s.factory.depot={...HOME};
   s.factory.nodes=[{key:1,type:'wood',x:280,y:300},{key:2,type:'wood',x:470,y:300},{key:3,type:'stone',x:330,y:395},{key:4,type:'stone',x:490,y:395}].map(n=>({...n,stock:300,radius:n.type==='wood'?16:19,regrow:0}));
   s.factory.next=Math.max(5,s.factory.next||1,...s.factory.drops.map(d=>(Number(d.key)||0)+1));
  }
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
  overlay.innerHTML='<section class="rx-dialog camp-workshop" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="campWorkshopTitle"><button type="button" class="rx-close"></button><span class="rx-kicker">CAMP WORKSHOP</span><h2 id="campWorkshopTitle"></h2><p class="camp-workshop-intro"></p><p class="camp-workshop-wallet"><span></span> <strong></strong></p><div class="camp-rail-options">'+['wood','stone'].map(type=>'<section class="camp-rail-option" data-camp-option="'+type+'"><div class="camp-rail-heading"><h3></h3><span class="camp-rail-count"></span></div><div class="camp-route"><b class="camp-route-origin"></b><span class="camp-route-track" aria-hidden="true"></span><b class="camp-route-home"></b></div><p class="camp-rail-rate"></p><p class="camp-rail-workers"></p><button type="button" data-camp-build="'+type+'"><span></span><strong></strong></button><small class="camp-rail-afford"></small></section>').join('')+'</div><p class="camp-workshop-status" role="status" aria-live="polite"></p><p class="camp-workshop-note"></p></section>';
  document.body.append(overlay);workshopStatus=overlay.querySelector('.camp-workshop-status');
  overlay.querySelector('.rx-close').onclick=()=>window.Rework?.close();
  overlay.addEventListener('click',e=>{
   if(e.target===overlay){window.Rework?.close();return;}
   const button=e.target.closest('[data-camp-build]');if(button&&!button.disabled)buildRail(button.dataset.campBuild);
  });
 }

 function syncWorkshop(s){
  if(!overlay)return;
  overlay.querySelector('.rx-close').setAttribute('aria-label',tr('close'));
  setText(overlay.querySelector('.rx-close'),'×');setText(overlay.querySelector('h2'),tr('title'));
  setText(overlay.querySelector('.camp-workshop-intro'),tr('intro'));
  setText(overlay.querySelector('.camp-workshop-wallet span'),tr('gold'));
  setText(overlay.querySelector('.camp-workshop-wallet strong'),format(s.gold)+' G');
  setText(overlay.querySelector('.camp-workshop-note'),tr('available'));
  for(const type of ['wood','stone']){
   const card=overlay.querySelector('[data-camp-option="'+type+'"]'),node=nextNode(s,type),count=s.camp.links.filter(link=>link.type===type).length;
   const button=card.querySelector('button'),enough=s.gold>=COST[type];
   setText(card.querySelector('h3'),tr(type)+' · '+tr('rail'));
   setText(card.querySelector('.camp-rail-count'),count?tr('connected')+' '+count:'');
   setText(card.querySelector('.camp-route-origin'),node?siteName(s,node):tr(type==='wood'?'woodSite':'stoneSite'));
   setText(card.querySelector('.camp-route-home'),tr('warehouse'));
   setText(card.querySelector('.camp-rail-rate'),tr('carries'));
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

 function buildRail(type){
  const s=state();if(!s||!Object.hasOwn(COST,type))return false;
  const node=nextNode(s,type);if(!node||linked(s,node)||s.gold<COST[type])return false;
  s.gold-=COST[type];s.camp.links.push({nodeKey:node.key,type});
  setText(workshopStatus,tr('linked'));audio('place');
  if(typeof updateHud==='function')updateHud();persist();syncDOM();syncWorkshop(s);return true;
 }
 function openWorkshop(){
  if(!booted)boot();const s=state();if(!s)return false;
  makeWorkshop();setText(workshopStatus,'');syncWorkshop(s);
  window.Rework?.openPanel('campWorkshop');return true;
 }

 function send(s,drop,count,mode,node){
  const index=s.factory.drops.indexOf(drop);if(index<0||!Number.isFinite(count)||count<=0)return false;
  count=Math.min(count,drop.count);if(!(count>0))return false;
  const from=mode==='rail'?{x:node.x,y:node.y+8}:{x:drop.x,y:drop.y};
  s.camp.cargo.push({key:s.camp.nextKey++,type:drop.type,count,from,progress:0,duration:mode==='rail'?1.2+Math.hypot(from.x-HOME.x,from.y-HOME.y)/300:.6,worker:drop.worker===true,source:drop.source??node?.key??null,mode});
  if(count>=drop.count)s.factory.drops.splice(index,1);else drop.count-=count;
  return true;
 }
 function pickup(drop){
  const s=state();if(!s||!drop||!['wood','stone','gold'].includes(drop.type))return false;
  if(!send(s,drop,drop.count,'manual'))return false;
  statusKey='inTransit';statusUntil=visualTime+.65;
  window.SupplyFactory?.translate();syncDOM();persist();return true;
 }

 function dispatch(s){
  let moved=false;
  for(const link of s.camp.links){
   const node=s.factory.nodes.find(n=>keyEqual(n.key,link.nodeKey));if(!node)continue;
   let capacity=4;
   const drops=s.factory.drops.filter(d=>d.type===link.type&&(d.source!=null?keyEqual(d.source,node.key):Math.hypot(d.x-node.x,d.y-node.y)<=150));
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
  if(first&&typeof renderCards==='function')renderCards();
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
  const s=state();if(!s)return false;booted=true;document.body.classList.add('outpost-game');makeDOM();makeWorkshop();syncDOM();return true;
 }
 function guide(){
  const s=state();if(!s)return '';
  if(!railExists('wood')&&(s.gold>=COST.wood||s.clearedBossWave>0))return tr('firstRail');
  if(railExists('wood')&&!railExists('stone'))return tr('stoneNext');
  if(railExists('wood')&&railExists('stone'))return tr('bothRails');
  return s.camp.cargo.length?tr('inTransit'):'';
 }
 return {boot,tick,drawUnder,drawOver,pickup,openWorkshop,hitHouse,get ready(){return booted;},get hasWoodRail(){return railExists('wood');},get hasStoneRail(){return railExists('stone');},get guide(){return guide();}};
})();
