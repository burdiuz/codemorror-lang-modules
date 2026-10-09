# @actualwave/codemirror-lang-embed-icu-messageformat

[ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
highlighting and autocompletion inside `` t`…` `` tagged templates in JS/TS/JSX/TSX for
[CodeMirror 6](https://codemirror.net/). The grammar comes from
[`@actualwave/codemirror-lang-icu-messageformat`](../icu-messageformat).

```js
const inbox = t`You have {count, plural, one {# message} other {# messages}}`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-icu-messageformat \
  @actualwave/codemirror-lang-embed-core \
  @actualwave/codemirror-lang-icu-messageformat @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createIcu } from "@actualwave/codemirror-lang-embed-icu-messageformat"

const icu = createIcu()

const registry = createTagRegistry()
registry.register(icu.matcher, icu.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const m = t`Hello {name}`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, icu.extension]),
  ],
  parent: document.body,
})
```

## Suggestions

`icu.extension` provides the ICU completion source, including snippets for `plural`, `select` and
`selectordinal`, plus the argument types and plural categories (`one`, `few`, `other` …). Add it to the `LanguageSupport`; without it you only
get highlighting.

There is no configuration; `createEmbedding()` takes no arguments.

## Notes

- The tag name is the single letter **`t`**, so it can collide with other `t` tagged templates
  (for example, an i18n helper with different syntax). Use your own name by registering a matcher
  with the core package:

  ```js
  import { matchTagName } from "@actualwave/codemirror-lang-embed-core"
  registry.register(matchTagName("msg"), icu.language)
  ```
- `${...}` JS interpolations are excluded from the parse. ICU's own `{arg}` placeholders are parsed
  by the ICU grammar.
- Peer dependency: `@actualwave/codemirror-lang-icu-messageformat ^0.1.0`.

## Returns

`createEmbedding()` → `{ matcher, language: icuMessageFormatLanguage, extension }`.

## License

MIT
