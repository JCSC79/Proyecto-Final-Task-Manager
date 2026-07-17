import { defineConfig } from 'vitest/config'; // Must import from 'vitest/config', not 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
    testTimeout: 15000, // increase from 5s to 15s to account for heavy imports like emoji-picker-react
  },
});