/**
 * User Registration Component
 */

import { api, AVATARS } from '../../common/api';
import { userStore } from '../../common/userStore';

export class UserRegistration {
  private container: HTMLElement;
  private onComplete: () => void;

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="registration-modal">
        <div class="registration-content">
          <h2>Välkommen till Pixelparken!</h2>
          <p>Välj ett användarnamn och en avatar:</p>

          <div class="form-group">
            <label for="username">Användarnamn:</label>
            <input
              type="text"
              id="username"
              placeholder="Ditt namn"
              maxlength="20"
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label>Välj din avatar:</label>
            <div class="avatar-grid">
              ${AVATARS.map(avatar => `
                <button class="avatar-btn" data-avatar="${avatar}">
                  ${avatar}
                </button>
              `).join('')}
            </div>
          </div>

          <button id="register-btn" class="primary-btn" disabled>
            Skapa konto
          </button>

          <p class="error-message" id="error-message"></p>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const avatarBtns = this.container.querySelectorAll('.avatar-btn');
    const registerBtn = this.container.querySelector('#register-btn') as HTMLButtonElement;
    const errorMessage = this.container.querySelector('#error-message') as HTMLElement;

    let selectedAvatar = '';

    // Avatar selection
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAvatar = btn.getAttribute('data-avatar') || '';
        this.updateRegisterButton(usernameInput, registerBtn, selectedAvatar);
      });
    });

    // Username input
    usernameInput.addEventListener('input', () => {
      this.updateRegisterButton(usernameInput, registerBtn, selectedAvatar);
    });

    // Register button
    registerBtn.addEventListener('click', async () => {
      const username = usernameInput.value.trim();

      if (!username || !selectedAvatar) {
        return;
      }

      try {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Skapar konto...';
        errorMessage.textContent = '';

        const user = await api.createUser(username, selectedAvatar);
        userStore.setUser(user);
        this.onComplete();
      } catch (error) {
        errorMessage.textContent = error instanceof Error
          ? error.message
          : 'Något gick fel. Försök igen.';
        registerBtn.disabled = false;
        registerBtn.textContent = 'Skapa konto';
      }
    });
  }

  private updateRegisterButton(
    input: HTMLInputElement,
    button: HTMLButtonElement,
    avatar: string
  ): void {
    const username = input.value.trim();
    button.disabled = !username || username.length < 2 || !avatar;
  }
}
