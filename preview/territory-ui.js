/* A campaign map, one visible scene, and hands-on territory supplies. */
window.TerritoryUI=(()=>{
 'use strict';
 let ready=false,header,toolbar,map,travelPanel,mapCanvas,selected=1,signature='',drag=null,nodeHold=null,panning=null,pendingGroup=null,activePointer=null,lastScene='',uiClock=0,saveClock=0;
 const pointers=new Map(),castle=new Image(),objects=new Image(),crops=[];castle.src='media/territory-castle-v1.png';objects.src='../assets/forest-objects.webp';
 objects.onload=()=>{const canvas=document.createElement('canvas');canvas.width=objects.naturalWidth;canvas.height=objects.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(objects,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data,fw=canvas.width/2,fh=canvas.height/2;for(let i=0;i<4;i++){const sx=i%2*fw,sy=Math.floor(i/2)*fh;let l=fw,r=0,t=fh,b=0;for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)if(rgba[((sy+y)*canvas.width+sx+x)*4+3]>72){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}crops[i]={x:sx+l,y:sy+t,w:r-l+1,h:b-t+1};}};
 const state=()=>TerritoryCore.ensure(S),scene=()=>state().scene,enabled=()=>!!S.invasion&&!(S.outpost?.phase==='active'&&S.invasion.phase==='idle')&&!(S.invasion.phase!=='idle'&&!S.invasion.battlefield),away=()=>enabled()&&(scene()!=='home'||!!state().travel),name=id=>'第'+Math.ceil(id/3)+'地域 · '+InvasionCore.site(id).name,material=id=>({wood:'木材',stone:'石材',iron:'鉄鉱石',food:'麦'}[id]||id),current=()=>TerritoryCore.entry(S,state().activeId,false),inRect=(p,b)=>p.x>=b.x-b.w/2&&p.x<=b.x+b.w/2&&p.y>=b.y-b.h&&p.y<=b.y+12;
 function cameraHome(){ArmyView.home();ArmyView.layout();}
 function focusYard(){
  const viewport=document.getElementById('battleViewport');
  ArmyView.layout();
  const scale=Math.min(1.15,viewport.clientWidth/560,viewport.clientHeight/335);
  ArmyView.viewAt(335,440,scale);
 }
 function restoreSceneCamera(){
  if(!enabled()||state().travel)return;
  if(scene()==='territory')focusYard();
  else if(scene()==='battlefield'){
   if(S.invasion.phase!=='idle')focusArmy();
   else ArmyView.viewAt(1290,420);
  }
 }
 function focusArmy(){if(!S.invasion?.battlefield||S.invasion.phase==='idle')return false;state().scene='battlefield';const ms=Object.values(S.invasion.members).filter(m=>m.hp>0),all=ms.length?ms:Object.values(S.invasion.members);if(!all.length)return false;sync(true);ArmyView.layout();ArmyView.viewAt(all.reduce((n,m)=>n+m.x,0)/all.length,all.reduce((n,m)=>n+m.y,0)/all.length-25,Math.min(1.15,document.getElementById('battleViewport').clientWidth/650));sync(true);return true;}
 function home(){if(state().travel)return false;state().scene='home';pendingGroup=null;drag=null;nodeHold=null;sync(true);cameraHome();save();return true;}
 function visit(id){if(!TerritoryCore.beginTravel(S,'visit',id))return false;Rework.close();sync(true);save();return true;}
 function start(id=selected){if(BattleControl.placement||!InvasionCore.select(S,Number(id))||!InvasionCore.canStart(S,ArmyView.sim.soldiers,{placing:BattleControl.placement}))return false;if(!TerritoryCore.beginTravel(S,'battle',id))return false;Rework.close();SupplyFactory.stopHold?.();OutpostCamp.cancelPreview?.();OutpostCamp.clearSelection?.();sync(true);save();return true;}
 function depart(){return TerritoryCore.conquered(S,selected)?visit(selected):start(selected);}
 function openMap(){if(state().travel)return;const objective=CampaignCore.objective(S.invasion.conquered);
  const outcome=S.invasion.outcome;
  const retry=outcome&&!outcome.win&&InvasionCore.available(S,outcome.wave)?outcome.wave:null;
  selected=S.invasion.phase!=='idle'?state().activeId:(retry||objective.next||CampaignCore.MAX_WAVE);
  map.querySelector('.territory-archive').open=false;
  renderMap();Rework.openPanel('territoryMapOverlay');}
 function mapPoint(id){const r=Math.ceil(id/3)-1,slot=(id-1)%3,row=Math.floor(r/5),col=row?4-r%5:r%5;return {x:125+col*135+(slot-1)*22,y:row?210:88+(slot===2?28:0)};}
 function paintMap(canvas,progress=null){if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,k=w/800;ctx.save();ctx.clearRect(0,0,w,h);ctx.scale(k,k);ctx.fillStyle='#203d2f';ctx.fillRect(0,0,800,280);ctx.strokeStyle='#7c8a5c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(36,143);for(let r=0;r<10;r++){const p=mapPoint(r*3+2);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.fillStyle='#f2deb0';ctx.font='bold 13px system-ui';ctx.fillText('拠点',15,172);ctx.fillRect(25,130,24,22);
  for(let id=1;id<=30;id++){const p=mapPoint(id),done=TerritoryCore.conquered(S,id),open=InvasionCore.available(S,id);ctx.globalAlpha=done||open?1:.35;ctx.fillStyle=done?'#8bc491':selected===id?'#e5be71':'#9f7555';if(id%3===0&&castle.complete&&castle.naturalWidth)ctx.drawImage(castle,p.x-16,p.y-26,32,32);else{ctx.fillRect(p.x-7,p.y-11,14,14);ctx.fillRect(p.x-8,p.y-16,4,6);ctx.fillRect(p.x+4,p.y-16,4,6);}if(selected===id){ctx.strokeStyle='#ffe8a5';ctx.lineWidth=2;ctx.strokeRect(p.x-18,p.y-28,36,38);}if(id%3===2){ctx.globalAlpha=1;ctx.fillStyle='#ebdcad';ctx.fillText(String(Math.ceil(id/3)),p.x-4,p.y+28);}}
  ctx.globalAlpha=1;if(progress){const target=mapPoint(progress.id),from=progress.kind==='home'?target:{x:36,y:143},to=progress.kind==='home'?{x:36,y:143}:target,t=progress.elapsed;ctx.strokeStyle='#ffe0a0';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.setLineDash([]);const x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;ctx.fillStyle='#f4d783';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}ctx.restore();}
 function renderThreat(){
  const panel=map.querySelector('.territory-threat');
  panel.hidden=!S.expedition?.heatUnlocked||S.invasion.phase!=='idle';
  if(panel.hidden)return;
  const heat=OutpostCore.heat(S.outpost.heat);
  panel.querySelector('summary').textContent='脅威条件 · '+heat.level;
  const buttons=OutpostCore.HEAT_IDS.map(id=>{
   const button=document.createElement('button');
   const on=heat.conditions.includes(id);
   button.type='button';
   button.dataset.territoryHeat=id;
   button.textContent=OutpostCore.HEAT[id].name[0];
   button.title=InvasionCore.conditionDescription(id);
   button.setAttribute('aria-pressed',String(on));
   button.onclick=()=>{
    if(S.invasion.phase!=='idle'||state().travel)return;
    const conditions=on?heat.conditions.filter(value=>value!==id):[...heat.conditions,id];
    S.outpost.heat=OutpostCore.heat({conditions,seed:S.expedition.run||1});
    S.expedition.heatLast=[...conditions];
    renderMap();
    save();
   };
   return button;
  });
  panel.querySelector('div').replaceChildren(...buttons);
  panel.querySelector('p').textContent=heat.conditions.map(InvasionCore.conditionDescription).join(' / ');
 }
 function renderMap(){
  if(!map)return;
  const objective=CampaignCore.objective(S.invasion.conquered);
  const list=map.querySelector('.territory-map-sites');
  const archive=map.querySelector('.territory-map-archive');
  list.replaceChildren();
  archive.replaceChildren();
  map.querySelector('.territory-map-progress').textContent=objective.finished
   ? '街道解放 · 10 / 10地域'
   : '街道解放 '+objective.regions+' / '+objective.total+'地域';
  for(let region=1;region<=objective.total;region++){
   const row=document.createElement('section');
   const title=document.createElement('b');
   title.textContent='第'+region+'地域  '+CampaignCore.chapter(region*3).name;
   row.append(title);
   for(let slot=0;slot<3;slot++){
    const id=(region-1)*3+slot+1;
    const done=TerritoryCore.conquered(S,id), available=InvasionCore.available(S,id);
    const button=document.createElement('button');
    button.type='button';
    button.dataset.territorySite=id;
    button.setAttribute('aria-pressed',String(selected===id));
    button.disabled=!done&&!available;
    const title=slot===2?CampaignCore.chapter(id).title:InvasionCore.site(id).name;
    button.textContent=(done?'✓ ':!available?'🔒 ':'')+title;
    button.onclick=()=>{
     selected=id;
     renderMap();
     map.querySelector('[data-territory-site="'+id+'"]').focus({preventScroll:true});
    };
    row.append(button);
   }
   (region===objective.region?list:archive).append(row);
  }
  const done=TerritoryCore.conquered(S,selected);
  const site=TerritoryCore.entry(S,selected,false), resource=TerritoryCore.supplyDescription(selected);
  const plan=OutpostCore.plan(selected,OutpostCore.PLAN_VERSION,OutpostCore.roundModifiers(S.outpost,selected));
  const army=ArmyView.sim.soldiers.filter(InvasionCore.fighter).length;
  map.querySelector('.territory-map-detail').textContent=done
   ? material(resource.type)+'を採集して荷車で持ち帰れます。採集量2倍。'+(site?' 残量'+site.nodes.reduce((n,node)=>n+node.stock,0)+'・積荷'+site.cart.length+'個。':'')
   : '味方 '+army+'人 ／ 守備隊 '+plan.potential+'体。'+(selected===CampaignCore.MAX_WAVE?'黄昏の王を倒し、城門を破れば街道の解放が完了。':selected%3===0?'城門を破れば次の地域へ。':'制圧すると'+material(resource.type)+'の採取場を確保。採集量2倍。');
  const tips=map.querySelector('.territory-map-tips');
  tips.hidden=done;
  if(!army)tips.textContent='小屋で弓兵を雇い、拠点の空き地に配置すると出陣できます。';
  else if(Object.values(S.pending||{}).some(n=>n>0)||BattleControl.placement)
   tips.textContent='配置待ちの仲間を地面に置くと出陣できます。';
  else if(S.invasion.phase!=='idle')tips.textContent='部隊が帰還すると次の行き先を選べます。';
  else if(S.outpost.heat.conditions.includes('narrow')&&ExpeditionCore.groups(S).filter(g=>g.active&&ExpeditionCore.bucket(g.id)==='combat').length>3)
   tips.textContent='狭い陣地では3部隊まで。小屋で1部隊を控えに回すか、脅威条件を外してください。';
  else if(selected===3)tips.textContent='初めての城攻め。小屋の「編成」で弓兵を3人に増やし、剣士を加えると攻めやすくなります。';
  else tips.textContent=InvasionCore.hint(selected);
  const departButton=document.getElementById('territoryDepart');
  departButton.textContent=done?'領地へ移動':'ここへ出陣';
  departButton.disabled=!!state().travel||S.invasion.phase!=='idle'||!done&&!InvasionCore.canStart(S,ArmyView.sim.soldiers,{placing:BattleControl.placement});
  renderThreat();
  paintMap(mapCanvas);
 }
 function guideText(objective, territory, inv){
  if(state().travel)return '';
  if(scene()==='territory'){
   if(territory?.cart.length)return '荷車で資材を拠点へ運び、次の遠征に使おう';
   if(territory?.drops.length||territory?.stockpile.length)return '採った資材を荷車へドラッグ';
   const type=territory?.nodes[0]?.type;
   if(type==='iron'&&!S.camp.oreMining)return '鉄鉱石の採集は、小屋で「鉄鉱採掘」を研究';
   return material(type)+'を採集して、次の遠征の資材を確保';
  }
  if(inv.phase!=='idle')return '';
  if(objective.finished)return '黄昏の王を倒し、街道を取り戻した';
  if(state().homeCart.length)return '荷下ろしして、実物を小屋へ届けよう';
  if(BattleControl.placement||Object.values(S.pending||{}).some(n=>n>0))return '仲間を地面に配置して出陣の準備';
  if(!objective.regions&&!inv.conquered.length&&!BattleControl.hasCombat)return '最初の目標は弓兵を1人雇うこと';
  if(inv.outcome&&!inv.outcome.win){
   const where=InvasionCore.site(inv.outcome.wave).name;
   const reason={rout:'敗退',retreat:'撤退',timeout:'時間切れ'}[inv.outcome.reason]||'帰還';
   return where+'から'+reason+'。編成を見直して再挑戦';
  }
  const target=objective.next%3===0?CampaignCore.chapter(objective.next).title:InvasionCore.site(objective.next).name;
  if(scene()==='battlefield'&&inv.outcome?.win){
   const secured=InvasionCore.site(inv.outcome.wave);
   return secured.name+'を制圧。次は'+(secured.region===objective.region?target:'第'+objective.region+'地域')+'へ';
  }
  return '次は第'+objective.region+'地域 '+target+'へ';
 }
 function dropPoint(item,from='drops'){const t=current();if(!t)return {x:item.x,y:item.y-12};if(from==='drops')return {x:item.x,y:item.y-12};const list=t[from],i=Math.max(0,list.indexOf(item)),box=from==='cart'?TerritoryCore.CART:TerritoryCore.STOCKPILE;return {x:box.x-38+(i%5)*19,y:box.y-48+Math.floor((i%25)/5)*13};}
 function dropBounds(item,from='drops'){const p=dropPoint(item,from);return {left:p.x-14,right:p.x+14,top:p.y-14,bottom:p.y+12,x:p.x,y:p.y};}
 function actors(){if(!away())return ArmyView.sim.soldiers.filter(p=>!(S.invasion?.battlefield&&S.invasion.phase!=='idle'&&S.invasion.members[InvasionCore.key(p)])&&!TerritoryCore.dispatched(S,p.id,p.index));if(scene()==='battlefield')return ArmyView.sim.soldiers.filter(p=>S.invasion.members[InvasionCore.key(p)]&&S.invasion.phase!=='idle');const t=current();if(!t?.dispatch)return [];const assignments=ExpeditionCore.assignments(S).filter(a=>a.groupKey===t.dispatch.groupKey),bodies=ArmyView.sim.soldiers;return assignments.map((a,i)=>{const p=bodies.find(p=>p.id===a.id&&p.index===a.index);return p?{...p,x:t.dispatch.x+(i%3)*22,y:t.dispatch.y+Math.floor(i/3)*22,hp:undefined,attackAt:t.dispatch.cooldown>(OutpostCore.stats(a.id,S.camp)?.interval||5)-.5?ArmyView.sim.time-.1:-10}:null;}).filter(Boolean);}
 function drawCastle(ctx,{ox,oy,z},id,won){const size=id%3===0?310:230,x=1370,y=450,age=S.invasion.elapsed-(S.invasion.gateHitAt??-10),hit=scene()==='battlefield'&&age>=0&&age<.2,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;ctx.save();if(hit&&!reduced)ctx.translate(Math.sin(age*90)*1.7*z,0);if(castle.complete&&castle.naturalWidth)ctx.drawImage(castle,ox+(x-size*.55)*z,oy+(y-size*.88)*z,size*z,size*.88*z);ctx.restore();if(hit){ctx.strokeStyle='#ffdda0';ctx.lineWidth=3*z;for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=(12+age*55)*z;ctx.beginPath();ctx.moveTo(ox+x*z+Math.cos(a)*r,oy+(y-18)*z+Math.sin(a)*r);ctx.lineTo(ox+x*z+Math.cos(a)*(r+8*z),oy+(y-18)*z+Math.sin(a)*(r+8*z));ctx.stroke();}}ctx.strokeStyle=won?'#c7ecc0':'#bb6758';ctx.lineWidth=3*z;ctx.beginPath();ctx.moveTo(ox+(x-64)*z,oy+y*z);ctx.lineTo(ox+(x-64)*z,oy+(y-94)*z);ctx.stroke();ctx.fillStyle=won?'#77be8b':'#a6463e';ctx.beginPath();ctx.moveTo(ox+(x-64)*z,oy+(y-94)*z);ctx.lineTo(ox+(x-19)*z,oy+(y-82)*z);ctx.lineTo(ox+(x-64)*z,oy+(y-68)*z);ctx.fill();if(scene()==='battlefield'&&S.invasion.gateHP>0){const inv=S.invasion,w=110*z;ctx.fillStyle='#2d2722';ctx.fillRect(ox+x*z-w/2,oy+(y+18)*z,w,7*z);ctx.fillStyle=inv.sieging?'#edbc6f':'#9b9381';ctx.fillRect(ox+x*z-w/2,oy+(y+18)*z,w*inv.gateHP/inv.gateMax,7*z);ctx.fillStyle='#fff0c0';ctx.font='bold '+Math.max(11,13*z)+'px system-ui';ctx.textAlign='center';ctx.fillText('城門 '+Math.ceil(inv.gateHP)+' / '+inv.gateMax,ox+x*z,oy+(y+47)*z);}}
 function label(ctx,text,x,y,size=12){ctx.font='700 '+size+'px system-ui';ctx.textAlign='center';const w=ctx.measureText(text).width+12;ctx.fillStyle='#1b3028eb';ctx.fillRect(x-w/2,y-size-3,w,size+8);ctx.fillStyle='#efdfb4';ctx.fillText(text,x,y);}
 function drawGround(ctx,v){if(!enabled())return false;const s=state();if(scene()==='home'){OutpostCamp.drawUnder(ctx,v);if(s.homeCart.length){const p=s.unload;drawCart(ctx,v,{x:p.x,y:p.y,w:100,h:80},s.homeCart.length);label(ctx,'積荷 '+s.homeCart.length+'個 · 荷下ろし',v.ox+p.x*v.z,v.oy+(p.y+38)*v.z);}return true;}
  ctx.save();ctx.strokeStyle='#bea66b44';ctx.lineWidth=34*v.z;for(const y of [330,570]){ctx.beginPath();ctx.moveTo(v.ox+70*v.z,v.oy+y*v.z);ctx.lineTo(v.ox+1360*v.z,v.oy+450*v.z);ctx.stroke();}ctx.fillStyle='#e5d096';ctx.font='bold '+Math.max(12,18*v.z)+'px system-ui';ctx.textAlign='left';ctx.fillText(name(s.activeId)+(scene()==='territory'?' · 制圧地':' · 遠征戦場'),v.ox+70*v.z,v.oy+175*v.z);drawCastle(ctx,v,s.activeId,TerritoryCore.conquered(S,s.activeId));
  if(scene()==='territory'){const t=current();if(t){for(const n of t.nodes){const crop=crops[n.type==='wood'?0:1],height=n.type==='wood'?130:75;if(crop&&objects.complete){const w=height*crop.w/crop.h;ctx.globalAlpha=n.stock>0?1:.35;ctx.drawImage(objects,crop.x,crop.y,crop.w,crop.h,v.ox+(n.x-w/2)*v.z,v.oy+(n.y-height)*v.z,w*v.z,height*v.z);ctx.globalAlpha=1;if(n.type==='iron'){ctx.fillStyle='#a5d0d9';for(let i=0;i<4;i++)ctx.fillRect(v.ox+(n.x-20+i*12)*v.z,v.oy+(n.y-25-i%2*13)*v.z,10*v.z,8*v.z);}}label(ctx,material(n.type)+' 残量'+n.stock+(n.type==='iron'&&!S.camp.oreMining?' · 採掘研究が必要':' · 採集量2倍'),v.ox+n.x*v.z,v.oy+(n.y+24)*v.z,Math.max(10,12*v.z));label(ctx,(n.work||0)+' / '+SupplyCore.workRequired(n.type)+' 打',v.ox+n.x*v.z,v.oy+(n.y-height-10)*v.z,Math.max(9,11*v.z));}
   const b=TerritoryCore.STOCKPILE;ctx.fillStyle='#a28a5b35';ctx.strokeStyle='#c6af77';ctx.lineWidth=2*v.z;ctx.fillRect(v.ox+(b.x-b.w/2)*v.z,v.oy+(b.y-b.h)*v.z,b.w*v.z,b.h*v.z);ctx.strokeRect(v.ox+(b.x-b.w/2)*v.z,v.oy+(b.y-b.h)*v.z,b.w*v.z,b.h*v.z);label(ctx,'集積場 '+t.stockpile.length+'個',v.ox+b.x*v.z,v.oy+(b.y+30)*v.z,Math.max(10,12*v.z));drawCart(ctx,v,TerritoryCore.CART,t.cart.length);
   for(const from of ['drops','stockpile','cart'])for(const d of t[from]){if(drag?.keys.includes(d.key)&&drag.from===from)continue;const p=dropPoint(d,from);SupplyFactory.drawItem(ctx,d.type,v.ox+p.x*v.z,v.oy+(p.y+12)*v.z,27*v.z);}
   if(drag){for(let i=0;i<drag.keys.length;i++){const d=t[drag.from].find(d=>d.key===drag.keys[i]);if(d)SupplyFactory.drawItem(ctx,d.type,v.ox+(drag.point.x+(i%3)*10)*v.z,v.oy+(drag.point.y+Math.floor(i/3)*9)*v.z,27*v.z);}}
   if(pendingGroup)label(ctx,'派遣する班の配置場所を押してください',v.ox+600*v.z,v.oy+650*v.z,14);
  }}ctx.restore();return true;
 }
 function drawCart(ctx,v,b,count){const x=v.ox+b.x*v.z,y=v.oy+b.y*v.z;ctx.fillStyle='#775334';ctx.strokeStyle='#d0ae78';ctx.lineWidth=2*v.z;ctx.fillRect(x-b.w*.4*v.z,y-39*v.z,b.w*.8*v.z,35*v.z);ctx.strokeRect(x-b.w*.4*v.z,y-39*v.z,b.w*.8*v.z,35*v.z);for(const dx of [-29,29]){ctx.fillStyle='#342e24';ctx.beginPath();ctx.arc(x+dx*v.z,y,9*v.z,0,Math.PI*2);ctx.fill();ctx.stroke();}label(ctx,'荷車 '+count+' / 12',x,y+30*v.z,Math.max(10,12*v.z));}
 function pick(point){const t=current();if(!t)return null;for(const from of ['cart','stockpile','drops'])for(const d of t[from].slice().reverse()){const b=dropBounds(d,from);if(point.x>=b.left&&point.x<=b.right&&point.y>=b.top&&point.y<=b.bottom)return {d,from};}return null;}
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 function down(e){if(!enabled()||!away()||Rework.paused||!document.getElementById('field').contains(e.target)||e.target.closest('button,input,select,summary,#cameraTools,#territoryControls')||e.button>0)return;consume(e);if(state().travel)return;const point=ArmyView.point(e.clientX,e.clientY);pointers.set(e.pointerId,e);activePointer=e.pointerId;try{document.getElementById('field').setPointerCapture(e.pointerId);}catch(_){}if(pointers.size>1){drag=null;nodeHold=null;const ps=[...pointers.values()],mx=(ps[0].clientX+ps[1].clientX)/2,my=(ps[0].clientY+ps[1].clientY)/2;panning={pinch:true,d:Math.max(1,Math.hypot(ps[0].clientX-ps[1].clientX,ps[0].clientY-ps[1].clientY)),point:ArmyView.point(mx,my),scale:ArmyView.camera.scale};return;}if(scene()==='battlefield'){beginPan(e,true);return;}if(pendingGroup){TerritoryCore.dispatch(S,state().activeId,pendingGroup,point);pendingGroup=null;sync(true);save();return;}const found=pick(point);if(found){const fx=HarvestSkillCore.effects(S.harvestSkills),t=current(),keys=t[found.from].filter(d=>Math.hypot(dropPoint(d,found.from).x-point.x,dropPoint(d,found.from).y-point.y)<60).sort((a,b)=>a===found.d?-1:b===found.d?1:0).slice(0,fx.carryCapacity).map(d=>d.key);drag={keys,from:found.from,point};return;}const n=current()?.nodes.find(n=>Math.abs(point.x-n.x)<65&&point.y>n.y-(n.type==='wood'?145:90)&&point.y<n.y+40);if(n){nodeHold=n.key;TerritoryCore.harvest(S,state().activeId,n.key);save();return;}beginPan(e);}
 function beginPan(event,canAttack=false){
  const viewport=document.getElementById('battleViewport');
  panning={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false,canAttack};
 }
 function move(e){if(!pointers.has(e.pointerId))return;consume(e);pointers.set(e.pointerId,e);if(panning?.pinch&&pointers.size>1){const ps=[...pointers.values()],mx=(ps[0].clientX+ps[1].clientX)/2,my=(ps[0].clientY+ps[1].clientY)/2,d=Math.hypot(ps[0].clientX-ps[1].clientX,ps[0].clientY-ps[1].clientY);ArmyView.viewAt(panning.point.x,panning.point.y,panning.scale*d/panning.d,mx,my);return;}if(drag)drag.point=ArmyView.point(e.clientX,e.clientY);else if(panning&&!panning.pinch){const dx=e.clientX-panning.x,dy=e.clientY-panning.y;if(Math.hypot(dx,dy)>6)panning.moved=true;if(panning.moved){const vp=document.getElementById('battleViewport');vp.scrollLeft=panning.left-dx;vp.scrollTop=panning.top-dy;}}}
 function up(e){if(!pointers.has(e.pointerId))return;consume(e);if(drag&&e.type!=='pointercancel'){const p=ArmyView.point(e.clientX,e.clientY),to=inRect(p,TerritoryCore.CART)?'cart':inRect(p,TerritoryCore.STOCKPILE)?'stockpile':'drops';TerritoryCore.transferBatch(S,state().activeId,drag.keys,drag.from,to,p);save();}if(panning?.canAttack&&!panning.moved&&e.type==='pointerup')Outpost.manual(ArmyView.point(e.clientX,e.clientY));pointers.delete(e.pointerId);if(!pointers.size){drag=null;nodeHold=null;panning=null;activePointer=null;}sync(true);}
 function sync(force=false){if(!ready)return;const on=enabled(),s=state(),inv=S.invasion;document.body.classList.toggle('territory-build',on);document.body.classList.toggle('territory-away',on&&away());header.hidden=!on;toolbar.hidden=!on||scene()!=='territory';travelPanel.hidden=!on||!s.travel;if(!on)return;const territory=current(),health=Object.values(inv.members).reduce((n,m)=>n+m.hp,0),key=JSON.stringify([s.scene,s.activeId,!!s.travel,s.homeCart.length,inv.phase,inv.selected,inv.conquered,Math.ceil(health),Math.ceil(inv.gateHP||0),territory?.stockpile.length,territory?.cart.length,!!territory?.drops.length,BattleControl.hasCombat,territory?.dispatch?[territory.dispatch.groupKey,territory.dispatch.x,territory.dispatch.y]:null,pendingGroup,S.pending,BattleControl.placement]);if(!force&&signature===key)return;signature=key;document.getElementById('invasionBoard').hidden=false;const at=scene()==='territory'?name(s.activeId)+' · 集積'+(territory?.stockpile.length||0)+'個':scene()==='battlefield'?(inv.phase==='idle'?(inv.outcome?.win?'制圧・帰還しました':'部隊が帰還しました'):inv.phase==='march'?'進軍中':inv.phase==='return'?'帰還中':inv.sieging?'城門 '+Math.ceil(inv.gateHP)+'/'+inv.gateMax:'交戦中 · 体力'+Math.ceil(health)):'拠点 · '+(inv.phase!=='idle'?'遠征は進行中':'準備時間は無制限');const objective=CampaignCore.objective(inv.conquered);
  header.querySelector('.territory-progress').textContent=objective.finished?'街道解放完了':'黄昏の王まで　解放 '+objective.regions+' / '+objective.total+'地域';
  header.querySelector('.territory-scene-name').textContent=guideText(objective,territory,inv)||at;
  document.getElementById('territoryEnding').hidden=!objective.finished||inv.phase!=='idle';
  const mapButton=document.getElementById('territoryMapButton');
  const retry=inv.phase==='idle'&&inv.outcome&&!inv.outcome.win;
  document.getElementById('territoryReinforce').hidden=!retry||scene()==='territory';
  mapButton.textContent=retry&&scene()!=='territory'?'再挑戦を準備':scene()==='battlefield'&&inv.phase==='idle'&&!objective.finished?'次の攻略先':'攻略地図';
  document.getElementById('territoryHome').hidden=scene()==='home';document.getElementById('territoryArmy').hidden=!(inv.battlefield&&inv.phase!=='idle');document.getElementById('territoryRetreat').hidden=!(inv.battlefield&&['march','battle'].includes(inv.phase));const use=document.getElementById('territoryUse');use.hidden=!(inv.phase==='idle'&&inv.outcome?.win&&scene()!=='territory');use.textContent='制圧地で採集';const unload=document.getElementById('territoryUnload');unload.hidden=scene()!=='home'||!s.homeCart.length;unload.textContent='荷下ろし '+s.homeCart.length+'個';if(territory){document.getElementById('territorySendCart').textContent=territory.cart.length?'この荷物'+territory.cart.length+'個を拠点へ運ぶ':'拠点へ戻る';const summary=toolbar.querySelector('summary');summary.textContent='荷車 '+territory.cart.length+' / 12 · 派遣/内訳';toolbar.querySelector('.territory-cargo-list').textContent=Object.entries(territory.cart.reduce((r,d)=>(r[d.type]=(r[d.type]||0)+1,r),{})).map(([k,n])=>material(k)+' '+n).join(' / ')||'空荷です。実物を荷車へドラッグして積みます。';const select=document.getElementById('territoryWorker');select.replaceChildren(...ExpeditionCore.groups(S).filter(g=>g.active&&!g.pending&&ExpeditionCore.bucket(g.id)==='production').map(g=>{const o=document.createElement('option');o.value=g.key;o.textContent=({woodcutter:'木こり',miner:'採掘師',farmer:'農家'}[g.id])+' '+g.count+'人';return o;}));document.getElementById('territoryRecall').hidden=!territory.dispatch;}
 }
 function tick(dt){if(!ready)return;for(const e of TerritoryCore.tick(S,dt)){if(e.kind==='battle'){InvasionCore.select(S,e.id);if(!InvasionCore.start(S,ArmyView.sim.soldiers,{battlefield:true,placing:BattleControl.placement})){safelyHome();continue;}ArmyView.sim.encounter(++encounterId);ArmyView.sim.invasion=true;ArmyView.sim.enemies=S.outpost.enemies;ForestAudio.play('raidStart');ArmyView.fit();setTimeout(()=>{if(state().scene==='battlefield'&&S.invasion.phase==='march')focusArmy();},900);}else if(e.kind==='visit'){sync(true);focusYard();}else{sync(true);cameraHome();}sync(true);save();}if(nodeHold&&scene()==='territory'&&!Rework.paused)TerritoryCore.harvest(S,state().activeId,nodeHold,false,null,true);if(state().travel){paintMap(travelPanel.querySelector('canvas'),state().travel);travelPanel.querySelector('b').textContent=(state().travel.kind==='home'?'拠点へ輸送中':name(state().travel.id)+'へ移動中');}uiClock+=dt;saveClock+=dt;if(uiClock>.2){uiClock=0;sync();}if(saveClock>1&&scene()==='territory'){saveClock=0;save();}}
 function safelyHome(){state().scene='home';sync(true);cameraHome();}
 function boot(){if(ready)return;ready=true;state();header=document.createElement('div');header.id='territoryHeader';header.innerHTML='<div class="territory-purpose"><small class="territory-progress"></small><b class="territory-scene-name"></b></div><button id="territoryEnding" type="button" hidden>結末を見る</button><button id="territoryReinforce" type="button" hidden>小屋で編成</button><button id="territoryMapButton" type="button">攻略地図</button><button id="territoryArmy" type="button">部隊を見る</button><button id="territoryRetreat" type="button">撤退する</button><button id="territoryUse" type="button">領地を使う</button><button id="territoryUnload" type="button">荷下ろし</button><button id="territoryHome" type="button">拠点を見る</button>';document.getElementById('invasionBoard').append(header);
  toolbar=document.createElement('section');toolbar.id='territoryControls';toolbar.innerHTML='<details><summary></summary><p>現地の資材をドラッグして集積・積載。採取量2倍。研究した手持ち数を使えます。</p><p class="territory-cargo-list"></p><select id="territoryWorker" aria-label="派遣する生産班"></select><button id="territoryDispatch" type="button">選んだ班を派遣・配置</button><button id="territoryRecall" type="button">拠点へ戻す</button><p>派遣班は訪問中の領地だけで稼働し、拠点では作業を止めます。設備は拠点で使えます。</p></details><button id="territorySendCart" type="button"></button>';document.getElementById('field').append(toolbar);
  map=document.createElement('div');map.id='territoryMapOverlay';map.className='rx-overlay';map.innerHTML='<section class="rx-dialog territory-map-dialog" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="territoryMapTitle"><header><h2 id="territoryMapTitle">攻略地図</h2><button data-territory-close type="button">閉じる</button></header><p class="territory-map-progress"></p><div class="territory-map-sites"></div><p class="territory-map-detail"></p><p class="territory-map-tips"></p><details class="territory-archive"><summary>全地域・制圧済みの領地</summary><canvas width="800" height="280" aria-label="拠点と10地域の攻略地図"></canvas><div class="territory-map-archive"></div></details><details class="territory-threat" hidden><summary></summary><div></div><p></p></details><footer><button id="territoryDepart" type="button"></button><button data-territory-close type="button">閉じる</button></footer></section>';document.body.append(map);mapCanvas=map.querySelector('canvas');map.onclick=e=>{if(e.target===map||e.target.closest('[data-territory-close]'))Rework.close();};document.getElementById('territoryDepart').onclick=depart;
  travelPanel=document.createElement('div');travelPanel.id='territoryTravel';travelPanel.hidden=true;travelPanel.innerHTML='<b></b><canvas width="800" height="280"></canvas>';document.getElementById('field').append(travelPanel);
  document.getElementById('territoryMapButton').onclick=openMap;document.getElementById('territoryEnding').onclick=()=>Outpost.showEnding();document.getElementById('territoryReinforce').onclick=()=>CabinUI.open('expedition');document.getElementById('territoryHome').onclick=home;document.getElementById('territoryArmy').onclick=()=>{focusArmy();save();};document.getElementById('territoryRetreat').onclick=()=>{InvasionCore.retreat(S);sync(true);save();};document.getElementById('territoryUse').onclick=()=>visit(S.invasion.outcome.wave);document.getElementById('territorySendCart').onclick=()=>{if(TerritoryCore.sendCart(S,state().activeId)){drag=null;nodeHold=null;sync(true);save();}else Rework.toast('拠点の荷車に積荷が残っています。先に荷下ろししてください');};document.getElementById('territoryUnload').onclick=()=>{const r=TerritoryCore.unload(S);Rework.toast(r.unloaded?'積荷を地面へ荷下ろししました':'地面がいっぱいです',r.remaining?'荷車に残り'+r.remaining+'個':'倉庫へ運ぶと納品されます');if(r.point)ArmyView.viewAt(r.point.x,r.point.y);sync(true);save();};document.getElementById('territoryDispatch').onclick=()=>{pendingGroup=Number(document.getElementById('territoryWorker').value)||null;toolbar.querySelector('details').open=false;sync(true);};document.getElementById('territoryRecall').onclick=()=>{TerritoryCore.recall(S,state().activeId);sync(true);save();};
  for(const [event,handler]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up]])document.addEventListener(event,handler,true);window.addEventListener('blur',()=>{drag=null;nodeHold=null;pointers.clear();panning=null;});document.addEventListener('keydown',e=>{if(away()&&e.code==='Space'&&!Rework.paused&&!e.target.closest('button,summary,a,input,textarea,select')){e.preventDefault();e.stopImmediatePropagation();}} ,true);sync(true);
  // The camera is reconstructed from the saved scene, after the initial layout.
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const restore=()=>requestAnimationFrame(restoreSceneCamera);
  if(document.readyState==='complete')restore();
  else window.addEventListener('pageshow',restore,{once:true});

 }
 return {boot,tick,sync,enabled,away,scene,start,openMap,home,visit,focusArmy,dropPoint,dropBounds,drawGround,actors,get ready(){return ready;},get artReady(){return castle.complete&&castle.naturalWidth>0;}};
})();
