/* Original camp music; material impacts use noisy transients and damped resonances. */
window.ForestAudio=(()=>{
 const defaults={bgmOn:true,seOn:true,bgmVol:.18,seVol:.5};
 let stored={};try{stored=JSON.parse(localStorage.getItem('sbr2_preview_outpost_audio_v2')||localStorage.getItem('sbr2_preview_outpost_audio_v1')||'{}')||{};}catch(e){}
 const finite=(n,f,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):f;
 const settings={bgmOn:stored.bgmOn!==false,seOn:stored.seOn!==false,bgmVol:finite(stored.bgmVol,defaults.bgmVol,.26),seVol:finite(stored.seVol,defaults.seVol,.6)};
 const tracks={camp:'forest-camp',raid:'camp-raid',final:'camp-finale',complete:'camp-homecoming'};
 let scene='camp',activeScene='camp',transitionTimer=null;
 const music=new Audio('../assets/audio/'+tracks.camp+'.mp3');music.loop=true;music.preload='metadata';music.volume=0;
 let ctx=null,bus=null,master=null,unlocked=false,fade=0,seed=345671,lastUser=-Infinity,duckTimer=null,duckUntil=0;
 const lastAuto={worker:-Infinity,unit:-Infinity},lastCue=new Map(),lastPlayed=new Map(),counts={played:0,throttled:0,capacity:0};
 const cues=new Set(['hire','victory','evolve','defeat','raidStart','crateLost','complete','build','reinforce','unlock','skill','skillMilestone','mastery']);
 const buffers=new Map(),voices=[];
 function save(){try{localStorage.setItem('sbr2_preview_outpost_audio_v2',JSON.stringify(settings));}catch(e){}}
 function context(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();bus=ctx.createDynamicsCompressor();bus.threshold.value=-16;bus.knee.value=16;bus.ratio.value=3;bus.attack.value=.005;bus.release.value=.12;master=ctx.createGain();master.gain.value=settings.seOn&&!document.hidden?settings.seVol:0;bus.connect(master);master.connect(ctx.destination);}return ctx;}
 function noise(){seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;}
 function buffer(kind,variant=0){
  const key=kind+':'+variant;if(buffers.has(key))return buffers.get(key);
  const c=context(),duration=kind==='skill'?.36:kind==='skillMilestone'?.5:kind==='mastery'?.6:kind==='skillReady'?.18:kind==='treeOpen'?.14:kind==='handFull'?.15:kind==='reinforce'?.42+Math.max(1,Math.min(3,variant))*.04:kind==='unlock'?.64:kind==='complete'?1.05:kind==='victory'||kind==='evolve'?.75:kind==='defeat'?.55:kind==='build'?.6:kind==='hire'||kind==='raidStart'?.42:kind==='crateLost'?.32:kind==='stone'?.26:.2;
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0),pitch=1+variant*.035;
  let low=0,body=0,peak=0;
  const growthNotes=kind==='reinforce'?[261.63,329.63,392,523.25,659.25].slice(0,2+Math.max(1,Math.min(3,variant))):[293.66,440,587.33,739.99];
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
   }else if(kind==='arrow'){
    // A short string snap and air transient; no long metallic ring.
    v=bright*.42*Math.exp(-t*110)+low*.22*Math.exp(-t*75)+.18*Math.sin(2*Math.PI*193*t)*Math.exp(-t*70);
   }else if(kind==='defeat'||kind==='crateLost'){
    const notes=kind==='defeat'?[293.66,246.94,196]:[392,293.66];
    for(let n=0;n<notes.length;n++){const q=t-n*.09;if(q>=0)v+=.18*(Math.sin(2*Math.PI*notes[n]*q)+.1*Math.sin(2*Math.PI*notes[n]*2*q))*(1-Math.exp(-q/.004))*Math.exp(-q*16);}
   }else if(kind==='raidStart'){
    for(const delay of [0,.13]){const q=t-delay;if(q>=0)v+=(low*.28+.22*Math.sin(2*Math.PI*(140-45*Math.min(1,q/.12))*q))*Math.exp(-q*32);}
   }else if(kind==='build'){
    for(const delay of [0,.085]){const q=t-delay;if(q>=0)v+=(low*.4+.18*Math.sin(2*Math.PI*145*q))*Math.exp(-q*48);}
    for(const [delay,note]of [[.15,392],[.22,493.88],[.29,587.33]]){const q=t-delay;if(q>=0)v+=.15*Math.sin(2*Math.PI*note*q)*(1-Math.exp(-q/.004))*Math.exp(-q*22);}
   }else if(kind==='reinforce'||kind==='unlock'){
    // Camp-grown success: warm plucks resolve upward; a new profession adds a quiet final chord.
    for(let n=0;n<growthNotes.length;n++){const q=t-n*.065;if(q>=0)v+=(.16*Math.sin(2*Math.PI*growthNotes[n]*q)+.035*Math.sin(2*Math.PI*growthNotes[n]*2*q))*(1-Math.exp(-q/.002))*Math.exp(-q*20);}
    if(kind==='unlock'&&t>.26){const q=t-.26;v+=(.07*Math.sin(2*Math.PI*293.66*q)+.055*Math.sin(2*Math.PI*440*q)+.04*Math.sin(2*Math.PI*739.99*q))*(1-Math.exp(-q/.006))*Math.exp(-q*13);}
   }else if(kind==='skill'||kind==='skillMilestone'||kind==='mastery'){
    // Work skills: a bell-like 1-2-5 climb (not the triads of reinforce/unlock), 60 ms apart; each branch starts on its own note.
    const base=[392,440,493.88,349.23][Math.max(0,Math.min(3,variant))],steps=kind==='skill'?[1,1.125,1.5]:kind==='skillMilestone'?[1,1.125,1.5,2]:[1,1.125,1.5,1.6875,2],gap=kind==='mastery'?.07:.06,amp=kind==='mastery'?.13:kind==='skillMilestone'?.13:.15;
    for(let n=0;n<steps.length;n++){const q=t-n*gap,f=base*steps[n];if(q>=0)v+=amp*(Math.sin(2*Math.PI*f*q)+.22*Math.sin(2*Math.PI*f*3*q)*Math.exp(-q*30))*(1-Math.exp(-q/.0015))*Math.exp(-q*(kind==='skill'?17:13));}
    if(kind==='skillMilestone'&&t>.18){const q=t-.18;v+=.06*(Math.sin(2*Math.PI*base/2*q)+.5*Math.sin(2*Math.PI*base*.75*q))*(1-Math.exp(-q/.01))*Math.exp(-q*9);}
    if(kind==='mastery'&&t>.3){const q=t-.3;v+=(.05*Math.sin(2*Math.PI*base*q)+.04*Math.sin(2*Math.PI*base*1.5*q)+.03*Math.sin(2*Math.PI*base*2*q))*(1-Math.exp(-q/.008))*Math.exp(-q*8);}
   }else if(kind==='skillReady'||kind==='treeOpen'){
    // A small two-note "something is ready" chime; the tree-open version is one softer note.
    for(const [delay,freq,amp] of kind==='skillReady'?[[0,880,.12],[.06,1174.66,.1]]:[[0,659.25,.09]]){const q=t-delay;if(q>=0)v+=amp*Math.sin(2*Math.PI*freq*q)*(1-Math.exp(-q/.002))*Math.exp(-q*28);}
   }else if(kind==='handFull'){
    // Hands full: a short wooden knock with a high glint.
    v=body*.5*Math.exp(-t*40)+.12*Math.sin(2*Math.PI*1318.5*t)*(1-Math.exp(-t/.002))*Math.exp(-t*30)+.1*Math.sin(2*Math.PI*523.25*t)*Math.exp(-t*35);
   }else if(kind==='place'){
    v=low*.8*Math.exp(-t*45)+.25*Math.sin(2*Math.PI*108*t)*Math.exp(-t*35);
   }else if(kind==='victory'||kind==='evolve'||kind==='hire'||kind==='complete'){
    const notes=kind==='hire'?[329.63,440,659.25]:kind==='complete'?[392,493.88,587.33,783.99,987.77]:[392,493.88,587.33,783.99];
    for(let n=0;n<notes.length;n++){const q=t-n*.075;if(q>=0)v+=.2*(Math.sin(2*Math.PI*notes[n]*q)+.18*Math.sin(2*Math.PI*notes[n]*2*q))*(1-Math.exp(-q/.003))*Math.exp(-q*16);}
   }else v=(low*.8+bright*.3)*Math.exp(-t*60)+.2*Math.sin(2*Math.PI*(kind==='critical'?113:78)*t)*Math.exp(-t*38);
   const sample=v*attack*Math.min(1,(duration-t)/.015);data[i]=sample;peak=Math.max(peak,Math.abs(sample));
  }
  const scale=.82/Math.max(.82,peak);for(let i=0;i<data.length;i++)data[i]*=scale;
  buffers.set(key,b);return b;
 }
 function fadeMusic(target,duration=180){cancelAnimationFrame(fade);const start=performance.now(),from=music.volume;const tick=now=>{if(!settings.bgmOn||document.hidden||music.paused)return;const t=Math.max(0,Math.min(1,(now-start)/duration));music.volume=from+(target-from)*t;if(t<1)fade=requestAnimationFrame(tick);};fade=requestAnimationFrame(tick);}
 function duckMusic(duration=850){if(!settings.bgmOn||music.paused)return;const now=performance.now();duckUntil=Math.max(duckUntil,now+duration);if(!transitionTimer)fadeMusic(settings.bgmVol*.55,65);clearTimeout(duckTimer);duckTimer=setTimeout(()=>{duckUntil=0;if(settings.bgmOn&&!music.paused&&!document.hidden&&!transitionTimer)fadeMusic(settings.bgmVol,450);},duckUntil-now);}
 function play(kind,options){
  let {group='user',level=1,stage=1,rate=0,branch=0}=options||{};
  if(!settings.seOn||!unlocked||document.hidden)return false;
  // The camp's own pickup while carrying is replaced by HarvestSkills' per-item rising pickups (from camp:handpickup).
  if(kind==='pickup'&&options===undefined&&window.HarvestSkills?.carrying?.())return false;
  const now=performance.now(),automatic=group==='unit'||group==='worker',cue=cues.has(kind),priority=cue?3:automatic?1:2;
  if(cue){const gap=kind==='crateLost'?110:kind==='hire'||kind==='reinforce'||kind==='unlock'||kind==='skill'||kind==='skillMilestone'||kind==='mastery'?90:300;if(now-(lastCue.get(kind)??-Infinity)<gap){counts.throttled++;return false;}}
  else if(automatic){if(now-lastAuto[group]<(group==='worker'?180:110)){counts.throttled++;return false;}}
  else if(now-lastUser<28){counts.throttled++;return false;}
  try{
   const c=context();if(c.state==='suspended')void c.resume().catch(()=>{});
   const groupLimit=group==='worker'?2:group==='unit'?3:8;
   const groupVoices=voices.filter(v=>v.group===group),full=voices.length>=8||automatic&&groupVoices.length>=groupLimit;
   if(full){const old=automatic&&groupVoices.length>=groupLimit?groupVoices[0]:voices.find(v=>v.automatic)||voices.find(v=>v.priority<=priority);if(!old){counts.capacity++;return false;}old.g.gain.setTargetAtTime(0,c.currentTime,.008);old.source.stop(c.currentTime+.025);voices.splice(voices.indexOf(old),1);}
   const source=c.createBufferSource(),g=c.createGain();source.buffer=buffer(kind,kind==='reinforce'?Math.max(1,Math.min(3,Math.floor(Number(stage)||1))):kind==='skill'||kind==='skillMilestone'||kind==='mastery'?Math.max(0,Math.min(3,Math.floor(Number(branch)||0))):kind==='wood'||kind==='stone'?Math.floor((noise()+1)*1.5):0);source.playbackRate.value=Number.isFinite(rate)&&rate>0?Math.max(.5,Math.min(2,rate)):kind==='wood'||kind==='stone'?.96+(noise()+1)*.04:1;
   const gain=cue?.47:group==='worker'?.13:group==='unit'?.18:.52;g.gain.value=Math.min(.6,gain*finite(level,1,2));source.connect(g);g.connect(bus);
   const voice={source,g,automatic,group,priority};voices.push(voice);source.onended=()=>{const i=voices.indexOf(voice);if(i>=0)voices.splice(i,1);source.disconnect();g.disconnect();};source.start();
   if(cue){lastCue.set(kind,now);duckMusic(kind==='complete'?1250:850);}else if(automatic)lastAuto[group]=now;else lastUser=now;lastPlayed.set(kind,now);counts.played++;return true;
  }catch(e){return false;}
 }
 function cancelTransition(){clearTimeout(transitionTimer);transitionTimer=null;}
 function loadScene(){cancelAnimationFrame(fade);music.pause();if(activeScene!==scene){music.src='../assets/audio/'+tracks[scene]+'.mp3';activeScene=scene;try{music.currentTime=0;}catch(e){}}music.volume=0;}
 function setScene(next){
  if(!Object.hasOwn(tracks,next)||scene===next)return false;
  scene=next;cancelTransition();updateButtons();
  if(activeScene===scene){if(settings.bgmOn&&unlocked&&!document.hidden&&!music.paused)fadeMusic(settings.bgmVol*(performance.now()<duckUntil?.55:1),180);else sync();return true;}
  if(!settings.bgmOn||!unlocked||document.hidden||music.paused){loadScene();sync();return true;}
  fadeMusic(0,230);transitionTimer=setTimeout(()=>{transitionTimer=null;loadScene();sync();},240);return true;
 }
 function sync(allow=false){unlocked ||= allow;updateButtons();if(!settings.bgmOn||!unlocked||document.hidden){music.pause();cancelAnimationFrame(fade);cancelTransition();return;}if(transitionTimer)return;if(activeScene!==scene)loadScene();if(!music.paused)return;music.volume=0;const playing=music.play();if(playing?.catch)playing.catch(()=>{});fadeMusic(settings.bgmVol*(performance.now()<duckUntil?.55:1),700);}
 function setBgm(on){settings.bgmOn=!!on;save();if(!on){cancelAnimationFrame(fade);cancelTransition();clearTimeout(duckTimer);duckUntil=0;music.pause();}sync(on);}
 function setSe(on){settings.seOn=!!on;if(master)master.gain.setTargetAtTime(on&&!document.hidden?settings.seVol:0,ctx.currentTime,.01);save();updateButtons();if(on)play('pickup',{level:.35});}
 function updateButtons(lang=document.documentElement.lang||'ja'){const b=document.getElementById('bgmBtn'),s=document.getElementById('seBtn');if(b){b.textContent='♫ BGM '+(settings.bgmOn?'ON':'OFF');b.classList.toggle('on',settings.bgmOn);b.dataset.track=tracks[scene];const labels={camp:['森のキャンプ','Forest camp','森林营地'],raid:['荷をまもる','Protect the cargo','保护货物'],final:['最後の防衛','The final defence','最后的防守'],complete:['帰る場所','A place to come home','归来的营地']};b.title=labels[scene][lang==='ja'?0:lang==='zh'?2:1];}if(s){s.textContent='♪ SE '+(settings.seOn?'ON':'OFF');s.classList.toggle('on',settings.seOn);}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();cancelAnimationFrame(fade);cancelTransition();if(master)master.gain.setTargetAtTime(0,ctx.currentTime,.005);for(const voice of voices.splice(0)){try{voice.source.stop(ctx.currentTime+.015);}catch(e){}}}else{if(master)master.gain.setTargetAtTime(settings.seOn?settings.seVol:0,ctx.currentTime,.01);sync();}});
 return {settings,save,context,play,lastPlayed:kind=>lastPlayed.get(kind)??-Infinity,sync,setScene,setBgm,setSe,updateButtons,get stats(){return {voices:voices.length,played:counts.played,throttled:counts.throttled,capacity:counts.capacity,voiceGroups:{worker:voices.filter(v=>v.group==='worker').length,unit:voices.filter(v=>v.group==='unit').length,cue:voices.filter(v=>v.priority===3).length},scene,activeScene,transitioning:!!transitionTimer,track:tracks[activeScene],source:music.currentSrc||music.src,paused:music.paused,volume:music.volume,decoded:buffers.size,sounds:[...new Set([...buffers.keys()].map(k=>k.split(':')[0]))]};}};
})();
