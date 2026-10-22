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
