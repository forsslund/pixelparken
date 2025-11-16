import { Launcher } from './Launcher';
import { createGameCard } from '../common/ui';
import { getTotalCurrency, formatCurrency } from '../common/currency';
import { SHOP_ITEMS, getPurchasedItems, purchaseItem, canAfford, getTotalMultiplier } from '../common/shop';
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
    this.setupShopEventListeners();
  }

  private render(): void {
    if (!this.container) {
      console.error('App container not found');
      return;
    }

    const currency = getTotalCurrency();
    const multiplier = getTotalMultiplier();

    this.container.innerHTML = `
      <div class="launcher-container">
        <header class="launcher-header">
          <div class="header-top">
            <h1>🎨 Pixelparken</h1>
            <div class="currency-display">
              <div class="currency-amount">💰 <span id="currency-value">${formatCurrency(currency)}</span></div>
              <div class="multiplier-display">⚡ ${formatCurrency(multiplier)}/svar</div>
            </div>
          </div>
          <p class="subtitle">Välj ett spel att spela!</p>
        </header>

        <section class="games-section">
          <h2>📚 Pedagogiska spel</h2>
          <div class="games-grid" id="educational-games"></div>
        </section>

        <section class="shop-section">
          <h2>🏪 Garage & Butik</h2>

          <div class="shop-tabs">
            <button class="tab-button active" data-tab="garage">🏆 Mitt Garage</button>
            <button class="tab-button" data-tab="shop">🛒 Butik</button>
          </div>

          <div class="tab-content active" id="garage-tab">
            <div id="garage-grid" class="garage-grid"></div>
          </div>

          <div class="tab-content" id="shop-tab">
            <div id="shop-grid" class="shop-grid"></div>
          </div>
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
    this.renderShop();
    this.renderGarage();
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

  private renderShop(): void {
    const shopGrid = document.getElementById('shop-grid');
    if (!shopGrid) return;

    const purchased = getPurchasedItems();

    shopGrid.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
      const owned = purchased.includes(item.id);
      const affordable = canAfford(item.id);

      const card = document.createElement('div');
      card.className = `shop-item ${owned ? 'owned' : ''} ${affordable && !owned ? 'affordable' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <p class="shop-item-description">${item.description}</p>
        <div class="shop-item-price">${formatCurrency(item.price)}</div>
        <div class="shop-item-multiplier">×${item.multiplier} multiplier</div>
        ${owned
          ? '<div class="owned-badge">✅ ÄGS</div>'
          : `<button class="btn-primary shop-buy-button" data-item-id="${item.id}" ${!affordable ? 'disabled' : ''}>
              ${affordable ? 'Köp' : 'Inte råd'}
             </button>`
        }
      `;

      shopGrid.appendChild(card);
    });
  }

  private renderGarage(): void {
    const garageGrid = document.getElementById('garage-grid');
    if (!garageGrid) return;

    const purchased = getPurchasedItems();

    if (purchased.length === 0) {
      garageGrid.innerHTML = `
        <div class="empty-garage">
          <p class="empty-message">🏗️ Ditt garage är tomt!</p>
          <p class="empty-hint">Spela klockan-spelet för att tjäna pengar och köp din första item!</p>
        </div>
      `;
      return;
    }

    garageGrid.innerHTML = '';

    purchased.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return;

      const card = document.createElement('div');
      card.className = 'garage-item';
      card.innerHTML = `
        <div class="garage-item-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <div class="garage-item-multiplier">×${item.multiplier}</div>
      `;

      garageGrid.appendChild(card);
    });

    // Add collection progress
    const progress = document.createElement('div');
    progress.className = 'collection-progress';
    progress.innerHTML = `
      <p>Samling: ${purchased.length}/${SHOP_ITEMS.length}</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(purchased.length / SHOP_ITEMS.length) * 100}%"></div>
      </div>
    `;
    garageGrid.appendChild(progress);
  }

  private setupShopEventListeners(): void {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tab = target.dataset.tab;

        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });

        const tabContent = document.getElementById(`${tab}-tab`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });

    // Buy button handling
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('shop-buy-button')) {
        const itemId = target.dataset.itemId;
        if (!itemId) return;

        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;

        // Attempt purchase
        const success = purchaseItem(itemId);

        if (success) {
          // Show success animation
          this.showPurchaseSuccess(item.name);

          // Re-render shop and garage
          this.renderShop();
          this.renderGarage();

          // Update currency display
          const currencyValue = document.getElementById('currency-value');
          if (currencyValue) {
            currencyValue.textContent = formatCurrency(getTotalCurrency());
          }

          // Update multiplier display
          const multiplierDisplay = document.querySelector('.multiplier-display');
          if (multiplierDisplay) {
            multiplierDisplay.textContent = `⚡ ${formatCurrency(getTotalMultiplier())}/svar`;
          }
        }
      }
    });
  }

  private showPurchaseSuccess(itemName: string): void {
    const popup = document.createElement('div');
    popup.className = 'purchase-success-popup';
    popup.innerHTML = `
      <div class="purchase-success-content">
        <div class="success-icon">🎉</div>
        <h2>Grattis!</h2>
        <p>Du köpte <strong>${itemName}</strong>!</p>
      </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    }, 2000);
  }
}
