import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const THREE_MESSAGE =
  "`three` is only allowed inside src/world/**. Reach the engine with `import(\"@world\")` from a client-component effect (ARCHITECTURE §2).";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    // `three` must never leak into the initial bundle or into Server Components.
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "three", message: THREE_MESSAGE }],
          patterns: [{ group: ["three/*"], message: THREE_MESSAGE }],
        },
      ],
    },
  },
  {
    files: ["src/world/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
];

export default eslintConfig;
