/* Supplies become spendable only when their visible cargo reaches the house. */
window.OutpostCamp = (() => {
 'use strict';
 const WORLD = FieldCore.WORLD, HOME = WORLD.home;
 const COST = {wood:32,stone:40},BELT_PORT={x:162,y:328};
 const words = {
  warehouse:['おうち','Warehouse','仓库'],workshop:['つくる','Workshop','工坊'],close:['とじる','Close','关闭'],
  food:['食料','Food','粮食'],wood:['き','Wood','木材'],stone:['いし','Stone','石材'],gold:['おかね','Gold','金币'],
  title:['なかまの しごとば','The camp workshop','营地工坊'],
  intro:['コンベアの うえに おくと、おうちへ ながれるよ。おうちから ひっぱって つくろう。','Items on a conveyor move into the house. Drag from the house to build.','放在传送带上的物资会运入房屋。从房屋拖动建造。'],
  rail:['コンベア','Conveyor','传送带'],build:['ここを つなぐ','Connect this route','连接这条路线'],
  extend:['つぎも つなぐ','Connect another worksite','延伸至下个采集点'],
  complete:['ぜんぶ つながった！','All worksites connected','全部已连接'],
  woodSite:['きの ばしょ','Wood site','伐木点'],stoneSite:['いしの ばしょ','Stone site','采石点'],
  carries:['2秒ごとに最大4個ずつ、倉庫へ運びます。','Carries up to 4 supplies every 2 seconds.','每2秒最多运送4份物资。'],
  available:['おうちに とどいた き・いしを つかうよ。','Supplies can be spent after they arrive home.','物资送达仓库后即可使用。'],
  worker:['はたらく なかま','Workers nearby:','附近作业中'],people:['にん','','人'],
  noWorker:['ここに なかまを おくと、あつめて はこんでくれるよ。','Place a worker here to automate gathering and delivery.','在此布置采集伙伴，即可自动采集并运送。'],
  automated:['き・いしが レールで おうちへ とどくよ。','Supplies travel to the warehouse by rail.','物资沿轨道送达仓库。'],
  needed:['あと','Need','还需'],connected:['つながった','Connected','已连接'],
  linked:['つながった！ にもつが おうちへ とどくよ。','Route connected. Watch the cargo travel home.','已连接仓库，等待货物送达。'],
  inTransit:['はこんでいるよ','On the way','运送中'],arrived:['おうちに とどいた！','Delivered home','已送达仓库'],
  tapHome:['おうちを おすと つくれるよ。','Tap the house to open the workshop.','点击房屋打开工坊。'],
  clickPile:['き・いしを つかんで おうちへ！','Drag fallen supplies into the house.','将掉落物资拖到房屋！'],dragging:['おうちへ はなしてね！','Release over the house!','拖到房屋后松开！'],returned:['もどしたよ。つかんで おうちへ！','Returned. Drag it into the house.','已放回，请拖到房屋！'],
  firstRail:['コンベアを おして、おうちから ひっぱろう！','Choose Conveyor, then drag out from the house!','选择传送带，再从房屋向外拖动！'],
  stoneNext:['つぎは いしの ばしょも おうちへ つなごう。','Connect a stone worksite next.','接下来连接采石点。'],
  bothRails:['うごく ベルトに のせると おうちへ とどく！','Place items on the moving belt to send them home!','放在移动的传送带上，物资就会运入房屋！']
 };
 const beltWords={platformBlocked:['ここには おけないよ。べつの ばしょに おこう。','Choose another clear place for the platform.','这里不能放置，请选择其他空地。'],platformBuild:['▦ うけとるだい','▦ Receiving platform','▦ 接料平台'],platformHint:['だいを おこう。やじるしの さきに ベルトを つなごう。','Place a platform. Connect a belt at its output arrow.','放置平台，并把传送带连接到箭头出口。'],platformCost:['き8・いし4','8 wood · 4 stone','8木材·4石材'],rotate:['むき ↻','Turn ↻','转向 ↻'],freeBeltHint:['とどけたい ばしょから ひっぱろう！ やじるしは はじめの ばしょへ。','Drag from the destination toward the incoming items. Arrows point back to your starting point.','从接收处向来料方向拖动，箭头指向起点。'],beltCollect:['まず きを おうちへ はこぼう（き 2〜）','First deliver wood to the house (from 1 wood).','先把木材送入房屋（木材1起）。'],beltBuild:['▰ コンベア','▰ Conveyor','▰ 传送带'],beltHint:['とどけたい ところから ひっぱって のばそう！','Drag from the destination toward incoming items!','从接收处向来料方向拖动延伸！'],beltRelease:['はなすと つくれるよ。き ','Release to build. Wood ','松开建造。木材 '],beltWood:['きが たりないよ。みじかく ひこう。','Not enough wood. Draw a shorter belt.','木材不足，请缩短传送带。'],beltPlaced:['できた！ うえに き・いしを のせよう！','Built! Drop wood or stone onto the belt!','建好了！把木石放到传送带上！'],beltFeed:['コンベアか おうちへ はなそう！','Release on a conveyor or the house!','在传送带或房屋上松开！']};
 const railWords={chooseSource:['どこから はこぶ？ き・いしの ○ を おそう。','Choose a worksite: click its loading circle.','选择采集点，点击装货圆圈。'],layRoute:['ちかくの じめんを おして レールを のばそう。おうちまで つなごう。','Click nearby ground to extend the rails. Reach the house.','点击附近地面延伸轨道，直到房屋。'],confirmRoute:['おうちに つながった！ ねだんを みて つくろう。','Connected to the house. Check the price and build.','已连接房屋，确认费用后建造。'],undo:['ひとつ もどす','Undo point','撤销一点'],cancelRail:['やめる','Cancel','取消'],layRail:['この みちを つくる','Build this route','修建此路线'],gap:['とおすぎるよ。ちかくに ひとつずつ おこう。','Too far. Place one short section at a time.','太远了，请逐段铺设。'],object:['き・いわを よけて おこう。','Go around trees and rocks.','请绕开树木和岩石。'],bounds:['じめんの なかに おこう。','Keep the rails on the field.','请在场地内铺设。'],short:['もうすこし はなれた ところへ。','Choose a point farther away.','请选择稍远一点的位置。'],long:['みちが ながすぎるよ。もどして みじかくしよう。','Route too long. Undo some points.','路线过长，请撤销部分节点。'],remove:['こわす・はんぶん もどる','Remove / half refund','拆除·退还一半'],railPrice:['8G ＋ ながさ32ごとに2G','8G station + 2G per 32 distance','站点8G＋每32距离2G'],draw:['じぶんで レールを しく','Lay rails yourself','手动铺设轨道']};
 const projectWords={rails:['コンベア','Conveyors','传送带'],growth:['どうぐ・おうち','Tools / home','工具·营地'],woodTool:['きこりの どうぐ','Lumberjack tools','伐木工具'],stoneTool:['いしほりの どうぐ','Mining tools','采矿工具'],cart:['コンベアの モーター','Conveyor motor','传送带马达'],gate:['みはりの もん','Watch gate','守望门'],beacon:['まちへの あかり','Town beacon','城镇灯塔'],made:['できた！','Built!','已建成！'],make:['つくる','Build','建造'],locked:['まずは ここまで まもろう','Defend up to this raid first','先守住这一波'],rank:['だんかい','Level','阶段'],materials:['つかうもの','Materials','材料'],faster:['ひとりで はやく はたらける！','Each worker gathers faster.','每位工人采集更快。'],cartEffect:['ベルトの はやさ ×1.25！','Belt speed ×1.25!','传送带速度×1.25！'],gateEffect:['おうちの まえで 2.5びょう まにあう！','A 2.5-second rescue window at the house.','房屋前有2.5秒的救援时间。'],beaconEffect:['まちへの みちを ひらく あかり。さいごの むれを まもろう！','Light the way to town, then defend the final raid.','点亮通往城镇的道路，守住最终袭击。'],projectDone:['できた！ なかまの しごとを みてみよう。','Built! Watch your camp work.','建好了！看看营地的变化。']};
 const toolWords={blowerLimit:['送風機は40台までです。撤去してから置きましょう。','Up to 40 blowers. Remove one first.','鼓风机最多40台，请先拆除。'],fenceLimit:['誘導柵は80本までです。撤去してから置きましょう。','Up to 80 fences. Remove one first.','导流栅栏最多80条，请先拆除。'],windBy:['送風機が届けた！','The blower delivered it!','鼓风机送到了！'],windChain:['風の納品 ×','Wind delivery ×','风力入库 ×'],predicted:['予告 ','Preview ','预告 '],tally:[' 届いた',' delivered',' 已送达'],beltLocked:['コンベアは章1クリア（Wave3撃退）で解放されます。','Conveyors unlock after Chapter 1 (clear Wave 3).','传送带在第1章通关（击退第3波）后解锁。'],
  blowerHint:['落下先に風を当てる。設置後は本体をドラッグして風向き調整','Cover the drop point with wind. After placing, drag the body to aim.','让风覆盖掉落点。放置后拖动本体调整风向。'],blowerCost:['木材4','4 wood','4木材'],
  blowerBlocked:['ここには置けません。木・岩・倉庫・仲間・設備から少し離してください。','Cannot place here. Keep clear of trees, rocks, the house, allies and equipment.','这里不能放置，请远离树木、岩石、房屋、伙伴和设备。'],
  fenceHint:['ドラッグで柵を引く（長さ24〜120）','Drag to draw a fence (length 24–120).','拖动画出栅栏（长度24–120）。'],fenceRelease:['離すと設置。木材 ','Release to build. Wood ','松开建造。木材 '],
  fenceShort:['もう少し長く引いてください（24以上）','Draw a little longer (24 or more).','请再拉长一点（24以上）。'],fenceBlocked:['柵は畑の中、倉庫にかからない場所へ','Keep the fence on the field and off the house.','栅栏需在场地内，且不能压住房屋。'],
  toolWood:['木材が足りません。','Not enough wood.','木材不足。'],
  blowerPlaced:['送風機を設置。本体をドラッグで風向き、タップで強風。','Blower placed. Drag its body to aim; tap for strong wind.','已放置鼓风机。拖动本体调整风向，点击可强风。'],
  fencePlaced:['柵を設置。資材は柵に沿って滑ります。','Fence built. Items slide along it.','栅栏已建成，物资会沿栅栏滑动。'],
  gust:['強風！','Strong wind!','强风！'],
  newTools:['新しい道具：送風機・誘導柵（仲間・設備の一覧）','New tools: Blower and Guide fence (crew & equipment list).','新工具：鼓风机与导流栅栏（伙伴与设备列表）。'],
  relock:['解放前のため敷き直せません（章1クリアで解放）','Cannot be rebuilt until unlocked (clear Chapter 1).','解锁前无法重建（第1章通关后解锁）'],
  firstBlower:['送風機を置いて、丸太を倉庫へ吹き寄せよう','Place a blower to push logs toward the house.','放置鼓风机，把木材吹向房屋。'],
  blowGuide:['送風機の本体を連打すると強風。柵で取りこぼしを寄せよう','Tap a blower for strong wind. Use fences to catch strays.','连点鼓风机可强风，用栅栏收拢漏掉的物资。'],
  // M4: chapter 1 reward, wooden conveyor length, hopper
  unlockTitle:['解放！ 木製コンベア・集積口','Unlocked! Wooden conveyor & hopper','解锁！木制传送带·集料斗'],
  unlockBody:['章1クリアのごほうび。集積口で落下点をまとめ、コンベアで遠くへ運ぼう','Chapter 1 reward: gather drop points with a hopper, carry them far on a conveyor.','第1章奖励：用集料斗汇集掉落点，再用传送带远距离运送。'],
  beltMax:['1本の長さは240まで。続きは端からもう1本つなごう','One belt is at most 240 long. Start another from its end to go farther.','每条最长240。从末端再接一条即可延伸。'],
  beltLimit:['1本の長さ上限に到達','Belt length limit reached','已达单条传送带长度上限'],
  beltContinue:['今作った先端から、もう1本つなげます。','Start another belt from the end you just placed.','从刚铺好的末端再连接一条。'],
  continueHere:['ここから続きを敷く','Continue from here','从这里继续铺设'],
  beltLength:['長さ ','Length ','长度 '],
  hopperHint:['押して位置を確認 → 離して設置。↻で出口の向き（8方向）','Press to preview, release to place. ↻ turns the outlet (8 ways).','按住预览，松开放置。↻转动出口（8个方向）。'],
  hopperCost:['木材10 ＋ 石材4','10 wood + 4 stone','10木材 ＋ 4石材'],
  hopperBlocked:['ここには置けません。木・岩・倉庫・ほかの道具から離しましょう。','Cannot place here. Keep clear of trees, rocks, the house and other tools.','这里不能放置，请远离树木、岩石、房屋和其他工具。'],
  hopperMaterials:['木材10と石材4が必要です。','Needs 10 wood and 4 stone.','需要10木材和4石材。'],
  hopperLimit:['集積口は20台までです。撤去してから置きましょう。','Up to 20 hoppers. Remove one first.','集料斗最多20台，请先拆除。'],
  hopperPlaced:['集積口を設置。周りの資材を1つずつ吸い寄せ、出口から出します。','Hopper placed. It draws nearby items in one at a time and lets them out of its outlet.','已放置集料斗。逐个吸入周围物资，从出口送出。'],
  hopperLocked:['集積口は章1クリア（Wave3撃退）で解放されます。','The hopper unlocks after Chapter 1 (clear Wave 3).','集料斗在第1章通关（击退第3波）后解锁。']};
 Object.assign(beltWords,{loaderHint:['地面を押して範囲とコンベアを確認 → 離して設置','Press to preview range and conveyor → release to place','按住查看范围和传送带 → 松开放置'],loaderMaterials:['木材12・石材6が必要です','Needs 12 wood and 6 stone','需要12木材和6石材'],loaderBlocked:['本体が重なっています。少し離して置きましょう','Bodies overlap. Leave a little space.','设备重叠，请稍微分开放置'],loaderLimit:['積み込み機は20台までです','Up to 20 loaders','装载机最多20台'],loaderPlaced:['積み込み機を設置。近くのコンベアへ一個ずつ運びます','Loader placed. Moves one item at a time onto a nearby conveyor.','装载机已放置，逐个搬运至附近传送带']});
 const pickWords={turn:['向きを変える ↻','Turn ↻','转向 ↻'],removeHint:['タップで撤去','Tap to remove','点击可拆除'],length:['長さ','length ','长度']};
 // Short, ordinary language; concrete quantities remain visible in all locales.
 const japanese={beltCollect:'木材を倉庫へ納品すると設置できます（木材1〜）。',warehouse:'倉庫',workshop:'工房',close:'閉じる',wood:'木材',stone:'石材',gold:'所持金',title:'作業場の設備',intro:'コンベアに載った資材だけが運ばれます。倉庫から伸ばすか、受け土台とつないで経路を作りましょう。',available:'倉庫に届いた資材で建設できます。',worker:'作業中の仲間',people:'人',inTransit:'資材を搬送中',arrived:'倉庫に納品しました',tapHome:'倉庫を押すと工房を開きます',clickPile:'資材をつかんで倉庫へ運ぶ',dragging:'倉庫かコンベアの上で離す',returned:'地面に戻しました',firstRail:'コンベアを選び、倉庫から伸ばして敷設',stoneNext:'石材の落下先も倉庫につなごう',bothRails:'ベルトに載った資材が倉庫へ届く',platformBuild:'▦ 受け土台',platformHint:'地面を押して仮置き。向きを選び、離して建設。',platformCost:'木材8 ＋ 石材4',beltHint:'届け先から、資材を受け取る場所へ引き伸ばす',beltRelease:'離すと建設。木材 ',beltWood:'木材が足りません。短く敷設してください。',beltPlaced:'建設完了。上に資材を載せると動きます。',beltFeed:'コンベアか倉庫の上で離す',undo:'直前の建設を戻す',cancelRail:'建設を終了',growth:'工具・拠点',woodTool:'木こりの工具',stoneTool:'採掘の工具',cart:'コンベアのモーター',gate:'見張り門',beacon:'街への灯火',made:'建設済み',make:'建設する',locked:'指定の襲撃を防ぐと解放',rank:'段階',materials:'必要資材',faster:'各作業員の採集速度が上がる',cartEffect:'コンベアの搬送速度 ×1.25',gateEffect:'倉庫の前で敵を2.5秒足止めする',beaconEffect:'弓兵の射程が90から110へ拡大。最後の襲撃に備える任意の強化。',projectDone:'建設完了。作業場の変化を確認しよう。'};
 for(const [key,text]of Object.entries(japanese)){const entry=words[key]||projectWords[key]||railWords[key]||beltWords[key];if(entry)entry[0]=text;}
 function catalogHTML(){
  const l=a=>a[Math.max(0,['ja','en','zh'].indexOf(language()))];
  const open=conveyorUnlocked(),lock=l(['🔒 章1クリアで解放','🔒 Unlocks after Chapter 1','🔒 第1章通关后解锁']);
  return '<h3 class="equipment-heading">'+l(['搬送設備','Transport equipment','运输设备'])+'</h3><p class="equipment-intro">'+l(['種類を選んで地面に設置。資材は設置時に消費します。','Choose a type, then build on the ground. Materials are spent when placed.','选择类型后在地面建造，放置时消耗材料。'])+'</p>'+[
   ['blower','<span class="equipment-art blower-art"></span>',l(['送風機','Blower','鼓风机']),l(['木材4','4 wood','4木材']),l(['扇形の中の資材を吹き飛ばす。本体を連打すると数秒だけ強風。','Pushes items inside its fan. Tap it repeatedly for a few seconds of strong wind.','把扇形范围内的物资吹走。连续点击本体可短时强风。']),true],
   ['fence','<span class="equipment-art fence-art"></span>',l(['誘導柵','Guide fence','导流栅栏']),l(['長さ24ごとに木材1','1 wood per 24 length','每24长度1木材']),l(['ドラッグで線を引く。資材は柵に沿って滑り、端から抜ける。','Drag a line. Items slide along it and leave at the ends.','拖动画线。物资沿栅栏滑动，从末端离开。']),true],
   ['belt','▰',l(['木製コンベア','Wooden conveyor','木制传送带']),l(['長さ48ごとに木材1 · 1本240まで','1 wood per 48 length · up to 240 each','每48长度1木材 · 每条最长240']),l(['上に載った資材を運ぶ。遠くへは端からもう1本つなぐ。','Carries items on it. Drag out from the destination; for longer routes, join another belt at its end.','运送其上的物资。从接收处向外拖动，更远时从末端再接一条。']),open],
   ['hopper','<span class="equipment-art hopper-art"></span>',l(['集積口','Hopper','集料斗']),l(['木材10 ＋ 石材4','10 wood + 4 stone','10木材 ＋ 4石材']),l(['半径60の資材を1つずつ吸い寄せ、出口から0.6秒ごとに出す。','Draws items within 60 in one at a time and lets one out of its outlet every 0.6 s.','逐个吸入半径60内的物资，每0.6秒从出口送出一个。']),open],
   ['loader','⚙',l(['積み込み機','Loader','装载机']),l(['木材12 ＋ 石材6','12 wood + 6 stone','12木材 ＋ 6石材']),l(['半径70の資材を一個ずつ拾い、80以内のコンベアに載せる。','Picks up items within 70, one at a time, and loads a conveyor within 80.','逐个拾取半径70内物资，装到80范围内的传送带上。']),true],
   ['platform','▦',l(['受け土台','Receiving platform','接收平台']),l(['木材8 ＋ 石材4','8 wood + 4 stone','8木材 ＋ 4石材']),l(['広い面で受け取り、矢印へ運ぶ。','Catches items across a wide surface and moves them toward its arrow. Connect a belt beside it.','大范围接收物资并沿箭头搬运，在旁边连接传送带。']),open]
  ].filter(([id])=>!window.ProgressionCore||ProgressionCore.hasRecipe(state(),id)).map(([id,icon,name,cost,description,ready])=>'<div class="card equipment-card'+(ready?'':' is-locked')+(ready&&unlockGlow>visualTime&&(id==='belt'||id==='hopper'||id==='platform')?' just-unlocked':'')+'"><span class="equipment-icon" aria-hidden="true">'+icon+'</span><b class="nm">'+name+'</b><p>'+description+'</p><strong>'+(ready?cost:lock)+'</strong><button type="button" data-equipment="'+id+'"'+(ready?'':' disabled aria-disabled="true"')+'>'+(ready?l(['設置する →','Place →','放置 →']):lock)+'</button></div>').join('');
 }
 let drag=null,dragGhost=null,dragInstalled=false;
 let railDraft=null,railPanel=null,railHover=null,railError='',beltPointer=null,beltButton=null,beltHistory=[],platformButton=null,platformMode=false,platformPreview=null,platformDir=0,continuation=null;
 // M3 ground tools share the transient build draft (railDraft), so the field stays in one building mode.
 let deviceMode=null,devicePreview=null,blowerDir=4,hopperDir=4,longPress=0,unlockSeen=null,unlockGlow=-Infinity,unlockBanner=null;
 // Ground-tool feedback (wind deliveries, near misses, gust streaks), drawn over the field: {kind,t0,dur,...}.
 let fx=[],windChain=0,lastWindAt=-Infinity,hiddenUnderCard={at:-Infinity,n:0};
 let activeTab='rails',workshopMessage='';
 let pulse=null,picked=null,pickCard=null,pickPress=null,pickHighlight=null,folding=[],removeHint=null,removeHintShown=false,windGesture=null;
 let placementChoice=null,placementPress=null,placementCard=null;
 let booted=false,activeCamp=null,railClock=0,uiClock=0,houseFlash=0;
 let warehouse=null,overlay=null,goldLabel=null,deliveryLabel=null,workshopStatus=null;
 let statusKey='clickPile',statusUntil=0,visualTime=0,positionKey='',languageKey='',notices=[];
 const language=()=>typeof LANG==='string'?LANG:'ja';
 for(const [key,text]of Object.entries({blowerHint:'1回押して仮置き。同じ場所をもう1回押すか「ここに設置」で確定。',hopperHint:'1回押して仮置き。近くのボタンで向きを選び、もう1回押して設置。',loaderHint:'コンベアのそばで仮置きし、同じ場所をもう1回押して設置。',platformHint:'1回押して仮置き。近くで向きを選び、もう1回押して設置。'})){const table=words[key]?words:toolWords[key]?toolWords:beltWords[key]?beltWords:projectWords[key]?projectWords:railWords;table[key]??=[];table[key][0]=text;}
 const tr=key=>key==='iron'?'鉄鉱石':(words[key]||projectWords[key]||railWords[key]||beltWords[key]||pickWords[key]||toolWords[key])[Math.max(0,['ja','en','zh'].indexOf(language()))];
 const format=n=>typeof fmt==='function'?fmt(n):String(Math.floor(n));
 const current=()=>typeof S==='undefined'?null:S;
 const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 const persist=()=>{if(typeof save==='function')save();};
 const audio=event=>window.ForestAudio?.play(event);
 const clamp=(n,min,max)=>Math.max(min,Math.min(Math.max(min,max),n));
 const keyEqual=(a,b)=>String(a)===String(b);
 const skillEffects=()=>window.HarvestSkillCore?.effects?.(current()?.harvestSkills)||{carryCapacity:1,cartSpeed:1};
 const handCapacity=()=>Math.max(1,Math.min(16,Math.floor(skillEffects().carryCapacity||1)));
 const heldDrop=drop=>drag?.items.some(item=>item.drop===drop)===true;
 const railCargo=cargo=>cargo.mode==='rail'||(!cargo.mode&&cargo.duration>.61);

 function state(){
  const s=current();if(!s)return null;
  if(!s.factory)s.factory=SupplyCore.fresh(WORLD.width,WORLD.height);
  if(!s.camp){
   s.camp={version:1,links:[],cargo:[],nextKey:1,tools:{wood:0,stone:0},gate:false,beacon:false,cart:false,endingSeen:false};
   s.factory.width=WORLD.width;s.factory.height=WORLD.height;s.factory.depot={...HOME};
   // New camps have room to design a route. Existing sites and player-built factories never move.
   s.factory.nodes=[{key:1,type:'wood',x:340,y:300},{key:2,type:'wood',x:620,y:300},{key:3,type:'stone',x:430,y:425},{key:4,type:'stone',x:750,y:425}].map(n=>({...n,stock:300,radius:n.type==='wood'?16:19,regrow:0}));
   s.factory.next=Math.max(5,s.factory.next||1,...s.factory.drops.map(d=>(Number(d.key)||0)+1));
  }
  FieldCore.expand(s.factory,s.camp);FieldCore.revealOre(s.factory,s.camp);
  s.camp.loaders??=[];s.camp.platforms??=[];s.camp.blowers??=[];s.camp.fences??=[];s.camp.hoppers??=[];s.camp.logisticsVersion??=2;s.camp.tools??={wood:0,stone:0};for(const type of ['wood','stone'])s.camp.tools[type]=Math.max(0,Math.min(2,Math.floor(Number(s.camp.tools[type])||0)));for(const flag of ['gate','beacon','cart','endingSeen','removeLearned'])s.camp[flag]=s.camp[flag]===true;
  if(activeCamp!==s.camp){
   activeCamp=s.camp;placementChoice=null;picked=null;pickPress=null;windGesture=null;if(placementCard)placementCard.hidden=true;if(pickCard)pickCard.hidden=true;railClock=0;uiClock=0;houseFlash=0;notices=[];railDraft=null;railHover=null;
   statusKey='clickPile';statusUntil=0;languageKey='';
  }
  // Older saves that already had belts: tell once that blowers and fences exist (no lesson replay).
  if(s.camp.legacyBelts&&!s.camp.newToolsSeen){s.camp.newToolsSeen=true;statusKey='newTools';statusUntil=visualTime+8;}
  return s;
 }
 const linked=(s,node)=>s.camp.links.some(link=>keyEqual(link.nodeKey,node.key));
 const railExists=type=>{const s=state(),id=type==='wood'?'woodcutter':type==='food'?'farmer':'miner';return (window.ArmyView?.sim?.soldiers||[]).some(p=>{if(p.id!==id)return false;const n=s.factory.nodes.filter(n=>n.type===type).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!n)return false;const out=window.SupplyFactory?.outputForWorker?.(p,n)||{x:p.x+Math.sign(p.x-n.x)*24,y:p.y+24};return !!ConveyorCore.contact(s.camp.links,out)||!!ConveyorCore.platformAt(s.camp.platforms,out);});};
 function workersAt(node){
  const id=node.type==='wood'?'woodcutter':node.type==='food'?'farmer':'miner';
  return (window.ArmyView?.sim?.soldiers||[]).filter(p=>p.id===id&&Math.hypot(p.x-node.x,p.y-node.y)<72).length;
 }
 function nextNode(s,type){
  return s.factory.nodes.filter(n=>n.type===type&&!linked(s,n)).sort((a,b)=>workersAt(b)-workersAt(a)||Math.hypot(a.x-HOME.x,a.y-HOME.y)-Math.hypot(b.x-HOME.x,b.y-HOME.y))[0];
 }
 function siteName(s,node){
  const number=s.factory.nodes.filter(n=>n.type===node.type).findIndex(n=>keyEqual(n.key,node.key))+1;
  return tr(node.type==='wood'?'woodSite':'stoneSite')+' '+number;
 }

 function makeDOM(){
  const field=document.getElementById('field'),inventory=document.getElementById('supplyInventory');
  if(!field||!inventory)return;
  if(!warehouse){
   warehouse=document.createElement('aside');warehouse.id='campWarehouse';
   warehouse.innerHTML='<button type="button" class="camp-house-label"><b></b><span></span></button><div class="camp-gold"><span></span><strong id="campGold"></strong></div><small id="groundStorageStatus"></small><small id="campDeliveryNote" role="status" aria-live="polite"></small>';
   document.getElementById('deckMain').prepend(warehouse);warehouse.querySelector('.camp-house-label').onclick=openWorkshop;
   warehouse.addEventListener('pointerdown',e=>e.stopPropagation());
   warehouse.insertBefore(inventory,warehouse.querySelector('#campDeliveryNote'));
   goldLabel=warehouse.querySelector('#campGold');deliveryLabel=warehouse.querySelector('#campDeliveryNote');
  }else if(inventory.parentElement!==warehouse)warehouse.insertBefore(inventory,deliveryLabel);
  if(!pickCard){pickCard=document.createElement('div');pickCard.id='beltActions';pickCard.hidden=true;pickCard.setAttribute('role','group');pickCard.innerHTML='<button type="button" class="context-close" data-pick-action="close" aria-label="選択を解除">× 閉じる</button><b class="belt-actions-title"></b><small class="fan-aim-hint" hidden></small><div class="belt-actions-buttons"><button type="button" data-pick-action="turn"></button><button type="button" data-pick-action="remove"></button></div>';field.append(pickCard);pickCard.addEventListener('pointerdown',e=>e.stopPropagation());pickCard.addEventListener('click',e=>{const action=e.target.closest('[data-pick-action]')?.dataset.pickAction;if(!action||!picked||window.Rework?.paused)return;if(action==='close'){clearSelection();return;}if(action==='remove')removePiece(picked.kind,picked.key);else turnPiece(picked.kind,picked.key);});}
  const toolbar=document.getElementById('rxToolbar'),tools=document.getElementById('hudTools');
  if(toolbar&&tools&&tools.parentElement!==toolbar)toolbar.append(tools);
 }

 function makeWorkshop(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='campWorkshop';overlay.className='rx-overlay';
  overlay.innerHTML='<section class="rx-dialog camp-workshop" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="campWorkshopTitle"><button type="button" class="rx-close"></button><span class="rx-kicker">CAMP WORKSHOP</span><h2 id="campWorkshopTitle"></h2><p class="camp-workshop-intro"></p><p class="camp-workshop-wallet"><span></span> <strong></strong></p><p class="camp-stock-wallet"></p><div class="camp-workshop-tabs"><button type="button" data-camp-tab="rails"></button><button type="button" data-camp-tab="growth"></button></div><div class="camp-rail-options">'+['wood','stone'].map(type=>'<section class="camp-rail-option" data-camp-option="'+type+'"><div class="camp-rail-heading"><h3></h3><span class="camp-rail-count"></span></div><div class="camp-route"><b class="camp-route-origin"></b><span class="camp-route-track" aria-hidden="true"></span><b class="camp-route-home"></b></div><p class="camp-rail-rate"></p><p class="camp-rail-workers"></p><button type="button" data-camp-build="'+type+'"><span></span><strong></strong></button><small class="camp-rail-afford"></small></section>').join('')+'</div><div class="camp-projects" hidden></div><p class="camp-workshop-status" role="status" aria-live="polite"></p><p class="camp-workshop-note"></p></section>';
  document.body.append(overlay);workshopStatus=overlay.querySelector('.camp-workshop-status');
  overlay.querySelector('.rx-close').onclick=()=>window.Rework?.close();
  const rowPiece=e=>{const b=e.target.closest?.('[data-camp-remove],[data-platform-turn],[data-platform-remove],[data-device-turn],[data-device-remove]');if(!b)return null;if(b.dataset.deviceTurn!==undefined){const v=b.dataset.deviceTurn;return v.includes(':')?{kind:v.split(':')[0],key:v.split(':')[1]}:{kind:'blower',key:v};}if(b.dataset.deviceRemove!==undefined){const [kind,key]=b.dataset.deviceRemove.split(':');return {kind,key};}return b.dataset.campRemove!==undefined?{kind:'belt',key:b.dataset.campRemove}:{kind:'platform',key:b.dataset.platformTurn??b.dataset.platformRemove};};
  // The board is paused under the dialog, so redraw once whenever the highlighted row changes.
  const highlight=p=>{if(JSON.stringify(p)===JSON.stringify(pickHighlight))return;pickHighlight=p;window.ArmyView?.redraw?.();};for(const type of ['pointerover','focusin'])overlay.addEventListener(type,e=>highlight(rowPiece(e)));for(const type of ['pointerout','focusout'])overlay.addEventListener(type,e=>{if(rowPiece(e))highlight(null);});
  overlay.addEventListener('click',e=>{
   if(e.target===overlay){window.Rework?.close();return;}
   const tab=e.target.closest('[data-camp-tab]');if(tab){if(window.ProgressionCore&&tab.dataset.campTab==='growth'){window.HarvestSkills?.open(nextProject()?.projectId);return;}activeTab=tab.dataset.campTab;syncWorkshop(state());return;}const project=e.target.closest('[data-camp-project]');if(project&&!project.disabled){if(window.ProgressionCore){const q=quote(project.dataset.campProject);window.HarvestSkills?.open(q.projectId);}else build(project.dataset.campProject);return;}
   const deviceTurn=e.target.closest('[data-device-turn]');if(deviceTurn){const v=deviceTurn.dataset.deviceTurn;if(v.includes(':'))turnPiece(v.split(':')[0],Number(v.split(':')[1]));else turnPiece('blower',Number(v));return;}const deviceRemove=e.target.closest('[data-device-remove]');if(deviceRemove){const [kind,key]=deviceRemove.dataset.deviceRemove.split(':');removePiece(kind,Number(key));return;}const turn=e.target.closest('[data-platform-turn]');if(turn){const p=state().camp.platforms.find(p=>p.key===Number(turn.dataset.platformTurn));if(p)turnPlatform(p.key);return;}const platformRemove=e.target.closest('[data-platform-remove]');if(platformRemove){const i=state().camp.platforms.findIndex(p=>p.key===Number(platformRemove.dataset.platformRemove));if(i>=0)removePiece('platform',state().camp.platforms[i].key);return;}const remove=e.target.closest('[data-camp-remove]');if(remove){removeRail(remove.dataset.campRemove);return;}const button=e.target.closest('[data-camp-build]');if(button&&!button.disabled)buildRail(button.dataset.campBuild);
  });
 }

 function syncWorkshop(s){
  if(!overlay)return;
  if(workshopMessage)setText(workshopStatus,tr(workshopMessage));
  overlay.querySelector('.rx-close').setAttribute('aria-label',tr('close'));
  setText(overlay.querySelector('.rx-close'),'×');setText(overlay.querySelector('h2'),tr('title'));
  setText(overlay.querySelector('.camp-workshop-intro'),tr('intro'));
  setText(overlay.querySelector('.camp-workshop-wallet span'),tr('gold'));
  setText(overlay.querySelector('.camp-workshop-wallet strong'),format(s.gold)+' G');
  const stocks=overlay.querySelector('.camp-stock-wallet');if(stocks){const key=language()+':'+Math.floor(s.factory.inventory.wood)+':'+Math.floor(s.factory.inventory.stone)+':'+Math.floor(s.factory.inventory.food||0)+':'+Math.floor(s.factory.inventory.iron||0);if(stocks.dataset.value!==key){stocks.dataset.value=key;stocks.innerHTML=['wood','stone',...(Object.hasOwn(s.factory.inventory,'food')?['food']:[]),...(Object.hasOwn(s.factory.inventory,'iron')?['iron']:[])].map(type=>'<span>'+((window.SupplyFactory?.icon(type))||tr(type))+'<b>'+format(Math.floor(s.factory.inventory[type]))+'</b></span>').join('');}}
  setText(overlay.querySelector('.camp-workshop-note'),tr('available'));
  for(const button of overlay.querySelectorAll('[data-camp-tab]')){setText(button,tr(button.dataset.campTab));button.setAttribute('aria-pressed',String(activeTab===button.dataset.campTab));}overlay.querySelector('.camp-rail-options').hidden=activeTab!=='rails';overlay.querySelector('.camp-projects').hidden=activeTab!=='growth';overlay.querySelector('.camp-rail-options').style.display=activeTab==='rails'?'grid':'none';overlay.querySelector('.camp-projects').style.display=activeTab==='growth'?'grid':'none';syncProjects(s);
  for(const type of ['wood','stone']){
   const card=overlay.querySelector('[data-camp-option="'+type+'"]');card.hidden=type==='stone';card.style.display=type==='stone'?'none':'';if(type==='stone')continue;
   setText(card.querySelector('h3'),tr('rail'));setText(card.querySelector('.camp-rail-count'),String(s.camp.links.length));
   setText(card.querySelector('.camp-route-origin'),tr('wood')+' / '+tr('stone'));setText(card.querySelector('.camp-route-home'),tr('warehouse'));
   setText(card.querySelector('.camp-rail-rate'),tr('intro'));setText(card.querySelector('.camp-rail-workers'),tr('beltHint'));
   const button=card.querySelector('[data-camp-build]');setText(button.querySelector('span'),tr('beltBuild'));setText(button.querySelector('strong'),language()==='ja'?'木材1〜':language()==='zh'?'木材1起':'Wood: 1+');button.disabled=s.factory.inventory.wood<1||!conveyorUnlocked(s);
   setText(card.querySelector('.camp-rail-afford'),!conveyorUnlocked(s)?tr('beltLocked'):s.factory.inventory.wood<1?tr('beltWood'):'');
   let routes=card.querySelector('.camp-existing-routes');if(!routes){routes=document.createElement('div');routes.className='camp-existing-routes';card.append(routes);}routes.replaceChildren(...s.camp.links.map(l=>{const b=document.createElement('button');b.type='button';b.dataset.campRemove=l.nodeKey;b.textContent=pieceName({kind:'belt',key:l.nodeKey})+' · '+local(['建設 木材'+(l.costWood||0),'built for '+(l.costWood||0)+' wood','建造 木材'+(l.costWood||0)])+' · '+removeLabel({kind:'belt',link:l},true);return b;}),...s.camp.platforms.flatMap(p=>{const turn=document.createElement('button'),remove=document.createElement('button');turn.type=remove.type='button';turn.dataset.platformTurn=p.key;remove.dataset.platformRemove=p.key;turn.textContent=pieceName({kind:'platform',key:p.key})+' · '+tr('turn');remove.textContent=pieceName({kind:'platform',key:p.key})+' · '+removeLabel({kind:'platform',platform:p},true);return[turn,remove];}),...[['blower',s.camp.blowers],['fence',s.camp.fences],['hopper',s.camp.hoppers]].flatMap(([kind,list])=>list.flatMap(item=>{const out=[];if(kind==='blower'||kind==='hopper'){const turn=document.createElement('button');turn.type='button';turn.dataset.deviceTurn=kind==='hopper'?'hopper:'+item.key:item.key;turn.textContent=pieceName({kind,key:item.key})+' · '+tr('turn');out.push(turn);}const remove=document.createElement('button');remove.type='button';remove.dataset.deviceRemove=kind+':'+item.key;remove.textContent=pieceName({kind,key:item.key})+' · '+removeLabel({kind,[kind]:item},true);out.push(remove);return out;})));
  }
 }

 function syncDOM(){
  const s=state();if(!s)return;makeDOM();
  if(warehouse){
   const lang=language();if(lang!==languageKey){
    languageKey=lang;warehouse.setAttribute('aria-label',tr('warehouse'));
    setText(warehouse.querySelector('.camp-house-label b'),tr('warehouse'));
    setText(warehouse.querySelector('.camp-house-label span'),tr('workshop')+' ›');
    setText(warehouse.querySelector('.camp-gold span'),tr('gold'));
    for(const type of ['wood','stone','food','iron'])document.getElementById('gather'+({wood:'Wood',stone:'Stone',food:'Food',iron:'Iron'}[type]))?.setAttribute('data-camp-label',tr(type));
   }
   const cap=window.HarvestSkillCore?.effects(S.harvestSkills)?.groundCapacity||12,used=s.factory.drops.length,full=used>=cap,meter=warehouse.querySelector('#groundStorageStatus');
   setText(meter,(language()==='ja'?'地面の資材：':language()==='zh'?'地面材料：':'Ground items: ')+used+' / '+cap+(full?local([' 満杯：倉庫へ運ぶ',' FULL: deliver to storage',' 已满：搬进仓库']):''));if(meter){meter.classList.toggle('is-full',full);meter.style?.setProperty?.('--ground-fill',Math.min(100,used/cap*100)+'%');meter.dataset.used=String(used);meter.dataset.limit=String(cap);meter.setAttribute('role','status');}document.body.classList.toggle('ground-full',full);setText(goldLabel,format(s.gold)+' G');if(beltButton)setText(beltButton,tr('beltBuild'));if(platformButton)setText(platformButton,tr('platformBuild'));
   const hasCargo=s.camp.cargo.length>0||s.factory.drops.some(d=>!heldDrop(d)&&ConveyorCore.contact(s.camp.links,d));
   setText(deliveryLabel,statusUntil>visualTime?tr(statusKey):tr(hasCargo?'inTransit':'tapHome'));
  }
  if(overlay?.classList.contains('on'))syncWorkshop(s);if(railDraft)syncRailPanel();syncPick();
 }

 function cleared(s=state()){return Math.max(0,s?.outpost?.cleared||0,s?.clearedBossWave||0);}
 // Chapter 1 (Wave 3 cleared) unlocks belts/platforms. Belts kept from older saves work regardless.
 function conveyorUnlocked(s=state()){return window.ProgressionCore?ProgressionCore.hasRecipe(s,'belt'):cleared(s)>=3;}
 function quote(id){
  const s=state();if(!s)return null;if(window.ProgressionCore){const level=id==='woodTool'?s.camp.tools.wood:id==='stoneTool'?s.camp.tools.stone:0,project='project_'+id+((id==='woodTool'||id==='stoneTool')?Math.min(2,level+1):''),q=ProgressionCore.quote(s,project);if(!q)return null;return {...q,id,projectId:project,level,tier:Math.min(2,level+1),done:q.built,title:q.title[language()]||q.title.ja,effect:q.description[language()]||q.description.ja,affordable:!Object.values(q.missing).some(Boolean),unlock:0};}const c=s.camp;let cost={wood:0,stone:0,gold:0},unlock=3,level=0,done=false,effect='';
  if(id==='woodTool'||id==='stoneTool'){
   const type=id==='woodTool'?'wood':'stone';level=c.tools[type];done=level>=2;unlock=level>=1?6:3;
   cost=type==='wood'?(level?{wood:100,stone:60,gold:0}:{wood:45,stone:20,gold:0}):(level?{wood:70,stone:100,gold:0}:{wood:30,stone:35,gold:0});
   effect=language()==='ja'?(type==='wood'?'木材':'石材')+' 1個 / '+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'秒':language()==='zh'?'每'+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'秒采集1份':'1 / '+(type==='wood'?[5,2.5,1.5]:[6,3,2])[Math.min(2,level+1)]+'s per worker';
  }else if(id==='cart'){cost={wood:0,stone:0,gold:55};done=c.cart;effect=tr('cartEffect');}
  else if(id==='gate'){cost={wood:100,stone:60,gold:0};unlock=6;done=c.gate;effect=tr('gateEffect');}
  else if(id==='beacon'){cost={wood:220,stone:160,gold:0};unlock=8;done=c.beacon;effect=language()==='en'?'Archer range 90 → 110. An optional upgrade for the final raid.':language()==='zh'?'弓箭手射程90 → 110。最终袭击前的可选强化。':tr('beaconEffect');}
  else return null;
  const locked=cleared(s)<unlock,inventory=s.factory.inventory;
  const affordable=s.gold>=cost.gold&&inventory.wood>=cost.wood&&inventory.stone>=cost.stone;
  return {id,cost,unlock,level,tier:Math.min(2,level+1),done,built:done,locked,affordable,ready:!done&&!locked&&affordable,title:tr(id),effect};
 }
 function canBuild(id){return quote(id)?.ready===true;}
 function canStartWave(wave){const s=state();if(!s)return false;const c=s.camp;return (wave<4||c.tools.wood+c.tools.stone>0)&&(wave<7||c.gate)&&(wave<9||c.beacon);}
 function nextProject(){
  const s=state();if(!s)return null;const c=s.camp,n=cleared(s);
  if(n>=8&&!c.beacon)return quote('beacon');if(n>=6&&!c.gate)return quote('gate');
  if(n>=3&&!c.tools.wood&&!c.tools.stone)return {...quote('woodTool'),alternatives:['woodTool','stoneTool']};
  if(n>=6&&(c.tools.wood<2||c.tools.stone<2))return quote(c.tools.wood<2?'woodTool':'stoneTool');
  if(n>=3&&(c.tools.wood<1||c.tools.stone<1))return quote(c.tools.wood<1?'woodTool':'stoneTool');
  if(n>=3&&!c.cart)return quote('cart');return null;
 }
 function projectIcon(id){
  const paths={woodTool:'<path d="M9 28L22 5" stroke="#805b36" stroke-width="4"/><path d="M21 4L29 9L24 17L17 12Z" fill="#b8c7b4"/>',stoneTool:'<path d="M9 28L21 6" stroke="#805b36" stroke-width="4"/><path d="M10 11Q22 2 29 15" fill="none" stroke="#b8c7b4" stroke-width="5"/>',cart:'<path d="M5 12H29V26H5Z" fill="#71856d" stroke="#d6c58b"/><circle cx="17" cy="18" r="7" fill="#384c3d" stroke="#dfd497"/><path d="M17 8V28M7 18H27" stroke="#dfd497" stroke-width="3"/>',gate:'<path d="M5 29V9H10V29M22 29V9H27V29M5 10V5H27V10M10 16H22" fill="#89643b" stroke="#d4b272" stroke-width="2"/><path d="M14 15L17 20L20 15" fill="#779665"/>',beacon:'<path d="M11 29L13 15H21L23 29Z" fill="#9a9d7e"/><path d="M12 15V8H22V15Z" fill="#e3c773" stroke="#d5dfa0"/><path d="M10 8L17 3L24 8Z" fill="#886840"/><path d="M3 11H8M26 11H31M8 2L11 5M26 2L23 5" stroke="#eed38a" stroke-width="2"/>'};
  return '<svg viewBox="0 0 34 34" width="42" height="42" aria-hidden="true">'+paths[id]+'</svg>';
 }
 function priceHTML(cost){return ['wood','stone'].filter(type=>cost[type]).map(type=>'<span class="camp-material-price">'+(window.SupplyFactory?.icon(type)||tr(type))+' <b>'+format(cost[type])+'</b></span>').join('')+(cost.gold?'<span class="camp-gold-price">'+format(cost.gold)+' G</span>':'');}
 function syncProjects(s){
  const container=overlay.querySelector('.camp-projects');if(!container)return;
  const signature=JSON.stringify([language(),cleared(s),s.camp.tools,s.camp.cart,s.camp.gate,s.camp.beacon,Math.floor(s.gold),Math.floor(s.factory.inventory.wood),Math.floor(s.factory.inventory.stone)]);
  if(container.dataset.signature===signature)return;container.dataset.signature=signature;
  const focused=document.activeElement?.dataset?.campProject;container.innerHTML=['woodTool','stoneTool','cart','gate','beacon'].map(id=>{const q=quote(id);const missing=['wood','stone','gold'].filter(t=>(t==='gold'?s.gold:s.factory.inventory[t])<q.cost[t]).map(t=>((t==='gold'?'G':window.SupplyFactory?.icon(t)||tr(t))+' '+Math.ceil(q.cost[t]-(t==='gold'?s.gold:s.factory.inventory[t])))).join(' · ');const status=q.done?tr('made'):q.locked?tr('locked')+' '+q.unlock:!q.affordable?tr('needed')+' '+missing:tr('make');return '<button type="button" data-camp-project="'+id+'" class="camp-project'+(q.done?' is-built':'')+'" '+(!q.ready?'disabled':'')+'><span class="camp-project-icon">'+projectIcon(id)+'</span><b>'+q.title+(id.endsWith('Tool')?' · '+(language()==='ja'?'いま ':language()==='zh'?'当前 ':'Now ')+q.level+' / 2':'')+'</b><span class="camp-project-effect">'+(!q.done?(language()==="ja"?"つぎ：":language()==="zh"?"下级：":"Next: "):"")+q.effect+'</span><span class="camp-project-price">'+(q.done?'✓':priceHTML(q.cost))+'</span><small>'+status+'</small></button>';}).join('');
  if(focused){const same=container.querySelector('[data-camp-project="'+focused+'"]'),next=same&&!same.disabled?same:container.querySelector('button:not(:disabled)')||overlay.querySelector('.camp-workshop');next?.focus?.({preventScroll:true});}
 }
 function build(id){
  if(window.ProgressionCore){const q=quote(id);if(!q)return false;const ok=ProgressionCore.purchase(state(),q.projectId);if(ok)window.ProgressionIntegration?.refresh?.();return ok;}
  const s=state(),q=quote(id);if(!s||!q?.ready)return false;
  s.gold-=q.cost.gold;s.factory.inventory.wood-=q.cost.wood;s.factory.inventory.stone-=q.cost.stone;
  if(id==='woodTool'||id==='stoneTool')s.camp.tools[id==='woodTool'?'wood':'stone']++;
  else s.camp[id]=true;
  workshopMessage='projectDone';setText(workshopStatus,tr(workshopMessage));audio('build');
  if(typeof renderUnits==='function')renderUnits();if(typeof renderCards==='function')renderCards();if(typeof updateHud==='function')updateHud();
  window.Outpost?.update();window.Rework?.track?.('camp_build',{project:id,level:q.tier});persist();syncDOM();syncWorkshop(s);return true;
 }
 function drawProjects(ctx,s){
  // Permanent additions stay still, so the camp's growth is visible without camera motion.
  for(const type of ['wood','stone'])if(s.camp.tools[type]){
   const n=s.factory.nodes.find(n=>n.type===type);if(!n)continue;const x=n.x+38,y=n.y+7;
   ctx.fillStyle='#3b3927';ctx.fillRect(x-18,y-19,36,20);ctx.fillStyle=type==='wood'?'#a07c45':'#95987a';ctx.fillRect(x-15,y-17,30,14);
   ctx.fillStyle='#d5be83';ctx.fillRect(x-20,y-21,40,4);ctx.fillStyle='#55452e';ctx.fillRect(x-14,y-1,4,12);ctx.fillRect(x+10,y-1,4,12);
   ctx.fillStyle=s.camp.tools[type]>1?'#f0d47f':'#a9bf90';ctx.fillRect(x-5,y-15,10,9);
  }
  if(s.camp.gate){const x=180,y=330;ctx.fillStyle='#473c28';ctx.fillRect(x-27,y-40,9,46);ctx.fillRect(x+18,y-40,9,46);ctx.fillStyle='#a78750';ctx.fillRect(x-30,y-43,60,10);ctx.fillStyle='#d9c18c';ctx.fillRect(x-28,y-43,56,3);ctx.fillStyle='#6f8d61';ctx.beginPath();ctx.moveTo(x-9,y-30);ctx.lineTo(x+9,y-30);ctx.lineTo(x+9,y-13);ctx.lineTo(x,y-6);ctx.lineTo(x-9,y-13);ctx.closePath();ctx.fill();}
  if(s.camp.beacon){const x=82,y=248;ctx.fillStyle='#4d5140';ctx.fillRect(x-15,y-34,30,37);ctx.fillStyle='#929779';ctx.fillRect(x-11,y-34,22,34);ctx.fillStyle='#dbca85';ctx.fillRect(x-13,y-48,26,17);ctx.fillStyle='#f4e5a7';ctx.fillRect(x-8,y-45,16,10);ctx.fillStyle='#705739';ctx.beginPath();ctx.moveTo(x-18,y-48);ctx.lineTo(x,y-61);ctx.lineTo(x+18,y-48);ctx.closePath();ctx.fill();ctx.strokeStyle='#dfd08b88';ctx.lineWidth=2;for(const dx of [-1,1]){ctx.beginPath();ctx.moveTo(x+dx*20,y-40);ctx.lineTo(x+dx*34,y-40);ctx.stroke();}}
 }

 function buildRail(){
  if(!conveyorUnlocked()){statusKey='beltLocked';statusUntil=visualTime+3;syncDOM();return false;}return openDraft();
 }
 function openDraft(){
  clearSelection();window.FieldUI?.equip(false);window.OreUI?.equip(false);cancelBeltGesture();platformMode=false;platformPreview=null;deviceMode=null;devicePreview=null;placementChoice=null;syncPlacementCard();const s=state();if(!s)return false;endDrag(null,true);window.SupplyFactory?.stopHold?.();window.BattleControl?.setPlacement(false);window.Rework?.close();
  railDraft={points:[],owner:s};railHover=null;railError='';document.getElementById('field').classList.add('laying-rails');syncRailPanel();return true;
 }
 function cancelBeltGesture(){clearTimeout(longPress);pickPress=null;placementPress=null;finishWind(true);const pointer=beltPointer;beltPointer=null;const field=document.getElementById('field');try{if(pointer!==null&&field?.hasPointerCapture?.(pointer))field.releasePointerCapture(pointer);}catch(_){}if(railDraft){railDraft.points=[];railDraft.link=null;railDraft.oldCost=0;}platformPreview=null;if(deviceMode==='fence')devicePreview=null;}
 function stopRails(){cancelBeltGesture();placementChoice=null;syncPlacementCard();deviceMode=null;devicePreview=null;platformMode=false;platformPreview=null;railDraft=null;railHover=null;railError='';beltPointer=null;document.getElementById('field')?.classList.remove('laying-rails');if(railPanel)railPanel.hidden=true;window.PlacementControls?.sync?.();}
 function beltPrice(d=railDraft){return d&&d.points.length>1?Math.max(1,ConveyorCore.cost(d.points)-(d.oldCost||0)):0;}
 function syncRailPanel(){
  syncPlacementCard();window.PlacementControls?.sync?.();
  if(!railPanel){railPanel=document.createElement('section');railPanel.id='railEditor';railPanel.innerHTML='<b role="status"></b><strong class="rail-price"></strong><div><button type="button" data-rail-action="rotate"></button><button type="button" data-rail-action="undo"></button><button type="button" data-rail-action="cancel"></button></div>';const context=document.getElementById('placementControls');if(context)context.append(railPanel);else document.getElementById('deckMain').prepend(railPanel);railPanel.onclick=e=>{const action=e.target.closest('[data-rail-action]')?.dataset.railAction;if(action==='cancel')stopRails();if(action==='undo')undoBelt();if(action==='rotate'){if(deviceMode==='blower')blowerDir=(blowerDir+1)%8;else if(deviceMode==='hopper')hopperDir=(hopperDir+1)%8;else platformDir=(platformDir+1)%4;syncRailPanel();}};}
  railPanel.hidden=!railDraft;if(!railDraft)return;railPanel.querySelector('[data-rail-action="rotate"]').hidden=!platformMode&&deviceMode!=='blower'&&deviceMode!=='hopper';if(deviceMode){syncDevicePanel();return;}setText(railPanel.querySelector('[data-rail-action="rotate"]'),tr('rotate'));if(platformMode){setText(railPanel.querySelector('b'),railError?tr(railError==='area'?'platformBlocked':'beltWood'):tr('platformHint'));setText(railPanel.querySelector('.rail-price'),tr('platformCost'));setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));return;}const price=beltPrice();
  const missing=Math.max(0,price-state().factory.inventory.wood);setText(railPanel.querySelector('b'),beltPointer!==null&&price>0&&missing>0?(language()==='ja'?'木材があと'+Math.ceil(missing)+'個必要です。短くしてください。':language()==='zh'?'还缺'+Math.ceil(missing)+'木材，请缩短。':'Need '+Math.ceil(missing)+' more wood. Draw a shorter belt.'):railError?tr('beltWood'):state().factory.inventory.wood<1?tr('beltCollect'):beltPointer!==null&&railDraft.capped?tr('beltMax'):beltPointer!==null?tr('beltRelease')+price:tr('beltHint'));
  setText(railPanel.querySelector('.rail-price'),(language()==='ja'?'木材 ':language()==='zh'?'木材 ':'Wood ')+Math.max(0,Math.floor(state().factory.inventory.wood))+(beltPointer!==null&&railDraft.points.length>1?' · '+tr('beltLength')+Math.round(ConveyorCore.length(railDraft.points))+' / '+ConveyorCore.MAX_LENGTH:''));
  setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));railPanel.querySelector('[data-rail-action="undo"]').disabled=!beltHistory.length;
 }
 function syncDevicePanel(){if(deviceMode==='loader'){setText(railPanel.querySelector('b'),tr(railError||'loaderHint'));setText(railPanel.querySelector('.rail-price'),local(['木材12・石材6','12 wood · 6 stone','12木材 · 6石材']));setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));railPanel.querySelector('[data-rail-action="rotate"]').hidden=true;railPanel.querySelector('[data-rail-action="undo"]').disabled=!beltHistory.length;return;}
  const wood=state().factory.inventory.wood,stone=state().factory.inventory.stone,arrows='→↘↓↙←↖↑↗';setText(railPanel.querySelector('[data-rail-action="rotate"]'),tr('rotate')+' '+arrows[deviceMode==='hopper'?hopperDir:blowerDir]);
  let hint=tr(deviceMode==='loader'?'loaderHint':deviceMode==='blower'?'blowerHint':deviceMode==='hopper'?'hopperHint':'fenceHint');
  if(railError)hint=tr(railError);else if(deviceMode==='fence'&&beltPointer!==null&&devicePreview){const f=GroundPhysics.clampFence(devicePreview.a,devicePreview.b);hint=GroundPhysics.fenceLength({a:devicePreview.a,b:devicePreview.b})<GroundPhysics.FENCE_MIN?tr('fenceShort'):tr('fenceRelease')+GroundPhysics.fenceCost(f);}
  setText(railPanel.querySelector('b'),hint);setText(railPanel.querySelector('.rail-price'),deviceMode==='hopper'?tr('hopperCost')+' · '+(language()==='en'?'have ':language()==='zh'?'持有 ':'所持 ')+Math.floor(wood)+' / '+Math.floor(stone):deviceMode==='blower'?tr('blowerCost')+' · '+(language()==='en'?'have ':language()==='zh'?'持有 ':'所持 ')+Math.floor(wood):(language()==='ja'?'木材 ':language()==='zh'?'木材 ':'Wood ')+Math.floor(wood));
  setText(railPanel.querySelector('[data-rail-action="undo"]'),tr('undo'));setText(railPanel.querySelector('[data-rail-action="cancel"]'),tr('cancelRail'));railPanel.querySelector('[data-rail-action="undo"]').disabled=!beltHistory.length;
 }
 // ---- M3 ground tools: blower and guide fence ----
 const BLOWER_COST=4,MAX_BLOWERS=40,MAX_FENCES=80,fenceKey=list=>Math.max(0,...list.map(p=>Number(p.key)||0))+1;
 function buildDevice(kind){if(window.ProgressionCore&&!ProgressionCore.hasRecipe(state(),kind)){window.HarvestSkills?.open('recipe_'+kind);return false;}if(kind==='hopper'&&!conveyorUnlocked()){statusKey='hopperLocked';statusUntil=visualTime+3;syncDOM();return false;}if(!['blower','fence','hopper','loader'].includes(kind)||!openDraft())return false;deviceMode=kind;devicePreview=null;railError='';syncRailPanel();return true;}
 // The same physical ground point is used by preview, collision and final placement.
 // A fan must not be put through somebody's feet or through an existing hopper/house.
 function deviceGroundClear(p,r){
  const s=state(),nearRect=b=>Math.hypot(p.x-clamp(p.x,b.left,b.right),p.y-clamp(p.y,b.top,b.bottom))<r;
  return !s.camp.loaders.some(l=>Math.hypot(p.x-l.x,p.y-l.y)<r+16)&&!houseContains(p)&&!GroundPhysics.HOUSE.some(nearRect)&&!(window.ArmyView?.sim?.soldiers||[]).some(q=>Math.hypot(p.x-q.x,p.y-q.y)<r+(q.r||10)+2)&&!s.camp.hoppers.some(h=>Math.hypot(p.x-h.x,p.y-h.y)<r+GroundPhysics.PARAMS.hopperBody+2);
 }
 function blowerFits(p){const s=state();return Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=24&&p.x<=WORLD.width-24&&p.y>=110&&p.y<=WORLD.height-15&&deviceGroundClear(p,GroundPhysics.PARAMS.blowerBody)&&!s.factory.nodes.some(n=>Math.hypot(p.x-n.x,p.y-n.y)<(n.radius||16)+GroundPhysics.PARAMS.blowerBody+2)&&!s.camp.blowers.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<GroundPhysics.PARAMS.blowerBody*2+2);}
 function placeBlower(point){if(Rework.paused||deviceMode!=='blower')return false;const s=state(),p={x:clamp(point.x,24,WORLD.width-24),y:clamp(point.y,110,WORLD.height-15)};if(s.camp.blowers.length>=MAX_BLOWERS){railError='blowerLimit';syncRailPanel();return false;}if(s.factory.inventory.wood<BLOWER_COST){railError='toolWood';syncRailPanel();return false;}if(!blowerFits(p)){railError='blowerBlocked';syncRailPanel();return false;}
  const key=fenceKey(s.camp.blowers);s.factory.inventory.wood-=BLOWER_COST;const blower={key,x:Math.round(p.x),y:Math.round(p.y),dir:blowerDir,costWood:BLOWER_COST};s.camp.blowers.push(blower);startTally(blower);beltHistory.push({blower:key,price:BLOWER_COST});railError='';statusKey='blowerPlaced';statusUntil=visualTime+5;audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();select({kind:'blower',key,x:blower.x,y:blower.y});return true;}
 // ---- M4 hopper ----
 const HOPPER_COST={wood:10,stone:4},MAX_HOPPERS=20;
 function hopperFits(p){const s=state();return !s.camp.loaders.some(l=>Math.hypot(p.x-l.x,p.y-l.y)<34)&&p.x>=24&&p.x<=WORLD.width-24&&p.y>=110&&p.y<=WORLD.height-15&&Math.hypot(p.x-HOME.x,p.y-HOME.y)>=70&&!s.factory.nodes.some(n=>Math.hypot(p.x-n.x,p.y-n.y)<(n.radius||16)+20||nodeTapArea(n,p,12))&&!s.camp.blowers.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<32)&&!s.camp.hoppers.some(h=>Math.hypot(p.x-h.x,p.y-h.y)<36);}
 function placeHopper(point){if(Rework.paused||deviceMode!=='hopper')return false;const s=state(),p={x:clamp(point.x,24,WORLD.width-24),y:clamp(point.y,110,WORLD.height-15)};if(!conveyorUnlocked()){railError='hopperLocked';syncRailPanel();return false;}if(s.camp.hoppers.length>=MAX_HOPPERS){railError='hopperLimit';syncRailPanel();return false;}if(s.factory.inventory.wood<HOPPER_COST.wood||s.factory.inventory.stone<HOPPER_COST.stone){railError='hopperMaterials';syncRailPanel();return false;}if(!hopperFits(p)){railError='hopperBlocked';syncRailPanel();return false;}
  const key=fenceKey(s.camp.hoppers);s.factory.inventory.wood-=HOPPER_COST.wood;s.factory.inventory.stone-=HOPPER_COST.stone;s.camp.hoppers.push({key,x:Math.round(p.x),y:Math.round(p.y),dir:hopperDir,costWood:HOPPER_COST.wood,costStone:HOPPER_COST.stone});beltHistory.push({hopper:key,price:HOPPER_COST.wood,stone:HOPPER_COST.stone});railError='';statusKey='hopperPlaced';statusUntil=visualTime+5;audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();return true;}
 function loaderFits(p){const s=state();return Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=24&&p.x<=WORLD.width-24&&p.y>=110&&p.y<=WORLD.height-15&&deviceGroundClear(p,14)&&!s.factory.nodes.some(n=>Math.hypot(p.x-n.x,p.y-n.y)<(n.radius||16)+16)&&!s.camp.blowers.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<30);}
 function loaderAt(p,z=ArmyView.camera.scale){for(const l of state()?.camp.loaders||[])if(Math.hypot(p.x-l.x,p.y-l.y)<=Math.max(18,22/z))return {kind:'loader',key:l.key,x:l.x,y:l.y};return null;}
 function placeLoader(point){if(Rework.paused||deviceMode!=='loader')return false;const s=state(),p={x:clamp(point.x,24,WORLD.width-24),y:clamp(point.y,110,WORLD.height-15)};if(s.camp.loaders.length>=20){railError='loaderLimit';syncRailPanel();return false;}if(s.factory.inventory.wood<12||s.factory.inventory.stone<6){railError='loaderMaterials';syncRailPanel();return false;}if(!loaderFits(p)){railError='loaderBlocked';syncRailPanel();return false;}const key=fenceKey(s.camp.loaders);s.factory.inventory.wood-=12;s.factory.inventory.stone-=6;s.camp.loaders.push({key,x:Math.round(p.x),y:Math.round(p.y),costWood:12,costStone:6});beltHistory.push({loader:key,price:12,stone:6});railError='';statusKey='loaderPlaced';statusUntil=visualTime+4;audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();return true;}
 function hopperAt(point,z=ArmyView.camera.scale){const s=state();if(!s)return null;for(let i=s.camp.hoppers.length-1;i>=0;i--){const h=s.camp.hoppers[i];if(Math.hypot(point.x-h.x,point.y-h.y)<=Math.max(18,22/z))return {kind:'hopper',key:h.key,x:h.x,y:h.y};}return null;}
 function fenceFits(f){const inField=p=>p.x>=14&&p.x<=WORLD.width-14&&p.y>=100&&p.y<=WORLD.height-12,mid={x:(f.a.x+f.b.x)/2,y:(f.a.y+f.b.y)/2};return inField(f.a)&&inField(f.b)&&!houseContains(mid);}
 function placeFence(draft){if(Rework.paused||deviceMode!=='fence'||!draft)return false;const s=state();if(GroundPhysics.fenceLength(draft)<GroundPhysics.FENCE_MIN){railError='fenceShort';syncRailPanel();return false;}const f=fenceShape(draft),price=GroundPhysics.fenceCost(f);
  if(s.camp.fences.length>=MAX_FENCES){railError='fenceLimit';syncRailPanel();return false;}if(s.factory.inventory.wood<price){railError='toolWood';syncRailPanel();return false;}if(!fenceFits(f)){railError='fenceBlocked';syncRailPanel();return false;}
  const key=fenceKey(s.camp.fences);s.factory.inventory.wood-=price;s.camp.fences.push({key,a:f.a,b:f.b,costWood:price});beltHistory.push({fence:key,price});railError='';statusKey='fencePlaced';statusUntil=visualTime+5;audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();return true;}
 // The preview uses exactly the shape that placing stores (same clamp and rounding), so "n / 8" is what you get.
 const fenceShape=d=>{const f=GroundPhysics.clampFence(d.a,d.b),r=v=>Math.round(v*10)/10;return {a:{x:r(f.a.x),y:r(f.a.y)},b:{x:r(f.b.x),y:r(f.b.y)}};};
 function draftDevice(){if(!railDraft||!deviceMode||!devicePreview||deviceMode==='loader')return null;if(deviceMode==='blower')return {kind:'blower',x:Math.round(devicePreview.x),y:Math.round(devicePreview.y),dir:blowerDir};if(deviceMode==='hopper')return {kind:'hopper',key:'draft',x:Math.round(devicePreview.x),y:Math.round(devicePreview.y),dir:hopperDir};if(GroundPhysics.fenceLength(devicePreview)<GroundPhysics.FENCE_MIN)return null;return {kind:'fence',...fenceShape(devicePreview)};}
 // After placing: the share it promised for the lumberjacks' landing spots, then the real count (about a minute).
 function startTally(blower){const sf=window.SupplyFactory;if(!sf?.startTally)return;let home=0,total=0;for(const p of (window.ArmyView?.sim?.soldiers||[]).filter(p=>p.id==='woodcutter')){const n=sf.nearby(p,'wood');if(!n)continue;home+=sf.groundShare(sf.outputForWorker(p,n));total+=8;}sf.startTally(blower,home,total);}
 // Tap on the blower body: strong wind (3 s, +1 s per press while active, never more than 5 s ahead).
 // Each press: gust sound; the pitch climbs only when the press really added time; at the 5 s limit one
 // "full" note, then the pitch holds. Nothing in the fan: a grey puff and a low miss sound.
 function boostBlower(key){const s=state(),b=s?.camp.blowers.find(b=>keyEqual(b.key,key));if(!b||!window.GroundPhysics)return false;const now=s.factory.time||0,P=GroundPhysics.PARAMS,active=GroundPhysics.boostFactor(b,now)>1,before=active?b.boostUntil-now:0;
  b.boostUntil=GroundPhysics.tapBlower(b,now);const after=b.boostUntil-now,full=after>=P.boostMax-1e-6;if(!active){b.gustStep=0;b.full=false;}else if(after>before+.5)b.gustStep=(b.gustStep||0)+1;
  const world=GroundPhysics.normalizeWorld({nodes:[],house:null,porch:null,blowers:[{x:b.x,y:b.y,dir:b.dir}]}),inFan=s.factory.drops.filter(d=>!heldDrop(d)&&!d.onConveyor&&!window.SupplyFactory?.isAirborne?.(d)&&(GroundPhysics.accelAt(world,d,0).x||GroundPhysics.accelAt(world,d,0).y));
  const rate=Math.pow(2,2*Math.min(3,b.gustStep||0)/12);
  const reachedFull=full&&!b.full;if(reachedFull){b.full=true;b.flashAt=visualTime;}
  if(!inFan.length){window.ForestAudio?.play('gustMiss');fx.push({kind:'puff',x:b.x,y:b.y,dir:b.dir,t0:visualTime,dur:.5});}
  else window.ForestAudio?.play(reachedFull?'gustFull':'gust',{rate});
  const d=GroundPhysics.DIRS[b.dir];for(const item of inFan)fx.push({kind:'streak',drop:item,dx:d.x,dy:d.y,t0:visualTime,dur:.3});
  if(!active){statusKey='gust';statusUntil=visualTime+1.2;}syncDOM();return true;}
 function blowerAt(point,z=ArmyView.camera.scale){const s=state();if(!s)return null;for(let i=s.camp.blowers.length-1;i>=0;i--){const b=s.camp.blowers[i];if(Math.hypot(point.x-b.x,point.y-b.y)<=Math.max(18,22/z))return {kind:'blower',key:b.key,x:b.x,y:b.y};}return null;}
 function hitDevice(point,z=ArmyView.camera.scale){const s=state();const loader=loaderAt(point,z);if(loader)return loader;const blower=blowerAt(point,z);if(blower)return blower;
  let best=null;for(const f of s.camp.fences){const q=GroundPhysics.closestOnSegment(f.a,f.b,point),d=Math.hypot(point.x-q.x,point.y-q.y);if(d<=Math.max(10,14/z)&&(!best||d<best.d))best={kind:'fence',key:f.key,x:q.x,y:q.y,d};}return best;}
 function commitRails(){
  const s=state(),d=railDraft;if(Rework.paused||!d||d.owner!==s||d.points.length<2)return false;if(d.link&&!s.camp.links.includes(d.link)){cancelBeltGesture();return false;}if(ConveyorCore.length(d.points)-(d.startLength||0)<10)return false;const price=beltPrice(d);if(s.factory.inventory.wood<price){railError='wood';syncRailPanel();return false;}
  const old=d.link?{...d.link,points:d.link.points.map(p=>({...p}))}:null;s.factory.inventory.wood-=price;
  if(d.link){d.link.points=d.points.map(p=>({...p}));d.link.costWood=(d.link.costWood||d.oldCost||0)+price;d.link.kind='conveyor';}
  else{const nodeKey=Math.max(0,...s.camp.links.map(l=>Number(l.nodeKey)||0))+1;s.camp.links.push({nodeKey,type:'wood',kind:'conveyor',points:d.points.map(p=>({...p})),costWood:price});}
  beltHistory.push({nodeKey:d.link?.nodeKey||s.camp.links.at(-1).nodeKey,old,price});if(!s.camp.removeLearned&&!removeHintShown){removeHintShown=true;removeHint={key:beltHistory.at(-1).nodeKey,until:visualTime+10};}
  const capped=d.capped===true;continuation=capped?{key:beltHistory.at(-1).nodeKey,point:{...d.points.at(-1)},until:visualTime+12}:null;
  railDraft={points:[],owner:s};railError='';statusKey=capped?'beltMax':'beltPlaced';statusUntil=visualTime+4;if(capped)window.Rework?.toast?.(tr('beltLimit'),tr('beltContinue'));audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();return true;
 }
 function undoBelt(){if(beltHistory.at(-1)?.loader){const h=beltHistory.pop(),s=state(),i=s.camp.loaders.findIndex(l=>keyEqual(l.key,h.loader));if(i>=0){window.LoaderDevice?.release(h.loader);s.camp.loaders.splice(i,1);s.factory.inventory.wood+=h.price;s.factory.inventory.stone+=h.stone;}persist();window.SupplyFactory?.translate();syncRailPanel();return;}const h=beltHistory.pop(),s=state();if(!h)return;if(h.hopper){const j=s.camp.hoppers.findIndex(p=>keyEqual(p.key,h.hopper));if(j>=0){releaseHopper(s,s.camp.hoppers[j]);s.camp.hoppers.splice(j,1);s.factory.inventory.wood+=h.price||0;s.factory.inventory.stone+=h.stone||0;}persist();window.SupplyFactory?.translate();syncRailPanel();return;}if(h.blower||h.fence){const list=h.blower?s.camp.blowers:s.camp.fences,j=list.findIndex(p=>keyEqual(p.key,h.blower||h.fence));if(j>=0){list.splice(j,1);s.factory.inventory.wood+=h.price||0;}persist();window.SupplyFactory?.translate();syncRailPanel();return;}if(h.platform){const j=s.camp.platforms.findIndex(p=>p.key===h.platform);if(j>=0){s.camp.platforms.splice(j,1);s.factory.inventory.wood+=8;s.factory.inventory.stone+=4;}persist();window.SupplyFactory?.translate();syncRailPanel();return;}const i=s.camp.links.findIndex(l=>keyEqual(l.nodeKey,h.nodeKey));if(i<0)return;if(h.old)s.camp.links[i]=h.old;else s.camp.links.splice(i,1);s.factory.inventory.wood+=h.price;persist();window.SupplyFactory?.translate();syncRailPanel();}
 function removeRail(key){return removePiece('belt',key);}
 // Board selection: the second action (the card button or Delete) removes; no extra confirmation dialog.
 const local=a=>a[Math.max(0,['ja','en','zh'].indexOf(language()))];
 const deviceList=(s,kind)=>kind==='loader'?s.camp.loaders:kind==='blower'?s.camp.blowers:kind==='hopper'?s.camp.hoppers:s.camp.fences;
 // Items being drawn into a removed hopper stay where they are, as ordinary loose items.
 function releaseHopper(s,h){for(const d of s.factory.drops)if(d.hopperKey!=null&&keyEqual(d.hopperKey,h.key)){delete d.hopperKey;d.vx=0;d.vy=0;}}
 function pieceOf(s,p){if(!s||!p)return null;if(p.kind==='blower'||p.kind==='fence'||p.kind==='hopper'||p.kind==='loader'){const item=deviceList(s,p.kind).find(a=>keyEqual(a.key,p.key));return item?{kind:p.kind,key:item.key,[p.kind]:item}:null;}if(p.kind==='platform'){const platform=s.camp.platforms.find(a=>keyEqual(a.key,p.key));return platform?{kind:'platform',key:platform.key,platform}:null;}const link=s.camp.links.find(l=>keyEqual(l.nodeKey,p.key));return link?{kind:'belt',key:link.nodeKey,link}:null;}
 function pieceName(p){return local(p.kind==='loader'?['積み込み機','Loader ','装载机']:p.kind==='platform'?['受け土台','Platform ','接收平台']:p.kind==='hopper'?['集積口','Hopper ','集料斗']:p.kind==='blower'?['送風機','Blower ','鼓风机']:p.kind==='fence'?['誘導柵','Fence ','导流栅栏']:['コンベア','Conveyor ','传送带'])+p.key;}
 function refundOf(piece){if(piece?.kind==='loader')return {wood:6,stone:3};if(piece?.kind==='hopper'){const item=piece.hopper||piece;return {wood:Math.floor((item.costWood??HOPPER_COST.wood)*.5),stone:Math.floor((item.costStone??HOPPER_COST.stone)*.5)};}if(piece?.kind==='blower'||piece?.kind==='fence'){const item=piece[piece.kind]||piece;return {wood:Math.floor((item.costWood||0)*.5),stone:0};}return ConveyorCore.removalRefund(piece);}
 function removeLabel(piece,short=false){const r=refundOf(piece);if(!short&&(piece.kind==='belt'||piece.kind==='platform')&&!conveyorUnlocked())return removeLabel(piece,true)+' · '+tr('relock');if(short)return local(['撤去（','Remove (','拆除（'])+'+'+r.wood+(r.stone?'・+'+r.stone:'')+local(['）',')','）']);return r.stone?local(['撤去（木材 +'+r.wood+'・石材 +'+r.stone+'）','Remove (+'+r.wood+' wood, +'+r.stone+' stone back)','拆除（返还 木材 +'+r.wood+'・石材 +'+r.stone+'）']):local(['撤去（木材 +'+r.wood+' 返却）','Remove (+'+r.wood+' wood back)','拆除（返还 木材 +'+r.wood+'）']);}
 // Blowers are kept out of a tree/rock's drawn tap area (fixed size, the same on every screen). On a zoomed-out phone
 // the tap areas grow; there the blower body still wins inside its own circle (see pickAt / SupplyFactory.pileAt).
 function nodeTapArea(n,point,pad=0){const half=(n.type==='wood'?85:66)/2+pad;return Math.abs(point.x-n.x)<=half&&point.y>=n.y-(n.type==='wood'?100:n.type==='food'?72:54)-5-pad&&point.y<=n.y+9+pad;}
 function pickAt(point){
  const s=state(),z=ArmyView.camera.scale;if(!s||!point||houseContains(point)||window.Outpost?.enemyAt?.(point))return null;
  // The blower body comes before logs, trees and allies inside its circle (44 screen px across at least).
  const loader=loaderAt(point,z);if(loader)return loader;const blower=blowerAt(point,z),hopper=blower?null:hopperAt(point,z),device=blower||hopper;if((!device||Math.hypot(point.x-device.x,point.y-device.y)>18)&&window.SupplyFactory?.pileAt?.(point))return null;if(device)return device;
  // Same footprint as the gather input: tapping a tree or rock always harvests, never selects a belt.
  if(s.factory.nodes.some(n=>{const half=Math.max((n.type==='wood'?85:66)/2,23/z);return Math.abs(point.x-n.x)<=half&&point.y>=n.y-(n.type==='wood'?100:n.type==='food'?72:54)-5&&point.y<=n.y+9;}))return null;
  return hitDevice(point,z)||ConveyorCore.hitLink(s.camp.links,s.camp.platforms,point,Math.max(10,22/z));
 }
 function clearSelection(){clearTimeout(longPress);pickPress=null;finishWind(true);select(null);}
 function select(hit){if(hit&&window.BattleControl?.placement)hit=null;picked=hit?{kind:hit.kind,key:hit.key,anchor:{x:hit.x,y:hit.y}}:null;if(picked){removeHint=null;audio('place');}syncPick();return !!picked;}
 function syncPick(){
  window.PlacementControls?.sync?.();if(!pickCard)return;const s=state(),piece=pieceOf(s,picked);if(picked&&!piece)picked=null;pickCard.hidden=!piece;if(!piece)return;
  setText(pickCard.querySelector('.belt-actions-title'),pieceName(piece));const turn=pickCard.querySelector('[data-pick-action="turn"]');turn.hidden=piece.kind!=='platform'&&piece.kind!=='blower'&&piece.kind!=='hopper';setText(turn,tr('turn'));setText(pickCard.querySelector('[data-pick-action="remove"]'),removeLabel(piece));const aimHint=pickCard.querySelector('.fan-aim-hint');if(aimHint){aimHint.hidden=piece.kind!=='blower';setText(aimHint,local(['本体をドラッグして風向き調整','Drag the body to aim the wind','拖动本体调整风向']));}
 }
 function turnPiece(kind,key){if(kind!=='blower'&&kind!=='hopper')return turnPlatform(key);const b=deviceList(state(),kind).find(b=>keyEqual(b.key,key));if(!b)return false;b.dir=(b.dir+1)%8;audio('place');persist();window.SupplyFactory?.translate();syncWorkshop(state());return true;}
 // Drag the real fan in the direction of the desired wind. Position stays fixed; no repeated rotation clicks.
 function aimWind(e){const g=windGesture,b=g&&state()?.camp.blowers.find(b=>keyEqual(b.key,g.key));if(!b)return;const p=ArmyView.point(e.clientX,e.clientY),dx=p.x-b.x,dy=p.y-b.y;if(Math.hypot(dx,dy)<10)return;b.dir=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;syncPick();}
 function finishWind(cancel=false){const g=windGesture;if(!g)return;windGesture=null;const b=state()?.camp.blowers.find(b=>keyEqual(b.key,g.key));if(b&&cancel){const changed=b.dir!==g.dir;b.dir=g.dir;if(changed)persist();}else if(b&&b.dir!==g.dir){audio('place');persist();}try{document.getElementById('field').releasePointerCapture(g.pointerId);}catch(_){}syncPick();}
 function turnPlatform(key){const p=state()?.camp.platforms.find(p=>keyEqual(p.key,key));if(!p)return false;p.dir=(p.dir+1)%4;audio('place');persist();window.SupplyFactory?.translate();syncWorkshop(state());return true;}
 function removePiece(kind,key){
  const s=state(),piece=pieceOf(s,{kind,key});if(!piece)return false;
  // A belt being stretched (possibly this one) must not be charged after its link is gone.
  if(beltPointer!==null||railDraft?.link===piece.link)cancelBeltGesture();
  const device=kind==='blower'||kind==='fence'||kind==='hopper'||kind==='loader';
  if(device){const list=deviceList(s,kind);if(kind==='hopper')releaseHopper(s,piece.hopper);if(kind==='loader')window.LoaderDevice?.release(key);list.splice(list.indexOf(piece[kind]),1);}else if(kind==='platform')s.camp.platforms.splice(s.camp.platforms.indexOf(piece.platform),1);else s.camp.links.splice(s.camp.links.indexOf(piece.link),1);
  const refund=refundOf(piece);s.factory.inventory.wood+=refund.wood;s.factory.inventory.stone+=refund.stone;
  if(!device)ConveyorCore.releaseItems(s.factory.drops,piece,s.camp.links,s.camp.platforms); // held items too: their release re-tags any belt they land on
  beltHistory=beltHistory.filter(h=>device?!keyEqual(h[kind],piece.key):kind==='platform'?!keyEqual(h.platform,piece.key):!keyEqual(h.nodeKey,piece.key));
  if(!device&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)folding.push(kind==='platform'?{platform:{...piece.platform},age:0}:{points:ConveyorCore.oriented(piece.link).map(p=>({...p})),age:0});
  for(const type of ['wood','stone'])if(refund[type])notices.push({type,count:refund[type],age:0});notices=notices.slice(-4);
  if(picked&&picked.kind===kind&&keyEqual(picked.key,key))picked=null;if(pickHighlight&&keyEqual(pickHighlight.key,key))pickHighlight=null;removeHint=null;s.camp.removeLearned=true;
  audio('pickup');persist();window.SupplyFactory?.translate();syncDOM();syncWorkshop(s);syncPick();if(railDraft)syncRailPanel();else window.PlacementControls?.sync?.();return true;
 }
 function buildPlatform(){if(window.ProgressionCore&&!ProgressionCore.hasRecipe(state(),'platform')){window.HarvestSkills?.open('recipe_platform');return false;}if(!conveyorUnlocked()){statusKey='beltLocked';statusUntil=visualTime+3;syncDOM();return false;}openDraft();platformMode=true;platformPreview=null;railError='';syncRailPanel();return true;}
 function platformFits(point){const s=state();return point.x>=50&&point.x<=WORLD.width-50&&point.y>=170&&point.y<=WORLD.height-40&&Math.hypot(point.x-HOME.x,point.y-HOME.y)>=75&&!s.camp.platforms.some(p=>Math.abs(p.x-point.x)<96&&Math.abs(p.y-point.y)<64);}
 function placePlatform(point){if(Rework.paused||!railDraft||!platformMode)return false;const s=state();if(s.factory.inventory.wood<8||s.factory.inventory.stone<4){railError='materials';syncRailPanel();return false;}if(!platformFits(point)){railError='area';syncRailPanel();return false;}
  const key=Math.max(0,...s.camp.platforms.map(p=>p.key))+1;s.factory.inventory.wood-=8;s.factory.inventory.stone-=4;s.camp.platforms.push({key,x:point.x,y:point.y,w:96,h:64,dir:platformDir,costWood:8,costStone:4});beltHistory.push({platform:key});railError='';audio('build');persist();window.SupplyFactory?.translate();syncRailPanel();if(document.body.classList.contains('compact-play'))stopRails();return true;
 }
 function beltStart(point){
  const s=state();if(!railDraft||Rework.paused)return false;const max=Math.max(18,16/ArmyView.camera.scale);let start=null,link=null;
  // A belt already at the wooden limit (or an older, longer one) is not extended: a new belt starts at its end.
  for(const l of s.camp.links){if(!l.points?.length)continue;const ps=ConveyorCore.oriented(l);if(ConveyorCore.distance(ps.at(-1),point)<max){if(ConveyorCore.length(ps)>=ConveyorCore.MAX_LENGTH-.5){start=[{...ps.at(-1)}];break;}start=ps;link=l;break;}}
  if(!start&&(ConveyorCore.distance(point,BELT_PORT)<max||Math.hypot(point.x-HOME.x,point.y-HOME.y)<30))start=[{...HOME},{...BELT_PORT}];
  if(!start){const near=ConveyorCore.contact(s.camp.links,point,ConveyorCore.WIDTH);start=[near?{x:near.x,y:near.y}:{x:clamp(point.x,14,WORLD.width-14),y:clamp(point.y,140,WORLD.height-20)}];}
  railDraft.points=start.map(p=>({...p}));railDraft.capped=false;railDraft.link=link;railDraft.oldCost=link?ConveyorCore.cost(start):0;railDraft.startLength=ConveyorCore.length(start);railError='';return true;
 }

 // Wooden conveyor: the draft follows the pointer but never grows past ConveyorCore.MAX_LENGTH (240).
 function dragBelt(p){if(!railDraft||!railDraft.points.length)return;railDraft.points=ConveyorCore.stretch(railDraft.points,p,ConveyorCore.MAX_LENGTH);const end=railDraft.points.at(-1);railDraft.capped=ConveyorCore.length(railDraft.points)>=ConveyorCore.MAX_LENGTH-.5&&ConveyorCore.distance(end,p)>4;}
 // Point equipment is first previewed, then confirmed at the same exact position.
 const placementPoint=(kind,p)=>({x:Math.round(clamp(p.x,kind==='platform'?50:24,WORLD.width-(kind==='platform'?50:24))),y:Math.round(clamp(p.y,kind==='platform'?170:110,WORLD.height-(kind==='platform'?40:15)))});
 const placementFits=(kind,p)=>kind==='blower'?blowerFits(p):kind==='hopper'?hopperFits(p):kind==='loader'?loaderFits(p):kind==='platform'?platformFits(p):false;
 function placementProblem(kind,point){const s=state(),costs={blower:{wood:4,stone:0},hopper:{wood:10,stone:4},loader:{wood:12,stone:6},platform:{wood:8,stone:4}},cost=costs[kind];if(kind==='hopper'&&!conveyorUnlocked())return 'hopperLocked';if(kind==='blower'&&s.camp.blowers.length>=MAX_BLOWERS)return 'blowerLimit';if(kind==='hopper'&&s.camp.hoppers.length>=MAX_HOPPERS)return 'hopperLimit';if(kind==='loader'&&s.camp.loaders.length>=20)return 'loaderLimit';if(s.factory.inventory.wood<cost.wood||(s.factory.inventory.stone||0)<cost.stone)return kind==='blower'?'toolWood':kind==='hopper'?'hopperMaterials':kind==='loader'?'loaderMaterials':'beltWood';if(!placementFits(kind,point))return kind==='blower'?'blowerBlocked':kind==='hopper'?'hopperBlocked':kind==='loader'?'loaderBlocked':'platformBlocked';return '';}
 function choosePlacement(kind,point,tap){
  const previous=placementPress?.choice;if(tap&&previous?.kind===kind&&Math.hypot(point.x-previous.point.x,point.y-previous.point.y)<=Math.max(12,10/ArmyView.camera.scale)){placementChoice=previous;confirmPlacement();return;}
  placementChoice={kind,point:placementPoint(kind,point)};if(kind==='platform')platformPreview={...placementChoice.point};else devicePreview={...placementChoice.point};syncPlacementCard();
 }
 function confirmPlacement(){if(!placementChoice||Rework.paused||!railDraft)return false;const {kind,point}=placementChoice;const ok=kind==='blower'?placeBlower(point):kind==='hopper'?placeHopper(point):kind==='loader'?placeLoader(point):placePlatform(point);if(ok)placementChoice=null;syncPlacementCard();return ok;}
 function syncPlacementCard(){
  if(!document.getElementById('field'))return;if(!placementCard){placementCard=document.createElement('section');placementCard.id='placementActions';placementCard.hidden=true;placementCard.setAttribute('role','group');placementCard.setAttribute('aria-label','仮置きした設備の操作');placementCard.innerHTML='<b role="status"></b><small></small><div><button type="button" data-placement-confirm>ここに設置</button><button type="button" data-placement-turn>向き ↻</button><button type="button" data-placement-cancel>やめる</button></div>';document.getElementById('field').append(placementCard);placementCard.addEventListener('pointerdown',e=>e.stopPropagation());placementCard.querySelector('[data-placement-confirm]').onclick=confirmPlacement;placementCard.querySelector('[data-placement-cancel]').onclick=()=>window.PlacementControls?.finish();placementCard.querySelector('[data-placement-turn]').onclick=()=>{if(deviceMode==='blower')blowerDir=(blowerDir+1)%8;else if(deviceMode==='hopper')hopperDir=(hopperDir+1)%8;else platformDir=(platformDir+1)%4;syncRailPanel();};}
  placementCard.hidden=!placementChoice||!railDraft;if(placementCard.hidden)return;const {kind,point}=placementChoice,problem=placementProblem(kind,point),valid=!problem,name={blower:'送風機',hopper:'集積口',loader:'積み込み機',platform:'受け土台'}[kind];setText(placementCard.querySelector('b'),name+' · 仮置き');setText(placementCard.querySelector('small'),problem?tr(problem):valid?'同じ場所をもう一度押すと設置。別の場所で置き直し。':'ここには置けません。赤い本体を別の場所へ。');placementCard.dataset.valid=String(valid);placementCard.querySelector('[data-placement-confirm]').disabled=!valid;placementCard.querySelector('[data-placement-turn]').hidden=kind==='loader';window.PlacementControls?.sync?.();
 }
 function installRails(){
  const panels=document.getElementById('panels');let equipmentTouch=null,lastEquipmentTouch=null;
  const chooseEquipment=id=>{if(id==='blower'||id==='fence'||id==='hopper'||id==='loader')buildDevice(id);else if(id==='platform')buildPlatform();else buildRail();document.getElementById('field').scrollIntoView({block:'nearest',behavior:'auto'});};
  panels.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const b=e.target.closest('[data-equipment]');equipmentTouch=b?{id:b.dataset.equipment,x:e.clientX,y:e.clientY,at:performance.now()}:null;});
  panels.addEventListener('pointercancel',()=>equipmentTouch=null);
  panels.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const t=equipmentTouch,b=e.target.closest('[data-equipment]');equipmentTouch=null;if(!t||!b||b.dataset.equipment!==t.id||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12||performance.now()-t.at>1000)return;e.preventDefault();lastEquipmentTouch={id:t.id,at:performance.now(),x:e.clientX,y:e.clientY};chooseEquipment(t.id);});
  // Choosing a tool opens the placement bar above the catalogue, which shifts the layout; the browser's
  // follow-up click from the same tap must not land on a bar button (e.g. undo) that moved under the finger.
  document.addEventListener('click',e=>{const t=lastEquipmentTouch;if(t&&e.isTrusted&&performance.now()-t.at<700&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<30&&!e.target.closest?.('[data-equipment="'+t.id+'"]')){e.preventDefault();e.stopImmediatePropagation();}},true);
  panels.addEventListener('click',e=>{const b=e.target.closest('[data-equipment]');if(!b)return;e.preventDefault();if(lastEquipmentTouch?.id===b.dataset.equipment&&performance.now()-lastEquipmentTouch.at<700)return;chooseEquipment(b.dataset.equipment);});
  const field=document.getElementById('field');beltButton=document.createElement('button');beltButton.id='conveyorBuild';beltButton.type='button';beltButton.textContent=tr('beltBuild');beltButton.onclick=()=>railDraft&&!platformMode?stopRails():buildRail();document.getElementById('rxToolbar').prepend(beltButton);platformButton=document.createElement('button');platformButton.id='conveyorPlatformBuild';platformButton.type='button';platformButton.textContent=tr('platformBuild');platformButton.onclick=()=>platformMode?stopRails():buildPlatform();beltButton.after(platformButton);
  field.addEventListener('pointerdown',e=>{if(!railDraft||Rework.paused||e.target.closest('button,input,select,#fieldMinimap,#burrowForecast,#placementActions,#fieldExit'))return;e.preventDefault();e.stopImmediatePropagation();if(e.button!==0||e.isPrimary===false)return;const at=ArmyView.point(e.clientX,e.clientY);placementPress={x:e.clientX,y:e.clientY,choice:placementChoice};railError='';if(deviceMode==='blower'||deviceMode==='hopper'||deviceMode==='loader')devicePreview=placementPoint(deviceMode,at);else if(deviceMode==='fence')devicePreview={a:{x:clamp(at.x,14,WORLD.width-14),y:clamp(at.y,100,WORLD.height-12)},b:{x:clamp(at.x,14,WORLD.width-14),y:clamp(at.y,100,WORLD.height-12)}};else if(platformMode){platformPreview=placementPoint('platform',at);}else if(!beltStart(at))return;pickPress=platformMode?null:{pointerId:e.pointerId,x:e.clientX,y:e.clientY,point:at};beltPointer=e.pointerId;try{field.setPointerCapture(e.pointerId);}catch(_){}syncRailPanel();},true);
  field.addEventListener('pointermove',e=>{if(railDraft&&deviceMode){const p=ArmyView.point(e.clientX,e.clientY);if((deviceMode==='blower'||deviceMode==='hopper'||deviceMode==='loader')&&(beltPointer===e.pointerId||e.pointerType==='mouse'&&!placementChoice))devicePreview=placementPoint(deviceMode,p);else if(deviceMode==='fence'&&beltPointer===e.pointerId&&devicePreview)devicePreview={a:devicePreview.a,b:{x:clamp(p.x,14,WORLD.width-14),y:clamp(p.y,100,WORLD.height-12)}};if(beltPointer===e.pointerId){e.preventDefault();e.stopImmediatePropagation();syncRailPanel();}return;}if(platformMode&&railDraft){if(beltPointer===e.pointerId||!placementChoice)platformPreview=placementPoint('platform',ArmyView.point(e.clientX,e.clientY));if(beltPointer!==e.pointerId)return;}if(!railDraft||beltPointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const p=ArmyView.point(e.clientX,e.clientY);p.x=clamp(p.x,14,WORLD.width-14);p.y=clamp(p.y,140,WORLD.height-20);if(platformMode)platformPreview=placementPoint('platform',p);else dragBelt(p);railHover=p;syncRailPanel();},true);
  // Loader previews allow belt ground; a valid placement tap must not select that belt instead.
  field.addEventListener('pointerup',e=>{if(beltPointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();beltPointer=null;if(placementPress)placementPress.tap=Math.hypot(e.clientX-placementPress.x,e.clientY-placementPress.y)<8;const release=ArmyView.point(e.clientX,e.clientY);if(!groundRelease(e,release)){cancelBeltGesture();syncRailPanel();return;}const tap=pickPress?.pointerId===e.pointerId&&Math.hypot(e.clientX-pickPress.x,e.clientY-pickPress.y)<8?pickPress:null;pickPress=null;if(deviceMode){const kind=deviceMode,at=['blower','hopper','loader'].includes(kind)?placementPoint(kind,ArmyView.point(e.clientX,e.clientY)):ArmyView.point(e.clientX,e.clientY),hit=tap&&!placementChoice&&!placementFits(kind,at)?pickAt(tap.point):null;if(hit&&!(kind==='loader'&&hit.kind==='belt')){stopRails();select(hit);}else if(['blower','hopper','loader'].includes(kind))choosePlacement(kind,at,!!tap);else if(!tap)placeFence(devicePreview);else{railError='fenceShort';}if(deviceMode==='fence')devicePreview=null;}else if(platformMode){choosePlacement('platform',ArmyView.point(e.clientX,e.clientY),!!placementPress?.tap);}else if(tap){const s=state();select(ConveyorCore.hitLink(s.camp.links,s.camp.platforms,tap.point,Math.max(10,22/ArmyView.camera.scale)));}else commitRails();if(railDraft){railDraft.points=[];railDraft.link=null;railDraft.oldCost=0;}try{field.releasePointerCapture(e.pointerId);}catch(_){}syncRailPanel();},true);
  field.addEventListener('pointercancel',e=>{if(beltPointer!==e.pointerId)return;cancelBeltGesture();syncRailPanel();},true);
  window.addEventListener('keydown',e=>{if(picked&&!e.defaultPrevented&&!window.Rework?.paused&&!e.target?.closest?.('input,textarea,select')){if(beltPointer!==null||drag)return;if(e.key==='Escape'){e.preventDefault();clearSelection();stopRails();return;}if(e.key==='Delete'||e.key==='Backspace'&&!railDraft){e.preventDefault();removePiece(picked.kind,picked.key);return;}}if(!railDraft||e.defaultPrevented||window.Rework?.paused)return;if(e.key==='Escape')stopRails();if(e.key==='Backspace'){e.preventDefault();undoBelt();}});window.addEventListener('blur',()=>{cancelBeltGesture();syncRailPanel();});window.addEventListener('pagehide',stopRails);
 }

 function installPick(){
  const field=document.getElementById('field'),moved=(e,p)=>Math.hypot(e.clientX-p.x,e.clientY-p.y)>=8;
  // Capture only records a candidate; trees, piles, allies, enemies and the house keep their own handlers.
  field.addEventListener('pointerdown',e=>{if(railDraft)return;pickPress=null;if(!booted||window.Rework?.paused||window.BattleControl?.placement||e.button!==0||e.isPrimary===false||e.target.closest('button,input,select,#campWarehouse,#beltActions,#fieldMinimap,#burrowForecast,#placementActions,#fieldExit')||!document.getElementById('titleScreen')?.classList.contains('hidden'))return;const point=ArmyView.point(e.clientX,e.clientY),hit=pickAt(point);if(!hit){if(picked)select(null);return;}pickPress={pointerId:e.pointerId,x:e.clientX,y:e.clientY,hit};clearTimeout(longPress);if(hit.kind==='hopper')e.stopImmediatePropagation();if(hit.kind==='blower'){e.stopImmediatePropagation();const press=pickPress;longPress=setTimeout(()=>{if(pickPress!==press)return;press.long=true;select(press.hit);},450);}},true);
  field.addEventListener('contextmenu',e=>{if(!booted||railDraft||window.Rework?.paused||window.BattleControl?.placement)return;const hit=pickAt(ArmyView.point(e.clientX,e.clientY));if(!hit)return;e.preventDefault();clearTimeout(longPress);pickPress=null;select(hit);});
  document.addEventListener('pointerdown',e=>{if(pickPress?.hit&&pickPress.pointerId===e.pointerId&&(drag||window.SupplyFactory?.holding||window.BattleControl?.placement||window.Rework?.paused))pickPress=null;});
  field.addEventListener('pointermove',e=>{
   if(windGesture?.pointerId===e.pointerId){e.preventDefault();e.stopImmediatePropagation();aimWind(e);return;}
   const p=pickPress;if(!p?.hit||p.pointerId!==e.pointerId||!moved(e,p))return;
   if(p.hit.kind==='blower'&&!drag&&!railDraft&&!window.Rework?.paused&&!window.BattleControl?.placement){const b=state().camp.blowers.find(b=>keyEqual(b.key,p.hit.key));if(b){pickPress=null;clearTimeout(longPress);windGesture={pointerId:e.pointerId,key:b.key,dir:b.dir};select(p.hit);try{field.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();e.stopImmediatePropagation();aimWind(e);return;}}
   pickPress=null;clearTimeout(longPress);
  },true);
  window.addEventListener('pointerup',e=>{if(windGesture?.pointerId!==e.pointerId)return;e.preventDefault();aimWind(e);finishWind();},true);
  window.addEventListener('pointercancel',e=>{if(windGesture?.pointerId===e.pointerId)finishWind(true);},true);
  window.addEventListener('blur',()=>finishWind(true));
  window.addEventListener('pointerup',e=>{const p=pickPress;if(!p?.hit||p.pointerId!==e.pointerId)return;pickPress=null;clearTimeout(longPress);if(p.long||moved(e,p)||drag||railDraft||window.BattleControl?.placement||window.Rework?.paused)return;if(p.hit.kind==='blower')boostBlower(p.hit.key);else select(p.hit);},true);
  window.addEventListener('pointercancel',()=>{if(pickPress?.hit)pickPress=null;clearTimeout(longPress);},true);
 }
 function openWorkshop(tab){if(window.ProgressionCore&&tab==='growth'){window.HarvestSkills?.open(nextProject()?.projectId);return true;}if(tab==='rails'||tab==='growth')activeTab=tab;

  if(!booted)boot();const s=state();if(!s)return false;
  makeWorkshop();workshopMessage='';setText(workshopStatus,'');syncWorkshop(s);
  window.Rework?.openPanel('campWorkshop');if(activeTab==='growth'){const id=nextProject()?.id,target=id?overlay.querySelector('[data-camp-project="'+id+'"]'):null;if(target)requestAnimationFrame(()=>target.scrollIntoView?.({block:'nearest',behavior:'instant'}));}return true;
 }

 function send(s,drop,count,mode,node){
  const index=s.factory.drops.indexOf(drop);if(index<0||!Number.isFinite(count)||count<=0)return false;
  count=Math.min(count,drop.count);if(!(count>0))return false;
  const from=mode==='rail'?{x:node.x,y:node.y+12}:{x:drop.x,y:drop.y},link=mode==='rail'?s.camp.links.find(l=>keyEqual(l.nodeKey,node.key)):null,path=link?.points?.length>1?link.points.map(p=>({...p})):null;
  s.camp.cargo.push({key:s.camp.nextKey++,type:drop.type,count,from,progress:0,duration:mode==='rail'?.6+(path?RailCore.length(path):Math.hypot(from.x-HOME.x,from.y-HOME.y))/(120*Math.max(1,skillEffects().cartSpeed||1)):.6,...(path?{path}:{}),worker:drop.worker===true,source:drop.source??node?.key??null,mode});
  if(count>=drop.count)s.factory.drops.splice(index,1);else drop.count-=count;
  return true;
 }
 // A click never transports supplies: manual delivery requires a complete drag.
 function pickup(){statusKey='clickPile';statusUntil=visualTime+2;syncDOM();return false;}
 function houseContains(point){return !!point&&Math.abs(point.x-HOME.x)<=58&&point.y>=HOME.y-94&&point.y<=HOME.y+15;}
 function dragTarget(e){
  // Accept the pictured building, not the inventory panel or another UI control.
  const target=document.elementFromPoint(e.clientX,e.clientY);return !target?.closest?.('button,input,select,#campWarehouse,#raidBoard,#campaignGoal')&&houseContains(ArmyView.point(e.clientX,e.clientY));
 }
 function refreshDrag(e,initial=false){
  if(!drag)return;drag.x=e.clientX;drag.y=e.clientY;drag.over=dragTarget(e);
  let added=initial?1:0;if(!drag.over){let extra=0;while(drag.items.length<handCapacity()){const more=window.SupplyFactory?.pileAt(ArmyView.point(e.clientX,e.clientY));if(!more||heldDrop(more))break;drag.items.push({drop:more,count:1});extra++;}if(extra)audio('pickup');added+=extra;}
  if(added)window.dispatchEvent(new CustomEvent('camp:handpickup',{detail:{held:drag.items.length,capacity:handCapacity(),added}}));
  dragGhost.innerHTML='<b>'+drag.items.length+' / '+handCapacity()+'</b>';
  dragGhost.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
  dragGhost.classList.toggle('can-deliver',drag.over);document.getElementById('field').classList.toggle('delivery-ready',drag.over);
 }
 // Ground release uses the pictured world only. A captured pointer can finish over UI or outside it.
 function groundRelease(e,point){
  if(!e||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
  const target=document.elementFromPoint(e.clientX,e.clientY);
  return !!target?.closest?.('#field')&&!target.closest('button,a,input,select,textarea,#campWarehouse,#raidBoard,#campaignGoal,#placementControls,#beltActions,#placementActions,#fieldExit,#onboardingGuide')&&point.x>=8&&point.x<=WORLD.width-8&&point.y>=96&&point.y<=WORLD.height-8;
 }
 function endDrag(e,cancel=false){
  if(!drag||e&&e.pointerId!==drag.pointerId)return;
  const held=drag,s=state(),allowed=!cancel&&!window.Rework?.paused&&s===held.state,ok=allowed&&dragTarget(e),point=allowed?ArmyView.point(e.clientX,e.clientY):null,onGround=allowed&&groundRelease(e,point),belt=onGround?ConveyorCore.contact(s.camp.links,point,ConveyorCore.WIDTH):null,platform=onGround?ConveyorCore.platformAt(s.camp.platforms,point):null;
  drag=null;for(const item of held.items){item.drop.vx=0;item.drop.vy=0;}dragGhost?.remove();dragGhost=null;const field=document.getElementById('field');field?.classList.remove('dragging-supplies','delivery-ready');
  try{if(field?.hasPointerCapture(held.pointerId))field.releasePointerCapture(held.pointerId);}catch(_){}
  if(ok){
   const arrivals=[];for(const item of held.items){const drop=item.drop,count=Math.min(item.count,drop.count),index=s.factory.drops.indexOf(drop);if(count>0&&index>=0){if(count===drop.count)s.factory.drops.splice(index,1);else drop.count-=count;arrivals.push({type:drop.type,count,worker:drop.worker===true});}}receive(s,arrivals);
  }else if(allowed&&platform&&!belt){for(let i=0;i<held.items.length;i++){const d=held.items[i].drop;d.x=clamp(point.x+i*16,platform.x-platform.w/2+4,platform.x+platform.w/2-4);d.y=clamp(point.y,platform.y-platform.h/2+4,platform.y+platform.h/2-4);d.onConveyor=true;}persist();syncDOM();}else if(allowed&&belt){for(let i=0;i<held.items.length;i++){const drop=held.items[i].drop,p=ConveyorCore.at(belt.points,Math.max(0,belt.along+i*18));drop.x=p.x;drop.y=p.y;drop.onConveyor=true;}statusKey='inTransit';statusUntil=visualTime+2;persist();syncDOM();}else if(onGround){
   // Keep the grabbed piece under the hand; other held pieces settle in a small visible row.
   const z=ArmyView.camera.scale||1,cx=point.x+held.offset.x/z,cy=point.y+held.offset.y/z;
   for(let i=0;i<held.items.length;i++){const d=held.items[i].drop;if(!s.factory.drops.includes(d))continue;
    d.x=clamp(cx+i*12,8,WORLD.width-8);d.y=clamp(cy+(i%2)*5,96,WORLD.height-8);d.physical=true;
    for(const key of ['onConveyor','beltId','platformKey','conveyorBlocked','hopperKey','airUntil','spot'])delete d[key];
   }
   statusKey='';statusUntil=0;persist();syncDOM();
  }else{statusKey='returned';statusUntil=visualTime+1.7;syncDOM();}
  window.SupplyFactory?.translate();
 }
 function installDrag(){
  if(dragInstalled)return;dragInstalled=true;const field=document.getElementById('field');
  field.addEventListener('pointerdown',e=>{
   if(railDraft||!booted||window.Rework?.paused||window.BattleControl?.placement||e.button!==0||e.isPrimary===false||e.target.closest('button,input,select,#campWarehouse,#fieldMinimap,#burrowForecast,#placementActions,#fieldExit')||!document.getElementById('titleScreen')?.classList.contains('hidden'))return;
   const s=state(),drop=window.SupplyFactory?.pileAt(ArmyView.point(e.clientX,e.clientY));if(!drop||drag)return;
   e.preventDefault();e.stopImmediatePropagation();
   const view=document.getElementById('battleWorld').getBoundingClientRect(),z=ArmyView.camera.scale;drag={drop,count:1,items:[{drop,count:1}],state:s,pointerId:e.pointerId,x:e.clientX,y:e.clientY,offset:{x:view.left+drop.x*z-e.clientX,y:view.top+drop.y*z-e.clientY},over:false};
   dragGhost=document.createElement('div');dragGhost.id='campDragGhost';dragGhost.setAttribute('aria-hidden','true');dragGhost.innerHTML='<b>1 / '+handCapacity()+'</b>';document.body.append(dragGhost);
   field.classList.add('dragging-supplies');try{field.setPointerCapture(e.pointerId);}catch(_){}
   refreshDrag(e,true);statusKey='dragging';statusUntil=visualTime+3600;syncDOM();
  },true);
  field.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();e.stopImmediatePropagation();refreshDrag(e);}},true);
  field.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();e.stopImmediatePropagation();endDrag(e);}},true);
  field.addEventListener('pointercancel',e=>endDrag(e,true),true);
  field.addEventListener('lostpointercapture',e=>endDrag(e,true),true);
  window.addEventListener('blur',()=>endDrag(null,true));window.addEventListener('pagehide',()=>endDrag(null,true));
  window.addEventListener('keydown',e=>{if(e.key==='Escape')endDrag(null,true);});
 }

 function dispatch(s,dt=0){
  let moved=false;const arrivals=[],speed=ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*MaterialsCore.conveyorBonus(s.camp),occupied=[];
  for(const drop of s.factory.drops.slice().filter(d=>!heldDrop(d)&&!window.LoaderDevice?.isHeld?.(d)&&d.hopperKey==null&&!window.SupplyFactory?.isAirborne?.(d))){const next=ConveyorCore.step(s.camp.links,s.camp.platforms,drop,dt,speed);if(!next.onConveyor)continue;drop.onConveyor=true;drop.vx=0;drop.vy=0;
   if(next.arrived){const index=s.factory.drops.indexOf(drop);if(index>=0){s.factory.drops.splice(index,1);arrivals.push({type:drop.type,count:drop.count,worker:drop.worker});}moved=true;continue;}
   if(!occupied.some(p=>Math.hypot(p.x-next.x,p.y-next.y)<13)){drop.x=next.x;drop.y=next.y;drop.beltId=next.beltId;drop.platformKey=next.platformKey;drop.conveyorBlocked=next.blocked;occupied.push(next);moved=true;}
  }
  receive(s,arrivals,true);return moved;
 }

 function receive(s,arrivals,automatic=false){
  if(!arrivals.length)return;
  const totals={wood:0,stone:0,food:0,iron:0,gold:0},wind=arrivals.filter(c=>c.via==='blower');let first=false;const firstWind=wind.length>0&&!(s.tutorial?.blownWood>0);
  for(const cargo of arrivals){
   if(!['wood','stone','food','iron','gold'].includes(cargo.type)||!Number.isFinite(cargo.count)||cargo.count<=0)continue;
   totals[cargo.type]+=cargo.count;window.OutpostTutorial?.delivered?.(cargo.type,cargo.count,automatic&&!['broom','magnet'].includes(cargo.via),cargo.worker===true,cargo.via||null);
   if(cargo.type==='gold'){if(typeof earnGold==='function')earnGold(cargo.count);else s.gold+=cargo.count;}
   else s.factory.inventory[cargo.type]=Math.min(1e9,(s.factory.inventory[cargo.type]||0)+cargo.count);
   s.factory.delivered=(s.factory.delivered||0)+cargo.count;
   if(cargo.worker&&cargo.type==='wood'&&!s.firstWorkerPickup){s.firstWorkerPickup=true;first=true;}
  }
  for(const type of ['wood','stone','food','iron','gold'])if(totals[type])notices.push({type,count:totals[type],age:0,wind:wind.length>0&&wind.every(c=>c.type===type)});
  notices=notices.slice(-4);houseFlash=.42;warehouse?.classList.add('camp-received');
  statusKey='arrived';statusUntil=visualTime+1.7;if(wind.length)windCredit(s,wind,firstWind);else audio('pickup');
  if(first){if(typeof renderCards==='function')renderCards();window.Rework?.revealAllies?.('arch');}
  if(typeof updateHud==='function')updateHud();window.SupplyFactory?.translate();syncDOM();persist();
 }
 // A log blown into the house gets the blower's credit: a breath-and-pluck sound that climbs a semitone per
 // delivery within 8 s (max +5), a wind-coloured ring where it entered, its last 0.8 s path traced in light,
 // and "Wind delivery ×n" for streaks. The first ever wind delivery adds a cue, a blower bounce and a caption.
 function windCredit(s,wind,first){
  windChain=visualTime-lastWindAt<8?windChain+1:1;lastWindAt=visualTime;
  if(first)window.ForestAudio?.play('windFirst');else window.ForestAudio?.play('windDeliver',{rate:Math.pow(2,Math.min(5,windChain-1)/12),level:.8});
  for(const c of wind){const at=c.at||HOME;fx.push({kind:'ring',x:at.x,y:at.y,t0:visualTime,dur:.6});if(c.trail?.length>1)fx.push({kind:'trail',points:c.trail.concat([at]),t0:visualTime,dur:.5});}
  if(windChain>=2){fx=fx.filter(f=>f.kind!=='chain');fx.push({kind:'chain',n:windChain,t0:visualTime,dur:1.5});}
  if(first){const start=wind[0].trail?.[0]||wind[0].at||HOME,b=s.camp.blowers.slice().sort((p,q)=>Math.hypot(p.x-start.x,p.y-start.y)-Math.hypot(q.x-start.x,q.y-start.y))[0];if(b){fx.push({kind:'bounce',key:b.key,t0:visualTime,dur:.35});fx.push({kind:'caption',x:b.x,y:b.y-30,text:tr('windBy'),t0:visualTime,dur:1.2});}}
 }
 function groundNearMiss(list){for(const p of list)fx.push({kind:'near',x:p.x,y:p.y,t0:visualTime,dur:1.5});}
 function tick(dt){
  if(!booted||!Number.isFinite(dt)||dt<=0)return;fx=fx.filter(f=>visualTime-f.t0<f.dur);
  const s=state();if(!s)return;if(railDraft&&railDraft.owner!==s)stopRails();visualTime+=dt;
  notices.forEach(n=>n.age+=dt);notices=notices.filter(n=>n.age<1.1);if(pulse){pulse.age+=dt;if(pulse.age>=pulse.arrive)arrivePulse();if(pulse.age>pulse.end+.15)pulse=null;}folding.forEach(f=>f.age+=dt);folding=folding.filter(f=>f.age<FOLD);if(removeHint&&(removeHint.until<visualTime||s.camp.removeLearned))removeHint=null;
  houseFlash=Math.max(0,houseFlash-dt);if(!houseFlash)warehouse?.classList.remove('camp-received');
  const arrivals=[],remaining=[];
  for(const cargo of s.camp.cargo){
   cargo.progress=Math.min(1,(Number(cargo.progress)||0)+dt/Math.max(.1,Number(cargo.duration)||.6));
   if(cargo.progress>=1)arrivals.push(cargo);else remaining.push(cargo);
  }
  s.camp.cargo=remaining;receive(s,arrivals);
  window.LoaderDevice?.tick(dt);const dispatched=dispatch(s,dt);railClock+=dt;if(dispatched&&railClock>=1){railClock=0;persist();}
  uiClock+=dt;if(uiClock>=.25){uiClock=0;syncDOM();const open=conveyorUnlocked(s);if(open!==unlockSeen){if(unlockSeen!==null&&typeof renderCards==='function')renderCards();unlockSeen=open;}if(!window.ProgressionCore&&open&&!s.camp.conveyorUnlockSeen&&!window.Rework?.paused&&s.outpost?.phase!=='active'&&document.getElementById('titleScreen')?.classList.contains('hidden')!==false)celebrateUnlock(s);if(unlockGlow!==-Infinity&&unlockGlow<=visualTime){unlockGlow=-Infinity;if(typeof renderCards==='function')renderCards();}}
 }

 // Chapter 1 reward (M4): a milestone, not a shake. The unlock cue, a banner over the field for a few seconds and
 // a glow on the newly opened catalogue cards. Shown once per save (also to older saves that cleared Wave 3 before).
 function celebrateUnlock(s){s.camp.conveyorUnlockSeen=true;audio('unlock');unlockGlow=visualTime+6;unlockBanner={t0:visualTime,dur:4.5};statusKey='unlockTitle';statusUntil=visualTime+6;if(typeof renderCards==='function')renderCards();window.Rework?.track?.('conveyor_unlock',{cleared:cleared(s)});persist();syncDOM();}
 function drawUnlockBanner(ctx,{ox,oy,z}){if(!unlockBanner)return;const t=visualTime-unlockBanner.t0;if(t>unlockBanner.dur){unlockBanner=null;return;}const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,canvas=ctx.canvas,cw=canvas.clientWidth||canvas.width,x=Math.min(cw/2,ox+480*z),y=Math.max(70,oy+150*z),k=reduced?1:t<.22?.86+.14*t/.22:1,alpha=Math.min(1,t/.15,(unlockBanner.dur-t)/.5);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(k,k);const title=tr('unlockTitle'),body=tr('unlockBody');ctx.font='900 19px system-ui';const tw=ctx.measureText(title).width;ctx.font='700 12px system-ui';const bw=ctx.measureText(body).width,w=Math.min(cw-24,Math.max(tw,bw)+40),h=58;
  ctx.fillStyle='#1b3a2cf2';ctx.strokeStyle='#f3d98a';ctx.lineWidth=2.5;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-w/2,-h/2,w,h,10);else ctx.rect(-w/2,-h/2,w,h);ctx.fill();ctx.stroke();
  // a single light sweep across the frame (static with reduced motion)
  if(!reduced&&t<1.2){const sx=-w/2+w*(t/1.2);const g=ctx.createLinearGradient(sx-30,0,sx+30,0);g.addColorStop(0,'#fff6d000');g.addColorStop(.5,'#fff6d055');g.addColorStop(1,'#fff6d000');ctx.fillStyle=g;ctx.fillRect(Math.max(-w/2,sx-30),-h/2+2,Math.min(60,w/2-sx+30),h-4);}
  ctx.textAlign='center';ctx.fillStyle='#ffe7a0';ctx.font='900 19px system-ui';ctx.fillText(title,0,-4,w-20);ctx.fillStyle='#e8f1d6';ctx.font='700 12px system-ui';ctx.fillText(body,0,17,w-20);ctx.restore();}
 const FOLD=.13,PULSE_COLOR='#93cbdc',beltSpeed=s=>ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*MaterialsCore.conveyorBonus(s.camp);
 // A learned route skill sends one light streak along every player-built belt, from its far end toward the warehouse.
 function startPulse(){const s=state();if(!s)return;const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,speed=beltSpeed(s);
  const paths=s.camp.links.filter(l=>l.points?.length>1).map(l=>{const points=ConveyorCore.oriented(l).slice().reverse(),length=ConveyorCore.length(points);return {points,length,dur:Math.min(1.2,length/speed),home:ConveyorCore.distance(points.at(-1),HOME)<60};}).filter(p=>p.length>1);
  if(!paths.length){pulse=null;window.dispatchEvent(new CustomEvent('harvestskill:beltpulse-arrived',{detail:{route:false}}));return;}
  const arrive=reduced?0:Math.max(...paths.filter(p=>p.home).map(p=>p.dur),0)||Math.max(...paths.map(p=>p.dur));pulse={age:0,reduced,paths,arrive,end:reduced?.6:Math.max(...paths.map(p=>p.dur)),arrived:false};if(reduced)arrivePulse();}
 function arrivePulse(){if(!pulse||pulse.arrived)return;pulse.arrived=true;window.dispatchEvent(new CustomEvent('harvestskill:beltpulse-arrived',{detail:{route:true}}));}
 function slicePath(points,from,to){const out=[ConveyorCore.at(points,from)];let run=0;for(let i=1;i<points.length;i++){const d=ConveyorCore.distance(points[i-1],points[i]);if(run+d>from&&run+d<to)out.push(points[i]);run+=d;}out.push(ConveyorCore.at(points,to));return out;}
 function drawPulse(ctx){if(!pulse)return;ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';ctx.strokeStyle=PULSE_COLOR;ctx.lineWidth=31;
  if(pulse.reduced){ctx.globalAlpha=.55;for(const p of pulse.paths)strokePath(ctx,p.points);ctx.restore();return;}
  for(const p of pulse.paths){const head=Math.min(1,pulse.age/Math.max(.05,p.dur))*p.length,tail=Math.max(0,head-Math.min(70,p.length*.35));if(head<=tail||pulse.age>p.dur+.12)continue;ctx.globalAlpha=pulse.age>p.dur?Math.max(0,1-(pulse.age-p.dur)/.12)*.8:.8;strokePath(ctx,slicePath(p.points,tail,head));}
  ctx.restore();}
 const marked=(kind,key)=>[picked,pickHighlight].some(p=>p&&p.kind===kind&&keyEqual(p.key,key));
 function strokePath(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
 function partPath(points,share){const total=ConveyorCore.length(points)*Math.max(0,Math.min(1,share)),out=[points[0]];let run=0;for(let i=1;i<points.length;i++){const d=ConveyorCore.distance(points[i-1],points[i]);if(run+d>=total){out.push(ConveyorCore.at([points[i-1],points[i]],total-run));return out;}run+=d;out.push(points[i]);}return out;}
 function midpoint(points){return ConveyorCore.at(points,ConveyorCore.length(points)/2);}
 function railSegment(ctx,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1)return;const nx=-dy/len,ny=dx/len;ctx.lineCap='butt';ctx.strokeStyle='#252e2c';ctx.lineWidth=29;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#778b80';ctx.lineWidth=25;ctx.stroke();ctx.strokeStyle='#344c40';ctx.lineWidth=19;ctx.stroke();
  const phase=(visualTime*ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*MaterialsCore.conveyorBonus(state().camp))%10;ctx.strokeStyle='#849879';ctx.lineWidth=2;for(let t=-phase;t<len;t+=10){if(t<0)continue;const x=a.x+dx*t/len,y=a.y+dy*t/len;ctx.beginPath();ctx.moveTo(x-nx*9,y-ny*9);ctx.lineTo(x+nx*9,y+ny*9);ctx.stroke();}
  for(let t=Math.min(10,len/2);t<len;t+=60){const x=a.x+dx*t/len,y=a.y+dy*t/len;ctx.strokeStyle='#f3d17a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+dx/len*5+nx*5,y+dy/len*5+ny*5);ctx.lineTo(x-dx/len*3,y-dy/len*3);ctx.lineTo(x+dx/len*5-nx*5,y+dy/len*5-ny*5);ctx.stroke();}
 }
 function drawPlatform(ctx,p,preview=false){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=preview?(p.invalid?'#995d4b99':'#62775299'):'#61775c';ctx.strokeStyle='#b9c69e';ctx.lineWidth=3;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.strokeRect(-p.w/2,-p.h/2,p.w,p.h);ctx.strokeStyle='#40583f';ctx.lineWidth=4;const horizontal=(p.dir||0)%2===0,phase=((p.dir||0)>=2?-1:1)*(visualTime*ConveyorCore.SPEED*Math.max(1,skillEffects().cartSpeed||1)*MaterialsCore.conveyorBonus(state().camp))%12;for(let t=-48-phase;t<48;t+=12){ctx.beginPath();if(horizontal){ctx.moveTo(t,-p.h/2+3);ctx.lineTo(t,p.h/2-3);}else{ctx.moveTo(-p.w/2+3,t);ctx.lineTo(p.w/2-3,t);}ctx.stroke();}ctx.rotate((p.dir||0)*Math.PI/2);ctx.fillStyle='#ffe295';ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-7,-12);ctx.lineTo(-7,-5);ctx.lineTo(17,-5);ctx.lineTo(17,5);ctx.lineTo(-7,5);ctx.lineTo(-7,12);ctx.closePath();ctx.fill();ctx.restore();const out=ConveyorCore.outlet(p);const ready=ConveyorCore.downstream(state().camp.links,out,null,ConveyorCore.WIDTH/2+1);ctx.strokeStyle=ready?'#bfe69b':'#e8a76b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(out.x,out.y,7,0,Math.PI*2);ctx.stroke();if(!ready){ctx.fillStyle='#e8a76b';ctx.fillRect(out.x-4,out.y-5,3,10);ctx.fillRect(out.x+2,out.y-5,3,10);}}
 // Tool art (2/TOOL_ART.md): blower 2 cells of 679x552 (0 normal, 1 strong wind, facing right); fence 1075x405 with posts at x2-137 and x935-1072.
 let toolArt=null;
 const artReady=key=>{if(!toolArt&&typeof Image==='function'){toolArt={blower:new Image(),fence:new Image(),hopper:new Image()};toolArt.blower.src='../assets/tool-blower.webp';toolArt.fence.src='../assets/tool-fence.webp';toolArt.hopper.src='../assets/tool-hopper.webp';}const img=toolArt?.[key];return !!img&&img.complete&&img.naturalWidth>0;};
 function drawFan(ctx,b,strong,alpha=1){if(!window.GroundPhysics)return;const pts=GroundPhysics.fanPoints(b);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=strong?'#bfe8ff38':'#e8f3d522';ctx.strokeStyle=strong?'#d6f0ffaa':'#eaf2c955';ctx.lineWidth=Math.max(1.5,1.5/(window.ArmyView?.camera?.scale||1));ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();
  // Moving streaks (at least 1.5 screen px wide on a zoomed-out phone) show the push direction; faster in strong wind. Reduced motion keeps them still.
  const d=GroundPhysics.DIRS[b.dir],reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,phase=reduced?.5:(visualTime*(strong?2.4:1.2))%1;const z=window.ArmyView?.camera?.scale||1;ctx.strokeStyle=strong?'#ffffffcc':'#ffffff66';ctx.lineWidth=Math.max(strong?2:1.2,1.5/z);for(const k of [-1,0,1]){const a=Math.atan2(d.y,d.x)+k*.22,r0=22+phase*58;ctx.beginPath();ctx.moveTo(b.x+Math.cos(a)*r0,b.y+Math.sin(a)*r0);ctx.lineTo(b.x+Math.cos(a)*(r0+12),b.y+Math.sin(a)*(r0+12));ctx.stroke();}ctx.restore();}
 function drawBlower(ctx,b,strong=false,preview=false,invalid=false){const angle=b.dir*Math.PI/4,left=Math.cos(angle)<-1e-6;ctx.save();ctx.translate(b.x,b.y);if(preview)ctx.globalAlpha=.65;
  const bounce=fx.find(f=>f.kind==='bounce'&&keyEqual(f.key,b.key));if(bounce){const t=(visualTime-bounce.t0)/bounce.dur,k=1+.12*Math.sin(Math.PI*Math.min(1,t));ctx.scale(k,k);}
  if(left){ctx.rotate(angle-Math.PI);ctx.scale(-1,1);}else ctx.rotate(angle);
  if(artReady('blower')){const k=46/679;ctx.drawImage(toolArt.blower,strong?679:0,0,679,552,-330*k,-360*k,679*k,552*k);}else{ctx.fillStyle='#8a6338';ctx.fillRect(-16,-12,26,24);ctx.fillStyle='#c79a5a';ctx.beginPath();ctx.arc(12,0,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4a3420';ctx.lineWidth=2;for(let i=0;i<4;i++){const a=i*Math.PI/4+(strong?visualTime*20:0);ctx.beginPath();ctx.moveTo(12-Math.cos(a)*9,-Math.sin(a)*9);ctx.lineTo(12+Math.cos(a)*9,Math.sin(a)*9);ctx.stroke();}}
  ctx.restore();
  // Always-upright outlet arrow: the fan range alone did not make its direction clear.
  const d=GroundPhysics.DIRS[b.dir],z=window.ArmyView?.camera?.scale||1,m=39;
  ctx.save();ctx.strokeStyle=invalid?'#ec9b80':'#ffe59a';ctx.lineWidth=Math.max(2,2/z);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x+d.x*23,b.y+d.y*23);ctx.lineTo(b.x+d.x*m,b.y+d.y*m);ctx.lineTo(b.x+d.x*(m-7)-d.y*5,b.y+d.y*(m-7)+d.x*5);ctx.moveTo(b.x+d.x*m,b.y+d.y*m);ctx.lineTo(b.x+d.x*(m-7)+d.y*5,b.y+d.y*(m-7)-d.x*5);ctx.stroke();ctx.restore();
  if(preview||invalid){ctx.strokeStyle=invalid?'#ec9b80':'#ffe59a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,17,9,0,0,Math.PI*2);ctx.stroke();}}
 function drawFence(ctx,f,preview=false,invalid=false){let a=f.a,b=f.b;if(b.x<a.x){[a,b]=[b,a];}const len=Math.hypot(b.x-a.x,b.y-a.y);if(len<1)return;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));if(preview)ctx.globalAlpha=.7;
  if(artReady('fence')){const n=Math.max(1,Math.round(len/48)),u=len/n,k=u/934;for(let i=0;i<n;i++)ctx.drawImage(toolArt.fence,0,0,935,405,i*u-70*k,-330*k,935*k,405*k);ctx.drawImage(toolArt.fence,935,0,140,405,n*u-69*k,-330*k,140*k,405*k);}
  else{ctx.strokeStyle='#5b4128';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,0);ctx.stroke();ctx.fillStyle='#8a6a42';ctx.fillRect(-3,-9,6,11);ctx.fillRect(len-3,-9,6,11);}
  if(invalid){ctx.strokeStyle='#ec9b80';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,0);ctx.stroke();ctx.setLineDash([]);}ctx.restore();}
 // Hopper art (2/TOOL_ART.md): 2 cells of 345x337 (0 idle, 1 spitting), outlet drawn facing right; cell point (165,200) is
 // the hopper's ground point and the spout mouth sits about 22 to the right (world), where items leave.
 function drawHopperRange(ctx,h,alpha=.5,invalid=false){if(!window.GroundPhysics)return;const P=GroundPhysics.PARAMS,o=GroundPhysics.DIRS[h.dir],z=window.ArmyView?.camera?.scale||1,a0=Math.atan2(o.y,o.x),half=Math.acos(P.hopperFrontCos);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=invalid?'#e0806022':'#f3d98a1c';ctx.strokeStyle=invalid?'#ec9b80':'#f3d98a';ctx.lineWidth=Math.max(1.5,1.5/z);ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.arc(h.x,h.y,P.hopperRadius,a0+half,a0-half+Math.PI*2);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore();}
 function drawHopper(ctx,h,{preview=false,invalid=false,spitting=false}={}){const angle=h.dir*Math.PI/4,left=Math.cos(angle)<-1e-6;ctx.save();ctx.translate(h.x,h.y);if(preview)ctx.globalAlpha=.7;
  ctx.save();if(left){ctx.rotate(angle-Math.PI);ctx.scale(-1,1);}else ctx.rotate(angle);
  if(artReady('hopper')){const k=56/345;ctx.drawImage(toolArt.hopper,spitting?345:0,0,345,337,-165*k,-200*k,345*k,337*k);}else{ctx.fillStyle='#7a5530';ctx.fillRect(-16,-16,32,26);ctx.fillStyle='#3a2a1a';ctx.fillRect(-11,-12,22,14);ctx.fillStyle='#8a6a42';ctx.fillRect(14,-6,10,10);}
  ctx.restore();
  // outlet arrow (always upright), so the direction reads at any zoom
  const o=window.GroundPhysics?GroundPhysics.DIRS[h.dir]:{x:1,y:0},m=32;ctx.strokeStyle=invalid?'#ec9b80':'#ffe295';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(o.x*(m-8),o.y*(m-8));ctx.lineTo(o.x*m,o.y*m);ctx.lineTo(o.x*(m-5)-o.y*4,o.y*(m-5)+o.x*4);ctx.moveTo(o.x*m,o.y*m);ctx.lineTo(o.x*(m-5)+o.y*4,o.y*(m-5)-o.x*4);ctx.stroke();
  ctx.restore();if(invalid){ctx.strokeStyle='#ec9b80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,22,0,Math.PI*2);ctx.stroke();}}
 function drawDevices(ctx,s){const now=s.factory.time||0;
  for(const h of s.camp.hoppers){const on=marked('hopper',h.key),st=window.SupplyFactory?.hopperState?.(h.key);if(on||deviceMode==='hopper')drawHopperRange(ctx,h,on?.8:.35);if(on){ctx.fillStyle='#ffd86688';ctx.beginPath();ctx.arc(h.x,h.y,24,0,Math.PI*2);ctx.fill();}drawHopper(ctx,h,{spitting:!!st&&now-st.lastOut<.3});}
  for(const f of s.camp.fences){if(marked('fence',f.key)){ctx.strokeStyle='#ffd866';ctx.lineCap='round';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(f.a.x,f.a.y);ctx.lineTo(f.b.x,f.b.y);ctx.stroke();ctx.lineCap='butt';}drawFence(ctx,f);}
  for(const b of s.camp.blowers){const strong=!!window.GroundPhysics&&GroundPhysics.boostFactor(b,now)>1;drawFan(ctx,b,strong);if(marked('blower',b.key)){ctx.fillStyle='#ffd86688';ctx.beginPath();ctx.arc(b.x,b.y,22,0,Math.PI*2);ctx.fill();}drawBlower(ctx,b,strong);
   // Remaining strong wind as a ring gauge around the body (22 screen px, 3 px), flashing white at the limit.
   if(strong){const z=window.ArmyView?.camera?.scale||1,left=Math.max(0,b.boostUntil-now),share=Math.min(1,left/GroundPhysics.PARAMS.boostMax),flash=b.flashAt!=null&&visualTime-b.flashAt<.15;ctx.lineWidth=3/z;ctx.strokeStyle='#1d3a4f88';ctx.beginPath();ctx.arc(b.x,b.y,22/z,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=flash?'#ffffff':'#bfe8ff';ctx.beginPath();ctx.arc(b.x,b.y,22/z,-Math.PI/2,-Math.PI/2+Math.PI*2*share);ctx.stroke();}}
  if(railDraft&&deviceMode==='hopper'&&devicePreview){const h={...devicePreview,dir:hopperDir},bad=s.factory.inventory.wood<HOPPER_COST.wood||s.factory.inventory.stone<HOPPER_COST.stone||!hopperFits(h);drawHopperRange(ctx,h,.85,bad);drawHopper(ctx,h,{preview:true,invalid:bad});}
  else if(railDraft&&deviceMode&&deviceMode!=='loader'&&devicePreview){if(deviceMode==='blower'){const b={...devicePreview,dir:blowerDir},bad=s.factory.inventory.wood<BLOWER_COST||!blowerFits(b);drawFan(ctx,b,false,.8);drawBlower(ctx,b,false,true,bad);}else{const d=draftDevice();if(d){const bad=s.factory.inventory.wood<GroundPhysics.fenceCost(d)||!fenceFits(d);drawFence(ctx,d,true,bad);}else{ctx.strokeStyle='#ffe49a';ctx.setLineDash([4,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(devicePreview.a.x,devicePreview.a.y);ctx.lineTo(devicePreview.b.x,devicePreview.b.y);ctx.stroke();ctx.setLineDash([]);}}}}
 function drawUnder(ctx,{ox,oy,z}){
  if(!booted)return;const s=state();if(!s)return;ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);
  for(const link of s.camp.links){const node=s.factory.nodes.find(n=>keyEqual(n.key,link.nodeKey)),points=link.points?.length>1?ConveyorCore.oriented(link):node?[HOME,{x:node.x,y:node.y+12}]:null;if(!points)continue;if(!link.points)link.points=points;if(marked('belt',link.nodeKey)){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#ffd866';ctx.lineWidth=37;strokePath(ctx,points);ctx.lineCap='butt';ctx.lineJoin='miter';}for(let i=1;i<points.length;i++)railSegment(ctx,points[i-1],points[i]);const end=points[0],connected=ConveyorCore.distance(end,HOME)<60||!!ConveyorCore.downstream(s.camp.links,end,link)||!!ConveyorCore.platformAt(s.camp.platforms,end);if(!connected){ctx.fillStyle='#dc9c64';ctx.strokeStyle='#3b302a';ctx.lineWidth=2;ctx.fillRect(end.x-7,end.y-7,14,14);ctx.strokeRect(end.x-7,end.y-7,14,14);ctx.fillStyle='#513a2b';ctx.fillRect(end.x-3,end.y-4,2,8);ctx.fillRect(end.x+2,end.y-4,2,8);}}
  drawPulse(ctx);
  for(const f of folding){const t=f.age/FOLD;ctx.globalAlpha=1-t*.6;if(f.points){const part=partPath(f.points,1-t);for(let i=1;i<part.length;i++)railSegment(ctx,part[i-1],part[i]);}else{ctx.save();ctx.translate(f.platform.x,f.platform.y);ctx.scale(1-t,1-t);ctx.translate(-f.platform.x,-f.platform.y);drawPlatform(ctx,f.platform);ctx.restore();}ctx.globalAlpha=1;}
  for(const platform of s.camp.platforms){if(marked('platform',platform.key)){ctx.fillStyle='#ffd866';ctx.fillRect(platform.x-platform.w/2-5,platform.y-platform.h/2-5,platform.w+10,platform.h+10);}drawPlatform(ctx,platform);}if(platformMode&&platformPreview)drawPlatform(ctx,{...platformPreview,w:96,h:64,dir:platformDir,invalid:s.factory.inventory.wood<8||s.factory.inventory.stone<4||!platformFits(platformPreview)},true);drawDevices(ctx,s);drawProjects(ctx,s);if(railDraft){if(railDraft.points.length>1){ctx.globalAlpha=.7;for(let i=1;i<railDraft.points.length;i++)railSegment(ctx,railDraft.points[i-1],railDraft.points[i]);ctx.globalAlpha=1;if(beltPrice()>s.factory.inventory.wood){ctx.strokeStyle='#ec9b80';ctx.lineWidth=5;ctx.setLineDash([6,5]);ctx.beginPath();railDraft.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}}}
  ctx.restore();
 }

 function cargoArt(ctx,cargo,x,y,z){window.SupplyFactory?.drawItem?.(ctx,cargo.type,x,y,Math.max(20*z,10));}

 function chip(ctx,text,x,y,color='#fff0bb',size=12){ctx.font='800 '+size+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(text).width+14;ctx.fillStyle='#17362cee';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-w/2,y-size*.8,w,size*1.6,6);else ctx.rect(x-w/2,y-size*.8,w,size*1.6);ctx.fill();ctx.fillStyle=color;ctx.fillText(text,x,y+1);ctx.textBaseline='alphabetic';}
 function drawGroundFx(ctx,{ox,oy,z},s){
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,X=x=>ox+x*z,Y=y=>oy+y*z;
  for(const f of fx){const t=Math.min(1,(visualTime-f.t0)/f.dur);ctx.save();
   if(f.kind==='ring'){// Entry ring, wind colour, 20 -> 36 px in 400 ms; a still ring for 600 ms with reduced motion.
    if(!reduced&&visualTime-f.t0>.4){ctx.restore();continue;}const r=reduced?28:20+16*Math.min(1,(visualTime-f.t0)/.4);ctx.globalAlpha=reduced?1:1-Math.min(1,(visualTime-f.t0)/.4)*.8;ctx.strokeStyle='#bfe8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(X(f.x),Y(f.y),r,0,Math.PI*2);ctx.stroke();}
   else if(f.kind==='trail'&&!reduced){ctx.globalAlpha=(1-t)*.9;ctx.strokeStyle='#e6f7ff';ctx.shadowColor='#bfe8ff';ctx.shadowBlur=6;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(X(p.x),Y(p.y)):ctx.moveTo(X(p.x),Y(p.y)));ctx.stroke();}
   else if(f.kind==='chain'){ctx.globalAlpha=Math.min(1,(1-t)*4);chip(ctx,tr('windChain')+f.n,X(HOME.x),Y(HOME.y-128),'#d6f0ff');}
   else if(f.kind==='caption'){ctx.globalAlpha=Math.min(1,(1-t)*4);chip(ctx,tr('windBy'),X(f.x),Y(f.y)-(reduced?0:t*10),'#d6f0ff',13);}
   else if(f.kind==='near'){// Stopped close: a yellow dot and an arrow toward the house.
    ctx.globalAlpha=Math.min(1,(1-t)*3);const x=X(f.x),y=Y(f.y),a=Math.atan2(Y(HOME.y)-y,X(HOME.x)-x);ctx.fillStyle='#ffd84a';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffd84a';ctx.lineWidth=2.5;const L=Math.min(46,Math.hypot(X(HOME.x)-x,Y(HOME.y)-y)-18),ex=x+Math.cos(a)*(8+L),ey=y+Math.sin(a)*(8+L);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*8,y+Math.sin(a)*8);ctx.lineTo(ex,ey);ctx.lineTo(ex-Math.cos(a-.5)*7,ey-Math.sin(a-.5)*7);ctx.moveTo(ex,ey);ctx.lineTo(ex-Math.cos(a+.5)*7,ey-Math.sin(a+.5)*7);ctx.stroke();}
   else if(f.kind==='streak'&&!reduced){// Only logs that were in the fan at the press: flow lines behind them for 300 ms.
    const d=f.drop;if(s.factory.drops.includes(d)){ctx.globalAlpha=1-t;ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1.5,2*z);for(const k of [-1,0,1]){const nx=-f.dy*k*5*z,ny=f.dx*k*5*z,x=X(d.x)+nx,y=Y(d.y)-6*z+ny;ctx.beginPath();ctx.moveTo(x-f.dx*8*z,y-f.dy*8*z);ctx.lineTo(x-f.dx*(22-k*k*5)*z,y-f.dy*(22-k*k*5)*z);ctx.stroke();}}}
   else if(f.kind==='puff'){// Empty fan: grey smoke drifting out of the blower.
    const d=GroundPhysics.DIRS[f.dir];ctx.globalAlpha=(1-t)*.6;ctx.fillStyle='#a8aaa3';for(const k of [0,1,2]){const r=(5+k*3+t*8)*z,dist=(18+k*9+t*14)*z;ctx.beginPath();ctx.arc(X(f.x)+d.x*dist+(k-1)*4*z,Y(f.y)+d.y*dist-(k%2)*4*z,r,0,Math.PI*2);ctx.fill();}}
   ctx.restore();}
  // The promise, then the record: "Preview 4/8" for 3 s after placing, then "3/4 delivered" for about a minute.
  const tally=window.SupplyFactory?.groundTally,b=tally&&s.camp.blowers.find(b=>keyEqual(b.key,tally.blowerKey)),now=s.factory.time;
  if(b&&tally.total&&now<tally.until){const x=X(b.x),y=Y(b.y)+Math.max(26,30*z);if(now-tally.start<3)chip(ctx,tr('predicted')+tally.predicted+' / '+tally.total,x,y,'#bcf2a5',11);else if(tally.produced)chip(ctx,tally.delivered+' / '+tally.produced+tr('tally'),x,y,'#d6f0ff',11);}

 }
 function drawOver(ctx,view){
  if(!booted)return;const s=state();if(!s)return;const {ox,oy,z}=view;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  ctx.save();window.LoaderDevice?.draw(ctx,view);if(railDraft&&deviceMode==='loader'&&devicePreview)window.LoaderDevice?.drawPreview(ctx,view,devicePreview);
  // Keep selectable fans legible through foliage. Freedom under a canopy must not make the tool disappear.
  for(const b of s.camp.blowers){const occluded=s.factory.nodes.some(n=>nodeTapArea(n,b)&&b.y<n.y),chosen=picked?.kind==='blower'&&keyEqual(picked.key,b.key);if(!occluded&&!chosen)continue;ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);ctx.globalAlpha=occluded&&!chosen ? .75 : 1;drawBlower(ctx,b,GroundPhysics.boostFactor(b,s.factory.time)>1);ctx.strokeStyle='#ffe59a';ctx.lineWidth=Math.max(1.5,1.5/z);ctx.beginPath();ctx.ellipse(b.x,b.y,16,9,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  // Selection affordances stay in front of allies even when the hopper sprite is behind a lumberjack.
  const selectedHopper=picked?.kind==='hopper'?s.camp.hoppers.find(h=>keyEqual(h.key,picked.key)):null;
  if(selectedHopper){const h=selectedHopper,o=GroundPhysics.DIRS[h.dir],x=ox+h.x*z,y=oy+h.y*z,m=Math.max(17,32*z);ctx.save();ctx.strokeStyle='#ffe295';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(x,y,Math.max(13,24*z),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(x+o.x*(m-8),y+o.y*(m-8));ctx.lineTo(x+o.x*m,y+o.y*m);ctx.lineTo(x+o.x*(m-5)-o.y*4,y+o.y*(m-5)+o.x*4);ctx.moveTo(x+o.x*m,y+o.y*m);ctx.lineTo(x+o.x*(m-5)+o.y*4,y+o.y*(m-5)-o.x*4);ctx.stroke();ctx.restore();}
  for(const cargo of s.camp.cargo){
   const t=clamp(cargo.progress||0,0,1),onRail=railCargo(cargo),ease=onRail?t:1-Math.pow(1-t,2);
   const p=onRail&&cargo.path?.length>1?RailCore.at(cargo.path,t):{x:cargo.from.x+(HOME.x-cargo.from.x)*ease,y:cargo.from.y+(HOME.y-cargo.from.y)*ease},x=p.x,y=p.y;
   cargoArt(ctx,cargo,ox+x*z,oy+y*z-(onRail||reduced?0:Math.sin(t*Math.PI)*14*z),z);
  }
  if(railDraft&&!platformMode&&!deviceMode){const handles=[BELT_PORT,...s.camp.links.filter(l=>l.points?.length).map(l=>ConveyorCore.oriented(l).at(-1))];for(const p of handles){const x=ox+p.x*z,y=oy+p.y*z,r=Math.max(15,24*z);ctx.fillStyle='#45623bea';ctx.strokeStyle='#ffe9a2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff1b0';ctx.font='bold '+Math.max(19,23*z)+'px system-ui';ctx.textAlign='center';ctx.fillText('↔',x,y+7);}}
  if(drag){const rect=document.getElementById('armyCanvas').getBoundingClientRect();for(let i=0;i<drag.items.length;i++){const item=drag.items[i],geometry=window.SupplyFactory?.itemGeometry?.(item.drop),h=geometry?.h||Math.max(20*z,10);const full=drag.items.length>=handCapacity(),x=drag.x-rect.left+(drag.offset?.x||0)+i*(h+3),y=drag.y-rect.top+(drag.offset?.y||0);if(full){ctx.save();ctx.shadowColor='#ffd866';ctx.shadowBlur=5;for(let k=0;k<3;k++)window.SupplyFactory?.drawItem?.(ctx,item.drop.type,x,y,h);ctx.restore();}else window.SupplyFactory?.drawItem?.(ctx,item.drop.type,x,y,h);}}
  if(drag){ctx.strokeStyle=drag.over?'#fff2a6':'#e6ce82';ctx.fillStyle=drag.over?'#efd77b35':'#efd77b12';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.roundRect(ox+(HOME.x-57)*z,oy+(HOME.y-94)*z,114*z,109*z,8);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=drag.over?'#e8ffad':'#ffe4a0';ctx.lineWidth=3;const ix=ox+(HOME.x+43)*z,iy=oy+(HOME.y-12)*z;for(const n of [0,12]){ctx.beginPath();ctx.moveTo(ix+n+6,iy-6);ctx.lineTo(ix+n,iy);ctx.lineTo(ix+n+6,iy+6);ctx.stroke();}}
  if(houseFlash){ctx.fillStyle='#f8d77a'+Math.round(houseFlash/.42*100).toString(16).padStart(2,'0');ctx.beginPath();ctx.ellipse(ox+HOME.x*z,oy+(HOME.y-4)*z,26*z,10*z,0,0,Math.PI*2);ctx.fill();}
  notices.forEach((n,i)=>{
   ctx.globalAlpha=Math.min(1,(1.1-n.age)*3);ctx.font='800 '+Math.max(12,14*z)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#25362b';ctx.fillStyle='#ffe7a0';
   const text=(n.wind?'≋ ':'')+'+'+format(n.count)+' '+(n.type==='gold'?'G':tr(n.type)),x=ox+HOME.x*z,y=oy+(HOME.y-95)*z-(reduced?0:n.age*17)-i*18;if(n.wind)ctx.fillStyle='#d6f0ff';
   ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
  });
  if(picked||pickHighlight){ctx.font='800 '+Math.max(11,13*z)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';for(const [kind,list] of [['belt',s.camp.links],['platform',s.camp.platforms]])for(const item of list){const key=kind==='belt'?item.nodeKey:item.key,p=kind==='belt'?(item.points?.length>1?midpoint(ConveyorCore.oriented(item)):null):{x:item.x-item.w/2+12,y:item.y-item.h/2+12};if(!p)continue;const x=ox+p.x*z,y=oy+p.y*z,on=marked(kind,key),r=Math.max(9,11*z);ctx.fillStyle=on?'#ffd866':'#1f3a2bdd';ctx.strokeStyle=on?'#4a3818':'#d9b866';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=on?'#2b2412':'#ffedb6';ctx.fillText(String(key),x,y+1);}ctx.textBaseline='alphabetic';}
  const hinted=removeHint&&!picked&&s.camp.links.find(l=>keyEqual(l.nodeKey,removeHint.key));if(hinted?.points?.length>1){const p=midpoint(ConveyorCore.oriented(hinted)),text=tr('removeHint'),x=ox+p.x*z,y=oy+p.y*z-Math.max(20,24*z);ctx.font='700 12px system-ui';const w=ctx.measureText(text).width+14;ctx.globalAlpha=Math.min(1,(removeHint.until-visualTime)*2);ctx.fillStyle='#1f3a2bee';ctx.strokeStyle='#d9b866';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-w/2,y-10,w,20,6);ctx.fill();ctx.stroke();ctx.fillStyle='#ffedb6';ctx.textAlign='center';ctx.fillText(text,x,y+4);ctx.globalAlpha=1;}
  drawGroundFx(ctx,view,s);drawUnlockBanner(ctx,view);
  if(continuation&&visualTime<continuation.until&&s.camp.links.some(l=>keyEqual(l.nodeKey,continuation.key)&&ConveyorCore.distance(l.points.at(-1),continuation.point)<1)){
   const x=ox+continuation.point.x*z,y=oy+continuation.point.y*z;ctx.strokeStyle='#ffe295';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();chip(ctx,tr('continueHere'),x,y-25,'#ffe295',11);
  }
  ctx.restore();positionPick(view);if(placementChoice)positionContext(placementCard,placementChoice.point,view);
 }
 function positionContext(card,anchor,{ox,oy,z}){
  if(!card||card.hidden)return;const field=document.getElementById('field'),canvas=document.getElementById('armyCanvas');if(!field||!canvas)return;const rect=field.getBoundingClientRect(),view=canvas.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight,ax=view.left-rect.left+ox+anchor.x*z,ay=view.top-rect.top+oy+anchor.y*z,gap=Math.max(30,22*z),x=clamp(ax-w/2,8,rect.width-w-8),y=clamp(ay-gap-h>=8?ay-gap-h:ay+gap,8,rect.height-h-8);card.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
 }
 function positionPick(view){
  if(pickHighlight&&!overlay?.classList.contains('on'))pickHighlight=null;if(!pickCard)return;if(picked&&(window.BattleControl?.placement||!pieceOf(state(),picked))){picked=null;syncPick();}if(picked)positionContext(pickCard,picked.anchor,view);
 }
 function hitHouse(point){
  if(railDraft)return true;
  if(!booted||!point)return false;
  const hit=Math.abs(point.x-HOME.x)<=58&&point.y>=HOME.y-94&&point.y<=HOME.y+15;
  if(hit)openWorkshop();return hit;
 }
 function boot(){
  const s=state();if(!s)return false;booted=true;document.body.classList.add('outpost-game');makeDOM();makeWorkshop();installDrag();installRails();installPick();window.addEventListener('harvestskill:beltpulse',startPulse);syncDOM();return true;
 }
 function guide(){
  const s=state();if(!s)return '';
  if(railDraft)return tr(deviceMode==='loader'?'loaderHint':deviceMode==='blower'?'blowerHint':deviceMode==='hopper'?'hopperHint':deviceMode==='fence'?'fenceHint':platformMode?'platformHint':'freeBeltHint');
  if(!conveyorUnlocked()&&!s.camp.links.length)return tr(s.camp.blowers.length?'blowGuide':'firstBlower');
  if(!s.camp.links.length&&s.factory.inventory.wood>=1)return tr('firstRail');
  if(s.camp.links.length)return tr('bothRails');
  if(railExists('wood')&&railExists('stone'))return tr('bothRails');
  return drag?tr('beltFeed'):s.camp.cargo.length?tr('inTransit'):tr('clickPile');
 }
 return {undoBuild:undoBelt,loaderAt,canPlaceLoader:loaderFits,placeLoader,get selection(){return picked?{kind:picked.kind,key:picked.key}:null;},get selectionLabel(){const piece=pieceOf(state(),picked);return piece?removeLabel(piece):'';},selectAt:point=>select(pickAt(point)),clearSelection,removePiece,get canUndo(){return beltHistory.length>0;},cancelCarry:()=>endDrag(null,true),cancelGesture:cancelBeltGesture,get placementChoice(){return placementChoice?{kind:placementChoice.kind,point:{...placementChoice.point}}:null;},confirmPlacement,get buildingKind(){return railDraft?(deviceMode||(platformMode?'platform':'belt')):null;},buildDevice,boostBlower,blowerAt:p=>blowerAt(p),hopperAt:p=>hopperAt(p),placeHopper:point=>placeHopper(point),canPlaceHopper:p=>hopperFits(p),get hopperDir(){return hopperDir;},get unlockShown(){return !!state()?.camp.conveyorUnlockSeen;},get unlockBannerActive(){return !!unlockBanner;},groundNearMiss,get groundFx(){return fx.map(f=>({kind:f.kind,age:+(visualTime-f.t0).toFixed(2),...(f.n?{n:f.n}:{})}));},get limits(){return {blowers:MAX_BLOWERS,fences:MAX_FENCES,hoppers:MAX_HOPPERS,beltLength:ConveyorCore.MAX_LENGTH};},placeBlower:point=>placeBlower(point),placeFence:draft=>placeFence(draft),canPlaceBlower:p=>blowerFits(p),canPlaceFence:f=>!!window.GroundPhysics&&GroundPhysics.fenceValid(f)&&fenceFits(f),get blowerDir(){return blowerDir;},get draftDevice(){return draftDevice();},get conveyorUnlocked(){return conveyorUnlocked();},receiveGround:arrivals=>{const s=state();if(s)receive(s,arrivals,true);},hitDevice:p=>hitDevice(p),catalogHTML,boot,tick,quote,build,isTransported:d=>d.onConveyor===true||!!ConveyorCore.contact(state().camp.links,d)||!!ConveyorCore.platformAt(state().camp.platforms,d),onBelt:d=>!!ConveyorCore.contact(state().camp.links,d)||!!ConveyorCore.platformAt(state().camp.platforms,d),beltAt:p=>ConveyorCore.contact(state().camp.links,p),platformAt:p=>ConveyorCore.platformAt(state().camp.platforms,p),prepareForRaid:()=>{clearSelection();stopRails();endDrag(null,true);},beginRail:buildRail,beltStartAt:p=>beltStart(p),dragBeltTo:p=>dragBelt(p),get beltCapped(){return !!railDraft?.capped;},buildPlatform,commitRails,cancelRails:stopRails,removeRail,get layingRails(){return !!railDraft;},get draftRoute(){return railDraft?{points:railDraft.points.map(p=>({...p})),cost:beltPrice()}:null;},get dragging(){return !!drag;},isHeld:heldDrop,canBuild,canStartWave,get tools(){return {...state().camp.tools};},get campaignReadyWave(){const c=state().camp;return !c.tools.wood&&!c.tools.stone?3:!c.gate?6:!c.beacon?8:9;},get nextProject(){return nextProject();},drawUnder,drawOver,pickup,openWorkshop,hitHouse,get ready(){return booted;},get hasWoodRail(){return railExists('wood');},get hasStoneRail(){return railExists('stone');},get guide(){return guide();}};
})();
