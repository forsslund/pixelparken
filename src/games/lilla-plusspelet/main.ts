import Phaser from 'phaser';
import { GangertabellenGame } from '../gangertabellen/GangertabellenGame';
import { makeAdditionFacts } from '../gangertabellen/scheduler';
import '../../common/styles.css';
import './lilla-plusspelet.css';

const MAX_SUM = 10;

const scene = new GangertabellenGame({
  sceneKey: 'LillaPlusspeletGame',
  storageKey: 'lilla-plusspelet-stats-v1',
  title: '➕ Lilla plusspelet',
  operation: 'add',
  factBuilder: () => makeAdditionFacts(MAX_SUM, false),
  gridLayout: {
    rowMin: 1,
    rowMax: MAX_SUM - 1,
    colMin: 1,
    colMax: MAX_SUM - 1,
    cellExists: (a, b) => a + b <= MAX_SUM,
  },
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
    <h1>➕ Lilla plusspelet</h1>
    <div class="session-display">
      <span>Plus där svaret är upp till 10</span>
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
