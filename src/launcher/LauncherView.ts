import { Launcher } from './Launcher';
import { createGameCard } from '../common/ui';
import '../common/styles.css';
import './launcher.css';

/**
 * LauncherView - renders the game selection UI
 */
export class LauncherView {
  private launcher: Launcher;
  private container: HTMLElement | null;

  constructor() {
    this.launcher = new Launcher();
    this.container = document.getElementById('app');
    this.render();
  }

  private render(): void {
    if (!this.container) {
      console.error('App container not found');
      return;
    }

    this.container.innerHTML = `
      <div class="launcher-container">
        <header class="launcher-header">
          <h1>🎨 Pixelparken</h1>
          <p class="subtitle">Välj ett spel att spela!</p>
        </header>

        <section class="games-section">
          <h2>📚 Pedagogiska spel</h2>
          <div class="games-grid" id="educational-games"></div>
        </section>

        <section class="games-section">
          <h2>🎮 Nöjesspel</h2>
          <div class="games-grid" id="fun-games"></div>
          <p class="coming-soon">Fler spel kommer snart!</p>
        </section>

        <footer class="launcher-footer">
          <p>Pixelparken v0.1 - Reklamfritt och roligt!</p>
        </footer>
      </div>
    `;

    this.renderGames();
  }

  private renderGames(): void {
    const educationalContainer = document.getElementById('educational-games');
    const funContainer = document.getElementById('fun-games');

    if (!educationalContainer || !funContainer) return;

    const educationalGames = this.launcher.getGamesByCategory('educational');
    const funGames = this.launcher.getGamesByCategory('fun');

    educationalGames.forEach(game => {
      const card = createGameCard(game);
      educationalContainer.appendChild(card);
    });

    if (funGames.length === 0) {
      funContainer.innerHTML = '<p class="no-games">Spel kommer snart...</p>';
    } else {
      funGames.forEach(game => {
        const card = createGameCard(game);
        funContainer.appendChild(card);
      });
    }
  }
}
