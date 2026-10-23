/* One visible next action, taught through actual gathering, upgrades and automation. */
window.OutpostTutorial=(()=>{
 'use strict';
 const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))];
 const content={
  gather10:[['木材を10個、倉庫へ運ぼう','Deliver 10 wood to the warehouse','把10份木材运入仓库'],['木を連打すると丸太が落ちます。丸太をつかみ、左の家に重ねて離すと納品できます。','Tap a tree repeatedly to drop logs. Drag each log onto the house on the left, then release.','连续点击树木掉落木材。抓起木材，拖到左侧房屋上松开，即可入库。'],['木を見つける','Show the tree','查看树木']],
  carry1:[['10個たまった！最初の強化へ','10 wood! Make your first upgrade','已有10份木材！进行首次强化'],['スキルツリーで「両手で運ぶ」を習得。木材10個を使うと、一度に2個まで運べます。','Learn Both hands in the skill tree. Spend 10 wood to carry 2 items at once.','在技能树学习“双手搬运”。消耗10木材，一次可携带2个物品。'],['スキルを強化 →','Upgrade a skill →','强化技能 →']],
  worker:[['木こりに採集を任せよう','Let a lumberjack gather','让伐木工替你采集'],['重なった丸太を2個まで一緒に運べるようになりました。次は木材6個で木こりを雇い、木のそばへ自分で配置しましょう。','You can now carry 2 overlapping logs together. Next, deliver 6 wood, hire a lumberjack, and choose its position beside a tree.','现在可同时搬运2个重叠的木材。接下来用6木材雇佣伐木工，亲自选位置放在树旁。'],['木こりのカードへ →','Find the lumberjack →','查看伐木工 →']],
  workerPlace:[['木のそばに木こりを配置','Place your lumberjack beside a tree','将伐木工放在树木旁'],['地面を押したまま、落下地点を確認。好きな位置で離すと配置できます。','Hold the ground to preview the landing point. Release at the position you choose.','按住地面查看掉落地点，在你选定的位置松开放置。'],['配置する →','Place your worker →','放置伙伴 →']],
  workerDrop:[['木こりが切った丸太を運ぼう','Deliver a log cut by your worker','运走伐木工采集的木材'],['木こりは5秒ごとに伐採します。足元に落ちた丸太を、倉庫へドラッグしましょう。','Your lumberjack chops every 5 seconds. Drag a log from its landing point into the warehouse.','伐木工每5秒砍伐一次。把掉落的木材拖入仓库。'],['落下地点を見る','Show the landing point','查看掉落地点']],
  belt:[['運ぶ手間を、コンベアでなくそう','Build away the carrying work','铺设传送带，省去搬运'],['コンベアのカードを選び、倉庫の↔から木こりの落下地点へ引き伸ばします。木材は長さに応じて消費します。','Choose Conveyor. Drag from the house ↔ to the worker’s landing point. Wood cost depends on length.','选择传送带，从房屋↔拖到伐木工的掉落点，木材费用随长度变化。'],['コンベアを選ぶ →','Choose conveyor →','选择传送带 →']],
  automatic:[['丸太が倉庫へ届くか見てみよう','Watch a log reach the warehouse','看看木材能否送达仓库'],['ベルトの上に落ちた資材だけが運ばれます。届かなければ、落下地点とベルトをつなぎ直しましょう。','Only items landing on a belt move. If a log stops, connect the landing point to the house with belts.','只有落在传送带上的物资会被运输。若木材停住，请连接掉落点与仓库。'],['落下地点を確認','Check the landing point','检查掉落地点']],
  gather30:[['次は木材30個で、4個持てるかごへ','Next: 30 wood for a 4-item basket','接下来：30木材换4格篮子'],['自動搬送に任せつつ、自分でも木を連打して納品できます。所持木材30個が次の強化の費用です。','Let the conveyor work, or tap and deliver more yourself. The next upgrade costs 30 wood in storage.','可以等待自动运输，也可以亲自点击采集、搬运。下次强化需要库存30木材。'],['スキルツリーを見る','View the skill tree','查看技能树']],
  carry2:[['大きなかごを作ろう','Make a larger basket','制作大篮子'],['木材30個で持ち運びを強化。一度につかめる資材が2個から4個になります。','Spend 30 wood to increase your carrying capacity from 2 to 4.','消耗30木材，将单次携带上限从2个提升至4个。'],['かごを強化 →','Upgrade the basket →','升级篮子 →']],
  defenders:[['弓兵2人で、上の道を守ろう','Guard the upper road with 2 archers','用2名弓箭手守住上路'],['岩を連打して石材も納品。弓兵を2人雇い、上の道が射程の円に入る場所へ配置します。まだ襲撃は始まりません。','Tap rocks and deliver stone too. Hire 2 archers and place them so their range circles cover the upper road. Raids have not started yet.','连续点击岩石并运入石材。雇佣2名弓箭手，放在射程圆圈能覆盖上路的位置。袭击还不会开始。'],['弓兵のカードへ →','Find archers →','查看弓箭手 →']],
  ready:[['採集・強化・自動化の準備ができた！','Your worksite is ready!','采集、强化和自动化准备完毕！'],['ネズミは街へ届ける物資を狙っています。準備完了を押すと、最初の襲撃まで90秒。その後は時間ごとに襲来します。','Rats want the supplies bound for town. Press Ready to begin a 90-second countdown. Later raids arrive on a timer.','老鼠盯上了运往城镇的物资。点击准备完毕，90秒后首次袭击。之后各波按时来袭。'],['準備完了・90秒後に襲撃','Ready · first raid in 90s','准备完毕·90秒后袭击']],
  gather60:[['次の目標：木材60個で運搬を強化','Next goal: carry more for 60 wood','下个目标：60木材强化搬运'],['6個まで運べる運搬かごが次の目標です。採集・置き場・搬送の枝にも強化が続きます。','Work toward a 6-item basket. Gathering, storage and transport each have further upgrades too.','目标是可携带6个物品的运输篮。采集、堆放和运输分支也能继续升级。'],['スキルツリーを見る','View the skill tree','查看技能树']],
  carry3:[['運搬かごを強化しよう','Upgrade your carrying basket','升级运输篮'],['木材60個で4個から6個へ。運搬の手間を減らし、仲間と設備に資材を回しましょう。','Spend 60 wood to carry 6 instead of 4. Use the saved work to grow your crew and equipment.','消耗60木材，把携带上限从4个提高到6个，节省搬运时间，发展伙伴与设备。'],['運搬を強化 →','Upgrade carrying →','强化搬运 →']]
 };
 let panel=null,signature='',clock=0;
 function facts(){const units=window.ArmyView?.sim?.soldiers||[],defenders=units.filter(p=>p.id==='arch'&&p.y<310&&window.Outpost?.covers(p,p.u));return {workerPlaced:units.some(p=>p.id==='woodcutter'),defenders:defenders.length,defendersReady:defenders.length>=2};}
 function snapshot(){const q=OutpostTutorialCore.step(S,facts()),v=content[q.id];return {...q,title:v?local(v[0]):'',detail:v?local(v[1]):'',action:v?local(v[2]):''};}
 function delivered(...args){OutpostTutorialCore.delivered(S,...args);signature='';}
 function raidAllowed(){return !!OutpostTutorialCore.state(S).started;}
 function targetSkill(){const q=snapshot();return q.skill||null;}
 function action(){const q=snapshot();if(q.id==='ready'){if(OutpostTutorialCore.begin(S,facts())){save();window.Outpost?.update();sync(true);}return;}
  if(q.skill&&q.id!=='gather10'){window.HarvestSkills?.open();return;}
  if(q.id==='worker'){document.querySelector('[data-recruit=woodcutter]')?.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});return;}
  if(q.id==='workerPlace'){window.PlacementControls?.choose('allies');return;}
  if(q.id==='belt'){window.PlacementControls?.choose('belt');return;}
  if(q.id==='defenders'){document.querySelector('[data-recruit=arch]')?.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});return;}
  document.getElementById('field').scrollIntoView({block:'start',behavior:'smooth'});SupplyFactory.choose('wood');
 }
 function sync(force=false){if(!panel)return;if(!force&&++clock%8)return;const q=snapshot(),t=OutpostTutorialCore.state(S),key=JSON.stringify([LANG,q.id,q.progress,t.woodDelivered,t.started,S.harvestSkills]);if(key===signature)return;signature=key;
  panel.hidden=q.id==='complete';document.body.classList.toggle('learning-worksite',!t.started);document.body.dataset.lesson=q.id;
  panel.querySelector('.onboarding-kicker').textContent=local([t.started?'次の強化':'はじめの作業場',t.started?'NEXT UPGRADE':'YOUR FIRST WORKSITE',t.started?'下次强化':'初建作坊']);panel.querySelector('h2').textContent=q.title;panel.querySelector('p').textContent=q.detail;
  panel.querySelector('.onboarding-flow').textContent=local(['① 連打で採集 → ② 倉庫に運ぶ → ③ 強化','① Tap to gather → ② Deliver → ③ Upgrade','① 点击采集 → ② 运入仓库 → ③ 强化']);
  panel.querySelector('.onboarding-progress').textContent=q.goal>1?q.progress+' / '+q.goal+(q.id==='defenders'?local(['人',' archers','人']):local([' 木材',' wood',' 木材'])):'';
  const meter=panel.querySelector('progress');meter.max=q.goal;meter.value=q.progress;meter.hidden=q.goal<=1;
  panel.querySelector('button').textContent=q.action;
  const milestones=panel.querySelector('.onboarding-milestones');milestones.textContent=local(['納品実績（購入費用とは別） ','Delivery record (separate from cost) ','入库记录（不代表库存） '])+t.woodDelivered+local([' 木材',' wood',' 木材'])+' · '+[10,30,60].map(n=>(t.woodDelivered>=n?'✓':'○')+n).join('  ');
  document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
  const selector={carry1:'#harvestSkillsButton',carry2:'#harvestSkillsButton',carry3:'#harvestSkillsButton',worker:'[data-recruit=woodcutter]',belt:'[data-equipment=belt]',defenders:'[data-recruit=arch]'}[q.id];if(selector)document.querySelector(selector)?.classList.add('lesson-target');
  if(!t.started)document.getElementById('campaignGoal').hidden=true;
 }
 function draw(ctx,{ox,oy,z}){if(!panel||raidAllowed())return;const q=snapshot();if(!['gather10','workerDrop','automatic','belt'].includes(q.id))return;const s=SupplyFactory.state,drop=s.drops.find(d=>q.id==='gather10'?d.type==='wood':d.worker),node=s.nodes.find(n=>n.type==='wood'&&n.stock>0),p=drop||node;if(!p)return;
  ctx.save();ctx.strokeStyle='#ffe2a2';ctx.fillStyle='#173529ef';ctx.lineWidth=2;const x=ox+p.x*z,y=oy+p.y*z;
  ctx.beginPath();ctx.ellipse(x,y,Math.max(14,26*z),Math.max(7,11*z),0,0,Math.PI*2);ctx.stroke();
  if(drop&&['gather10','workerDrop'].includes(q.id)){ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(x,y-10);ctx.quadraticCurveTo((x+ox+100*z)/2,y-50,ox+100*z,oy+300*z);ctx.stroke();ctx.setLineDash([]);ctx.font='700 12px system-ui';ctx.textAlign='center';const text=local(['つかんで倉庫へ →','Drag to warehouse →','拖入仓库 →']);const w=ctx.measureText(text).width+14;ctx.fillRect(x-w/2,y+14,w,22);ctx.fillStyle='#ffe2a2';ctx.fillText(text,x,y+29);}
  ctx.restore();
 }
 function boot(){if(panel)return;OutpostTutorialCore.state(S);panel=document.createElement('section');panel.id='onboardingGuide';panel.setAttribute('aria-label','Next objective');panel.innerHTML='<span class="onboarding-kicker"></span><div class="onboarding-flow"></div><h2></h2><p></p><div class="onboarding-meter"><b class="onboarding-progress"></b><progress></progress></div><button type="button" id="onboardingAction"></button><small class="onboarding-milestones"></small>';document.getElementById('deckMain').prepend(panel);panel.querySelector('button').onclick=action;sync(true);}
 return {boot,sync,draw,snapshot,targetSkill,delivered,raidAllowed,get active(){return !raidAllowed();}};
})();
