import typescript from "rollup-plugin-typescript2";
import { eslint } from "rollup-plugin-eslint";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [typescript(), eslint({ throwOnError: true })],
};
