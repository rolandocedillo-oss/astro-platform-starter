# Changelog

## 2026-01-31

### Loteria
- Updated caller layout (controls top right, auto panel centered, voice dialog, call stage).
- Added blur overlay for the next card and resized placemat tiles to match card art.
- Added image loading fallbacks for WebP/SVG and renamed deck assets to slug format.
- Added prerecorded audio support and a Piper audio generation script.

### Platform
- Added `ENABLE_EDGE_REWRITE` flag for Netlify edge rewrite.
- Documented env vars, Netlify dev usage, and audio workflow in README.

## Version History

### Block Battle - Main Game Loop (`src/scripts/block-battle/main.js`)
- 0.6.19: Replaced lobby hard clamp with wall-collision movement bounds.
- 0.6.18: Tightened lobby bounds so players cannot exit the lobby walls.
- 0.6.17: Added neon trim + lobby starfield extension for brighter lobby.
- 0.6.16: Adjusted lobby layout with rotated upgrade table, walls, and spaced pads.
- 0.6.15: Aligned lobby beyond corridor end and updated camera/clamp for lobby access.
- 0.6.14: Shifted lobby further south to prevent corridor overlap.
- 0.6.13: Rebuilt lobby layout with west wall upgrade table, switch pad, and return portal.
- 0.6.12: Centralized arena/lobby layout and spawn zones for scaling maps.
- 0.6.11: Restored hammer knockback by applying push stats on hit.
- 0.6.10: Added debug HUD toggle flag.
- 0.6.9: Spawn boss immediately on final non-boss defeat event.
- 0.6.8: Spawn boss strictly from non-boss defeat counts (no bossPending dependency).
- 0.6.7: Added debug HUD output for live wave and boss state.
- 0.6.6: Added active non-boss fallback check to boss spawn and enforced defeat accounting.
- 0.6.5: Switched boss spawn to count-based non-boss defeats and de-duplicated enemy defeat events.
- 0.6.4: Fixed boss spawn countdown logic and blocked corridor while plasma gate is active.
- 0.6.3: Added boss spawn watchdog timer when non-boss enemies are cleared.
- 0.6.2: Enforced boss spawn after non-boss clears and gated wave completion on boss defeat.
- 0.6.1: Count active enemies only and lock wave completion until boss is defeated.
- 0.6.0: Fixed corridor movement clamp, gated powerups between waves, and improved gate-based spawns.
- 0.5.9: Added wave spawn failsafe to recover when enemies fail to appear.
- 0.5.8: Added wave tracking + spawn fallback to prevent instant wave-complete loops.
- 0.5.7: Added wave-start grace window to prevent immediate re-completion loops.
- 0.5.6: Moved lobby into the same scene and removed teleport flow.
- 0.5.5: Added lobby grace period to prevent immediate return to arena.
- 0.5.4: Added debug lobby toggle and widened plasma gate visuals.
- 0.5.3: Fixed post-wave movement freeze, gated next-wave pad visibility, and updated plasma gate mesh.
- 0.5.2: Replaced post-wave UI with arena start pad + countdown.
- 0.5.1: Added armory lobby scene with gates, plasma shield, and basic shop/dummy flow.
- 0.5.0: Allow selecting the same weapon by swapping primary/secondary in armory.
- 0.4.9: Rogue now damages any enemies/players within attack range.
- 0.4.8: Added Rogue Mode toggle and rogue AI that attacks everyone.
- 0.4.7: Stabilized homing projectile speed at long distances.
- 0.4.6: Added active weapon highlights, swap hint, and back-to-primary flow.
- 0.4.5: Added primary/secondary weapon selection flow and HUD panels.
- 0.4.4: Added wave display HUD and starfield background beyond arena.
- 0.4.3: Homing projectiles now fire for melee weapons; wave starts spawn powerups.
- 0.4.2: Prevented auto-attack on round start and improved south-edge camera pan.
- 0.4.1: Cleaned dead enemies, cleared bombs/spears on new waves, added basic dodge AI, and improved camera zoom.
- 0.4.0: Bombs now support 3 quick drops and apply powerup effects on explosion.
- 0.3.9: Enemies now face movement; spears orient to travel and show markers when stuck.
- 0.3.8: Powerups now clear immediately on player death.
- 0.3.7: Added powerup letters, HUD status/timer, level heal, and sword range update.
- 0.3.6: Added enemy separation, gate spawns, delayed boss entry, and shield blocking.
- 0.3.5: Added 3-pack ammo + recharge for bombs and spears.
- 0.3.4: Frost/Flame/Oil now apply on hit; shrink/grow scales stats and visuals.
- 0.3.3: Tornado now applies on hit; fart disables attacking during stun.
- 0.3.2: Added homing powerup behavior for bow/spear/bomb projectiles and updated fart color.
- 0.3.1: Adjusted arrow orientation to point in firing direction.
- 0.3.0: Bow now fires in the direction of player movement.
- 0.2.9: Fixed bow hit detection to use ground-plane distance.
- 0.2.8: Added arena boundary walls and clearer weapon visuals (hammer/bow/shield/spear).
- 0.2.7: Added pause button and pause state handling.
- 0.2.6: Added weapon icons in armory tabs and detail panel.
- 0.2.5: Switched armory UI to weapon tabs + detail panel.
- 0.2.4: Refined armory stats display, map sizing, and projectile speed stats.
- 0.2.3: Added armory weapon cards with stats, wave-based arena maps, and expanded weapon stats.
- 0.2.2: Added player death handling with game over UI and retry flow.
- 0.2.1: Added wave/boss messaging, upgrade table, powerup HUD, and weapon visuals.
- 0.2.0: Added comments and Phase 1 systems (weapons, enemies, powerups, HUD, menu).

