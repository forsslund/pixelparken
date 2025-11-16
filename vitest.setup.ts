import 'vitest-canvas-mock';
import { vi } from 'vitest';

// Mock phaser3spectorjs (required for Phaser WebGL testing)
vi.mock('phaser3spectorjs', () => ({}));

// Mock for window.matchMedia (used by some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock for localStorage (already works in jsdom, but explicit is better)
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Reset localStorage before each test
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorageMock.clear();
});
