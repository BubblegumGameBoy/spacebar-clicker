# M3 地面の物理 — 第1段階メモ（純関数の中核と数値決め）

対象：`2/ground-physics.js`（`window.GroundPhysics` / `module.exports`）、`test/ground-physics.test.cjs`（12件）、`tools/sim_ground_logistics.cjs`。
既存の `2/` のファイルはまだ一切変えていない。組み込み手順は最後の節を参照。

## 1. 物理の中核（`2/ground-physics.js`）

- 資材 `{x,y,vx,vy}`。固定刻み `DT=1/30`。`step(world,item,now)` は新しいオブジェクトを返す（入力は変えない）。状態は `delivered`（受け口に入った）/ `belt`（ベルトに触れた → `ConveyorCore.step` へ渡す）/ `moving` / `rest`。
- `stepAll(world,items,now,dt,skip)` は items をその場で更新し、`{delivered,belt,moving}` を返す。**資材を消したり増やしたりはしない**（納品時の配列からの削除は呼び出し側）。
- `fixedSteps(acc,frameDt)` は描画フレームの dt から固定刻みの回数と余りを返す（1/60・1/144・1/30 のフレームで同じ結果になることをテスト済み）。
- 1刻み：送風の加速度 → 摩擦（`速さ×(1−0.4·dt) − 30·dt`）→ 速さ6未満かつ送風の外なら停止 → 3px以下の小刻みで移動し、毎回 受け口判定 → 衝突 → ベルト判定。
- 衝突：木・岩は円（`radius`＋資材半径6）、柵は線分（太さ±2＋6、両端は丸い）、送風機の本体は円（半径12）、倉庫は**屋根の部分だけ**の矩形 `{left:42,right:158,top:246,bottom:300}`、画面の端は壁 `{8,96,952,532}`。衝突は押し出して、壁に向かう速度成分だけを消す（壁に沿って滑る、跳ね返らない）。
  - 倉庫の矩形を `houseContains`（x±58, y 246〜355）そのままにすると、半径60の受け口が右側でほぼ隠れて届かなくなる。だから受け口の判定を衝突より先に行い、壁は屋根だけにした。
- 資材どうしは衝突しない。乱数なし（テストで `Math.random` を例外にして確認）。
- 送風機 `{x,y,dir,boostUntil}`：`dir` は8方向（0=右、時計回り。`DIRS[k]`）。扇形（半径90、角度50°）の中の資材に、**送風機から離れる向き（放射方向）**の加速度。強さは本体で600、縁で45%まで直線的に弱まる。放射方向なので扇の端の資材は斜めに飛び、柵で寄せる余地ができる。
- 強風：`tapBlower(blower,now)` が新しい `boostUntil` を返す。1回目は now+3秒、強風中に押すたび +1秒、ただし now+5秒が上限。`boostFactor` は強風中2倍。時刻は引数で渡す（`s.time` を使う想定）。
- 誘導柵：`fenceValid`（長さ24〜120）、`fenceCost`（24ごとに木材1、`ceil`）、`clampFence(a,b)`（ドラッグ方向に沿って長さを丸める）。
- 予告：`predict(world,start,{maxSteps=900,boost=false})` → `{status:'warehouse'|'stopped'|'belt'|'timeout', end, path, steps, time, pinned?}`。`step` と同じ関数・同じ刻みで計算する。強風は手で押すものなので、既定では強風なしで予告する。扇の中で壁に押しつけられて15刻み動かない資材は `stopped`（pinned）。
- キャッシュ：`createPredictor(limit=256)`。`signature(world)`（params・木岩・柵・送風機の位置と向き・倉庫・境界。**強風の時刻は含めない**）が変わったら全部捨てる。開始点は0.01px単位でキー化。`world.belt` 関数がある時はキャッシュしない（ベルトの形は関数から読めないため。組み込み時は署名に `camp.links/platforms` を足して渡す案を推奨）。
- 落下点（乱数なし）：
  - `handDropPoint(node,index,count=4)`：手で採った丸太。`outputPort`（node+72,+28）を基準に5か所の候補 `HAND_SPOTS` から `count`（3〜5）か所を、`index*stride % count`（stride は count と互いに素）の順に使う。連続する2打は必ず違う場所。
  - `workerDropPoint(base,index,count=8)`：木こり用。`outputForWorker` の点を基準に半径約10の7か所＋少し転がった1か所（+2,+26）。**これは計画にない追加の提案**：木こりの丸太が全部同じ1点に落ちると、送風機の結果が「全部届く／全部届かない」の二択になり、3〜5割という段階が作れなかった（シミュレーションで確認）。directorの判断を仰ぎたい。

