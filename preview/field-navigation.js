/* Navigation owns right/middle drags and two-finger gestures. Tools keep their own pointer handlers. */
window.FieldNavigation=(()=>{
 'use strict';
 const replay=new WeakSet(),touches=new Map();let first=null,timer=0,gesture=null,mouse=null,suppressClick=0;
 const field=()=>document.getElementById('field'),viewport=()=>document.getElementById('battleViewport');
 const world=e=>field()?.contains(e.target)&&!e.target.closest('button,input,select,summary,#quickbar,#raidBoard,#cameraTools,#campaignGoal,#burrowForecast,#placementActions,#beltActions,#fieldExit,#placementControls,#onboardingGuide');
 const live=()=>window.Outpost?.ready&&!Rework.paused&&document.getElementById('titleScreen')?.classList.contains('hidden');
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
 function send(type,e,target=first?.target){if(!target)return;const event=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,clientX:e.clientX,clientY:e.clientY,button:e.button,buttons:e.buttons,pressure:e.pressure||0,width:e.width||1,height:e.height||1});if(type==='pointerdown')Object.defineProperty(event,'fieldDelay',{value:Math.max(0,performance.now()-e.timeStamp)});replay.add(event);target.dispatchEvent(event);}
 function flush(){clearTimeout(timer);timer=0;if(first&&!first.sent&&!gesture){first.sent=true;send('pointerdown',first.down,first.target);if(first.move)send('pointermove',first.move,first.target);}}
 function clear(){clearTimeout(timer);timer=0;first=null;touches.clear();gesture=null;mouse=null;field()?.classList.remove('field-panning');}
 function metrics(){const p=[...touches.values()].slice(0,2);return {x:(p[0].clientX+p[1].clientX)/2,y:(p[0].clientY+p[1].clientY)/2,d:Math.max(1,Math.hypot(p[0].clientX-p[1].clientX,p[0].clientY-p[1].clientY))};}
 function empty(p){if(SupplyFactory.pileAt(p)||Outpost.enemyAt(p)||OutpostCamp.hitDevice(p)||OutpostCamp.hopperAt(p)||OutpostCamp.beltAt(p)||OutpostCamp.platformAt(p))return false;if(Math.abs(p.x-100)<64&&p.y>235&&p.y<360)return false;if(S.factory.nodes.some(n=>Math.abs(n.x-p.x)<55&&p.y>n.y-108&&p.y<n.y+15))return false;return !ArmyView.sim.soldiers.some(q=>Math.abs(q.x-p.x)<30&&p.y>q.y-65&&p.y<q.y+12);}
 function down(e){if(replay.has(e)||!live())return;
  if(e.pointerType==='touch'&&(world(e)||touches.size)){
   stop(e);touches.set(e.pointerId,e);try{field().setPointerCapture(e.pointerId);}catch(_){}
   if(touches.size===1){first={target:e.target,down:e,sent:false,move:null,pan:window.InventoryUI?.selected==='hand'&&!OutpostCamp.buildingKind&&!BattleControl.placement&&empty(ArmyView.point(e.clientX,e.clientY))};if(!first.pan)timer=setTimeout(flush,90);}
   else if(touches.size===2){clearTimeout(timer);timer=0;if(first?.sent)send('pointercancel',first.down,first.target);OutpostCamp.cancelPreview();OutpostCamp.clearSelection();OutpostCamp.cancelCarry();BattleControl.cancelGesture?.();FieldUI.cancelGesture?.();OreUI.cancelGesture?.();const m=metrics();gesture={...m,point:ArmyView.point(m.x,m.y),scale:ArmyView.camera.scale};field().classList.add('field-panning');}
   return;
  }
  if(!world(e)||e.pointerType==='touch')return;
  if(e.button===1||e.button===2||(e.button===0&&window.InventoryUI?.selected==='hand'&&!OutpostCamp.buildingKind&&!BattleControl.placement&&empty(ArmyView.point(e.clientX,e.clientY)))){stop(e);OutpostCamp.cancelPreview();OutpostCamp.clearSelection();OutpostCamp.cancelCarry();BattleControl.cancelGesture();FieldUI.cancelGesture?.();OreUI.cancelGesture?.();mouse={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport().scrollLeft,top:viewport().scrollTop};field().classList.add('field-panning');try{field().setPointerCapture(e.pointerId);}catch(_){}}
 }
 function move(e){if(replay.has(e))return;if((mouse||touches.size)&&!live()){if(first?.sent)send('pointercancel',first.down,first.target);clear();return;}if(mouse?.id===e.pointerId){stop(e);viewport().scrollLeft=mouse.left-(e.clientX-mouse.x);viewport().scrollTop=mouse.top-(e.clientY-mouse.y);return;}
  if(!touches.has(e.pointerId))return;stop(e);touches.set(e.pointerId,e);
  if(first?.pan&&!gesture&&Math.hypot(e.clientX-first.down.clientX,e.clientY-first.down.clientY)>6){gesture={one:true,x:first.down.clientX,y:first.down.clientY,left:viewport().scrollLeft,top:viewport().scrollTop};field().classList.add('field-panning');}
  if(gesture?.one){viewport().scrollLeft=gesture.left-(e.clientX-gesture.x);viewport().scrollTop=gesture.top-(e.clientY-gesture.y);return;}
  if(gesture){if(touches.size>=2){const m=metrics();ArmyView.viewAt(gesture.point.x,gesture.point.y,gesture.scale*m.d/gesture.d,m.x,m.y);}return;}
  if(first){if(first.sent)send('pointermove',e,first.target);else first.move=e;}
 }
 function up(e){if(replay.has(e))return;if(mouse?.id===e.pointerId){stop(e);mouse=null;field().classList.remove('field-panning');suppressClick=performance.now()+500;return;}
  if(!touches.has(e.pointerId))return;stop(e);
  if(!gesture&&first?.down.pointerId===e.pointerId){if(e.type!=='pointercancel')flush();if(first?.sent)send(e.type,e,first.target);}
  touches.delete(e.pointerId);suppressClick=performance.now()+500;if(!touches.size)clear();
 }
 function boot(){if(!window.__OUTPOST_BUILD__)return;for(const [type,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up]])document.addEventListener(type,fn,{capture:true,passive:false});
  document.addEventListener('contextmenu',e=>{if(world(e))stop(e);},true);document.addEventListener('click',e=>{if(performance.now()<suppressClick&&world(e))stop(e);},true);
  viewport().addEventListener('wheel',e=>{if(!live()||!world(e))return;stop(e);const p=ArmyView.point(e.clientX,e.clientY);ArmyView.viewAt(p.x,p.y,ArmyView.camera.scale*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);},{capture:true,passive:false});window.addEventListener('blur',()=>{if(first?.sent)send('pointercancel',first.down,first.target);clear();});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(first?.sent)send('pointercancel',first.down,first.target);clear();}});
 }
 boot();return {get moving(){return !!(gesture||mouse);}};
})();
