import { defineConfig } from 'vitest/config'; // Must import from 'vitest/config', not 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true, // Enables CSS processing so tests that depend on CSS classes work correctly
  },
});