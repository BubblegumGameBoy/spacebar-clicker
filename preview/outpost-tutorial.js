/* One visible next action, taught through actual gathering, upgrades and automation. */
window.OutpostTutorial=(()=>{
 'use strict';
 const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))];
 const labels={tap:['たたく','Tap','点击'],carry:['家へはこぶ','Drag home','拖到房屋'],upgrade:['強化する','Upgrade','强化'],hire:['雇う','Hire','雇佣'],place:['ここに置く','Place here','放在这里'],blower:['送風機','Blower','鼓风机'],fence:['柵をひく','Draw a fence','拖出栅栏'],watch:['動きを見よう','Watch it work','看看效果'],boost:['風を強くする','Boost wind','加强风力'],ready:['守る ▶','Defend ▶','防守 ▶']};
 const icons={tap:'☝',carry:'↦',upgrade:'↑',hire:'＋',place:'◎',blower:'➜',fence:'⌁',watch:'◉',boost:'➜',ready:'⚑'};
 let panel=null,signature='',clock=0,lastInput=-Infinity;
 function facts(){const units=window.ArmyView?.sim?.soldiers||[],defenders=units.filter(p=>p.id==='arch'&&p.y<310&&window.Outpost?.covers(p,p.u));return {workerPlaced:units.some(p=>p.id==='woodcutter'),defenders:defenders.length,defendersReady:defenders.length>=2};}
 function snapshot(){const q=OutpostTutorialCore.step(S,facts());return {...q,title:'',detail:'',action:''};}
 // One visible operation. This reads real targets; the demonstration never performs input or changes resources.
 function visualCue(){
  const q=snapshot(),f=SupplyFactory.state,pending=Object.values(S.pending||{}).some(n=>n>0);
  const placement=BattleControl.placement||q.id==='workerPlace';
  if(placement){const spots=BattleControl.spots(),p=spots.find(p=>q.id==='workerPlace'?p.x>300&&p.x<390&&p.y>290:p.y<300)||spots[0];return {kind:'place',point:p,step:q.id};}
  if(q.skill&&!q.id.startsWith('gather'))return {kind:'upgrade',button:true,step:q.id};
  if(q.id==='ready')return {kind:'watch',point:{x:OutpostCore.WORLD.entryX-15,y:OutpostCore.WORLD.upper},step:q.id};
  let cost=null,kind='hire',unit=null;
  if(q.id==='worker'){unit='woodcutter';cost=OutpostCore.recipe(unit,S.owned[unit]||0,1);}
  if(q.id==='defenders'){unit='arch';cost=OutpostCore.recipe(unit,S.owned[unit]||0,1);if(pending)return {kind:'place',button:true,step:q.id};}
  if(q.id==='blower') {cost={wood:4};kind='blower';}
  if(q.id==='fence'){cost={wood:4};kind='fence';}
  const missing=cost?['wood','stone'].find(t=>(f.inventory[t]||0)<(cost[t]||0)):q.id.startsWith('gather')?'wood':null;
  if(cost&&!missing){
   if(OutpostCamp.layingRails){const worker=ArmyView.sim.soldiers.find(p=>p.id==='woodcutter'),node=worker&&SupplyFactory.nearby(worker,'wood'),end=node&&SupplyFactory.outputForWorker(worker,node);return {kind:kind==='fence'?'fence':'place',point:end?{x:end.x+40,y:end.y}:null,step:q.id,tool:kind};}
   return {kind,button:true,unit,step:q.id};
  }
  if(q.id==='blowerDeliver'){const p=S.camp.blowers[0];return {kind:'boost',point:p,step:q.id};}
  const type=missing||'wood',workerOnly=q.id==='workerDrop';
  const drops=f.drops.filter(d=>d.type===type&&(!workerOnly||d.worker)&&!d.onConveyor&&d.hopperKey==null&&!OutpostCamp.isHeld(d)&&!SupplyFactory.isAirborne(d));
  for(const d of drops){const b=SupplyFactory.pileBounds(d),p={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};if(SupplyFactory.pileAt(p)===d)return {kind:'carry',point:p,to:{...OutpostCore.WORLD.home},dropKey:d.key,type,step:q.id};}
  if(workerOnly){const p=ArmyView.sim.soldiers.find(p=>p.id==='woodcutter');return {kind:'watch',point:p,step:q.id};}
  const n=f.nodes.find(n=>n.type===type&&n.stock>0);return {kind:'tap',point:n?{x:n.x,y:n.y-(type==='wood'?44:20)}:null,type,step:q.id};
 }
 function delivered(...args){OutpostTutorialCore.delivered(S,...args);signature='';}
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
  const f=SupplyFactory.state,unlocks=t.visibleOptions||(t.visibleOptions={}),before=JSON.stringify(unlocks);
  if(f.inventory.wood>=6||(S.owned.woodcutter||0)>0)unlocks.worker=true;
  if(t.workerDelivered&&(f.inventory.wood>=4||S.camp.blowers.length))unlocks.blower=true;
  if(t.blownWood>0||S.outpost.prepRemaining<=90||S.outpost.cleared>0)unlocks.defence=true;
  if(t.blownWood>0&&f.inventory.wood>=10||(S.harvestSkills?.carry||0)>0)unlocks.upgrade=true;
  document.body.classList.toggle('progressive-intro',S.outpost.cleared<3);document.body.classList.toggle('intro-after-defence',S.outpost.cleared>=1);
  document.body.classList.toggle('intro-has-worker',!!unlocks.worker);document.body.classList.toggle('intro-has-blower',!!unlocks.blower);document.body.classList.toggle('intro-has-defence',!!unlocks.defence);document.body.classList.toggle('intro-has-upgrade',!!unlocks.upgrade);
  if(before!==JSON.stringify(unlocks))save();
 }
 function sync(force=false){if(!panel)return;if(!force&&++clock%8)return;const left=Math.ceil(S.outpost.prepRemaining||0);const timer=document.getElementById('introRaidClock');if(timer){timer.hidden=S.outpost.round>0||S.outpost.phase==='active';timer.innerHTML='<canvas width=32 height=28 aria-hidden=true></canvas><span>◷ '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+'</span>';const art=Outpost.look('rat')?.art,f=art?.frames?.[0];if(f){const c=timer.querySelector('canvas'),k=Math.min(30/f.w,26/f.h);c.getContext('2d').drawImage(art.image,f.x,f.y,f.w,f.h,16-f.w*k/2,27-f.h*k,f.w*k,f.h*k);}timer.classList.toggle('is-near',left<=45);timer.setAttribute('aria-label',local(['襲撃まで ','Raid in ','袭击倒计时 '])+left+local(['秒',' seconds','秒']));}const t=OutpostTutorialCore.state(S);if(S.outpost.phase==='active'&&!t.started){t.started=true;save();}const q=snapshot();revealOptions(t);const cue=visualCue(),key=JSON.stringify([LANG,q.id,q.progress,t.started,cue.kind,cue.type,cue.unit,!!cue.button]);if(key===signature)return;signature=key;
  panel.hidden=t.started||q.id==='complete';document.body.classList.toggle('learning-worksite',!t.started);document.body.dataset.lesson=q.id;
  panel.dataset.cue=cue.kind;panel.setAttribute('aria-label',local(labels[cue.kind]||labels.tap));
  const emblem=panel.querySelector('.onboarding-icon');emblem.textContent=icons[cue.kind]||'◎';if(cue.unit){const u=UNITS.find(u=>u.id===cue.unit),src=u&&ArmyView.portrait(u);if(src){const img=document.createElement('img');img.src=src;img.alt='';emblem.replaceChildren(img);}}
  panel.querySelector('.onboarding-label').textContent=local(labels[cue.kind]||labels.tap);
  const meter=panel.querySelector('progress');meter.max=q.goal;meter.value=q.progress;meter.hidden=q.goal<=1;
  panel.querySelector('.onboarding-progress').textContent=q.goal>1?q.progress+' / '+q.goal:'';
  const button=panel.querySelector('button');button.hidden=!cue.button;button.textContent=local(labels[cue.kind]||labels.tap);button.setAttribute('aria-label',button.textContent);
  panel.classList.toggle('has-action',!!cue.button);
  document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
  if(!t.started)document.getElementById('campaignGoal').hidden=true;
 }
 function draw(ctx,{ox,oy,z}){
  if(!panel||OutpostTutorialCore.state(S).started||Rework.paused)return;const cue=visualCue(),p=cue.point;if(!p)return;
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
 function boot(){if(panel)return;OutpostTutorialCore.state(S);panel=document.createElement('section');panel.id='onboardingGuide';panel.innerHTML='<span class="onboarding-icon" aria-hidden="true"></span><span class="onboarding-label"></span><span class="onboarding-progress"></span><progress aria-label="Progress"></progress><button type="button" id="onboardingAction"></button>';document.getElementById('field').append(panel);const timer=document.createElement('div');timer.id='introRaidClock';timer.setAttribute('role','timer');document.getElementById('field').append(timer);panel.querySelector('button').onclick=action;document.getElementById('field').addEventListener('pointerdown',()=>{lastInput=performance.now();},{passive:true});sync(true);}
 return {boot,sync,draw,snapshot,visualCue,targetSkill,delivered,raidAllowed,get active(){return !OutpostTutorialCore.state(S).started;}};
})();