### Block Battle - Arena Shell (`src/pages/games/block-battle.astro`)
- 0.3.1: Added debug HUD panel for testing.
- 0.3.0: Removed post-wave modal in favor of arena pad.
- 0.2.9: Added Rogue Mode toggle to the armory menu.
- 0.2.8: Highlighted active weapon, added swap hint, and back-to-primary control.
- 0.2.7: Split HUD into panels and added primary/secondary weapon armory flow.
- 0.2.6: Added powerup status and timer HUD rows.
- 0.2.5: Added pause button to the HUD.
- 0.2.4: Redesigned armory to use weapon tabs with a detail panel.
- 0.2.3: Updated armory layout with weapon cards, stat summaries, and styling polish.
- 0.2.1: Added powerup legend, active powerup HUD, and wave overlay UI.
- 0.2.0: Added menu/HUD structure and training layout comments.

### Robot Factory (`src/scripts/Robot.js`)
- 0.2.9: Added a held bomb mesh for the bomb weapon visual.
- 0.2.8: Positioned hammer head higher on the arm for a top-down swing.
- 0.2.7: Lengthened hammer handle and attached head to the tip.
- 0.2.6: Moved hammer head forward and added red handle + gray head materials.
- 0.2.5: Extended sword blade length for better reach visibility.
- 0.2.4: Restored cube head with a front-only neon face.
- 0.2.3: Simplified head to a single-face plate for facing clarity.
- 0.2.2: Added bow, shield, and spear meshes for clearer weapon visuals.
- 0.2.1: Added hammer head mesh toggle for weapon visuals.
- 0.2.0: Added documentation comments for robot mesh composition.

### Input Manager (`src/scripts/InputManager.js`)
- 0.2.0: Added documentation comments and preserved input mapping.

### API Proxy (`src/pages/api/proxy.ts`)
- 2026-01-28: Proxy Gemini generateContent requests server-side with `MY_SERVICE_API_KEY`.
- 2026-01-28: Disable prerendering so POST works in dev/build.

### Home Page (`src/pages/index.astro`)
- 0.2.0: Added release header and inline comments for homepage structure.
