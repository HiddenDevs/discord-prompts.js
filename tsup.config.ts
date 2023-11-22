// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  minify: true,
  keepNames: true,
  dts: true,
  target: 'es2022',
  skipNodeModulesBundle: true,
  outDir: 'dist',
});
