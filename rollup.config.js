import { eslint } from "rollup-plugin-eslint";
import typescript from "rollup-plugin-typescript2";

const commonConfig = {
  plugins: [eslint({ throwOnError: true }), typescript()],
  external: ["rxjs", "node-uuid", "electron"],
};

export default [
  {
    ...commonConfig,
    input: "src/index.ts",
    output: {
      dir: "dist",
      format: "cjs",
    },
  },
  {
    ...commonConfig,
    input: "src/add/operator/proxify.ts",
    output: {
      dir: "dist/add/operator",
      format: "cjs",
    },
    external: [...commonConfig.external, "../../index"],
  },
];
