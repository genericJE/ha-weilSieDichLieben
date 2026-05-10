import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';

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
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),
    typescript({ tsconfig: './tsconfig.json' }),
    json(),
    image(),
    postcss({ extensions: ['.css'], inject: true, minimize: isProd }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx'],
      include: ['weilSieDichLieben/src/**/*'],
      presets: [
        ['@babel/preset-env', { targets: 'defaults' }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }),
    resolve({
      browser: true,
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    }),
    commonjs({ include: ['node_modules/**', 'weilSieDichLieben/**'] }),
    isProd && terser(),
  ].filter(Boolean),
};
