# 第1便・生成画像の引き継ぎ

`dev/ART_PROMPTS.md` に基づき、共通スタイルと敵用の追記を適用して1点ずつ生成。5bの穴画像を含むため、指定ファイルは合計28点です。

- 保存先: `assets/_incoming/`
- 全点PNG / RGBA、透明ピクセルあり。生成原本をコピーし、切り出し・リサイズ・形式変換はしていません。
- マップ背景・上位職は未生成。ゲームコードとpreviewは変更していません。
- 指定寸法は生成プロンプトに含めていますが、下記5点は生成サービスの出力寸法が異なります。原本保持のため補正していません。切り出し・変換時に実寸を参照してください。
- スプライトの輪郭や淡い発光、各ポーズの位置には生成由来の揺れがあります。切り出し時に目視調整してください。

| ファイル | 指定寸法 | 実寸 | 配置（列×行） |
|---|---|---|---|
| `mob-shield.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-bat.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-ooze.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-oozelet.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-mole.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-mole-burrow.png` | 1024x1024 | 1254×1254 | single |
| `mob-shaman.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-beetle.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-swarm.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-wisp.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-siegecart.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-slinger.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-toad.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-boar.png` | 1536x1024 | 1536×1024 | 2x2 |
| `mob-envoy.png` | 1536x1024 | 1536×1024 | 2x2 |
| `tool-blower.png` | 1536x1024 | 1536×1024 | 2x1 |
| `tool-fence.png` | 1536x1024 | 1536×1024 | single |
| `tool-hopper.png` | 1536x1024 | 1536×1024 | 2x1 |
| `tool-chute.png` | 1536x1024 | 1536×1024 | single |
| `tool-springboard.png` | 1536x1024 | 1536×1024 | 2x1 |
| `tool-sorter.png` | 1536x1024 | 1536×1024 | single |
| `camp-sawmill.png` | 1536x1024 | 1536×1024 | 2x1 |
| `camp-furnace.png` | 1536x1024 | 1536×1024 | 2x1 |
| `camp-bridge.png` | 1536x1024 | 1536×1024 | 3x1 |
| `resource-plank.png` | 1024x1024 | 1254×1254 | single |
| `resource-iron.png` | 1024x1024 | 1254×1254 | single |
| `resource-iron-bar.png` | 1024x1024 | 1254×1254 | single |
| `node-iron.png` | 1024x1024 | 1774×887 | 2x1 |
