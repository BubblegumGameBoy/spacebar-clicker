# 2026-10-25 — 農家先行での全9Waveと搬送予告

copy catの提案をdirectorが判断し、正規保存の農家先行を検証。手動の最初の食料→農家3人と自作コンベア→購入せず畑の食料で弓兵を3→6人×2部隊へ増員→剣士3人×2部隊。バリスタ未解放、食料購入・資材付与・時間加速なし、援護連打ありで全9Wave3箱と頭領撃破。進行記録はmedia/farmer-first-checks.json。

改善は既存落下先の接続表示に限定。受け口への接触と倉庫への到達を区別し、倉庫未接続は緑にしない。無効な農家配置を岩と案内する誤記も修正。スマホの編成画面から再配置を選ぶと作業場へスクロールし、配置位置が画面外に残る問題も修正。別AIレビューで巨大dt仮想搬送が受け台上の実搬送と一致しない問題と、座標丸めによる接触境界の誤キャッシュを再現。3刻みの仮想搬送と曖昧経路の非緑表示、正確キーと形状キャッシュで修正。Node182件。5状態×3言語×PC/実タッチの準備済み機能確認はmedia/farmer-output-checks.json。正規進行の証拠と混同しない。

# 2026-10-25 — 新部隊制の全9Waveと街道チェックポイント

新規導入の実操作から稼いだ保存を継続し、最初の敗北・転生・バリスタ解放・増員・全9Wave3箱防衛・頭領撃破・Wave7への選択出発と保存復帰を確認。UIとポインタのみ、通常戦闘時間、プレイヤーの連打援護あり。開発中のビルド更新とQAハーネス修正では正規保存を継続。資材付与・時間加速なし。農家先行や放置防衛の完走を意味しない。

別AIの静的レビューから、毎回の序盤再走、バリスタの長装填の使い先、敵数増加だけの進行を指摘。章3/6の準備休憩、選択式Wave4/7出発、部隊別の鎧優先、新Wave4の鎧先頭と時間差俊足、道別予告と対策を実装した。

再レビューで、未配置のままの即出撃、毎フレームの編成全生成、旧active Wave4の移行時に4体が消え箱を失う問題を検出・修正。planVersionで旧途中戦闘を維持し、異なる経過秒での保存往復も確認。177件のNodeテスト。3言語×PC/実タッチで準備済みのチェックポイントUIを検証し、転生の一度だけの確定・保存復帰・方針反映を確認。証拠と試験条件はmedia/sequel-progression-checks.jsonとsequel-routes-checks.json。

AIによる実操作・別AIによる静的レビューであり、実在の児童や作者本人の評価ではない。

# 2026-10-23 — 導入と資材スキルツリーのリワーク

ユーザー実プレイで「何をするか不明」「連打しても取れない」「準備前に襲撃」「スキルが少なく構造も不明」が再発。従来のUI確認だけでは、最初に遊ぶための動線を検証できていなかった。

- 初心者・プランナー観点のソースレビューで、1秒制限が入力を捨てていること、石材必須の初回強化、工房優先の目標、初回時計の無条件開始を特定。
- 連打1回ごとに個別資材を産出。導入は10個納品→運搬強化→木こり→手動配置→木こりの丸太を納品→コンベア手動建設→実際の自動納品→所持木材30個の強化→弓兵2人→準備完了。
- 4枝×6段階、24ノードを中央接続図へ。実際の産出数・持ち運び数・地面上限・物理搬送速度に反映。未来の効果を確認でき、取得可能数で知らせる。
- ゲーマー観点の実ブラウザレビューで、運搬4個のはずが通常ドラッグで2個しか持てない問題を発見。重なった個別資材を能力の上限までつかむよう修正。資材は束へ統合しない。
- 実タッチの導入テストで、納品後にスキルの入口が開かない問題を発見。タッチ操作の確定・互換クリック重複防止を入口にも適用し、最初から再確認。
- 練習は lesson=1 の別保存領域。元の試遊記録を残したまま導入を体験し、タイトルから元へ戻れる。

以下の過去記録は旧仕様。旧版の全9襲撃・約24分の完走を、今回の導入変更後の所要時間とは扱わない。今回の操作・撮影条件は media/ の各確認JSONへ保存。新規セーブでPCの導入全手順、スマホ実タッチで初回10納品と購入を完了。正規の導入セーブを継続して所持木材60個の購入、実際の持ち運び4→6、初回の実時間襲撃と2弓兵による3箱防衛まで確認。Node142件が成功。3言語・800×700iframe・別セーブから元セーブへの復帰も確認した。

---

# Incremental sequel: independent playtest review loop

