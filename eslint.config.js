import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "design-prototypes/", "outputs/", "tmp/", "output/", "verification-local/"],
  },
  {
    files: ["**/*.{js,mjs}"],
    ...js.configs.recommended,
    languageOptions: { globals: globals.node },
  },
  {
    files: ["public/assets/**/*.js", "tests/**/*.mjs"],
    languageOptions: { globals: globals.browser },
  },
  eslintPluginPrettier,
];
