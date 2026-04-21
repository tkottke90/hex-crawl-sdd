/**
 * FANTASY_PALETTE — Tone guidelines per FR-016:
 * Medieval, pre-industrial, nature-focused color scheme.
 * Earth tones, forest greens, stone greys, and parchment.
 * Used for placeholder tile generation until production art is provided.
 */
export const FANTASY_PALETTE = {
  earth: '#8B6914',
  forestGreen: '#2D5A27',
  stoneGrey: '#6B6B6B',
  parchment: '#F4E4BC',
  oceanBlue: '#1A4A7A',
  sandBeige: '#C4A45A',
  snowWhite: '#E8E8F0',
  mountainBrown: '#5A4030',
} as const;

export type PaletteKey = keyof typeof FANTASY_PALETTE;
