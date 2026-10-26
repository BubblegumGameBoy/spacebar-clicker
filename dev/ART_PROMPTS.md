# ART_PROMPTS — codexへ貼る画像プロンプト集

2026-10-26 作成。`dev/ART_REQUESTS.md`（差し替え先・使う場面の表）の各項目を、そのまま画像生成に貼れる形にしたもの。
**使い方**：各プロンプトの前に「共通スタイル」を必ず付けて1枚ずつ生成する。生成物はPNG（透明背景）のまま `assets/_incoming/` に、下の「ファイル名」で置く。WebP化と切り出しはClaude側で行う。

## 寸法について（重要）

画像生成で確実に作れる 1536×1024（横長）か 1024×1024（正方形）で作る。格子（何列×何行）と、各セルの中に1体ずつ収まっていることが大事。ゲームは各セルの不透明部分の矩形を測って読む。キャンバスの大きさが多少違っても受け入れる。

## 共通スタイル（すべての先頭に付ける）

```
Game sprite sheet for a 2D browser strategy game. Style: high-detail pixel-art-inspired 2D sprites, crisp dark outlines, earthy muted palette (moss green, bark brown, slate grey, dull gold), soft top-left light, slightly top-down 3/4 view, matching a cozy-but-grim medieval forest setting. Fully transparent background (PNG with alpha). No ground shadow, no text, no numbers, no UI frames, no borders, no grid lines, no watermark. Each pose sits alone inside its own grid cell with generous empty margin (at least 6% of the cell on every side) and never touches a neighbouring cell. All poses share the same foot baseline (about 20% above the bottom of each cell) and the same scale.
```

敵用には、さらに次を足す。

```
The creature faces LEFT (it walks from right to left). Keep the silhouette readable at a tiny in-game size (40–100 px tall): bold shapes, strong contrast, one clear accent colour.
```

---

## 第1便：敵（2×2の格子、1536×1024）

格子の並びは、全種共通で次のとおり。
- 左上＝歩きA、右上＝歩きB（足を入れ替えた歩きの2コマ）
- 左下＝門の前の攻撃（木箱をかじる・殴る・掘る）
- 右下＝撃破（倒れる・崩れる）

### 1. 盾持ちネズミ — `mob-shield.png`
```
A 2x2 sprite sheet of a sturdy brown rat soldier standing on its hind legs, holding a round wooden shield banded with iron in front of its body (on the left side). Top-left: walking pose A. Top-right: walking pose B with the other foot forward. Bottom-left: bashing forward with the shield as if hitting a wooden crate. Bottom-right: defeated — the shield is split in two and falling, the rat collapsing backwards.
```

### 2. 夜コウモリ — `mob-bat.png`
```
A 2x2 sprite sheet of a large night bat with dusky violet-grey fur and leathery wings, hovering in the air (it never stands on the ground). Top-left: wings raised high. Top-right: wings swept down. Bottom-left: clinging and biting, wings half folded, leaning forward. Bottom-right: defeated — wings crumpled, tumbling downwards.
```

### 3. 分裂粘菌 — `mob-ooze.png`
```
A 2x2 sprite sheet of a translucent yellow-green slime blob with small pebbles and leaves visible inside, two dark beady eyes. Top-left: squashed wide while sliding. Top-right: stretched tall while sliding. Bottom-left: lunging forward and engulfing something. Bottom-right: tearing apart into two smaller blobs (the moment of splitting).
```

### 4. 小粘菌 — `mob-oozelet.png`
```
A 2x2 sprite sheet of a small, round, translucent yellow-green slime with big shiny eyes (a baby version of a larger slime, same colours). Top-left: squashed while hopping. Top-right: mid-hop stretched. Bottom-left: nibbling forward. Bottom-right: popping into a splash and fading.
```

### 5. 穴掘りモグラ — `mob-mole.png`
```
A 2x2 sprite sheet of a burly mole with huge spade-like front claws, dirt-stained dark brown fur, tiny eyes and a pink nose. Top-left: walking pose A. Top-right: walking pose B. Bottom-left: digging hard into the ground with both claws, dirt flying. Bottom-right: defeated — lying on its back, claws in the air.
```

### 5b. モグラの盛り土 — `mob-mole-burrow.png`（1024×1024、1つだけ、中央）
```
A single small mound of freshly dug brown earth with a few pebbles and grass tufts, seen from slightly above, centred in the image. Nothing else.
```

### 6. 祈祷ネズミ — `mob-shaman.png`
```
A 2x2 sprite sheet of a hunched old rat shaman in a ragged hooded cloak, holding a crooked bone staff topped with a faint pale-green glowing light. Top-left: walking pose A leaning on the staff. Top-right: walking pose B. Bottom-left: raising the staff high, the green light flaring (a healing chant). Bottom-right: defeated — the staff dropped, the rat crumpling.
```

### 追加種（モンスターの拡充。役割はClaude側で設計済み）

