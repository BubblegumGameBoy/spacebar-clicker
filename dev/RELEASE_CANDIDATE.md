# 試遊版リリース候補 — 2026-10-26 JST

対象は既存9Waveの試遊版。完成条件を以下へ絞り、新しい職業・通貨・遠征先は追加しない。

| 条件 | ローカルでの確認 |
| --- | --- |
| 9Waveの2ルート | バリスタ先行・農家先行、正規資材・連打援護ありで全9Wave3箱と頭領撃破済み。食料購入あり/なしの条件を各JSONへ記載 |
| 完走後の循環 | 正規農家完走保存から転生→Wave7選択→実資材で弓兵1→3→保存復帰→実時間の敗北→同Wave7再挑戦を確認 |
| 敗因と再配置 | 正規Wave5同保存からバリスタ1部隊だけ予定した合法位置へUI再配置。援護なしで箱0/9撃破/上5突破から箱1/12撃破/下2突破へ。固定dtも同傾向。上路を改善すると下路は薄くなることも示す |
| 保存・入力・演出 | Node191件。旧active Wave4移行、未配置出撃防止、敗北時計、PC/実タッチ3言語、成長cueの一度だけ発火、ミュート、reduced motionの既存回帰証拠を再利用。今回の通知からの再表示・再挑戦も6構成で成功 |
| 元ゲーム保持 | 公開対象はpreview/と開発用dev/。root index、Worker、package、既存assetsに変更なし |

音声は実ブラウザ録音あり。音声入力非対応のため、主観的な実試聴まで確認済みとは扱わない。余剰転生コインの用途追加、24技能全取得、長期放置バランスはこのリリースの完成条件には含めない。

## 公開確認の残件

公開先: https://play.bubblegumgameboy.com/spacebar-clicker/preview/
新規体験の別セーブ: https://play.bubblegumgameboy.com/spacebar-clicker/preview/?lesson=1

現環境からは対象ドメインへのCONNECTが403で、まだ公開URLからの起動・配信物・保存領域・ページエラーを確認できない。既存の通信許可草案を保持しつつplay.bubblegumgameboy.comだけ追加した案は保存済み（要環境設定の保存・公開）。この設定案保存だけでは実行環境へ反映されない。

公開用mainへ更新したことだけで、公開URL検証完了とは呼ばない。許可反映後、公開build.jsonのrulesetとsource hashes、起動画面とアセット、preview固有保存、console/page errorsを確認する。ローカルの試遊版は完成条件を通過しているが、公開確認はこの残件を解消して閉じる。

## 証拠

- preview/media/route-comparison-checks.json — 同人数/能力/方針の担当路比較。未移動の全員の実座標も不変。
- preview/media/rebirth-release-checks.json — 正規完走後の転生・再出発。初回は結果ダイアログの再表示のみ既存UIメソッドを呼んだことを明記。
- preview/media/defence-hint-checks.json — 可視の通知ボタンから再表示し、明示再挑戦へ戻る6構成。
- 先行のfarmer-first-checks.json、sequel-progression-checks.json、growth-feedback-checks.json — 2ルートと成長演出。

今後の調整候補は別途記録し、公開を無限の機能追加で引き延ばさない。

## 公開処理の確認済み結果

2026-10-26 JST、コードコミット8f9999eb6d834f029faf16a37135f8a13871be0aをmainへ通常のfast-forwardで反映。GitHub Pages [run119](https://github.com/BubblegumGameBoy/spacebar-clicker/actions/runs/40249499277)が52秒でSuccess、同コミットのbuild/deploy完了を確認。GitHub上の公開元build.jsonもruleset outpost-9-release-candidate-v6・全source hashがローカル検証物と一致した。

これは対象URLを実ブラウザで開けたこととは別。実URL起動確認は引き続き通信許可反映待ち。dev/PUBLICATION_CHECKS.jsonへ確認済み/未確認を分けて保存。以後はこの公開smokeだけを解消し、機能追加へ戻らない。
