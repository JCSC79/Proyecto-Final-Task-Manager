import '@testing-library/jest-dom';
import { beforeAll, afterAll, vi } from 'vitest';

// Mock heavy third-party libraries to speed up test module loading
vi.mock('emoji-picker-react', () => ({
  default: () => null,
  Theme: { DARK: 'dark', LIGHT: 'light' },
}));

/**
 * FINAL CONSOLE SANITIZER
 * This interceptor blocks the 'act' warnings specifically caused by 
 * third-party UI components (BlueprintJS) during their async icon loads.
 */
const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // We convert everything to a string to make sure we don't miss anything
    const fullMessage = args.map(String).join(' ');

    // Patterns that match the annoying act warnings
    const isActWarning = /act\(\.\.\.\)/i.test(fullMessage);
    const isComponentNoise = /Blueprint|Icon/i.test(fullMessage);

    // If it matches both, we swallow the error
    if (isActWarning && isComponentNoise) {
      return;
    }

    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});