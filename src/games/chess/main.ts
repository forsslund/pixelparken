import Phaser from 'phaser';
import { ChessGame } from './ChessGame';
import '../../common/styles.css';
import './chess.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2C2C2C',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: ChessGame,
};

// Add back button and header
document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>♟️ Schack - Matt med Kung och Torn</h1>
    <div class="score-display">
      <span id="game-status">Din tur</span>
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
    updateGameStatus?: (status: string) => void;
  }
}

// Export status update function for use in the game
window.updateGameStatus = (status: string) => {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.textContent = status;
  }
};
