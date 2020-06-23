import { eslint } from "rollup-plugin-eslint";
import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [eslint({ throwOnError: true }), typescript()],
  external: ["rxjs", "node-uuid", "electron"],
};
