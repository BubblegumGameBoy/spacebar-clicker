/* One visible set of placement tools. Runtime adapters own their drafts; none are saved. */
window.PlacementControls=(()=>{
 'use strict';
 const words={gather:['採集・運搬','Gather / carry','采集与搬运'],allies:['仲間の配置','Place allies','布置伙伴'],belt:['コンベアの設置','Place conveyors','铺设传送带'],platform:['受け土台の設置','Place platforms','放置接收台'],current:['現在：','Current: ','当前：'],finish:['配置を終える','Finish placing','结束布置'],waiting:['配置待ち','Awaiting placement','等待布置'],refund:['雇用を取り消す・返金','Cancel recruits / refund','取消雇佣并退款'],gatherHelp:['木・岩を長押しで採集。落ちた資材をつかみ、小屋へ運びます。','Hold a tree or rock to gather. Drag fallen items to the house.','长按树木或岩石采集，将掉落物拖到房屋。'],alliesHelp:['仲間を選び、地面を押したまま位置を確認。離すと配置します。','Choose an ally. Hold the ground to preview, release to place.','选择伙伴，按住地面预览，松开放置。'],beltHelp:['届け先から押したまま引き伸ばし、離すと設置。続けて敷けます。','Hold at the destination, drag outward, release to build. Keep adding sections.','从接收端按住并向外拖动，松开铺设，可连续建造。'],platformHelp:['地面を押したまま位置を確認。離すと設置。回転で搬送方向を変えます。','Hold the ground to preview, release to build. Rotate changes the output direction.','按住地面预览，松开建造；旋转可改变搬运方向。'],raid:['防衛中：仲間の配置は襲撃後に再開できます。','Defending: ally placement resumes after the raid.','防御中：袭击结束后可布置伙伴。']};
 const text=k=>words[k][Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))];
 let bar=null,signature='',touch=null,lastTouch=null;
 const kind=()=>window.OutpostCamp?.buildingKind||(window.BattleControl?.placement?'allies':'gather');
 function finish(){window.OutpostCamp?.cancelRails?.();window.OutpostCamp?.cancelCarry?.();window.SupplyFactory?.stopHold?.();window.BattleControl?.setPlacement(false);sync();}
 function choose(id){if(id==='gather'){finish();return true;}if(id==='allies'){const ok=window.BattleControl?.beginPlacement();sync();return ok;}if(id==='belt')window.OutpostCamp?.beginRail();else if(id==='platform')window.OutpostCamp?.buildPlatform();else return false;sync();return true;}
 function sync(){
  if(!bar)return;const mode=kind(),pending=Object.values(S.pending||{}).reduce((a,b)=>a+b,0),raid=S.outpost?.phase==='active',active=window.BattleControl?.activeUnit;
  // Move the existing previews, cost, rotate, undo and refund into the same tool panel.
  for(const id of ['railEditor','battleCommands']){const el=document.getElementById(id);if(el&&el.parentElement!==bar)bar.append(el);}
  const next=JSON.stringify([typeof LANG==='string'?LANG:'ja',mode,pending,raid,active]);
  if(next===signature)return;signature=next;bar.setAttribute('aria-label',typeof LANG==='string'&&LANG==='ja'?'配置ツール':LANG==='zh'?'布置工具':'Placement tools');bar.dataset.mode=mode;document.getElementById('field').dataset.tool=mode;
  bar.querySelector('.placement-current').textContent=text('current')+text(mode)+(mode==='allies'&&active?' · '+({woodcutter:['木こり','Lumberjack','伐木工'],miner:['採掘師','Miner','矿工'],arch:['弓兵','Archer','弓箭手'],sword:['剣士','Swordsman','剑士']}[active]?.[Math.max(0,['ja','en','zh'].indexOf(LANG))]||active):'');
  bar.querySelector('.placement-hint').textContent=text(mode+'Help');
  const waiting=bar.querySelector('.placement-waiting');waiting.hidden=!pending;waiting.textContent=text('waiting')+' '+pending;
  for(const button of bar.querySelectorAll('[data-placement-tool]')){const id=button.dataset.placementTool;button.textContent=text(id);button.setAttribute('aria-pressed',String(id===mode));button.disabled=id==='allies'&&raid;}
  const done=bar.querySelector('[data-placement-finish]');done.hidden=mode==='gather';done.textContent=text('finish');
  const refund=document.getElementById('cancelRecruits');if(refund)refund.textContent=text('refund');
  const raidNote=bar.querySelector('.placement-raid');raidNote.hidden=!raid;raidNote.textContent=text('raid');
  for(const [id,target] of [['conveyorBuild','belt'],['conveyorPlatformBuild','platform']]){const button=document.getElementById(id);if(button)button.setAttribute('aria-pressed',String(target===mode));}
 }
 function boot(){if(bar||!window.__OUTPOST_BUILD__)return;bar=document.createElement('section');bar.id='placementControls';bar.setAttribute('aria-label','Placement tools');bar.innerHTML='<div class="placement-heading"><strong class="placement-current" role="status" aria-live="polite"></strong><span class="placement-waiting"></span><button type="button" data-placement-finish></button></div><div class="placement-tools">'+['gather','allies','belt','platform'].map(id=>'<button type="button" data-placement-tool="'+id+'" aria-pressed="false"></button>').join('')+'</div><p class="placement-hint"></p><p class="placement-raid" hidden></p>';
  document.getElementById('deckMain').prepend(bar);document.body.classList.add('unified-placement');
  const buttonKey=b=>b?.dataset.placementTool|| (b?.hasAttribute('data-placement-finish')?'finish':b?.dataset.railAction||b?.id);
  bar.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const b=e.target.closest('button');touch=b&&!b.disabled?{key:buttonKey(b),x:e.clientX,y:e.clientY,at:performance.now()}:null;},true);
  bar.addEventListener('pointercancel',()=>touch=null,true);
  bar.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const t=touch,b=e.target.closest('button');touch=null;if(!t||!b||b.disabled||buttonKey(b)!==t.key||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12||performance.now()-t.at>1000)return;e.preventDefault();lastTouch={key:t.key,at:performance.now()};b.click();},true);
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&e.isTrusted&&e.detail>0&&lastTouch?.key===buttonKey(b)&&performance.now()-lastTouch.at<700){e.preventDefault();e.stopImmediatePropagation();}},true);
  bar.addEventListener('click',e=>{const button=e.target.closest('[data-placement-tool]');if(button&&!button.disabled)choose(button.dataset.placementTool);if(e.target.closest('[data-placement-finish]'))finish();});
  // Escape ends the same tool on desktop; menus retain their own Escape handling.
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!window.Rework?.paused)finish();});
  sync();setInterval(sync,150);
 }
 return {boot,sync,choose,finish,get mode(){return kind();}};
})();
PlacementControls.boot();
