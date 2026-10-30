---
name: code-quality
description: >
  Code quality with ESLint 9 flat config, Prettier 3, Husky 9, lint-staged 15,
  commitlint 19. Use when fixing lint errors, formatting, configuring pre-commit
  hooks, commit messages, or enforcing FSD layer architecture.
---

# Code Quality (pinned: eslint@9, prettier@3, husky@9, lint-staged@15, commitlint@19)

## 1. Commands

```bash
lint:      eslint .
lint:fix:  eslint . --fix
format:    prettier --write .
prepare:   husky
```

## 2. ESLint 9 — Flat Config (`eslint.config.js`)

> **TRAP**: ESLint 9 использует **flat config** (`eslint.config.js`).
> `.eslintrc`, `.eslintrc.json`, `.eslintrc.js` — УСТАРЕЛИ и не работают в ESLint 9.

```bash
npm install -D eslint@9 @eslint/js typescript-eslint eslint-plugin-react \
  eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-import \
  globals
```

```js
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

export default tseslint.config(
  // Базовые правила JS
  js.configs.recommended,

  // TypeScript правила
  ...tseslint.configs.recommended,

  // React правила
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types': 'off',          // TypeScript делает это

      // a11y
      ...jsxA11y.configs.recommended.rules,

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',

      // Imports
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      }],
      'import/no-cycle': 'error', // FSD: запрет циклических зависимостей

      // Общие
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Исключения
  {
    ignores: ['dist/', 'node_modules/', '.playwright/', 'coverage/'],
  },
)
```

## 3. Prettier 3 (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

```bash
npm install -D prettier@3 eslint-config-prettier
```

Prettier владеет форматированием — не ручной форматируй против него.
`eslint-config-prettier` отключает ESLint правила, конфликтующие с Prettier.

## 4. Husky 9 + lint-staged 15

```bash
npm install -D husky@9 lint-staged@15
npx husky init
```

```bash
# .husky/pre-commit
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,json,md}": "prettier --write"
  }
}
```

## 5. Commitlint 19

```bash
npm install -D @commitlint/cli@19 @commitlint/config-conventional@19
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] }
```

Формат: `type(scope): description`

```
feat(automations): add keyword trigger builder
fix(inbox): resolve message duplication on reconnect
refactor(ui): extract AutomationCard component
test(flow): add node connection e2e test
chore(deps): update shadcn components
```

Типы: `feat | fix | refactor | test | chore | docs | perf | ci`
Scope = feature-папка: `automations`, `inbox`, `analytics`, `flow`, `ui`

## 6. FSD архитектура (слои)

```
src/
  app/        ← инициализация, провайдеры, роутер
  pages/      ← страницы (только композиция)
  features/   ← бизнес-фичи (automations, inbox, analytics)
  entities/   ← доменные сущности (account, message)
  shared/     ← utils, ui-kit, lib, types
```

**Правила импортов (сверху вниз):**
- `app` → `pages` → `features` → `entities` → `shared`
- Запрещено: `features/a` → `features/b` (один слой не импортирует другой)
- Запрещено: `entities` → `features`
- Импорт только через `index.ts` публичного API (`@/features/automations`, не `@/features/automations/ui/Card`)

## 7. Приоритет исправления lint ошибок

1. `import/no-cycle` — циклические зависимости → реструктурируй slice.
2. `react-hooks/exhaustive-deps` → исправь dep (мемоизируй/раздели), не `// eslint-disable`.
3. `jsx-a11y` → label + input, alt text, focusable элементы.
4. `@typescript-eslint/no-explicit-any` → сужай до `unknown` + type guard.

Inline disable — только с комментарием-причиной, минимальный scope:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- library type mismatch
```

## Version traps

- **ESLint 9**: `eslint.config.js` (flat config) — НЕ `.eslintrc`.
- **ESLint 9**: пакет `typescript-eslint` (единый) — не старые `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` по отдельности.
- **Husky 9**: `npx husky init` создаёт `.husky/` — старый `husky install` в `prepare` устарел.
- **Prettier 3**: без точки с запятой (`"semi": false`) — стандарт для современных проектов.

## Checklist

- [ ] `eslint.config.js` flat config, не `.eslintrc`.
- [ ] `eslint . --fix` чистый на тронутых файлах.
- [ ] `import/no-cycle` зелёный.
- [ ] Husky pre-commit запускает lint-staged.
- [ ] Commit message в conventional формате.
- [ ] FSD импорты сверху вниз, нет cross-feature.
