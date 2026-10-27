# SPACEBAR Mythos Slayers II — 最小引き継ぎ

更新日：2026-10-28（日本時間）。最新ソース版 `20261028-unified-tree-r1`。このファイルを最初に読み、古い履歴文書は必要な箇所だけ読む。

## 対象と指示

- Repo: `BubblegumGameBoy/spacebar-clicker`, branch `main`。
- 試遊版: https://play.bubblegumgameboy.com/spacebar-clicker/preview/
- 元のゲームを残し、IIは別URL。rootのゲーム・Worker・packageを変更しない。
- 自分で組む自動化が中心。資材は個別の物体。ドラッグで倉庫へ入れる苦労が、仲間と手動建設した搬送設備で楽になる。
- 仲間は自動で歩かせず、プレイヤーが自由配置。木こりは作業範囲内の木を切る。主人公HPは撤回済み。敵の襲撃は時間で来る。
- ユーザーは細部の判断・修正を一任。不要な確認で止めない。JA/EN/ZHを揃える。
- トークン節約を強く希望。全履歴を読み直さず、局所調査・必要な検証を行う。多数の並列レビューを常時起動しない。今回レビュアーは利用上限で停止。レビューをしたことにしない。

## 今回完了

- 既存：木3打／石5打からの採集力強化、地面上限表示、木こり自由配置、送風機本体ドラッグで8方向、新規の資源配置を遠ざけた。
- 今回：**一つの接続ツリー43ノード**（能力24＋レシピ12＋設備強化7）。レシピの間に能力・設備強化が入り、解放すると購入カードが増える。研究費と実物の雇用・建設費は別表示。独立した職業／拠点研究の入口もこのツリーへ接続。
- 最初の実納品2個で操作の手の案内を終える→木こりレシピ（木2）をおすすめ→初回雇用は別に木6。以後は必要資材と次のおすすめを表示し、強制しない。
- **積み込み機**：研究12木8石、建設12木6石、20台まで。半径70の個別資材を1個ずつ拾い、80以内の実コンベアへ0.9秒で移す。腕と元の資材絵が動く。コンベアなしは待機。倉庫への直接加算や経路自動生成はしない。
- 旧セーブは既得レシピだけ一度推定。能力・資材・実物を勝手に配布しない。転生後もレシピ保持。

詳細は `dev/UNIFIED_TREE_DESIGN.md`。確認結果は `dev/UNIFIED_TREE_RELEASE.md` と `dev/UNIFIED_TREE_CHECKS.json`。これら以外の過去の設計書と矛盾したら、現行コードと今回の文書を優先。

## 確認済み・未確認

304 Nodeテスト通過。PC/CDPタッチで新規採集→2納品→研究→6木を貯める→実雇用／配置→自然採集。設備後半は資材を用意したfixtureで手動設置・待機・実搬送／1入庫・運搬中撤去・再読込。両サイズ×3言語の43ノード表示。工具の購入で既存木こりが5秒→2.5秒へ即時反映。起動3構成のJS／HTTPエラー0。

**今回の43ノード構造を新規から全9Wave最後まで通した検証は未実施。数時間遊べる証拠はない。** ここが次の優先レビュー。実機スマホと耳での音品質も未確認。過去の全編クリア記録を今回の進行バランスの証拠に流用しない。

## 再開方法

開発用 `2/`、`test/`、`tools/` は公開URLを増やさないためgit管理外。**最新mainを取得し、アーカイブを展開する**。

```bash
tar -xzf dev/sequel-source.tar.gz
python3 tools/build_playtest.py /tmp/mythos-review
python3 -m http.server 4422 --bind 127.0.0.1 --directory /tmp/mythos-review
```

- `dev/sequel-source.tar.gz` と `dev/sequel-source-wip.tar.gz` は今回の公開ソースと同一。途中版ではない。
- ブラウザ確認：`/preview/?lesson=2`。通常・lesson1・lesson2は別セーブ。セーブを消さずに新規確認するなら新しいブラウザcontextを使う。
- テスト：`for f in test/*.test.cjs; do node "$f" || exit 1; done`（各ファイル内の実テスト合計304）。
- 対象QA：`tools/qa_unified_loader.cjs`、`tools/qa_unified_project.cjs`。PlaywrightとChromiumが必要。前者は `GAME_URL` でURL変更可、後者は4422固定。
- 現在の作業clone：`/tmp/mythos-playtest-publish`。`/workspace/spacebar-clicker` は以前のdirtyなcloneなので無断で変更を混ぜない。別環境では最新mainから復元。
- 現環境のPlaywright：`NODE_PATH=/workspace/spacebar-clicker/node_modules`、Chromium：`/usr/bin/chromium`。
- 重要ファイル：`progression-core.js`ルール／`harvest-skills.js,.css`接続図／`progression-integration.js`カード・効果反映／`loader-core.js,loader-device.js`搬送／`outpost-camp.js`手動建設／`outpost-tutorial-core.js,.js`おすすめ動線。

## 次にすること

1. まず現行ルールで一回の新規進行を最後まで通す。資材稼ぎ・研究・防衛・敗北後再挑戦の所要時間と詰まりを記録する。
2. レシピ・能力・設備を買う判断が生まれるか、余計なクリックや手順がないかを見る。ノード数だけ増やさない。
3. 発見した具体的問題だけ修正→必要範囲を再確認。初動だけの作り込みや、全員を無理に満足させる無限レビューを避ける。
4. 公開はcache版名更新→build→対象QA→両アーカイブ同期→必要ファイルだけcommit→fetch/rebase→通常push。rootゲームとWorkerのdiffがないことを確認。

公開記録はgit pushで確認できるが、この環境は公開Pages/APIの読取403。配信反映成功を確認したと断言しない。スクショは `/preview/media/`。
