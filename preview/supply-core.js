/* Persistent resources and rail routing. Inventory changes only at delivery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SupplyCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const TILE=32,types=new Set(['wood','stone','gold']);
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
  s.nodes=(Array.isArray(raw.nodes)?raw.nodes:[]).filter(n=>point(n)&&['wood','stone'].includes(n.type)).slice(0,500).map(n=>({key:finite(n.key),type:n.type,x:n.x,y:n.y,stock:finite(n.stock,100,10000),radius:n.type==='wood'?16:19,regrow:finite(n.regrow)}));
  s.drops=(Array.isArray(raw.drops)?raw.drops:[]).filter(d=>point(d)&&types.has(d.type)&&Number.isFinite(d.count)&&d.count>0).slice(0,10000).map(d=>({key:finite(d.key),x:d.x,y:d.y,type:d.type,count:finite(d.count,1,1e150),worker:d.worker===true,...(sourceKey(d.source)!==undefined?{source:d.source}:{})}));
  s.rails=(Array.isArray(raw.rails)?raw.rails:[]).filter(e=>point(e.a)&&point(e.b)&&Math.abs(e.a.x-e.b.x)+Math.abs(e.a.y-e.b.y)===TILE).slice(0,8192).map(e=>({a:snap(e.a),b:snap(e.b)}));
  return s;
 }
 function drop(s,type,count,x,y,source=null){if(!types.has(type)||!Number.isFinite(count)||count<=0)return null;const origin=sourceKey(source&&typeof source==='object'?source.source:source),sameSource=d=>sourceKey(d.source)===origin;const nearby=s.drops.find(d=>!d.carrier&&d.type===type&&sameSource(d)&&Math.hypot(d.x-x,d.y-y)<12);if(nearby){nearby.count=Math.min(1e150,nearby.count+count);return nearby;}if(s.drops.length>=10000){const packet=s.drops.find(d=>!d.carrier&&d.type===type&&sameSource(d));if(packet){packet.count=Math.min(1e150,packet.count+count);return packet;}return null;}const d={key:s.next++,type,count,x,y,...(origin!==undefined?{source:origin}:{})};s.drops.push(d);return d;}
 function deliver(s,item){const index=s.drops.indexOf(item);if(index<0)return null;s.drops.splice(index,1);s.delivered+=item.count;if(item.type!=='gold')s.inventory[item.type]=Math.min(1e9,s.inventory[item.type]+item.count);return {type:item.type,count:item.count};}
 function route(s){const graph=new Map();const add=(a,b)=>{const k=key(a);if(!graph.has(k))graph.set(k,{point:a,links:[]});graph.get(k).links.push(key(b));};for(const edge of s.rails){add(edge.a,edge.b);add(edge.b,edge.a);}const depotKey=key(s.depot),routes=new Map([[depotKey,{point:s.depot,next:null,distance:0}]]),queue=[depotKey];for(let i=0;i<queue.length;i++){const k=queue[i];for(const other of graph.get(k)?.links||[]){if(routes.has(other))continue;routes.set(other,{point:graph.get(other).point,next:k,distance:routes.get(k).distance+1});queue.push(other);}}return routes;}
 function quote(s,from,to){const a=snap(from),b=snap(to),points=[a];let p={...a};while(p.x!==b.x&&points.length<512){p={x:p.x+Math.sign(b.x-p.x)*TILE,y:p.y};points.push(p);}while(p.y!==b.y&&points.length<512){p={x:p.x,y:p.y+Math.sign(b.y-p.y)*TILE};points.push(p);}const exists=new Set(s.rails.map(e=>[key(e.a),key(e.b)].sort().join('|'))),edges=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],k=[key(a),key(b)].sort().join('|');if(!exists.has(k)){exists.add(k);edges.push({a,b});}}const cost=edges.length*8;return {cost,edges,end:points.at(-1),fits:s.rails.length+edges.length<=8192};}
 function build(s,from,to,budget=0){const q=quote(s,from,to);if(!q.fits||!Number.isFinite(budget)||budget<q.cost)return {ok:false,cost:q.cost};s.rails.push(...q.edges);return {ok:true,cost:q.cost,edges:q.edges.length,end:q.end};}
 return {TILE,key,snap,fresh,migrate,drop,deliver,route,quote,build};
});
