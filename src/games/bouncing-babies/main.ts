import Phaser from 'phaser';
import { BouncingBabiesGame } from './BouncingBabiesGame';
import '../../common/styles.css';
import './bouncing-babies.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: BouncingBabiesGame,
};

// Add back button and header
document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>👶 Bouncing Babies</h1>
    <div class="score-display">
      <span>Poäng: <strong id="score">0</strong></span>
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

  // Start the game
  new Phaser.Game(config);
});

// Extend Window interface for game functions
declare global {
  interface Window {
    updateScore?: (score: number) => void;
  }
}

// Export score update function for use in the game
window.updateScore = (score: number) => {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = score.toString();
  }
};
