/* Inspectable work tree. All twenty-four nodes change parameters used in play. */
window.HarvestSkills=(()=>{
 'use strict';
 const words={
 title:['作業スキルツリー','Work skill tree','工作技能树'],button:['スキルツリー','Skill tree','技能树'],intro:['木材と石材で、手作業を少しずつ楽に。気になるスキルを選ぶと、効果と必要な資材を確認できます。','Turn wood and stone into easier work. Select any skill to inspect its effect and material cost.','消耗木石，让手工作业逐步变轻松。选择任意技能查看效果和材料需求。'],
 carry:['持ち運び','Carry','搬运'],hand:['採集','Gather','采集'],route:['搬送','Transport','运输'],storage:['置き場','Storage','存储'],
 carry1:['両手で運ぶ','Both hands','双手搬运'],carry2:['大きなかご','Large basket','大篮子'],carry3:['背負いかご','Back basket','背篓'],carry4:['荷運びの技','Packing skills','装载技巧'],carry5:['大荷物の達人','Expert carrier','搬运专家'],carry6:['運び屋の極意','Master carrier','搬运大师'],
 hand1:['両刃の斧','Double-edged tools','双刃工具'],hand2:['切り出しの技','Harvesting skills','采集技巧'],hand3:['熟練の採集','Expert harvesting','熟练采集'],hand4:['達人の道具','Master tools','大师工具'],hand5:['豊かな切り出し','Abundant harvest','丰盛采集'],hand6:['採集の極意','Master harvester','采集大师'],
 route1:['滑らかなローラー','Smooth rollers','顺滑滚轮'],route2:['高速ギア','Faster gears','高速齿轮'],route3:['連動ローラー','Linked rollers','联动滚轮'],route4:['精密な歯車','Precision gears','精密齿轮'],route5:['高速搬送','Rapid transport','高速运输'],route6:['搬送の極意','Master transport','运输大师'],
 storage1:['置き場を広げる','Expand storage','扩充存储'],storage2:['大きな置き場','Large storage','大型存储'],storage3:['資材を積み上げる','Higher stacks','堆叠材料'],storage4:['広い資材置き場','Spacious storage','宽敞存储'],storage5:['資材の山','Supply mountain','材料堆积'],storage6:['蓄えの極意','Master stockpile','存储大师'],
 built:['習得済み','Learned','已习得'],learn:['資材を使って習得','Spend materials to learn','消耗材料学习'],previous:['先に習得：','Learn first: ','请先学习：'],rail:['先にコンベアを設置してください','Build a conveyor first','请先放置传送带'],short:['不足：','Still need: ','还缺：'],close:['閉じる','Close','关闭'],wood:['木材','Wood','木材'],stone:['石材','Stone','石材'],
 root:['作業場の成長','Grow your worksite','建设作坊'],inspect:['全スキルを確認できます','Every skill can be inspected','可查看所有技能'],ready:['習得できるスキル','Skills available','可学习技能'],readyShort:['習得可能','Available','可习得'],next:['今の目標','Current goal','当前目标'],cost:['必要な資材','Material cost','所需材料'],change:['習得すると','This upgrade','升级效果'],level:['段階','Tier','阶段'],overview:['全体','All','全部'],
 carryNote:['資材をつかみ、他の資材に触れて追加。倉庫までドラッグして運びます。','Drag an item across others to pick them up too, then release over the warehouse.','拖动物资时碰触其他物资一起携带，再在仓库上松开。'],
 handNote:['木や岩を1回叩くと資材が落ちます。採集スキルで1打に出る資材が増えます。','Each tap on a tree or rock drops materials. Gathering skills increase items per tap.','每次点击树木或岩石都会掉落物资。采集技能增加每次点击的产量。'],
 routeNote:['自分で設置したコンベア上の移動速度。速くしても、つながっていない資材は運ばれません。','Item speed on conveyors you build. Items still need a connected path to the warehouse.','提高自行放置的传送带速度。物资仍需连通仓库的路线。'],
 storageNote:['地面と搬送中の資材の上限。満杯になると採集が止まり、倉庫に運ぶと再開します。','Limit for loose and travelling items. Gathering pauses when full and resumes after delivery.','地面和运输中物资的总上限。满额后暂停采集，入库后恢复。'],
 success:['習得！','Learned!','已习得！'],max:['最終スキル','Final skill','最终技能'],owned:['習得','learned','已习得']
 };
 const li=()=>Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja')),tr=k=>words[k]?.[li()]||k;
 const local=a=>a[li()];
 const emblems={carry:'<path d="M6 10h20l-3 16H9Z M10 10l6-7 6 7 M11 14v8 M16 14v8 M21 14v8"/>',hand:'<path d="M8 27L22 5 M18 4l10 5-4 9-11-6Z"/>',route:'<rect x="3" y="11" width="26" height="13" rx="5"/><path d="M7 16h16l-4-4 M23 16l-4 4 M9 27h0 M23 27h0"/>',storage:'<rect x="3" y="16" width="12" height="12"/><rect x="17" y="16" width="12" height="12"/><rect x="10" y="2" width="12" height="12"/><path d="M3 16l12 12 M17 16l12 12 M10 2l12 12"/>'};
 const glyph=branch=>'<svg viewBox="0 0 32 32" aria-hidden="true">'+emblems[branch]+'</svg>';
 const icon=type=>window.SupplyFactory?.icon(type)||({wood:'◆',stone:'●'}[type]);
 let panel,button,signature='',message='',selected='',filter='all';
 function tutorialTarget(){return typeof window.OutpostTutorial?.targetSkill==='function'?window.OutpostTutorial.targetSkill():null;}
 function effect(branch,tier){const skill={};skill[branch]=tier;const n=HarvestSkillCore.effects(skill);
  if(branch==='storage')return local(['地面に最大 '+n.groundCapacity+'個','Ground limit: '+n.groundCapacity,'地面最多 '+n.groundCapacity+' 个']);
  if(branch==='carry')return local([n.carryCapacity+'個まで持てる','Carry up to '+n.carryCapacity,'最多携带 '+n.carryCapacity+' 个']);
  if(branch==='hand')return local([n.manualHits+'打で'+n.manualYield+'個',n.manualYield+' item'+(n.manualYield===1?'':'s')+' / '+n.manualHits+' hit'+(n.manualHits===1?'':'s'),n.manualHits+' 次点击产出 '+n.manualYield+' 个']);
  return local(['搬送速度 ×'+n.cartSpeed,'Transport speed ×'+n.cartSpeed,'运输速度 ×'+n.cartSpeed]);
 }
 function benefit(branch,tier){return effect(branch,tier);}
 function priceHTML(cost){return ['wood','stone'].filter(type=>cost[type]>0).map(type=>'<span title="'+tr(type)+'">'+icon(type)+'<b>'+cost[type]+'</b></span>').join('');}
 function status(q){return q.built?tr('built'):q.needsPrevious?tr('previous')+tr(q.branch+(q.tier-1)):q.needsRail?tr('rail'):!q.ready?tr('short')+['wood','stone'].filter(type=>q.missing[type]>0).map(type=>tr(type)+' '+Math.ceil(q.missing[type])).join(' / '):tr('ready');}
 function allQuotes(){return HarvestSkillCore.branches.flatMap(branch=>Array.from({length:HarvestSkillCore.MAX_TIER},(_,i)=>HarvestSkillCore.quote(S,branch+(i+1))));}
 function sync(){
  if(!panel)return;const ready=HarvestSkillCore.available(S),target=tutorialTarget(),buttonKey=li()+':'+ready.length;
  if(button.dataset.status!==buttonKey){button.dataset.status=buttonKey;button.innerHTML='<span>'+tr('button')+'</span><b class="harvest-ready-count"'+(!ready.length?' hidden':'')+'>'+ready.length+'</b>';button.setAttribute('aria-label',tr('button')+(ready.length?' · '+tr('ready')+' '+ready.length:''));button.classList.toggle('has-upgrade',ready.length>0);}
  if(!panel.classList.contains('on'))return;
  if(!HarvestSkillCore.quote(S,selected))selected=target||ready[0]?.id||allQuotes().find(q=>!q.built)?.id||'carry1';
  const key=JSON.stringify([li(),S.harvestSkills,S.factory?.inventory,S.camp?.links?.length,S.camp?.platforms?.length,message,selected,filter,target]);if(key===signature)return;signature=key;
  panel.querySelector('h2').textContent=tr('title');panel.querySelector('.harvest-tree-intro').textContent=tr('intro');panel.querySelector('.harvest-tree-close').textContent=tr('close');
  const inv=S.factory?.inventory||{};panel.querySelector('.harvest-tree-wallet').innerHTML=['wood','stone'].map(type=>'<span title="'+tr(type)+'">'+icon(type)+'<b>'+Math.floor(inv[type]||0)+'</b></span>').join('');
  const skills=HarvestSkillCore.migrate(S.harvestSkills),count=Object.values(skills).reduce((a,b)=>a+b,0);
  panel.querySelector('.harvest-tree-root').innerHTML='<strong>'+tr('root')+'</strong><span>'+count+' / 24 '+tr('owned')+'</span>';
  const tabs=panel.querySelector('.harvest-tree-tabs');tabs.setAttribute('aria-label',tr('title'));tabs.innerHTML=['all',...HarvestSkillCore.branches].map(branch=>'<button type="button" data-harvest-branch="'+branch+'" aria-pressed="'+(filter===branch)+'">'+(branch==='all'?tr('overview'):tr(branch))+'</button>').join('');
  const host=panel.querySelector('.harvest-branches'),scroll=panel.querySelector('.harvest-map-scroll'),oldY=scroll.scrollTop;host.replaceChildren();host.classList.toggle('single-branch',filter!=='all');
  for(const branch of HarvestSkillCore.branches){if(filter!=='all'&&filter!==branch)continue;const column=document.createElement('section');column.className='harvest-branch branch-'+branch;column.innerHTML='<header>'+glyph(branch)+'<h3>'+tr(branch)+'</h3><small>'+effect(branch,skills[branch])+'</small></header>';
   for(let tier=1;tier<=HarvestSkillCore.MAX_TIER;tier++){
    const q=HarvestSkillCore.quote(S,branch+tier),node=document.createElement('button');node.type='button';node.dataset.harvestSkill=q.id;node.className='harvest-node'+(q.built?' is-built':'')+(q.ready?' is-ready':'')+(q.locked?' is-locked':'')+(q.id===target?' is-goal':'');node.setAttribute('aria-pressed',String(selected===q.id));node.setAttribute('aria-label',tr(q.id)+' · '+effect(branch,tier)+' · '+status(q));
    node.innerHTML='<span class="harvest-node-emblem">'+glyph(branch)+'<small>'+tier+'</small></span><b>'+tr(q.id)+'</b><span class="harvest-node-effect">'+benefit(branch,tier)+'</span><span class="harvest-node-state">'+(q.built?'✓':q.id===target?tr('next'):q.ready?'● '+tr('readyShort'):priceHTML(q.cost))+'</span>';column.append(node);
   }host.append(column);
  }scroll.scrollTop=oldY;
  const q=HarvestSkillCore.quote(S,selected),detail=panel.querySelector('.harvest-skill-detail');detail.className='harvest-skill-detail branch-'+q.branch;
  detail.innerHTML='<div class="harvest-detail-heading">'+glyph(q.branch)+'<div><small>'+tr(q.branch)+' · '+tr('level')+' '+q.tier+' / 6'+(q.tier===6?' · '+tr('max'):'')+'</small><h3>'+tr(q.id)+'</h3></div></div><div class="harvest-detail-change"><small>'+tr('change')+'</small><span>'+effect(q.branch,q.tier-1)+' <b aria-hidden="true">→</b> <strong>'+benefit(q.branch,q.tier)+'</strong></span></div><p class="harvest-detail-note">'+tr(q.branch+'Note')+'</p><div class="harvest-detail-purchase"><div><small>'+tr('cost')+'</small><span class="harvest-detail-cost">'+priceHTML(q.cost)+'</span></div><button type="button" id="harvestLearn" data-harvest-learn="'+q.id+'" '+(!q.ready?'disabled':'')+'>'+tr(q.built?'built':'learn')+'</button></div><p class="harvest-detail-status" role="status">'+status(q)+'</p>';
  panel.querySelector('.harvest-tree-message').textContent=message;
 }
 function open(id){message='';signature='';selected=HarvestSkillCore.quote(S,id)?id:tutorialTarget()||HarvestSkillCore.available(S)[0]?.id||allQuotes().find(q=>!q.built)?.id||'carry1';filter='all';Rework.openPanel('harvestSkillOverlay');sync();requestAnimationFrame(()=>panel.querySelector('[data-harvest-skill="'+selected+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'}));}
 function buy(id){if(!HarvestSkillCore.purchase(S,id))return false;selected=id;message=tr(id)+' · '+tr('success');window.ForestAudio?.play('place');window.SupplyFactory?.translate();if(typeof updateHud==='function')updateHud();if(typeof renderCards==='function')renderCards();Rework.track('skill_point_spent',{skill:id,currency:'materials'});window.OutpostTutorial?.sync?.();save();signature='';sync();return true;}
 function boot(){if(panel||!window.__OUTPOST_BUILD__)return;const toolbar=document.getElementById('rxToolbar');if(!toolbar)return;button=document.createElement('button');button.type='button';button.id='harvestSkillsButton';button.onclick=()=>open();toolbar.insertBefore(button,document.getElementById('rxArmyTools'));
  panel=document.createElement('div');panel.id='harvestSkillOverlay';panel.className='rx-overlay';panel.innerHTML='<section class="rx-dialog harvest-tree" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="harvestSkillTitle"><header class="harvest-tree-header"><div><h2 id="harvestSkillTitle"></h2><p class="harvest-tree-intro"></p></div><button type="button" class="rx-close harvest-tree-close"></button></header><div class="harvest-tree-wallet"></div><nav class="harvest-tree-tabs" aria-label="Skill branches"></nav><div class="harvest-map-scroll"><div class="harvest-tree-root"></div><div class="harvest-branches"></div></div><section class="harvest-skill-detail"></section><p class="harvest-tree-message" role="status" aria-live="polite"></p></section>';document.body.append(panel);panel.querySelector('.harvest-tree-close').onclick=()=>Rework.close();
  panel.addEventListener('click',e=>{if(e.target===panel){Rework.close();return;}const node=e.target.closest('[data-harvest-skill]'),learn=e.target.closest('[data-harvest-learn]'),tab=e.target.closest('[data-harvest-branch]');if(node){selected=node.dataset.harvestSkill;message='';signature='';sync();panel.querySelector('[data-harvest-skill="'+selected+'"]')?.focus({preventScroll:true});}else if(learn&&!learn.disabled)buy(learn.dataset.harvestLearn);else if(tab){filter=tab.dataset.harvestBranch;if(filter!=='all'&&HarvestSkillCore.quote(S,selected)?.branch!==filter)selected=allQuotes().find(q=>q.branch===filter&&!q.built)?.id||filter+'6';signature='';sync();panel.querySelector('[data-harvest-branch="'+filter+'"]')?.focus({preventScroll:true});}});sync();setInterval(sync,250);
 }
 return {boot,open,buy,sync,effect,get selected(){return selected;}};
})();
HarvestSkills.boot();