## 2. シミュレーション（`node tools/sim_ground_logistics.cjs`、約100秒）

前提（コードから写した値）：木 (280,300)(470,300)、岩 (330,395)(490,395)、倉庫 HOME (100,340)、受け口半径60（`outpost-camp.js` state()、`conveyor-core.js`）。木こりの位置は `battle-control.js` spots() の候補式（黄金角、半径61±2、木から64以内、木の矩形を避ける）で、各木の最初の3か所。落下点は `outputForWorker`（木こり位置 ±24, +24）＋上記の8か所の散らし。木こりの間隔は `OutpostCore.stats` の 5 / 2.5 / 1.5 秒（道具0/1/2段）。
送風機は格子6px×8方向を総当たり（倉庫から75以上、木・岩から半径+20以上、落下点から20以上）。柵は16px格子×8角度×長さ48/72/96/120から1本ずつ貪欲に足し、最後に送風機を置き直す。**総当たりで見つけた最良の配置**であり、プレイヤーが普通に置いた時はこれより下がる。

### 結果（仮の数値＝下の「決めた値」）

| 木こりの位置 → 落下点（倉庫まで） | (a) 送風機1台 | (b) ＋柵1本 | (b) ＋柵2本 | 60秒の納品数 a/b（5s・2.5s・1.5s） |
|---|---|---|---|---|
| 木1右 (340,308) → (364,332)（265px） | **50%** 送風機(405,322)← | 63% 柵(348,340)-(392,358) | 63% | 6/7.5・12/15・20/25 |
| 木2左下 (414,329) → (390,353)（291px） | **50%** (419,349)← | 75% 柵(380,361)-(424,379) | 75% | 6/9・12/18・20/30 |
| 木2左上 (416,275) → (392,299)（295px） | **25%** (421,301)← | 75% 柵(460,259)-(371,296) | **88%** ＋柵(172,355)-(292,355) | 3/10.5・6/21・10/35 |
| 木1左上 (223,282) → (199,306)（105px） | 88% (246,278)↙ | 100% | 100% | 10.5/12・… |
| 木1左下 (226,328) → (202,352)（103px） | 100% (261,366)← | 100% | 100% | 12/12・… |
| 木2右 (529,316) → (553,340)（453px） | 0% | 0% | 0% | 0（送風機1台では届かない） |

(c) 手で採った丸太（4か所に散らし）に送風機1台：木1 **25%**（送風機(352,351)←、4か所のうち扇に入るのは1〜2か所。届かなかった丸太は元の位置か途中で止まる）。柵2本を足しても25%（扇に入らない丸太は動かないので柵では救えない）。木2は0%（倉庫まで約440px）。

- 「遠い落下点（260〜300px）」では帯に入った：送風機1台で25〜50%、柵を足すと63〜88%、100%にはならない。
- **倉庫に近い落下点（木1の左、約105px）は送風機1台でほぼ100%**。どの数値でも、受け口半径60に対して40px押すだけなので不完全にはならない。導入の「送風機で木こりの丸太を倉庫へ」の最初の成功体験には向くが、「柵で取りこぼしを減らす」の段は木2か木1右でないと成立しない。導入の案内で木2を指す、または近い場所を許すかをdirectorが決める。
- 木2右（450px）は送風機2台の中継が要る（今回は未測定）。
- 60秒の数は「落ちた数×到達率」。届かなかった分は地面に残るので、地面の上限12だと送風機1台・50%で約2分で満杯になり、木こりの採集がはじかれる（既存の `take()` の判定どおり）。取りこぼしを手で拾う動機になる。

### 調整の経過（`--quick` の粗い格子）
- 最初の値（加速度420・摩擦1.6/45）は遠い落下点に全く届かなかった（0%）。
- 散らし半径±18程度だと、扇に入らない丸太が残り、柵では救えない（柵は動いている資材しか曲げない）。散らしを半径約10に縮め、1本だけ転がす形にした。
- 加速度600/900 × 線形摩擦0.4〜1.3 × 定数摩擦15〜35 を比較。0.4/30 が「1台で約半分、柵で7〜9割」に最も近い。半径100にすると木1右が63%→88%に上がり帯の上へ出るので、計画どおり90のまま。角度60°は結果がほぼ同じ。

