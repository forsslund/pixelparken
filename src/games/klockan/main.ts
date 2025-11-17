import Phaser from 'phaser';
import { ClockGame } from './ClockGame';
import '../../common/styles.css';
import './klockan.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#47C5FF',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: ClockGame,
};

// Add back button and header
document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>🕐 Lär dig klockan</h1>
    <div class="score-display">
      <span>kr: <strong id="score">0</strong></span>
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
    updateCurrency?: (currency: number) => void;
  }
}

// Export currency update function for use in the game
window.updateCurrency = (currency: number) => {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    // Format large numbers with k, m, b suffixes
    const formatted = currency >= 1000
      ? (currency >= 1e9 ? `${(currency / 1e9).toFixed(1)}b`
        : currency >= 1e6 ? `${(currency / 1e6).toFixed(1)}m`
        : `${(currency / 1000).toFixed(1)}k`)
      : currency.toString();
    scoreElement.textContent = formatted;
  }
};
