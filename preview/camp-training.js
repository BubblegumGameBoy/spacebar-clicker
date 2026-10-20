/* Training has its own explicit panel, so purchases never move under a finger. */
window.CampTraining=(()=>{
 let overlay=null;
 const local=words=>words[Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function output(u,level){
  const interval=Core.interval({...S,ulvl:{...S.ulvl,[u.id]:level}},u);
  return u.worker?(u.id==='woodcutter'?local(['木','Wood','木材']):local(['石','Stone','石材']))+' ＋'+(1+Math.floor(level/5))+' / '+interval.toFixed(2)+local(['秒','s','秒']):statNumber(Core.damage(S,u,level)*Core.formation(S,UNITS))+local(['ダメージ',' damage','伤害'])+' / '+interval.toFixed(1)+local(['秒','s','秒']);
 }
 function render(){
  if(!overlay)return;const focused=document.activeElement?.dataset.campTrain,heroFocus=document.activeElement?.closest('.camp-hero-grid .card')?.dataset.id,toolsOpen=overlay.querySelector('.camp-tools')?.open;const units=UNITS.filter(u=>!u.healer&&u.id!=='porter'&&S.owned[u.id]>0).sort(ArmyView.orderUnits);
  overlay.querySelector('.rx-dialog').innerHTML='<button type="button" class="rx-close" id="trainingClose" aria-label="'+local(['閉じる','Close','关闭'])+'">×</button><span class="rx-kicker">CAMP TRAINING</span><h2>'+local(['なかまを つよくする','Train your allies','强化伙伴'])+'</h2><p class="training-wallet">'+fmt(S.gold)+' G</p><p class="rx-sub">'+local(['ひとつ買うと、同じなかま全員がつよくなります。','One upgrade improves every ally of that type.','每次强化会提升同类型的全部伙伴。'])+'</p><div class="camp-training-grid">'+units.map(u=>{
   const level=S.ulvl[u.id]||0,cost=Core.upgradeCost(S,u),maxed=level>=Core.MAX_LEVEL;
   return '<section class="camp-unit tier-'+Core.tier(level)+'"><img data-unit="'+u.id+'" src="'+(ArmyView.portrait(u)||'../assets/'+u.sprite)+'" alt=""><h3>'+esc(L(u.name))+' ×'+S.owned[u.id]+'</h3><p>Lv.'+level+' · '+output(u,level)+'</p><button type="button" data-camp-train="'+u.id+'" '+(maxed||S.gold<cost?'disabled':'')+'><span>'+local(['つよくする','Train','强化'])+'　'+(maxed?'MAX':fmt(cost)+' G')+'</span><b>Lv.'+level+' → '+Math.min(Core.MAX_LEVEL,level+1)+'</b><small>'+output(u,level)+' → '+output(u,Math.min(Core.MAX_LEVEL,level+1))+'</small></button><small class="camp-evolution">'+local(['つぎの進化','Next evolution','下次进化'])+'　Lv.'+Core.nextEvolution(level)+'</small></section>';
  }).join('')+'</div><details class="camp-tools"'+(toolsOpen?' open':'')+'><summary>'+local(['手でたたく力を つよくする','Improve your manual attacks','强化手动攻击'])+'</summary><div class="camp-hero-grid">'+document.getElementById('pane-hero').innerHTML+'</div></details>';
  overlay.querySelector('#trainingClose').onclick=()=>Rework.close();if(focused)overlay.querySelector('[data-camp-train="'+focused+'"]:not(:disabled)')?.focus({preventScroll:true});
  overlay.querySelectorAll('.camp-hero-grid .card').forEach(card=>{card.setAttribute('role','button');card.tabIndex=0;});if(heroFocus)overlay.querySelector('.camp-hero-grid [data-id="'+heroFocus+'"]')?.focus({preventScroll:true});
 }
 function train(id){
  const u=UNITS.find(u=>u.id===id);if(!u||!S.owned[id]||S.clearedBossWave<1)return;
  const cost=Core.upgradeCost(S,u);if(!Number.isFinite(cost)||S.gold<cost)return;
  const previous=Core.tier(S.ulvl[id]);S.gold-=cost;S.ulvl[id]++;
  const evolution=Core.tier(S.ulvl[id])>previous;renderUnits(evolution?{id,evolution}:undefined);
  if(evolution)Rework.evolved(u);sndLevelUp();renderCards();updateHud();save();render();
 }
 function open(){
  if(S.clearedBossWave<1)return;
  if(!overlay){
   overlay=document.createElement('div');overlay.id='trainingOverlay';overlay.className='rx-overlay';
   overlay.innerHTML='<section class="rx-dialog" role="dialog" aria-modal="true" aria-label="Training" tabindex="-1"></section>';document.body.appendChild(overlay);
   overlay.addEventListener('click',e=>{
    if(e.target===overlay){Rework.close();return;}
    const button=e.target.closest('[data-camp-train]');if(button){if(!button.disabled)train(button.dataset.campTrain);return;}
    const card=e.target.closest('.camp-hero-grid .card');if(!card)return;
    const id=card.dataset.id;if(!HERO.some(h=>h.id===id))return;
    document.querySelector('#pane-hero [data-id="'+id+'"]').click();render();
   });
   overlay.addEventListener('keydown',e=>{const card=e.target.closest('.camp-hero-grid .card');if(card&&(e.key==='Enter'||e.code==='Space')){e.preventDefault();card.click();}});
  }
  render();Rework.openPanel('trainingOverlay');
 }
 return {open,refresh:()=>{if(!overlay?.classList.contains('on'))return;for(const image of overlay.querySelectorAll('img[data-unit]')){const u=UNITS.find(u=>u.id===image.dataset.unit),portrait=ArmyView.portrait(u);if(portrait)image.src=portrait;}}};
})();
