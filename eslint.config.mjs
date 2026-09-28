import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/shared/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/**", "@/features/**", "@/app/**", "@/actions/**"],
              message:
                "shared 계층은 domains, features, app, actions 계층에 의존할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domains/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/**", "@/app/**", "@/actions/**"],
              message:
                "domains 계층은 features, app, actions 계층에 의존할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
