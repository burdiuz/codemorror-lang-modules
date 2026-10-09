# @actualwave/codemirror-lang-embed-core

Shared machinery for embedding other languages inside **tagged template literals** in
JavaScript / TypeScript / JSX / TSX with [CodeMirror 6](https://codemirror.net/). It is built on
`@codemirror/language`'s `parseMixed`, and every other `@actualwave/codemirror-lang-embed-*`
package depends on it.

```js
sql`SELECT * FROM users`   // ← parsed as SQL
css`color: red;`           // ← parsed as CSS
```

Use this package directly if you want to embed your own language, or to assemble several embeds
into one editor (see [Putting it all together](#putting-it-all-together)).

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-core @codemirror/language @lezer/common
```

You also need a JS language, e.g. `@codemirror/lang-javascript`.

## How it works

1. A **tag registry** maps a *tag matcher* to a nested `Language`.
2. `embedTaggedTemplates(js, registry)` wraps the JS language. Whenever it sees a
   `TaggedTemplateExpression`, it reads the tag (`sql`, `styled.View`, `styled(Button)` …), asks
   the registry for a match and, if there is one, parses the template's text with that language.
3. `${...}` interpolations and the backticks are excluded from the nested parse, so the embedded
   parser only ever sees literal text.

Each `embed-*` package exports `createEmbedding()` returning:

| Field | Purpose |
| --- | --- |
| `matcher` | `(tagPath: string[]) => boolean` – decides which tags use this language |
| `language` | the nested `Language` (or at least `{ parser }`) that parses the template |
| `extension` | *(optional)* CodeMirror extension with the language's completion source and other language data |

> **Important:** `extension` is what provides **suggestions**. If you only register `matcher` and
> `language`, you get highlighting but no autocompletion. Always add `extension` to the editor.

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createSql } from "@actualwave/codemirror-lang-embed-sql"

const js = javascript({ jsx: true, typescript: true })
const registry = createTagRegistry()

const sql = createSql()
registry.register(sql.matcher, sql.language)

const embedded = embedTaggedTemplates(js, registry)

new EditorView({
  doc: "const q = sql`SELECT * FROM users`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, sql.extension]),
  ],
  parent: document.body,
})
```

### Putting it all together

```js
const embeds = [createSql(), createCss(), createGlsl()]

const registry = createTagRegistry()
for (const { matcher, language } of embeds) registry.register(matcher, language)

const embedded = embedTaggedTemplates(js, registry)
const extensions = embeds.map((e) => e.extension).filter(Boolean)

const support = new LanguageSupport(embedded.language, [embedded.support, extensions])
```

Packages that have no grammar (`embed-tailwind`, `embed-react-native`) export
`createSupportExtension(embedded)` instead. Build them from the **wrapped** support
(`embedded`), not the plain `js` one, because they attach data to `embedded.language`:

```js
const support = new LanguageSupport(embedded.language, [
  embedded.support,
  extensions,
  createTailwindSupport(embedded),
])
```

To toggle embeds at runtime, build the support again and swap it with a `Compartment`
(`compartment.reconfigure(buildSupport())`). See [`docs/src/main.js`](../../docs/src/main.js) for a
working example.

## Custom embeds

A matcher receives the tag as an array of identifier names:

| Source | `tagPath` |
| --- | --- |
| ``sql`…` `` | `['sql']` |
| ``styled.View`…` `` | `['styled', 'View']` |
| ``styled(Button)`…` `` | `['styled']` (a call collapses to its callee) |
| ``styled['View']`…` `` | not matched (bracket access is unsupported) |

```js
import { createTagRegistry, embedTaggedTemplates, matchTagName } from "@actualwave/codemirror-lang-embed-core"
import { htmlLanguage } from "@codemirror/lang-html"

const registry = createTagRegistry()
registry.register(matchTagName("html"), htmlLanguage)          // html`<b>hi</b>`
registry.register((p) => p[0] === "markdown", markdownLanguage) // custom matcher
```

Matchers are tried in registration order and the first match wins.

## API

### `createTagRegistry()`
Returns `{ register(matcher, language), resolve(tagPath) }`. `resolve` returns the first matching
`Language` or `null`.

### `embedTaggedTemplates(languageSupport, registry)`
Takes the `LanguageSupport` from `javascript()` and returns a new `LanguageSupport` whose
`language` parses matching templates with their nested language. `support` is carried over from
the original.

### `matchTagName(name)`
Matcher for a bare identifier tag: `matchTagName("sql")` matches `` sql`…` `` only.

### Helpers for custom completion sources and decorations
- `getTaggedTemplateTagPath(templateStringNode, input)` – tag path for a `TemplateString` node, or
  `null` for untagged templates.
- `readIdentifierPath(node, input)` – flattens a tag expression into `string[]`, or `null`.
- `templateContentRanges(templateStringNode)` – `{ from, to }[]` of the literal text, without
  backticks and `${…}` interpolations.
- `docAsInput(state.doc)` – adapts a CodeMirror `Text` to the `input` argument above. Use it when
  walking an existing `syntaxTree(state)` (this is how `embed-tailwind` works).

## Troubleshooting

- **Highlighting works but there are no suggestions** – you did not add the embed's `extension`.
  Also check that `autocompletion()` is enabled (it is part of `basicSetup`).
- **Nothing is highlighted** – make sure the embed is registered in the registry and that the
  wrapped language (`embedded.language`), not the plain `javascript()` language, is used in the editor.
- **`instanceof` errors / strange behavior when bundling** – there are two copies of
  `@codemirror/state`, `@codemirror/view` or `@lezer/*` in the bundle. Dedupe them.

## License

MIT