### 性能（このサーバのNode）
- 地面240個がすべて動いている状態（送風機2・柵4・木岩4）：**1刻み約0.84ms**（30Hzなので1秒あたり約25ms。スマホのCPU4倍減速で1刻み約3.4ms見込み）。
- 予告1回：キャッシュなし **約0.1ms**、キャッシュあり約0.005ms。送風機・柵の配置中にポインタが動くたび数点を予告しても余裕がある。

## 3. 決めた仮の数値（`GroundPhysics.PARAMS`）

送風機：半径90、角度50°、加速度600（縁で45%）、本体半径12、費用 木材4（計画どおり）。強風：2倍、3秒、強風中の押下で+1秒、上限5秒。
摩擦：線形0.4/秒、定数30px/秒²、停止の閾値6px/秒。資材の当たり半径6。柵：長さ24〜120、太さ4、24ごとに木材1。受け口半径60。

## 4. 地面の上限・溢れ（既存の扱いとの整合）

- 上限は `supply-factory.js` の `groundCapacity()`（`HarvestSkillCore.effects().groundCapacity`、12→24→…→240）で、`take()`（121行）が `s.drops.length>=groundCapacity()` の時に採集をはじく（資材は消えない、`capacityMessage`）。`SupplyCore.drop` も `looseLimit(capacity)` で同じ判定。
- 動いている資材も `s.factory.drops` の中にいるので、そのまま数に入る。物理は配列の要素を足さず消さず（テスト済み）、納品で減るのは `receive` と同じ扱い。上限の判定は変えなくてよい。
- 保存は位置だけ：`SupplyCore.migrate` の drops は x,y,type,count,worker,onConveyor,physical,beltId,source だけを残すので、`vx/vy` は再読込で自然に消えて速度0になる（テスト済み）。
- `legacyLoose` の展開（`unpackLegacy`）も上限内でしか出さないので影響なし。

## 5. 組み込み手順（既存ファイルのどこへ何を足すか）

### index.html
- 2096行 `supply-factory.js` の前に `<script src="ground-physics.js?v=...">` を足す。

### game-core.js（保存）
- `migrateCamp`（15〜36行）は camp の項目を列挙して作り直しているので、`blowers:[{key,x,y,dir}]`（boostUntil は保存しない）と `fences:[{key,a,b,costWood}]` の検証付きコピーを足さないと、再読込で消える。座標は既存の `coordinate(value,960/540)` を使う。

### supply-factory.js
- `tick`（152行）：157行 `OutpostCamp.tick(dt)` の**前**に、outpostMode の時だけ固定刻みで物理を回す。
  `const f=GroundPhysics.fixedSteps(physicsAcc,dt);physicsAcc=f.rest;for(...f.steps) GroundPhysics.stepAll(world,s.drops,s.time,GroundPhysics.DT,skip)`
  - `world`：`{nodes:s.nodes, home:s.depot, blowers:S.camp.blowers, fences:S.camp.fences, belt:p=>!!ConveyorCore.contact(S.camp.links,p)||!!ConveyorCore.platformAt(S.camp.platforms,p)}`。配置が変わった時だけ `normalizeWorld` を作り直してキャッシュする。
  - `skip`：`d.airUntil>s.time`（落下中、121行で設定）、`OutpostCamp.isHeld(d)`、`d.onConveyor||d.beltId||d.platformKey`（ベルト上は `dispatch` が動かす）。
  - `delivered`：`s.drops` から取り除き、`OutpostCamp` の `receive(s,arrivals,true)` へ渡す（今は公開されていないので outpost-camp の return に足す）。`automatic=true` にすると導入の `automaticWood` にも数えられる。
  - `belt`：何もしなくてよい（同じフレームの `OutpostCamp.tick → dispatch` が `ConveyorCore.step` で拾う）。速度は0で返る。
