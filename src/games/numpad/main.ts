import Phaser from 'phaser';
import { NumpadGame } from './NumpadGame';
import '../../common/styles.css';
import './numpad.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 508,
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
  scene: NumpadGame,
};

document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>🔢 Numpadträning</h1>
    <div class="progress-display">
      <span>Lektion: <strong id="lesson-progress">1/10</strong></span>
      <span style="margin-left: 20px;">Övning: <strong id="exercise-progress">1/10</strong></span>
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

declare global {
  interface Window {
    updateProgress?: (lesson: number, exercise: number) => void;
  }
}

window.updateProgress = (lesson: number, exercise: number) => {
  const lessonElement = document.getElementById('lesson-progress');
  const exerciseElement = document.getElementById('exercise-progress');

  if (lessonElement) {
    lessonElement.textContent = `${lesson}/10`;
  }

  if (exerciseElement) {
    exerciseElement.textContent = `${exercise}/10`;
  }
};
