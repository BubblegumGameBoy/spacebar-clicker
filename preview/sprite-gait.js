/* Code-native locomotion over the existing idle art. The combat frames remain attacks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpriteGait=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const positions=new WeakMap(),TAU=Math.PI*2;
 function sample(actor,time){const previous=positions.get(actor),x=Number(actor.x)||0,y=Number(actor.y)||0,d=previous?Math.hypot(x-previous.x,y-previous.y):0,changed=!previous||time!==previous.time;const distance=(previous?.distance||0)+(changed&&d<80?d:0),moving=changed&&d>.025||!previous&&!!actor.moving;const result={x,y,time,distance,moving:changed?moving:!!previous?.moving};positions.set(actor,result);return result;}
 function pose({time=0,distance=0,key=0,moving=false,attacking=false,hurtAge=10,dead=false,role='foot',reduced=false}={}){const mode=dead?'down':hurtAge>=0&&hurtAge<.22?'hurt':attacking?'attack':moving?'walk':'idle',phase=distance/(role==='cart'?38:role==='creep'?24:30)*TAU+key*1.37,p={mode,role,phase,bodyY:0,tilt:0,left:0,right:0,leftLift:0,rightLift:0,wheel:0,alpha:dead?.3:1};if(reduced)return p;if(mode==='hurt'){p.bodyY=-1;p.tilt=Math.sin(hurtAge*55)*.09;return p;}if(mode!=='walk')return p;
  if(role==='cart'){p.bodyY=-Math.abs(Math.sin(phase*2))*.65;p.tilt=Math.sin(phase)*.012;p.wheel=distance/6;return p;}if(role==='fly'){p.bodyY=Math.sin(time*8+key)*2.3;p.tilt=Math.sin(time*5+key)*.035;return p;}if(role==='creep'){p.bodyY=-Math.abs(Math.sin(phase))*.8;p.tilt=Math.sin(phase)*.04;p.left=Math.sin(phase)*.11;p.right=-p.left;return p;}
  p.bodyY=-Math.abs(Math.sin(phase))*1.8;p.tilt=Math.sin(phase)*.026;p.left=Math.sin(phase)*.29;p.right=-p.left;p.leftLift=Math.max(0,Math.cos(phase))*2.2;p.rightLift=Math.max(0,-Math.cos(phase))*2.2;return p;
 }
 function draw(ctx,image,source,dest,p,{footX=dest.w/2,footY=dest.h,height=dest.h,flip=false}={}){const {x,y,w,h}=dest,ratioX=source.w/w,ratioY=source.h/h;ctx.save();ctx.translate(x+footX,y+footY);if(flip)ctx.scale(-1,1);ctx.translate(0,p.bodyY);ctx.rotate(p.tilt);
  if(p.mode==='walk'&&p.role==='cart'){ctx.fillStyle='#4a392b';ctx.strokeStyle='#bba574';ctx.lineWidth=1;for(const dx of [-height*.28,height*.28]){ctx.save();ctx.translate(dx,-2);ctx.rotate(p.wheel);ctx.beginPath();ctx.arc(0,0,height*.105,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-height*.1,0);ctx.lineTo(height*.1,0);ctx.moveTo(0,-height*.1);ctx.lineTo(0,height*.1);ctx.stroke();ctx.restore();}}
  const legs=p.mode==='walk'&&p.role==='foot',cut=Math.max(0,Math.min(h,footY-height*.29));
  if(!legs){ctx.drawImage(image,source.x,source.y,source.w,source.h,-footX,-footY,w,h);}else{
   ctx.drawImage(image,source.x,source.y,source.w,cut*ratioY,-footX,-footY,w,cut);
   // Restrict both hinged strips to the feet so low weapons do not swing with a boot.
   const legHalf=height*.20,center=footX,from=Math.max(0,center-legHalf),to=Math.min(w,center+legHalf),bottom=h-cut;
   if(from>0)ctx.drawImage(image,source.x,source.y+cut*ratioY,from*ratioX,bottom*ratioY,-footX,cut-footY,from,bottom);
   if(to<w)ctx.drawImage(image,source.x+to*ratioX,source.y+cut*ratioY,(w-to)*ratioX,bottom*ratioY,to-footX,cut-footY,w-to,bottom);
   for(const [left,right,angle,lift]of [[from,center,p.left,p.leftLift],[center,to,p.right,p.rightLift]]){if(right<=left)continue;const pivot=(left+right)/2-footX;ctx.save();ctx.translate(pivot,cut-footY-lift);ctx.rotate(angle);ctx.drawImage(image,source.x+left*ratioX,source.y+cut*ratioY,(right-left)*ratioX,bottom*ratioY,left-footX-pivot,0,right-left,bottom);ctx.restore();}
  }
  ctx.restore();
 }
 return {sample,pose,draw};
});
