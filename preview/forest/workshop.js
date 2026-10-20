/* Developer-facing inspection uses the actual game in a separate save namespace. */
(()=>{
 'use strict';
 const frame=document.getElementById('game'),status=document.getElementById('status');
 let ready=false,paused=false;
 function run(code){if(!ready)throw Error('確認画面の読み込みを待ってください。');return frame.contentWindow.eval(code);}
 const names={forest:'最初の森',one:'木こり1人',eight:'木こり8人',army:'木こり・石ほり・弓兵'};
 function scenario(id){
  if(!Object.hasOwn(names,id))return;
  const counts=id==='one'?{woodcutter:1}:id==='eight'?{woodcutter:8}:id==='army'?{woodcutter:8,miner:2,arch:3}:{};
  run(`(()=>{
   if(!window.__MYTHOS_PLAYTEST__||!PARAMS.has('lab'))throw Error('試遊版の確認画面から開いてください。');
   Rework.close();window.dispatchEvent(new CustomEvent('mythos-lab-pause',{detail:false}));
   chooseLang('ja');const muted=ForestAudio.settings.seOn;ForestAudio.settings.seOn=false;
   try{
    S=freshState();S.factory=SupplyCore.fresh(ArmyView.camera.w,500,83);
    S.firstWorkerPickup=${id==='eight'||id==='army'};
    if(${id==='army'}){S.gold=1000;S.factory.inventory={wood:100,stone:100};S.clearedBossWave=1;S.bossWave=2;S.codex=[1];S.bossKills={1:1};}
    const counts=${JSON.stringify(counts)};S.owned={...S.owned,...counts};S.pending={...counts};
    renderUnits();spawnBoss(true);
    for(let i=0;i<40&&Object.values(S.pending).some(n=>n>0);i++){
     const spot=BattleControl.spots()[0];if(!spot)throw Error('この状態の配置を用意できませんでした。');BattleControl.put(spot);
    }
    BattleControl.setPlacement(false);document.body.classList.remove('army-details');
    const quantity=document.getElementById('recruitQuantity');quantity.value='1';quantity.dispatchEvent(new Event('change',{bubbles:true}));
    renderCards();updateHud();SupplyFactory.translate();save();
   }finally{ForestAudio.settings.seOn=muted;ForestAudio.updateButtons(LANG);}
  })()`);
  paused=false;document.getElementById('pause').textContent='動きを止める';document.getElementById('pause').setAttribute('aria-pressed','false');
  document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===id)));
  status.textContent=names[id]+'。下のゲーム画面でも、そのまま操作できます。';
 }
 frame.addEventListener('load',()=>{
  try{
   if(!frame.contentWindow.eval('!!window.__MYTHOS_PLAYTEST__'))throw Error('試遊版から確認画面を開いてください。');
   ready=true;run("document.getElementById('titleScreen').classList.add('hidden');ForestAudio.setBgm(false);");
   document.querySelectorAll('button').forEach(b=>b.disabled=false);
   scenario('forest');
  }catch(e){status.textContent=e.message;}
 });
 document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||!ready)return;
  try{
   if(button.dataset.scene){scenario(button.dataset.scene);return;}
   run('ForestAudio.sync(true);void ForestAudio.context().resume();');
   if(button.dataset.hit){const type=button.dataset.hit;if(!['wood','stone'].includes(type))return;
    if(paused)run(`ForestAudio.play('${type}');`);else run(`BattleControl.setPlacement(false);SupplyFactory.choose('${type}');SupplyFactory.harvestSelected();`);
   }else if(button.dataset.sound){const kind=button.dataset.sound;if(['pickup','hire','victory'].includes(kind))run(`ForestAudio.play('${kind}');`);
   }else if(button.id==='music'){
    const on=run('!ForestAudio.settings.bgmOn');run(`ForestAudio.setBgm(${on});`);button.textContent='曲も鳴らす：'+(on?'ON':'OFF');button.setAttribute('aria-pressed',String(on));
   }else if(button.id==='pause'){
    paused=!paused;run(`window.dispatchEvent(new CustomEvent('mythos-lab-pause',{detail:${paused}}));`);button.textContent=paused?'動きを再開する':'動きを止める';button.setAttribute('aria-pressed',String(paused));
   }
  }catch(e){status.textContent=e.message;}
 });
})();