2026-10-20. Reviews use separate agents and fresh browser saves. The child lens
simulates a young player who relies on pictures, numbers and feedback rather than
kanji. It is not testing with real children. The adult lens examines progression,
meaningful choices and the pleasure of adding workers and soldiers.

The author's linked essay at
https://babblegum.hatenablog.com/entry/2026/10/05/142948
returned HTTP 403 from this environment. The user then supplied its full text.
Round 3 uses its stated criteria: satisfying input, growth that relieves earlier
manual work, meaningful choices, and alternating immediate rewards with earned
achievement. This game concentrates on those three kinds of fun plus the existing
bestiary; it does not mechanically add all eight kinds listed in the essay.
Reviewers cannot listen to the browser's audio output, so no auditory approval is
claimed. A separate workshop lets the author compare the actual audio and motion.

## Stop criteria

Fresh reviewers can discover harvesting, manual pickup, recruiting, placement,
automatic production and the first combat reward without a play-stopping issue.
No involuntary army movement, continuous screen shake or automatic camera move.
Newly recruited people and dropped materials remain visible. Purchase decisions
show their output and price. Material subjective polish remains distinguishable
from errors that prevent play. A zero-findings review does not prove a perfect game.

## Round 1 — two independent reviewers, harvest build

Child lens: desktop and mobile, through lumberjack, first worker pickup and archer.
Adult lens: about eight minutes at normal speed, four lumberjacks, one miner,
three archers, one swordsman and BOSS 2. Neither read source or QA beforehand.

Both independently found these material issues:

| Observed issue | Change |
| --- | --- |
| Tree hits barely react | 180 ms reaction on the struck object, small chips and local +1; no world shake |
| Character bodies have different scales | Normalize idle body height and each frame's foot anchor, instead of including raised tools in the scale |
| New archer placement hides its target | Show the enemy while planning combat; offer visible valid placement spots |
| New cards insert before the familiar worker | Keep resource workers first and append later unlocks |
| Output and upgrades cannot be compared | Show material / interval, damage / interval and the actual next upgrade result |
| First victory unlocks too many unrelated controls | Delay swordsman and heavy infantry; hide worker training until combat pays gold |

The child lens also reproduced a worker visually disappearing inside a tree on
mobile and drops covering the worker's face/axe. Placement now excludes object
art overlap, tapping a tree chooses a clear nearby spot, and drops choose clear
ground. Mobile resource spacing was increased. The adult lens found an active
“finish placement” action before placing anyone; this is now hidden while a new
ally awaits placement. Victory now exposes the next-enemy action in the main guide.

A separate input audit also removed a legacy card-body click that could recruit
without pressing its explicit button. Worker training now actually improves the
displayed production interval.

Evidence: `scratch/review-child-r1/REVIEW.md` and
`scratch/review-gamer-r1/REVIEW.md` in the task workspace, with screenshots.

## Round 2 — fresh reviewers, revised build

Both fresh reviewers completed the resource loop and first battles. The adult
reviewer reached eight lumberjacks and seven purchased archers in about ten minutes.
The child reviewer found no play-stopping issue in its map, but the adult found a
seed-dependent missing placement guide after an archer purchase.

The title's most prominent button led to speed
measurement before the forest game. The forest start is now the first primary
button, while independent measurement remains available from title and HUD.

First victory also expanded tabs, troop lists and training buttons underneath a
player's existing tap position. Advanced controls now open only when the player
chooses Training. The guide has a fixed height; the bestiary button keeps its place
and becomes enabled rather than inserting a new button. Ordinary purchases keep
their layout when a battle pays out.

Placement suggestions now search the legal attack area rather than just three
fixed offsets. The exact crowded review save and 400 seeded desktop/mobile maps
produce valid suggestions. Placing multiple recruits refreshes them. Local body
queries and a short suggestion cache bound the additional work.

Cards now distinguish ranged and close combat and show whole-company production,
alongside the individual output and the next training result.

A separate browser check caught a negative audio-fade volume caused by a request
animation frame timestamp earlier than the fade's start timestamp. The fade is
now clamped at both endpoints.

Evidence: `scratch/review-child-r2/REVIEW.md`, `scratch/review-gamer-r2/REVIEW.md`,
and `diagnostic-no-archer-slots.json` in the latter directory.

## Round 3 — fresh reviewers, article criteria included

The adult reviewer used the user's actual stated criteria, played for about nine
minutes at normal speed and reached the third enemy with seven placed allies.
The child reviewer started on mobile without reading prior feedback or source,
played for about seven minutes and reached the second enemy with four allies.
Neither found a play-stopping issue in that route. Both could follow manual
harvest → pickup → worker placement → automatic work → soldiers → first victory.
The adult specifically observed the relief of leaving wood to workers while
personally gathering stone, and the visible pleasure of adding individuals.

