# ART_REQUESTS — codexへの画像依頼書

2026-10-26 director作成。依頼のタイミングは `dev/DIRECTOR_PLAN.md` の M8 完了時（Claude側の作業が一段落してから、ユーザーがまとめて依頼する）。
それまでは各マイルストーンで仮の絵（既存スプライトの色替え・canvasの付け足し）で動かす。依頼の前に、この表の「差し替え先」「仮の絵」が実装と合っているかを実装者が更新すること。

## 共通の約束（全項目）

- **画風**：ピクセルアート寄りの高精細2Dスプライト。濃い輪郭、土色・緑・くすんだ色。参照：`assets/expedition-atlas.webp`（農家・バリスタ・畑・麦束）、`assets/mob-rat.webp`（ネズミ）、`assets/mob-captain.webp`（頭領ネズミ）、`assets/forest-objects.webp`（木・岩・倉庫）。
- **背景**：完全な透明（alpha 0）。影は描かない（ゲーム側で描く）。文字・数量バッジ・枠線・「×」印を絵に入れない。
- **形式**：PNGで生成 → ロスレスWebPへ形式変換のみ（描き足し・切り貼り・色調整をしない）。RGBA。
- **セル**：指定の格子に1ポーズずつ。セルをまたがない。セルの端から最低24pxの余白。全ポーズの足元を同じベースライン（セル下端から約20%の高さ）に揃える。
- **向き**：敵は**左向き**（右から左へ歩く）。味方は**右向き**（ゲーム側で必要に応じ左右反転する）。
- **セルの読み方**：幅・高さが奇数でもよいが、ゲームはセル境界を `Math.round(col*W/cols)` で丸めて読む（`2/EXPEDITION_ART.md` 参照）。
- **納品記録**：各画像について、サイズ、各セルの不透明部分の矩形（alpha>48）、元の生成ファイルのパスを `2/EXPEDITION_ART.md` と同じ形式で書く。

## A. 敵（2×2の4セル、1536×1024px、セル768×512）

今のコードが実際に使うフレーム（`2/outpost.js` drawEnemy）：
- 0：歩き A、1：歩き B（交互に切り替え）
- 2：門の前（倉庫にたどり着いて箱を狙う姿勢。攻撃・かじる動作）
- 3：撃破（今は頭領だけが使う。通常の敵はフェードで消えるが、新種では使う予定なので全種描く）
- 被弾は専用フレームなし（コード側で横に揺らす）。

| id | 名前（日/英/中） | 外見の指示 | 体の高さの目安（ゲーム内） | 差し替え先 | 仮の絵 | 使うマイルストーン |
|---|---|---|---|---|---|---|
| shield | 盾持ちネズミ / Shield Rat / 持盾鼠 | `mob-rat` と同じ体格。前（左）に木と鉄の丸盾を構える。撃破では盾が割れて落ちる | 51（guardと同じ） | `assets/mob-shield.webp` | mob-rat＋canvasの盾 | M4 |
| bat | 夜コウモリ / Night Bat / 夜蝠 | 紫がかった灰色の大きなコウモリ。0と1は羽ばたきの上下、2は倉庫に取りつく、3は落下 | 36（地面から浮く。足元の位置＝影の位置） | `assets/mob-bat.webp` | mob-ratを紫に色替え＋canvasの翼 | M4 |
| ooze | 分裂粘菌 / Splitting Ooze / 分裂黏菌 | 黄緑の半透明の粘菌。中に小石が見える。3は2つにちぎれる瞬間 | 40 | `assets/mob-ooze.webp` | mob-ratを黄緑に色替え | M4 |
| oozelet | 小粘菌 / Oozelet / 小黏菌 | ooze を小さくした個体（同じ色・形で目が大きい）。別の画像で4セル | 22 | `assets/mob-oozelet.webp` | oozeの仮の絵を縮小 | M4 |
| mole | 穴掘りモグラ / Burrowing Mole / 掘地鼹鼠 | 大きな前足と爪、土で汚れた毛。0と1は歩き、2は爪で箱を掘る、3は倒れる。**追加で**地中の盛り土（土の小山）を別ファイル1セルで | 40 | `assets/mob-mole.webp`、盛り土 `assets/mob-mole-burrow.webp`（1セル、512×256） | mob-ratを焦げ茶に色替え／盛り土はcanvasの楕円 | M4 |
| shaman | 祈祷ネズミ / Rat Shaman / 鼠巫 | ぼろの頭巾、骨の杖、杖先に淡い緑の光。2は杖を掲げる（回復の姿勢を兼ねる） | 47 | `assets/mob-shaman.webp` | mob-ratを緑灰に色替え＋canvasの杖 | M4 |

