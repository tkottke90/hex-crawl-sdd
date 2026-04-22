# Retrospective - 004 World Map Detail

**Original Problem**: The world map was a uniform grid of dark-blue hexes with no visual differentiation or animation, making it hard to read and feel static.

## What went well

- The tile rendering correctly resized to 72px display size, allowing for more detailed pixel art.
- Each tile type now has distinct artwork and color scheme that makes the terrain easily recognizable at a glance.

## What went wrong

- Tile animations interrupted the rendering loop which caused some interaction issues (ended up turning off animations)
- The new tile sizes and animations resulted in a mismatch between the cursor position and the tile hit areas, which caused some confusion when trying to click on tiles.
- Originally the hexagon size did not changes and we had to request the `/speckit.implement` agent retry the implementation with the correct 2x size requirement after the first attempt.
- Tile hitboxes were broken which required follow up changes

### Tile Hitbox Issue

The hex grid uses `toPixel(coord, size)` where `size` is the hex **radius** (center-to-vertex, 72px), not the diameter. This means tile centers are spaced `72 × √3 ≈ 125px` apart horizontally and `72 × 1.5 = 108px` vertically. The tile sprites were rendered at `72×72px` (treating the radius as a diameter), leaving ~53px dark gaps between tiles. After fixing the display size to `144×144px` (`TILE_SIZE * 2`), the sprites filled the grid correctly.

However, the interactive hit detection was still registered as per-tile `pointerover`/`pointerdown` events using a `Circle(radius=72)` hit area on each sprite. With adjacent tile centers only ~125px apart, these circles overlap by ~19px at every edge. Phaser resolves overlapping interactive areas by **display-list order** (whichever sprite was added to the scene later wins), not by cursor proximity to the tile center. This caused hover and click to consistently fire on the wrong tile — typically the neighbor that was rendered after the intended tile.

**Fix:** Removed all interactive handlers from individual tile sprites. Replaced them with two scene-level input listeners in `initCamera()` that call `fromPixel(pointer.worldX, pointer.worldY, TILE_SIZE)` to perform a geometrically exact inverse axial projection with cube rounding. This identifies the correct hex regardless of display-list order or hit circle overlap. The looked-up key is then used to retrieve the tile from `map.tiles[key]` before dispatching to `setHoveredTileCoord()` or `onTileClick()`.