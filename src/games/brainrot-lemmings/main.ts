import Phaser from 'phaser';
import { BrainrotLemmings } from './BrainrotLemmings';
import '../../common/styles.css';
import './brainrot-lemmings.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 700,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: BrainrotLemmings,
};

// Game state interface
interface GameState {
  spawned: number;
  saved: number;
  lost: number;
  abilities: {
    dig: number;
    build: number;
    climb: number;
    block: number;
  };
  selectedAbility: string | null;
}

let gameInstance: Phaser.Game;

// Add UI elements
document.addEventListener('DOMContentLoaded', () => {
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-secondary back-button" id="back-btn">← Tillbaka</button>
    <h1>🧠 Brainrot Lemmings</h1>
    <div class="score-display">
      <span>Räddade: <strong id="saved">0</strong> / <strong id="spawned">0</strong></span>
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

  // Create ability panel
  const abilityPanel = document.createElement('div');
  abilityPanel.className = 'ability-panel';
  abilityPanel.innerHTML = `
    <button class="ability-btn" id="ability-dig" data-ability="dig">
      <span class="ability-icon">⛏️</span>
      <span class="ability-name">Gräva</span>
      <span class="ability-count" id="count-dig">5</span>
    </button>
    <button class="ability-btn" id="ability-build" data-ability="build">
      <span class="ability-icon">🧱</span>
      <span class="ability-name">Bygga</span>
      <span class="ability-count" id="count-build">5</span>
    </button>
    <button class="ability-btn" id="ability-climb" data-ability="climb">
      <span class="ability-icon">🧗</span>
      <span class="ability-name">Klättra</span>
      <span class="ability-count" id="count-climb">5</span>
    </button>
    <button class="ability-btn" id="ability-block" data-ability="block">
      <span class="ability-icon">🛑</span>
      <span class="ability-name">Blockera</span>
      <span class="ability-count" id="count-block">5</span>
    </button>
  `;
  document.body.appendChild(abilityPanel);

  // Create game stats panel
  const statsPanel = document.createElement('div');
  statsPanel.className = 'game-stats';
  statsPanel.innerHTML = `
    <h3>📊 Statistik</h3>
    <div class="stat-line">
      <span>Spawnade:</span>
      <span class="stat-value" id="stat-spawned">0</span>
    </div>
    <div class="stat-line">
      <span>Räddade:</span>
      <span class="stat-value" id="stat-saved">0</span>
    </div>
    <div class="stat-line">
      <span>Förlorade:</span>
      <span class="stat-value" id="stat-lost">0</span>
    </div>
    <div class="stat-line">
      <span>Räddnings%:</span>
      <span class="stat-value" id="stat-percent">0%</span>
    </div>
  `;
  document.body.appendChild(statsPanel);

  // Create game controls
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'game-controls';
  controlsPanel.innerHTML = `
    <button class="control-btn" id="btn-pause">⏸️ Pausa</button>
    <button class="control-btn" id="btn-fast">⏩ Snabba</button>
  `;
  document.body.appendChild(controlsPanel);

  // Set up ability button listeners
  const abilityButtons = document.querySelectorAll('.ability-btn');
  abilityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ability = btn.getAttribute('data-ability');
      if (ability && window.gameState) {
        // Deselect all buttons
        abilityButtons.forEach(b => b.classList.remove('selected'));

        // Select this button if it has uses left
        const count = window.gameState.abilities[ability as keyof typeof window.gameState.abilities];
        if (count > 0) {
          btn.classList.add('selected');
          window.gameState.selectedAbility = ability;
        }
      }
    });
  });

  // Set up control button listeners
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (window.togglePause) {
        window.togglePause();
      }
    });
  }

  const fastBtn = document.getElementById('btn-fast');
  if (fastBtn) {
    fastBtn.addEventListener('click', () => {
      if (window.toggleSpeed) {
        window.toggleSpeed();
      }
    });
  }

  // Start the game
  gameInstance = new Phaser.Game(config);
});

