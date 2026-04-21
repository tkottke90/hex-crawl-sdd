import './style.css';
import * as Phaser from 'phaser';
import { Boot } from './game/scenes/Boot';
import { Preloader } from './game/scenes/Preloader';
import { MainMenu } from './game/scenes/MainMenu';
import { WorldMap } from './game/scenes/WorldMap';
import { Combat } from './game/scenes/Combat';
import { VictorySummary } from './game/scenes/VictorySummary';
import { RunEnd } from './game/scenes/RunEnd';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  scene: [Boot, Preloader, MainMenu, WorldMap, Combat, VictorySummary, RunEnd],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export const game = new Phaser.Game(config);

// Expose game instance for E2E tests (safe for a local-first game)
(window as Window & typeof globalThis & { __hexGame: Phaser.Game }).__hexGame = game;
