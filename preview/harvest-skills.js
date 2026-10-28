/* Inspectable work tree. All twenty-four nodes change parameters used in play. */
window.HarvestSkills=(()=>{
 'use strict';
 const words={
 title:['作業スキルツリー','Work skill tree','工作技能树'],button:['スキルツリー','Skill tree','技能树'],intro:['木材と石材で、手作業を少しずつ楽に。気になるスキルを選ぶと、効果と必要な資材を確認できます。','Turn wood and stone into easier work. Select any skill to inspect its effect and material cost.','消耗木石，让手工作业逐步变轻松。选择任意技能查看效果和材料需求。'],
 carry:['持ち運び','Carry','搬运'],hand:['採集力','Gathering power','采集力'],route:['搬送','Transport','运输'],storage:['地面の置き場','Ground storage','地面存储'],
 carry1:['両手で運ぶ','Both hands','双手搬运'],carry2:['大きなかご','Large basket','大篮子'],carry3:['背負いかご','Back basket','背篓'],carry4:['荷運びの技','Packing skills','装载技巧'],carry5:['大荷物の達人','Expert carrier','搬运专家'],carry6:['運び屋の極意','Master carrier','搬运大师'],
 hand1:['鋭い刃先','Sharpened tools','锋利刃口'],hand2:['切り出しの技','Harvesting skills','采集技巧'],hand3:['熟練の採集','Expert harvesting','熟练采集'],hand4:['達人の道具','Master tools','大师工具'],hand5:['豊かな切り出し','Abundant harvest','丰盛采集'],hand6:['採集の極意','Master harvester','采集大师'],
 route1:['滑らかなローラー','Smooth rollers','顺滑滚轮'],route2:['高速ギア','Faster gears','高速齿轮'],route3:['連動ローラー','Linked rollers','联动滚轮'],route4:['精密な歯車','Precision gears','精密齿轮'],route5:['高速搬送','Rapid transport','高速运输'],route6:['搬送の極意','Master transport','运输大师'],
 storage1:['置き場を広げる','Expand storage','扩充存储'],storage2:['大きな置き場','Large storage','大型存储'],storage3:['資材を積み上げる','Higher stacks','堆叠材料'],storage4:['広い資材置き場','Spacious storage','宽敞存储'],storage5:['資材の山','Supply mountain','材料堆积'],storage6:['蓄えの極意','Master stockpile','存储大师'],
 built:['習得済み','Learned','已习得'],learn:['資材を使って習得','Spend materials to learn','消耗材料学习'],previous:['先に習得：','Learn first: ','请先学习：'],rail:['先にコンベアを設置してください','Build a conveyor first','请先放置传送带'],short:['不足：','Still need: ','还缺：'],close:['閉じる','Close','关闭'],wood:['木材','Wood','木材'],stone:['石材','Stone','石材'],
 root:['作業場の成長','Worksite','建设作坊'],mapHint:['線でつながったスキルを順に習得。枝は自由に選べます。','Learn along each path. Choose which branch to grow.','沿连线逐步习得，自由选择发展分支。'],panHint:['上下左右にスクロールして、全24スキルを見る','Scroll to explore all 24 skills; swipe sideways for other branches','上下左右滚动查看全部24项技能'],inspect:['全スキルを確認できます','Every skill can be inspected','可查看所有技能'],ready:['習得できるスキル','Skills available','可学习技能'],readyShort:['習得可能','Available','可习得'],next:['今の目標','Current goal','当前目标'],cost:['必要な資材','Material cost','所需材料'],change:['習得すると','This upgrade','升级效果'],level:['段階','Tier','阶段'],overview:['全体','All','全部'],
 carryNote:['資材をつかみ、他の資材に触れて追加。倉庫までドラッグして運びます。','Drag an item across others to pick them up too, then release over the warehouse.','拖动物资时碰触其他物资一起携带，再在仓库上松开。'],
 handNote:['打数はゲージが空のときの目安。余った採集力は次に持ち越し、強くなると1打で複数の資材が落ちます。仲間の採集速度は変わりません。','Tap counts start from an empty gauge. Leftover power carries over, so stronger tools can drop several pieces per tap. Allies keep their own gathering speed.','点击次数从空进度条开始计算。剩余采集力会保留，强化后每次可掉落多件物资。不改变伙伴的采集速度。'],
 routeNote:['自分で設置したコンベア上の移動速度。速くしても、つながっていない資材は運ばれません。','Item speed on conveyors you build. Items still need a connected path to the warehouse.','提高自行放置的传送带速度。物资仍需连通仓库的路线。'],
 storageNote:['地面と搬送中の資材の合計上限。満杯になると採集が止まり、倉庫に納品すると再開します。仲間の配置枠や倉庫の在庫とは別です。','Total limit for loose and travelling items. Deliver some to restart gathering when full. This is separate from ally slots and warehouse stock.','地面和运输中物资的总上限。满额后采集暂停，入库后恢复。与伙伴位置数和仓库库存无关。'],
 tapLearn:['習得','Learn','习得'],tapLearnHint:['もう一度押すと習得','Tap again to learn','再点一次即可习得'],carryCap:['持てる数','Carry','可携带'],handCap:['採集力','Power','采集力'],routeCap:['搬送速度','Transport speed','运输速度'],storageCap:['地面の資材上限','Ground capacity','地面物资上限'],unit:['個','',' 个'],currentEffect:['前の段階','Previous tier','前一阶段'],nextEffect:['習得後','After','习得后'],resource:['資材','Material','物资'],
 routeHint:['ベルトを倉庫までつなぐと速く運べます','Connect a belt to the warehouse to use the faster rollers','把传送带连到仓库即可更快运输'],
 success:['習得！','Learned!','已习得！'],successMilestone:['節目の習得！','Milestone learned!','达成里程碑！'],successMastery:['極めた！','Branch mastered!','已精通！'],mastered:['極意 ✓','Mastered ✓','精通 ✓'],nextGoal:['次：','Next: ','下一个：'],nextReady:['すぐ習得できます','Ready to learn','可立即学习'],branchDone:['この枝はすべて習得しました','Every skill in this branch is learned','此分支已全部习得'],spent:['使った資材','Spent','已消耗'],max:['最終スキル','Final skill','最终技能'],owned:['習得','learned','已习得']
 };
 const li=()=>Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja')),tr=k=>words[k]?.[li()]??k;
 const local=a=>a[li()];
 const emblems={carry:'<path d="M6 10h20l-3 16H9Z M10 10l6-7 6 7 M11 14v8 M16 14v8 M21 14v8"/>',hand:'<path d="M8 27L22 5 M18 4l10 5-4 9-11-6Z"/>',route:'<rect x="3" y="11" width="26" height="13" rx="5"/><path d="M7 16h16l-4-4 M23 16l-4 4 M9 27h0 M23 27h0"/>',storage:'<rect x="3" y="16" width="12" height="12"/><rect x="17" y="16" width="12" height="12"/><rect x="10" y="2" width="12" height="12"/><path d="M3 16l12 12 M17 16l12 12 M10 2l12 12"/>'};
 const glyph=branch=>'<svg viewBox="0 0 32 32" aria-hidden="true">'+emblems[branch]+'</svg>';
 const icon=type=>window.SupplyFactory?.icon(type)||({wood:'◆',stone:'●'}[type]);
 let panel,button,signature='',message='',selected='',selectedAt=-Infinity,selectedByTap=false,fx=null,lockUntil=-Infinity,lockTimer=0,countFrame=0,fieldPending=new Map(),readyMemo=null,wasOpen=false,openedAt=-Infinity,routeWaiting='',pressAt=-Infinity,pan=null;
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
 function noteHarvest({node,made}={}){const sound=node?.type==='food'?'pickup':node?.type==='stone'||node?.type==='iron'?'stone':'wood',use=HarvestSkillCore.fieldUse(fieldPending.get('hand'),{harvested:made}),extras=HarvestSkillCore.harvestExtras(HarvestSkillCore.migrate(S.harvestSkills).hand,made)||use?.extraSounds||0;
  if(use){fieldPending.delete('hand');const p=worldToClient(node?.x||0,(node?.y||0)-70);fieldCue(use.id,p.x,p.y);}
  chain(Array.from({length:extras},()=>()=>window.ForestAudio?.play(sound,{level:.4})),30,30);}
 function observeField(){const storage=fieldPending.get('storage');if(storage){const drops=S.factory?.drops||[],use=HarvestSkillCore.fieldUse(storage,{ground:drops.length});if(use){fieldPending.delete('storage');const d=drops[drops.length-1],p=worldToClient(d?.x||0,(d?.y||0)-30);fieldCue(use.id,p.x,p.y);}}
  const open=!!panel?.classList.contains('on');if(wasOpen&&!open){const use=HarvestSkillCore.fieldUse(fieldPending.get('route'),{closed:true});if(use){fieldPending.delete('route');routeWaiting=use.id;window.dispatchEvent(new CustomEvent('harvestskill:beltpulse',{detail:{id:use.id,links:S.camp?.links?.length||0}}));}}wasOpen=open;}
 // The camp lights each belt; when the light reaches the warehouse it sends beltpulse-arrived {route:true}. With no belt to the warehouse
 // ({route:false}) the label becomes a short hint, because faster rollers only help items that can reach it.
 function onPulseArrived(e){const id=routeWaiting;routeWaiting='';if(!id)return;const w=document.getElementById('campWarehouse')?.getBoundingClientRect(),x=w?w.left+w.width/2:innerWidth/2,y=w?w.top-8:innerHeight/2;if(e.detail?.route)fieldCue(id,x,y);else{const cue=fieldCue(id,x,y);cue.textContent=tr('routeHint');cue.classList.add('is-hint');}}
 function raiding(){return window.Outpost?.state?.()?.phase==='active';}
 function dragging(){return !!document.getElementById('campDragGhost')||!!document.getElementById('field')?.classList.contains('dragging-supplies');}
 function watchReady(){const ready=window.ProgressionCore?.available(S)||[],inTree=!!panel?.classList.contains('on'),previous=readyMemo?.lastNotice,r=HarvestSkillCore.readyNotice(readyMemo,{now:now(),ready,dragging:dragging()||inTree,raid:raiding(),lastPickupAt:window.ForestAudio?.lastPlayed?.('pickup')??-Infinity});readyMemo=r.memo;if(inTree)readyMemo.pending=false;
  if(r.play){const played=window.ForestAudio?.play('skillReady',{level:.6});if(!played&&window.ForestAudio?.settings?.seOn){readyMemo=HarvestSkillCore.readyNoticeFailed(readyMemo,previous);return;}const badge=button?.querySelector('.harvest-ready-count');badge?.classList.remove('ready-up');void badge?.offsetWidth;badge?.classList.add('ready-up');}}
 function tick(){observeField();watchReady();}
 function tutorialTarget(){return typeof window.OutpostTutorial?.targetSkill==='function'?window.OutpostTutorial.targetSkill():null;}
 function effect(branch,tier){const skill={};skill[branch]=tier;const n=HarvestSkillCore.effects(skill);
  if(branch==='storage')return local(['地面に最大 '+n.groundCapacity+'個','Ground limit: '+n.groundCapacity,'地面最多 '+n.groundCapacity+' 个']);
  if(branch==='carry')return local([n.carryCapacity+'個まで持てる','Carry up to '+n.carryCapacity,'最多携带 '+n.carryCapacity+' 个']);
  if(branch==='hand')return local(['採集力 '+n.manualPower,'Gathering power '+n.manualPower,'采集力 '+n.manualPower]);
  return local(['搬送速度 ×'+n.cartSpeed,'Transport speed ×'+n.cartSpeed,'运输速度 ×'+n.cartSpeed]);
 }
 function benefit(branch,tier){return effect(branch,tier);}
 // Concrete tap output comes from the same thresholds as the harvesting simulation.
 // The first-output count is for an empty node gauge; overflow remains on that node.
 function strikeText(tier,type){const p=HarvestSkillCore.harvestProfile({hand:tier},type);if(p.power<p.required)return local([p.hits+'打で1個',p.hits+' taps for 1',p.hits+'次点击得1件']);const low=Math.floor(p.yieldPerStrike),high=Math.ceil(p.yieldPerStrike),quantity=low===high?String(low):low+'–'+high;return local(['1打で'+quantity+'個',quantity+' per tap','每次'+quantity+'件']);}
 function powerPreview(tier){return '<table class="harvest-power-preview"><thead><tr><th>'+tr('resource')+'</th><th>'+tr('currentEffect')+'</th><th>'+tr('nextEffect')+'</th></tr></thead><tbody>'+['wood','stone'].map(type=>'<tr><th>'+icon(type)+' '+tr(type)+'</th><td>'+strikeText(tier-1,type)+'</td><td>'+strikeText(tier,type)+'</td></tr>').join('')+'</tbody></table>';}
 function valueOf(branch,tier){const n=HarvestSkillCore.effects({[branch]:Math.max(0,tier)});return branch==='carry'?n.carryCapacity:branch==='hand'?n.manualPower:branch==='route'?n.cartSpeed:n.groundCapacity;}
 function fmtValue(branch,v){return branch==='route'?'×'+(Math.round(v*100)/100):String(Math.round(v));}
 // The effect as a big number with a small caption. While counting, data-count lets the frame loop update the text.
 function valueHTML(branch,tier,start=null){const v=valueOf(branch,tier),from=valueOf(branch,tier-1),unit=branch==='route'||branch==='hand'?'':tr('unit'),counting=start!=null&&!reduced()&&fxAge()<start+T.count;const p=counting?Math.max(0,Math.min(1,(fxAge()-start)/T.count)):1;
  return '<span class="harvest-value'+(branch==='hand'?' harvest-hand-value':'')+'"><small>'+tr(branch+'Cap')+'</small><strong'+(counting?' data-count="'+[branch,from,v,start].join(',')+'"':'')+'>'+fmtValue(branch,from+(v-from)*p)+'</strong>'+(unit?'<i>'+unit+'</i>':'')+'</span>';}
 function countFrames(){cancelAnimationFrame(countFrame);const step=()=>{if(!panel)return;const age=fxAge();
   for(const el of panel.querySelectorAll('[data-count]')){const [branch,from,to,start]=el.dataset.count.split(','),p=Math.max(0,Math.min(1,(age-Number(start))/T.count));el.textContent=fmtValue(branch,Number(from)+(Number(to)-Number(from))*p);}
   for(const el of panel.querySelectorAll('[data-wallet]')){const [from,to]=el.dataset.wallet.split(',').map(Number),p=Math.max(0,Math.min(1,age/T.wallet));el.textContent=String(Math.round(from+(to-from)*p));}
   if(age<1200)countFrame=requestAnimationFrame(step);};countFrame=requestAnimationFrame(step);}

 Object.assign(words,{
  title:['拠点のスキルツリー','Camp skill tree','营地技能树'],root:['拠点の成長','Grow your camp','营地成长'],
  mapHint:['能力・レシピ・設備強化を、つながった道から選びます。','Choose abilities, recipes and improvements along one connected tree.','沿同一技能树选择能力、配方和设备强化。'],
  panHint:['上下左右にスクロール。空いた場所はドラッグでも動かせます。','Scroll to explore. Drag empty space to pan the tree.','上下左右滚动；也可拖动空白处移动技能树。'],
  skillKind:['能力','Ability','能力'],recipeKind:['レシピ','Recipe','配方'],projectKind:['設備強化','Improvement','设备强化'],
  research:['資材を使って解放','Research recipe','研究配方'],improve:['資材を使って強化','Build improvement','强化设备'],researchCost:['解放に使う資材','Research cost','研究消耗'],buildCost:['別途必要な雇用・設置費','Separate hire / build cost','另需招募／建造费用'],
  recipeNote:['解放すると「仲間・設備」にカードが追加されます。雇用・設置費は別に必要です。','Research adds a card to Allies & equipment. Hiring or building costs extra.','研究后会在「伙伴与设备」中添加卡片，招募或建造费用需另付。'],
  unlocks:['追加されるカード','Card unlocked','解锁卡片'],newCard:['新しいカードを解放！','New card unlocked!','已解锁新卡片！'],showCard:['カードを見る','View card','查看卡片'],cardAdded:['カード追加','Adds a card','添加卡片'],cardUnlocked:['カード解放済み','Card unlocked','卡片已解锁'],
  prerequisites:['先に習得・解放','Requires','前置条件'],noPrerequisites:['拠点からすぐに選べます','Available from the camp root','可从营地起点直接选择'],
  gold:['G','Gold','金币'],coins:['転生コイン','Rebirth coins','转生币'],food:['食料','Food','食物'],free:['消費なし','No cost','无需消耗'],owned:['習得・解放','learned / unlocked','已习得／解锁'],
  improveNow:['設備を強化','Improve camp','强化营地'],nodeReady:['選択できます','Ready to choose','可以选择'],graph:['スキルの接続図','Connected skill tree','技能连接图']
 });
 const currencies=['wood','stone','iron','gold','coins'];
 words.iron=['鉄鉱石'];
 const esc=x=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
 const localized=x=>typeof x==='object'&&x?x[['ja','en','zh'][li()]]||x.ja||'':String(x||'');
 const api=()=>window.ProgressionCore;
 const quote=id=>api()?.quote(S,id);
 const allQuotes=()=>api()?.nodes.map(n=>quote(n.id)).filter(Boolean)||[];
 const titleOf=id=>localized(quote(id)?.title)||tr(id);
 const category=q=>tr(q.kind==='recipe'?'recipeKind':q.kind==='project'?'projectKind':'skillKind');
 const currencyIcon=type=>type==='gold'?'<span class="progression-currency" aria-hidden="true">G</span>':type==='coins'?'<span class="progression-currency is-coin" aria-hidden="true">✦</span>':icon(type);
 const stock=type=>Math.max(0,Number(type==='gold'?S.gold:type==='coins'?S.expedition?.coins:S.factory?.inventory?.[type])||0);
 function priceHTML(cost){const types=[...currencies,'food'];const parts=types.filter(type=>Number(cost?.[type])>0).map(type=>'<span title="'+esc(tr(type))+'">'+currencyIcon(type)+'<b>'+Math.ceil(cost[type])+'</b></span>');return parts.length?parts.join(''):'<small>'+tr('free')+'</small>';}
 function status(q){return q.built?tr(q.kind==='recipe'?'cardUnlocked':'built'):q.missingPrereqs?.length?tr('prerequisites')+'：'+q.missingPrereqs.map(titleOf).join(' / '):!q.ready?tr('short')+currencies.filter(type=>q.missing[type]>0).map(type=>tr(type)+' '+Math.ceil(q.missing[type])).join(' / '):tr('nodeReady');}
 const blocked=()=>now()<lockUntil;
 function select(id,byTap=false){selected=id;selectedAt=now();selectedByTap=byTap;}
 function recipeArt(q){const u=typeof UNITS!=='undefined'&&UNITS.find(u=>u.id===q.recipe),src=u&&window.ArmyView?.portrait(u);return src?'<img src="'+esc(src)+'" alt="">':glyph(q.branch);}
 // Longest-prerequisite rank forms one directed graph. Every visible edge is a
 // real prerequisite from the rule module; there are no decorative fake links.
 function graphLayout(nodes){
  const byId=new Map(nodes.map(n=>[n.id,n])),rank=new Map(),visiting=new Set();
  const depth=id=>{if(rank.has(id))return rank.get(id);if(visiting.has(id))return 1;visiting.add(id);const n=byId.get(id),d=1+Math.max(0,...(n?.requires||[]).filter(id=>byId.has(id)).map(depth));visiting.delete(id);rank.set(id,d);return d;};
  nodes.forEach(n=>depth(n.id));const rows=new Map();for(const n of nodes){const d=rank.get(n.id);if(!rows.has(d))rows.set(d,[]);rows.get(d).push(n);}
  const width=Math.max(1120,...[...rows.values()].map(row=>row.length*190+40)),positions=new Map(),branchOrder={carry:0,hand:1,storage:2,route:3};
  const bias=n=>(branchOrder[n.branch]??2)*10+(n.kind==='skill'?0:n.kind==='recipe'?1:2);
  for(const [d,row]of [...rows].sort((a,b)=>a[0]-b[0])){const parents=n=>(n.requires||[]).map(id=>positions.get(id)?.cx).filter(Number.isFinite),centre=n=>{const p=parents(n);return p.length?p.reduce((a,b)=>a+b,0)/p.length:width*(bias(n)+5)/40;};row.sort((a,b)=>centre(a)-centre(b)||bias(a)-bias(b)||a.id.localeCompare(b.id));const span=Math.min(width-40,row.length*190);row.forEach((n,i)=>{const cx=(width-span)/2+span*(i+.5)/row.length;positions.set(n.id,{x:cx-83,y:125+(d-1)*163,w:166,h:132,cx,rank:d});});}
  return {width,height:125+Math.max(...rank.values(),1)*163,positions,root:{x:width/2-105,y:20,w:210,h:62,cx:width/2}};
 }
 function edgeHTML(nodes,layout){let paths='';const qmap=new Map(nodes.map(q=>[q.id,q]));for(const q of nodes){const target=layout.positions.get(q.id);for(const id of q.requires.length?q.requires:['root']){const source=id==='root'?layout.root:layout.positions.get(id);if(!source)continue;const x1=source.cx,y1=source.y+source.h,x2=target.cx,y2=target.y,mid=(y1+y2)/2,active=id==='root'||qmap.get(id)?.built,related=selected===q.id||selected===id;paths+='<path data-from="'+esc(id)+'" data-to="'+esc(q.id)+'" class="unified-edge branch-'+q.branch+(active?' is-built':'')+(related?' is-related':'')+'" d="M '+x1+' '+y1+' C '+x1+' '+mid+' '+x2+' '+mid+' '+x2+' '+y2+'" />';}}return '<svg class="unified-edges" width="'+layout.width+'" height="'+layout.height+'" aria-hidden="true">'+paths+'</svg>';}
 function renderMap(nodes,opening,still){
  const scroll=panel.querySelector('.harvest-map-scroll'),stage=panel.querySelector('.unified-map'),old={x:scroll.scrollLeft,y:scroll.scrollTop},layout=graphLayout(nodes),count=nodes.filter(q=>q.built).length;
  stage.style.width=layout.width+'px';stage.style.height=layout.height+'px';stage.setAttribute('aria-label',tr('graph'));stage.innerHTML=edgeHTML(nodes,layout)+'<div class="unified-root" style="left:'+layout.root.x+'px;top:'+layout.root.y+'px"><strong>'+tr('root')+'</strong><span>'+count+' / '+nodes.length+' '+tr('owned')+'</span></div>';
  for(const q of nodes){const p=layout.positions.get(q.id),node=document.createElement('button'),own=fx&&fx.id===q.id&&fxAge()<1600,rank=q.kind==='skill'?HarvestSkillCore.rank(q.id):null;node.type='button';node.dataset.progressionNode=q.id;if(q.kind==='skill')node.dataset.harvestSkill=q.id;node.dataset.kind=q.kind;node.className='harvest-node unified-node branch-'+q.branch+' kind-'+q.kind+(q.built?' is-built':q.ready?' is-ready':' is-dim')+(q.locked?' is-locked':'')+(q.id===tutorialTarget()?' is-goal':'')+(own?' fx-learn fx-'+fx.kind:'');node.style.cssText='left:'+p.x+'px;top:'+p.y+'px;width:'+p.w+'px;height:'+p.h+'px;';node.setAttribute('aria-pressed',String(selected===q.id));node.setAttribute('aria-label',localized(q.title)+' · '+category(q)+' · '+(q.kind==='skill'?effect(q.branch,q.tier)+' · ':'')+status(q));
   const body=q.kind==='skill'?valueHTML(q.branch,q.tier,own?T.node:null):'<span class="unified-node-effect">'+tr(q.kind==='recipe'?'cardAdded':'improveNow')+'</span>';
   node.innerHTML='<span class="unified-node-kind">'+category(q)+'</span><span class="harvest-node-emblem">'+(q.kind==='recipe'?recipeArt(q):glyph(q.branch))+(q.kind==='skill'?'<small>'+q.tier+'</small>':'')+'</span><b>'+esc(localized(q.title))+'</b>'+body+'<span class="harvest-node-state">'+(q.built?'✓ '+tr(q.kind==='recipe'?'cardUnlocked':'built'):priceHTML(q.cost))+'</span>'+(own?'<span class="harvest-node-fx" aria-hidden="true"></span>':'');stage.append(node);
  }scroll.scrollLeft=old.x;scroll.scrollTop=old.y;
 }
 function sync(){
  if(!panel||!api())return;api().ensure(S);const nodes=allQuotes(),ready=nodes.filter(q=>q.ready),buttonKey=li()+':'+ready.length;
  if(button.dataset.status!==buttonKey){button.dataset.status=buttonKey;button.innerHTML='<span>'+tr('button')+'</span><b class="harvest-ready-count"'+(!ready.length?' hidden':'')+'>'+ready.length+'</b>';button.setAttribute('aria-label',tr('button')+(ready.length?' · '+tr('ready')+' '+ready.length:''));button.classList.toggle('has-upgrade',ready.length>0);}
  if(!panel.classList.contains('on')||now()-pressAt<1000)return;if(!quote(selected))select(quote(tutorialTarget())?.id||ready[0]?.id||nodes.find(q=>!q.built)?.id||nodes[0]?.id,false);const q=quote(selected);if(!q)return;
  const opening=!reduced()&&now()-openedAt<T.open,lockedNow=blocked(),key=JSON.stringify([li(),S.harvestSkills,S.progression,S.camp?.tools,S.camp?.gate,S.camp?.cart,S.camp?.beacon,S.factory?.inventory,S.gold,S.expedition?.coins,selected,message,fx?.at,lockedNow,opening]);if(key===signature)return;signature=key;
  panel.querySelector('h2').textContent=tr('title');panel.querySelector('.harvest-tree-close').textContent=tr('close');panel.querySelector('.harvest-map-hint').textContent=tr('mapHint');panel.querySelector('.harvest-pan-hint').textContent=tr('panHint');panel.querySelector('.unified-legend').innerHTML=['skill','recipe','project'].map(kind=>'<span class="kind-'+kind+'"><i></i>'+category({kind})+'</span>').join('');
  const still=reduced();panel.querySelector('.harvest-tree-wallet').innerHTML=currencies.map(type=>{const v=Math.floor(stock(type)),spent=fx&&fxAge()<1200&&fx.cost[type]>0,rolling=spent&&!still&&fxAge()<T.wallet;return '<span title="'+esc(tr(type))+'">'+currencyIcon(type)+'<b'+(rolling?' data-wallet="'+(v+fx.cost[type])+','+v+'"':'')+'>'+(rolling?Math.round(v+fx.cost[type]*(1-fxAge()/T.wallet)):v)+'</b>'+(spent?'<em class="harvest-spent" aria-label="'+tr('spent')+' '+fx.cost[type]+'"'+delay(0)+'>−'+fx.cost[type]+'</em>':'')+'</span>';}).join('');renderMap(nodes,opening,still);
  const detail=panel.querySelector('.harvest-skill-detail'),desc=localized(q.description);detail.className='harvest-skill-detail branch-'+q.branch+' kind-'+q.kind;
  let content='';
  if(q.kind==='skill')content='<div class="harvest-detail-change"><small>'+tr('change')+'</small><span>'+effect(q.branch,q.tier-1)+' <b aria-hidden="true">→</b> <strong>'+benefit(q.branch,q.tier)+'</strong></span></div>'+(q.branch==='hand'?powerPreview(q.tier):'')+'<p class="harvest-detail-note">'+tr(q.branch+'Note')+'</p>';
  else if(q.kind==='recipe'){const craft=window.ProgressionCards?.buildCost(q.recipe);content='<p class="harvest-detail-note unified-unlock-description">'+esc(desc)+'</p><p class="unified-recipe-rule">'+tr('recipeNote')+'</p>'+(craft?'<div class="unified-build-cost"><small>'+tr('buildCost')+'</small><span>'+priceHTML(craft)+'</span>'+(craft.note?'<em>'+esc(localized(craft.note)||craft.note)+'</em>':'')+'</div>':'');}
  else content='<p class="harvest-detail-note unified-project-description">'+esc(desc)+'</p>';
  const requirements=q.requires.length?'<div class="unified-prerequisites"><small>'+tr('prerequisites')+'</small>'+q.requires.map(id=>'<button type="button" data-progression-jump="'+esc(id)+'" class="'+(quote(id)?.built?'is-built':'')+'">'+(quote(id)?.built?'✓ ':'')+esc(titleOf(id))+'</button>').join('')+'</div>':'<div class="unified-prerequisites"><small>'+tr('noPrerequisites')+'</small></div>';
  const action=q.built?tr(q.kind==='recipe'?'cardUnlocked':'built'):tr(q.kind==='recipe'?'research':q.kind==='project'?'improve':'learn');
  detail.innerHTML='<div class="harvest-detail-heading">'+(q.kind==='recipe'?'<span class="unified-detail-portrait">'+recipeArt(q)+'</span>':glyph(q.branch))+'<div><small>'+category(q)+(q.kind==='skill'?' · '+tr(q.branch)+' '+q.tier+' / 6':'')+'</small><h3>'+esc(localized(q.title))+'</h3></div></div>'+content+requirements+'<div class="harvest-detail-purchase"><div><small>'+tr(q.kind==='recipe'?'researchCost':'cost')+'</small><span class="harvest-detail-cost">'+priceHTML(q.cost)+'</span></div><button type="button" id="harvestLearn" data-harvest-learn="'+esc(q.id)+'" '+(!q.ready?'disabled':lockedNow?'aria-disabled="true" class="is-wait"':'')+'>'+action+'</button>'+(q.kind==='recipe'&&q.built?'<button type="button" class="unified-show-card" data-progression-card="'+esc(q.id)+'">'+tr('showCard')+' →</button>':'')+'</div><div class="harvest-detail-foot"><p class="harvest-detail-status" role="status">'+esc(status(q))+'</p></div>';
  panel.querySelector('.harvest-tree-message').textContent=message;
 }
 function centerNode(id){const node=panel.querySelector('[data-progression-node="'+id+'"]'),scroll=panel.querySelector('.harvest-map-scroll');if(!node||!scroll)return;const x=parseFloat(node.style.left)+node.offsetWidth/2,y=parseFloat(node.style.top);scroll.scrollLeft=Math.max(0,x-scroll.clientWidth/2);scroll.scrollTop=Math.max(0,y-90);}
 function resyncAt(at){clearTimeout(lockTimer);const wait=at-now();if(wait>0)lockTimer=setTimeout(()=>{signature='';sync();},wait+20);}
 function open(id){if(!api())return;openedAt=now();message='';signature='';if(api().available(S).length&&!panel?.classList.contains('on'))window.ForestAudio?.play('treeOpen',{level:.5});select(quote(id)?.id||quote(tutorialTarget())?.id||api().available(S)[0]?.id||allQuotes().find(q=>!q.built)?.id||'hand1');Rework.openPanel('harvestSkillOverlay');sync();resyncAt(openedAt+T.open);requestAnimationFrame(()=>centerNode(selected));}
 function buy(id){if(blocked())return false;const q=quote(id);if(!q?.ready)return false;const before=HarvestSkillCore.effects(S.harvestSkills),cost={...q.cost};if(!api().purchase(S,id))return false;select(id,false);const rank=q.kind==='skill'?HarvestSkillCore.rank(id):{branch:q.branch,tier:q.tier,kind:q.kind};fx={id,branch:q.branch,tier:q.tier,kind:rank.kind,cost,at:now()};lockUntil=fx.at+T.lock;resyncAt(lockUntil);
  message=localized(q.title)+' · '+tr(q.kind==='recipe'?'newCard':rank.kind==='mastery'?'successMastery':rank.kind==='milestone'?'successMilestone':'success');
  window.ForestAudio?.play(q.kind==='recipe'?'unlock':rank.kind==='mastery'?'mastery':rank.kind==='milestone'?'skillMilestone':'skill',{branch:HarvestSkillCore.branches.indexOf(q.branch),level:.85});
  if(q.kind==='skill'){fieldPending.set(q.branch,{id,branch:q.branch,before,after:HarvestSkillCore.effects(S.harvestSkills)});window.dispatchEvent(new CustomEvent('harvestskill:learned',{detail:{id,branch:q.branch,tier:q.tier,kind:rank.kind}}));}
  window.dispatchEvent(new CustomEvent('progression:learned',{detail:{id,kind:q.kind,recipe:q.recipe,project:q.project}}));window.SupplyFactory?.translate();if(typeof updateHud==='function')updateHud();if(typeof renderCards==='function')renderCards();Rework.track('skill_point_spent',{skill:id,currency:cost.coins?'rebirth_coins':'materials',kind:q.kind});window.OutpostTutorial?.sync?.();save();signature='';sync();countFrames();return true;}
 function tapNode(node,e){const id=node.dataset.progressionNode,q=quote(id),act=HarvestSkillCore.tapAction({id,selected,selectedAt,byTap:selectedByTap,now:now(),ready:!!q?.ready,pill:false,lockUntil});if(act==='buy'){buy(id);return;}if(act==='arm'){selectedAt=now();selectedByTap=true;return;}if(act==='select'){select(id,true);message='';signature='';sync();panel.querySelector('[data-progression-node="'+selected+'"]')?.focus({preventScroll:true});}}
 function showCard(id){const q=quote(id);if(q?.kind!=='recipe'||!q.built)return;Rework.close();window.dispatchEvent(new CustomEvent('progression:show-card',{detail:{id:q.id,kind:q.kind,recipe:q.recipe}}));}
 function boot(){if(panel||!window.__OUTPOST_BUILD__)return;const toolbar=document.getElementById('rxToolbar');if(!toolbar)return;button=document.createElement('button');button.type='button';button.id='harvestSkillsButton';button.onclick=()=>open();toolbar.insertBefore(button,document.getElementById('rxArmyTools'));
  panel=document.createElement('div');panel.id='harvestSkillOverlay';panel.className='rx-overlay';panel.innerHTML='<section class="rx-dialog harvest-tree unified-tree" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="harvestSkillTitle"><header class="harvest-tree-header"><div><h2 id="harvestSkillTitle"></h2></div><button type="button" class="rx-close harvest-tree-close"></button></header><div class="harvest-tree-wallet"></div><div class="unified-legend"></div><p class="harvest-map-hint"></p><div class="harvest-map-scroll"><div class="unified-map"></div></div><p class="harvest-pan-hint"></p><section class="harvest-skill-detail"></section><p class="harvest-tree-message" role="status" aria-live="polite"></p></section>';document.body.append(panel);panel.querySelector('.harvest-tree-close').onclick=()=>Rework.close();
  panel.addEventListener('pointerdown',e=>{pressAt=now();if(e.pointerType==='mouse'&&e.button===0&&e.target.closest('.harvest-map-scroll')&&!e.target.closest('button')){const sc=panel.querySelector('.harvest-map-scroll');pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:sc.scrollLeft,top:sc.scrollTop};sc.setPointerCapture(e.pointerId);}},true);panel.addEventListener('pointermove',e=>{if(!pan||pan.id!==e.pointerId)return;const sc=panel.querySelector('.harvest-map-scroll');sc.scrollLeft=pan.left+pan.x-e.clientX;sc.scrollTop=pan.top+pan.y-e.clientY;});for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>{pan=null;if(pressAt>-Infinity){pressAt=-Infinity;setTimeout(sync,0);}},true);
  window.addEventListener('camp:handpickup',onHandPickup);window.addEventListener('harvestskill:beltpulse-arrived',onPulseArrived);
  panel.addEventListener('click',e=>{if(e.target===panel){Rework.close();return;}const node=e.target.closest('[data-progression-node]'),learn=e.target.closest('[data-harvest-learn]'),jump=e.target.closest('[data-progression-jump]'),card=e.target.closest('[data-progression-card]');if(node)tapNode(node,e);else if(learn&&!learn.disabled)buy(learn.dataset.harvestLearn);else if(jump){select(jump.dataset.progressionJump,true);message='';signature='';sync();centerNode(selected);}else if(card)showCard(card.dataset.progressionCard);});sync();setInterval(sync,250);setInterval(tick,60);
 }
 return {boot,open,buy,sync,effect,noteHarvest,carrying,get selected(){return selected;},get fieldPending(){return [...fieldPending.keys()];}};
})();
HarvestSkills.boot();
