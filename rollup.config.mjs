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

// react-fast-marquee appends its stylesheet to document.head when imported,
// where nothing inside a shadow root can see it. Blank out that side effect
// and expose the same CSS as a module, so the bridge can put it in the shadow
// root next to Leaflet's. Both halves read the package's own dist file, so an
// upgrade that changes the shape fails the build instead of dropping styles.
const MARQUEE_ENTRY = 'react-fast-marquee/dist/index.js';
const MARQUEE_CSS_ID = 'virtual:react-fast-marquee-css';
const insertStyleCall = /^___\$insertStyle\((".*")\);$/m;

function marqueeCss() {
  const extract = (code) => {
    const match = code.match(insertStyleCall);
    if (!match) throw new Error(`${MARQUEE_ENTRY}: expected a top-level ___$insertStyle("...") call`);
    return match;
  };
  return {
    name: 'marquee-css',
    resolveId(id) {
      return id === MARQUEE_CSS_ID ? `\0${MARQUEE_CSS_ID}` : null;
    },
    load(id) {
      if (id !== `\0${MARQUEE_CSS_ID}`) return null;
      const entry = readFileSync(new URL(`./node_modules/${MARQUEE_ENTRY}`, import.meta.url), 'utf8');
      return `export default ${extract(entry)[1]};`;
    },
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith(MARQUEE_ENTRY)) return null;
      // Same-length blank keeps every other position intact, so no sourcemap is needed.
      return { code: code.replace(extract(code)[0], (call) => ' '.repeat(call.length)), map: null };
    },
  };
}

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
    // allowJs is for tsc, so it can follow imports into the submodule. The build
    // leaves the submodule to babel; with allowJs on, the plugin stops emitting
    // the .ts sources altogether.
    typescript({ tsconfig: './tsconfig.json', allowJs: false }),
    json(),
    image(),
    url({
      include: ['**/*.ttf', '**/*.woff', '**/*.woff2'],
      limit: 200 * 1024,
    }),
    // Imported stylesheets become strings; the bridge scopes them to the shadow root.
    postcss({ extensions: ['.css'], inject: false, minimize: isProd }),
    marqueeCss(),
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
