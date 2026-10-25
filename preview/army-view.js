/* Every recruited soldier is a real sprite. One culled canvas keeps large armies affordable. */
window.ArmyView=(()=>{
 let canvas,ctx,viewport,world,stage,ground,terrainKey='',slots=[],counts={},images=new Map(),attacks={},camera={scale:1,target:1,fit:1,w:1100,h:540},frame=0,last=0,returnTimer,flash=null,manual=false,portraitFrame;
 let sim=new ArmySim.Battle(),lastState=null,accumulator=0,drawOrder=[],sortAt=0,projectiles=[],fxClock=0,spriteCache=new Map(),engagedDps=0,powerClock=0,viewSize='';
 const root=()=>document.getElementById('field');
 const outpost=()=>window.__OUTPOST_BUILD__===true;
 function raidState(){return window.Outpost?.ready?Outpost.state():S.outpost;}
 function bindRaid(){if(!outpost())return;const state=raidState();sim.outpostState=state;sim.roundToken=state?.round||0;sim.enemies=state?.phase==='active'?state.enemies:[];}
 const count=()=>Object.values(S.owned).reduce((n,v)=>n+v,0);
 function imageFor(u){
  const evolved=!outpost()&&Core.tier(S.ulvl[u.id]||0)>0;
  const name=evolved&&u.id==='sword'?'unit_sword_veteran.webp':u.anim?.sheet||u.sprite;
  const imageKey=u.anim?.atlasFrames?name+':'+u.id:name;
  if(!images.has(imageKey)){
   const img=new Image();
   img.onload=()=>{
    if(u.anim?.atlasFrames&&!img.atlasPrepared){const packed=document.createElement('canvas'),cw=img.naturalWidth/4,ch=img.naturalHeight/2;packed.width=cw*u.anim.frames;packed.height=ch;const paint=packed.getContext('2d');u.anim.atlasFrames.forEach((n,i)=>paint.drawImage(img,n%4*cw,Math.floor(n/4)*ch,cw,ch,i*cw,0,cw,ch));img.atlasPrepared=true;img.src=packed.toDataURL();return;}

    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
    const data=x.getImageData(0,0,c.width,c.height).data,frames=u.anim?.frames||1,fw=Math.floor(c.width/frames),boxes=[];
    for(let f=0;f<frames;f++){
     let l=fw,r=0,t=c.height,b=0;
     for(let y=0;y<c.height;y++)for(let px=0;px<fw;px++)if(data[(y*c.width+f*fw+px)*4+3]>120){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,y);b=Math.max(b,y);}
     let fl=fw,fr=0;for(let y=Math.floor(b-(b-t)*.12);y<=b;y++)for(let px=l;px<=r;px++)if(data[(y*c.width+f*fw+px)*4+3]>120){fl=Math.min(fl,px);fr=Math.max(fr,px);}
     boxes.push({x:Math.max(0,l-1),y:Math.max(0,t-1),w:r-l+3,h:b-t+3,footX:u.anim?.footX?.[f]!==undefined?u.anim.footX[f]*fw:(fl+fr)/2,footY:u.anim?.footY!==undefined?u.anim.footY*c.height:b+1});
    }
    // Scale the idle body, not the raised weapon or transparent sprite sheet.
    const idle=boxes[0];img.geometry={boxes,bodyHeight:idle.h,left:Math.min(...boxes.map(b=>b.x-b.footX)),right:Math.max(...boxes.map(b=>b.x+b.w-b.footX)),top:Math.min(...boxes.map(b=>b.y-b.footY)),bottom:Math.max(...boxes.map(b=>b.y+b.h-b.footY))};
    img.crop=idle;
    const preview=document.createElement('canvas');preview.width=Math.ceil(96*idle.w/idle.h);preview.height=96;preview.getContext('2d').drawImage(img,idle.x,idle.y,idle.w,idle.h,0,0,preview.width,96);img.portrait=preview.toDataURL();cancelAnimationFrame(portraitFrame);portraitFrame=requestAnimationFrame(()=>{if(window.Rework)renderCards();window.CampTraining?.refresh();});
   };
   img.src='../assets/'+name;images.set(imageKey,img);
  }
  return images.get(imageKey);
 }
 function layout(){
  const n=count();
  const size=viewport.clientWidth+':'+viewport.clientHeight,resized=size!==viewSize;viewSize=size;
  const raid=outpost(),giant=Math.min(340,240*Math.pow(1.025,S.bossWave-1));
  camera.w=raid?OutpostCore.WORLD.width:viewport.clientWidth<680?640:1100;
  // Reserve the distant horizon; every row stands on the continuous ground plane.
  camera.h=raid?OutpostCore.WORLD.height:500;
  sim.fixedWorld=raid;
  sim.bounds(camera.w,camera.h,raid?{x:10000,y:10000,r:0,alive:false}:{x:camera.w-55-giant*.40,y:camera.h-70-giant*.22,r:giant*.28});window.BattleControl?.resize(camera.w,camera.h);window.SupplyFactory?.resize(camera.w,camera.h);
  world.style.width=camera.w+'px';world.style.height=camera.h+'px';
  bossEl.style.height=giant+'px';bossEl.style.maxWidth=(giant*1.25)+'px';bossEl.style.bottom='48px';bossEl.style.right='55px';
  camera.fit=Math.min(1.15,viewport.clientWidth/camera.w,viewport.clientHeight/camera.h);
  if(!manual){camera.target=camera.fit;if(resized)camera.scale=camera.fit;}
  applyCamera();
  for(const u of UNITS.filter(unitOwned)){
   let anchor=world.querySelector('.army-anchor[data-type="'+u.id+'"]');
   if(!anchor){anchor=document.createElement('div');anchor.className='unit-sprite army-anchor';anchor.dataset.type=u.id;world.appendChild(anchor);}
   const group=slots.filter(p=>p.id===u.id),p=group[Math.floor(group.length/2)];
   if(p){anchor.style.left=p.x+'px';anchor.style.top=(p.y-35)+'px';}
  }
 }
 const bodyHeight=u=>u.id==='giant'?106:u.fly?(u.id.includes('dragon')?86:66):outpost()?64:54;
 function spriteAtlas(img,u,screenHeight,dpr){
  const ph=Math.max(2,Math.round(screenHeight*dpr)),geometry=img.geometry;if(!geometry)return null;const key=img.src+'@'+ph;
  if(spriteCache.has(key))return spriteCache.get(key);
  const scale=ph/geometry.bodyHeight,w=Math.max(1,Math.ceil((geometry.right-geometry.left)*scale)),h=Math.max(1,Math.ceil((geometry.bottom-geometry.top)*scale)),frames=u.anim?.frames||1,c=document.createElement('canvas');c.width=w*frames;c.height=h;const context=c.getContext('2d');context.imageSmoothingEnabled=false;
  for(let f=0;f<frames;f++){const b=geometry.boxes[f];context.drawImage(img,f*img.naturalWidth/frames+b.x,b.y,b.w,b.h,f*w+(b.x-b.footX-geometry.left)*scale,(b.y-b.footY-geometry.top)*scale,b.w*scale,b.h*scale);}
  const atlas={canvas:c,w,h,anchorX:-geometry.left*scale,anchorY:-geometry.top*scale};spriteCache.set(key,atlas);if(spriteCache.size>240)spriteCache.delete(spriteCache.keys().next().value);return atlas;
 }
 function applyCamera(){
  const sw=Math.max(viewport.clientWidth,camera.w*camera.scale),sh=Math.max(viewport.clientHeight,camera.h*camera.scale);
  stage.style.width=sw+'px';stage.style.height=sh+'px';
  world.style.left=Math.max(0,(sw-camera.w*camera.scale)/2)+'px';world.style.top=Math.max(0,(sh-camera.h*camera.scale)/2)+'px';
  world.style.transform='scale('+camera.scale+')';
 }
 function focus(id,evolution=false){
  const group=slots.filter(p=>p.id===id);if(!group.length)return;
  flash={id,until:performance.now()+2100,evolution};
 }
 function fit(){manual=false;camera.target=camera.fit;viewport.scrollTo({left:0,top:0,behavior:'instant'});}
 function render(reason){
  if(!viewport)return;
  const restore=lastState!==S;if(restore){sim=new ArmySim.Battle();sim.encounter(encounterId);lastState=S;projectiles=[];accumulator=0;powerClock=0;engagedDps=0;}
  sim.stationary=true;bindRaid();layout();
  const companies=UNITS.map(u=>{const stats=outpost()?OutpostCore.stats(u.id,S.camp):null;return {...u,count:Math.max(0,(S.owned[u.id]||0)-(S.pending?.[u.id]||0)),interval:stats?.interval??unitIv(u),damage:stats?.damage??unitDmg(u),range:stats?.range,minRange:stats?.minRange||0,speed:u.id==='porter'?145*Math.min(2.5,1+.03*(S.ulvl[u.id]||0)):undefined,heal:outpost()?0:Core.healPower(S,u)};});
  sim.sync(companies);slots=sim.soldiers;sortAt=0;
  if(outpost()&&window.ExpeditionCore){const groups=new Map(ExpeditionCore.groups(S).map(g=>[g.key,g])),policies=new Map(ExpeditionCore.assignments(S).map(a=>[a.id+':'+a.index,groups.get(a.groupKey)?.policy||'front']));for(const p of slots)p.policy=policies.get(p.id+':'+p.index)||'front';}
  if(restore&&S.battle){const saved=new Map(S.battle.units.map(row=>[row[0]+':'+row[1],row])),sx=camera.w/S.battle.width,sy=camera.h/S.battle.height;for(const p of slots){const row=saved.get(p.id+':'+p.index);if(!row)continue;p.x=ArmySim.clamp(row[2]*sx,p.r+5,camera.w-p.r-5);p.y=ArmySim.clamp(row[3]*sy,sim.ground+p.r+5,camera.h-p.r-20);p.order=null;p.commanded=false;}}
  if(restore){for(const p of slots)p.enterAt=sim.time-.34;window.BattleControl?.restore();}
  document.getElementById('armyCount').textContent=count().toLocaleString();
  document.getElementById('armyRoster').innerHTML=UNITS.filter(unitOwned).sort(orderUnits).map(u=>'<button type="button" data-focus="'+u.id+'"><span>'+L(u.name)+'</span><b>×'+S.owned[u.id].toLocaleString()+'</b><small>'+('◆'.repeat(Math.min(3,Core.tier(S.ulvl[u.id])))||'Lv.'+S.ulvl[u.id])+'</small></button>').join('');
  if(reason?.id)focus(reason.id,reason.evolution);
 }
 function draw(now,force=false){
  if(!force)frame=requestAnimationFrame(draw);if(document.hidden||window.Rework?.paused&&!force)return;
  const dt=Math.min(40,now-last);last=now;
  if(Math.abs(camera.scale-camera.target)>.0004){camera.scale+=(camera.target-camera.scale)*(matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,dt/180));applyCamera();}
  const width=viewport.clientWidth,height=viewport.clientHeight,dpr=Math.min(2,devicePixelRatio||1);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  const ox=Math.max(0,(Math.max(width,camera.w*camera.scale)-camera.w*camera.scale)/2)-viewport.scrollLeft;
  const oy=Math.max(0,(Math.max(height,camera.h*camera.scale)-camera.h*camera.scale)/2)-viewport.scrollTop;
  const z=camera.scale;
  // Terrain fills the viewport, rather than exposing the edges of a scaled rectangle.
  // Its texture follows the army camera; the distant scenery stays behind the battlefield.
  const top=Math.max(0,oy+camera.h*.28*z-30),tile=Math.max(20,256*z);
  const key=[top,tile,ox,oy].map(v=>v.toFixed(1)).join(':');
  if(key!==terrainKey){terrainKey=key;ground.style.top=top+'px';ground.style.backgroundSize=tile+'px';ground.style.backgroundPosition=ox+'px '+(oy-top)+'px';}
  const raid=outpost(),view={ox,oy,z};
  if(raid&&window.Outpost?.ready)Outpost.drawGround(ctx,view);
  window.SupplyFactory?.draw(ctx,view);
  if(sim.time>sortAt||drawOrder.length!==slots.length){drawOrder=slots.slice().sort((a,b)=>a.y-b.y);sortAt=sim.time+.18;}
  // Depth order changes as soldiers walk; offscreen bodies do not consume draw calls.
  const actors=raid&&window.Outpost?.ready?[...drawOrder,...Outpost.enemies()].sort((a,b)=>a.y-b.y):drawOrder;
  for(let i=0;i<actors.length;i++){
   const p=actors[i];if(!p.u){Outpost.drawEnemy(ctx,view,p);continue;}if(p.enterAt>sim.time)continue;const u=p.u,img=imageFor(u);if(!img.complete||!img.naturalWidth)continue;
   const tier=raid?0:Math.min(3,Core.tier(S.ulvl[p.id]));
   const crop=img.crop||{x:0,y:0,w:img.naturalWidth/(u.anim?.frames||1),h:img.naturalHeight};
   const h=bodyHeight(u)*(1+tier*.03),w=h*crop.w/crop.h;
   const x=ox+p.x*z,y=oy+(p.y-(u.fly?25:0))*z;
   if(x+w*z<0||x-w*z>width||y<0||y-h*z>height)continue;
   const elapsed=(sim.time-p.attackAt)*1000,duration=u.anim?.frameMs||120;
   const sequence=u.anim?.sequence||[0,1,2,3,0];
   const active=elapsed>=0&&elapsed<sequence.length*duration;
   const f=active?sequence[Math.floor(elapsed/duration)]:0;
   const sw=img.naturalWidth/(u.anim?.frames||1);
   const chosen=window.BattleControl?.selected(p.key);if(chosen){ctx.strokeStyle='#eacb82';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,Math.max(5,p.r*z),Math.max(2,p.r*z*.45),0,0,Math.PI*2);ctx.stroke();}
   if(tier){ctx.fillStyle=['','#64dfff66','#d399ff88','#ffd96a99'][tier];ctx.beginPath();ctx.ellipse(x,y-2*z,w*z*.35,3*z,0,0,Math.PI*2);ctx.fill();}
   if(flash?.id===p.id&&now<flash.until){ctx.fillStyle=flash.evolution?'#ffdc8899':'#91eece77';ctx.fillRect(x-w*z*.4,y-h*z-5*z,w*z*.8,2*z);}
   ctx.globalAlpha=p.stun?.4:Math.min(1,(sim.time-p.enterAt)*3);
   const atlas=spriteAtlas(img,u,h*z,dpr);if(!atlas)continue;const aw=atlas.w/dpr,ah=atlas.h/dpr,ax=atlas.anchorX/dpr,ay=atlas.anchorY/dpr;
   if(u.worker&&p.workFacing<0){ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(atlas.canvas,f*atlas.w,0,atlas.w,atlas.h,-ax,-ay,aw,ah);ctx.restore();}else ctx.drawImage(atlas.canvas,f*atlas.w,0,atlas.w,atlas.h,x-ax,y-ay,aw,ah);ctx.globalAlpha=1;
   if(tier&&h*z>17){ctx.fillStyle=['','#6ae2ff','#d2a2ff','#ffdc6c'][tier];ctx.font=Math.max(7,9*z)+'px sans-serif';ctx.textAlign='center';ctx.fillText('◆'.repeat(tier),x,y-h*z-4*z);}
  }
  projectiles=projectiles.filter(p=>p.until>sim.time&&(!p.target||(p.roundToken===sim.round()&&p.target.alive)));
  for(const p of projectiles){if(sim.time<p.start)continue;if(p.source){p.x=p.source.x;p.y=p.source.y-27;delete p.source;}if(p.target){p.tx=p.target.x;p.ty=p.target.y-18;}const t=1-(p.until-sim.time)/p.duration,x=ox+(p.x+(p.tx-p.x)*t)*z,y=oy+(p.y+(p.ty-p.y)*t)*z;ctx.strokeStyle=p.heal?'#94edb9':p.col;ctx.lineWidth=Math.max(1,(p.ballista?4:2)*z);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(p.tx-p.x)*(p.ballista?.075:.035)*z,y-(p.ty-p.y)*(p.ballista?.075:.035)*z);ctx.stroke();}
  if(raid)window.Outpost?.drawEnemyUI?.(ctx,view);window.BattleControl?.draw(ctx,view);
  if(raid)window.OutpostCamp?.drawOver(ctx,view);
 }
 function tick(dt){
  if(!viewport||window.BattleControl?.defeated)return;
  const raid=outpost();
  fxClock=Math.max(0,fxClock-dt);window.SupplyFactory?.tick(dt);window.BattleControl?.tick(dt);if(window.BattleControl?.defeated)return;sim.boss.alive=raid?false:!bossDead;bindRaid();
  powerClock+=dt;if(powerClock>.25){powerClock=0;engagedDps=slots.reduce((n,p)=>n+(sim.canHit(p)&&p.enterAt<=sim.time&&!p.stun?p.u.damage/p.interval:0),0);}
  accumulator=Math.min(.4,accumulator+dt);const period=slots.length>2000?.1:slots.length>500?.06:1/30;
  for(let updates=0;accumulator+1e-8>=period&&updates<3;updates++){
   const elapsed=Math.min(.1,accumulator);accumulator-=elapsed;if(raid){window.Outpost?.tick(elapsed);bindRaid();}sim.boss.alive=raid?false:!bossDead;const hero=window.BattleControl?.hero||{x:150,y:350,hp:100,max:100},events=sim.step(elapsed,hero),damage=new Map();
   for(const e of events){const p=e.p,u=p.u;
    if(e.kind==='heal'){window.BattleControl?.heal(e.amount);continue;}
    if(e.kind==='damage'){if(raid){const state=raidState();if(!state||e.roundToken!==state.round||e.target!==state.enemies.find(q=>q.key===e.targetKey)||!e.target.alive)continue;const applied=Outpost.hit(e.amount,p.id,e.targetKey);if(applied&&fxClock<=0){fxClock=.12;sndUnitHit(u);}}else damage.set(p.id,(damage.get(p.id)||0)+e.amount);continue;}
    if(e.kind==='release'&&(u.ranged||u.healer)){const target=e.target||(u.healer?hero:sim.boss);const release=u.healer?0:(u.anim?.release||0)/1000,impact=u.healer?.25:(u.anim?.impact||450)/1000;projectiles.push({source:p,x:p.x,y:p.y-27,tx:target.x,ty:target.y-(raid?18:0),start:sim.time+release,duration:Math.max(.05,impact-release),until:sim.time+impact,heal:u.healer,ballista:u.id==='ballista',col:u.proj==='holy'?'#ffdf87':u.id==='ballista'?'#eac78d':'#d7e3cc',...(raid?{target:e.target,targetKey:e.targetKey,roundToken:e.roundToken}:{})});if(projectiles.length>24)projectiles.shift();}
   }
   for(const [id,amount]of damage){if(bossDead)break;const pt=bossHitPt();if(fxClock<=0){fxClock=.12;const u=UNITS.find(u=>u.id===id);sndUnitHit(u);if(u.fx)spawnAtkFx(u.fx,pt.x,pt.y);}dealDamage(amount,pt.x,pt.y,'unit',false,id);}
  }
 }
 function snapshot(){const h=window.BattleControl?.hero;return {width:camera.w,height:camera.h,captain:{x:Math.round(h?.x||150),y:Math.round(h?.y||370)},units:slots.map(p=>[p.id,p.index,Math.round(p.x),Math.round(p.y),p.commanded&&p.order?Math.round(p.order.x):-1,p.commanded&&p.order?Math.round(p.order.y):-1])};}
 function orderUnits(a,b){const order=['woodcutter','miner','farmer','arch','ballista','sword','heavy','healer','porter'];const rank=u=>order.includes(u.id)?order.indexOf(u.id):7+UNITS.indexOf(u);return rank(a)-rank(b);}
 function point(clientX,clientY){const r=world.getBoundingClientRect();return {x:(clientX-r.left)/camera.scale,y:(clientY-r.top)/camera.scale};}
 function zoom(factor){manual=true;camera.target=Math.max(camera.fit*.7,Math.min(2.2,camera.target*factor));}
 function boot(){
  viewport=document.getElementById('battleViewport');world=document.getElementById('battleWorld');stage=document.getElementById('worldStage');ground=document.getElementById('battleGround');canvas=document.getElementById('armyCanvas');ctx=canvas.getContext('2d',{alpha:true});
  // The inline legacy renderer runs before this module on reload; never leave its copies behind.
  world.querySelectorAll('.unit-sprite').forEach(el=>el.remove());
  document.getElementById('zoomIn').onclick=()=>zoom(1.3);document.getElementById('zoomOut').onclick=()=>zoom(1/1.3);document.getElementById('zoomFit').onclick=fit;
  document.getElementById('armyRoster').onclick=e=>{const b=e.target.closest('[data-focus]');if(b){BattleControl.selectType(b.dataset.focus);focus(b.dataset.focus,true);}};
  viewport.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);}},{passive:false});
  new ResizeObserver(()=>layout()).observe(viewport);
  render();window.BattleControl?.boot();window.SupplyFactory?.boot();camera.scale=camera.target;applyCamera();frame=requestAnimationFrame(draw);
 }
 return {boot,render,reloadFormation:()=>{lastState=null;render();},focus,fit,layout,tick,point,snapshot,captureFrame:()=>{draw(performance.now(),true);if(!outpost())return canvas.toDataURL();const dpr=canvas.width/viewport.clientWidth,z=camera.scale,ox=Math.max(0,(Math.max(viewport.clientWidth,camera.w*z)-camera.w*z)/2)-viewport.scrollLeft,oy=Math.max(0,(Math.max(viewport.clientHeight,camera.h*z)-camera.h*z)/2)-viewport.scrollTop;const x=Math.max(0,ox+20*z),y=Math.max(0,oy+70*z),w=Math.min(880*z,viewport.clientWidth-x),h=Math.min(450*z,viewport.clientHeight-y);if(w<=0||h<=0)return canvas.toDataURL();const photo=document.createElement('canvas');photo.width=880;photo.height=Math.round(880*h/w);const context=photo.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(canvas,x*dpr,y*dpr,w*dpr,h*dpr,0,0,photo.width,photo.height);return photo.toDataURL();},orderUnits,bodyHeight,get engagedDps(){return engagedDps;},get sim(){return sim;},get camera(){return camera;},portrait:u=>imageFor(u).portrait,attack:u=>{attacks[u.id]=performance.now();},get ready(){return !!viewport;},get count(){return count();},get stats(){return {soldiers:slots.length,worldWidth:camera.w,worldHeight:camera.h,scale:camera.scale,pairs:sim.stats.pairs,attacks:sim.stats.attacks,projectiles:projectiles.length};}};
})();
