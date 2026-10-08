import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import { readFileSync } from 'node:fs';

const isProd = !process.env.ROLLUP_WATCH;

// The upstream submodule imports the same packages this repo does. When it has
// a node_modules/ of its own (left behind by running its dev server), rollup
// would bundle a second copy of each: two Reacts means the hooks of one run
// inside the renderer of the other and every station render dies with
// 'Cannot read properties of null (reading useState)'. Pin every direct
// dependency to this repo's install instead.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const singletonPackages = Object.keys(pkg.dependencies);

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
    url({
      include: ['**/*.ttf', '**/*.woff', '**/*.woff2'],
      limit: 200 * 1024,
    }),
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
      dedupe: singletonPackages,
    }),
    commonjs({ include: ['node_modules/**', 'weilSieDichLieben/**'] }),
    isProd && terser(),
  ].filter(Boolean),
};
