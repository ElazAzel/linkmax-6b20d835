import js from "@eslint/js";
import globals from "globals";
import i18nPlugin from "./eslint/i18n-plugin.js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const isI18nLint = process.env.LINT_I18N === "true";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      i18n: i18nPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      // Production safety rules
      "no-console": ["warn", {
        allow: ["warn", "error"] // Only allow console.warn and console.error
      }],
      "no-restricted-globals": ["error", {
        name: "localStorage",
        message: "Use storage utility from '@/lib/storage' instead of direct localStorage access"
      }, {
          name: "sessionStorage",
          message: "Use storage utility from '@/lib/storage' instead of direct sessionStorage access"
        }],

      "i18n/no-literal-string": isI18nLint
        ? [
          "error",
          {
            markupOnly: true,
            ignoreAttribute: [
              "className",
              "data-testid",
              "data-qa",
              "data-cy",
              "data-state",
              "data-value",
              "id",
              "key",
              "role",
              "type",
              "name",
              "href",
              "to",
              "src",
              "aria-hidden",
              "aria-live",
              "aria-atomic",
              "aria-busy",
              "aria-controls",
              "aria-describedby",
              "aria-expanded",
              "aria-haspopup",
              "aria-labelledby",
              "aria-owns",
              "aria-current",
              "aria-checked",
              "aria-pressed",
              "aria-selected",
              "aria-disabled",
              "aria-required",
              "aria-invalid",
              "aria-readonly",
              "aria-multiline",
              "aria-orientation",
            ],
            ignorePattern: "^(?:[\\d\\s.,:;!?()\\-]+|LinkMAX|lnkmx|Premium|PRO|Pro|Free|AI)$",
          },
        ]
        : "off",
    },
  },
  {
    ignores: ["supabase/functions/**"],
  },
  {
    files: ["src/i18n/config.ts"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
);
