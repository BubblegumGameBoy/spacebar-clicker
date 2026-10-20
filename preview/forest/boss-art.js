/* Four authored poses. Hit flashes do not restart or cancel the boss attack. */
window.BossArt=(()=>{
 const names=['rat','ghoul','ghast','sanddweller','nightwing','nightgaunt','serpentman','migo','shaggai','blob','glaaki','hunter','moonbeast','gug','flame','yith','deepone','carrion','mordiggian','skyfiend','tsathoggua','chaugnar','objectx','eihort','hellplant','formless','hound','tindalos','hunter2','blackgoat','shantak2','beast','eldermind','shantak','stormgod','ygolonac','cthugha','hastur','nyarlathotep','cthulhu'];
 const cache=new Map();let canvas=null,ctx,current=-1,lastFrame=-1,active=null;
 function set(index){
  current=index;lastFrame=-1;active=null;
  if(!canvas){canvas=document.createElement('canvas');canvas.id='bossMotion';canvas.setAttribute('aria-hidden','true');bossEl.appendChild(canvas);ctx=canvas.getContext('2d');}
  canvas.hidden=true;bossImg.style.visibility='visible';
  const key=names[index];if(!key)return;
  const use=entry=>{if(current!==index)return;active=entry;canvas.width=entry.crop.w;canvas.height=entry.crop.h;canvas.hidden=false;bossImg.style.visibility='hidden';bossEl.classList.remove('flip');draw(0);};
  if(cache.has(key)){const entry=cache.get(key);if(entry.crop)use(entry);else entry.image.addEventListener('load',()=>use(entry),{once:true});return;}
  const img=new Image(),entry={image:img};cache.set(key,entry);if(cache.size>4)cache.delete(cache.keys().next().value);
  img.onload=()=>{const fw=img.naturalWidth/2,fh=img.naturalHeight/2,c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const data=x.getImageData(0,0,c.width,c.height).data;let left=fw,right=0,top=fh,bottom=0;for(let y=0;y<c.height;y++)for(let px=0;px<c.width;px++)if(data[(y*c.width+px)*4+3]>72){left=Math.min(left,px%fw);right=Math.max(right,px%fw);top=Math.min(top,y%fh);bottom=Math.max(bottom,y%fh);}entry.crop={x:left,y:top,w:Math.max(1,right-left+1),h:Math.max(1,bottom-top+1),fw,fh};use(entry);};
  img.src='../../assets/boss2/'+key+'.webp';
 }
 function draw(frame){if(!active||frame===lastFrame)return;lastFrame=frame;const c=active.crop;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(active.image,(frame%2)*c.fw+c.x,Math.floor(frame/2)*c.fh+c.y,c.w,c.h,0,0,canvas.width,canvas.height);}
 return {set,draw,url:index=>'../../assets/boss2/'+names[index]+'.webp',get stats(){return {cachedSheets:cache.size};},get frame(){return lastFrame;},get available(){return !!active;}};
})();
