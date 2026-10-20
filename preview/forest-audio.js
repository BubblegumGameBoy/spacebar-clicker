/* Original camp music and short, quiet, purpose-specific synthesized sounds. */
window.ForestAudio=(()=>{
 const defaults={bgmOn:true,seOn:true,bgmVol:.18,seVol:.5};
 let stored={};try{stored=JSON.parse(localStorage.getItem('sbr2_preview_forest_audio_v2')||localStorage.getItem('sbr2_preview_forest_audio_v1')||'{}')||{};}catch(e){}
 const finite=(n,f,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):f;
 const settings={bgmOn:stored.bgmOn!==false,seOn:stored.seOn!==false,bgmVol:finite(stored.bgmVol,defaults.bgmVol,.26),seVol:finite(stored.seVol,defaults.seVol,.6)};
 const music=new Audio('../assets/audio/forest-camp.mp3');music.loop=true;music.preload='metadata';music.volume=0;
 let ctx=null,bus=null,master=null,unlocked=false,fade=0,seed=345671,lastAuto=-Infinity,lastUser=-Infinity;
 const buffers=new Map(),voices=[];
 function save(){try{localStorage.setItem('sbr2_preview_forest_audio_v2',JSON.stringify(settings));}catch(e){}}
 function context(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();bus=ctx.createDynamicsCompressor();bus.threshold.value=-16;bus.knee.value=16;bus.ratio.value=3;bus.attack.value=.005;bus.release.value=.12;master=ctx.createGain();master.gain.value=settings.seOn?settings.seVol:0;bus.connect(master);master.connect(ctx.destination);}return ctx;}
 function noise(){seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;}
 function buffer(kind){if(buffers.has(kind))return buffers.get(kind);const c=context(),duration=kind==='victory'||kind==='evolve'?.85:kind==='hire'?.4:.22,b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){const t=i/c.sampleRate,a=1-Math.exp(-t/.003);low+=.13*(noise()-low);let v=0;
  if(kind==='wood')v=(.72*Math.sin(2*Math.PI*205*t)*Math.exp(-t*30)+.28*Math.sin(2*Math.PI*480*t)*Math.exp(-t*45)+low*.23*Math.exp(-t*35))*a;
  else if(kind==='stone')v=(.5*Math.sin(2*Math.PI*820*t)*Math.exp(-t*32)+.22*Math.sin(2*Math.PI*1375*t)*Math.exp(-t*45)+low*.14*Math.exp(-t*40))*a;
  else if(kind==='pickup')v=(.52*Math.sin(2*Math.PI*523.25*t)+.2*Math.sin(2*Math.PI*784*t))*Math.exp(-t*18)*a;
  else if(kind==='victory'||kind==='evolve'||kind==='hire'){const notes=kind==='hire'?[392,493.88,587.33]:[440,587.33,739.99,880];for(let n=0;n<notes.length;n++){const q=t-n*.085;if(q>=0)v+=.3*Math.sin(2*Math.PI*notes[n]*q)*(1-Math.exp(-q/.005))*Math.exp(-q*10);}}
  else v=(.35*Math.sin(2*Math.PI*(kind==='critical'?330:155)*t)+low*.35)*Math.exp(-t*34)*a;
  data[i]=v*.75;
 }buffers.set(kind,b);return b;}
 function play(kind,{group='user',level=1}={}){if(!settings.seOn||!unlocked||document.hidden)return false;const now=performance.now(),automatic=group==='unit'||group==='worker';if(automatic&&now-lastAuto<160)return false;if(!automatic&&now-lastUser<28)return false;if(automatic)lastAuto=now;else lastUser=now;try{const c=context();if(c.state==='suspended')void c.resume().catch(()=>{});if(voices.length>=8){const old=voices.find(v=>v.automatic)||voices[0];old.g.gain.setTargetAtTime(0,c.currentTime,.008);old.source.stop(c.currentTime+.025);voices.splice(voices.indexOf(old),1);}const source=c.createBufferSource(),g=c.createGain();source.buffer=buffer(kind);source.playbackRate.value=kind==='wood'||kind==='stone'?.98+(noise()+1)*.025:1;g.gain.value=Math.min(.6,(automatic?.23:.38)*level);source.connect(g);g.connect(bus);const voice={source,g,automatic};voices.push(voice);source.onended=()=>{const i=voices.indexOf(voice);if(i>=0)voices.splice(i,1);source.disconnect();g.disconnect();};source.start();return true;}catch(e){return false;}}
 function sync(allow=false){unlocked ||= allow;updateButtons();if(!settings.bgmOn||!unlocked||document.hidden){music.pause();return;}if(!music.paused)return;music.volume=0;const playing=music.play();if(playing?.catch)playing.catch(()=>{});cancelAnimationFrame(fade);const start=performance.now();const tick=now=>{if(!settings.bgmOn||document.hidden)return;music.volume=settings.bgmVol*Math.min(1,(now-start)/1000);if(now-start<1000)fade=requestAnimationFrame(tick);};fade=requestAnimationFrame(tick);}
 function setBgm(on){settings.bgmOn=!!on;save();if(!on){cancelAnimationFrame(fade);music.pause();}sync(on);}
 function setSe(on){settings.seOn=!!on;if(master)master.gain.setTargetAtTime(on?settings.seVol:0,ctx.currentTime,.01);save();updateButtons();if(on)play('pickup',{level:.35});}
 function updateButtons(lang=document.documentElement.lang||'ja'){const b=document.getElementById('bgmBtn'),s=document.getElementById('seBtn');if(b){b.textContent='♫ BGM '+(settings.bgmOn?'ON':'OFF');b.classList.toggle('on',settings.bgmOn);b.dataset.track='forest-camp';b.title=lang==='ja'?'森のキャンプ':lang==='zh'?'森林营地':'Forest camp';}if(s){s.textContent='♪ SE '+(settings.seOn?'ON':'OFF');s.classList.toggle('on',settings.seOn);}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();cancelAnimationFrame(fade);}else sync();});
 return {settings,save,context,play,sync,setBgm,setSe,updateButtons,get stats(){return {voices:voices.length,track:'forest-camp',source:music.currentSrc||music.src,paused:music.paused,volume:music.volume,decoded:buffers.size,sounds:[...buffers.keys()]};}};
})();
