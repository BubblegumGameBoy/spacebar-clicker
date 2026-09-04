# Unit animation asset notes

The current unit animation sheets were created with OpenAI ImageGen in **Generate** mode, then normalized into four equal transparent cells for the game. The brown dwarf, jade dragon, and armored giant also used **Edit** mode to request removal of a falsely rendered checkerboard background. When the giant edit still returned RGB, `normalize_unit_sheet.py --remove-checker` extracted only the pale edge-connected background before packing the final sheet. Violet and crimson dragon sheets are deterministic palette variants of the jade master so the animation stays identical.

## Final reusable prompt set

Use this common prompt and substitute the subject/action row below.

> Use case: stylized-concept. Asset type: production game sprite animation sheet with a real transparent alpha background. Create one horizontal four-frame pixel-art continuous animation of [SUBJECT] performing [ACTION]. Frames from left to right: 1) ready/idle, 2) clear anticipation, 3) strongest impact or release pose, 4) follow-through that can return cleanly to frame 1. Crisp hand-authored retro pixel art with chunky silhouettes, selective highlights, readable equipment, and the same visual density as the supplied swordsman reference. Exactly four equal cells in one row. Keep character identity, costume, weapon, proportions, facing direction, camera, scale, foot baseline, and anchor point identical across all frames. The character remains in a fixed combat slot and must not travel across the canvas. Show the full character in every frame with generous transparent padding. No text, labels, borders, panel dividers, scenery, floor, cast shadow, watermark, checkerboard pattern, extra characters, duplicated equipment, or extra limbs.

| Final sheet | Subject | Action and palette |
|---|---|---|
| `assets/unit_sword_attack.png` | compact blue-and-steel swordsman | planted horizontal sword slash; blue tunic, steel helmet |
| `assets/unit_farmer_collect.png` | cheerful straw-hat farmer with a sack | reap/collect a crop, then place a gold coin into the sack; warm brown and wheat-gold |
| `assets/unit_villager_collect.png` | sturdy medieval villager with a basket | gather supplies and secure a gold coin in the basket; earthy red-brown |
| `assets/unit_dwarfb_attack.png` | stocky brown-bearded dwarf warrior with axe | heavy planted axe chop; iron and leather |
| `assets/unit_heavy_attack.png` | broad heavy infantry soldier with shield and mace | braced overhead mace smash; dark steel and muted blue |
| `assets/unit_dwarfw_attack.png` | white-bearded steel dwarf with hammer | two-handed hammer slam; bright steel and cool blue |
| `assets/unit_knight_attack.png` | disciplined knight with longsword | compact forward sword cut without stepping; polished steel and blue |
| `assets/unit_paladin_attack.png` | ornate holy paladin with shield and sword | radiant shield-and-sword strike; white, gold, and royal blue |
| `assets/unit_dark_attack.png` | horned dark knight with great blade | brutal dark-energy slash; black steel, violet, and crimson |
| `assets/unit_giant_attack.png` | colossal armored siege giant with an iron-and-bronze shoulder cannon | brace, muzzle charge, long-range cannon fire, clean recoil with no smoke; steel-blue, dark iron, leather, and ember orange |
| `assets/unit_arch_attack.png` | human archer with longbow | nock, draw, arrow release, recoil; brown leather and green |
| `assets/unit_elf_attack.png` | elegant elf archer with longbow | quick precise arrow release; emerald, gold, and pale hair |
| `assets/unit_mage_attack.png` | robed wizard with staff | gather energy and release a violet magic bolt; navy and violet |
| `assets/unit_crossbow_attack.png` | veteran hooded crossbowman | raise, aim, bolt release, reload; forest green, leather, and steel |
| `assets/unit_warlock_attack.png` | sinister hooded warlock with crooked staff | conjure and release cyan-black magic; charcoal and cyan |
| `assets/unit_bombardier_attack.png` | goggled medieval powder engineer | overhand bomb wind-up, throw release, pouch recovery; rust red, leather, steel, and brass |
| `assets/unit_angel_attack.png` | armored archangel with white wings | wings brace, weapon raises, golden holy beam releases; white and gold |
| `assets/unit_dragong_attack.png` | jade-green flying dragon | hover, inhale, exhale green-gold breath, recover; jade and warm gold |

For checkerboard cleanup, the final edit prompt was:

> Preserve the sprite artwork, four-frame layout, scale, alignment, colors, and pixel edges exactly. Remove the visible checkerboard background completely and replace it with real transparent alpha. Do not repaint or redesign the character. No added objects, shadows, text, borders, or scenery.

The replacement siege-giant prompt was:

> Create one horizontal four-frame continuous attack animation for a colossal allied siege giant who functions as living artillery. He faces right and fires an enormous iron-and-bronze shoulder cannon. Frames: grounded ready stance, deep braced muzzle charge, firing with compact muzzle flash and planted-foot recoil, then clean recovery with an empty dark muzzle. Use crisp high-production dark-fantasy pixel art with clean outlines, readable midtones, steel-blue cloth, dark iron, leather, and ember orange. Keep one identity, scale, camera, foot baseline, and anchor across exactly four equal cells. Full body and cannon visible; real transparent alpha; no white or grey fringe, smoke, fog, pale particles, scenery, floor, shadow, text, borders, extra characters, extra limbs, hammer, sword, or duplicated cannon.

## Sheet contract

- PNG with real alpha transparency
- Standard units: 720 x 192 pixels, four frames of 180 x 192 pixels
- Giant artillery: 1440 x 384 pixels, four high-resolution frames of 360 x 384 pixels
- Frame order: idle, anticipation, impact/release, follow-through
- Fixed foot/body anchor; no forward travel
- Runtime timing and impact/release markers are configured in `index.html`

## Processing helpers

- `tools/normalize_unit_sheet.py` detects the four source regions, aligns their anchors, and packs the final sheet.
- `tools/recolor_dragon_sheet.py` creates hue-consistent violet and crimson dragon variants from the jade master.
