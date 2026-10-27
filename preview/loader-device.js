/* A small loading crane: visible grip, one real resource, then actual belt contact. */
window.LoaderDevice=(()=>{
 'use strict';let factory=null,tracks=new Map();const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(typeof LANG==='string'?LANG:'ja'))],same=(a,b)=>String(a)===String(b);
 const state=()=>typeof S==='object'&&S.factory?S:null;
 function reset(){const s=state();if(factory!==s?.factory){for(const track of tracks.values())LoaderCore.release(track);tracks=new Map();factory=s?.factory;for(const d of factory?.drops||[])delete d.loaderKey;}return s;}
 function target(point){const s=reset();return s?LoaderCore.target(point,s.camp?.links||[]):null;}
 function isHeld(drop){return drop?.loaderKey!=null&&tracks.get(String(drop.loaderKey))?.item===drop;}
 function release(key){const track=tracks.get(String(key));if(track)LoaderCore.release(track);tracks.delete(String(key));}
 function tick(dt){const s=reset();if(!s?.camp||!window.LoaderCore)return false;const events=LoaderCore.tick({loaders:s.camp.loaders||[],links:s.camp.links||[],items:s.factory.drops,
  eligible:d=>d.count===1&&(d.airUntil<=s.factory.time||d.airUntil==null),
  held:d=>!!window.OutpostCamp?.isHeld?.(d)||d.hopperKey!=null||d.onConveyor===true||!!d.beltId||!!window.ConveyorCore?.platformAt(s.camp.platforms||[],d)
 },tracks,dt);
  for(const e of events)if(e.kind==='pickup')window.ForestAudio?.play('pickup',{group:'worker',level:.35});
  return events.length>0||[...tracks.values()].some(t=>t.item);
 }
 function status(loader){const s=reset(),track=tracks.get(String(loader.key)),to=target(loader);return {busy:!!track?.item,progress:track?.item?track.elapsed/LoaderCore.PARAMS.cycle:0,target:to,completed:track?.completed||0,reason:!to?'no-belt':track?.item?'loading':'waiting'};}
 function line(ctx,a,b,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 function crane(ctx,l,view,preview=false){const {ox,oy,z}=view,s=state(),track=!preview&&tracks.get(String(l.key)),to=target(l),t=track?.item?track.elapsed/LoaderCore.PARAMS.cycle:0;
  const grip=track?.item?{x:track.item.x,y:track.item.y-12-Math.sin(Math.PI*t)*23}:{x:l.x+(to?Math.sign(to.x-l.x)||1:1)*26,y:l.y-17};
  ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);if(preview)ctx.globalAlpha=.7;
  ctx.fillStyle='#172f2255';ctx.beginPath();ctx.ellipse(l.x,l.y+3,24,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#584128';ctx.strokeStyle='#d0af69';ctx.lineWidth=1.5;ctx.fillRect(l.x-18,l.y-13,36,17);ctx.strokeRect(l.x-18,l.y-13,36,17);ctx.fillStyle='#b2874b';ctx.fillRect(l.x-16,l.y-11,32,5);ctx.fillStyle='#3a3022';for(const x of [-12,12]){ctx.beginPath();ctx.arc(l.x+x,l.y+3,5,0,Math.PI*2);ctx.fill();}
  line(ctx,{x:l.x,y:l.y-5},{x:l.x,y:l.y-31},'#473524',7);line(ctx,{x:l.x+1,y:l.y-6},{x:l.x+1,y:l.y-30},'#c79850',3);
  const pivot={x:l.x,y:l.y-31},elbow={x:(pivot.x+grip.x)/2,y:Math.min(pivot.y,grip.y)-14};line(ctx,pivot,elbow,'#65482c',8);line(ctx,pivot,elbow,'#d4b16a',3);line(ctx,elbow,grip,'#62462d',6);line(ctx,elbow,grip,'#c99b56',2);
  for(const p of [pivot,elbow]){ctx.fillStyle='#cead6a';ctx.strokeStyle='#453c2b';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.strokeStyle='#e3d8aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(grip.x-6,grip.y-2);ctx.lineTo(grip.x-6,grip.y+5);ctx.lineTo(grip.x-2,grip.y+8);ctx.moveTo(grip.x+6,grip.y-2);ctx.lineTo(grip.x+6,grip.y+5);ctx.lineTo(grip.x+2,grip.y+8);ctx.stroke();ctx.restore();
  if(track?.item)window.SupplyFactory?.drawItem?.(ctx,track.item.type,ox+grip.x*z,oy+(grip.y+13)*z,Math.max(14,20*z));
  if(!to&&!preview){ctx.save();ctx.font='700 '+Math.max(9,10*z)+'px system-ui';ctx.textAlign='center';const text=local(['コンベアなし','No conveyor','无传送带']),x=ox+l.x*z,y=oy+(l.y-54)*z,w=ctx.measureText(text).width+10;ctx.fillStyle='#483c22ef';ctx.fillRect(x-w/2,y-10,w,15);ctx.fillStyle='#ffe1a0';ctx.fillText(text,x,y);ctx.restore();}
 }
 function draw(ctx,view){const s=reset();for(const l of s?.camp?.loaders||[])crane(ctx,l,view);}
 function drawPreview(ctx,view,point){const s=reset();if(!s)return;const {ox,oy,z}=view,to=target(point);ctx.save();ctx.strokeStyle=to?'#c8e4ab':'#e6bc7d';ctx.fillStyle=to?'#b9de9314':'#e3b77318';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(ox+point.x*z,oy+point.y*z,LoaderCore.PARAMS.pickupRadius*z,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
  if(to){const x=ox+to.x*z,y=oy+to.y*z;line(ctx,{x:ox+point.x*z,y:oy+point.y*z},{x,y},'#c3e2a5',2);ctx.fillStyle='#c7efaf55';ctx.strokeStyle='#dcf2bc';ctx.fillRect(x-12*z,y-12*z,24*z,24*z);ctx.strokeRect(x-12*z,y-12*z,24*z,24*z);}
  ctx.font='700 '+Math.max(10,11*z)+'px system-ui';ctx.textAlign='center';const text=to?local(['範囲の資材をこのコンベアへ','Loads nearby items onto this conveyor','将范围内物资装到此传送带']):local(['届くコンベアがありません・待機','No conveyor within reach · waits','范围内无传送带，将待机']);const w=ctx.measureText(text).width+16,x=ox+point.x*z,y=oy+(point.y-91)*z;ctx.fillStyle='#193329ee';ctx.fillRect(x-w/2,y-13,w,20);ctx.fillStyle='#f0e0b6';ctx.fillText(text,x,y+1);ctx.restore();crane(ctx,point,view,true);
 }
 return {tick,target,draw,drawPreview,release,isHeld,status,get tracks(){return tracks;}};
})();