| ファイル | 名前 | ゲーム上の役割 |
|---|---|---|
| `mob-beetle.png` | 鉄甲虫 / Iron Beetle / 铁甲虫 | 遅いが、前からの矢をほぼ弾く。バリスタと剣士の出番 |
| `mob-swarm.png` | 子ネズミの群れ / Mouse Swarm / 鼠群 | 1体は弱いが、10匹単位で押し寄せる。弓の連射の出番 |
| `mob-wisp.png` | 鬼火 / Will-o'-Wisp / 鬼火 | 近くに来るまで見えない（射程の短い職しか先に気づけない） |
| `mob-siegecart.png` | 攻城荷車 / Siege Cart / 攻城车 | 硬い。壊すと中から鼠が3匹出てくる |
| `mob-slinger.png` | 石投げネズミ / Slinger Rat / 投石鼠 | 道の途中で止まり、離れた所から箱に石を投げる |

#### 7. 鉄甲虫 — `mob-beetle.png`
```
A 2x2 sprite sheet of a large armoured beetle with a dark iron-grey shell plated like riveted metal and short sturdy legs. Top-left: crawling pose A. Top-right: crawling pose B. Bottom-left: ramming forward with its horned head. Bottom-right: defeated — flipped on its back, legs curled.
```

#### 8. 子ネズミの群れ — `mob-swarm.png`
```
A 2x2 sprite sheet of a tight scurrying cluster of five tiny grey mice moving together as one group. Top-left: running group pose A. Top-right: running group pose B. Bottom-left: the group piling forward and gnawing. Bottom-right: defeated — the mice scattering apart and fleeing.
```

#### 9. 鬼火 — `mob-wisp.png`
```
A 2x2 sprite sheet of a will-o'-wisp: a floating flame spirit of cold teal-blue fire with a faint face inside, trailing wisps of light, hovering above the ground. Top-left: flame leaning left. Top-right: flame flickering upright. Bottom-left: flaring brighter and lunging forward. Bottom-right: guttering out into faint smoke.
```

#### 10. 攻城荷車 — `mob-siegecart.png`
```
A 2x2 sprite sheet of a crude wooden siege cart with a pointed log ram, iron-banded wheels and a hide-covered roof, pushed by rats who are mostly hidden behind it. Top-left: rolling pose A. Top-right: rolling pose B with the wheels turned. Bottom-left: the ram thrusting forward into a crate. Bottom-right: defeated — the cart broken apart, planks flying, a few rats tumbling out.
```

#### 11. 石投げネズミ — `mob-slinger.png`
```
A 2x2 sprite sheet of a lean rat in a leather vest swinging a cloth sling with a stone. Top-left: walking pose A. Top-right: walking pose B. Bottom-left: mid-throw, the sling whipping forward and the stone leaving it. Bottom-right: defeated — falling backwards, the sling dropped.
```

---

## 第1便：頭領（2×2、1536×1024）

全身が大きいので、セルいっぱい（余白は6%以上）に描く。格子の並びは敵と同じ。

### 12. 大ガマ — `mob-toad.png`
```
A 2x2 sprite sheet of a gigantic toad boss, warty olive-green skin covered in moss and small mushrooms, heavy-lidded eyes, wide mouth. Top-left: crawling forward A. Top-right: crawling forward B. Bottom-left: crouched low, coiling to leap. Bottom-right: defeated — flipped onto its back.
```

### 13. 鉄牙の猪 — `mob-boar.png`
```
A 2x2 sprite sheet of a huge wild boar boss wearing crude iron plates nailed onto its back and head, long curved iron-capped tusks, bristly dark fur. Top-left: trotting A. Top-right: trotting B. Bottom-left: charging with its head lowered. Bottom-right: defeated — collapsed on its side.
```

### 14. 異界の使い — `mob-envoy.png`
```
A 2x2 sprite sheet of an eerie otherworldly envoy: a thin faceless black humanoid with long curved horns, a barbed tail and broad membranous bat-like wings, hovering silently above the ground. Unsettling but readable as a game boss, not gory. Top-left: hovering, wings up. Top-right: hovering, wings down. Bottom-left: reaching forward with long clawed hands. Bottom-right: defeated — dissolving into black mist from the edges.
```

---

## 第1便：搬送の道具・設備（倉庫と同じ斜め上の視点）

出口や風の向きは**右**で描く（ゲーム側で回転させる）。8方向に回しても破綻しない、ずんぐりした形にする。

### 15. 送風機 — `tool-blower.png`（2×1、1536×1024：左セル・右セル）
```
A 1x2 (two cells side by side) sprite sheet of a hand-built wooden blower: a squat wooden box frame holding a large wooden paddle fan, the fan facing RIGHT so the wind blows to the right. Left cell: idle, blades clearly visible. Right cell: strong gust — blades motion-blurred, a few short white wind streaks to the right of the fan.
```