Remaining concrete findings and their final fixes:

| Observed issue | Change |
| --- | --- |
| New HUD rows later cover the first worker on mobile | Reserve fixed HUD rows from the start; counters change without growing the panel |
| One visible placement marker rejected a tap | Snap input to the actual displayed marker, enlarge its touch area, and reserve marker space when spawning new drops |
| Swordsman training reads 2 → 2 | Show small damage values with decimals and include the real formation multiplier in both values |
| Training actions fall below the fold | Open a dedicated training dialog with cost and current → next output visible together |

Quantity selection also has a fixed place in the toolbar. Training is paused in
its dialog, buys exactly one level for the company, restores the unchanged main
purchase layout on close, and has keyboard focus containment. The removed
protagonist HP/armor upgrades are not exposed there.

Evidence: `scratch/review-child-r3/REVIEW.md` and
`scratch/review-gamer-r3/REVIEW.md`, screenshots and saved diagnostic states.

## Final verification and review limit

Six independent reviews completed across three rounds. Two additional fresh
reviewers were requested after the final fixes, but both failed to start because
the agent usage limit was reached. **There is no fourth-round review result.**
The final HUD, placement and training changes were checked by the implementing
agent using browser interaction and targeted regressions. They have not received
another independent initial-playthrough review. No claim of zero feedback or
finished long-term game balance is made.

The observed progression covers the opening battles, not hundreds of soldiers,
late-game economics or long-term retention. The review process stops here with
those limits recorded, rather than treating agent agreement as proof of quality.

## Verification

- All 48 Node tests pass, including 400 seeded desktop/mobile placement cases
  and the actual crowded save from round 2. The Worker dry-run also passes; no
  Worker is deployed as part of this static preview update.
- Existing deterministic tests cover saves, worker cooldowns, combat timing and
  bounded economics; the browser checks use real harvest, pickup and placement.
- A hit visibly changes canvas pixels, returns to its original image after the
  brief reaction, and never changes the field rectangle.
- Actual idle sprite pixels measure about 52.5, 51.5 and 52.5 world units for the
  lumberjack, miner and archer, instead of the previous approximately 47/33 split.
- Repeated music toggles do not produce out-of-range volume errors.
- The sound workshop uses a separate browser storage prefix and real game code.
- Browser checks cover fixed HUD geometry, explicit purchase buttons, keyboard
  focus, one-cost training, mobile layout, Japanese/English/Chinese and save
  isolation. Audio buffer checks establish nonzero bounded signals, not a human
  judgment of timbre. The workshop exists for that judgment.
- Final capture checks found pickup labels colliding after switching from desktop
  to mobile. New drops now avoid other pile labels as well as people and scenery;
  a responsive width change reflows loose piles once without moving workers or
  losing materials. Placement also reserves the actual screen-sized label area.
- A fresh-save recording covers manual wood harvest, pickup, first placed worker,
  its automatic output and a second recruit, at normal speed. Its H.264 picture
  and AAC audio are actual browser/game output. The mobile follow-up checks that
  pile labels cover neither each other nor those two workers.


## 2026-10-23 — 作業場・物理コンベアの改訂

現行仕様は、手動採集→同じ見た目の資材をドラッグで小屋へ納品→木こりを好きな位置に配置→落下地点を見てコンベアを組む、という流れ。木こりの位置によって落下地点が変わる。仮置きの曲線と実際の落下先は同じ計算を使う。固定された資源出口へ落とす中間案は廃止。

コンベアは出口側から引き伸ばして敷く。帯状コンベアと96×64の受け土台（4方向）を隣接させて組む。地面の実物が接触した時だけ動き、途切れた先では止まる。小屋へ到達して初めて在庫が増える。資材をつかんでも別のアイコンに変えない。

襲撃は準備時間の終了で自動開始。初回150秒、序盤・再挑戦90秒、後半120秒。メニューでは停止、建設中は進行する。手動開始を前提とした過去の記述は旧仕様。

検証：126件の自動テスト、11件の音響技術チェック。新規の正規採集からPCで木こり・落下予告・敷設・無操作での納品を確認。スマホでも9個を個別に手運びして木こりを雇い、左右の予告と配置後の落下を確認。実時間150秒後の初回襲撃も確認。受け土台と隣接コンベアへの手動投入動画は正規資材で撮影。受け土台の各方向・保存の結合テストには準備済み状態を使用。

限界：現行仕様で全9襲撃を通した再検証、数時間の経済設計、音色の実聴評価は未完了。以前の最終戦動画は旧版の記録であり現行版の通しクリア証明ではない。


