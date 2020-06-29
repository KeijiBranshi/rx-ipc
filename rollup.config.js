import { eslint } from "rollup-plugin-eslint";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return (id) => pattern.test(id);
};

const commonConfig = {
  plugins: [
    eslint({ throwOnError: true }),
    typescript({
      exclude: "*.test.ts",
    }),
  ],
};

export default [
  {
    ...commonConfig,
    input: "src/index.ts",
    output: {
      dir: "dist",
      format: "cjs",
    },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
  },
  {
    ...commonConfig,
    input: "src/add/operator/proxify.ts",
    output: {
      dir: "dist/add/operator",
      format: "cjs",
    },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      commonConfig.external,
      "../../index",
    ]),
  },
];
