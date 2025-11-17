import Phaser from 'phaser';
import { TangentGame } from './TangentGame';
import '../../common/styles.css';
import './tangent.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 550,
  parent: 'game-container',
  backgroundColor: '#2d3436',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: TangentGame,
};

// Add back button and header
document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>⌨️ Tangentträning</h1>
    <div class="progress-display">
      <span>Lektion: <strong id="lesson-progress">1/10</strong></span>
      <span style="margin-left: 20px;">Övning: <strong id="exercise-progress">1/20</strong></span>
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
    updateProgress?: (lesson: number, exercise: number) => void;
  }
}

// Export progress update function for use in the game
window.updateProgress = (lesson: number, exercise: number) => {
  const lessonElement = document.getElementById('lesson-progress');
  const exerciseElement = document.getElementById('exercise-progress');

  if (lessonElement) {
    lessonElement.textContent = `${lesson}/10`;
  }

  if (exerciseElement) {
    exerciseElement.textContent = `${exercise}/20`;
  }
};