## 2026-10-23 — 資材の蓄積と購入導線
資材は数量をまとめず、同じ出力地点に重ねて残す。地面の物だけ小さく浮遊し、影と明るさで拾えることを示す。置き場の上限は初期12個、作業スキルの置き場拡張で24・48個。上限では資源を消費せず生産を停止し、運ぶと再開。既存の超過資材は削除しない。
仲間の購入欄に搬送設備2種を追加。コンベアの価格表示・不足額・消費額を共通計算へ統一。測定は現行キャンプでは独立した自己記録であり、採集・戦闘の強化効果はないと明記。主要導線は通常の漢字交じりの日本語へ変更。
検証は実時間・資材付与なしで、12個の蓄積→1個納品→生産再開→正規資材による上限24個の購入。スマホでも重なった資材を9回個別に運び、木こり配置と購入欄からコンベア設置への移行を確認した。


## 2026-10-23 — 配置操作の統一
採集・運搬／仲間の配置／コンベア／受け土台を、同じ操作パネルで切り替える。現在のモード名、選択状態、共通の「配置を終える」を常に表示。各種配置は押下中に予告を見て、指を離して確定する。複数の配置モードを同時に有効にしない。
配置終了は雇用取消と分離し、未配置の仲間と返金履歴を保持。仲間も配置後にモードを維持し、明示的に終了する。未配置人数を別表示する。資材を拾うには採集・運搬へ戻る。既存の設置用コスト・回転・取り消し操作を共通パネル内へ移動し、重複する旧ショートカットを非表示にした。
メニューやモード切替時に押下中の予告を破棄。古い指離しでは設置しない。メニューのEscapeはメニューだけを閉じる。襲撃開始では途中の配置を終え、未配置の仲間は残す。
検証：正規の採集→9個納品→木こり雇用→配置待ちを残してモード往復→配置→手動敷設→21秒無操作で搬送を確認。スマホの実タッチでも採集・納品後に全4モードの切替を確認。別AIレビューでもPC1280・スマホ390で表示とモードの一致、メニューのEscapeを確認。結合テスト5項目（メニュー、押下中切替、兵士の指離し確定、blur中断、襲撃中断）は資材を用意しタイマーを短縮した試験用状態で行い、通常進行の通し試遊とは分けた。


## 2026-10-23 — モード選択を撤去し、フィールドを主役へ
作者の「4モードに分ける必要がない」「選択UIが半分を占める」という指摘を受け、カードから対象を選び、配置後は自動で通常操作へ戻る構成へ変更。対象を持っている間だけ短い表示を出す。PC右側の細い購入欄と、幅980px以下の横スクロールカード列を使い分ける。小屋表示を約82px高へ縮小、工房を幅340pxの小型ウィンドウへ変更し、背景全体のぼかしを撤去。
独立AIレビューでは、スマホでブログリンクが操作欄を押し出すことと、初回の設備選択で旧パネルが一瞬出ることを発見・修正。実タッチの3個採集・個別納品・設備選択・キャンセルも確認した。
新規・正規資材でPCと実タッチの木こり配置、カードからコンベア敷設、自動搬送を再確認。既存の正規セーブから終盤の通しプレイを継続している。


## 小型UIの通し確認結果（2026-10-23）
正規の新規プレイから得たセーブを継続し、第9襲撃の終了まで確認。ゲーム内時間は約23分53秒。初回最終戦は頭領撃破後に7体が突破して敗北し、編成追加後の再挑戦では37体撃破・突破0・箱3で成功。最終編成は木こり6・採掘師6・弓兵20・剣士4、コンベア12本。後半は自動攻撃に手動クリックの補助を併用した。放置のみのクリア証明ではない。
全区間が同一ブラウザで連続した試験ではない。第3襲撃までの正規保存から新UIへ移り、確認スクリプトの旧容量判定と旧工房入口を直して途中再開した。資材付与・時間加速・勝利状態の書換えは行っていない。新UIの開始部分は別の新規保存でPCと実タッチを再検証している。
最終画面では拠点写真の読込前に枠が潰れる表示も調整し、正規クリア済みセーブからPC・スマホで写真の表示、記録の再表示、拠点へ戻る操作を確認。独立UIレビューの再確認では、確認範囲に新しい操作阻害は見つからなかった。自動テスト133件通過。

実タッチ回帰で、準備完了によるダイアログ終了後の互換clickが背面の採掘班雇用へ届く問題を再現・修正。document captureで処理済みタッチの遅延clickを止め、新しいpointerdownでガードを解除。直後の正規タップ・雇用・返金は通し、未配置での出撃禁止も3言語の実操作で検証。
