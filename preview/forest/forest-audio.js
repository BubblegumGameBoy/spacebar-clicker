/* Original camp music; material impacts use noisy transients and damped resonances. */
window.ForestAudio=(()=>{
 const defaults={bgmOn:true,seOn:true,bgmVol:.18,seVol:.5};
 let stored={};try{stored=JSON.parse(localStorage.getItem('sbr2_preview_forest_audio_v2')||localStorage.getItem('sbr2_preview_forest_audio_v1')||'{}')||{};}catch(e){}
 const finite=(n,f,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):f;
 const settings={bgmOn:stored.bgmOn!==false,seOn:stored.seOn!==false,bgmVol:finite(stored.bgmVol,defaults.bgmVol,.26),seVol:finite(stored.seVol,defaults.seVol,.6)};
 const music=new Audio('../../assets/audio/forest-camp.mp3');music.loop=true;music.preload='metadata';music.volume=0;
 let ctx=null,bus=null,master=null,unlocked=false,fade=0,seed=345671,lastAuto=-Infinity,lastUser=-Infinity;
 const buffers=new Map(),voices=[];
 function save(){try{localStorage.setItem('sbr2_preview_forest_audio_v2',JSON.stringify(settings));}catch(e){}}
 function context(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();bus=ctx.createDynamicsCompressor();bus.threshold.value=-16;bus.knee.value=16;bus.ratio.value=3;bus.attack.value=.005;bus.release.value=.12;master=ctx.createGain();master.gain.value=settings.seOn?settings.seVol:0;bus.connect(master);master.connect(ctx.destination);}return ctx;}
 function noise(){seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;}
 function buffer(kind,variant=0){
  const key=kind+':'+variant;if(buffers.has(key))return buffers.get(key);
  const c=context(),duration=kind==='victory'||kind==='evolve'?.75:kind==='hire'?.42:kind==='stone'?.26:.2;
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0),pitch=1+variant*.035;
  let low=0,body=0,peak=0;
  for(let i=0;i<data.length;i++){
   const t=i/c.sampleRate,white=noise(),attack=1-Math.exp(-t/.0007);low+=.32*(white-low);body+=.055*(white-body);const bright=white-low;let v=0;
   if(kind==='wood'){
    // Axe crack, a low wooden body, then small splinters. No sustained pitched beep.
    v=bright*.72*Math.exp(-t*235)+low*.9*Math.exp(-t*72)+body*.8*Math.exp(-t*25);
    v+=(.38*Math.sin(2*Math.PI*173*pitch*t)+.19*Math.sin(2*Math.PI*347*pitch*t)+.09*Math.sin(2*Math.PI*628*pitch*t))*Math.exp(-t*48);
    if(t>.035)v+=bright*.13*Math.exp(-(t-.035)*95);
   }else if(kind==='stone'){
    const grain=.55+.45*Math.sin(2*Math.PI*89*t)*Math.sin(2*Math.PI*137*t);
    v=bright*.68*Math.exp(-t*160)+low*grain*.95*Math.exp(-t*35);
    v+=(.11*Math.sin(2*Math.PI*1031*pitch*t)+.07*Math.sin(2*Math.PI*1877*pitch*t)+.04*Math.sin(2*Math.PI*3029*pitch*t))*Math.exp(-t*42);
   }else if(kind==='pickup'){
    // A tiny rustle and two soft plucks make collecting distinct from harvesting.
    v=bright*.12*Math.exp(-t*85)+body*.6*Math.exp(-t*30);
    for(const [delay,freq,amp] of [[0,659,.16],[.045,988,.14]]){const q=t-delay;if(q>=0)v+=amp*(Math.sin(2*Math.PI*freq*q)+.2*Math.sin(2*Math.PI*freq*2*q))*(1-Math.exp(-q/.002))*Math.exp(-q*42);}
   }else if(kind==='place'){
    v=low*.8*Math.exp(-t*45)+.25*Math.sin(2*Math.PI*108*t)*Math.exp(-t*35);
   }else if(kind==='victory'||kind==='evolve'||kind==='hire'){
    const notes=kind==='hire'?[329.63,440,659.25]:[392,493.88,587.33,783.99];
    for(let n=0;n<notes.length;n++){const q=t-n*.075;if(q>=0)v+=.2*(Math.sin(2*Math.PI*notes[n]*q)+.18*Math.sin(2*Math.PI*notes[n]*2*q))*(1-Math.exp(-q/.003))*Math.exp(-q*16);}
   }else v=(low*.8+bright*.3)*Math.exp(-t*60)+.2*Math.sin(2*Math.PI*(kind==='critical'?113:78)*t)*Math.exp(-t*38);
   const sample=v*attack*Math.min(1,(duration-t)/.015);data[i]=sample;peak=Math.max(peak,Math.abs(sample));
  }
  const scale=.82/Math.max(.82,peak);for(let i=0;i<data.length;i++)data[i]*=scale;
  buffers.set(key,b);return b;
 }
 function play(kind,{group='user',level=1}={}){if(!settings.seOn||!unlocked||document.hidden)return false;const now=performance.now(),automatic=group==='unit'||group==='worker';if(automatic&&now-lastAuto<180)return false;if(!automatic&&now-lastUser<28)return false;if(automatic)lastAuto=now;else lastUser=now;try{const c=context();if(c.state==='suspended')void c.resume().catch(()=>{});if(voices.length>=8){const old=voices.find(v=>v.automatic)||voices[0];old.g.gain.setTargetAtTime(0,c.currentTime,.008);old.source.stop(c.currentTime+.025);voices.splice(voices.indexOf(old),1);}const source=c.createBufferSource(),g=c.createGain();source.buffer=buffer(kind,kind==='wood'||kind==='stone'?Math.floor((noise()+1)*1.5):0);source.playbackRate.value=kind==='wood'||kind==='stone'?.96+(noise()+1)*.04:1;g.gain.value=Math.min(.6,(automatic?.16:.52)*level);source.connect(g);g.connect(bus);const voice={source,g,automatic};voices.push(voice);source.onended=()=>{const i=voices.indexOf(voice);if(i>=0)voices.splice(i,1);source.disconnect();g.disconnect();};source.start();return true;}catch(e){return false;}}
 function sync(allow=false){unlocked ||= allow;updateButtons();if(!settings.bgmOn||!unlocked||document.hidden){music.pause();return;}if(!music.paused)return;music.volume=0;const playing=music.play();if(playing?.catch)playing.catch(()=>{});cancelAnimationFrame(fade);const start=performance.now();const tick=now=>{if(!settings.bgmOn||document.hidden)return;music.volume=settings.bgmVol*Math.max(0,Math.min(1,(now-start)/1000));if(now-start<1000)fade=requestAnimationFrame(tick);};fade=requestAnimationFrame(tick);}
 function setBgm(on){settings.bgmOn=!!on;save();if(!on){cancelAnimationFrame(fade);music.pause();}sync(on);}
 function setSe(on){settings.seOn=!!on;if(master)master.gain.setTargetAtTime(on?settings.seVol:0,ctx.currentTime,.01);save();updateButtons();if(on)play('pickup',{level:.35});}
 function updateButtons(lang=document.documentElement.lang||'ja'){const b=document.getElementById('bgmBtn'),s=document.getElementById('seBtn');if(b){b.textContent='♫ BGM '+(settings.bgmOn?'ON':'OFF');b.classList.toggle('on',settings.bgmOn);b.dataset.track='forest-camp';b.title=lang==='ja'?'森のキャンプ':lang==='zh'?'森林营地':'Forest camp';}if(s){s.textContent='♪ SE '+(settings.seOn?'ON':'OFF');s.classList.toggle('on',settings.seOn);}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();cancelAnimationFrame(fade);}else sync();});
 return {settings,save,context,play,sync,setBgm,setSe,updateButtons,get stats(){return {voices:voices.length,track:'forest-camp',source:music.currentSrc||music.src,paused:music.paused,volume:music.volume,decoded:buffers.size,sounds:[...new Set([...buffers.keys()].map(k=>k.split(':')[0]))]};}};
})();
