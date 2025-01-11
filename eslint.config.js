// eslint.config.js
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
  {
    ignores: ['**/dist/*']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        figma: true,
        __html__: true
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        jsx: true
      }
    },
    plugins: {
      react
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off'
    },
    settings: {
      react: {
        version: 'detect',
        runtime: 'automatic'
      }
    }
  }
];