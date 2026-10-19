/* Collect -> leave a drop -> carry/belt -> depot. Nothing teleports into stock. */
window.SupplyFactory=(()=>{
 const words={speed:['運搬速度','Hauling speed','搬运速度'],wood:['木材','Wood','木材'],stone:['石材','Stone','石材'],depot:['補給拠点','Supply depot','补给站'],rail:['レールを敷く','Build rails','铺设轨道'],done:['敷設を終える','Finish rails','结束铺设'],help:['拠点から伸ばしたい場所をタップ。線路上をタップすると、そこから分岐。ドラッグでも敷設。1区画8G。資材は使いません。','Tap to extend from the depot. Tap an existing track to branch. Drag to lay a route. Each tile costs 8 G; no materials needed.','点击从补给站延伸。点击已有轨道可设置分支，也可拖动铺设。每格8金币，不消耗材料。'],short:['建設費が足りません。市の討伐報酬を受け取るか、短い区間にしてください。','Not enough gold. Earn a city bounty or build a shorter section.','金币不足，请完成城市讨伐委托或铺设更短路段。'],arrived:['拠点へ納品','Delivered to depot','已送达补给站'],worker:['補給隊','Supply company','补给队'],ground:['落ちている物資','Ground supplies','地面物资'],start:['補給隊が到着','Supply crew ready','补给队抵达'],startHelp:['剣士と補給隊が到着。討伐すると市から報酬。木と石は拠点へ運んで装備に使います。','A swordsman and supply crew have arrived. Earn city bounties; deliver wood and stone to equip new troops.','剑士和补给队已抵达。完成讨伐获得城市报酬；木石运到补给站后用于新兵装备。']};
 const tr=k=>words[k][Math.max(0,['ja','en','zh'].indexOf(LANG))];
 let ready=false,stateRef=null,width=1100,height=500,routes=new Map(),railStart=null,building=false,drag=null,lastRailCount=-1,obstacleSim=null,obstacleState=null,jobs=new Map(),ui=0,workerClock=0;
 function state(){if(!S.factory){S.factory=SupplyCore.fresh(width,height);for(const id of ['sword','woodcutter','miner','porter'])if(Object.hasOwn(S.owned,id))S.owned[id]=Math.max(1,S.owned[id]);}if(stateRef!==S.factory){stateRef=S.factory;routes=SupplyCore.route(stateRef);jobs.clear();for(const d of stateRef.drops)delete d.carrier;lastRailCount=stateRef.rails.length;railStart=stateRef.depot;}return stateRef;}
 function resize(w,h){
  if(!ready){width=w;height=h;return;}
  const s=state(),sx=w/s.width,sy=h/s.height,resized=Math.abs(sx-1)>.001||Math.abs(sy-1)>.001;
  if(resized){
   for(const n of [...s.nodes,...s.drops]){n.x*=sx;n.y*=sy;}
   s.depot=SupplyCore.snap({x:s.depot.x*sx,y:s.depot.y*sy});
   const rails=s.rails.map(e=>({a:SupplyCore.snap({x:e.a.x*sx,y:e.a.y*sy}),b:SupplyCore.snap({x:e.b.x*sx,y:e.b.y*sy})}));
   s.rails=[];for(const e of rails)SupplyCore.build(s,e.a,e.b,1e150);
   for(const d of s.drops){delete d.carrier;delete d.railFrom;}
   s.width=w;s.height=h;routes=SupplyCore.route(s);jobs.clear();railStart=s.depot;lastRailCount=s.rails.length;
  }
  width=w;height=h;
  if(obstacleSim!==ArmyView.sim||obstacleState!==s||resized){ArmyView.sim.setObstacles(s.nodes);obstacleSim=ArmyView.sim;obstacleState=s;}
 }
 function workerStats(u,lv){if(u.id==='porter')return tr('speed')+' · '+Math.round(Math.min(2.5,1+.03*lv)*100)+'% → '+Math.round(Math.min(2.5,1+.03*(lv+1))*100)+'%';const amount=1+Math.floor(lv/5),next=(Math.floor(lv/5)+1)*5;return (u.worker==='woodcutter'?tr('wood'):tr('stone'))+' '+amount+' / '+['回','trip','次'][Math.max(0,['ja','en','zh'].indexOf(LANG))]+' · Lv.'+next+' → '+(amount+1);}
 function resources(u,n){if(u.worker)return {wood:0,stone:0};return {wood:u.ranged||u.healer?n:0,stone:!u.ranged||u.healer?n:0};}
 function canRecruit(u,n){const s=state(),c=resources(u,n);return s.inventory.wood>=c.wood&&s.inventory.stone>=c.stone;}
 function pay(u,n){if(!canRecruit(u,n))return false;const c=resources(u,n),s=state();s.inventory.wood-=c.wood;s.inventory.stone-=c.stone;return true;}
 function costText(u,n){const c=resources(u,n);return [c.wood?tr('wood')+' '+c.wood:'',c.stone?tr('stone')+' '+c.stone:''].filter(Boolean).join(' · ');}
 function arrive(item){const reward=SupplyCore.deliver(state(),item);if(reward?.type==='gold')earnGold(reward.count);}
 function nearestRail(p){let nearest={point:state().depot,next:null},distance=Infinity,k=SupplyCore.key(nearest.point);for(const [id,r]of routes){const d=Math.hypot(p.x-r.point.x,p.y-r.point.y)+r.distance*2;if(d<distance){nearest=r;distance=d;k=id;}}return {key:k,...nearest};}
 function assignWorkers(dt){const s=state(),soldiers=ArmyView.sim.soldiers,claimed=new Set([...jobs.values()].filter(j=>j.kind==='carry').map(j=>j.item.key));
  for(const p of soldiers){if(!p.u.worker||p.enterAt>ArmyView.sim.time||p.stun)continue;let job=jobs.get(p.key);
   if(p.commanded&&p.order&&Math.hypot(p.x-p.order.x,p.y-p.order.y)>12)continue;
   if(p.u.worker==='porter'){
    if(job&&(!s.drops.includes(job.item)||job.item.carrier&&job.item.carrier!==p.key)){jobs.delete(p.key);job=null;}
    if(!job){let best=null,distance=Infinity;for(const d of s.drops){if(d.carrier||d.railFrom||claimed.has(d.key))continue;const ageOrder=d.key;if(ageOrder<distance){best=d;distance=ageOrder;}}if(!best)continue;job={kind:'carry',item:best};jobs.set(p.key,job);claimed.add(best.key);}
    const d=job.item;
    if(d.carrier===p.key){d.x=p.x;d.y=p.y-8;const target=job.rail||nearestRail(p);job.rail=target;p.order={...target.point};if(Math.hypot(p.x-target.point.x,p.y-target.point.y)<26){delete d.carrier;d.x=target.point.x;d.y=target.point.y;d.railFrom=target.key;jobs.delete(p.key);if(!target.next)arrive(d);}}
    else{p.order={x:d.x,y:d.y};if(Math.hypot(p.x-d.x,p.y-d.y)<30){d.carrier=p.key;job.rail=nearestRail(p);}}
    continue;
   }
   const type=p.u.worker==='woodcutter'?'wood':'stone';
   if(!job||job.node.stock<=0){let node=null,distance=Infinity;for(const n of s.nodes){if(n.type!==type||n.stock<=0)continue;const d=Math.hypot((p.order?.x??p.x)-n.x,(p.order?.y??p.y)-n.y);if(d<distance){node=n;distance=d;}}if(!node||p.commanded&&distance>140)continue;job={kind:'harvest',node};jobs.set(p.key,job);}
   const n=job.node,angle=ArmySim.noise(p.key)*Math.PI*2,d=n.radius+p.r+6;p.order={x:n.x+Math.cos(angle)*d,y:n.y+Math.sin(angle)*d};
   if(Math.hypot(p.x-n.x,p.y-n.y)<d+10&&p.cooldown<=0){p.cooldown=p.interval;p.attackAt=ArmyView.sim.time;const amount=Math.min(n.stock,1+Math.floor((S.ulvl[p.id]||0)/5));n.stock-=amount;SupplyCore.drop(s,type,amount,n.x-n.radius-25+ArmySim.noise(p.key)*12,n.y+12);if(!n.stock)n.regrow=s.time+65;}
  }
 }
 function tick(dt){if(!ready)return;const s=state();s.time+=dt;for(const n of s.nodes)if(n.stock<=0&&s.time>=n.regrow)n.stock=180;
  if(lastRailCount!==s.rails.length){routes=SupplyCore.route(s);lastRailCount=s.rails.length;}
  workerClock+=dt;if(workerClock>=.12){assignWorkers(workerClock);workerClock=0;}
  for(let i=s.drops.length-1;i>=0;i--){const d=s.drops[i];if(d.carrier)continue;if(!d.railFrom){const k=SupplyCore.key(d),r=routes.get(k);if(!r||Math.hypot(d.x-r.point.x,d.y-r.point.y)>19)continue;d.railFrom=k;}
   const current=routes.get(d.railFrom);if(!current){delete d.railFrom;continue;}if(!current.next){arrive(d);continue;}const next=routes.get(current.next),dx=next.point.x-d.x,dy=next.point.y-d.y,distance=Math.hypot(dx,dy),move=Math.min(distance,175*dt);if(distance<2){d.railFrom=current.next;}else{d.x+=dx/distance*move;d.y+=dy/distance*move;}
  }
  ui+=dt;if(ui>.25){ui=0;translate();}
 }
 function setBuilding(value){building=value;if(value){BattleControl.setPlacement(false);railStart=state().depot;}document.getElementById('field').classList.toggle('rail-mode',value);translate();}
 function build(from,to){const inside=p=>({x:ArmySim.clamp(p.x,0,width),y:ArmySim.clamp(p.y,height*.34+32,height-32)});const s=state(),result=SupplyCore.build(s,inside(from),inside(to),S.gold);if(!result.ok){Rework.toast(tr('short'));return false;}S.gold-=result.cost;updateHud();renderCards();railStart=result.end;routes=SupplyCore.route(s);lastRailCount=s.rails.length;save();return true;}
 function translate(){if(!ready)return;const s=state();document.getElementById('supplyInventory').innerHTML='<b>'+tr('depot')+'</b><span>▥ '+tr('wood')+' <strong>'+Math.floor(s.inventory.wood)+'</strong></span><span>◆ '+tr('stone')+' <strong>'+Math.floor(s.inventory.stone)+'</strong></span><small>'+tr('ground')+' '+s.drops.length+'</small>';document.getElementById('buildRails').textContent=tr(building?'done':'rail')+(building?'':' · 8 G');document.getElementById('buildRails').setAttribute('aria-pressed',building);document.getElementById('supplyHelp').textContent=building?tr('help')+(drag?'　'+SupplyCore.quote(s,drag.start,drag.point).cost+' G':''):'';const contract=Core.contract(S),label=['市の討伐依頼','City contract','城市讨伐委托'][Math.max(0,['ja','en','zh'].indexOf(LANG))];document.getElementById('cityContract').innerHTML='<span>'+label+'</span><b>'+fmt(contract.total)+' G</b>'+(contract.first?'<small>'+['初回報酬を含む','First-clear grant included','含首次完成奖励'][Math.max(0,['ja','en','zh'].indexOf(LANG))]+'</small>':'');document.getElementById('supplyHelp').hidden=!building;}
 function draw(ctx,{ox,oy,z}){if(!ready)return;const s=state(),X=x=>ox+x*z,Y=y=>oy+y*z;
  for(const e of s.rails){const connected=routes.has(SupplyCore.key(e.a));ctx.strokeStyle=connected?'#9d9277':'#525b5b';ctx.lineWidth=Math.max(2,7*z);ctx.beginPath();ctx.moveTo(X(e.a.x),Y(e.a.y));ctx.lineTo(X(e.b.x),Y(e.b.y));ctx.stroke();ctx.strokeStyle='#392f29';ctx.lineWidth=Math.max(1,3*z);ctx.stroke();}
  for(const n of s.nodes){const x=X(n.x),y=Y(n.y);if(x<-70||y<-80||x>innerWidth+70||y>innerHeight+80)continue;ctx.fillStyle='#121b1688';ctx.beginPath();ctx.ellipse(x,y,23*z,9*z,0,0,Math.PI*2);ctx.fill();
   if(n.type==='wood'){ctx.fillStyle='#70513b';ctx.fillRect(x-4*z,y-(n.stock?30:9)*z,8*z,(n.stock?31:10)*z);if(n.stock){ctx.fillStyle='#304c37';ctx.beginPath();ctx.moveTo(x,y-68*z);ctx.lineTo(x-27*z,y-17*z);ctx.lineTo(x+26*z,y-17*z);ctx.closePath();ctx.fill();ctx.fillStyle='#436448';ctx.beginPath();ctx.moveTo(x,y-64*z);ctx.lineTo(x-18*z,y-30*z);ctx.lineTo(x+16*z,y-30*z);ctx.closePath();ctx.fill();}}
   else{ctx.fillStyle=n.stock?'#6f7a78':'#39413e';ctx.beginPath();ctx.moveTo(x-24*z,y);ctx.lineTo(x-17*z,y-22*z);ctx.lineTo(x+6*z,y-31*z);ctx.lineTo(x+26*z,y-7*z);ctx.lineTo(x+21*z,y+3*z);ctx.closePath();ctx.fill();ctx.fillStyle='#a1aaa1';ctx.fillRect(x-8*z,y-22*z,12*z,4*z);}
  }
  const dx=X(s.depot.x),dy=Y(s.depot.y);ctx.fillStyle='#6c5a41';ctx.fillRect(dx-34*z,dy-30*z,68*z,42*z);ctx.fillStyle='#314d42';ctx.beginPath();ctx.moveTo(dx-43*z,dy-27*z);ctx.lineTo(dx,dy-59*z);ctx.lineTo(dx+43*z,dy-27*z);ctx.closePath();ctx.fill();ctx.fillStyle='#dfcb89';ctx.fillRect(dx-10*z,dy-19*z,20*z,31*z);ctx.font='bold '+Math.max(9,11*z)+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#dfd6a9';ctx.fillText(tr('depot'),dx,dy+28*z);
  for(const d of s.drops){const x=X(d.x),y=Y(d.y);ctx.fillStyle=d.type==='wood'?'#cc9c63':d.type==='stone'?'#c1cacc':'#f5d178';ctx.fillRect(x-4*z,y-5*z,Math.max(3,8*z),Math.max(3,7*z));if(z>.65&&d.count>1){ctx.fillStyle='#ede3bd';ctx.font='9px system-ui';ctx.fillText(Math.floor(d.count),x,y-9*z);}}
  if(building&&railStart){ctx.strokeStyle='#9ee6b6';ctx.lineWidth=2;ctx.strokeRect(X(railStart.x)-10,Y(railStart.y)-10,20,20);if(drag){ctx.beginPath();ctx.moveTo(X(drag.start.x),Y(drag.start.y));ctx.lineTo(X(drag.point.x),Y(drag.start.y));ctx.lineTo(X(drag.point.x),Y(drag.point.y));ctx.stroke();}}
 }
 function boot(){if(ready)return;ready=true;const initial=!S.factory;state();const controls=document.getElementById('battleCommands'),button=document.createElement('button');button.id='buildRails';button.type='button';button.onclick=()=>setBuilding(!building);controls.appendChild(button);const inv=document.createElement('div');inv.id='supplyInventory';document.getElementById('field').appendChild(inv);const city=document.createElement('div');city.id='cityContract';document.getElementById('stPres').after(city);const help=document.createElement('p');help.id='supplyHelp';document.getElementById('field').appendChild(help);
  const field=document.getElementById('field');field.addEventListener('pointerdown',e=>{if(!building||Rework.paused||e.target.closest('button,input,select'))return;e.preventDefault();field.setPointerCapture(e.pointerId);const point=ArmyView.point(e.clientX,e.clientY);drag={pointer:e.pointerId,start:point,point,moved:false};});field.addEventListener('pointermove',e=>{if(!drag)return;drag.point=ArmyView.point(e.clientX,e.clientY);drag.moved ||= Math.hypot(drag.point.x-drag.start.x,drag.point.y-drag.start.y)>20;});field.addEventListener('pointerup',e=>{if(!drag)return;const point=SupplyCore.snap(drag.point),near=routes.get(SupplyCore.key(point));if(drag.moved)build(drag.start,drag.point);else if(near&&Math.hypot(near.point.x-drag.point.x,near.point.y-drag.point.y)<17)railStart=near.point;else build(railStart||state().depot,point);drag=null;if(field.hasPointerCapture(e.pointerId))field.releasePointerCapture(e.pointerId);});field.addEventListener('pointercancel',()=>drag=null);window.addEventListener('keydown',e=>{if(e.key==='Escape')setBuilding(false);});translate();renderUnits();if(initial)Rework.toast(tr('start'),tr('startHelp'));
 }
 return {boot,tick,draw,resize,translate,workerStats,resources,canRecruit,pay,costText,setBuilding,build,get building(){return building;},get state(){return state();},get routes(){return routes;},get jobs(){return jobs;}};
})();