- `take`（121行）：落下点。手の採集（`worker` でない）は `outpostDropPoint`（93〜97行）が `outputPort(node)` を返している所を `GroundPhysics.handDropPoint(node,node.handDrops=(node.handDrops||0)+1)` に。木こりは `outputForWorker(source,node)` を `workerDropPoint(その点, 木こりごとの連番)` に。連番は保存しなくてよい（再読込で0から始まるだけ）。`SupplyCore.migrate` は node の項目を列挙するので `handDrops` は保存されない。
- `reflowDrops`（98〜103行）と 154行の再配置は `d.physical` を飛ばしているので、物理で動く資材（take で physical=true）はそのまま。変更不要。
- `outputDeliveryStatus`（173〜176行）：今は ConveyorCore だけ。`manual`（ベルトに触れない）の時に `predictor.predict(world,point)` を引き、`warehouse` なら「送風で倉庫へ」、`stopped` なら止まる位置。キャッシュの署名に `camp.links/platforms` を足す。
- `drawOutputPreview`（178〜180行）：予告の `path` を点線、終点に丸、ラベル3言語を追加（例：送風で倉庫へ届く／ここで止まる）。送風機・柵の配置中（下記）も同じ描き方を使う。
- `draw`（212行）：動いている資材は `lift`（上下のゆれ）を0にする。`pileAt`（136行）は動いている資材も拾えてよい。

### outpost-camp.js
- `state()`（73行）：`s.camp.blowers??=[];s.camp.fences??=[];`。
- `catalogHTML`（36〜42行）：`['blower','🌀',送風機,木材4,説明]` と `['fence','╱',誘導柵,長さ24ごとに木材1,説明]` を足す（3言語）。計画6のとおり、章1クリア前はコンベア・受け土台を「章1クリアで解放」の鍵表示にする（M1担当の範囲と重なるので要調整）。
- `chooseEquipment`（292行）と `placement-controls.js` の `choose`（9行）：`'blower'`・`'fence'` を足す。
- 配置：送風機は `buildPlatform/placePlatform/platformFits`（277〜281行）と同じ形（押して仮置き→離して設置、置いた後↻で8方向）。柵は `beltStart` と `installRails` の pointer 処理（282〜301行）にならい、ドラッグの始点・終点を `GroundPhysics.clampFence` で丸めて1本。配置中は落下点（手の採集点・木こりの落下点）から `predict` した軌跡を描く。
- `drawUnder`（436〜443行）：platforms の後に柵（線）と送風機（木の箱と羽根、`fanPoints` で扇、強風中は色を変える）を描く。選択中は `marked(kind,key)` の黄色い縁取り。
- 盤面選択：`pickAt`（252〜257行）で `ConveyorCore.hitLink` の前に送風機（本体半径16）と柵（線分から10px以内）を当てる。`pieceOf`（249行）・`pieceName`（250行）・`removeLabel`（251行、返金は送風機2・柵 floor(cost/2) を `ConveyorCore.removalRefund` とは別に）・`removePiece`（264〜276行）・`syncPick`（259行、↻は受け土台と送風機に出す）・`turnPlatform`（263行、送風機は `dir=(dir+1)%8`）に kind `blower`/`fence` を足す。
- 強風の連打：送風機の本体のタップで `blower.boostUntil=GroundPhysics.tapBlower(blower,S.factory.time)`。今の `installPick`（305〜313行）はタップで選択するので、「タップ＝強風＋選択カード表示」にするか、選択済みの時だけ強風にするかを決める必要がある（未決）。資材・木・岩の当たりが優先（`pickAt` 冒頭と同じ順）。
- `endDrag`（344行〜）：地面へ戻す・土台へ置く資材は `vx=vy=0` にする。
- `dispatch`（373〜380行）：ベルトに乗った資材は `vx/vy` を消す。

### 導入（outpost-tutorial-core.js / outpost-tutorial.js）
- `OutpostTutorialCore.step`（7〜18行）：`workerDrop` の後の `belt`→`automatic` を、`blower`（`s.camp.blowers.length>0`）→`blowerDelivered`（送風で届いた木材 >0。`delivered()` に送風の印を足すか `automaticWood` を流用）→`fence`（`s.camp.fences.length>0`）に置き換える。既にコンベアを持つ旧セーブは `belt/automatic` を済みとして扱う分岐が必要（`test/onboarding-journey.test.cjs` の順序テストも更新）。
- `outpost-tutorial.js`：`content`（5〜19行）に3言語の文、`sync` の `selector`（43行）に `blower:'[data-equipment=blower]'`、`fence:'[data-equipment=fence]'`、`action`（26〜31行）で `PlacementControls.choose('blower'|'fence')`、`draw`（46〜51行）の対象 id に追加して、木こりの落下点からの予告線を出す。

