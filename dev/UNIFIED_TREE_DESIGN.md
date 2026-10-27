# Unified progression and loader — 2026-10-28

The single graph in `2/progression-core.js` is authoritative for research. It contains 24 ability nodes, 12 recipes and 7 camp improvements (43 total). Every drawn edge is a real prerequisite. No recipe is awarded simply for clearing a wave.

- Recipes reveal hire/build cards. Research does not grant an object; the card separately shows its current hire/build cost. `View card` returns to that card without buying it.
- Woodcutter research costs 2 wood; hiring the first worker still costs 6 wood. The first two actual deposits teach dragging, then the suggested next step points to this recipe. Recommendations do not gate other graph choices.
- Abilities keep the published costs/effects. Recipe and project prerequisites/costs/translations live in the graph, not a second document to keep in sync. Route abilities require conveyor research, not a prebuilt conveyor.
- Existing earned cards and recipe ancestors are inferred once on legacy saves. No ability, currency or physical equipment is invented to fill missing ancestors. Recipes persist on expedition return.
- Farmer and ballista research spend rebirth coins through this same tree. Crew management remains in its existing roster screen.

## Loader

A manually placed small loading crane. Research: 12 wood + 8 stone after conveyor recipe and storage II. Building: 12 wood + 6 stone. Limit 20, removal returns 6 wood + 3 stone.

Picks one individual ground item within radius 70 and transfers the same object over 0.9 s to the nearest real conveyor segment within 80. Existing belt physics carries it onward. No belt means visible waiting; it never deposits directly or creates a route. Preview shows pickup range and the exact target point. The arm animates carrying the original stone/log artwork.

Handheld, airborne, hopper-held and transported items cannot be stolen. Physics, normal item drawing and belt dispatch skip the gripped piece until release. Removing the loader/belt, interruption and save reload leave the same resource available, without duplication. Runtime arm progress is not saved; resource coordinates are.

Original root game and Worker are outside this change. Long-term campaign pacing remains an explicit next review task; 43 nodes is content structure, not evidence of hours of play.