## B. 頭領級（2×2の4セル、1448×1086px程度、`mob-captain.webp` と同じ構成）

| id | 名前 | 外見の指示 | 高さの目安 | 差し替え先 | 仮の絵 | 使うマイルストーン |
|---|---|---|---|---|---|---|
| toad | 大ガマ / Great Toad / 巨蟾 | 苔の生えた巨大なガマガエル。0と1は這う、2は跳躍の溜め（低く構える）、3は仰向けに倒れる | 100 | `assets/mob-toad.webp` | mob-captainを緑に色替え | M5 |
| boar | 鉄牙の猪 / Ironfang Boar / 铁牙野猪 | 鉄の板を打ちつけた鎧の猪、大きな牙。2は突進（頭を下げる）、3は横倒し | 95 | `assets/mob-boar.webp` | mob-captainを灰に色替え | M5 |
| envoy | 異界の使い / Envoy from Beyond / 异界使者 | 黒い翼と細い体の異形（元ゲームのナイトゴーントの系統だが、この作品の小さなピクセル画風で新しく描く）。浮いている | 120 | `assets/mob-envoy.webp` | 元ゲーム `assets/boss_nightgaunt.webp` を縮小表示（ファイルは変更しない） | M5 |

## C. 設備・資材

| 対象 | 形式 | 指示 | 差し替え先 | 仮の絵 | 使うマイルストーン |
|---|---|---|---|---|---|---|
| 製材台 / Sawbench / 锯木台 | 2×1の2セル（1024×512、セル512×512） | 0：待機（台・丸鋸・左に入口の受け口、右に出口の滑り台）、1：加工中（鋸が回り、おがくず）。斜め上から見下ろす、倉庫と同じ視点 | `assets/camp-sawbench.webp` | canvasの箱＋円 | M6 |
| 板 / Plank / 木板 | `forest-single-resources.webp` と同じ大きさの1セル（887×887程度） | 板1枚（明るい木目、短い）。束や数字にしない | `assets/resource-plank.webp` | 丸太を短く明るくcanvasで | M6 |
| 鉄鉱 / Iron ore / 铁矿 | 1セル（同上）＋鉱脈（地形）2×1（1024×512） | 赤錆色の鉱石1個／地面の鉱脈（岩に赤い筋） | `assets/resource-iron.webp`、`assets/node-iron.webp` | 石材・岩の色替え | M8 |
| 湿地の砦の地面 | 1枚 1672×941（今の作業場の背景 `assets/forest-clearing.webp` と同じ） | `assets/forest-clearing.webp` と同じ視点・明るさ・空と森の帯。3本の土の道（上・中・下、左端の倉庫へ合流）、水たまり、葦 | `assets/stage-marsh.webp` | forest-clearingの色替え | M8 |
| 配置杭（任意） | 2×1（512×256、セル256×256） | 0：作業員用（土に刺さった木の杭に金色の布）、1：防衛用（空色の布）。小さく、地面に置く印 | `assets/marker-stake.webp` | canvasの楕円＋肖像 | M1（任意） |

## D. 味方の上位職（M9）

既存の味方の形式に合わせる：待機1枚（例 `assets/unit_arch.png` 171×140）と攻撃の横並びシート（例 `assets/unit_arch_attack.png` 720×192）。攻撃シートのフレーム数・幅は実装時に元ゲームの `index.html` の `unitAnim("unit_arch_attack.png",...)` の引数を読んで確認し、ここへ書き足す（元ゲームのファイルは変更しない）。

| id | 名前 | 外見の指示 | 差し替え先 |
|---|---|---|---|
| longbow | 長弓兵 / Longbowman / 长弓手 | 弓兵より背の高い長弓、緑のマント | `assets/unit_longbow.png`、`assets/unit_longbow_attack.png` |
| repeater | 連弩兵 / Repeater / 连弩手 | 箱型の連弩、革の胸当て | `assets/unit_repeater.png`、`assets/unit_repeater_attack.png` |

## 受け入れの確認（M10）
- Chromiumで緑（#315438）背景に表示し、透明部分に色が出ないこと。
- 足元がベースラインに揃い、歩きの2フレームで体が上下に跳ねすぎないこと。
- ゲーム内の実寸（高さ22〜120px）で輪郭がつぶれず、種類が見分けられること。PCとスマホで撮影。
