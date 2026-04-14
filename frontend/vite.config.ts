import { defineConfig } from 'vitest/config'; // Importante: de 'vitest/config'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true, // Esto ayuda si los tests dependen de clases CSS
  },
});