/* Persistent resources and rail routing. Inventory changes only at delivery. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./harvest-skill-core.js'):root.HarvestSkillCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.SupplyCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Skills){
 'use strict';const TILE=32,types=new Set(['wood','stone','food','gold']);
 const finite=(n,f=0,max=1e9)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):f;
 const sourceKey=value=>Number.isInteger(value)&&value>=1&&value<=1e12?value:undefined;
 const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0;
 const key=p=>Math.round(p.x/TILE)+','+Math.round(p.y/TILE),snap=p=>({x:Math.round(p.x/TILE)*TILE,y:Math.round(p.y/TILE)*TILE});
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function fresh(width=1100,height=500,seed=Math.floor(Math.random()*1e8)){
  const s={version:1,seed,width,height,next:1,time:0,inventory:{wood:0,stone:0},depot:snap({x:width*.12,y:height*.79}),nodes:[],drops:[],rails:[],delivered:0};
  for(let i=0;i<300&&s.nodes.length<6;i++){const type=i%3?'wood':'stone',x=width*(.22+noise(seed+i)*.47),y=height*(.40+noise(seed+i+80)*.46);if(Math.hypot((x-s.depot.x)*640/width,y-s.depot.y)<90||s.nodes.some(n=>Math.hypot((x-n.x)*640/width,y-n.y)<108))continue;s.nodes.push({key:s.next++,type,x,y,stock:180+Math.floor(noise(seed+i+7)*180),radius:type==='wood'?16:19,regrow:0});}
  return s;
 }
 function migrate(raw){
  if(!raw||raw.version!==1)return null;
  const s={version:1,seed:finite(raw.seed),width:Math.max(640,finite(raw.width,1100,1e6)),height:Math.max(500,finite(raw.height,500,1e6)),next:finite(raw.next,1),time:finite(raw.time),inventory:{wood:finite(raw.inventory?.wood),stone:finite(raw.inventory?.stone)},depot:point(raw.depot)?{x:raw.depot.x,y:raw.depot.y}:{x:128,y:384},nodes:[],drops:[],rails:[],delivered:finite(raw.delivered)};
  s.nodes=(Array.isArray(raw.nodes)?raw.nodes:[]).filter(n=>point(n)&&['wood','stone','food'].includes(n.type)).slice(0,500).map(n=>({key:finite(n.key),type:n.type,x:n.x,y:n.y,stock:n.type==='food'?Math.min(40,Math.floor(finite(n.stock,1,40))):finite(n.stock,100,10000),radius:n.type==='wood'?16:n.type==='food'?25:19,regrow:finite(n.regrow),work:Math.min(workRequired(n.type)-1,Math.floor(finite(n.work)))}));
  if(Object.hasOwn(raw.inventory||{},'food')||s.nodes.some(n=>n.type==='food'))s.inventory.food=finite(raw.inventory?.food);
  s.drops=(Array.isArray(raw.drops)?raw.drops:[]).filter(d=>point(d)&&types.has(d.type)&&Number.isFinite(d.count)&&d.count>0).slice(0,10000).map(d=>({key:finite(d.key),x:d.x,y:d.y,type:d.type,count:finite(d.count,1,1e150),worker:d.worker===true,...(d.onConveyor===true?{onConveyor:true}:{}),...(d.physical===true?{physical:true}:{}),...(Number.isInteger(d.beltId)&&d.beltId>0?{beltId:d.beltId}:{}),...(sourceKey(d.source)!==undefined?{source:d.source}:{})}));
  s.rails=(Array.isArray(raw.rails)?raw.rails:[]).filter(e=>point(e.a)&&point(e.b)&&Math.abs(e.a.x-e.b.x)+Math.abs(e.a.y-e.b.y)===TILE).slice(0,8192).map(e=>({a:snap(e.a),b:snap(e.b)}));
  if(raw.compactDrops===true)s.compactDrops=true;
  if(raw.individualDrops===true){s.legacyLoose=(Array.isArray(raw.legacyLoose)?raw.legacyLoose:[]).filter(d=>point(d)&&types.has(d.type)&&Number.isFinite(d.count)&&d.count>0).map(d=>({...d,count:Math.floor(d.count)}));individualize(s);}
  return s;
 }
 // Work toward one physical resource, shared with the tree's displayed strike counts.
 const workRequired=type=>Skills?.workRequired(type)??(type==='stone'?5:type==='food'?1:3);
 function strikePlan(node,power,room){
  const required=workRequired(node?.type),before=Math.min(required-1,Math.floor(finite(node?.work))),stock=Math.floor(finite(node?.stock)),free=Math.max(0,Math.floor(finite(room))),damage=Math.max(1,Math.min(100,Math.floor(finite(power,1,100))));
  if(!stock||!free)return {applied:false,produced:0,work:before,required,blocked:!stock?'depleted':'full'};
  const total=before+damage,produced=Math.min(stock,free,Math.floor(total/required));
  // Excess complete pieces are discarded when the stock/ground limit is reached, never banked as a hidden payout.
  const work=produced>=stock?0:total%required;
  return {applied:true,produced,work,required,blocked:null};
 }
 const FARM_REGROW_SECONDS=12;
 function ensureFarm(s,point={x:650,y:350}){
  const existing=s.nodes.find(n=>n.type==='food');if(existing){s.inventory.food=finite(s.inventory.food);return existing;}
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
  s.next=Math.max(1,s.next||1,...s.nodes.map(n=>(n.key||0)+1),...s.drops.map(d=>(d.key||0)+1));
  const farm={key:s.next++,type:'food',x:Math.max(60,Math.min(s.width-60,point.x)),y:Math.max(140,Math.min(s.height-40,point.y)),stock:1,radius:25,regrow:0};s.nodes.push(farm);s.inventory.food=finite(s.inventory.food);return farm;
 }
 function tickFarms(s,ripeYield=1){const count=Math.max(1,Math.min(40,Math.floor(finite(ripeYield,1,40))));let changed=false;for(const n of s.nodes){if(n.type==='food'&&n.stock<=0&&s.time>=n.regrow){n.stock=count;n.regrow=0;changed=true;}}return changed;}
 function farmStage(s,node){if(node?.type!=='food')return null;if(node.stock>0)return 'ripe';return node.regrow-s.time>FARM_REGROW_SECONDS/2?'soil':'growing';}
 const MAX_LOOSE=2000;
 function individualize(s){
  if(!s)return s;s.individualDrops=true;s.next=Math.max(1,s.next||1,...s.drops.map(d=>(d.key||0)+1));
  const pieces=[],reserve=Array.isArray(s.legacyLoose)?s.legacyLoose:[];
  for(const d of s.drops){const whole=Math.floor(d.count);if(!whole)continue;const make=Math.min(whole,Math.max(0,MAX_LOOSE-pieces.length));
   for(let i=0;i<make;i++)pieces.push({...d,key:i===0?d.key:s.next++,count:1});
   if(whole>make)reserve.push({...d,count:whole-make});
  }
  s.drops=pieces;s.legacyLoose=reserve;return s;
 }
 const looseLimit=capacity=>Math.max(1,Math.min(MAX_LOOSE,Number.isFinite(capacity)?Math.floor(capacity):MAX_LOOSE));
 function compactManualDrops(s,camp={},conveyor=null){
  if(!s||s.compactDrops)return false;
  for(const d of s.drops){
   // Existing automation is player-authored. Never teleport its output or items
   // waiting on a belt/platform when introducing compact manual worksite piles.
   if(d.worker||d.beltId||d.onConveyor||conveyor?.contact(camp.links||[],d)||conveyor?.platformAt(camp.platforms||[],d))continue;
   const n=s.nodes.find(n=>n.key===d.source);if(!n)continue;
   d.x=n.x+72;d.y=n.y+28;d.physical=true;
  }
  s.compactDrops=true;return true;
 }
 function unpackLegacy(s,limit=16,capacity=MAX_LOOSE){
  if(!s.individualDrops||!s.legacyLoose?.length)return 0;let made=0;
  while(s.legacyLoose.length&&s.drops.length<looseLimit(capacity)&&made<limit){const d=s.legacyLoose[0];s.drops.push({...d,key:s.next++,count:1});d.count--;made++;if(d.count<=0)s.legacyLoose.shift();}return made;
 }
 function drop(s,type,count,x,y,source=null,capacity=MAX_LOOSE){if(!types.has(type)||!Number.isFinite(count)||count<=0)return null;if(s.individualDrops){count=Math.floor(count);if(!count||s.drops.length+count>looseLimit(capacity))return null;const origin=sourceKey(source&&typeof source==='object'?source.source:source);let first=null;for(let i=0;i<count;i++){const d={key:s.next++,type,count:1,x,y,...(origin!==undefined?{source:origin}:{})};s.drops.push(d);if(!first)first=d;}return first;}const origin=sourceKey(source&&typeof source==='object'?source.source:source),sameSource=d=>sourceKey(d.source)===origin;const nearby=s.drops.find(d=>!d.carrier&&d.type===type&&sameSource(d)&&Math.hypot(d.x-x,d.y-y)<12);if(nearby){nearby.count=Math.min(1e150,nearby.count+count);return nearby;}if(s.drops.length>=10000){const packet=s.drops.find(d=>!d.carrier&&d.type===type&&sameSource(d));if(packet){packet.count=Math.min(1e150,packet.count+count);return packet;}return null;}const d={key:s.next++,type,count,x,y,...(origin!==undefined?{source:origin}:{})};s.drops.push(d);return d;}
 function deliver(s,item){const index=s.drops.indexOf(item);if(index<0)return null;s.drops.splice(index,1);s.delivered+=item.count;if(item.type!=='gold')s.inventory[item.type]=Math.min(1e9,(s.inventory[item.type]||0)+item.count);return {type:item.type,count:item.count};}
 function route(s){const graph=new Map();const add=(a,b)=>{const k=key(a);if(!graph.has(k))graph.set(k,{point:a,links:[]});graph.get(k).links.push(key(b));};for(const edge of s.rails){add(edge.a,edge.b);add(edge.b,edge.a);}const depotKey=key(s.depot),routes=new Map([[depotKey,{point:s.depot,next:null,distance:0}]]),queue=[depotKey];for(let i=0;i<queue.length;i++){const k=queue[i];for(const other of graph.get(k)?.links||[]){if(routes.has(other))continue;routes.set(other,{point:graph.get(other).point,next:k,distance:routes.get(k).distance+1});queue.push(other);}}return routes;}
 function quote(s,from,to){const a=snap(from),b=snap(to),points=[a];let p={...a};while(p.x!==b.x&&points.length<512){p={x:p.x+Math.sign(b.x-p.x)*TILE,y:p.y};points.push(p);}while(p.y!==b.y&&points.length<512){p={x:p.x,y:p.y+Math.sign(b.y-p.y)*TILE};points.push(p);}const exists=new Set(s.rails.map(e=>[key(e.a),key(e.b)].sort().join('|'))),edges=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],k=[key(a),key(b)].sort().join('|');if(!exists.has(k)){exists.add(k);edges.push({a,b});}}const cost=edges.length*8;return {cost,edges,end:points.at(-1),fits:s.rails.length+edges.length<=8192};}
 function build(s,from,to,budget=0){const q=quote(s,from,to);if(!q.fits||!Number.isFinite(budget)||budget<q.cost)return {ok:false,cost:q.cost};s.rails.push(...q.edges);return {ok:true,cost:q.cost,edges:q.edges.length,end:q.end};}
 return {workRequired,strikePlan,FARM_REGROW_SECONDS,ensureFarm,tickFarms,farmStage,TILE,key,snap,fresh,migrate,drop,deliver,route,quote,build,individualize,unpackLegacy,compactManualDrops,looseLimit,MAX_LOOSE};
});