// Extend Window interface for game functions
declare global {
  interface Window {
    gameState: GameState;
    updateGameStats: (state: GameState) => void;
    useAbility: (ability: string) => void;
    showGameOver: (won: boolean, saved: number, total: number) => void;
    togglePause: () => void;
    toggleSpeed: () => void;
  }
}

// Initialize game state
window.gameState = {
  spawned: 0,
  saved: 0,
  lost: 0,
  abilities: {
    dig: 5,
    build: 5,
    climb: 5,
    block: 5,
  },
  selectedAbility: null,
};

// Update game stats display
window.updateGameStats = (state: GameState) => {
  window.gameState = state;

  // Update header
  const savedEl = document.getElementById('saved');
  const spawnedEl = document.getElementById('spawned');
  if (savedEl) savedEl.textContent = state.saved.toString();
  if (spawnedEl) spawnedEl.textContent = state.spawned.toString();

  // Update stats panel
  const statSaved = document.getElementById('stat-saved');
  const statSpawned = document.getElementById('stat-spawned');
  const statLost = document.getElementById('stat-lost');
  const statPercent = document.getElementById('stat-percent');

  if (statSaved) statSaved.textContent = state.saved.toString();
  if (statSpawned) statSpawned.textContent = state.spawned.toString();
  if (statLost) statLost.textContent = state.lost.toString();
  if (statPercent) {
    const percent = state.spawned > 0 ? Math.floor((state.saved / state.spawned) * 100) : 0;
    statPercent.textContent = `${percent}%`;
  }

  // Update ability counts
  Object.keys(state.abilities).forEach(ability => {
    const countEl = document.getElementById(`count-${ability}`);
    const btnEl = document.getElementById(`ability-${ability}`);
    const count = state.abilities[ability as keyof typeof state.abilities];

    if (countEl) countEl.textContent = count.toString();
    if (btnEl) {
      if (count === 0) {
        btnEl.classList.add('disabled');
        btnEl.classList.remove('selected');
      } else {
        btnEl.classList.remove('disabled');
      }
    }
  });

  // Deselect if no uses left
  if (state.selectedAbility) {
    const count = state.abilities[state.selectedAbility as keyof typeof state.abilities];
    if (count === 0) {
      state.selectedAbility = null;
      document.querySelectorAll('.ability-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
    }
  }
};

// Use an ability (called from game)
window.useAbility = (ability: string) => {
  if (window.gameState.abilities[ability as keyof typeof window.gameState.abilities] > 0) {
    window.gameState.abilities[ability as keyof typeof window.gameState.abilities]--;
    window.gameState.selectedAbility = null;

    // Deselect all buttons
    document.querySelectorAll('.ability-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    window.updateGameStats(window.gameState);
  }
};

// Show game over screen
window.showGameOver = (won: boolean, saved: number, total: number) => {
  const gameOverScreen = document.createElement('div');
  gameOverScreen.className = 'game-over-screen';

  const percent = total > 0 ? Math.floor((saved / total) * 100) : 0;
  const resultClass = won ? 'success' : 'failure';
  const resultText = won ? '🎉 Du vann!' : '😢 Du förlorade!';
  const message = won
    ? 'Grattis! Du räddade tillräckligt många brainrot-gubbar!'
    : 'Tyvärr räddade du inte tillräckligt många...';

  gameOverScreen.innerHTML = `
    <h2>${resultText}</h2>
    <p>${message}</p>
    <div class="result ${resultClass}">
      ${saved} / ${total} räddade (${percent}%)
    </div>
    <p>Du behövde rädda minst 50% för att vinna.</p>
    <button class="restart-btn" id="restart-btn">🔄 Spela igen</button>
  `;

  document.body.appendChild(gameOverScreen);

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      gameOverScreen.remove();

      // Reset game state
      window.gameState = {
        spawned: 0,
        saved: 0,
        lost: 0,
        abilities: {
          dig: 5,
          build: 5,
          climb: 5,
          block: 5,
        },
        selectedAbility: null,
      };
      window.updateGameStats(window.gameState);

      // Restart the game
      if (gameInstance) {
        gameInstance.scene.stop('BrainrotLemmings');
        gameInstance.scene.start('BrainrotLemmings');
      }
    });
  }
};