## 6. 未決・directorへの確認事項
1. 木こりの落下の散らし（8か所、半径約10＋1本だけ転がる）を入れてよいか。入れないと送風機の結果が0%か100%の二択になる。
2. 倉庫に近い木こりの位置（木1の左）では送風機1台で100%になる。導入で遠い位置を案内するか、そのままにするか。
3. 送風機のタップを強風と選択のどちらに割り当てるか。
4. 手の採集の散らしの数（3〜5、既定4）を作業スキル「採集」の段で変えるかどうか。

## 決定（2026-10-26、ユーザーから判断を一任されたメイン担当が決定）

1. 木こりの丸太を落下点の周りに散らす（決定的な8か所）ことを採用する。散らさないと送風機の到達率が0%か100%の二択になるため。
2. 倉庫に近い木こりの位置（木1の左）で、送風機1台ならほぼ100%届くことは許す。良い位置を見つけた報酬として扱う。地図の拡張で資源を遠くし、そこで段階差を出す。
3. 送風機の本体をタップすると強風になる（連打の新しい使い道）。撤去や向きの変更は、長押し（約450ms）か右クリックで選択札を出して行う。搬送設備を選んでいるモードでは、タップでも選択できる。
4. コンベアの鍵表示（章1クリアまで）は、M2の修正が終わって outpost-camp.js の並行作業がなくなってから組み込む。

---

## 第2段階：ゲームへの組み込み（2026-10-26、実装担当）

### 変えたこと（`2/`）
- `ground-physics.js`：倉庫の壁を2つの矩形に（屋根 x42–158,y246–300 と、倉庫の札の下端 x36–164,y392–432）。受け口（半径60）は壁より先に判定するので正面からは届き、札の下に資材が隠れて止まらない。止まっていて押されていない資材は、受け口の中でも勝手に納品しない（古いセーブの山を吸わない）。予告のキャッシュは `shapeKey`（呼び出し側がベルトの形を渡す）があればベルト判定つきでも使う。衝突の前に外接矩形で早期に抜ける（結果は同じ）。
- `supply-factory.js`：`tick` で `OutpostCamp.tick` の前に固定刻み（1/30秒）の地面の物理を回す。落下中・手で持っている・ベルト/受け土台の上の資材は動かさない。届いた資材は `OutpostCamp.receiveGround`（`via:'blower'`）。落下点：手の採集は `handDropPoint`（4か所、木ごとの打数）、木こりは `workerDropPoint`（8か所、木こりごとの数）。予告：配置中の木こりの落下点に「送風で倉庫へ n / 8」と軌跡、送風機・柵の配置中は全作業場（木こり8か所・手の採集4か所）の軌跡を下書きの道具込みで描く。署名に `camp.links/platforms`。地面の資材が60個を超えたら資材の光彩（shadowBlur）を省く（240個で描画が重いため）。
- `outpost-camp.js`：送風機（木材4、↻で8方向）・誘導柵（ドラッグ、24〜120、24ごとに木材1）。盤面選択（`pickAt/pieceOf/removePiece/syncPick`）と工房の一覧に両方を追加、撤去は半額返却、直前の設置は全額で取り消し。送風機の本体タップ＝強風（`tapBlower`、ゲーム時刻 `S.factory.time`）、長押し450ms／右クリック＝選択札、設置モード中はタップで選択。木・岩のタップ範囲（+12）には送風機を置けない（そこではタップが採集になるため）。章1（Wave3勝利）まで、カタログのコンベア・受け土台に鍵（3言語）と `buildRail/buildPlatform` の拒否。既存のベルトは残して動かし、撤去札に「解放前のため敷き直せません」。古いセーブ（ベルトあり）には一度だけ「新しい道具」の通知。絵：`assets/tool-blower.webp`（右向きの絵を回転、左向き成分は左右反転してから回転、強風中は右のセル）・`assets/tool-fence.webp`（杭から杭までを繰り返し、最後に右の杭を1回）。扇形と風の筋を描く（強風で速く）。カードの選択でレイアウトが動いた直後のタッチの追いクリックが、下に来た「取り消す」を押してしまう問題を防いだ。
- `game-core.js`：`migrateCamp` に `blowers`（最大60）・`fences`（最大120、長さ24〜120以外は捨てる）・`logisticsVersion:2`・`legacyBelts`（版1でベルトを持つセーブ）・`newToolsSeen`。チュートリアルの `blownWood`。
- `outpost-tutorial-core.js` / `outpost-tutorial.js`：`workerDrop → blower（送風機を置く）→ blowerDeliver（送風で1本届く）→ fence（柵を置く）→ gather30/carry2 → defenders → ready`。送風での納品は `blownWood` に数え、ベルトの `automaticWood` とは分ける。ベルトの段階を過ぎた古いセーブ（`automaticWood>0` またはベルトあり）は送風機・柵の段階を出さない。
- `placement-controls.js`（送風機・柵のモード名とヒント）、`outpost.css`（カードの絵、鍵の表示）、`index.html`（`ground-physics.js` の読み込み）、`TOOL_ART.md`（切り出しの記録）。
- `tools/build_playtest.py`：`ground-physics.js` を公開物に追加（新しい画像は未追跡の assets として既存の仕組みでコピーされる）。

