import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const isProd = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/card.ts',
  output: {
    file: 'dist/weil-sie-dich-lieben-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    isProd && terser(),
  ].filter(Boolean),
};
