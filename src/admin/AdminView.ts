import { getTotalCurrency, addCurrency, subtractCurrency, formatCurrency } from '../common/currency';

const ADMIN_PASSWORD = 'pixelparken123'; // Simple password for demo
const SESSION_KEY = 'pixelparken_admin_session';

export class AdminView {
    private container: HTMLElement;
    private isAuthenticated: boolean = false;

    constructor(containerId: string) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.checkSession();
        this.render();
    }

    private checkSession(): void {
        const session = sessionStorage.getItem(SESSION_KEY);
        this.isAuthenticated = session === 'true';
    }

    private setSession(authenticated: boolean): void {
        if (authenticated) {
            sessionStorage.setItem(SESSION_KEY, 'true');
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
        this.isAuthenticated = authenticated;
    }

    private handleLogin(password: string): boolean {
        if (password === ADMIN_PASSWORD) {
            this.setSession(true);
            return true;
        }
        return false;
    }

    private handleLogout(): void {
        this.setSession(false);
        this.render();
    }

    private handleAddCurrency(amount: number): void {
        if (amount > 0) {
            addCurrency(amount);
            this.render();
        }
    }

    private handleSubtractCurrency(amount: number): void {
        if (amount > 0) {
            const success = subtractCurrency(amount);
            if (!success) {
                alert('Inte tillräckligt med pengar för att ta bort detta belopp!');
            }
            this.render();
        }
    }

    private handleSetCurrency(amount: number): void {
        if (amount >= 0) {
            // Clear current currency and set new amount
            const current = getTotalCurrency();
            if (current > amount) {
                subtractCurrency(current - amount);
            } else if (current < amount) {
                addCurrency(amount - current);
            }
            this.render();
        }
    }

    private renderLoginForm(): string {
        return `
            <div class="admin-wrapper">
                <div class="admin-container">
                    <div class="admin-header">
                        <h1>🔐 Admin</h1>
                        <p>Ange lösenord för att fortsätta</p>
                    </div>
                    <form class="password-form" id="login-form">
                        <div class="form-group">
                            <label for="password">Lösenord:</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Ange lösenord..."
                                required
                                autocomplete="current-password"
                            />
                            <span class="error-message" id="error-message">Fel lösenord. Försök igen.</span>
                        </div>
                        <button type="submit" class="btn btn-primary">Logga in</button>
                        <button type="button" class="btn btn-secondary" id="back-to-home">Tillbaka till startsidan</button>
                    </form>
                </div>
            </div>
        `;
    }

    private renderAdminContent(): string {
        const currentCurrency = getTotalCurrency();
        const formattedCurrency = formatCurrency(currentCurrency);

        return `
            <div class="admin-wrapper">
                <div class="admin-container">
                    <div class="admin-header">
                        <h1>💰 Valuta Admin</h1>
                        <p>Hantera spelarens pengar</p>
                    </div>

                    <div class="admin-content unlocked">
                        <div class="currency-display">
                            <div class="label">Nuvarande saldo</div>
                            <div class="amount">${formattedCurrency} kr</div>
                            <div class="label" style="font-size: 0.8em; margin-top: 5px;">
                                (${currentCurrency.toLocaleString('sv-SE')} kr)
                            </div>
                        </div>

                        <div class="currency-controls">
                            <div class="form-group">
                                <label>Ange belopp:</label>
                                <div class="control-group">
                                    <input
                                        type="number"
                                        id="amount-input"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div class="btn-group">
                                <button class="btn btn-success" id="add-btn">
                                    ➕ Lägg till
                                </button>
                                <button class="btn btn-danger" id="subtract-btn">
                                    ➖ Ta bort
                                </button>
                                <button class="btn btn-primary" id="set-btn" style="grid-column: 1 / -1;">
                                    🎯 Sätt exakt belopp
                                </button>
                            </div>

                            <div class="form-group">
                                <label>Snabbvärden:</label>
                                <div class="quick-amounts">
                                    <button class="btn btn-secondary" data-amount="1000">+1k</button>
                                    <button class="btn btn-secondary" data-amount="10000">+10k</button>
                                    <button class="btn btn-secondary" data-amount="100000">+100k</button>
                                    <button class="btn btn-secondary" data-amount="1000000">+1m</button>
                                    <button class="btn btn-secondary" data-amount="10000000">+10m</button>
                                    <button class="btn btn-secondary" data-amount="1000000000">+1b</button>
                                </div>
                            </div>
                        </div>

                        <div class="admin-footer">
                            <button class="btn btn-logout" id="logout-btn">
                                🚪 Logga ut
                            </button>
                            <button class="btn btn-back" id="back-btn">
                                🏠 Till startsidan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private attachEventListeners(): void {
        if (!this.isAuthenticated) {
            const loginForm = document.getElementById('login-form') as HTMLFormElement;
            const errorMessage = document.getElementById('error-message');
            const backBtn = document.getElementById('back-to-home');

            loginForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                const passwordInput = document.getElementById('password') as HTMLInputElement;
                const password = passwordInput.value;

                if (this.handleLogin(password)) {
                    this.render();
                } else {
                    errorMessage?.classList.add('visible');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            });

            backBtn?.addEventListener('click', () => {
                window.location.href = '../index.html';
            });
        } else {
            const amountInput = document.getElementById('amount-input') as HTMLInputElement;
            const addBtn = document.getElementById('add-btn');
            const subtractBtn = document.getElementById('subtract-btn');
            const setBtn = document.getElementById('set-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const backBtn = document.getElementById('back-btn');

            const getAmount = (): number => {
                const value = parseInt(amountInput.value, 10);
                return isNaN(value) ? 0 : value;
            };

            addBtn?.addEventListener('click', () => {
                const amount = getAmount();
                if (amount > 0) {
                    this.handleAddCurrency(amount);
                    amountInput.value = '';
                } else {
                    alert('Ange ett giltigt belopp större än 0');
                }
            });

            subtractBtn?.addEventListener('click', () => {
                const amount = getAmount();
                if (amount > 0) {
                    this.handleSubtractCurrency(amount);
                    amountInput.value = '';
                } else {
                    alert('Ange ett giltigt belopp större än 0');
                }
            });

            setBtn?.addEventListener('click', () => {
                const amount = getAmount();
                if (amount >= 0) {
                    this.handleSetCurrency(amount);
                    amountInput.value = '';
                } else {
                    alert('Ange ett giltigt belopp (0 eller högre)');
                }
            });

            // Quick amount buttons
            const quickBtns = document.querySelectorAll('[data-amount]');
            quickBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const amount = parseInt((btn as HTMLElement).dataset.amount || '0', 10);
                    this.handleAddCurrency(amount);
                });
            });

            logoutBtn?.addEventListener('click', () => {
                this.handleLogout();
            });

            backBtn?.addEventListener('click', () => {
                window.location.href = '../index.html';
            });
        }
    }

    public render(): void {
        if (this.isAuthenticated) {
            this.container.innerHTML = this.renderAdminContent();
        } else {
            this.container.innerHTML = this.renderLoginForm();
        }
        this.attachEventListeners();
    }
}
