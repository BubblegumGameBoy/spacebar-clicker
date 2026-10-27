/* One visible next action, taught through actual gathering, upgrades and automation. */
window.OutpostTutorial=(()=>{
 'use strict';
 const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))];
 const labels={tap:['木を切る','Chop wood','砍树'],carry:['倉庫へ運ぶ','Drag to warehouse','拖到仓库'],upgrade:['強化する','Upgrade','强化'],hire:['雇う','Hire','雇佣'],place:['ここに置く','Place here','放在这里'],blower:['送風機','Blower','鼓风机'],fence:['柵をひく','Draw a fence','拖出栅栏'],watch:['動きを見よう','Watch it work','看看效果'],boost:['風を強くする','Boost wind','加强风力'],ready:['守る ▶','Defend ▶','防守 ▶']};
 const icons={tap:'☝',carry:'↦',upgrade:'↑',hire:'＋',place:'◎',blower:'➜',fence:'⌁',watch:'◉',boost:'➜',ready:'⚑'};
 let panel=null,signature='',clock=0,lastInput=-Infinity;
 function facts(){const units=window.ArmyView?.sim?.soldiers||[],defenders=units.filter(p=>p.id==='arch'&&p.y<310&&window.Outpost?.covers(p,p.u));return {workerPlaced:units.some(p=>p.id==='woodcutter'),defenders:defenders.length,defendersReady:defenders.length>=2};}
 function snapshot(){const q=OutpostTutorialCore.step(S,facts());return {...q,title:'',detail:'',action:''};}
 // Only the first two deposits get a gesture demonstration. Afterwards the player chooses how to earn the goal.
 function goalQuote(q=snapshot()){
  if(q.skill)return HarvestSkillCore.quote(S,q.skill);
  const unit=q.id==='worker'?'woodcutter':q.id==='defenders'?'arch':null;
  if(unit)return window.ExpeditionCore?.slotQuote?{...ExpeditionCore.slotQuote(S,unit),unit}:{cost:OutpostCore.recipe(unit,S.owned[unit]||0,1),unit};
  if(q.id==='blower')return {cost:{wood:4,stone:0},ready:SupplyFactory.state.inventory.wood>=4};
  return null;
 }
 function visualCue(){
  const q=snapshot(),f=SupplyFactory.state;
  if(!OutpostTutorialCore.basicsLearned(S)){
   const drops=f.drops.filter(d=>d.type==='wood'&&!d.onConveyor&&d.hopperKey==null&&!OutpostCamp.isHeld(d)&&!SupplyFactory.isAirborne(d));
   for(const d of drops){const b=SupplyFactory.pileBounds(d),p={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};if(SupplyFactory.pileAt(p)===d)return {kind:'carry',point:p,to:{...OutpostCore.WORLD.home},dropKey:d.key,type:'wood',step:q.id,basic:true};}
   const n=f.nodes.find(n=>n.type==='wood'&&n.stock>0);return {kind:'tap',point:n?{x:n.x,y:n.y-44}:null,type:'wood',step:q.id,basic:true};
  }
  // Native placement already previews its real footprint and output. Never prescribe an arbitrary spot.
  if(BattleControl.placement||OutpostCamp.layingRails||q.id==='workerPlace')return {kind:'place',point:null,step:q.id};
  if(q.id==='defend')return {kind:'defend',step:q.id};
  const quote=goalQuote(q);
  if(q.skill)return {kind:'upgrade',button:true,step:q.id};
  if(q.id==='blower')return {kind:'blower',button:!!quote?.ready,step:q.id};
  if(quote?.unit)return {kind:'hire',button:!!quote.ready,unit:quote.unit,step:q.id};
  return {kind:'watch',step:q.id};
 }
 function delivered(...args){OutpostTutorialCore.delivered(S,...args);signature='';queueMicrotask(()=>sync(true));}
 function raidAllowed(){return true;}
 function targetSkill(){const q=snapshot();return q.skill||null;}
 function action(){const q=snapshot(),cue=visualCue();
  if(cue.kind==='ready')return;
  if(cue.kind==='upgrade'){window.HarvestSkills?.open(q.skill);return;}
  if(cue.unit){document.querySelector('[data-recruit="'+cue.unit+'"]')?.click();document.getElementById('field').scrollIntoView({block:'start',behavior:'smooth'});sync(true);return;}
  if(cue.kind==='blower'||cue.kind==='fence'){window.PlacementControls?.choose(cue.kind);sync(true);return;}
  if(cue.kind==='place')window.PlacementControls?.choose('allies');
 }
 function revealOptions(t){
  const unlocks=t.visibleOptions||(t.visibleOptions={}),before=JSON.stringify(unlocks),learned=OutpostTutorialCore.basicsLearned(S);
  // Prices must be visible before they are affordable: goals should invite saving, not appear after the saving is done.
  if(learned){unlocks.worker=true;unlocks.blower=true;unlocks.defence=true;unlocks.upgrade=true;}
  document.body.classList.toggle('progressive-intro',S.outpost.cleared<3);document.body.classList.toggle('intro-after-defence',S.outpost.cleared>=1);
  document.body.classList.toggle('intro-basics-learned',learned);
  for(const key of ['worker','blower','defence','upgrade'])document.body.classList.toggle('intro-has-'+key,!!unlocks[key]);
  if(before!==JSON.stringify(unlocks))save();
 }
 const goals={
  worker:[['木こりを雇う','Hire a lumberjack','雇佣伐木工'],['木を切る作業を仲間に任せる','Let an ally gather wood','让伙伴自动伐木']],
  workerPlace:[['木こりの作業場所を選ぶ','Choose a worksite','选择工作位置'],['範囲に木があれば伐採、なければ待機','Chops trees in range; waits if none are nearby','范围内有树则伐木，否则待机']],
  carry1:[['両手で運ぶ','Both hands','双手搬运'],['持てる資材 1 → 2個','Carry 1 → 2 items','携带量 1 → 2个']],
  carry2:[['大きなかご','Large basket','大篮子'],['持てる資材 2 → 4個','Carry 2 → 4 items','携带量 2 → 4个']],
  hand1:[['鋭い刃先','Sharpened tools','锋利刃口'],['採集力 1 → 2：木3打 → 2打','Gathering power 1 → 2: wood 3 hits → 2','采集力1 → 2：木材3次 → 2次']],
  storage1:[['置き場を広げる','Expand storage','扩充存储'],['地面に貯められる資材 12 → 24個','Ground items 12 → 24','地面物资上限 12 → 24个']],
  blower:[['送風機で運ぶ','Transport with wind','用风力搬运'],['落下先に風を当て、矢印を倉庫へ向ける','Cover the drop point with wind; aim toward the warehouse','让风覆盖掉落点，箭头朝向仓库']],
  defenders:[['弓兵を2人配置','Place two archers','放置两名弓箭手'],['上の道に射程を重ねて迎え撃つ','Cover the upper road with their range','让射程覆盖上路']],
  defend:[['敵を迎え撃つ','Defend the camp','守卫营地'],['敵をクリック・Spaceで援護','Click enemies or press Space to help','点击敌人或按空格支援']]
 };
 function goalView(q,cue){
  if(cue.basic)return {title:local(labels[cue.kind]),note:'',cost:null,button:''};
  const goal=goals[q.id]||goals.worker,quote=goalQuote(q),placement=cue.kind==='place';
  return {title:placement?local(['設置場所を選ぶ','Choose a position','选择放置位置']):local(goal[0]),note:placement?local(['予告を見ながら好きな場所で放す','Release where the preview works for you','查看预览后，在合适的位置松开']):local(goal[1]),cost:placement?null:quote?.cost,button:q.skill?local(['スキルツリー','Skill tree','技能树']):cue.kind==='blower'?local(['設置する','Place','放置']):local(['雇う','Hire','雇佣'])};
 }
 function sync(force=false){if(!panel)return;if(!force&&++clock%8)return;const left=Math.ceil(S.outpost.prepRemaining||0);const timer=document.getElementById('introRaidClock');if(timer){timer.hidden=S.outpost.round>0||S.outpost.phase==='active'||OutpostTutorialCore.basicsLearned(S);timer.innerHTML='<canvas width=32 height=28 aria-hidden=true></canvas><span>◷ '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+'</span>';const art=Outpost.look('rat')?.art,f=art?.frames?.[0];if(f){const c=timer.querySelector('canvas'),k=Math.min(30/f.w,26/f.h);c.getContext('2d').drawImage(art.image,f.x,f.y,f.w,f.h,16-f.w*k/2,27-f.h*k,f.w*k,f.h*k);}timer.classList.toggle('is-near',left<=45);timer.setAttribute('aria-label',local(['襲撃まで ','Raid in ','袭击倒计时 '])+left+local(['秒',' seconds','秒']));}const t=OutpostTutorialCore.state(S);if(S.outpost.phase==='active'&&!t.started){t.started=true;save();}const q=snapshot();revealOptions(t);const cue=visualCue(),view=goalView(q,cue),inventory=SupplyFactory.state.inventory,key=JSON.stringify([LANG,q.id,q.progress,t.started,S.outpost.phase,cue.kind,cue.unit,!!cue.button,cue.basic,inventory.wood,inventory.stone]);if(key===signature)return;signature=key;
  panel.hidden=q.id==='complete'||S.outpost.phase==='active';document.body.classList.toggle('learning-worksite',!!cue.basic);document.body.classList.toggle('has-work-goal',!panel.hidden);document.body.dataset.lesson=q.id;
  panel.classList.toggle('is-goal',!cue.basic);panel.dataset.cue=cue.kind;panel.setAttribute('aria-label',view.title);
  panel.querySelector('.onboarding-kicker').textContent=cue.basic?'':local(['次の目標','Next goal','下个目标']);
  const emblem=panel.querySelector('.onboarding-icon');emblem.textContent=icons[cue.kind]||'↑';if(cue.unit){const u=UNITS.find(u=>u.id===cue.unit),src=u&&ArmyView.portrait(u);if(src){const img=document.createElement('img');img.src=src;img.alt='';emblem.replaceChildren(img);}}
  panel.querySelector('.onboarding-label').textContent=view.title;panel.querySelector('.onboarding-note').textContent=view.note;
  const costs=panel.querySelector('.onboarding-costs');costs.replaceChildren();
  for(const type of ['wood','stone'])if(view.cost?.[type]>0){const have=Math.floor(inventory[type]||0),need=view.cost[type],span=document.createElement('span');span.classList.toggle('is-met',have>=need);span.innerHTML=SupplyFactory.icon(type);const text=document.createElement('b');text.textContent=have+' / '+need;span.append(text);span.setAttribute('aria-label',local(type==='wood'?['木材','Wood','木材']:['石材','Stone','石材'])+' '+have+' / '+need);costs.append(span);}
  const button=panel.querySelector('button');button.hidden=!cue.button;button.textContent=view.button;button.setAttribute('aria-label',view.button);panel.classList.toggle('has-action',!!cue.button);
  document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
  if(!panel.hidden)document.getElementById('campaignGoal').hidden=true;
 }

 function draw(ctx,{ox,oy,z}){
  if(!panel||OutpostTutorialCore.basicsLearned(S)||Rework.paused)return;const cue=visualCue(),p=cue.point;if(!p)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,now=performance.now()/1000,phase=reduced?0:(now%2.6)/2.6;
  const x=ox+p.x*z,y=oy+p.y*z,home=cue.to?{x:ox+cue.to.x*z,y:oy+cue.to.y*z}:null;
  ctx.save();
  if(S.outpost.prepRemaining<=60){const look=Outpost.look('rat'),frame=look?.art?.frames?.[0];if(frame){ctx.globalAlpha=.7;const size=Math.max(30,45*z),rx=ox+(OutpostCore.WORLD.entryX-15)*z,ry=oy+OutpostCore.WORLD.upper*z;ctx.drawImage(look.art.image,frame.x,frame.y,frame.w,frame.h,rx-size/2,ry-size,size,size);ctx.globalAlpha=1;ctx.fillStyle='#ffe0a0';ctx.font='900 20px system-ui';ctx.fillText('←',rx-25,ry-5);}}
  ctx.lineWidth=2;ctx.strokeStyle='#ffdf8b';ctx.fillStyle='#ffdf8b22';
  const ring=(x,y,r)=>{ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
  ring(x,y,Math.max(18,25*z));
  if(home){ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+home.x)/2,Math.min(y,home.y)-48,home.x,home.y);ctx.stroke();ctx.setLineDash([]);ring(home.x,home.y,Math.max(25,36*z));ctx.beginPath();ctx.moveTo(home.x+10,home.y-9);ctx.lineTo(home.x,home.y);ctx.lineTo(home.x+13,home.y+4);ctx.stroke();}
  if(OutpostCamp.dragging||performance.now()-lastInput<1000){ctx.restore();return;}
  if(cue.kind==='watch'){ctx.restore();return;}
  let hx=x,hy=y;
  if(home){const t=reduced?0:Math.min(1,Math.max(0,(phase-.15)/.65));hx=x+(home.x-x)*t;hy=y+(home.y-y)*t-Math.sin(t*Math.PI)*35;ctx.globalAlpha=.58;SupplyFactory.drawItem(ctx,cue.type,hx,hy,Math.max(20,28*z));ctx.globalAlpha=1;}
  else if(cue.kind==='fence'){hx=x-(reduced?0:phase*55);hy=y+24;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,y+24);ctx.lineTo(x-55,y+24);ctx.stroke();ctx.setLineDash([]);}
  else if(!reduced)hy-=Math.max(0,Math.sin(phase*Math.PI*4))*9;
  // A drawn hand with its fingertip exactly on the real target (no emoji/platform font dependency).
  ctx.translate(hx,hy);ctx.scale(1.05,1.05);ctx.fillStyle='#fff5d8';ctx.strokeStyle='#684d29';ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-3,-6,-7,-4,-7,0);ctx.lineTo(-7,15);ctx.lineTo(-13,10);ctx.quadraticCurveTo(-18,9,-16,15);ctx.lineTo(-7,30);ctx.quadraticCurveTo(-3,34,5,33);ctx.lineTo(14,31);ctx.lineTo(18,15);ctx.quadraticCurveTo(18,11,13,12);ctx.quadraticCurveTo(12,7,7,10);ctx.quadraticCurveTo(5,6,0,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 function boot(){if(panel)return;OutpostTutorialCore.state(S);panel=document.createElement('section');panel.id='onboardingGuide';panel.innerHTML='<span class="onboarding-icon" aria-hidden="true"></span><div class="onboarding-copy"><small class="onboarding-kicker"></small><span class="onboarding-label"></span><span class="onboarding-note"></span><div class="onboarding-costs"></div></div><button type="button" id="onboardingAction"></button>';document.getElementById('field').append(panel);const timer=document.createElement('div');timer.id='introRaidClock';timer.setAttribute('role','timer');document.getElementById('field').append(timer);panel.querySelector('button').onclick=action;document.getElementById('field').addEventListener('pointerdown',()=>{lastInput=performance.now();},{passive:true});sync(true);}
 return {boot,sync,draw,snapshot,visualCue,targetSkill,delivered,raidAllowed,get active(){return !OutpostTutorialCore.basicsLearned(S);}};
})();
