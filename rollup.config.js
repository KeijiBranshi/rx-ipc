import typescript from "rollup-plugin-typescript2";
import { eslint } from "rollup-plugin-eslint";

const eslintOptions = {
  fix: true,
  throwOnError: true,
};

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [typescript(), eslint(eslintOptions)],
};
