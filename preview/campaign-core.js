/* Authored expedition districts. No save writes, rewards or timers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CampaignCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CHAPTERS=Object.freeze([
  {name:'森の足跡',boss:'brood',base:'rat',title:'根喰いの大鼠',hp:72,speed:23,note:'大鼠を曲がり角までに削る。上の道に射程を重ねよう。',kinds:['rat','scout']},
  {name:'盾の街道',boss:'shieldlord',base:'shield',title:'盾列の隊長',hp:110,speed:22,note:'盾は剣士かバリスタで割る。弓兵だけに任せない。',kinds:['guard','shield','scout']},
  {name:'頭領の関所',boss:'chief',title:'頭領',note:'二本の道と空を守る。ここを越えても遠征は続く。',kinds:['guard','rat','bat']},
  {name:'粘菌の湿原',boss:'oozemother',base:'ooze',title:'粘菌の母体',hp:140,speed:21,note:'倒しても終わりではない。分裂した小粘菌を弓で迎え撃つ。',kinds:['ooze','rat','swarm']},
  {name:'夜翼の回廊',boss:'nightwing',base:'bat',title:'夜翼の女王',hp:135,speed:25,note:'飛行する女王には弓兵が必要。倉庫寄りにも射手を残す。',kinds:['bat','scout','shield']},
  {name:'祈祷の行列',boss:'elder',base:'shaman',title:'深森の大祈祷師',hp:170,speed:20,note:'列の回復役を先に狙う。射撃方針を「回復役を優先」へ。',kinds:['shaman','guard','shield']},
  {name:'地底の爪',boss:'deeproot',base:'mole',title:'地底の大掘削者',hp:180,speed:23,note:'道の中ほどでは地中に潜る。出てくる曲がり角を守る。',kinds:['mole','wisp','scout']},
  {name:'鉄牙の進軍',boss:'boar',title:'鉄牙の猪',note:'鎧を貫く剣士とバリスタ。猪には足止めが効かない。',kinds:['beetle','guard','swarm']},
  {name:'攻城包囲網',boss:'siegeking',base:'siegecart',title:'城砕きの大荷車',hp:260,speed:17,note:'投石役まで射程を伸ばす。大荷車を壊した後の鼠にも備える。',kinds:['slinger','siegecart','shaman']},
  {name:'異界の城門',boss:'duskking',base:'envoy',title:'黄昏の王',hp:340,speed:21,note:'空の王と地上の混成軍。弓・貫通・回復役の優先を組み合わせる。',kinds:['bat','beetle','shaman','wisp']}
 ].map(c=>Object.freeze({...c,kinds:Object.freeze(c.kinds)})));
 const MAX_WAVE=CHAPTERS.length*3;
 const chapter=w=>CHAPTERS[Math.min(CHAPTERS.length-1,Math.max(0,Math.floor(((Number(w)||1)-1)/3)))];
 function compose(wave,add){const c=chapter(wave),step=(wave-1)%3;
  // Two introduction/practice raids, then a boss encounter. More kinds, not exponential health.
  const count=step===2?18:step===1?24:20;
  for(let i=0;i<count;i++){const kind=c.kinds[(Math.floor(i/2)+step)%c.kinds.length],lane=i%2?'lower':'upper';add(kind,lane,Math.floor(i/2)*(step===2?1.8:1.4));}
  if(step===2)add(c.boss,Math.floor(wave/3)%2?'upper':'lower',12);
 }
 function stronghold(camp={}){const stage=camp.beacon?3:camp.gate?2:(camp.tools?.wood||camp.tools?.stone)?1:0;
  return {stage,name:['森の小屋','職人の拠点','街道の砦','灯火の城'][stage],next:['工具の工房を建てる','見張り門で砦へ','街への灯火で城へ','城を守り、遠征を進める'][stage],project:['woodTool','gate','beacon',null][stage]};
 }
 return {CHAPTERS,MAX_WAVE,chapter,compose,stronghold};
});
