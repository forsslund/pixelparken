import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminView } from '../AdminView';
import * as currency from '../../common/currency';

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

// Mock localStorage for currency functions
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('AdminView', () => {
    let container: HTMLElement;

    beforeEach(() => {
        // Clear storage
        sessionStorageMock.clear();
        localStorageMock.clear();

        // Create container
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // Mock alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.restoreAllMocks();
    });

    it('should create AdminView instance', () => {
        const adminView = new AdminView('test-container');
        expect(adminView).toBeDefined();
    });

    it('should throw error if container not found', () => {
        expect(() => new AdminView('non-existent')).toThrow();
    });

    it('should render login form when not authenticated', () => {
        new AdminView('test-container');
        const passwordInput = container.querySelector('#password');
        expect(passwordInput).not.toBeNull();
    });

    it('should show error on wrong password', () => {
        new AdminView('test-container');
        const form = container.querySelector('#login-form') as HTMLFormElement;
        const passwordInput = container.querySelector('#password') as HTMLInputElement;
        const errorMessage = container.querySelector('#error-message');

        passwordInput.value = 'wrongpassword';
        form.dispatchEvent(new Event('submit'));

        expect(errorMessage?.classList.contains('visible')).toBe(true);
    });

    it('should authenticate with correct password', () => {
        new AdminView('test-container');
        const form = container.querySelector('#login-form') as HTMLFormElement;
        const passwordInput = container.querySelector('#password') as HTMLInputElement;

        passwordInput.value = 'pixelparken123';
        form.dispatchEvent(new Event('submit'));

        // After login, should show admin content
        const currencyDisplay = container.querySelector('.currency-display');
        expect(currencyDisplay).not.toBeNull();
    });

    it('should persist session in sessionStorage', () => {
        new AdminView('test-container');
        const form = container.querySelector('#login-form') as HTMLFormElement;
        const passwordInput = container.querySelector('#password') as HTMLInputElement;

        passwordInput.value = 'pixelparken123';
        form.dispatchEvent(new Event('submit'));

        expect(sessionStorage.getItem('pixelparken_admin_session')).toBe('true');
    });

    it('should show admin content when session exists', () => {
        sessionStorage.setItem('pixelparken_admin_session', 'true');
        new AdminView('test-container');

        const currencyDisplay = container.querySelector('.currency-display');
        expect(currencyDisplay).not.toBeNull();
    });

    it('should display current currency', () => {
        sessionStorage.setItem('pixelparken_admin_session', 'true');

        // Set some currency
        vi.spyOn(currency, 'getTotalCurrency').mockReturnValue(1000);

        new AdminView('test-container');

        const currencyAmount = container.querySelector('.currency-display .amount');
        expect(currencyAmount?.textContent).toContain('kr');
    });

    it('should have add, subtract, and set buttons', () => {
        sessionStorage.setItem('pixelparken_admin_session', 'true');
        new AdminView('test-container');

        const addBtn = container.querySelector('#add-btn');
        const subtractBtn = container.querySelector('#subtract-btn');
        const setBtn = container.querySelector('#set-btn');

        expect(addBtn).not.toBeNull();
        expect(subtractBtn).not.toBeNull();
        expect(setBtn).not.toBeNull();
    });

    it('should have quick amount buttons', () => {
        sessionStorage.setItem('pixelparken_admin_session', 'true');
        new AdminView('test-container');

        const quickBtns = container.querySelectorAll('[data-amount]');
        expect(quickBtns.length).toBeGreaterThan(0);
    });

    it('should have logout and back buttons', () => {
        sessionStorage.setItem('pixelparken_admin_session', 'true');
        new AdminView('test-container');

        const logoutBtn = container.querySelector('#logout-btn');
        const backBtn = container.querySelector('#back-btn');

        expect(logoutBtn).not.toBeNull();
        expect(backBtn).not.toBeNull();
    });
});
