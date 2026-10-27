# Unified tree + loader release — 2026-10-28 (JST)

Revision `20261028-unified-tree-r1`. Based on published `e197260`.

Implemented: one connected graph for 24 skills + 12 recipes + 7 camp improvements; recipe purchase reveals a card with separate craft/hire cost; old profession/camp research routes open the same tree; first recipe recommendation; original stats and real costs; manually placed animated loader and real-item conveyor transfer; JA/EN/ZH labels and descriptions.

## Verified

- 304 Node tests passed across 29 files, including eight new graph/payment/migration/loader tests. Graph is acyclic, every node attainable, all costs paid once, no free equipment.
- PC and CDP touch: fresh save → 2 real wood deposits → tree recipe research → saving another 6 wood → actual hire/free placement → natural worker output.
- Late equipment uses a clearly prepared material/coin fixture, then manual loader placement, waiting without belt, actual stone transfer/conveyor/warehouse receipt, removal while carrying and reload. This is not an unassisted late-game playthrough.
- Both sizes × JA/EN/ZH: all 43 nodes and actual prerequisite edges, selected purchase button remains onscreen.
- Live worker interval changes immediately from 5 s to 2.5 s when buying the tool project in the tree.
- Final startup: PC, lesson slot, mobile viewport: no JavaScript/HTTP/request errors.
- Touch preview initially exposed a fence-shape assumption. Loader previews now bypass that unrelated shape path; both full journeys passed after correction.

Evidence: `UNIFIED_TREE_CHECKS.json`, `/preview/media/`, and QA tools within the source archive. CDP is emulation. This release does not establish physical-phone behavior, audio listening quality, a full nine-wave fresh progression run or multi-hour balance. Reviewer agents hit their usage limit; no additional independent final review is claimed.

Git push can be verified in this environment; public Pages/API requests return 403 here, so deployment/CDN completion is not asserted.
