/* Preparation belongs to the house. The worksite has no permanent side panel. */
window.CabinUI=(()=>{
 'use strict';
 let shell,door,tab='catalog',last='',lastRecipes='',lastScale=0;
 const byId=id=>document.getElementById(id);
 const benefits={woodcutter:'木を切る作業を仲間に任せます。',miner:'岩や鉄鉱脈のそばで採掘を任せます。',arch:'道を射程に入れて、敵を弓で迎え撃ちます。',sword:'道の近くで敵を足止めし、弓兵を助けます。',blower:'落ちた資材を風で動かします。',belt:'自分で道をつなぎ、資材を倉庫へ運びます。',fence:'風で動く資材を柵に沿って誘導します。',hopper:'近くの資材を吸い寄せ、搬送路へ送ります。',platform:'広い面で資材を受け、次の設備へ渡します。',loader:'散らばった資材を拾い、コンベアへ載せます。',broom:'丸太や石を手元の箒で掃き寄せます。',magnet:'鉄だけを引き寄せ、搬送路へ渡します。',farmer:'畑の作物を収穫して食料を作ります。',ballista:'遠くの鎧を貫く大型の弩を使います。'};
 function show(next='catalog'){
  tab=next;Rework.openPanel('cabinOverlay');
  for(const pane of shell.querySelectorAll('[data-cabin-pane]'))pane.hidden=pane.dataset.cabinPane!==tab;
  for(const button of shell.querySelectorAll('[data-cabin-tab]'))button.setAttribute('aria-selected',String(button.dataset.cabinTab===tab));
  if(tab==='research')byId('harvestSkillOverlay').classList.add('on');
  if(tab==='expedition')byId('expeditionOverlay').classList.add('on');
  sync();return true;
 }
 function open(next='catalog'){if(next==='research'){HarvestSkills.open();return true;}if(next==='expedition'){ExpeditionUI.openRoster();return true;}return show(next);}
 function sync(){if(!shell)return;const fort=CampaignCore.stronghold(S.camp),state=S.outpost,waiting=S.expedition.awaitingReady,failed=S.expedition.awaitingDecision;
  const text=fort.name;if(byId('cabinTitle').textContent!==text)byId('cabinTitle').textContent=text;
  const status=failed?'防衛に失敗 · 小屋で作戦を見直す':waiting?'準備できたら出撃':state.completed?'街への道が開通！':state.phase==='active'?'防衛中 · '+state.wave+' / 30':'次の襲撃に備えよう';
  if(byId('campStatusButton').textContent!==status)byId('campStatusButton').textContent=status;
  byId('campStatusButton').hidden=!waiting&&!failed&&!state.completed;door.textContent=state.completed?'城をひらく':'小屋をひらく';
  door.style.pointerEvents=(OutpostCamp.layingRails||OutpostCamp.dragging||BattleControl.placement)?'none':'';
  const scale=ArmyView.camera.scale;if(scale!==lastScale){lastScale=scale;door.style.transform='translateX(-50%) scale('+Math.max(1,1/scale)+')';door.style.left=Math.max(100,(door.offsetWidth*scale*Math.max(1,1/scale)/2+8)/scale)+'px';}
  const quotes=ProgressionCore.nodes.filter(n=>n.kind==='recipe').map(n=>ProgressionCore.quote(S,n.id)).filter(q=>!q.built&&!q.missingPrereqs.length);const recipeKey=JSON.stringify(quotes.map(q=>[q.id,q.ready,q.cost]));if(recipeKey!==lastRecipes){lastRecipes=recipeKey;byId('cabinRecipes').innerHTML=quotes.map(q=>'<article class="cabin-recipe"><b>'+q.title.ja.replace('のレシピ','')+'</b><small>'+(benefits[q.recipe]||q.description.ja)+'</small><button type="button" data-cabin-recipe="'+q.id+'">解放を調べる · '+Object.entries(q.cost).filter(([,n])=>n>0).map(([k,n])=>({wood:'木',stone:'石',iron:'鉄',coins:'転生コイン',gold:'G'}[k]||k)+n).join(' ')+'</button></article>').join('');}const stock=S.factory.inventory,key=JSON.stringify([stock,S.gold,fort.stage]);if(key!==last){last=key;byId('fieldStock').textContent=[['wood','木'],['stone','石'],['food','食料'],['iron','鉄']].filter(([id])=>id!=='iron'||S.camp.oreMining).map(([id,label])=>label+' '+Math.floor(stock[id]||0)).join('　');}
 }
 function boot(){
  shell=document.createElement('div');shell.id='cabinOverlay';shell.className='rx-overlay';shell.innerHTML='<section class="rx-dialog cabin-dialog" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="cabinTitle"><header class="cabin-header"><div><small>仲間を迎える・道具を整える · 一時停止中</small><h2 id="cabinTitle">小屋で準備</h2></div><button type="button" data-cabin-close aria-label="小屋を閉じる">×</button></header><nav class="cabin-tabs" aria-label="小屋でできること" role="tablist"><button type="button" role="tab" data-cabin-tab="catalog">仲間・設備</button><button type="button" role="tab" data-cabin-tab="research">研究・強化</button><button type="button" role="tab" data-cabin-tab="expedition">編成・出撃</button><button type="button" role="tab" data-cabin-tab="camp">拠点・記録</button></nav><div class="cabin-wallet"></div><main class="cabin-content"><section data-cabin-pane="catalog"><p class="cabin-intro">仲間を雇い、設備を手に持って、地面に配置します。</p><div id="cabinRecipes"></div><div id="cabinCrafts"></div></section><section data-cabin-pane="research" hidden></section><section data-cabin-pane="expedition" hidden></section><section data-cabin-pane="camp" hidden></section></main><footer class="cabin-footer"></footer></section>';document.body.append(shell);
  shell.querySelector('.cabin-wallet').append(byId('campWarehouse'));shell.querySelector('[data-cabin-pane="catalog"]').append(byId('panels'));
  shell.querySelector('#cabinCrafts').append(document.querySelector('.bag-workshop'));
  for(const [id,name]of [['harvestSkillOverlay','research'],['expeditionOverlay','expedition']]){const pane=byId(id);pane.classList.add('cabin-inline');shell.querySelector('[data-cabin-pane="'+name+'"]').append(pane);}
  for(const id of ['strongholdGrowth','campaignLedger','burrowForecast','campaignGoal'])shell.querySelector('[data-cabin-pane="camp"]').append(byId(id));
  shell.querySelector('.cabin-footer').append(byId('rxToolbar'));byId('harvestSkillsButton').hidden=true;byId('expeditionButton').hidden=true;
  shell.addEventListener('click',e=>{const button=e.target.closest('[data-cabin-tab]');if(button)open(button.dataset.cabinTab);const recipe=e.target.closest('[data-cabin-recipe]');if(recipe)HarvestSkills.open(recipe.dataset.cabinRecipe);if(e.target===shell||e.target.closest('[data-cabin-close]'))Rework.close();if(e.target.closest('[data-recruit],[data-equipment],[data-gadget]'))setTimeout(()=>{if(OutpostCamp.buildingKind||FieldUI.equipped||OreUI.equipped||Object.values(S.pending||{}).some(Boolean))Rework.close();},0);});
  shell.addEventListener('pointerup',e=>{if(e.target.closest('[data-recruit],[data-equipment],[data-gadget]'))setTimeout(()=>{if(OutpostCamp.buildingKind||FieldUI.equipped||OreUI.equipped||Object.values(S.pending||{}).some(Boolean))Rework.close();},0);});FieldUI.bindTouch(byId('cabinRecipes'));FieldUI.bindTouch(shell.querySelector('.cabin-header'));FieldUI.bindTouch(shell.querySelector('.cabin-tabs'));
  const field=byId('field');door=document.createElement('button');door.id='cabinDoor';door.type='button';door.textContent='小屋をひらく';door.onclick=()=>open();byId('battleWorld').append(door);FieldUI.bindTouch(door.parentElement);
  const strip=document.createElement('aside');strip.id='campStrip';strip.innerHTML='<span id="fieldStock" aria-label="倉庫の資材"></span><button type="button" id="campStatusButton"></button>';field.append(strip);byId('campStatusButton').onclick=()=>open('expedition');FieldUI.bindTouch(strip);
  const bag=byId('inventoryOverlay');bag.querySelector('h3').hidden=true;bag.querySelector('.inventory-note').textContent='手元の道具と設計図を持ち替えます。新しい道具の製作や強化は小屋でできます。';const home=document.createElement('button');home.type='button';home.className='bag-cabin';home.textContent='小屋で仲間・研究・製作';home.onclick=()=>open();bag.querySelector('.inventory-dialog').append(home);FieldUI.bindTouch(home.parentElement.querySelector('.bag-cabin'));
  // Opening the house is also possible after panning away from its pictured door.
  const shortcut=document.createElement('button');shortcut.type='button';shortcut.id='cabinShortcut';shortcut.textContent='小屋';shortcut.title='小屋をひらく（B）';shortcut.onclick=()=>open();byId('quickbar').querySelector('.quickbar-row').append(shortcut);
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='b'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select')){e.preventDefault();shell.classList.contains('on')?Rework.close():open();}});
  document.body.classList.add('cabin-play');sync();setInterval(sync,160);
 }
 boot();return {open,research:()=>show('research'),expedition:()=>show('expedition'),get tab(){return tab;}};
})();
