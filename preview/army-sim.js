/* Individual movement, range checks and local body collisions. No DOM or timers. */
(function(root,factory){const common=typeof module==='object'&&module.exports,api=factory(common?require('./outpost-core.js'):null);if(common)module.exports=api;else root.ArmySim=api;})(typeof globalThis!=='undefined'?globalThis:this,function(outpostCore){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 class Battle{
  constructor(){this.soldiers=[];this.time=0;this.nextKey=1;this.width=1100;this.height=500;this.ground=170;this.boss={x:930,y:370,r:100,alive:true,token:0};this.pending=[];this.stats={pairs:0,attacks:0};}
  bounds(width,height,boss){const oldW=this.width,oldH=this.height;this.width=width;this.height=height;this.ground=this.fixedWorld?90:height*.34;if(!this.fixedWorld)for(const p of this.soldiers){p.x=p.x/oldW*width;p.y=clamp(p.y/oldH*height,this.ground+25,height-35);if(p.order){p.order.x=p.order.x/oldW*width;p.order.y=p.order.y/oldH*height;}}this.boss={...this.boss,...boss};}
  encounter(token){this.boss.token=token;this.pending=[];this.navigation=null;for(const p of this.soldiers){if(p.u.worker)continue;p.cooldown=noise(p.key+token)*Math.max(.2,p.interval);p.windup=0;} }
  sync(companies,recruitId){
   const counts=new Map(companies.map(u=>[u.id,u.count]));
   this.soldiers=this.soldiers.filter(p=>p.index<(counts.get(p.id)||0));
   for(const u of companies){const existing=this.soldiers.filter(p=>p.id===u.id);for(const p of existing){p.u=u;p.interval=u.interval;p.speed=u.speed||p.speed;}
    for(let i=existing.length;i<u.count;i++){
     const key=this.nextKey++,a=noise(key),b=noise(key+44),radius=u.id==='giant'?22:u.fly?14:10;
     const x=50+a*(this.width*.56),y=this.ground+35+b*(this.height-this.ground-85);
     const entering=recruitId===u.id;
     this.soldiers.push({key,index:i,id:u.id,u,x:entering?24+noise(key+12)*70:x,y,r:radius,speed:u.speed||(u.id==='giant'?83:120+noise(key+7)*45),interval:u.interval,cooldown:a*u.interval,windup:0,attackAt:-10,enterAt:this.time+(entering?(i-existing.length)*(.07+noise(key)*.09):0),order:null,stun:0,moving:false});
    }
   }
  }
  range(p){if(Array.isArray(this.enemies)){const core=outpostCore||globalThis.OutpostCore;return core?.stats(p.id)?.range||0;}return p.u.healer?240:p.u.ranged?(p.id==='giant'?650:360):28;}
  target(p){if(p.u.worker||p.u.healer||!Array.isArray(this.enemies))return null;const core=outpostCore||globalThis.OutpostCore,state=this.outpostState||{phase:'active',enemies:this.enemies};return core?.target(state,p,this.range(p)+p.r,{includeEnemyRadius:true})||null;}
  round(){return this.outpostState?.round??this.roundToken??this.boss.token;}
  distance(p){return Math.max(0,Math.hypot(p.x-this.boss.x,p.y-this.boss.y)-this.boss.r);}
  canHit(p){if(Array.isArray(this.enemies))return !!this.target(p);return this.boss.alive&&!p.u.healer&&!p.u.worker&&this.distance(p)<=this.range(p)+p.r;}
  command(keys,x,y){const chosen=this.soldiers.filter(p=>keys.has(p.key)),r=Math.max(22,Math.sqrt(chosen.length)*14);for(const p of chosen){p.commanded=true;const angle=noise(p.key+7)*Math.PI*2,d=Math.sqrt(noise(p.key+9))*r;p.order={x:clamp(x+Math.cos(angle)*d,p.r+5,this.width-p.r-5),y:clamp(y+Math.sin(angle)*d,this.ground+p.r+5,this.height-p.r-20)};}}
  free(p,x,y){
   if(this.boss.alive&&Math.hypot(x-this.boss.x,y-this.boss.y)<this.boss.r+p.r)return false;
   if(this.obstacles)for(const n of this.nearObjects(x,y)){const radius=n.radius+p.r;if((x-n.x)**2+(y-n.y)**2<radius*radius)return false;}
   if(!this.grid)return true;const cx=Math.floor(x/48),cy=Math.floor(y/48);
   for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++)for(const i of this.grid.get(xx+65536*yy)||[]){const q=this.soldiers[i];if(q===p)continue;const d=p.r+q.r;if((x-q.x)**2+(y-q.y)**2<d*d*.98)return false;}
   return true;
  }
  setObstacles(nodes){this.obstacles=new Map();this.navigation=null;for(const p of this.soldiers)p.nav=null;for(const n of nodes){const k=Math.floor(n.x/64)+65536*Math.floor(n.y/64);if(!this.obstacles.has(k))this.obstacles.set(k,[]);this.obstacles.get(k).push(n);}}
  *nearObjects(x,y){const cx=Math.floor(x/64),cy=Math.floor(y/64);for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++)yield*(this.obstacles.get(xx+65536*yy)||[]);}
  path(from,to){
   const tile=24,cols=Math.ceil(this.width/tile),rows=Math.ceil(this.height/tile);
   if(!this.navigation){const blocked=new Uint8Array(cols*rows);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=x*tile+tile/2,py=y*tile+tile/2;let solid=py<this.ground+15||py>this.height-28||px<15||px>this.width-15||Math.hypot(px-this.boss.x,py-this.boss.y)<this.boss.r+22;if(!solid&&this.obstacles)for(const n of this.nearObjects(px,py)){if(Math.hypot(px-n.x,py-n.y)<n.radius+22){solid=true;break;}}blocked[x+y*cols]=solid?1:0;}this.navigation={blocked,cols,rows};}
   const {blocked}=this.navigation,cell=p=>clamp(Math.floor(p.x/tile),0,cols-1)+clamp(Math.floor(p.y/tile),0,rows-1)*cols;
   const nearest=p=>{const initial=cell(p);if(!blocked[initial])return initial;const cx=initial%cols,cy=Math.floor(initial/cols);for(let r=1;r<9;r++)for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(x>=0&&y>=0&&x<cols&&y<rows&&!blocked[x+y*cols])return x+y*cols;return initial;};
   const start=nearest(from),goal=nearest(to),open=[start],cost=new Map([[start,0]]),parent=new Map(),score=k=>Math.abs(k%cols-goal%cols)+Math.abs(Math.floor(k/cols)-Math.floor(goal/cols));
   let visits=0;while(open.length&&visits++<cols*rows){let at=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+score(open[i])<cost.get(open[at])+score(open[at]))at=i;const current=open.splice(at,1)[0];if(current===goal){const points=[];let k=goal;while(k!==start){points.push({x:(k%cols)*tile+tile/2,y:Math.floor(k/cols)*tile+tile/2});k=parent.get(k);}points.reverse();return points;}
    const x=current%cols,y=Math.floor(current/cols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+ny*cols;if(nx<0||ny<0||nx>=cols||ny>=rows||blocked[k])continue;const next=cost.get(current)+1;if(cost.has(k)&&cost.get(k)<=next)continue;cost.set(k,next);parent.set(k,current);open.push(k);}
   }return [];
  }
  releaseOrders(){for(const p of this.soldiers){p.order=null;p.commanded=false;}}
  step(dt,hero){
   if(!Number.isFinite(dt)||dt<0)return [];
   dt=Math.min(.1,dt);this.time+=dt;const events=[],boss=this.boss,multi=Array.isArray(this.enemies);
   const remaining=[];for(const hit of this.pending){if(hit.token!==boss.token||(hit.targetKey!==undefined&&(!multi||hit.roundToken!==this.round())))continue;if(hit.due>this.time){remaining.push(hit);continue;}const p=hit.p;if(hit.targetKey!==undefined){const target=this.enemies.find(e=>e.key===hit.targetKey);if(!p.stun&&target===hit.target&&target.alive)events.push({...hit,kind:'damage'});}else if(!p.stun&&(hit.heal?Math.hypot(p.x-hero.x,p.y-hero.y)<=this.range(p)+20:this.canHit(p)))events.push({...hit,kind:hit.heal?'heal':'damage'});}this.pending=remaining;
   for(const p of this.soldiers){
    if(p.enterAt>this.time){p.moving=false;continue;}
    p.stun=Math.max(0,p.stun-dt);p.cooldown-=dt;if(p.stun){p.moving=false;continue;}
    const u=p.u;let goal=multi?null:p.order;
    if(!goal&&!multi){
     if(u.worker)goal=p.order;
     else if(u.healer)goal={x:hero.x+60+noise(p.key)*100,y:hero.y-70+noise(p.key+8)*140};
     else if(boss.alive&&!this.canHit(p)){const angle=Math.PI*(.67+noise(p.key+3)*.66),reach=boss.r+(u.ranged?this.range(p)*.78:18);goal={x:boss.x+Math.cos(angle)*reach,y:boss.y+Math.sin(angle)*reach};}
    }
    if(u.worker&&goal){const key=Math.floor(goal.x/24)+','+Math.floor(goal.y/24);if(p.nav?.key!==key)p.nav={key,points:this.path(p,goal)};while(p.nav.points.length&&Math.hypot(p.x-p.nav.points[0].x,p.y-p.nav.points[0].y)<12)p.nav.points.shift();if(p.nav.points.length)goal=p.nav.points[0];}
    p.moving=false;
    if(goal&&!this.stationary&&!multi){const gx=clamp(goal.x,p.r+5,this.width-p.r-5),gy=clamp(goal.y,this.ground+p.r+5,this.height-p.r-20),dx=gx-p.x,dy=gy-p.y,d=Math.hypot(dx,dy);if(d>4){const distance=Math.min(d,p.speed*dt),ux=dx/d,uy=dy/d,side=noise(p.key)>.5?1:-1;for(const angle of [0,.75*side,1.3*side,1.58*side,-1.3*side,-1.58*side]){const x=p.x+(ux*Math.cos(angle)-uy*Math.sin(angle))*distance,y=p.y+(uy*Math.cos(angle)+ux*Math.sin(angle))*distance;if(this.free(p,x,y)){p.x=x;p.y=y;p.moving=true;break;}}}}
    // Each soldier owns a separate cooldown, anticipation and actual range test.
    const target=multi?this.target(p):null,ready=u.worker?false:multi?!!target:u.healer?hero.hp<hero.max&&Math.hypot(p.x-hero.x,p.y-hero.y)<=this.range(p):this.canHit(p);
    if(p.cooldown<=0&&ready){p.cooldown=p.interval;p.attackAt=this.time;this.stats.attacks++;
     {const aim=multi?{target,targetKey:target.key,roundToken:this.round()}:{};events.push({kind:'release',p,heal:!!u.healer,...aim});this.pending.push({p,heal:!!u.healer,amount:u.healer?u.heal:u.damage,token:boss.token,due:this.time+(u.healer?.25:(u.anim?.impact??(u.ranged?450:200))/1000),...aim});}
    }
   }
   this.hero=hero;if(!this.stationary&&!multi)this.separate();
   return events;
  }
  separate(){
   const size=48,grid=new Map();this.stats.pairs=0;
   for(let i=0;i<this.soldiers.length;i++){const p=this.soldiers[i];if(p.enterAt>this.time)continue;const key=Math.floor(p.x/size)+65536*Math.floor(p.y/size);let bucket=grid.get(key);if(!bucket)grid.set(key,bucket=[]);bucket.push(i);}
   this.grid=grid;
   for(let i=0;i<this.soldiers.length;i++){
    const p=this.soldiers[i];if(p.enterAt>this.time)continue;const cx=Math.floor(p.x/size),cy=Math.floor(p.y/size);
    for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++)for(const j of grid.get(xx+65536*yy)||[]){if(j<=i)continue;this.stats.pairs++;const q=this.soldiers[j],min=p.r+q.r,dx=q.x-p.x,dy=q.y-p.y,d2=dx*dx+dy*dy;if(d2>=min*min)continue;const d=Math.sqrt(d2)||.001,angle=(p.key+q.key)*2.399,ux=d2?dx/d:Math.cos(angle),uy=d2?dy/d:Math.sin(angle),push=(min-d)*.51;p.x-=ux*push;p.y-=uy*push;q.x+=ux*push;q.y+=uy*push;}
    const dx=p.x-this.boss.x,dy=p.y-this.boss.y,d=Math.hypot(dx,dy),min=this.boss.r+p.r;if(d<min&&d){p.x=this.boss.x+dx/d*min;p.y=this.boss.y+dy/d*min;}
    if(this.obstacles)for(const n of this.nearObjects(p.x,p.y)){const dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),min=p.r+n.radius;if(d<min){const a=p.key*2.399;p.x=n.x+(d?dx/d:Math.cos(a))*min;p.y=n.y+(d?dy/d:Math.sin(a))*min;}}
    if(this.hero){const hx=p.x-this.hero.x,hy=p.y-this.hero.y,hd=Math.hypot(hx,hy),hr=p.r+this.hero.r;if(hd<hr&&hd){p.x=this.hero.x+hx/hd*hr;p.y=this.hero.y+hy/hd*hr;}}
   p.x=clamp(p.x,p.r+5,this.width-p.r-5);p.y=clamp(p.y,this.ground+p.r+5,this.height-p.r-20);
   }
  }
  block(from,to){let best=null,bestT=Infinity;const dx=to.x-from.x,dy=to.y-from.y,len=dx*dx+dy*dy;for(const p of this.soldiers){if(p.u.worker||p.u.healer||p.u.ranged||p.enterAt>this.time||p.stun)continue;const t=((p.x-from.x)*dx+(p.y-from.y)*dy)/len;if(t<=0||t>=1||t>=bestT)continue;if(Math.hypot(p.x-(from.x+t*dx),p.y-(from.y+t*dy))<p.r+24){best=p;bestT=t;}}if(best){best.stun=1.2;best.x=Math.max(best.r+5,best.x-35);}return best;}
 }
 return {Battle,noise,clamp};
});
