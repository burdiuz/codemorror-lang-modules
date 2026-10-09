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
| [`packages/embed-graphql`](packages/embed-graphql) | `@actualwave/codemirror-lang-embed-graphql` | GraphQL highlighting inside `gql` tagged templates |
| [`packages/embed-icu-messageformat`](packages/embed-icu-messageformat) | `@actualwave/codemirror-lang-embed-icu-messageformat` | ICU MessageFormat highlighting inside tagged templates |
| [`packages/embed-react-native`](packages/embed-react-native) | `@actualwave/codemirror-lang-embed-react-native` | React/React Native aware completion embed |
| [`packages/embed-sksl`](packages/embed-sksl) | `@actualwave/codemirror-lang-embed-sksl` | SKSL highlighting inside `sksl` tagged templates |
| [`packages/embed-sql`](packages/embed-sql) | `@actualwave/codemirror-lang-embed-sql` | SQL highlighting inside `sql` tagged templates |
| [`packages/embed-tailwind`](packages/embed-tailwind) | `@actualwave/codemirror-lang-embed-tailwind` | Tailwind class completion and category highlighting inside `tw` tagged templates |

Unlike the base grammar packages, the embed packages are plain unbundled `index.js` +
`package.json` (no build/test step) — they're currently workspace members of
[`js-codemirror-package`](../js-codemirror-package) and not yet published to npm
independently.

## Using the embeds

Everything needed to set up the embeds, including the autocompletion (suggestions) config, is on
this page.

### How it works

An embed lets a JS/TS/JSX/TSX editor treat the text of a tagged template as another language:

```js
const query = sql`SELECT id FROM users`   // SQL highlighting + SQL suggestions
const style = css`color: red;`            // CSS highlighting + CSS suggestions
```

There are two kinds of embed packages:

| Kind | Packages | Export | Provides |
| --- | --- | --- | --- |
| **Language embed** | `embed-sql`, `embed-css`, `embed-glsl`, `embed-sksl`, `embed-icu-messageformat`, `embed-graphql` | `createEmbedding(config?)` → `{ matcher, language, extension }` | a nested parser (highlighting) for matching tags, plus `extension` with the language's suggestions |
| **Support embed** | `embed-tailwind`, `embed-react-native` | `createSupportExtension(embeddedJs, config?)` → extension | suggestions (and, for Tailwind, class coloring) layered on the JS parser; no nested language |

> **Highlighting and suggestions are separate.** `matcher` + `language` give highlighting.
> **Suggestions only appear if you also add the embed's `extension` to the editor.** Leaving it
> out is the most common reason for "highlighting works but nothing is suggested".
> Autocompletion itself must be enabled too (`basicSetup` already includes `autocompletion()`).

### Install

```sh
npm install codemirror @codemirror/lang-javascript \
  @actualwave/codemirror-lang-embed-core

# then the embeds you want, with their peer dependencies
npm install @actualwave/codemirror-lang-embed-sql @codemirror/lang-sql
npm install @actualwave/codemirror-lang-embed-css @codemirror/lang-css
npm install @actualwave/codemirror-lang-embed-glsl @actualwave/codemirror-lang-glsl
npm install @actualwave/codemirror-lang-embed-sksl @actualwave/codemirror-lang-sksl
npm install @actualwave/codemirror-lang-embed-icu-messageformat @actualwave/codemirror-lang-icu-messageformat
npm install @actualwave/codemirror-lang-embed-graphql @lezer/highlight @lezer/lr
npm install @actualwave/codemirror-lang-embed-tailwind
npm install @actualwave/codemirror-lang-embed-react-native @actualwave/codemirror-lang-react-native
```

`@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@codemirror/autocomplete` and
`@lezer/common` are peer dependencies shared by several packages. Make sure the bundle contains
a single copy of each, otherwise `instanceof` checks fail.

### Complete example

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createSql } from "@actualwave/codemirror-lang-embed-sql"
import { createEmbedding as createCss } from "@actualwave/codemirror-lang-embed-css"
import { createEmbedding as createGraphql } from "@actualwave/codemirror-lang-embed-graphql"
import { createSupportExtension as createTailwind } from "@actualwave/codemirror-lang-embed-tailwind"
import { createSupportExtension as createReactNative } from "@actualwave/codemirror-lang-embed-react-native"

