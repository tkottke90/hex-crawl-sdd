# Retrospective - 005 Random Map Generation

**Original Problem**: The current map generator always produced the same map for a new game.  

## What went well

- Map generation is random on New Game
- Player can move around the map and see the terrain

## What went wrong

- Some maps are tiny and impassable due to the way the seed is generated.
  - Might be worth removing oceans from the seed generation process

## What would we change?

- Seed is truncated in the card.  This makes it impossible to copy.  Might have been nice to have a copy button that copies the full seed to clipboard.

## Other Callouts

- No Cities
- No Enemies