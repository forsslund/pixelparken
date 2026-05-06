import Phaser from 'phaser';
import { GangertabellenGame } from '../gangertabellen/GangertabellenGame';
import '../../common/styles.css';
import './gangertabellen-liten.css';

const scene = new GangertabellenGame({
  sceneKey: 'GangertabellenLitenGame',
  maxFactor: 5,
  storageKey: 'gangertabellen-liten-stats-v1',
  title: '🌱 Lilla gångertabellen',
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 495,
  parent: 'game-container',
  backgroundColor: '#2d3436',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scene,
};

document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>🌱 Lilla gångertabellen</h1>
    <div class="session-display">
      <span>Tabeller 1–5 — för dig som börjar</span>
    </div>
  `;

  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.before(header);
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  new Phaser.Game(config);
});
