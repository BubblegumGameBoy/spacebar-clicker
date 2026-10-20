/* One continuous field. Placement is explicit; harvesting and combat run together. */
window.BattleControl=(()=>{
 const words={place:['おきなおす','Reposition','调整位置'],done:['おわる','Finish placing','结束布置'],waiting:['まだ おいてない','Awaiting placement','等待布置'],put:['＋ をおして おこう！ 場所は じぶんで えらべるよ','Choose a spot on the ground','点击地面布置'],choose:['おきなおす なかまを おそう','Choose an ally to reposition','选择要重新布置的伙伴'],blocked:['木・岩・仲間と重ならない空き地に置いてください。','Choose clear ground, away from allies and objects.','请放在没有伙伴或物体的空地。'],inRange:['ここなら敵に攻撃が届きます','The enemy is within range here','此处可以攻击敌人'],outRange:['射程の円に敵が入る場所へ','Keep the enemy inside the range circle','请让敌人位于射程圆内'],nearTree:['ここで 木を切ってくれる！','Chops the tree and drops logs on the ground','挥斧砍树，将木材掉在地面'],nearStone:['ここで 石をほってくれる！','Mines the rock and drops stone on the ground','采掘岩石，将石材掉在地面'],needTree:['木のそばの ＋ をおそう','Place on clear ground beside a tree','请放在树旁空地'],needStone:['岩のそばの ＋ をおそう','Place on clear ground beside a rock','请放在岩石旁空地']};
 const tr=k=>words[k][Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const outpost=()=>window.__OUTPOST_BUILD__===true;
 const raiding=()=>outpost()&&S.outpost?.phase==='active';
 let lastRaidState=null;
 const local=xs=>xs[Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const attackRange=p=>outpost()?(window.OutpostCore?.stats(p.u.id)?.range||sim().range(p)):sim().range(p);
 let skipPointer=null;
 let ready=false,mode=false,selectedKey=null,preview=null,clock=0,width=1100,height=500,notice='',previewSource='',previewSprite=null;
 let indexedBodies=null,bodyGrid=new Map(),spotCache=new Map(),displayedSpots=[],layoutKey='';
 const sim=()=>ArmyView.sim;
 const hero={x:0,y:0,r:0,hp:1,max:1}; // Simulation compatibility; no captain, HP or survival mechanics.
 const pending=()=>UNITS.find(u=>(S.pending?.[u.id]||0)>0);
 const combat=()=>sim().soldiers.some(p=>!p.u.worker&&!p.u.healer);
 function resize(w,h){const b=sim().boss,key=[w,h,b.x,b.y,b.r].join(':');if(key===layoutKey)return;layoutKey=key;width=w;height=h;indexedBodies=null;spotCache.clear();displayedSpots=[];}
 function neighbors(point,radius=100){
  const bodies=sim().soldiers;
  if(indexedBodies!==bodies){bodyGrid=new Map();for(const p of bodies){const key=Math.floor(p.x/128)+65536*Math.floor(p.y/128);if(!bodyGrid.has(key))bodyGrid.set(key,[]);bodyGrid.get(key).push(p);}indexedBodies=bodies;spotCache.clear();}
  const found=[];for(let y=Math.floor((point.y-radius)/128);y<=Math.floor((point.y+radius)/128);y++)for(let x=Math.floor((point.x-radius)/128);x<=Math.floor((point.x+radius)/128);x++)found.push(...bodyGrid.get(x+65536*y)||[]);return found;
 }
 function restore(){mode=!raiding()&&!!pending();selectedKey=null;preview=null;document.getElementById('field').classList.remove('gathering');translate();}
 function encounter(){clock=0;if(!outpost())BossArt.set(bossIndex);}

 function setPlacement(value){if(raiding())return false;if(value)window.SupplyFactory?.setBuilding(false);mode=value;selectedKey=null;preview=null;notice='';displayedSpots=[];translate();}
 function beginPlacement(){if(raiding())return false;mode=true;selectedKey=null;preview=null;notice='';displayedSpots=[];translate();}
 function selectType(id){if(raiding())return false;const p=sim().soldiers.find(p=>p.id===id);if(p){mode=true;selectedKey=p.key;preview={x:p.x,y:p.y};notice='';translate();}}
 function candidate(){const u=pending();return u?{u,r:u.id==='giant'?22:u.fly?14:10}:sim().soldiers.find(p=>p.key===selectedKey);}
 function valid(point,p){
  if(p?.u.worker&&!SupplyFactory.nearby(point,p.u.worker==='woodcutter'?'wood':'stone'))return false;
  if(!p||point.x<p.r+5||point.x>width-p.r-5||point.y<(outpost()?90:height*.34)+p.r+5||point.y>height-p.r-20)return false;
  if(outpost()){if(!p.u.worker&&!window.Outpost?.covers(point,p.u))return false;const home=window.OutpostCore.WORLD.home;if(Math.abs(point.x-home.x)<62&&point.y>home.y-86&&point.y-ArmyView.bodyHeight(p.u)<home.y+12)return false;}
  else{const b=sim().boss;if(Math.hypot(point.x-b.x,point.y-b.y)<b.r+p.r)return false;}
  for(const q of neighbors(point,60))if(q.key!==p.key&&Math.hypot(point.x-q.x,point.y-q.y)<p.r+q.r+5)return false;
  for(const n of SupplyFactory.state.nodes){const half=n.type==='wood'?53:44,h=n.type==='wood'?100:54;if(Math.abs(point.x-n.x)<half&&point.y>n.y-h&&point.y-ArmyView.bodyHeight(p.u)<n.y+5)return false;}
  const z=ArmyView.camera.scale;for(const d of SupplyFactory.state.drops)if(Math.abs(point.x-d.x)<42/z+22&&point.y>d.y-58/z&&point.y-ArmyView.bodyHeight(p.u)<d.y+10)return false;
  return true;
 }
 function spots(p=candidate()){
  if(!p)return [];neighbors({x:0,y:0},0);const key=p.u.id+':'+(p.key||0),now=performance.now(),cached=spotCache.get(key);if(cached&&now<cached.until&&cached.points.every(q=>valid(q,p)))return cached.points;
  const nodes=p.u.worker?SupplyFactory.state.nodes.filter(n=>n.stock&&n.type===(p.u.worker==='woodcutter'?'wood':'stone')):outpost()?window.Outpost.placementNodes():[{x:sim().boss.x-sim().boss.r-(p.u.ranged?125:20),y:sim().boss.y}];
  const result=[],gap=Math.max(36,30/ArmyView.camera.scale);
  const add=point=>{if(!valid(point,p)||result.some(q=>Math.hypot(q.x-point.x,q.y-point.y)<gap))return false;if(!p.u.worker&&(outpost()?!window.Outpost.covers(point,p.u):Math.hypot(point.x-sim().boss.x,point.y-sim().boss.y)-sim().boss.r>sim().range(p)+p.r))return false;result.push(point);return true;};
  for(const n of nodes){let found=0;
   if(p.u.worker){for(let i=0;i<40&&found<3;i++){const angle=i*2.399963+(n.key||0)*.13,r=61+Math.sin(i*7.3)*2;if(add({x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r}))found++;}}
   else for(let i=0;i<140&&found<3;i++){const r=22*Math.sqrt(i),angle=i*2.399963;if(add({x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r}))found++;}
  }
  // A crowded suggested area must not hide all guides while usable ground exists.
  if(!result.length&&!p.u.worker)for(let y=height-35;y>height*.34+20&&result.length<3;y-=20)for(let x=width-25;x>20&&result.length<3;x-=20)add({x,y});
  spotCache.set(key,{until:now+250,points:result});return result;
 }
 function put(point){if(raiding())return false;const p=candidate(),visible=displayedSpots.length?displayedSpots:spots(p);const marker=visible.slice().sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).find(q=>Math.hypot(q.x-point.x,q.y-point.y)<=Math.max(22,24/ArmyView.camera.scale));if(marker&&valid(marker,p))point=marker;
  // Tapping a tree means "beside this tree", never a person hidden inside its canopy.
  if(p?.u.worker&&!valid(point,p)){const type=p.u.worker==='woodcutter'?'wood':'stone',n=SupplyFactory.state.nodes.find(n=>n.type===type&&Math.abs(point.x-n.x)<55&&point.y>=n.y-(type==='wood'?110:60)&&point.y<n.y+20);if(n){const options=spots(p).filter(q=>Math.hypot(q.x-n.x,q.y-n.y)<65).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));if(options.length)point=options[0];}}
  if(!valid(point,p)){notice=tr(p?.u.worker?(p.u.worker==='woodcutter'?'needTree':'needStone'):'blocked');translate();return false;}let body=p;const u=pending();if(u){const index=(S.owned[u.id]||0)-S.pending[u.id];S.pending[u.id]--;if(outpost())S.pendingRefunds?.[u.id]?.shift();renderUnits();body=sim().soldiers.find(q=>q.id===u.id&&q.index===index);}if(!body)return false;body.x=point.x;body.y=point.y;body.order=null;body.commanded=false;body.moving=false;body.enterAt=sim().time;body.attackAt=-10;indexedBodies=null;spotCache.clear();if(body.u.worker){const n=SupplyFactory.nearby(body,body.u.worker==='woodcutter'?'wood':'stone');body.workFacing=n&&n.x<body.x?-1:1;}mode=!!pending();selectedKey=null;preview=null;notice='';ArmyView.focus(body.id);ForestAudio.play('place');renderCards();updateHud();translate();save();return true;}
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
  mode=true;selectedKey=p.key;preview={x:p.x,y:p.y};notice='';displayedSpots=[];skipPointer=event||null;translate();return true;
 }
 function cancelPending(){
  if(!outpost())return false;let changed=false;const inventory=SupplyFactory.state.inventory;
  for(const u of UNITS){const count=Math.min(S.owned[u.id]||0,Math.max(0,Math.floor(S.pending?.[u.id]||0)));if(!count)continue;
   const receipts=S.pendingRefunds?.[u.id]||[],placed=(S.owned[u.id]||0)-count;
   for(let i=0;i<count;i++){const receipt=receipts[i]||window.OutpostCore.recipe(u.id,placed+i,1)||{};
    for(const type of ['wood','stone']){const value=receipt[type];if(Number.isFinite(value)&&value>0)inventory[type]=Math.min(1e150,(inventory[type]||0)+value);}
    if(Number.isFinite(receipt.gold)&&receipt.gold>0)S.gold=Math.min(1e150,S.gold+receipt.gold);
   }
   S.owned[u.id]-=count;S.pending[u.id]=0;if(S.pendingRefunds)S.pendingRefunds[u.id]=[];changed=true;
  }
  if(!changed)return false;mode=false;selectedKey=null;preview=null;notice=local(['取り消した分の木石を返しました。','Cancelled recruits refunded.','已退还取消伙伴的材料。']);displayedSpots=[];indexedBodies=null;spotCache.clear();renderUnits();renderCards();updateHud();SupplyFactory.translate();translate();save();return true;
 }
 function guide(){const u=pending();if(mode&&u)return L(u.name)+' ×'+S.pending[u.id]+' · '+tr('put');if(mode)return selectedKey?tr('put'):outpost()?local(['なかまをクリック → 置きたい地面をクリック','Click an ally, then its new spot','点击伙伴，再点击新位置']):tr('choose');return window.SupplyFactory?.guide()||'';}
 function tick(dt){if(!ready)return;if(outpost()){const active=raiding();if(active!==lastRaidState){lastRaidState=active;if(active){mode=false;selectedKey=null;preview=null;displayedSpots=[];}translate();}return;}if(bossDead)return;if(!combat()){BossArt.draw(0);return;}clock+=dt;const t=clock%6;BossArt.draw(t<4.8?0:t<5.3?1:t<5.65?2:3);}

 function draw(ctx,{ox,oy,z}){if(!ready||!mode)return;const p=candidate();if(!p)return;
  displayedSpots=spots(p);for(const spot of displayedSpots){const x=ox+spot.x*z,y=oy+spot.y*z;ctx.fillStyle='#173c32e8';ctx.strokeStyle='#f4dea1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(13,17*z),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='bold 21px system-ui';ctx.fillStyle='#f4dea1';ctx.textAlign='center';ctx.fillText('+',x,y+7);}
  if(!preview)return;const good=valid(preview,p),x=ox+preview.x*z,y=oy+preview.y*z,r=attackRange(p);ctx.strokeStyle=good?'#bde7a6':'#ef9d87';ctx.fillStyle=good?'#a9dca509':'#ef9d8709';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,(p.u.worker?64:r)*z,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x,y,Math.max(8,p.r*z),Math.max(4,p.r*z*.5),0,0,Math.PI*2);ctx.stroke();const source=ArmyView.portrait(p.u);if(source&&source!==previewSource){previewSource=source;previewSprite=new Image();previewSprite.src=source;}if(previewSprite?.complete&&previewSprite.naturalWidth){const h=ArmyView.bodyHeight(p.u)*z,w=h*previewSprite.naturalWidth/previewSprite.naturalHeight;ctx.globalAlpha=good?.7:.35;ctx.drawImage(previewSprite,x-w/2,y-h,w,h);ctx.globalAlpha=1;}ctx.fillStyle=good?'#d7edbd':'#ffc1ac';ctx.font='bold '+Math.max(11,12*z)+'px system-ui';ctx.textAlign='center';const reach=outpost()?window.Outpost.covers(preview,p.u):Math.hypot(preview.x-sim().boss.x,preview.y-sim().boss.y)-sim().boss.r<=r+p.r;ctx.fillText(!good?tr(p.u.worker?(p.u.worker==='woodcutter'?'needTree':'needStone'):'blocked'):p.u.worker?tr(p.u.worker==='woodcutter'?'nearTree':'nearStone'):outpost()?local([reach?'ここで 道をまもる！':'道に届く場所へ おこう',reach?'Covers the road here!':'Place within range of a road',reach?'在这里守护道路！':'请放在能攻击道路的位置']):tr(reach?'inRange':'outRange'),Math.max(100,Math.min(ctx.canvas.width/(devicePixelRatio||1)-100,x)),Math.max(18,y-70*z));}
 function translate(){if(!ready)return;const f=document.getElementById('field'),waiting=pending();f.classList.toggle('placing',mode);f.classList.toggle('command-mode',mode);f.classList.toggle('has-combat',combat());f.classList.toggle('planning-combat',!!(mode&&candidate()&&!candidate().u.worker));document.getElementById('commandMode').disabled=raiding();document.getElementById('commandMode').textContent=raiding()?local(['襲撃のあとに置き直す','Reposition after the raid','袭击结束后调整']):tr(mode?'done':'place');document.getElementById('commandMode').hidden=!!waiting||!sim().soldiers.length;document.getElementById('placeRecruits').textContent=tr('waiting')+' '+Object.values(S.pending||{}).reduce((a,b)=>a+b,0);document.getElementById('placeRecruits').hidden=!waiting||mode;document.getElementById('placeRecruits').disabled=raiding();const next=document.getElementById('guideNext');next.hidden=outpost()||mode||!combat()||S.clearedBossWave<S.bossWave;next.textContent=['つぎの敵へ →','Next enemy →','下个敌人 →'][Math.max(0,['ja','en','zh'].indexOf(LANG))];const prev=document.getElementById('guidePrev');prev.hidden=outpost()||mode||S.bossWave<=1;prev.textContent=['← もどる','← Back','← 返回'][Math.max(0,['ja','en','zh'].indexOf(LANG))];const cancel=document.getElementById('cancelRecruits');if(cancel){cancel.hidden=!outpost()||!waiting;cancel.textContent=local(['取り消す・返却','Cancel / refund','取消并退款']);}const command=document.getElementById('commandMode');command.setAttribute('aria-pressed',String(mode));const text=notice||guide();if(document.getElementById('playGuide').textContent!==text)document.getElementById('playGuide').textContent=text;}
 function boot(){if(ready)return;ready=true;const controls=document.createElement('div');controls.id='battleCommands';controls.innerHTML='<div id="playGuide" role="status"></div><button type="button" id="commandMode"></button><button type="button" id="placeRecruits"></button><button type="button" id="cancelRecruits" hidden></button><button type="button" id="guideNext" hidden></button><button type="button" id="guidePrev" hidden></button>';document.getElementById('deckMain').prepend(controls);document.getElementById('commandMode').onclick=()=>setPlacement(!mode);document.getElementById('placeRecruits').onclick=beginPlacement;document.getElementById('cancelRecruits').onclick=cancelPending;document.getElementById('guideNext').onclick=()=>document.getElementById('nextBossBtn').click();document.getElementById('guidePrev').onclick=()=>document.getElementById('prevBossBtn').click();
 const field=document.getElementById('field');field.addEventListener('pointermove',e=>{if(mode)preview=ArmyView.point(e.clientX,e.clientY);});field.addEventListener('pointerleave',()=>preview=null);field.addEventListener('pointerdown',e=>{if(e===skipPointer){skipPointer=null;return;}if(Rework.paused||e.target.closest('button,input,select'))return;const point=ArmyView.point(e.clientX,e.clientY);if(!mode){if(selectAt(point)){e.preventDefault();}return;}e.preventDefault();preview=point;if(pending()||selectedKey!==null){put(point);return;}const p=nearest(point);if(p){selectedKey=p.key;notice='';translate();}});window.addEventListener('keydown',e=>{if(e.key==='Escape')setPlacement(false);});restore();encounter();
 }
 return {boot,tick,draw,resize,encounter,restore,translate,selectType,selectAt,cancelPending,setPlacement,beginPlacement,put,valid,spots,neighbors,get reserved(){return mode?(displayedSpots.length?displayedSpots:spots()):[];},get hasCombat(){return combat();},get activity(){return 'battle';},get placement(){return mode;},get hero(){return hero;},get defeated(){return false;},selected:key=>selectedKey===key,heal:()=>0,hit:()=>{},victory:()=>{}};
})();
