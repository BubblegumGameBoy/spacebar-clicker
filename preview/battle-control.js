/* One continuous field. Placement is explicit; harvesting and combat run together. */
window.BattleControl=(()=>{
 const words={place:['再配置','Reposition','调整位置'],done:['配置を終える','Finish placing','结束布置'],waiting:['配置待ち','Awaiting placement','等待布置'],put:['地面を押したまま位置・範囲を確認し、離すと配置します。','Choose a spot on the ground','点击地面布置'],choose:['移動する仲間を選んでください','Choose an ally to reposition','选择要重新布置的伙伴'],blocked:['木・岩・仲間と重ならない場所を選んでください。','Choose clear ground, away from allies and objects.','请放在没有伙伴或物体的空地。'],inRange:['攻撃範囲内です','The enemy is within range here','此处可以攻击敌人'],outRange:['攻撃範囲に道が入るよう配置しましょう','Keep the enemy inside the range circle','请让敌人位于射程圆内'],nearTree:['近くの木を伐採します','Chops the tree and drops logs on the ground','挥斧砍树，将木材掉在地面'],nearStone:['近くの岩を採掘します','Mines the rock and drops stone on the ground','采掘岩石，将石材掉在地面'],needTree:['木の近くに配置してください','Place on clear ground beside a tree','请放在树旁空地'],needStone:['岩の近くに配置してください','Place on clear ground beside a rock','请放在岩石旁空地']};
 const tr=k=>words[k][Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const outpost=()=>window.__OUTPOST_BUILD__===true;
 const raiding=()=>outpost()&&S.outpost?.phase==='active';
 let lastRaidState=null;
 const local=xs=>xs[Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const attackRange=p=>outpost()?(window.OutpostCore?.stats(p.u.id,S.camp)?.range||sim().range(p)):sim().range(p);
 let skipPointer=null,workerDrag=null;
 let ready=false,mode=false,selectedKey=null,preview=null,clock=0,width=1100,height=500,notice='',previewSource='',previewSprite=null;
 let indexedBodies=null,bodyGrid=new Map(),spotCache=new Map(),displayedSpots=[],layoutKey='';
 const sim=()=>ArmyView.sim;
 const hero={x:0,y:0,r:0,hp:1,max:1}; // Simulation compatibility; no captain, HP or survival mechanics.
 const unitLabel=u=>outpost()&&LANG==='ja'?({woodcutter:'木こり',miner:'採掘師',arch:'弓兵',sword:'剣士'}[u.id]||L(u.name)):L(u.name);
 const pending=()=>UNITS.find(u=>(S.pending?.[u.id]||0)>0);
 const combat=()=>sim().soldiers.some(p=>!p.u.worker&&!p.u.healer);
 function resize(w,h){const b=sim().boss,key=[w,h,b.x,b.y,b.r].join(':');if(key===layoutKey)return;layoutKey=key;width=w;height=h;indexedBodies=null;spotCache.clear();displayedSpots=[];}
 function neighbors(point,radius=100){
  const bodies=sim().soldiers;
  if(indexedBodies!==bodies){bodyGrid=new Map();for(const p of bodies){const key=Math.floor(p.x/128)+65536*Math.floor(p.y/128);if(!bodyGrid.has(key))bodyGrid.set(key,[]);bodyGrid.get(key).push(p);}indexedBodies=bodies;spotCache.clear();}
  const found=[];for(let y=Math.floor((point.y-radius)/128);y<=Math.floor((point.y+radius)/128);y++)for(let x=Math.floor((point.x-radius)/128);x<=Math.floor((point.x+radius)/128);x++)found.push(...bodyGrid.get(x+65536*y)||[]);return found;
 }
 function restore(){cancelGesture();mode=!raiding()&&!!pending();if(mode){window.OutpostCamp?.cancelRails?.();window.OutpostCamp?.cancelCarry?.();}selectedKey=null;preview=null;document.getElementById('field').classList.remove('gathering');translate();}
 function encounter(){clock=0;if(!outpost())BossArt.set(bossIndex);}

 function cancelGesture(){const pointer=workerDrag;workerDrag=null;const field=document.getElementById('field');try{if(pointer!==null&&field?.hasPointerCapture?.(pointer))field.releasePointerCapture(pointer);}catch(_){}preview=null;}
 function setPlacement(value){if(value&&raiding())return false;cancelGesture();if(value){window.OutpostCamp?.cancelRails?.();window.OutpostCamp?.cancelCarry?.();window.SupplyFactory?.stopHold?.();window.SupplyFactory?.setBuilding(false);}mode=value;selectedKey=null;preview=null;notice='';displayedSpots=[];translate();return true;}
 function beginPlacement(){return setPlacement(true);}
 function selectGroup(key){if(raiding())return false;const a=ExpeditionCore.assignments(S).find(a=>a.groupKey===Number(key)&&!a.pending),p=a&&sim().soldiers.find(p=>p.id===a.id&&p.index===a.index);if(!p)return false;setPlacement(true);selectedKey=p.key;preview={x:p.x,y:p.y};translate();return true;}
 function selectType(id){if(raiding())return false;const p=sim().soldiers.find(p=>p.id===id);if(p){setPlacement(true);selectedKey=p.key;preview={x:p.x,y:p.y};notice='';translate();}}
 function candidate(){const u=pending();return u?{u,r:(u.id==='giant'||u.id==='ballista')?22:u.fly?14:10}:sim().soldiers.find(p=>p.key===selectedKey);}
 function valid(point,p){
  if(p?.u.worker&&!SupplyFactory.nearby(point,(SupplyFactory.resourceTypeForWorker?.(p.u.worker)||(p.u.worker==='woodcutter'?'wood':'stone'))))return false;
  if(!p||point.x<p.r+5||point.x>width-p.r-5||point.y<(outpost()?90:height*.34)+p.r+5||point.y>height-p.r-20)return false;
  if(outpost()){if(!p.u.worker&&!window.Outpost?.covers(point,p.u))return false;const home=window.OutpostCore.WORLD.home;if(Math.abs(point.x-home.x)<62&&point.y>home.y-86&&point.y-ArmyView.bodyHeight(p.u)<home.y+12)return false;}
  else{const b=sim().boss;if(Math.hypot(point.x-b.x,point.y-b.y)<b.r+p.r)return false;}
  for(const q of neighbors(point,60))if(q.key!==p.key&&Math.hypot(point.x-q.x,point.y-q.y)<p.r+q.r+5)return false;
  for(const n of SupplyFactory.state.nodes){const half=n.type==='wood'?53:44,h=n.type==='wood'?100:54;if(Math.abs(point.x-n.x)<half&&point.y>n.y-h&&point.y-ArmyView.bodyHeight(p.u)<n.y+5)return false;}
  const z=ArmyView.camera.scale;for(const d of SupplyFactory.state.drops){const b=outpost()&&SupplyFactory.pileBounds?.(d);if(b){if(point.x+p.r+8>b.left&&point.x-p.r-8<b.right&&point.y>b.top&&point.y-ArmyView.bodyHeight(p.u)<b.bottom)return false;}else if(Math.abs(point.x-d.x)<42/z+22&&point.y>d.y-58/z&&point.y-ArmyView.bodyHeight(p.u)<d.y+10)return false;}
  return true;
 }
 function useful(point,u){return !outpost()||u.worker||!window.Outpost?.coverage||Outpost.coverage(point,u)<=.72;}
 function spots(p=candidate()){
  if(!p)return [];neighbors({x:0,y:0},0);const key=p.u.id+':'+(p.key||0),now=performance.now(),cached=spotCache.get(key);if(cached&&now<cached.until&&cached.points.every(q=>valid(q,p)))return cached.points;
  const nodes=p.u.worker?SupplyFactory.state.nodes.filter(n=>(n.stock||n.type==='food')&&n.type===((SupplyFactory.resourceTypeForWorker?.(p.u.worker)||(p.u.worker==='woodcutter'?'wood':'stone')))):outpost()?window.Outpost.placementNodes():[{x:sim().boss.x-sim().boss.r-(p.u.ranged?125:20),y:sim().boss.y}];
  const result=[],gap=Math.max(36,30/ArmyView.camera.scale);
  const add=point=>{if(!valid(point,p)||!useful(point,p.u)||result.some(q=>Math.hypot(q.x-point.x,q.y-point.y)<gap))return false;if(!p.u.worker&&(outpost()?!window.Outpost.covers(point,p.u):Math.hypot(point.x-sim().boss.x,point.y-sim().boss.y)-sim().boss.r>sim().range(p)+p.r))return false;result.push(point);return true;};
  for(const n of nodes){let found=0;
   if(p.u.worker){for(let i=0;i<40&&found<3;i++){const angle=i*2.399963+(n.key||0)*.13,r=61+Math.sin(i*7.3)*2;if(add({x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r}))found++;}}
   else for(let i=0;i<140&&found<3;i++){const r=22*Math.sqrt(i),angle=i*2.399963;if(add({x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r}))found++;}
  }
  // A crowded suggested area must not hide all guides while usable ground exists.
  if(!result.length&&!p.u.worker)for(let y=height-35;y>height*.34+20&&result.length<3;y-=20)for(let x=width-25;x>20&&result.length<3;x-=20)add({x,y});
  spotCache.set(key,{until:now+250,points:result});return result;
 }
 function moveBody(body,point){body.x=point.x;body.y=point.y;body.order=null;body.commanded=false;body.moving=false;body.enterAt=sim().time;body.attackAt=-10;indexedBodies=null;spotCache.clear();if(body.u.worker){const n=SupplyFactory.nearby(body,(SupplyFactory.resourceTypeForWorker?.(body.u.worker)||(body.u.worker==='woodcutter'?'wood':'stone')));body.workFacing=n&&n.x<body.x?-1:1;}}
 function placeRecruit(u,point){const index=(S.owned[u.id]||0)-S.pending[u.id];S.pending[u.id]--;renderUnits();const body=sim().soldiers.find(q=>q.id===u.id&&q.index===index);if(!body){S.pending[u.id]++;renderUnits();return null;}if(outpost())S.pendingRefunds?.[u.id]?.shift();moveBody(body,point);if(outpost()&&window.ExpeditionCore)ExpeditionCore.setAnchor(S,u.id,index,point);return body;}
 function put(point){if(raiding()||window.Rework?.paused||!mode)return false;const p=candidate();if(!p)return false;const visible=displayedSpots.length?displayedSpots:spots(p);const marker=visible.slice().sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).find(q=>Math.hypot(q.x-point.x,q.y-point.y)<=(p.u.worker?Math.max(14/ArmyView.camera.scale,18):Math.max(22,24/ArmyView.camera.scale)));if(marker&&valid(marker,p))point=marker;
  if(!valid(point,p)){notice=p?.u.worker==='farmer'?local(['畑の近くに配置してください','Place beside the crop plot','请放置在农田旁']):tr(p?.u.worker?(p.u.worker==='woodcutter'?'needTree':'needStone'):'blocked');translate();return false;}
  const u=pending(),limit=u&&outpost()&&S.clearedBossWave>=3?Math.min(5,S.pending[u.id]):1;let body=u?placeRecruit(u,point):p;if(!body)return false;if(!u){moveBody(body,point);if(outpost()&&window.ExpeditionCore){const group=ExpeditionCore.groupFor(S,body.id,body.index),leader=ExpeditionCore.assignments(S).find(a=>a.groupKey===group?.key&&a.member===0),base=group?.anchor;if(leader&&base){const prior=group.positions[ExpeditionCore.assignments(S).find(a=>a.id===body.id&&a.index===body.index)?.member||0]||base;ExpeditionCore.setAnchor(S,body.id,leader.index,{x:base.x+point.x-prior.x,y:base.y+point.y-prior.y});}else ExpeditionCore.setAnchor(S,body.id,body.index,point);ExpeditionCore.project(S);window.ExpeditionIntegration?.refresh();}}
  let placed=1;const center={...point};
  if(u)for(let next=1;next<limit;next++){const candidate={u,r:p.r};let spot=null;const phase=(body.key||0)*.37;
   for(let i=0;i<180&&!spot;i++){const radius=27+Math.sqrt(i)*8,angle=i*2.399963+phase,tryPoint={x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius};if(valid(tryPoint,candidate)&&useful(tryPoint,u))spot=tryPoint;}
   if(!spot)break;const extra=placeRecruit(u,spot);if(!extra)break;placed++;}
  mode=!!pending();selectedKey=null;preview=null;displayedSpots=[];notice=!!pending()&&placed>1?local(['＋'+placed+'！ のこり '+S.pending[u.id]+' → ほかの ＋ を おそう','Placed '+placed+'. '+S.pending[u.id]+' left: choose another +','已放置'+placed+'人，剩余'+S.pending[u.id]+'人，请选择其他＋']):'';ArmyView.focus(body.id);ForestAudio.play('place');renderCards();updateHud();translate();save();return true;}

 function nearest(point){
  let best=null,distance=Infinity;
  for(const p of sim().soldiers){
   if(outpost()){
    const half=p.u.fly?23:18,h=ArmyView.bodyHeight(p.u);
    if(Math.abs(point.x-p.x)>half||point.y<p.y-h||point.y>p.y-5)continue;
   }
   const d=Math.hypot(point.x-p.x,point.y-(p.y-(outpost()?ArmyView.bodyHeight(p.u)*.5:18)));
   if(d<distance&&(outpost()||d<28/ArmyView.camera.scale)){best=p;distance=d;}
  }return best;
 }
 function selectAt(point,event){
  if(!outpost()||raiding()||pending()||mode)return false;const p=nearest(point);if(!p)return false;
  setPlacement(true);selectedKey=p.key;preview={x:p.x,y:p.y};notice='';displayedSpots=[];skipPointer=event||null;translate();return true;
 }
 function cancelPending(){
  if(outpost()&&window.ExpeditionCore){let changed=false;for(const u of UNITS)changed=ExpeditionCore.cancelPending(S,u.id)||changed;if(changed){mode=false;selectedKey=null;preview=null;window.ExpeditionIntegration?.refresh();translate();}return changed;}
  if(!outpost())return false;let changed=false;const inventory=SupplyFactory.state.inventory;
  for(const u of UNITS){const count=Math.min(S.owned[u.id]||0,Math.max(0,Math.floor(S.pending?.[u.id]||0)));if(!count)continue;
   const receipts=S.pendingRefunds?.[u.id]||[],placed=(S.owned[u.id]||0)-count;
   for(let i=0;i<count;i++){const receipt=receipts[i]||window.OutpostCore.recipe(u.id,placed+i,1)||{};
    for(const type of ['wood','stone']){const value=receipt[type];if(Number.isFinite(value)&&value>0)inventory[type]=Math.min(1e150,(inventory[type]||0)+value);}
    if(Number.isFinite(receipt.gold)&&receipt.gold>0)S.gold=Math.min(1e150,S.gold+receipt.gold);
   }
   S.owned[u.id]-=count;S.pending[u.id]=0;if(S.pendingRefunds)S.pendingRefunds[u.id]=[];changed=true;
  }
  if(!changed)return false;mode=false;selectedKey=null;preview=null;notice=local(['雇用を取り消し、木材と石材を返金しました。','Cancelled recruits refunded.','已退还取消伙伴的材料。']);displayedSpots=[];indexedBodies=null;spotCache.clear();renderUnits();renderCards();updateHud();SupplyFactory.translate();translate();save();return true;
 }
 function guide(){const u=pending();if(mode&&u)return unitLabel(u)+' ×'+S.pending[u.id]+' · '+(outpost()&&S.clearedBossWave>=3&&S.pending[u.id]>1?local(['＋ を おすと 5にんまで おけるよ','A + places up to 5 allies','点击＋可放置最多5名伙伴']):tr('put'));if(mode)return selectedKey?tr('put'):outpost()?local(['配置する仲間を選び、移動先を押したまま確認してください。','Click an ally, then its new spot','点击伙伴，再点击新位置']):tr('choose');return window.SupplyFactory?.guide()||'';}
 function tick(dt){if(!ready)return;if(outpost()){const active=raiding();if(active)cancelGesture();if(active!==lastRaidState){lastRaidState=active;if(active){mode=false;selectedKey=null;preview=null;displayedSpots=[];}translate();}return;}if(bossDead)return;if(!combat()){BossArt.draw(0);return;}clock+=dt;const t=clock%6;BossArt.draw(t<4.8?0:t<5.3?1:t<5.65?2:3);}

 function draw(ctx,{ox,oy,z}){if(!ready||!mode)return;const p=candidate();if(!p)return;
  displayedSpots=spots(p);if(preview){const marker=displayedSpots.slice().sort((a,b)=>Math.hypot(a.x-preview.x,a.y-preview.y)-Math.hypot(b.x-preview.x,b.y-preview.y)).find(q=>Math.hypot(q.x-preview.x,q.y-preview.y)<=(p.u.worker?Math.max(14/ArmyView.camera.scale,18):Math.max(22,24/ArmyView.camera.scale)));if(marker&&valid(marker,p))preview={...marker};}for(const spot of displayedSpots){const x=ox+spot.x*z,y=oy+spot.y*z;ctx.fillStyle='#173c32e8';ctx.strokeStyle='#f4dea1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(13,17*z),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='bold 21px system-ui';ctx.fillStyle='#f4dea1';ctx.textAlign='center';ctx.fillText('+',x,y+7);}
  if(preview&&p.u.worker)SupplyFactory.drawOutputPreview?.(ctx,{ox,oy,z},preview,p.u);
  if(!preview)return;const good=valid(preview,p),x=ox+preview.x*z,y=oy+preview.y*z,r=attackRange(p);ctx.strokeStyle=good?'#bde7a6':'#ef9d87';ctx.fillStyle=good?'#a9dca509':'#ef9d8709';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,(p.u.worker?64:r)*z,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);if(p.u.id==='ballista'){ctx.strokeStyle='#e8aa7e';ctx.fillStyle='#cc795914';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(x,y,60*z,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);}ctx.beginPath();ctx.ellipse(x,y,Math.max(8,p.r*z),Math.max(4,p.r*z*.5),0,0,Math.PI*2);ctx.stroke();const source=ArmyView.portrait(p.u);if(source&&source!==previewSource){previewSource=source;previewSprite=new Image();previewSprite.src=source;}if(previewSprite?.complete&&previewSprite.naturalWidth){const h=ArmyView.bodyHeight(p.u)*z,w=h*previewSprite.naturalWidth/previewSprite.naturalHeight;ctx.globalAlpha=good?.7:.35;const resource=p.u.worker?SupplyFactory.nearby(preview,(SupplyFactory.resourceTypeForWorker?.(p.u.worker)||(p.u.worker==='woodcutter'?'wood':'stone'))):null;if(resource&&resource.x<preview.x){ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(previewSprite,-w/2,-h,w,h);ctx.restore();}else ctx.drawImage(previewSprite,x-w/2,y-h,w,h);ctx.globalAlpha=1;}ctx.fillStyle=good?'#d7edbd':'#ffc1ac';ctx.font='bold '+Math.max(11,12*z)+'px system-ui';ctx.textAlign='center';const reach=outpost()?window.Outpost.covers(preview,p.u):Math.hypot(preview.x-sim().boss.x,preview.y-sim().boss.y)-sim().boss.r<=r+p.r;ctx.fillText(!good?tr(p.u.worker?(p.u.worker==='woodcutter'?'needTree':'needStone'):'blocked'):p.u.worker?(p.u.worker==='farmer'?local(['実った作物を収穫。落下先を確認','Harvests ripe crops. Check the landing point','收割成熟作物，查看掉落地点']):tr(p.u.worker==='woodcutter'?'nearTree':'nearStone')):outpost()?local([reach?'この位置から道を防衛':'道が射程に入る位置へ配置',reach?'Covers the road here!':'Place within range of a road',reach?'在这里守护道路！':'请放在能攻击道路的位置']):tr(reach?'inRange':'outRange'),Math.max(100,Math.min(ctx.canvas.width/(devicePixelRatio||1)-100,x)),Math.max(18,y-70*z));}
 function translate(){if(!ready)return;const f=document.getElementById('field'),waiting=pending();f.classList.toggle('placing',mode);f.classList.toggle('command-mode',mode);f.classList.toggle('has-combat',combat());f.classList.toggle('planning-combat',!!(mode&&candidate()&&!candidate().u.worker));document.getElementById('commandMode').disabled=raiding();document.getElementById('commandMode').textContent=raiding()?local(['おわったら 再配置','Reposition after the raid','袭击结束后调整']):tr(mode?'done':'place');document.getElementById('commandMode').hidden=!!waiting||!sim().soldiers.length;document.getElementById('placeRecruits').textContent=tr('waiting')+' '+Object.values(S.pending||{}).reduce((a,b)=>a+b,0);document.getElementById('placeRecruits').hidden=!waiting||mode;document.getElementById('placeRecruits').disabled=raiding();const next=document.getElementById('guideNext');next.hidden=outpost()||mode||!combat()||S.clearedBossWave<S.bossWave;next.textContent=['つぎの敵へ →','Next enemy →','下个敌人 →'][Math.max(0,['ja','en','zh'].indexOf(LANG))];const prev=document.getElementById('guidePrev');prev.hidden=outpost()||mode||S.bossWave<=1;prev.textContent=['← もどる','← Back','← 返回'][Math.max(0,['ja','en','zh'].indexOf(LANG))];const cancel=document.getElementById('cancelRecruits');if(cancel){cancel.hidden=!outpost()||!waiting;cancel.textContent=local(['雇用取消・返金','Cancel / refund','取消并退款']);}const command=document.getElementById('commandMode');command.setAttribute('aria-pressed',String(mode));const badge=document.getElementById('placementBadge');if(badge){badge.hidden=!waiting;if(waiting){const portrait=ArmyView.portrait(waiting);badge.replaceChildren();if(portrait){const image=document.createElement('img');image.src=portrait;image.alt='';badge.append(image);}badge.append(Object.assign(document.createElement('b'),{textContent:'×'+S.pending[waiting.id]}));}}const text=notice||guide();if(document.getElementById('playGuide').textContent!==text)document.getElementById('playGuide').textContent=text;window.PlacementControls?.sync?.();}
 function boot(){if(ready)return;ready=true;const controls=document.createElement('div');controls.id='battleCommands';controls.innerHTML='<div id="placementBadge" aria-hidden="true" hidden></div><div id="playGuide" role="status"></div><button type="button" id="commandMode"></button><button type="button" id="placeRecruits"></button><button type="button" id="cancelRecruits" hidden></button><button type="button" id="guideNext" hidden></button><button type="button" id="guidePrev" hidden></button>';document.getElementById('deckMain').prepend(controls);document.getElementById('commandMode').onclick=()=>setPlacement(!mode);document.getElementById('placeRecruits').onclick=beginPlacement;document.getElementById('cancelRecruits').onclick=cancelPending;document.getElementById('guideNext').onclick=()=>document.getElementById('nextBossBtn').click();document.getElementById('guidePrev').onclick=()=>document.getElementById('prevBossBtn').click();
 const field=document.getElementById('field');field.addEventListener('pointermove',e=>{if(mode)preview=ArmyView.point(e.clientX,e.clientY);});field.addEventListener('pointerleave',()=>{if(workerDrag===null)preview=null;});field.addEventListener('pointerdown',e=>{if(e===skipPointer){skipPointer=null;return;}if(Rework.paused||e.target.closest('button,input,select'))return;const point=ArmyView.point(e.clientX,e.clientY);if(!mode){if(selectAt(point)){e.preventDefault();}return;}e.preventDefault();preview=point;if(pending()||selectedKey!==null){if(outpost()){workerDrag=e.pointerId;try{field.setPointerCapture(e.pointerId);}catch(_){}return;}put(point);return;}const p=nearest(point);if(p){selectedKey=p.key;notice='';translate();}});field.addEventListener('pointerup',e=>{if(workerDrag!==e.pointerId)return;workerDrag=null;if(mode&&!Rework.paused)put(ArmyView.point(e.clientX,e.clientY));try{field.releasePointerCapture(e.pointerId);}catch(_){} });field.addEventListener('pointercancel',cancelGesture);field.addEventListener('lostpointercapture',cancelGesture);window.addEventListener('blur',cancelGesture);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!window.Rework?.paused){cancelGesture();setPlacement(false);}});restore();encounter();
 }
 return {invalidate:()=>{indexedBodies=null;spotCache.clear();},cancelGesture,get activeUnit(){return candidate()?.u.id||null;},boot,tick,draw,resize,encounter,restore,translate,selectGroup,selectType,selectAt,cancelPending,setPlacement,beginPlacement,put,valid,spots,neighbors,get reserved(){return mode?(displayedSpots.length?displayedSpots:spots()):[];},get hasCombat(){return combat();},get activity(){return 'battle';},get placement(){return mode;},get hero(){return hero;},get defeated(){return false;},selected:key=>selectedKey===key,heal:()=>0,hit:()=>{},victory:()=>{}};
})();
