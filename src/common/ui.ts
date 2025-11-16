/**
 * Common UI helper functions for Pixelparken
 */

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  category: 'educational' | 'fun';
  icon: string;
  path: string;
}

/**
 * Create a game card element
 */
export function createGameCard(game: GameInfo): HTMLElement {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.innerHTML = `
    <div class="game-icon">${game.icon}</div>
    <h3>${game.name}</h3>
    <p>${game.description}</p>
    <button class="btn-primary">Spela</button>
  `;

  const button = card.querySelector('button');
  if (button) {
    button.addEventListener('click', () => {
      window.location.href = game.path;
    });
  }

  return card;
}

/**
 * Show a simple notification
 */
export function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Create a back button
 */
export function createBackButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'btn-secondary back-button';
  button.textContent = '← Tillbaka';
  button.addEventListener('click', () => {
    window.location.href = '/';
  });
  return button;
}