// 1. Create the language embeds (config is optional, see "Suggestions config" below)
const embeds = [
  createSql({ upperCaseKeywords: true }),
  createCss(),
  createGraphql(),
]

// 2. Register every embed's tag matcher + nested language
const registry = createTagRegistry()
for (const { matcher, language } of embeds) registry.register(matcher, language)

// 3. Wrap the JS language so matching templates are parsed by the nested language
const js = javascript({ jsx: true, typescript: true })
const embedded = embedTaggedTemplates(js, registry)

// 4. Collect the suggestions: each language embed's `extension` (graphql has none)
const suggestions = embeds.map((embed) => embed.extension).filter(Boolean)

// 5. Support embeds are built from the *wrapped* JS support
const support = [
  createTailwind(embedded),
  createReactNative(embedded, { styleFactories: ["createStyles"] }),
]

// 6. Assemble one LanguageSupport and give it to the editor
new EditorView({
  doc: "const q = sql`SEL`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, suggestions, support]),
  ],
  parent: document.body,
})
```

Rules that matter:

- Use `embedded.language` (the wrapped one) in `LanguageSupport`, not `js.language`.
- Build `createTailwind(...)` / `createReactNative(...)` from `embedded`, not from `js`. They attach
  their completion source to that object's `language`; if it is a different object than the one
  the editor uses, suggestions never appear.
- To toggle embeds at runtime, rebuild the `LanguageSupport` with steps 1-6 and swap it with a
  `Compartment` (`compartment.reconfigure(newSupport)`). `docs/src/main.js` does this.
- A single embed needs only its own lines: create it, register `matcher`/`language`, wrap, and
  add `extension`.

### Which tags match

| Package | Tag | Notes |
| --- | --- | --- |
| `embed-sql` | `` sql`…` `` | bare identifier only |
| `embed-css` | `` css`…` ``, `` styled`…` ``, `` styled.View`…` ``, `` styled(Button)`…` `` | any tag whose first name is `css` or `styled` |
| `embed-graphql` | `` gql`…` `` | `graphql` is not matched by default |
| `embed-glsl` | `` glsl`…` `` | |
| `embed-sksl` | `` sksl`…` `` | |
| `embed-icu-messageformat` | `` t`…` `` | single letter `t` |
| `embed-tailwind` | `` tw`…` `` | not `className="…"` |
| `embed-react-native` | no tag | works on ordinary JSX / imports / `StyleSheet.create` |

Tags are matched by name only, not resolved through imports. `${…}` interpolations and the
backticks are excluded from the nested parse, so they never produce syntax errors. Bracket access
(``styled['View']`…` ``) is not matched.

To match another name, register your own matcher with the same language:

```js
import { matchTagName } from "@actualwave/codemirror-lang-embed-core"

const graphql = createGraphql()
registry.register(graphql.matcher, graphql.language)              // gql
registry.register(matchTagName("graphql"), graphql.language)      // graphql`…`
registry.register((tagPath) => tagPath[0] === "db", createSql().language) // db`…`, db.x`…`
```

A matcher receives the tag as an array: `sql` → `['sql']`, `styled.View` → `['styled', 'View']`,
`styled(Button)` → `['styled']`. Matchers are tried in registration order; the first match wins.

### Suggestions config

| Package | What is suggested | Configuration |
| --- | --- | --- |
| `embed-sql` | SQL keywords; with a schema, table and column names | `createEmbedding(config)`, see below |
| `embed-css` | properties, values, colors, units, at-rules | none |
| `embed-glsl` | types, qualifiers, keywords, built-in functions, `gl_*` variables | none |
| `embed-sksl` | types, qualifiers, keywords, built-in functions, `sk_FragCoord` | none |
| `embed-icu-messageformat` | argument types, plural categories, snippets for `plural` / `select` / `selectordinal` | none |
| `embed-graphql` | none (highlighting, indentation, folding only) | add your own completion source, see below |
| `embed-tailwind` | Tailwind utility class names by prefix | none; colors are themeable |
| `embed-react-native` | imports, JSX tags and props, style properties and values | `createSupportExtension(embedded, config)`, see below |

#### SQL: dialect, schema, upper-case keywords

`createSql(config)` passes `config` to `sql()` from `@codemirror/lang-sql`:

| Option | Description |
| --- | --- |
| `dialect` | `StandardSQL` (default), `PostgreSQL`, `MySQL`, `MariaSQL`, `MSSQL`, `SQLite`, `Cassandra`, `PLSQL` |
| `schema` | tables and their columns for completion (nested namespaces are allowed) |
| `defaultTable` | complete this table's columns at the top level |
| `defaultSchema` | complete this schema's tables without a prefix |
| `upperCaseKeywords` | suggest `SELECT` instead of `select` |
| `keywordCompletion` | `(label, type) => Completion` to customize keyword entries |

```js
import { PostgreSQL } from "@codemirror/lang-sql"

