/* Harvest -> a visible ground pile -> manual pickup -> more placed workers. */
window.SupplyFactory=(()=>{
 const words={food:['食料','Food','粮食'],growing:['まだ生育中です。実った麦を収穫できます。','Still growing. Harvest the wheat when it is ripe.','正在生长，请在小麦成熟后收获。'],wood:['木材','Wood','木材'],stone:['石材','Stone','石材'],ground:['地面','Ground','地面'],pickup:['拾う','Pick up','拾取'],target:['SPACE：','SPACE: ','空格：'],enemy:['敵を攻撃','Attack enemy','攻击敌人'],empty:['採り尽くしました。別の木や岩を選んでください。','Depleted. Click another tree or rock.','已采空，请点击其他树木或岩石。'],noRoom:['資材を小屋に運び、置き場を空けましょう。','Deliver a pile to make room, or show the whole camp.','运回材料腾出空地，或显示营地全景。'],fallen:['資材をつかみ、小屋へドラッグして納品します。','On the ground. Drag one piece into the house.','已落到地面，请拖到房屋。'],received:['納品しました','Picked up','已拾取'],per:['近くの資源を切り出す','Harvests a nearby resource','采集附近资源'],chopFirst:['木をクリック、またはSpaceで採集','Hit a tree 3 times. Click it, or press Space.','点击树木或按空格，采集3次。'],pickFirst:['丸太をつかみ、小屋へドラッグして納品','Drag each fallen log into the house.','将掉落木材逐个拖到房屋。'],hireWood:['木材が揃いました。下の一覧から木こりを雇えます。','Hire a lumberjack below. 3 wood adds one worker.','点击下方雇佣伐木工。3木材增加1人。'],placeFirst:['木の近くで配置場所を選び、落下予告を確認して配置','Use Awaiting placement to put the lumberjack beside a tree.','点击等待布置，将伐木工放在树旁空地。'],watch:['木こりが伐採します。落ちた木材を小屋へ運びましょう。','The lumberjack swings the axe and drops logs. Click the fallen pile.','伐木工挥斧后会掉落木材，点击材料堆拾取。'],expand:['木材と石材を集め、木こり・採掘師・弓兵を雇いましょう。','Add more lumberjacks. Hit rocks and pick up stone to hire miners or archers.','可增加伐木工。采集岩石并拾取石材，雇佣矿工或弓箭手。'],army:['弓兵が自動で攻撃します。資材を集めて仲間を増やしましょう。','Allies attack automatically. Gather and collect supplies to grow. Click the enemy to help.','伙伴自动攻击中。采集拾取材料壮大队伍，点击敌人助战。'],pickReady:['地面の資材を納品して仲間を増やしましょう。','Supplies are on the ground. Click a pile to collect it.','地面上有材料，点击材料堆拾取。']};
 const tr=k=>words[k][Math.max(0,['ja','en','zh'].indexOf(LANG))];
 const outpostMode=()=>window.__OUTPOST_BUILD__===true||window.Outpost?.ready===true;
 const groundCapacity=()=>Math.max(1,Number(window.HarvestSkillCore?.effects(S.harvestSkills)?.groundCapacity)||12);
 const manualInterval=()=>Math.max(.1,Number(window.HarvestSkillCore?.effects(S.harvestSkills)?.manualInterval)||1);
 let ready=false,stateRef=null,width=1100,height=500,targetKey=null,feedback='',ui=0,dirty=false,saveClock=0,work=[],chips=[],hits=new Map(),flights=[],reflowAt=0,targetLabel=null;
 let measureContext=null,dropViewKey='',blockedUntil=0,lastManualAt=-Infinity,hold=null,holdGuard=0;
 const dropHits=new Map(),textWidths=new Map();
 function loadAtlas(file,columns=2,rows=2){
  const art={image:new Image(),crops:[]};art.image.onload=()=>{const im=art.image,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const rgba=ctx.getImageData(0,0,c.width,c.height).data;
   for(let i=0;i<columns*rows;i++){const col=i%columns,row=Math.floor(i/columns),sx=Math.round(col*c.width/columns),sy=Math.round(row*c.height/rows),fw=Math.round((col+1)*c.width/columns)-sx,fh=Math.round((row+1)*c.height/rows)-sy;let l=fw,r=-1,t=fh,b=-1;
    for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)if(rgba[((sy+y)*c.width+sx+x)*4+3]>48){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}art.crops[i]=r>=l&&b>=t?{x:sx+l,y:sy+t,w:r-l+1,h:b-t+1}:{x:sx,y:sy,w:1,h:1};
   }
  };art.image.src='../assets/'+file;return art;
 }
 const scenery=loadAtlas('forest-objects.webp'),loot=loadAtlas('forest-pickups.webp'),singleLoot=loadAtlas('forest-single-resources.webp',2,1),farmArt=loadAtlas('expedition-atlas.webp',4,2);
 const icons=new Map();
 const counterId=type=>'gather'+({wood:'Wood',stone:'Stone',food:'Food'}[type]||'Wood');
 const resourceTypeForWorker=id=>({woodcutter:'wood',miner:'stone',farmer:'food'}[typeof id==='object'?id.id:id]||null);
 function ensureFarm(s=stateRef||S.factory){if(!outpostMode()||!s||!S.expedition?.unlocks?.farmer&&!(S.owned?.farmer>0))return null;const before=s.nodes.length,node=SupplyCore.ensureFarm(s);if(s.nodes.length!==before){dirty=true;ArmyView.sim.setObstacles?.(s.nodes);}return node;}
 const resourceAtlas=type=>type==='food'?farmArt:outpostMode()?singleLoot:loot;
 const resourceCrop=type=>resourceAtlas(type).crops[type==='food'?7:type==='wood'?0:1];

 function icon(type){if(icons.has(type))return icons.get(type);const atlas=resourceAtlas(type),b=resourceCrop(type);if(!b)return type==='food'?'<span class="material-icon" aria-label="'+tr(type)+'">🌾</span>':'';const c=document.createElement('canvas');c.width=40;c.height=36;const z=Math.min(38/b.w,32/b.h);c.getContext('2d').drawImage(atlas.image,b.x,b.y,b.w,b.h,(40-b.w*z)/2,(36-b.h*z)/2,b.w*z,b.h*z);const html='<img class="material-icon" src="'+c.toDataURL()+'" alt="'+tr(type)+'">';icons.set(type,html);return html;}
 function state(){if(!S.factory)S.factory=SupplyCore.fresh(width,height);if(stateRef!==S.factory){stateRef=S.factory;targetKey=stateRef.nodes.filter(n=>n.type==='wood'&&n.stock>0).sort((a,b)=>Math.hypot(a.x-stateRef.depot.x,a.y-stateRef.depot.y)-Math.hypot(b.x-stateRef.depot.x,b.y-stateRef.depot.y))[0]?.key;work=[];chips=[];hits.clear();flights=[];dropHits.clear();dropViewKey='';blockedUntil=0;lastManualAt=-Infinity;stopHold();for(const d of stateRef.drops)delete d.carrier;if(outpostMode()&&!stateRef.individualDrops)SupplyCore.individualize(stateRef);if(outpostMode()&&SupplyCore.compactManualDrops(stateRef,S.camp||{},window.ConveyorCore))dirty=true;}ensureFarm(stateRef);return stateRef;}
 function resize(w,h){if(outpostMode()){w=960;h=540;}const s=state(),sx=w/s.width,sy=h/s.height;if(Math.abs(sx-1)>.001||Math.abs(sy-1)>.001){for(const n of [...s.nodes,...s.drops]){n.x*=sx;n.y*=sy;}s.depot={x:s.depot.x*sx,y:s.depot.y*sy};s.width=w;s.height=h;reflowAt=performance.now()+800;}width=w;height=h;ArmyView.sim.setObstacles?.(s.nodes);}
 function resources(u,n){if(outpostMode()&&window.ExpeditionCore?.slotQuote)return {...ExpeditionCore.slotQuote(S,u.id).cost};if(outpostMode()&&window.OutpostCore){const recipe=OutpostCore.recipe(u.id,S.owned[u.id]||0,n);if(recipe)return recipe;}if(u.id==='woodcutter')return {wood:3*n,stone:0};if(u.id==='miner')return {wood:3*n,stone:2*n};if(u.worker)return {wood:0,stone:0};return {wood:(u.id==='arch'?5:3)*n,stone:(u.id==='arch'?3:2)*n};}
 function canRecruit(u,n){if(outpostMode()&&window.ExpeditionCore?.slotQuote)return !!ExpeditionCore.slotQuote(S,u.id).ready;const s=state(),c=resources(u,n);return s.inventory.wood>=c.wood&&s.inventory.stone>=c.stone;}
 function pay(u,n){if(!canRecruit(u,n))return false;const c=resources(u,n),s=state();s.inventory.wood-=c.wood;s.inventory.stone-=c.stone;return true;}
 function costText(u,n){const c=resources(u,n);return [c.wood?tr('wood')+' '+c.wood:'',c.stone?tr('stone')+' '+c.stone:''].filter(Boolean).join(' · ');}
 function costHTML(u,n){const c=resources(u,n);return ['wood','stone'].filter(t=>c[t]).map(t=>'<span class="material-cost">'+icon(t)+'<b>'+c[t]+'</b></span>').join('');}
 function workerStats(u,lv){return tr('per')+' · '+(outpostMode()?1:1+Math.floor(lv/5))+' / '+unitIv(u).toFixed(1)+'s';}
 function nearby(point,type){return state().nodes.filter(n=>n.type===type&&(n.stock>0||type==='food')&&Math.hypot(n.x-point.x,n.y-point.y)<64).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0];}
 const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 const contains=(r,p)=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;
 const union=(a,b)=>({left:Math.min(a.left,b.left),right:Math.max(a.right,b.right),top:Math.min(a.top,b.top),bottom:Math.max(a.bottom,b.bottom)});
 const expand=(r,pad)=>({left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad});
 function textWidth(text,size){
  const key=size+':'+text;if(textWidths.has(key))return textWidths.get(key);
  if(!measureContext)measureContext=document.createElement('canvas').getContext?.('2d');
  if(measureContext)measureContext.font='700 '+size+'px system-ui';
  const value=measureContext?measureContext.measureText(text).width:text.length*size*.75;
  if(textWidths.size>256)textWidths.clear();textWidths.set(key,value);return value;
 }
 function pileGeometry(d,z=ArmyView.camera.scale){
  if(outpostMode()){
   // One physical log/stone, no quantity badge. Overlapping pieces are picked up individually.
   const crop=resourceCrop(d.type),h=Math.max((d.type==='food'?18:20)*z,10),w=h*(crop?crop.w/crop.h:d.type==='wood'?1.8:1.1),image={left:d.x-w/2/z,right:d.x+w/2/z,top:d.y-h/z,bottom:d.y};
   const hitW=Math.max(w,14),hitH=Math.max(h,14),bounds={left:d.x-hitW/2/z,right:d.x+hitW/2/z,top:d.y-hitH/z,bottom:d.y+2/z};
   return {image:bounds,art:image,label:bounds,text:'',h,w,compact:true,individual:true,bounds};
  }
  const h=Math.max(32*z,25),crop=loot.crops[d.type==='wood'?0:1],w=h*(crop?crop.w/crop.h:1.8),image={left:d.x-w/2/z,right:d.x+w/2/z,top:d.y-h/z,bottom:d.y};
  const text=tr('pickup')+' ×'+fmt(Math.floor(d.count)),labelW=textWidth(text,12)+20,baseline=d.y-(h+5)/z;
  const label={left:d.x-labelW/2/z,right:d.x+labelW/2/z,top:baseline-17/z,bottom:baseline+8/z};
  return {image,label,text,h,w,compact:false,baseline,bounds:union(union(image,label),{left:d.x-Math.max(17,23*z)/z,right:d.x+Math.max(17,23*z)/z,top:d.y,bottom:d.y+(2+Math.max(7,9*z))/z})};
 }
 function nodeInput(n,z=ArmyView.camera.scale){const half=Math.max((n.type==='wood'?85:66)/2,23/z);return {left:n.x-half,right:n.x+half,top:n.y-(n.type==='wood'?100:n.type==='food'?72:54)-5,bottom:n.y+9};}
 function nodeBlock(n,z){
  const h=n.type==='wood'?100:n.type==='food'?72:54,crop=n.type==='food'?farmArt.crops[6]:scenery.crops[n.type==='stone'?1:n.key%2?3:0],half=n.type==='food'?47:h*(crop?crop.w/crop.h:n.type==='wood'?.95:1.25)/2;
  const input=nodeInput(n,z),art={left:n.x-half,right:n.x+half,top:n.y-h,bottom:n.y};
  // Only a label actually drawn on the selected node occupies space. Reserving a
  // large translated label for all four nodes used to fill the mobile map.
  return union(input,art);
 }
 function fieldUI(){
  if(typeof ArmyView.point!=='function')return [];
  return ['campWarehouse','raidBoard','cameraTools','campaignGoal'].flatMap(id=>{
   const el=document.getElementById(id),r=el?.getBoundingClientRect();if(!r||!r.width||!r.height||el.hidden)return [];
   const style=window.getComputedStyle?.(el);if(style&&(style.display==='none'||style.visibility==='hidden'||style.opacity==='0'))return [];
   const a=ArmyView.point(r.left,r.top),b=ArmyView.point(r.right,r.bottom);
   return [{left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)}];
  });
 }
 function pileLayout(){
  const s=state(),z=ArmyView.camera.scale,pad=outpostMode()?2:3/z,blocks=s.nodes.map(n=>nodeBlock(n,z));
  blocks.push({left:s.depot.x-60,right:s.depot.x+60,top:s.depot.y-96,bottom:s.depot.y+15});
  for(const p of [...ArmyView.sim.soldiers,...BattleControl.reserved]){const h=p.u?(ArmyView.bodyHeight?.(p.u)||64):64,half=Math.max(22,(p.r||10)+12);blocks.push({left:p.x-half,right:p.x+half,top:p.y-h-5,bottom:p.y+12});}
  blocks.push(...fieldUI());
  let visible=null;const r=document.getElementById('armyCanvas')?.getBoundingClientRect();
  if(r?.width&&r?.height&&typeof ArmyView.point==='function'){const a=ArmyView.point(r.left,r.top),b=ArmyView.point(r.right,r.bottom);visible={left:a.x,right:b.x,top:a.y,bottom:b.y};}
  return {s,z,pad,blocks:blocks.map(b=>expand(b,pad)),visible,ground:Number.isFinite(ArmyView.sim.ground)?ArmyView.sim.ground:90};
 }
 function legalPile(point,count,type,layout,ignore=null){
  const box=pileGeometry({...point,count,type},layout.z).bounds,pad=layout.pad;
  if(box.left<pad||box.right>width-pad||box.top<layout.ground||box.bottom>height-pad)return false;
  if(layout.blocks.some(b=>intersects(box,b)))return false;
  return !layout.s.drops.some(d=>d!==ignore&&d!==point&&intersects(box,expand(pileGeometry(d,layout.z).bounds,pad)));
 }
 const outputPort=node=>({x:node.x+72,y:node.y+28});
 const outputForWorker=(p,node)=>({x:p.x+(p.x>=node.x?24:-24),y:p.y+24});
 function outpostDropPoint(node,ignore){
  // Items remain individual, but accumulate at one worksite rather than spreading
  // across the playfield. Overlap is intentional; carrying capacity is separate.
  return ignore||outputPort(node);
 }
 function reflowDrops(){
  if(!outpostMode())return;const layout=pileLayout(),s=layout.s;
  const key=JSON.stringify([LANG,layout.z,layout.blocks,layout.visible,singleLoot.crops.map(c=>[c.w,c.h])]);
  if(key===dropViewKey)return;dropViewKey=key;dropHits.clear();
  for(const d of s.drops){if(d.physical||window.OutpostCamp?.isHeld?.(d)||window.OutpostCamp?.isTransported?.(d)||window.OutpostCamp?.onBelt?.(d))continue;const node=s.nodes.find(n=>n.key===d.source&&n.type===d.type)||s.nodes.filter(n=>n.type===d.type).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];if(!node)continue;const p=outpostDropPoint(node,d,0,layout);if(p&&(p.x!==d.x||p.y!==d.y)){d.x=p.x;d.y=p.y;dirty=true;}}
 }
 function dropPoint(node,ignore=null,amount=1){
  if(outpostMode())return outpostDropPoint(node,ignore,amount);
  const s=state();
  const z=ArmyView.camera.scale,half=42/z,tall=58/z;
  // Displayed placement guides are promises: a new pile must never occupy one.
  const reserved=BattleControl.reserved,blocksGuide=point=>reserved.some(p=>Math.abs(p.x-point.x)<half+22&&p.y>point.y-tall&&p.y-54<point.y+10);
  const overlap=point=>[...BattleControl.neighbors(point,half+80),...BattleControl.reserved].reduce((sum,p)=>sum+(Math.abs(point.x-p.x)<half+22&&point.y>p.y-65&&point.y-tall<p.y+10?1000:0),0)
   +s.nodes.reduce((sum,n)=>sum+(Math.abs(point.x-n.x)<half+(n.type==='wood'?40:30)&&point.y>n.y-(n.type==='wood'?100:n.type==='food'?72:54)&&point.y-tall<n.y?500:0),0)
   +s.drops.reduce((sum,d)=>sum+(d!==point&&d!==ignore&&Math.abs(point.x-d.x)<half*2&&Math.abs(point.y-d.y)<tall+10?1000:0),0)
   +(Math.abs(point.x-s.depot.x)<half+50&&point.y>s.depot.y-90&&point.y-tall<s.depot.y?500:0);
  if(ignore&&!blocksGuide(ignore)&&!overlap(ignore))return ignore;
  const existing=!ignore&&s.drops.find(d=>d.type===node.type&&d.source===node.key&&Math.hypot(d.x-node.x,d.y-node.y)<180&&!blocksGuide(d)&&!overlap(d));if(existing)return existing;
  const points=[];for(const dx of [0,65,-65,100,-100,145,-145])for(const dy of [65,95,130,160,30])points.push({x:Math.max(56/z,Math.min(width-56/z,node.x+dx)),y:Math.min(height-18,node.y+dy)});
  let free=points.filter(p=>!blocksGuide(p));
  if(!free.length)for(let y=height-18;y>height*.34;y-=35)for(let x=56/z;x<width-56/z;x+=55)if(!blocksGuide({x,y}))free.push({x,y});
  return (free.length?free:points).sort((a,b)=>(overlap(a)+Math.hypot(a.x-node.x,a.y-node.y))-(overlap(b)+Math.hypot(b.x-node.x,b.y-node.y)))[0];
 }
 function take(node,amount=1,worker=false,source=null){const s=state(),actual=Math.min(node.stock,outpostMode()?1:amount);if(!actual)return null;if(outpostMode()&&s.drops.length>=groundCapacity()){feedback=capacityMessage();blockedUntil=s.time+2;return null;}if(outpostMode())reflowDrops();let point=outpostMode()&&worker&&source?outputForWorker(source,node):dropPoint(node,null,actual);if(!point){feedback=tr('noRoom');blockedUntil=s.time+2;return null;}const d=SupplyCore.drop(s,node.type,actual,point.x,point.y,node.key,outpostMode()?groundCapacity():SupplyCore.MAX_LOOSE);if(!d)return null;blockedUntil=0;node.stock-=actual;window.Outpost?.logHarvest?.(node.type,actual,worker);if(!node.stock)node.regrow=s.time+(node.type==='food'?SupplyCore.FARM_REGROW_SECONDS:65);if(worker)d.worker=true;if(outpostMode()){d.physical=true;d.airUntil=s.time+.38;}chips.push({drop:d,node,x:source?node.x+Math.sign(source.x-node.x)*24:node.x,y:source?Math.min(node.y-5,source.y-18):node.y-25,amount:actual,worker,to:{x:d.x,y:d.y},started:s.time,until:s.time+.38});if(chips.length>24)chips.shift();hits.set(node.key,{at:s.time,worker});dirty=true;ForestAudio.play(node.type==='food'?'pickup':node.type,{group:worker?'worker':'user'});return d;}
 function choose(type){const s=state(),node=s.nodes.find(n=>n.key===targetKey&&n.type===type&&(n.stock>0||type==='food'))||s.nodes.find(n=>n.type===type&&(n.stock>0||type==='food'));if(node)targetKey=node.key;translate();return node;}
 function selectBoss(){targetKey=null;feedback='';document.getElementById('field').classList.add('target-boss');translate();}
 function harvestSelected(){
  if(!ready||Rework.paused||BattleControl.placement||document.hidden||window.OutpostCamp?.layingRails)return false;
  const current=state(),node=current.nodes.find(n=>n.key===targetKey);if(!node||!node.stock){feedback=tr(node?.type==='food'?'growing':'empty');translate();return false;}
  const amount=outpostMode()?Math.max(1,Math.min(8,window.HarvestSkillCore?.effects(S.harvestSkills)?.manualYield||1)):1;
  let made=0;for(let i=0;i<amount;i++){if(!take(node))break;made++;}
  if(!made){translate();return false;}if(outpostMode())window.HarvestSkills?.noteHarvest?.({node,made});lastManualAt=current.time;feedback=tr('fallen');document.getElementById('field').classList.remove('target-boss');translate();save();dirty=false;return true;
 }
 function stopHold(source){if(!hold||source&&source!==hold.source)return;const previous=hold;hold=null;cancelAnimationFrame(holdGuard);holdGuard=0;const field=document.getElementById('field');if(previous.source==='pointer')try{if(field.hasPointerCapture(previous.pointerId))field.releasePointerCapture(previous.pointerId);}catch(_){} }
 // A press is one gathering action. Automation comes from placed workers, not holding input.
 function beginHold(){return false;}
 function installHold(){const field=document.getElementById('field');for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{if(hold?.source==='pointer'&&e.pointerId===hold.pointerId)stopHold('pointer');},true);field.addEventListener('pointermove',e=>{if(hold?.source!=='pointer'||e.pointerId!==hold.pointerId)return;const node=state().nodes.find(n=>n.key===hold.key);if(!node||!contains(nodeInput(node,ArmyView.camera.scale),ArmyView.point(e.clientX,e.clientY)))stopHold('pointer');});window.addEventListener('blur',()=>stopHold());window.addEventListener('pagehide',()=>stopHold());document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHold();});}
 function pickup(item){if(outpostMode())return window.OutpostCamp?.pickup(item)||false;const reward=SupplyCore.deliver(state(),item);if(!reward)return false;flights.push({x:item.x,y:item.y,type:item.type,count:reward.count,at:state().time});if(flights.length>6)flights.shift();const first=!S.firstWorkerPickup&&item.worker&&reward.type==='wood';if(first)S.firstWorkerPickup=true;if(reward.type==='gold')earnGold(reward.count);feedback='＋'+reward.count+' '+(reward.type==='gold'?'G':tr(reward.type))+' · '+tr('received');ForestAudio.play('pickup');translate();if(first)renderCards();updateHud();save();dirty=false;const counter=document.getElementById(counterId(reward.type));counter?.animate?.([{transform:'scale(1.1)',background:'#e2ce8b'},{transform:'scale(1)'}],{duration:180});return true;}
 function pileAt(point){const z=ArmyView.camera.scale,s=state(),byDistance=(a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y);const direct=s.drops.filter(d=>{if(d.airUntil>s.time||window.OutpostCamp?.isHeld?.(d))return false;const r=dropHits.get(d)||pileGeometry(d,z);return contains(r.image,point)||contains(r.label,point);}).sort((a,b)=>byDistance(a,b)||b.key-a.key)[0];if(direct)return direct;
  // A finger may land beside a tiny sprite. Choose one nearest item, never a group;
  // keep the resource bodies available for harvesting rather than stealing their taps.
  if(outpostMode()&&window.matchMedia?.('(pointer: coarse)').matches&&!s.nodes.some(n=>contains(nodeInput(n,z),point))){return s.drops.filter(d=>{if(d.airUntil>s.time||window.OutpostCamp?.isHeld?.(d))return false;const b=pileGeometry(d,z).image;return Math.hypot((b.left+b.right)/2-point.x,(b.top+b.bottom)/2-point.y)*z<=22;}).sort(byDistance)[0]||null;}return null;}

 function gatherAt(point){const s=state(),z=ArmyView.camera.scale;
  const label=targetLabel&&contains(targetLabel,point),nodes=s.nodes.filter(n=>contains(nodeInput(n,z),point)).sort((a,b)=>Math.hypot(a.x-point.x,a.y-35-point.y)-Math.hypot(b.x-point.x,b.y-35-point.y));
  if(outpostMode()){
   reflowDrops();if(nodes.length){targetKey=nodes[0].key;harvestSelected();return true;}if(label){targetKey=targetLabel.key;harvestSelected();return true;}
   const drop=pileAt(point);return drop?pickup(drop):false;
  }
  const drop=s.drops.filter(d=>Math.abs(d.x-point.x)<Math.max(30,42/z)&&point.y>=d.y-Math.max(32,25/z)-26/z&&point.y<=d.y+14/z).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0];if(drop)return pickup(drop);if(label){targetKey=targetLabel.key;return harvestSelected();}if(!nodes.length)return false;targetKey=nodes[0].key;harvestSelected();return true;
 }
 function capacityMessage(){return LANG==='ja'?'資材置き場が満杯（'+state().drops.length+' / '+groundCapacity()+'）。納品するか、強化で上限を増やしましょう。':LANG==='zh'?'材料堆放已满（'+state().drops.length+' / '+groundCapacity()+'）。请运回材料或升级容量。':'Ground storage full ('+state().drops.length+' / '+groundCapacity()+'). Deliver materials or upgrade storage.';}
 function totalGround(type){return state().drops.filter(d=>d.type===type).reduce((n,d)=>n+d.count,0);}
 function guide(){if(outpostMode()&&!BattleControl.placement){if(blockedUntil>state().time)return state().drops.length>=groundCapacity()?capacityMessage():tr('noRoom');if(window.Outpost?.ready)return Outpost.guide();}const s=state(),wood=s.inventory.wood,loose=totalGround('wood');if((S.pending?.woodcutter||0)>0)return tr('placeFirst');if(!(S.owned.woodcutter||0)&&!S.clearedBossWave){if(wood>=3)return tr('hireWood');if(wood+loose>=3)return tr('pickFirst');return tr('chopFirst')+' '+Math.min(3,wood+loose)+' / 3';}if(!S.firstWorkerPickup&&ArmyView.sim.soldiers.some(p=>p.id==='woodcutter'))return s.drops.some(d=>d.worker&&d.type==='wood')?tr('pickFirst'):tr('watch');if(S.clearedBossWave>=S.bossWave)return (bossDead?['たおした！ なかまをふやす？ つぎへすすむ？','Cleared! Grow your army, or go next.','击败了！扩充队伍，还是挑战下一个？']:['おなじ敵で Gあつめ中！','Repeating this enemy to earn gold.','正在反复讨伐此敌，积累金币。'])[Math.max(0,['ja','en','zh'].indexOf(LANG))];if(ArmyView.sim.soldiers.some(p=>!p.u.worker&&!p.u.healer))return tr('army');if(s.drops.length)return tr('pickReady');return tr('expand');}
 function tick(dt){if(!ready)return;const s=state(),sim=ArmyView.sim;s.time+=dt;if(outpostMode()&&SupplyCore.unpackLegacy(s,4,groundCapacity())){dirty=true;dropViewKey='';}if(hold){if(Rework.paused||BattleControl.placement||document.hidden||window.OutpostCamp?.layingRails||targetKey!==hold.key)stopHold();else harvestSelected();}for(const n of s.nodes)if(n.type!=='food'&&n.stock<=0&&s.time>=n.regrow)n.stock=180;if(SupplyCore.tickFarms(s,Math.max(1,sim.soldiers.filter(p=>p.id==='farmer').length)))dirty=true;
  // Reflow loose materials once after a responsive width change; people stay put.
  if(reflowAt&&performance.now()>=reflowAt){reflowAt=0;for(const d of s.drops){if(d.physical||window.OutpostCamp?.isHeld?.(d)||window.OutpostCamp?.isTransported?.(d)||window.OutpostCamp?.onBelt?.(d))continue;const node=s.nodes.filter(n=>n.type===d.type&&(d.source==null||n.key===d.source)).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];if(node){const p=dropPoint(node,d);if(p){d.x=p.x;d.y=p.y;}}}dirty=true;}
  const pending=[];for(const job of work){if(job.due>sim.time){pending.push(job);continue;}if(sim.soldiers.includes(job.p)&&Math.hypot(job.p.x-job.node.x,job.p.y-job.node.y)<64)take(job.node,job.amount,true,job.p);}work=pending;
  for(const p of sim.soldiers){if(!resourceTypeForWorker(p.u.worker)||p.cooldown>0)continue;const node=nearby(p,resourceTypeForWorker(p.u.worker));if(!node||node.stock<=0)continue;p.cooldown=p.interval;p.attackAt=sim.time;p.workFacing=node.x<p.x?-1:1;p.workNode=node.key;work.push({p,node,due:sim.time+(p.u.anim?.impact||300)/1000,amount:outpostMode()?1:1+Math.floor((S.ulvl[p.id]||0)/5)});}
  if(outpostMode())window.OutpostCamp?.tick(dt);
  chips=chips.filter(c=>c.until>s.time);flights=flights.filter(f=>s.time-f.at<.42);for(const [key,hit]of hits)if(s.time-hit.at>.18)hits.delete(key);ui+=dt;saveClock+=dt;if(ui>.2){ui=0;translate();}if(dirty&&saveClock>=1){saveClock=0;save();dirty=false;}
 }
 function translate(){if(!ready)return;document.body.classList.toggle('first-camp',S.clearedBossWave<1);document.body.classList.toggle('resources-open',!!S.firstWorkerPickup||S.clearedBossWave>0);document.body.classList.toggle('has-army',ArmyView.sim.soldiers.length>0);const s=state(),node=s.nodes.find(n=>n.key===targetKey);for(const type of ['wood','stone',...(s.nodes.some(n=>n.type==='food')?['food']:[])]){const b=document.getElementById(counterId(type));if(!b)continue;b.hidden=false;const ground=totalGround(type);b.innerHTML='<span>'+icon(type)+'<b>'+fmt(Math.floor(s.inventory[type]||0))+'</b></span><small>'+(ground?tr('ground')+' '+fmt(Math.floor(ground)):'&nbsp;')+'</small>';b.setAttribute('aria-pressed',node?.type===type);}
 document.getElementById('gatherFeedback').textContent=tr('target')+(node?tr(node.type):tr('enemy'));document.getElementById('pickupFeedback').textContent=outpostMode()?(s.drops.length>=groundCapacity()?capacityMessage():(feedback?feedback+' · ':'')+(LANG==='ja'?'地面の資材 ':LANG==='zh'?'地面材料 ':'Ground materials ')+s.drops.length+' / '+groundCapacity()):feedback;BattleControl.translate();document.getElementById('recruitQuantity').disabled=!S.firstWorkerPickup&&S.clearedBossWave<1;
 if(outpostMode()){document.getElementById('rxTree').hidden=true;document.getElementById('rxBook').hidden=true;document.getElementById('prestigeBtn').hidden=true;document.getElementById('rxArmyTools').hidden=false;document.getElementById('rxArmyTools').disabled=false;return;}
 const contract=Core.contract(S);document.getElementById('cityContract').textContent=['たおすと ＋','Bounty ＋','击败 ＋'][Math.max(0,['ja','en','zh'].indexOf(LANG))]+' '+fmt(contract.total)+' G';document.getElementById('rxTree').hidden=S.clearedBossWave<10;document.getElementById('rxBook').hidden=false;document.getElementById('rxBook').disabled=S.clearedBossWave<1;document.getElementById('rxArmyTools').disabled=S.clearedBossWave<1;document.getElementById('prestigeBtn').hidden=S.clearedBossWave<10;}
 function sprite(ctx,atlas,index,x,y,height,z){const crop=atlas.crops[index];if(!crop)return;const h=height*z,w=h*crop.w/crop.h;ctx.drawImage(atlas.image,crop.x,crop.y,crop.w,crop.h,x-w/2,y-h,w,h);}
 function pill(ctx,label,x,y,size=13){ctx.font='700 '+size+'px system-ui';ctx.textAlign='center';const w=ctx.measureText(label).width+20;ctx.fillStyle='#17362cf2';ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x-w/2,y-size-5,w,size+13,6);ctx.fill();}else ctx.fillRect(x-w/2,y-size-5,w,size+13);ctx.fillStyle='#fff0bb';ctx.fillText(label,x,y);}
 function singlePiece(ctx,type,x,y,h){
  const crop=resourceCrop(type);if(crop){ctx.drawImage(resourceAtlas(type).image,crop.x,crop.y,crop.w,crop.h,x-h*crop.w/crop.h/2,y-h,h*crop.w/crop.h,h);return;}
  ctx.save();ctx.translate(Math.round(x),Math.round(y));const q=h/14;ctx.scale(q,q);
  if(type==='wood'){ctx.fillStyle='#3d281a';ctx.fillRect(-13,-11,26,10);ctx.fillStyle='#956037';ctx.fillRect(-11,-10,21,8);ctx.fillStyle='#c5904e';ctx.fillRect(-10,-9,19,2);ctx.fillStyle='#dfa860';ctx.fillRect(9,-10,5,8);ctx.fillStyle='#97663b';ctx.fillRect(11,-8,2,4);ctx.fillStyle='#b17b43';ctx.fillRect(-10,-4,18,2);}
  else if(type==='food'){ctx.strokeStyle='#8c692e';ctx.lineWidth=2;for(const dx of [-5,-2,1,4]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(dx,-14);ctx.stroke();ctx.fillStyle='#e6be5b';for(const yy of [-13,-10,-7]){ctx.fillRect(dx-3,yy,4,3);ctx.fillRect(dx+1,yy-1,4,3);}}ctx.fillStyle='#7a5732';ctx.fillRect(-4,-3,8,2);}
  else{ctx.fillStyle='#35433e';ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(-7,-10);ctx.lineTo(-2,-14);ctx.lineTo(5,-12);ctx.lineTo(9,-5);ctx.lineTo(6,0);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.fillStyle='#9caaa0';ctx.beginPath();ctx.moveTo(-6,-9);ctx.lineTo(-1,-12);ctx.lineTo(4,-10);ctx.lineTo(1,-5);ctx.lineTo(-5,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#6e8078';ctx.beginPath();ctx.moveTo(4,-10);ctx.lineTo(7,-5);ctx.lineTo(5,-2);ctx.lineTo(0,-2);ctx.lineTo(1,-5);ctx.closePath();ctx.fill();}ctx.restore();
 }
 let deliveryCache={camp:null,at:-Infinity,signature:'',points:new Map()};
 function outputDeliveryStatus(point){const s=state(),camp=S.camp,speed=ConveyorCore.SPEED*Math.max(1,window.HarvestSkillCore?.effects(S.harvestSkills)?.cartSpeed||1)*(camp.cart?1.25:1);
  if(deliveryCache.camp!==camp||s.time-deliveryCache.at>.2||s.time<deliveryCache.at){const signature=JSON.stringify([camp.links,camp.platforms,speed]);if(deliveryCache.camp!==camp||signature!==deliveryCache.signature)deliveryCache={camp,at:s.time,signature,points:new Map()};else deliveryCache.at=s.time;}
  const key=point.x+':'+point.y;if(!deliveryCache.points.has(key)){if(deliveryCache.points.size>=512)deliveryCache.points.clear();deliveryCache.points.set(key,ConveyorCore.deliveryStatus(camp.links,camp.platforms||[],point,speed));}return deliveryCache.points.get(key);}

 function drawOutputPreview(ctx,{ox,oy,z},point,u){
  if(!outpostMode()||!u?.worker)return;const node=nearby(point,resourceTypeForWorker(u.worker));if(!node)return;const end=outputForWorker(point,node),x0=ox+node.x*z,y0=oy+(node.y-24)*z,x1=ox+end.x*z,y1=oy+end.y*z,status=outputDeliveryStatus(end),connected=status==='warehouse';ctx.save();ctx.strokeStyle=connected?'#bcf2a5':'#ffe49a';ctx.fillStyle=connected?'#94d58433':'#f0cd6f22';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo((x0+x1)/2,Math.min(y0,y1)-46*z,x1,y1-5*z);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x1,y1,Math.max(12,22*z),Math.max(5,8*z),0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.8;singlePiece(ctx,node.type,x1,y1,Math.max(20*z,10));ctx.globalAlpha=1;const label=({ja:{unknown:'搬送経路を確認してください',manual:'ここに落ちる・手運び',blocked:'受け口あり・倉庫未接続',warehouse:'倉庫へ搬送可能'},en:{unknown:'CHECK THE DELIVERY ROUTE',manual:'LANDS HERE · CARRY BY HAND',blocked:'RECEIVER · NOT LINKED TO STORAGE',warehouse:'DELIVERS TO STORAGE'},zh:{unknown:'请检查运输路线',manual:'掉落此处・需手动搬运',blocked:'已有接料口・未连仓库',warehouse:'可运入仓库'}}[LANG]||{manual:'LANDS HERE',blocked:'NOT LINKED TO STORAGE',warehouse:'DELIVERS TO STORAGE'})[status];pill(ctx,label,x1,y1+25,11);ctx.restore();
 }
 function drawFarm(ctx,s,node,z){
  const stage=SupplyCore.farmStage(s,node),index=stage==='ripe'?6:stage==='growing'?5:4;if(farmArt.crops[index]){const crop=farmArt.crops[index];sprite(ctx,farmArt,index,0,0,94*crop.h/crop.w,z);return;}
  ctx.save();ctx.scale(z,z);ctx.fillStyle='#493325';ctx.beginPath();ctx.moveTo(-43,-8);ctx.lineTo(-25,-34);ctx.lineTo(37,-28);ctx.lineTo(47,-3);ctx.lineTo(26,9);ctx.lineTo(-28,9);ctx.closePath();ctx.fill();ctx.strokeStyle='#8b6743';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-29+i*17,-21);ctx.lineTo(-21+i*17,4);ctx.stroke();}if(stage!=='soil'){ctx.strokeStyle=stage==='ripe'?'#dfb951':'#6f9a45';ctx.lineWidth=3;for(let i=0;i<12;i++){const x=-26+(i%6)*10,y=-8+Math.floor(i/6)*12;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-(stage==='ripe'?22:12));ctx.stroke();if(stage==='ripe'){ctx.fillStyle='#e6c367';ctx.fillRect(x-5,y-24,7,8);}}}ctx.restore();
 }
 function draw(ctx,{ox,oy,z}){
  if(!ready)return;reflowDrops();targetLabel=null;dropHits.clear();const s=state(),X=x=>ox+x*z,Y=y=>oy+y*z,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const objects=[...s.nodes.map(n=>({...n,kind:'node'})),{...s.depot,kind:'depot'}].sort((a,b)=>a.y-b.y);
  for(const n of objects){
   const x=X(n.x),y=Y(n.y);ctx.fillStyle='#101b1855';ctx.beginPath();ctx.ellipse(x,y,(n.kind==='depot'?40:23)*z,7*z,0,0,Math.PI*2);ctx.fill();
   if(n.kind==='depot'){sprite(ctx,scenery,2,x,y,90,z);continue;}
   const selected=!BattleControl.placement&&n.key===targetKey,hit=hits.get(n.key),age=hit?s.time-hit.at:1;
   if(selected){ctx.strokeStyle='#ffe3a5';ctx.fillStyle='#f7db8d20';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,Math.max(16,30*z),Math.max(6,11*z),0,0,Math.PI*2);ctx.fill();ctx.stroke();}
   if(selected&&hold?.key===n.key){const progress=Math.max(0,Math.min(1,(s.time-lastManualAt)/manualInterval()));ctx.strokeStyle='#ffe3a5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-20*z,Math.max(8,13*z),-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();}
   ctx.save();ctx.translate(x,y);
   const kick=age<.18?(1-age/.18):0;
   if(kick&&!reduced){ctx.rotate(Math.sin(age*65)*kick*(hit.worker?.018:.055));ctx.scale(1+kick*.035,1-kick*.025);}
   ctx.globalAlpha=n.type==='food'?1:n.stock?1:.25;
   if(n.type==='food')drawFarm(ctx,s,n,z);else sprite(ctx,scenery,n.type==='stone'?1:n.key%2?3:0,0,0,n.type==='wood'?100:54,z);ctx.restore();
   if(outpostMode()&&!n.stock){const left=Math.max(0,Math.ceil(n.regrow-s.time));pill(ctx,LANG==='ja'?(n.type==='food'?'収穫まで ':'再生まで ')+left+'秒':LANG==='zh'?left+'秒':left+'s',x,y-12*z,11);}
   if(selected){
    const firstWoodCost=outpostMode()&&window.OutpostCore?OutpostCore.recipe('woodcutter',0,1).wood:3;
    const initial=!(S.owned.woodcutter||0)&&!S.clearedBossWave,needsPickup=initial&&s.inventory.wood+totalGround('wood')>=firstWoodCost;
    if(!needsPickup&&(!outpostMode()||S.outpost?.phase!=='active')){const label=LANG==='ja'?(n.type==='wood'?'木を連打 → 丸太が落ちる':n.type==='food'?(n.stock?'実った麦をタップ → 食料が落ちる':'畑で麦が育っています'):'岩を連打 → 石材が落ちる'):LANG==='en'?'TAP · '+tr(n.type):'连续点击'+tr(n.type);const size=Math.max(12,14*z),base=y-(n.type==='wood'?100:n.type==='food'?72:54)*z-8;ctx.font='700 '+size+'px system-ui';const half=ctx.measureText(label).width/2+10;
     const people=BattleControl.neighbors(n,180/z),clear=py=>{const box={left:n.x-half/z,right:n.x+half/z,top:(py-size-5-oy)/z,bottom:(py+8-oy)/z};return !people.some(p=>Math.abs(X(p.x)-x)<half+23*z&&py+8>Y(p.y)-ArmyView.bodyHeight(p.u)*z&&py-size-5<Y(p.y)+8*z)&&(!outpostMode()||(!s.nodes.some(other=>other.key!==n.key&&intersects(box,nodeInput(other,z)))&&!fieldUI().some(ui=>intersects(box,ui))&&!s.drops.some(d=>intersects(pileGeometry(d,z).bounds,box))));};
     let labelY=base;for(const py of [base,Y(n.y)+size+14,base-28,base-56,base-84,base-112].map(v=>Math.max(size+14,v))){if(clear(py)){labelY=py;break;}}
     pill(ctx,label,x,labelY,size);targetLabel={key:n.key,left:n.x-half/z,right:n.x+half/z,top:(labelY-size-5-oy)/z,bottom:(labelY+8-oy)/z};}
    if(initial&&!needsPickup&&!window.OutpostTutorial?.active){ctx.fillStyle='#ffdf83';ctx.font='900 27px system-ui';ctx.textAlign='center';ctx.fillText('↓',x,y-28*z);const collected=Math.min(firstWoodCost,s.inventory.wood+totalGround('wood'));for(let i=0;i<firstWoodCost;i++){ctx.beginPath();ctx.arc(x+(i-(firstWoodCost-1)/2)*13,y+15,4,0,Math.PI*2);ctx.fillStyle=i<collected?'#ffdf83':'#183327';ctx.fill();ctx.strokeStyle='#ffdf83';ctx.lineWidth=1;ctx.stroke();}}
   }
  }
  if(outpostMode()&&window.OutpostCamp?.layingRails){for(const p of ArmyView.sim.soldiers.filter(p=>p.u.worker))drawOutputPreview(ctx,{ox,oy,z},p,p.u);}
  for(const c of chips){if(outpostMode()&&c.drop){const t=Math.max(0,Math.min(1,(s.time-c.started)/.38)),a={x:c.node.x,y:c.node.y-24},b=c.to,control={x:(a.x+b.x)/2,y:Math.min(a.y,b.y)-46};const px=(1-t)*(1-t)*a.x+2*(1-t)*t*control.x+t*t*b.x,py=(1-t)*(1-t)*a.y+2*(1-t)*t*control.y+t*t*b.y;singlePiece(ctx,c.node.type,X(px),Y(py),pileGeometry(c.drop,z).h);continue;}const t=(c.until-s.time)/.38;ctx.globalAlpha=t;sprite(ctx,loot,c.node.type==='wood'?2:3,X(c.x+12*(1-t)),Y(c.y-(1-t)*18),30,z);ctx.globalAlpha=1;if(!c.worker){ctx.font='900 20px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#173328';ctx.strokeText('+'+c.amount,X(c.node.x+24),Y(c.node.y-55)-(1-t)*20);ctx.fillStyle='#ffe6a2';ctx.fillText('+'+c.amount,X(c.node.x+24),Y(c.node.y-55)-(1-t)*20);}}
  for(const d of s.drops){if(window.OutpostCamp?.isHeld(d)||d.airUntil>s.time)continue;const x=X(d.x),y=Y(d.y),geometry=pileGeometry(d,z),onBelt=window.OutpostCamp?.onBelt?.(d),lift=geometry.individual&&!onBelt?(reduced?3:4+Math.sin(s.time*2.8+d.key*.35)*1.8):0;dropHits.set(d,{...geometry,image:{...geometry.image,top:geometry.image.top-7/z}});ctx.fillStyle='#e3d19b33';ctx.beginPath();ctx.ellipse(x,y+2,geometry.compact?geometry.w*.43:Math.max(17,23*z),geometry.compact?3:Math.max(7,9*z),0,0,Math.PI*2);ctx.fill();if(geometry.individual){ctx.save();ctx.shadowColor='#f7df9c88';ctx.shadowBlur=5;singlePiece(ctx,d.type,x,y-lift,geometry.h);ctx.restore();}else sprite(ctx,loot,d.type==='wood'?0:1,x,y,geometry.h/z,z);
   if(geometry.individual){}else if(geometry.compact){const r=geometry.label,l=X(r.left),t=Y(r.top),w=(r.right-r.left)*z,h=(r.bottom-r.top)*z;ctx.fillStyle='#19372df0';ctx.beginPath();if(ctx.roundRect){ctx.roundRect(l,t,w,h,4);ctx.fill();}else ctx.fillRect(l,t,w,h);ctx.font='800 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0bb';ctx.fillText(geometry.text,l+w/2,t+11);}else pill(ctx,geometry.text,x,Y(geometry.baseline),12);
  }
  // The packet traces the actual resource-to-pile destination, which can be
  // farther away on a narrow screen. It never credits inventory or moves allies.
  if(!outpostMode())for(const c of chips){if(!c.to)continue;const t=Math.min(1,Math.max(0,(s.time-c.started)/.3));if(t>=1)continue;const from={x:c.node.x,y:c.node.y-26},ease=1-Math.pow(1-t,2),x=X(from.x+(c.to.x-from.x)*ease),y=Y(from.y+(c.to.y-from.y)*ease)-(reduced?0:Math.sin(t*Math.PI)*18);ctx.globalAlpha=reduced?1-t:.95;sprite(ctx,loot,c.node.type==='wood'?0:1,x,y,Math.max(13,18*z),1);ctx.globalAlpha=1;}

  for(const f of flights){const t=Math.min(1,(s.time-f.at)/.42),button=document.getElementById(counterId(f.type)),rect=button.getBoundingClientRect(),view=document.getElementById('armyCanvas').getBoundingClientRect(),endX=rect.left+rect.width/2-view.left,endY=rect.top+rect.height/2-view.top;const ease=1-Math.pow(1-t,2),x=X(f.x)+(endX-X(f.x))*ease,y=Y(f.y)+(endY-Y(f.y))*ease-(reduced?0:Math.sin(t*Math.PI)*24);ctx.globalAlpha=1-t*.6;sprite(ctx,loot,f.type==='wood'?0:1,x,y,22,1);ctx.globalAlpha=1;}
 }
 function boot(){if(ready)return;ready=true;state();installHold();const inv=document.createElement('div');inv.id='supplyInventory';inv.innerHTML='<div class="resource-buttons"><button id="gatherWood" type="button"></button><button id="gatherStone" type="button"></button><button id="gatherFood" type="button" hidden></button></div><small id="gatherFeedback"></small><small id="pickupFeedback" role="status"></small>';document.getElementById('hudTools').before(inv);for(const type of ['wood','stone','food']){const counter=document.getElementById(counterId(type));counter.tabIndex=outpostMode()?-1:0;counter.style.pointerEvents=outpostMode()?'none':'';counter.onclick=()=>{BattleControl.setPlacement(false);choose(type);harvestSelected();};}const city=document.createElement('div');city.id='cityContract';document.getElementById('bossPlate').append(city);window.addEventListener('pagehide',()=>{if(dirty)save();});resize(width,height);translate();}
 return {resourceTypeForWorker,outputDeliveryStatus,ensureFarm,isAirborne:d=>d.airUntil>state().time,outputPort,outputForWorker,drawOutputPreview,drawItem:singlePiece,itemGeometry:d=>pileGeometry(d),boot,tick,draw,resize,translate,workerStats,resources,canRecruit,pay,costText,costHTML,icon,harvestSelected,beginHold,stopHold,get holding(){return !!hold;},gatherAt,pileAt,pileBounds:d=>pileGeometry(d).bounds,selectBoss,choose,pickup,nearby,guide,totalGround,get resourceTarget(){return targetKey!==null;},get state(){return state();},get artReady(){return scenery.crops.length===4&&loot.crops.length===4&&(!outpostMode()||singleLoot.crops.length===2);},get stats(){return {groundCapacity:groundCapacity(),pendingWork:work.length,ground:state().drops.length,woodGround:totalGround('wood'),stoneGround:totalGround('stone'),foodGround:totalGround('food')};},get building(){return false;},setBuilding:()=>{}};
})();
