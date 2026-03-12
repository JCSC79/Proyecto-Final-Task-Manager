import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    // 1. Aplicamos las reglas a los archivos fuente
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error", // Prohíbe el uso de 'any'
      "no-console": "off", // Permitimos logs para ver que el server arranca
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    },
  },
  {
    // 2. Ignoramos carpetas que no son de código fuente
    ignores: ["dist/**", "node_modules/**", "eslint.config.js"],
  }
];