const sql = createSql({
  dialect: PostgreSQL,
  upperCaseKeywords: true,
  schema: {
    users: ["id", "name", "email", "active"],
    orders: ["id", "user_id", "total"],
  },
  defaultTable: "users",
})
```

Keyword suggestions are always on; `schema` adds table and column suggestions. With this config,
``sql`SELECT us…` `` suggests `users`, and ``sql`SELECT users.` `` suggests its columns.

#### React Native: extra modules and style factories

`createReactNative(embedded, config)`:

| Option | Description |
| --- | --- |
| `modules` | extra module data merged over the built-in `react` and `react-native` entries |
| `styleFactories` | extra function names (besides `StyleSheet.create`) whose object arguments are treated as style dictionaries |

```js
createReactNative(embedded, {
  modules: {
    "expo-image": {
      Image: { type: "type", props: ["source", "style", "contentFit", "transition"] },
    },
  },
  styleFactories: ["createStyles", "makeStyles"],
})
```

What gets suggested: module names in `import … from "|"`; named exports in
`import { | } from "react-native"` (minus the ones already imported); JSX tag names after `<`
(only components imported in the file); props inside an open tag; imported hooks, variables and
components by local name (`useSta` → `useState`); style property names in `style={{ … }}` and
`StyleSheet.create({ … })`, plus known values for enum-like properties (`flexDirection`,
`resizeMode`, `textAlign`, …).

#### Tailwind: colors

Known classes in `` tw`…` `` get a CSS class by category: `cm-tw-layout`, `cm-tw-spacing`,
`cm-tw-sizing`, `cm-tw-typography`, `cm-tw-colors`, `cm-tw-borders`, `cm-tw-effects`,
`cm-tw-positioning`. Defaults are built in; override them in your theme:

```js
EditorView.theme({
  ".cm-tw-layout": { color: "#0550ae" },
  ".cm-tw-colors": { color: "#953800" },
})
```

Limits: the class list is static (not read from `tailwind.config`), arbitrary values such as
`bg-[#123456]` are not completed or colored, and suggestions open as you type (or on `Ctrl-Space`
for an empty word).

#### GraphQL: adding your own suggestions

`embed-graphql` returns no `extension`, because GraphQL completion needs a schema. Supply your own
completion source as language data and add it to the editor:

```js
const graphql = createGraphql()
const completion = graphql.language.data.of({ autocomplete: myGraphqlCompletionSource })

new LanguageSupport(embedded.language, [embedded.support, completion])
```

### Helpers for custom embeds

`@actualwave/codemirror-lang-embed-core` also exports what you need to write your own embed or
completion source: `createTagRegistry()`, `embedTaggedTemplates(js, registry)`,
`matchTagName(name)`, `getTaggedTemplateTagPath(node, input)`, `readIdentifierPath(node, input)`,
`templateContentRanges(node)` (literal text ranges without backticks and `${…}`) and
`docAsInput(state.doc)`.

### Troubleshooting

- **Highlighting works, no suggestions** – the embed's `extension` is not in the editor, or
  `autocompletion()` is not enabled.
- **Tailwind / React Native suggestions never appear** – the support extension was built from the
  plain `javascript()` support instead of `embedded`.
- **Nothing is highlighted** – the editor uses `js.language` instead of `embedded.language`, or the
  embed was not registered (or its tag is not in the table above).
- **Odd `instanceof` errors** – duplicated `@codemirror/*` or `@lezer/*` copies in the bundle.

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
