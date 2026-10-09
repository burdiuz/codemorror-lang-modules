# codemirror-lang-modules

Monorepo for `@actualwave` CodeMirror 6 language packages — Lezer grammars and their
CodeMirror `Language`/highlighting/completion support, each published independently to npm.

## Packages

### Base grammar packages

| Package | npm name | Description |
| --- | --- | --- |
| [`packages/sksl`](packages/sksl) | [`@actualwave/codemirror-lang-sksl`](https://www.npmjs.com/package/@actualwave/codemirror-lang-sksl) | SKSL (Skia Shading Language) syntax support |
| [`packages/glsl`](packages/glsl) | [`@actualwave/codemirror-lang-glsl`](https://www.npmjs.com/package/@actualwave/codemirror-lang-glsl) | GLSL (OpenGL Shading Language) syntax support |
| [`packages/icu-messageformat`](packages/icu-messageformat) | [`@actualwave/codemirror-lang-icu-messageformat`](https://www.npmjs.com/package/@actualwave/codemirror-lang-icu-messageformat) | ICU MessageFormat syntax support |
| [`packages/react-native`](packages/react-native) | [`@actualwave/codemirror-lang-react-native`](https://www.npmjs.com/package/@actualwave/codemirror-lang-react-native) | React/React Native aware import & JSX completion |

### Embed (tagged-template) packages

Tag-embedding glue that highlights (and where noted, completes) a language inside
tagged-template literals (`` sql\`...\` ``, `` css\`...\` ``, etc.) in JS/TSX via
`@codemirror/language`'s `parseMixed`. `embed-core` is the shared base every other
embed package depends on; `embed-glsl`, `embed-icu-messageformat`, and `embed-sksl`
additionally peer-depend on their respective base grammar package above.

| Package | npm name | Description |
| --- | --- | --- |
| [`packages/embed-core`](packages/embed-core) | `@actualwave/codemirror-lang-embed-core` | Shared `parseMixed` tag-embedding machinery |
| [`packages/embed-css`](packages/embed-css) | `@actualwave/codemirror-lang-embed-css` | CSS highlighting inside `css` tagged templates |
| [`packages/embed-glsl`](packages/embed-glsl) | `@actualwave/codemirror-lang-embed-glsl` | GLSL highlighting inside `glsl` tagged templates |
| [`packages/embed-graphql`](packages/embed-graphql) | `@actualwave/codemirror-lang-embed-graphql` | GraphQL highlighting inside `gql`/`graphql` tagged templates |
| [`packages/embed-icu-messageformat`](packages/embed-icu-messageformat) | `@actualwave/codemirror-lang-embed-icu-messageformat` | ICU MessageFormat highlighting inside tagged templates |
| [`packages/embed-react-native`](packages/embed-react-native) | `@actualwave/codemirror-lang-embed-react-native` | React/React Native aware completion embed |
| [`packages/embed-sksl`](packages/embed-sksl) | `@actualwave/codemirror-lang-embed-sksl` | SKSL highlighting inside `sksl` tagged templates |
| [`packages/embed-sql`](packages/embed-sql) | `@actualwave/codemirror-lang-embed-sql` | SQL highlighting inside `sql` tagged templates |
| [`packages/embed-tailwind`](packages/embed-tailwind) | `@actualwave/codemirror-lang-embed-tailwind` | Tailwind class highlighting/completion/decoration inside `tw`/`className` tagged templates |

Unlike the base grammar packages, the embed packages are plain unbundled `index.js` +
`package.json` (no build/test step) — they're currently workspace members of
[`js-codemirror-package`](../js-codemirror-package) and not yet published to npm
independently.

## Development

This is an npm workspaces monorepo. From the repo root:

```sh
npm install
npm run build   # runs each package's own build script
npm test        # runs each package's own test script
```

Each package keeps its own `package.json`, `rollup.config.js`, `tsconfig.json`, and (where
applicable) `test/` — they're independently publishable, just co-located here for shared
tooling and easier cross-package changes. To work on a single package:

```sh
npm run build --workspace=@actualwave/codemirror-lang-sksl
npm test --workspace=@actualwave/codemirror-lang-sksl
```

To publish a package, `cd` into it and run `npm publish` as usual (each has its own
`publishConfig`).

## Demo

[`docs/`](docs/) is an interactive CodeMirror page that loads the embed and grammar packages
together. Edit the sample JS/TSX, and toggle each package on or off to see its highlighting and
completion change. It is served from GitHub Pages at
https://burdiuz.github.io/codemirror-lang-modules/ (once Pages is enabled for the `docs/` folder
on `main`).

To run it locally:

```sh
npm run build        # builds the base grammar packages into their dist/ folders
npm run docs:build   # bundles docs/src/main.js into docs/assets/main.js
npm run docs:serve   # serves docs/ at http://localhost:8080 (set PORT to change it)
```

Rerun `docs:build` after changing any package or the demo source. The bundle is committed, so
Pages serves it without a build step.
