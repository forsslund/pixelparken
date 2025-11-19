/**
 * Guestbook Component
 */

import { api } from '../../common/api';
import { userStore } from '../../common/userStore';

export class Guestbook {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const user = userStore.getUser();

    this.container.innerHTML = `
      <div class="guestbook">
        <h2>📖 Gästbok</h2>

        ${user ? `
          <div class="guestbook-form">
            <textarea
              id="guestbook-message"
              placeholder="Skriv ett meddelande..."
              maxlength="500"
            ></textarea>
            <button id="guestbook-submit" class="primary-btn">
              Lägg till meddelande
            </button>
          </div>
        ` : ''}

        <div id="guestbook-entries" class="guestbook-entries">
          <p>Laddar...</p>
        </div>
      </div>
    `;

    await this.loadEntries();
    this.attachEventListeners();
  }

  private async loadEntries(): Promise<void> {
    const entriesContainer = this.container.querySelector('#guestbook-entries') as HTMLElement;

    try {
      const entries = await api.getGuestbookEntries(20, 0);

      if (entries.length === 0) {
        entriesContainer.innerHTML = '<p class="no-entries">Inga meddelanden än. Var den första att skriva!</p>';
        return;
      }

      entriesContainer.innerHTML = entries.map(entry => `
        <div class="guestbook-entry">
          <div class="entry-header">
            <span class="entry-avatar">${entry.avatar}</span>
            <span class="entry-username">${this.escapeHtml(entry.username)}</span>
            <span class="entry-date">${this.formatDate(entry.createdAt)}</span>
          </div>
          <div class="entry-message">${this.escapeHtml(entry.message)}</div>
        </div>
      `).join('');
    } catch (error) {
      entriesContainer.innerHTML = '<p class="error">Kunde inte ladda gästboken.</p>';
      console.error('Failed to load guestbook:', error);
    }
  }

  private attachEventListeners(): void {
    const submitBtn = this.container.querySelector('#guestbook-submit') as HTMLButtonElement;
    const messageInput = this.container.querySelector('#guestbook-message') as HTMLTextAreaElement;

    if (!submitBtn || !messageInput) {
      return;
    }

    submitBtn.addEventListener('click', () => {
      void (async () => {
        const user = userStore.getUser();
        if (!user) return;

        const message = messageInput.value.trim();
        if (!message) return;

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sparar...';

          await api.createGuestbookEntry(user.username, message, user.avatar);
          messageInput.value = '';

          await this.loadEntries();

          submitBtn.disabled = false;
          submitBtn.textContent = 'Lägg till meddelande';
        } catch (error) {
          alert('Kunde inte spara meddelandet. Försök igen.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Lägg till meddelande';
          console.error('Failed to create guestbook entry:', error);
        }
      })();
    });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just nu';
    if (diffMins < 60) return `${diffMins} min sedan`;
    if (diffHours < 24) return `${diffHours} timmar sedan`;
    if (diffDays < 7) return `${diffDays} dagar sedan`;

    return d.toLocaleDateString('sv-SE');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
