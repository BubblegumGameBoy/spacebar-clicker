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
 root:['作業場の成長','Worksite','建设作坊'],mapHint:['線でつながったスキルを順に習得。枝は自由に選べます。','Learn along each path. Choose which branch to grow.','沿连线逐步习得，自由选择发展分支。'],panHint:['上下左右にスクロールして、全24スキルを見る','Scroll to explore all 24 skills; swipe sideways for other branches','上下左右滚动查看全部24项技能'],inspect:['全スキルを確認できます','Every skill can be inspected','可查看所有技能'],ready:['習得できるスキル','Skills available','可学习技能'],readyShort:['習得可能','Available','可习得'],next:['今の目標','Current goal','当前目标'],cost:['必要な資材','Material cost','所需材料'],change:['習得すると','This upgrade','升级效果'],level:['段階','Tier','阶段'],overview:['全体','All','全部'],
 carryNote:['資材をつかみ、他の資材に触れて追加。倉庫までドラッグして運びます。','Drag an item across others to pick them up too, then release over the warehouse.','拖动物资时碰触其他物资一起携带，再在仓库上松开。'],
 handNote:['木や岩を1回叩くと資材が落ちます。採集スキルで1打に出る資材が増えます。','Each tap on a tree or rock drops materials. Gathering skills increase items per tap.','每次点击树木或岩石都会掉落物资。采集技能增加每次点击的产量。'],
 routeNote:['自分で設置したコンベア上の移動速度。速くしても、つながっていない資材は運ばれません。','Item speed on conveyors you build. Items still need a connected path to the warehouse.','提高自行放置的传送带速度。物资仍需连通仓库的路线。'],
 storageNote:['地面と搬送中の資材の上限。満杯になると採集が止まり、倉庫に運ぶと再開します。','Limit for loose and travelling items. Gathering pauses when full and resumes after delivery.','地面和运输中物资的总上限。满额后暂停采集，入库后恢复。'],
 tapLearn:['習得','Learn','习得'],tapLearnHint:['もう一度押すと習得','Tap again to learn','再点一次即可习得'],carryCap:['持てる数','Carry','可携带'],handCap:['1打で落ちる','Per tap','每次点击'],routeCap:['搬送速度','Transport speed','运输速度'],storageCap:['地面の上限','Ground limit','地面上限'],unit:['個','',' 个'],
 routeHint:['ベルトを倉庫までつなぐと速く運べます','Connect a belt to the warehouse to use the faster rollers','把传送带连到仓库即可更快运输'],
 success:['習得！','Learned!','已习得！'],successMilestone:['節目の習得！','Milestone learned!','达成里程碑！'],successMastery:['極めた！','Branch mastered!','已精通！'],mastered:['極意 ✓','Mastered ✓','精通 ✓'],nextGoal:['次：','Next: ','下一个：'],nextReady:['すぐ習得できます','Ready to learn','可立即学习'],branchDone:['この枝はすべて習得しました','Every skill in this branch is learned','此分支已全部习得'],spent:['使った資材','Spent','已消耗'],max:['最終スキル','Final skill','最终技能'],owned:['習得','learned','已习得']
 };
 const li=()=>Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja')),tr=k=>words[k]?.[li()]??k;
 const local=a=>a[li()];
 const emblems={carry:'<path d="M6 10h20l-3 16H9Z M10 10l6-7 6 7 M11 14v8 M16 14v8 M21 14v8"/>',hand:'<path d="M8 27L22 5 M18 4l10 5-4 9-11-6Z"/>',route:'<rect x="3" y="11" width="26" height="13" rx="5"/><path d="M7 16h16l-4-4 M23 16l-4 4 M9 27h0 M23 27h0"/>',storage:'<rect x="3" y="16" width="12" height="12"/><rect x="17" y="16" width="12" height="12"/><rect x="10" y="2" width="12" height="12"/><path d="M3 16l12 12 M17 16l12 12 M10 2l12 12"/>'};
 const glyph=branch=>'<svg viewBox="0 0 32 32" aria-hidden="true">'+emblems[branch]+'</svg>';
 const icon=type=>window.SupplyFactory?.icon(type)||({wood:'◆',stone:'●'}[type]);
 let panel,button,signature='',message='',selected='',selectedAt=-Infinity,selectedByTap=false,autoId='',filter='all',fx=null,goalMode=false,goalTimer=0,lockUntil=-Infinity,switchLockUntil=-Infinity,lockTimer=0,countFrame=0,fieldPending=new Map(),readyMemo=null,wasOpen=false,openedAt=-Infinity,routeWaiting='',pressAt=-Infinity;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 const now=()=>performance.now();
 const fxAge=()=>fx?now()-fx.at:Infinity;
 // Purchase timeline in ms: the spine segment grows (0-220), then the node lights, bounces and counts up, then the branch value counts.
 // Mastery instead runs the whole spine from tier 1 to tier 6 (80 ms per tier, about 480 ms).
 const T={grow:220,node:220,count:300,header:400,wallet:250,run:80,lock:450,switch:700,switchLock:700,open:600};
 const delay=at=>' style="--fx-d:'+Math.round(at-fxAge())+'ms"';
 const nodeStart=tier=>fx?.kind==='mastery'?(tier-1)*T.run+40:T.node;
 function remainingText(missing){const parts=['wood','stone'].filter(type=>missing[type]>0).map(type=>[tr(type),Math.ceil(missing[type])]);if(!parts.length)return tr('nextReady');return local([parts.map(([n,v])=>'あと'+n+v).join('・'),parts.map(([n,v])=>v+' more '+n.toLowerCase()).join(', '),parts.map(([n,v])=>'还差'+n+' '+v).join('，')]);}
 function shout(id){return tr(id)+local(['！','!','！']);}
 // A once-only label in the field, beside where the new value was first used. It never takes input.
 function fieldCue(id,x,y){const cue=document.createElement('div');cue.className='harvest-field-cue branch-'+HarvestSkillCore.rank(id).branch;cue.setAttribute('aria-hidden','true');cue.textContent=shout(id);cue.style.left=Math.round(x)+'px';cue.style.top=Math.round(y)+'px';document.body.append(cue);setTimeout(()=>cue.remove(),reduced()?1200:900);window.dispatchEvent(new CustomEvent('harvestskill:fielduse',{detail:{id,x,y}}));return cue;}
 function worldToClient(x,y){const r=document.getElementById('battleWorld')?.getBoundingClientRect(),z=window.ArmyView?.camera?.scale||1;return r?{x:r.left+x*z,y:r.top+y*z}:{x:innerWidth/2,y:innerHeight/2};}
 // The camp announces every hand pickup as camp:handpickup {held, capacity, added}. Its own single drag pickup sound is held back
 // (carrying() below) and replaced here by one rising pickup per new item, then the hands-full knock.
 function carrying(){return !!document.getElementById('field')?.classList.contains('dragging-supplies');}
 function onHandPickup(e){const {held=0,capacity=1,added=0}=e.detail||{},before=Math.max(0,held-added),plan=HarvestSkillCore.pickupSchedule(before,held,capacity);
  const steps=plan.sounds.map(s=>()=>window.ForestAudio?.play('pickup',{rate:s.rate}));
  if(plan.full){document.getElementById('campDragGhost')?.classList.add('hand-full');steps.push(()=>window.ForestAudio?.play('handFull',{level:.7}));}
  chain(steps,35,plan.sounds.length?0:35);
  const use=HarvestSkillCore.fieldUse(fieldPending.get('carry'),{held});if(use){fieldPending.delete('carry');const g=document.getElementById('campDragGhost')?.getBoundingClientRect(),x=g?g.left+g.width/2:e.detail?.x??innerWidth/2,y=g?g.top-6:innerHeight/2;fieldCue(use.id,x,y);}}
 // Plays a short run of sounds; each waits for the previous one, so busy frames cannot bunch them under the 28 ms input throttle.
 function chain(steps,gap,first=0){let i=0;const next=()=>{if(i>=steps.length)return;steps[i++]();if(i<steps.length)setTimeout(next,gap);};if(first)setTimeout(next,first);else next();}
 // Manual harvest: from gathering tier 2 every tap adds quiet extra drops; the first tap after learning also gets a label.
 function noteHarvest({node,made}={}){const sound=node?.type==='food'?'pickup':node?.type==='stone'?'stone':'wood',use=HarvestSkillCore.fieldUse(fieldPending.get('hand'),{harvested:made}),extras=HarvestSkillCore.harvestExtras(HarvestSkillCore.migrate(S.harvestSkills).hand,made)||use?.extraSounds||0;
  if(use){fieldPending.delete('hand');const p=worldToClient(node?.x||0,(node?.y||0)-70);fieldCue(use.id,p.x,p.y);}
  chain(Array.from({length:extras},()=>()=>window.ForestAudio?.play(sound,{level:.4})),30,30);}
 function observeField(){const storage=fieldPending.get('storage');if(storage){const drops=S.factory?.drops||[],use=HarvestSkillCore.fieldUse(storage,{ground:drops.length});if(use){fieldPending.delete('storage');const d=drops[drops.length-1],p=worldToClient(d?.x||0,(d?.y||0)-30);fieldCue(use.id,p.x,p.y);}}
  const open=!!panel?.classList.contains('on');if(wasOpen&&!open){const use=HarvestSkillCore.fieldUse(fieldPending.get('route'),{closed:true});if(use){fieldPending.delete('route');routeWaiting=use.id;window.dispatchEvent(new CustomEvent('harvestskill:beltpulse',{detail:{id:use.id,links:S.camp?.links?.length||0}}));}}wasOpen=open;}
 // The camp lights each belt; when the light reaches the warehouse it sends beltpulse-arrived {route:true}. With no belt to the warehouse
 // ({route:false}) the label becomes a short hint, because faster rollers only help items that can reach it.
 function onPulseArrived(e){const id=routeWaiting;routeWaiting='';if(!id)return;const w=document.getElementById('campWarehouse')?.getBoundingClientRect(),x=w?w.left+w.width/2:innerWidth/2,y=w?w.top-8:innerHeight/2;if(e.detail?.route)fieldCue(id,x,y);else{const cue=fieldCue(id,x,y);cue.textContent=tr('routeHint');cue.classList.add('is-hint');}}
 function raiding(){return window.Outpost?.state?.()?.phase==='active';}
 function dragging(){return !!document.getElementById('campDragGhost')||!!document.getElementById('field')?.classList.contains('dragging-supplies');}
 function watchReady(){const ready=HarvestSkillCore.available(S),inTree=!!panel?.classList.contains('on'),previous=readyMemo?.lastNotice,r=HarvestSkillCore.readyNotice(readyMemo,{now:now(),ready,dragging:dragging()||inTree,raid:raiding(),lastPickupAt:window.ForestAudio?.lastPlayed?.('pickup')??-Infinity});readyMemo=r.memo;if(inTree)readyMemo.pending=false;
  if(r.play){const played=window.ForestAudio?.play('skillReady',{level:.6});if(!played&&window.ForestAudio?.settings?.seOn){readyMemo=HarvestSkillCore.readyNoticeFailed(readyMemo,previous);return;}const badge=button?.querySelector('.harvest-ready-count');badge?.classList.remove('ready-up');void badge?.offsetWidth;badge?.classList.add('ready-up');}}
 function tick(){observeField();watchReady();}
 function tutorialTarget(){return typeof window.OutpostTutorial?.targetSkill==='function'?window.OutpostTutorial.targetSkill():null;}
 function effect(branch,tier){const skill={};skill[branch]=tier;const n=HarvestSkillCore.effects(skill);
  if(branch==='storage')return local(['地面に最大 '+n.groundCapacity+'個','Ground limit: '+n.groundCapacity,'地面最多 '+n.groundCapacity+' 个']);
  if(branch==='carry')return local([n.carryCapacity+'個まで持てる','Carry up to '+n.carryCapacity,'最多携带 '+n.carryCapacity+' 个']);
  if(branch==='hand')return local([n.manualHits+'打で'+n.manualYield+'個',n.manualYield+' item'+(n.manualYield===1?'':'s')+' / '+n.manualHits+' hit'+(n.manualHits===1?'':'s'),n.manualHits+' 次点击产出 '+n.manualYield+' 个']);
  return local(['搬送速度 ×'+n.cartSpeed,'Transport speed ×'+n.cartSpeed,'运输速度 ×'+n.cartSpeed]);
 }
 function benefit(branch,tier){return effect(branch,tier);}
 function valueOf(branch,tier){const n=HarvestSkillCore.effects({[branch]:Math.max(0,tier)});return branch==='carry'?n.carryCapacity:branch==='hand'?n.manualYield:branch==='route'?n.cartSpeed:n.groundCapacity;}
 function fmtValue(branch,v){return branch==='route'?'×'+(Math.round(v*100)/100):String(Math.round(v));}
 // The effect as a big number with a small caption. While counting, data-count lets the frame loop update the text.
 function valueHTML(branch,tier,start=null){const v=valueOf(branch,tier),from=valueOf(branch,tier-1),unit=branch==='route'?'':tr('unit'),counting=start!=null&&!reduced()&&fxAge()<start+T.count;const p=counting?Math.max(0,Math.min(1,(fxAge()-start)/T.count)):1;
  return '<span class="harvest-value"><small>'+tr(branch+'Cap')+'</small><strong'+(counting?' data-count="'+[branch,from,v,start].join(',')+'"':'')+'>'+fmtValue(branch,from+(v-from)*p)+'</strong>'+(unit?'<i>'+unit+'</i>':'')+'</span>';}
 function countFrames(){cancelAnimationFrame(countFrame);const step=()=>{if(!panel)return;const age=fxAge();
   for(const el of panel.querySelectorAll('[data-count]')){const [branch,from,to,start]=el.dataset.count.split(','),p=Math.max(0,Math.min(1,(age-Number(start))/T.count));el.textContent=fmtValue(branch,Number(from)+(Number(to)-Number(from))*p);}
   for(const el of panel.querySelectorAll('[data-wallet]')){const [from,to]=el.dataset.wallet.split(',').map(Number),p=Math.max(0,Math.min(1,age/T.wallet));el.textContent=String(Math.round(from+(to-from)*p));}
   if(age<1200)countFrame=requestAnimationFrame(step);};countFrame=requestAnimationFrame(step);}
 function priceHTML(cost){return ['wood','stone'].filter(type=>cost[type]>0).map(type=>'<span title="'+tr(type)+'">'+icon(type)+'<b>'+cost[type]+'</b></span>').join('');}
 function status(q){return q.built?tr('built'):q.needsPrevious?tr('previous')+tr(q.branch+(q.tier-1)):q.needsRail?tr('rail'):!q.ready?tr('short')+['wood','stone'].filter(type=>q.missing[type]>0).map(type=>tr(type)+' '+Math.ceil(q.missing[type])).join(' / '):tr('ready');}
 function allQuotes(){return HarvestSkillCore.branches.flatMap(branch=>Array.from({length:HarvestSkillCore.MAX_TIER},(_,i)=>HarvestSkillCore.quote(S,branch+(i+1))));}
 const blockedUntil=id=>Math.max(lockUntil,id&&id===autoId?switchLockUntil:-Infinity);
 const blocked=id=>now()<blockedUntil(id);
 function select(id,byTap){selected=id;selectedAt=now();selectedByTap=byTap;if(byTap)autoId='';}
 function sync(){
  if(!panel)return;const ready=HarvestSkillCore.available(S),target=tutorialTarget(),buttonKey=li()+':'+ready.length;
  if(button.dataset.status!==buttonKey){button.dataset.status=buttonKey;button.innerHTML='<span>'+tr('button')+'</span><b class="harvest-ready-count"'+(!ready.length?' hidden':'')+'>'+ready.length+'</b>';button.setAttribute('aria-label',tr('button')+(ready.length?' · '+tr('ready')+' '+ready.length:''));button.classList.toggle('has-upgrade',ready.length>0);}
  if(!panel.classList.contains('on'))return;
  // Never rebuild the map under a finger: a node replaced between press and release would swallow the tap.
  if(now()-pressAt<1000)return;
  if(!HarvestSkillCore.quote(S,selected))select(target||ready[0]?.id||allQuotes().find(q=>!q.built)?.id||'carry1',false);
  const lockedNow=blocked(selected),opening=!reduced()&&now()-openedAt<T.open;
  const key=JSON.stringify([li(),S.harvestSkills,S.factory?.inventory,S.camp?.links?.length,S.camp?.platforms?.length,message,selected,filter,target,fx?.at,goalMode,lockedNow,opening]);if(key===signature)return;signature=key;
  panel.querySelector('h2').textContent=tr('title');panel.querySelector('.harvest-tree-intro').textContent=tr('intro');panel.querySelector('.harvest-tree-close').textContent=tr('close');
  const inv=S.factory?.inventory||{},still=reduced(),hotUntil=still?1200:1100;
  panel.querySelector('.harvest-tree-wallet').innerHTML=['wood','stone'].map(type=>{const v=Math.floor(inv[type]||0),spent=fx&&fxAge()<1200&&fx.cost[type]>0,rolling=spent&&!still&&fxAge()<T.wallet;return '<span title="'+tr(type)+'">'+icon(type)+'<b'+(rolling?' data-wallet="'+(v+fx.cost[type])+','+v+'"':'')+'>'+(rolling?Math.round(v+fx.cost[type]*(1-fxAge()/T.wallet)):v)+'</b>'+(spent?'<em class="harvest-spent" aria-label="'+tr('spent')+' '+fx.cost[type]+'"'+delay(0)+'>−'+fx.cost[type]+'</em>':'')+'</span>';}).join('');
  const skills=HarvestSkillCore.migrate(S.harvestSkills),count=Object.values(skills).reduce((a,b)=>a+b,0),masteryHot=fx?.kind==='mastery'&&fxAge()<hotUntil;
  panel.querySelector('.harvest-tree-root').innerHTML='<strong>'+tr('root')+'</strong><span'+(masteryHot?' class="fx-count"'+delay(still?0:480):'')+'>'+count+' / 24 '+tr('owned')+'</span>';
  const tabs=panel.querySelector('.harvest-tree-tabs');tabs.setAttribute('aria-label',tr('title'));tabs.innerHTML=['all',...HarvestSkillCore.branches].map(branch=>'<button type="button" data-harvest-branch="'+branch+'" aria-pressed="'+(filter===branch)+'">'+(branch==='all'?tr('overview'):tr(branch))+'</button>').join('');
  panel.querySelector('.harvest-map-hint').textContent=tr('mapHint');panel.querySelector('.harvest-pan-hint').textContent=tr('panHint');
  const host=panel.querySelector('.harvest-branches'),scroll=panel.querySelector('.harvest-map-scroll'),oldY=scroll.scrollTop,oldX=scroll.scrollLeft;scroll.classList.toggle('is-focused',filter!=='all');host.replaceChildren();host.classList.toggle('single-branch',filter!=='all');
  for(const branch of HarvestSkillCore.branches){if(filter!=='all'&&filter!==branch)continue;const column=document.createElement('section'),fills=HarvestSkillCore.spine(S,branch),hot=fx&&fx.branch===branch&&fxAge()<hotUntil;column.className='harvest-branch branch-'+branch;
   column.innerHTML='<header'+(skills[branch]>=6?' class="is-mastered"':'')+'>'+glyph(branch)+'<h3>'+tr(branch)+(skills[branch]>=6?' <em class="harvest-mastered'+(hot&&fx.kind==='mastery'?' fx-value':'')+'"'+(hot?delay(still?0:480):'')+'>'+tr('mastered')+'</em>':'')+'</h3><div'+(hot?' class="fx-value"'+delay(still?0:T.header):'')+'>'+valueHTML(branch,skills[branch],hot?T.header:null)+'</div></header>';
   for(let tier=1;tier<=HarvestSkillCore.MAX_TIER;tier++){
    const q=HarvestSkillCore.quote(S,branch+tier),node=document.createElement('button'),live=fx&&fxAge()<1600,own=live&&fx.id===q.id,lit=live&&fx.kind==='mastery'&&fx.branch===branch,isSel=selected===q.id,pill=isSel&&q.ready&&!lockedNow;
    node.type='button';node.dataset.harvestSkill=q.id;node.dataset.tier=tier;
    node.className='harvest-node'+(q.built?' is-built':q.ready?' is-ready':' is-dim')+(q.locked?' is-locked':'')+(!q.built&&!q.needsPrevious?' is-next':'')+(tier===3?' is-milestone':'')+(tier===6?' is-medal':'')+(q.id===target?' is-goal':'')+(tier===6&&q.needsPrevious?' is-far':'')+(own?' fx-learn fx-'+fx.kind:'')+(lit?' fx-lit':'')+(opening&&q.ready?' fx-open':'');
    if(own||lit)node.style.setProperty('--fx-d',Math.round((still?0:nodeStart(tier))-fxAge())+'ms');if(lit)node.style.setProperty('--run-d',Math.round((tier-1)*T.run-fxAge())+'ms');if(opening&&q.ready)node.style.setProperty('--open-d',Math.round(openedAt-now())+'ms');
    node.setAttribute('aria-pressed',String(isSel));node.setAttribute('aria-label',tr(q.id)+' · '+effect(branch,tier)+' · '+status(q)+(pill?' · '+tr('tapLearnHint'):''));
    const grow=own&&!still&&fx.kind!=='mastery'&&fxAge()<T.grow,link='<i class="harvest-link'+(grow?' fx-grow':'')+'" aria-hidden="true" style="--fill:'+fills[tier-1]+';--built:'+(q.built?1:0)+(grow?';--fx-d:'+Math.round(-fxAge())+'ms':'')+'"><b></b><i></i></i>';
    const sparks=own&&fx.kind==='milestone'&&!still?'<span class="harvest-sparks">'+Array.from({length:7},(_,i)=>'<i style="--a:'+(i*360/7+12)+'deg"></i>').join('')+'</span>':'';
    node.innerHTML=link+'<span class="harvest-node-emblem">'+glyph(branch)+'<small>'+tier+'</small></span><b>'+tr(q.id)+'</b>'+valueHTML(branch,tier,own?nodeStart(tier):null)+'<span class="harvest-node-state">'+(q.built?'✓':q.ready?'<span class="harvest-node-cost">'+priceHTML(q.cost)+'</span>':q.needsPrevious?'↟ '+(tier-1):'<span class="harvest-node-cost">'+priceHTML(q.cost)+'</span>')+'</span>'+(pill?'<span class="harvest-node-learn" data-harvest-pill>'+tr('tapLearn')+'</span>':'')+(own||lit?'<span class="harvest-node-fx" aria-hidden="true">'+sparks+'</span>':'')+(opening&&q.ready?'<span class="harvest-node-sweep" aria-hidden="true"></span>':'');column.append(node);
   }host.append(column);
  }scroll.scrollTop=oldY;scroll.scrollLeft=oldX;
  const q=HarvestSkillCore.quote(S,selected),detail=panel.querySelector('.harvest-skill-detail'),hotDetail=fx&&fxAge()<hotUntil&&fx.id===q.id,goal=goalMode?HarvestSkillCore.nextGoal(S,q.branch):null,showGoal=goal&&goal.id===q.id&&!q.built,done=goalMode&&q.built&&q.tier===6;detail.className='harvest-skill-detail branch-'+q.branch+(showGoal?' is-next-goal':'');
  // The foot row keeps one fixed height whether it shows the status, the next goal or the mastered line, so the panel never jumps.
  const foot=showGoal?'<div class="harvest-next-goal" role="status"><span><b>'+tr('nextGoal')+tr(q.id)+'</b>'+local(['／',' · ','／'])+remainingText(goal.missing)+'</span><i class="harvest-goal-bar" style="--goal:'+Math.round(goal.progress*100)+'%"><i></i></i></div>':done?'<div class="harvest-next-goal is-done" role="status"><span><b>'+tr('mastered')+'</b>'+local(['／',' · ','／'])+tr('branchDone')+'</span></div>':'<p class="harvest-detail-status" role="status">'+status(q)+'</p>';
  detail.innerHTML='<div class="harvest-detail-heading">'+glyph(q.branch)+'<div><small>'+tr(q.branch)+' · '+tr('level')+' '+q.tier+' / 6'+(q.tier===6?' · '+tr('max'):'')+'</small><h3>'+tr(q.id)+'</h3></div></div><div class="harvest-detail-change"><small>'+tr('change')+'</small><span>'+effect(q.branch,q.tier-1)+' <b aria-hidden="true">→</b> <strong'+(hotDetail?' class="fx-value"'+delay(still?0:T.header):'')+'>'+benefit(q.branch,q.tier)+'</strong></span></div><p class="harvest-detail-note">'+tr(q.branch+'Note')+'</p><div class="harvest-detail-purchase"><div><small>'+tr('cost')+'</small><span class="harvest-detail-cost">'+priceHTML(q.cost)+'</span></div><button type="button" id="harvestLearn" data-harvest-learn="'+q.id+'" '+(!q.ready?'disabled':lockedNow?'aria-disabled="true" class="is-wait"':'')+'>'+tr(q.built?'built':'learn')+'</button></div><div class="harvest-detail-foot">'+foot+'</div>';
  panel.querySelector('.harvest-tree-message').textContent=message;
  // Animation delays above were measured at this render; anchor the new CSS animations to it, so a slow first frame cannot push the
  // grow -> light -> number order late.
  const renderedAt=now();if(fx&&fxAge()<1600||now()-openedAt<T.open)for(const a of panel.getAnimations({subtree:true}))if(a.startTime==null&&String(a.animationName||'').startsWith('harvest-'))try{a.startTime=renderedAt;}catch(_){}
 }
 function resyncAt(at){clearTimeout(lockTimer);const wait=at-now();if(wait>0)lockTimer=setTimeout(()=>{signature='';sync();},wait+20);}
 function open(id){openedAt=now();message='';signature='';goalMode=false;clearTimeout(goalTimer);autoId='';
  if(HarvestSkillCore.available(S).length&&!panel?.classList.contains('on')){const sound=()=>window.ForestAudio?.play('treeOpen',{level:.5});if(!sound()&&window.ForestAudio?.settings?.seOn)setTimeout(sound,40);}
  select(HarvestSkillCore.quote(S,id)?id:tutorialTarget()||HarvestSkillCore.available(S)[0]?.id||allQuotes().find(q=>!q.built)?.id||'carry1',false);filter='all';Rework.openPanel('harvestSkillOverlay');sync();resyncAt(openedAt+T.open);requestAnimationFrame(()=>panel.querySelector('[data-harvest-skill="'+selected+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'}));}
 function buy(id){if(blocked(id))return false;const before=HarvestSkillCore.effects(S.harvestSkills),cost={...HarvestSkillCore.quote(S,id)?.cost};if(!HarvestSkillCore.purchase(S,id))return false;const rank=HarvestSkillCore.rank(id);select(id,false);goalMode=false;autoId='';fx={id,branch:rank.branch,tier:rank.tier,kind:rank.kind,cost,at:now()};lockUntil=fx.at+T.lock;resyncAt(lockUntil);
  message=tr(id)+' · '+tr(rank.kind==='mastery'?'successMastery':rank.kind==='milestone'?'successMilestone':'success');
  // Learning is its own cue (not the generic place); milestone matches reinforce, mastery stays under victory.
  window.ForestAudio?.play(rank.kind==='mastery'?'mastery':rank.kind==='milestone'?'skillMilestone':'skill',{branch:HarvestSkillCore.branches.indexOf(rank.branch),level:rank.kind==='mastery'?.85:rank.kind==='milestone'?1:.85});
  fieldPending.set(rank.branch,{id,branch:rank.branch,before,after:HarvestSkillCore.effects(S.harvestSkills)});
  // 700 ms later the detail moves on to the next tier. That learn button stays disabled for a further 700 ms so repeated taps cannot buy it.
  clearTimeout(goalTimer);goalTimer=setTimeout(()=>{if(!panel?.classList.contains('on')||selected!==id)return;const next=HarvestSkillCore.nextGoal(S,rank.branch);if(next){select(next.id,false);autoId=next.id;switchLockUntil=now()+T.switchLock;resyncAt(switchLockUntil);}goalMode=true;signature='';sync();},T.switch);
  window.dispatchEvent(new CustomEvent('harvestskill:learned',{detail:{id,branch:rank.branch,tier:rank.tier,kind:rank.kind}}));window.SupplyFactory?.translate();if(typeof updateHud==='function')updateHud();if(typeof renderCards==='function')renderCards();Rework.track('skill_point_spent',{skill:id,currency:'materials'});window.OutpostTutorial?.sync?.();save();signature='';sync();countFrames();
  if(rank.kind==='mastery'&&innerWidth<=680)panel.querySelector('.branch-'+rank.branch+'>header')?.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'});
  return true;}
 function tapNode(node,e){const id=node.dataset.harvestSkill,q=HarvestSkillCore.quote(S,id),act=HarvestSkillCore.tapAction({id,selected,selectedAt,byTap:selectedByTap,now:now(),ready:!!q?.ready,pill:!!e.target.closest('[data-harvest-pill]'),lockUntil:blockedUntil(id)});
  if(act==='buy'){buy(id);return;}
  if(act==='arm'){selectedAt=now();selectedByTap=true;autoId='';return;}
  if(act==='select'){select(id,true);goalMode=false;message='';signature='';sync();panel.querySelector('[data-harvest-skill="'+selected+'"]')?.focus({preventScroll:true});}}
 function boot(){if(panel||!window.__OUTPOST_BUILD__)return;const toolbar=document.getElementById('rxToolbar');if(!toolbar)return;button=document.createElement('button');button.type='button';button.id='harvestSkillsButton';button.onclick=()=>open();toolbar.insertBefore(button,document.getElementById('rxArmyTools'));
  panel=document.createElement('div');panel.id='harvestSkillOverlay';panel.className='rx-overlay';panel.innerHTML='<section class="rx-dialog harvest-tree" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="harvestSkillTitle"><header class="harvest-tree-header"><div><h2 id="harvestSkillTitle"></h2><p class="harvest-tree-intro"></p></div><button type="button" class="rx-close harvest-tree-close"></button></header><div class="harvest-tree-wallet"></div><nav class="harvest-tree-tabs" aria-label="Skill branches"></nav><p class="harvest-map-hint"></p><div class="harvest-map-scroll"><div class="harvest-map-stage"><div class="harvest-tree-root"></div><div class="harvest-branches"></div></div></div><p class="harvest-pan-hint"></p><section class="harvest-skill-detail"></section><p class="harvest-tree-message" role="status" aria-live="polite"></p></section>';document.body.append(panel);panel.querySelector('.harvest-tree-close').onclick=()=>Rework.close();
  // pointerup -> mouseup -> click run in one task; rebuilding before the click would drop it, so the catch-up sync waits a task.
  panel.addEventListener('pointerdown',()=>{pressAt=now();},true);for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>{if(pressAt>-Infinity){pressAt=-Infinity;setTimeout(sync,0);}},true);
  window.addEventListener('camp:handpickup',onHandPickup);window.addEventListener('harvestskill:beltpulse-arrived',onPulseArrived);
  panel.addEventListener('click',e=>{if(e.target===panel){Rework.close();return;}const node=e.target.closest('[data-harvest-skill]'),learn=e.target.closest('[data-harvest-learn]'),tab=e.target.closest('[data-harvest-branch]');if(node)tapNode(node,e);else if(learn&&!learn.disabled){const id=learn.dataset.harvestLearn;
   // Taps that keep landing on the button right after the auto switch extend the wait, so only a deliberate later tap can learn the next tier.
   if(blocked(id)){if(id===autoId){switchLockUntil=Math.max(switchLockUntil,now()+500);resyncAt(switchLockUntil);}return;}buy(id);}else if(tab){filter=tab.dataset.harvestBranch;if(filter!=='all'&&HarvestSkillCore.quote(S,selected)?.branch!==filter)select(allQuotes().find(q=>q.branch===filter&&!q.built)?.id||filter+'6',true);signature='';sync();const scroller=panel.querySelector('.harvest-map-scroll');scroller.scrollTop=0;scroller.scrollLeft=0;panel.querySelector('[data-harvest-branch="'+filter+'"]')?.focus({preventScroll:true});}});sync();setInterval(sync,250);setInterval(tick,60);
 }
 return {boot,open,buy,sync,effect,noteHarvest,carrying,get selected(){return selected;},get fieldPending(){return [...fieldPending.keys()];}};
})();
HarvestSkills.boot();
