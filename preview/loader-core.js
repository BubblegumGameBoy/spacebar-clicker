/* One physical item at a time from the ground onto a nearby player-built belt. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./conveyor-core.js'):root.ConveyorCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.LoaderCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Belt){
 'use strict';
 const PARAMS=Object.freeze({pickupRadius:70,beltReach:80,cycle:.9,bodyRadius:14});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),same=(a,b)=>String(a)===String(b),point=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y);
 function target(loader,links,params=PARAMS){
  let best=null;for(const link of links||[]){if(!Array.isArray(link.points)||link.points.length<2)continue;const q=Belt.nearest(Belt.oriented(link),loader);if(!q||!point(q)||q.distance>params.beltReach)continue;
   if(!best||q.distance<best.distance)best={x:q.x,y:q.y,distance:q.distance,beltId:link.nodeKey,along:q.along};}
  return best;
 }
 function targetValid(t,links){const l=(links||[]).find(l=>same(l.nodeKey,t?.beltId));if(!l||!point(t)||!Array.isArray(l.points)||l.points.length<2)return false;const q=Belt.nearest(Belt.oriented(l),t);return !!q&&q.distance<.75;}
 function release(track){if(track?.item&&same(track.item.loaderKey,track.key)){delete track.item.loaderKey;track.item.vx=0;track.item.vy=0;track.item.physical=true;}if(track){track.item=null;track.source=null;track.target=null;track.elapsed=0;}return track;}
 function fresh(key){return {key,item:null,source:null,target:null,elapsed:0,completed:0};}
 function tick({loaders=[],links=[],items=[],eligible=()=>true,held=()=>false,params=PARAMS},tracks,dt){
  const events=[],keys=new Set(loaders.map(l=>String(l.key)));
  for(const [key,track]of tracks)if(!keys.has(String(key))){release(track);tracks.delete(key);}
  // A save/reload or removed loader leaves the original item on the ground, never stuck in an invisible queue.
  for(const d of items)if(d.loaderKey!=null){const t=tracks.get(String(d.loaderKey));if(!t||t.item!==d){delete d.loaderKey;d.vx=0;d.vy=0;d.physical=true;}}
  for(const loader of loaders){const key=String(loader.key);let track=tracks.get(key);if(!track){track=fresh(loader.key);tracks.set(key,track);}
   if(track.item&&(!items.includes(track.item)||held(track.item)||!same(track.item.loaderKey,loader.key)||!targetValid(track.target,links))){const item=track.item;release(track);events.push({kind:'release',key:loader.key,item});continue;}
   if(!track.item){const to=target(loader,links,params);if(!to)continue;let item=null,nearest=Infinity;
    for(const d of items){if(!point(d)||d.loaderKey!=null||!eligible(d)||held(d)||Belt.contact(links,d))continue;const dist=distance(loader,d);if(dist<=params.pickupRadius&&(dist<nearest||dist===nearest&&Number(d.key)<Number(item?.key))){item=d;nearest=dist;}}
    if(!item)continue;track.item=item;track.source={x:item.x,y:item.y};track.target=to;track.elapsed=0;item.loaderKey=loader.key;item.vx=0;item.vy=0;item.physical=true;events.push({kind:'pickup',key:loader.key,item});
   }
   const item=track.item;track.elapsed=Math.min(params.cycle,track.elapsed+Math.max(0,Math.min(1,Number(dt)||0)));if(params.cycle-track.elapsed<1e-8)track.elapsed=params.cycle;const t=track.elapsed/params.cycle,ease=t*t*(3-2*t);
   item.x=track.source.x+(track.target.x-track.source.x)*ease;item.y=track.source.y+(track.target.y-track.source.y)*ease;
   if(t>=1){const to={...track.target};delete item.loaderKey;item.x=to.x;item.y=to.y;item.onConveyor=true;item.beltId=to.beltId;item.vx=0;item.vy=0;track.item=null;track.source=null;track.target=null;track.elapsed=0;track.completed++;events.push({kind:'loaded',key:loader.key,item,target:to});}
  }
  return events;
 }
 return {PARAMS,target,targetValid,fresh,release,tick};
});