### 16. 誘導柵 — `tool-fence.png`（1536×1024、横長の1区間を中央に）
```
A single short section of a low wooden guide fence seen from slightly above: two stout posts and two horizontal planks, running horizontally across the middle of the image. The left and right ends must be cut cleanly so the section can be repeated seamlessly side by side. Nothing else.
```

### 17. 集積口 — `tool-hopper.png`（2×1）
```
A 1x2 sprite sheet of a wooden funnel hopper: a square wooden funnel on short legs with a spout on its RIGHT side. Left cell: idle and empty. Right cell: working — a few logs and stones tumbling out of the right spout.
```

### 18. 滑り台 — `tool-chute.png`（1536×1024、中央に1つ）
```
A short wooden chute made of planks, sloping DOWN to the right, with low side rails, seen from slightly above, centred in the image. Nothing else.
```

### 19. 跳ね板 — `tool-springboard.png`（2×1）
```
A 1x2 sprite sheet of a simple wooden lever catapult (springboard) on a stone pivot, throwing toward the RIGHT. Left cell: cocked and ready, the board low on the left. Right cell: the moment of release, the board snapped upward to the right.
```

### 20. 仕分け柵 — `tool-sorter.png`（1536×1024、横長の1区間を中央に）
```
A single section of a low iron grate fence seen from slightly above, running horizontally across the middle of the image, with an empty blank wooden plaque area in the centre of the section (left plain, no symbol). The left and right ends are cut cleanly so the section can repeat seamlessly.
```

### 21. 製材所 — `camp-sawmill.png`（2×1）
```
A 1x2 sprite sheet of a small open-air sawmill: a sturdy timber workbench with a big circular saw blade, an intake trough on the LEFT and a short plank slide on the RIGHT, seen from slightly above. Left cell: idle. Right cell: working — the blade spinning (motion blur), a log being cut, sawdust puffing out.
```

### 22. 炉 — `camp-furnace.png`（2×1）
```
A 1x2 sprite sheet of a small stone furnace built of rough grey stones with two small feed openings on the LEFT (upper and lower) and one output opening on the RIGHT, a short chimney on top, seen from slightly above. Left cell: cold, no fire. Right cell: burning — orange glow inside the openings and a thin wisp of smoke from the chimney.
```

### 23. 橋の工事場と橋 — `camp-bridge.png`（3×1、1536×1024の横3セル）
```
A 1x3 (three cells side by side) sprite sheet showing a small wooden bridge crossing a river from left to right, seen from slightly above; draw the bridge only, no water. Left cell: construction site — just a few wooden stakes and a rope. Middle cell: half-built bridge — stone piers and some planks. Right cell: finished bridge — planks on stone piers with simple rails.
```

---

## 第1便：資材（1024×1024、中央に1つ、既存の丸太・石と同じ大きさ感）

### 24. 板 — `resource-plank.png`
```
A single short wooden plank with bright fresh wood grain, slightly angled, centred. Only one plank — not a stack, no numbers.
```

### 25. 鉄鉱 — `resource-iron.png`
```
A single chunk of rusty red-brown iron ore with dark metallic flecks, centred. Only one chunk.
```

### 26. 鉄の延べ棒 — `resource-iron-bar.png`
```
A single dull grey iron ingot bar with a soft metallic sheen, centred. Only one bar — not a stack, no numbers.
```

### 27. 鉄の鉱脈（地形） — `node-iron.png`（2×1：左＝鉱脈が残っている、右＝掘り尽くした）
```
A 1x2 sprite sheet of an iron ore outcrop: a cluster of grey boulders streaked with rusty red veins, seen from slightly above. Left cell: full outcrop. Right cell: depleted — smaller broken rubble with faint red traces.
```

---

## 第2便（M13完了時。今は作らなくてよい）

背景（1672×941、`assets/forest-clearing.webp` と同じ視点・明るさ・空と森の帯）：
- `region-wilds.png`：区画1の右に続く森。左端は区画1の地面とつながる。草がなびく開けた場所を1つ。
- `region-thicket.png`（2×1）：左＝通れない密な茂み、右＝切り株の残る開けた地面。
- `region-river.png`：左に流れの向きが分かる川、右に赤い筋の岩場。
- `stage-marsh.png`：3本の土の道（上・中・下、左端の倉庫へ合流）、水たまり、葦。

上位職（味方は**右向き**）：
- 待機の絵は1枚（既存の `assets/unit_arch.png` と同じ縦横比171×140）。
- 攻撃は**横4コマ**のシート（既存の `unit_arch_attack.png` と同じ720×192＝1コマ180×192）。
- 対象は `unit_longbow`（長弓兵：背の高い長弓、緑のマント）と、`unit_repeater`（連弩兵：箱型の連弩、革の胸当て）。

## 受け入れ時にClaudeが確認すること
- 緑（#315438）の背景に置いて、透明部分に色のにじみがないか。
- 格子のセルをはみ出していないか、足元がそろっているか、歩きの2コマで体が跳ねすぎていないか。
- ゲーム内の実寸（高さ22〜120px）で種類が見分けられるか。PCとスマホで撮影。
