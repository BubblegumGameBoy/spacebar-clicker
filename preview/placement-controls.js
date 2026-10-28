/* Choose an object in the catalogue. Placement is transient, never a player-facing mode menu. */
window.PlacementControls=(()=>{
 'use strict';
 const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))];
 const names={loader:['積み込み機','Loader','装载机'],allies:['仲間','Ally','伙伴'],woodcutter:['木こり','Lumberjack','伐木工'],miner:['採掘師','Miner','矿工'],farmer:['農家','Farmer','农夫'],ballista:['バリスタ隊','Ballista crew','弩炮队'],arch:['弓兵','Archer','弓箭手'],sword:['剣士','Swordsman','剑士'],belt:['コンベア','Conveyor','传送带'],platform:['受け土台','Receiving platform','接收台'],blower:['送風機','Blower','鼓风机'],fence:['誘導柵','Guide fence','导流栅栏'],hopper:['集積口','Hopper','集料斗']};
 let bar=null,guide=null,exit=null,touch=null,lastTouch=null;
 const kind=()=>window.OutpostCamp?.buildingKind||(window.BattleControl?.placement?'allies':'gather');
 function finish(){window.FieldUI?.equip(false);window.OreUI?.equip(false);window.OutpostCamp?.clearSelection?.();window.OutpostCamp?.cancelRails?.();window.OutpostCamp?.cancelCarry?.();window.SupplyFactory?.stopHold?.();window.BattleControl?.setPlacement(false);sync();}
 function choose(id){if(id==='gather'){finish();return true;}if(id==='allies'){const ok=window.BattleControl?.beginPlacement();sync();return ok;}let ok;if(id==='belt')ok=window.OutpostCamp?.beginRail();else if(id==='platform')ok=window.OutpostCamp?.buildPlatform();else if(id==='blower'||id==='fence'||id==='hopper'||id==='loader')ok=window.OutpostCamp?.buildDevice(id);else return false;sync();return ok!==false;}
 function setText(el,value){if(el&&el.textContent!==value)el.textContent=value;}
 function sync(){
  if(!bar)return;const mode=kind(),pending=Object.values(S.pending||{}).reduce((a,b)=>a+b,0),raid=S.outpost?.phase==='active',active=window.BattleControl?.activeUnit;
  if(exit){const tool=window.OreUI?.equipped?'磁石':window.FieldUI?.equipped?'箒':mode!=='gather'?local(names[mode==='allies'?(active||'allies'):mode]||names.allies):'',choice=window.OutpostCamp?.placementChoice;exit.hidden=!tool||!!choice;setText(exit.querySelector('b'),tool+(mode==='gather'?'を使用中':'を配置中'));exit.querySelector('button').textContent='操作を終了';}
  const rail=document.getElementById('railEditor');if(rail&&rail.parentElement!==bar)bar.append(rail);
  setText(document.querySelector('.catalog-heading>b'),local(['仲間・設備','Crew & equipment','伙伴与设备']));setText(document.querySelector('.catalog-scroll-hint'),local(['← スワイプ →','← Swipe →','← 左右滑动 →']));document.getElementById('panels').setAttribute('aria-label',local(['仲間と設備の購入一覧','Crew and equipment catalogue','伙伴与设备列表']));bar.setAttribute('aria-label',local(['配置する対象','Selected object','放置对象']));document.getElementById('field').dataset.tool=mode;bar.hidden=mode==='gather';bar.dataset.mode=mode;
  setText(bar.querySelector('.placement-current'),local(names[mode==='allies'?(active||'allies'):mode]||names.allies));
  setText(bar.querySelector('.placement-hint'),mode==='fence'?local(['ドラッグで線 → 離して設置','Drag a line → release','拖动画线 → 松开建造']):mode==='allies'||mode==='belt'?local(['押したまま確認 → 離して配置','Hold to preview → release to place','按住预览 → 松开放置']):'1回押して仮置き → 同じ場所をもう1回押して設置');
  const cancel=bar.querySelector('[data-placement-finish]');setText(cancel,mode==='allies'&&pending?local(['取消・返金','Cancel / refund','取消并退款']):local(['キャンセル','Cancel','取消']));
  const resume=document.getElementById('pendingPlacement');resume.hidden=!pending||mode==='allies';resume.disabled=raid;setText(resume,local(['未配置 '+pending+(raid?'（襲撃後）':' · 配置する →'),pending+' waiting'+(raid?' (after raid)':' · Place →'),'待放置 '+pending+(raid?'（袭击后）':' · 放置 →')]));
  const undo=document.getElementById('quickBuildUndo');undo.hidden=!window.OutpostCamp?.canUndo;setText(undo,local(['↶ 取り消す','↶ Undo','↶ 撤销']));undo.title=local(['直前の設備を取り消す','Undo last equipment','撤销上次设备']);
  const source=document.getElementById('playGuide');setText(guide,source?.textContent||'');guide.hidden=mode!=='gather';
 }
 function boot(){if(bar||!window.__OUTPOST_BUILD__)return;
  const field=document.getElementById('field'),deck=document.getElementById('deck'),layout=document.createElement('main');layout.id='playLayout';field.before(layout);layout.append(field,deck);document.body.classList.add('compact-play');
  bar=document.createElement('section');bar.id='placementControls';bar.hidden=true;bar.setAttribute('aria-label',local(['配置する対象','Selected object','放置对象']));bar.innerHTML='<strong class="placement-current" role="status" aria-live="polite"></strong><span class="placement-hint"></span><button type="button" data-placement-finish></button>';document.getElementById('deckMain').prepend(bar);
  exit=document.createElement('aside');exit.id='fieldExit';exit.hidden=true;exit.innerHTML='<b role="status"></b><button type="button" data-field-finish>操作を終了</button>';field.append(exit);exit.querySelector('button').onclick=finish;exit.addEventListener('pointerdown',e=>e.stopPropagation());
  guide=document.createElement('p');guide.id='contextGuide';guide.setAttribute('role','status');document.getElementById('deckMain').prepend(guide);
  const heading=document.createElement('div');heading.className='catalog-heading';heading.innerHTML='<b>'+local(['仲間・設備','Crew & equipment','伙伴与设备'])+'</b><span class="catalog-scroll-hint" aria-hidden="true">'+local(['← スワイプ →','← Swipe →','← 左右滑动 →'])+'</span><button type="button" id="quickBuildUndo" hidden>↶</button>';
  const resume=document.createElement('button');resume.type='button';resume.id='pendingPlacement';resume.hidden=true;resume.onclick=()=>choose('allies');document.getElementById('panels').before(heading,resume);
  const language=document.getElementById('langBtn');if(language)document.getElementById('rxToolbar').append(language);const back=document.getElementById('backToBlog');if(back)document.getElementById('rxToolbar').append(back);document.getElementById('panels').setAttribute('tabindex','0');document.getElementById('panels').setAttribute('aria-label',local(['仲間と設備の購入一覧','Crew and equipment catalogue','伙伴与设备列表']));
  document.getElementById('quickBuildUndo').onclick=()=>{window.OutpostCamp?.undoBuild?.();sync();};
  bar.addEventListener('click',e=>{if(!e.target.closest('[data-placement-finish]'))return;if(kind()==='allies'&&Object.values(S.pending||{}).some(Boolean))window.BattleControl?.cancelPending();else finish();});
  // Captured field drags can suppress compatibility clicks on touch browsers.
  const key=b=>b?.dataset.railAction||b?.id||(b?.hasAttribute('data-placement-finish')?'cancel':null);
  bar.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const b=e.target.closest('button');touch=b&&!b.disabled?{key:key(b),x:e.clientX,y:e.clientY,at:performance.now()}:null;},true);
  bar.addEventListener('pointercancel',()=>touch=null,true);
  bar.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const t=touch,b=e.target.closest('button');touch=null;if(!t||!b||b.disabled||key(b)!==t.key||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12||performance.now()-t.at>1000)return;e.preventDefault();lastTouch={key:t.key,at:performance.now()};b.click();},true);
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&e.isTrusted&&e.detail>0&&lastTouch?.key===key(b)&&performance.now()-lastTouch.at<700){e.preventDefault();e.stopImmediatePropagation();}},true);
  let extraTouch=null,extraLast=null;const extraSelector='#pendingPlacement,#quickBuildUndo,.camp-house-label,#beltActions button,#placementActions button,#fieldExit button,#harvestSkillsButton,#onboardingAction';
  layout.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const b=e.target.closest(extraSelector);extraTouch=b&&!b.disabled?{b,x:e.clientX,y:e.clientY,at:performance.now()}:null;},true);
  layout.addEventListener('pointercancel',()=>extraTouch=null,true);
  layout.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const t=extraTouch,b=e.target.closest(extraSelector);extraTouch=null;if(!t||b!==t.b||b.disabled||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12||performance.now()-t.at>1000)return;e.preventDefault();extraLast={b,at:performance.now(),x:e.clientX,y:e.clientY};b.click();},true);
  // The browser's follow-up click lands on whatever the tap just opened (e.g. the workshop backdrop), so swallow it by position, not by target.
  document.addEventListener('click',e=>{if(extraLast&&e.isTrusted&&e.detail>0&&performance.now()-extraLast.at<700&&(e.target.closest?.(extraSelector)===extraLast.b||Math.hypot(e.clientX-extraLast.x,e.clientY-extraLast.y)<30)){extraLast=null;e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!window.Rework?.paused)finish();});
  new ResizeObserver(()=>window.ArmyView?.layout?.()).observe(field);sync();setInterval(sync,150);
 }
 return {boot,sync,choose,finish,get mode(){return kind();}};
})();
PlacementControls.boot();