### 組み込み後のシミュレーション（同じ数値、置ける場所の規則が増えた後）
| 落下点 | (a) 送風機1台 | (b) +柵1本 | (b) +柵2本 |
|---|---|---|---|
| 木1右 (364,332) 265px | 50% | 63% | 63% |
| 木2左下 (390,353) 291px | 50% | 75% | 75% |
| 木2左上 (392,299) 295px | 13%（木のタップ範囲に置けなくなり最良の位置が消えた） | 13% | 13% |
| 木1左（2か所） | 75% / 100% | 100% | 100% |
| 木2右 453px | 0% | 0% | 0% |
手の採集（4か所）＋送風機1台：木1 25%、柵2本で50%。木2 0%。性能（Node、温まった後）：240個が動く1刻み 0.26ms、予告1回 0.06ms（キャッシュ 0.006ms）。最初の数千回はJIT前で約2.2ms。

### 実プレイ（`tools/qa_ground_journey.cjs`、新規 ?lesson=1、見える操作だけ、時間の加速なし）
QAスクリプトが操作したもので、人の手の速さではない。送風機・柵の位置は、画面の予告（n / 8）と同じ関数を読んで選んだ。木こりは木1の右（倉庫まで265px）に置いた。

| | PC（1280×900、マウス） | CDPタッチ（390×844、実機ではない） |
|---|---|---|
| 送風機1台の60秒（伐採5秒間隔＝12本） | 6本（予告 4/8） | 4本（予告 4/8） |
| 送風機＋柵の60秒 | 11本（柵2本、予告 7/8） | 8本（柵1本、予告 5/8） |
| 送風機・柵の数 | 1・2 | 1・1 |
| 手運び（ドラッグ）の回数 | 62 | 46 |
| 準備完了を押すまで | 188秒 | 194秒 |
| 初襲撃（準備完了の90秒後）| 278秒に開始、勝利（Wave1） | 285秒に開始、勝利 |
エラー0。PCは送風機＋柵で 6/12→11/12（50%→92%）、タッチは 4/12→8/12（33%→67%）。

### 準備済み試験
- 240個がすべて動く状態（`tools/qa_ground_perf.cjs`、?lab=1、送風機3・柵2、止まった資材は押し直す）：PC 58〜60fps（p95 16.8ms、平均236/240個が移動）。CPU4倍減速では PC 15〜18fps、スマホ表示 17〜19fps（同じ画面で資材0個は43〜45fps）。4倍減速での低下の大半は240個の描画で、止まった240個でも約21fps（M1/M2から同じ）。スマホ50fpsは地図の拡張（M8）の性能目標として残る。
- 3言語（`tools/qa_ground_i18n.cjs`、PCとタッチ）：カード・鍵・配置の案内・設置後の通知・選択札が各言語。
- 古いセーブ（`tools/qa_m3_legacy_save.cjs`）：公開中のM1/M2ビルドで実際にベルトを敷いて丸太を届けたセーブを、M3ビルドに読み込む。ベルトの形がそのまま、ベルトで納品が続く、カードは鍵、導入は送風機・柵を出さない（gather30）、通知は1回だけ、撤去札に「敷き直せません」。PC・タッチとも合格。
- 既存QA：`qa_harvest_skills` はそのまま合格。`qa_manual_rails` と `qa_unified_placement` は導入でコンベアを敷く流れだったため、M3の送風機・柵に置き換えた（盤面の撤去2入力、Escで選択解除、強風のタップ、柵の選択と撤去）。ベルトの盤面撤去は古いセーブの試験で確認。

### 未解決・注意
- 4倍減速の描画性能（上記）。
- 木2左上のように、木のタップ範囲の規則で送風機1台では届きにくい落下点がある。
- タッチの実機（CDPではない）での長押し・連打は未確認。
- 送風機・柵の絵は合計約1.2MB（ロスレス、縮小なし）。
