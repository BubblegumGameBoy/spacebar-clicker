# 敵城の素材

2026-11-17。画像生成スキルの組み込みimage_genを使用した。CLI/APIへの切替はしていない。

保存先は編集ソースの `2/media/territory-castle-v1.png`、試遊ビルドの `preview/media/territory-castle-v1.png`。新規素材であり、既存assetsを置換していない。元の生成画像も生成フォルダーに保持している。1254×1254、RGBA、透明度0〜255、約1.47MB。平面の戦場に重ねる建物で、立体的な地形画像ではない。

城の赤旗は敵の状態、制圧後はゲーム側で味方旗と集積場を重ねて区別する。前哨と頭領は大きさと実際の門耐久で区別する。文字・UI・地形は画像に含めずゲーム側で描く。

最終生成プロンプト：

```text
Use case: stylized-concept. Asset type: transparent pixel-art enemy castle sprite for the Japanese 2D game Mythos Slayers II. Primary request: one formidable but readable enemy stone fortress, intended to sit as a building on a flat grass battlefield and become a captured resource depot. Style: crisp 16-bit fantasy strategy game pixel art, deliberately chunky pixel clusters, restrained olive/charcoal/ochre palette matching woodland lumberjack and archer sprites; no 3D-render look. Subject: a complete small fortified castle with a strong central arched gate, two sturdy stone towers, battered dark slate roof details, a few muted crimson enemy pennants, timber supply crates immediately inside the open gate. Composition: straight-on three-quarter-free frontal game view, slightly visible roof tops as in classic side-on strategy games, strong symmetric readable silhouette. Single isolated building fully visible, centered, with generous transparent padding; grounded horizontal baseline. Canvas square, suitable to downscale to a roughly 200px-wide building. Materials: rough grey-green blocks, dark iron gate, weathered wood. Constraints: genuinely transparent background with alpha, no landscape, no terrain tile, no grass island, no characters, no UI, no text, no lettering, no watermark, no perspective ground plane, no glow or huge shadow, no cut-off towers. Do not create a spritesheet or multiple variants. This will be integrated into a real canvas game.
```
