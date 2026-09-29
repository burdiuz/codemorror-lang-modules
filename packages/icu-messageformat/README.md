# codemirror-lang-icu-messageformat

[ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) syntax support for [CodeMirror 6](https://codemirror.net/).

ICU MessageFormat is the pattern syntax used for internationalized, pluralized, and gender/category-selected UI strings — widely used via `intl-messageformat`, `formatjs`, ICU4J/ICU4C, and many i18n libraries.

## Installation

```bash
npm install @actualwave/codemirror-lang-icu-messageformat
```

## Usage

```js
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { icuMessageFormat } from "@actualwave/codemirror-lang-icu-messageformat"

const state = EditorState.create({
  doc: `You have {count, plural,
  =0 {no messages}
  one {# message}
  other {# messages}
}.`,
  extensions: [icuMessageFormat()],
})

const view = new EditorView({ state, parent: document.body })
```

## API

### `icuMessageFormat()`

Returns a `LanguageSupport` instance. This is the main extension to add to your editor.

### `icuMessageFormatLanguage`

The `LRLanguage` instance for ICU MessageFormat. Use this when you need direct access to the language object, for example to add language-specific extensions via `icuMessageFormatLanguage.data.of(...)`.

### `icuHighlighting`

The highlight style prop source used by the parser. Exported for advanced use cases where you want to build a custom language configuration.

## Features

- Literal message text, interleaved with `{argument}` placeholders
- Simple arguments: `{name, number}`, `{name, date, short}`, `{name, time, ::HH:mm}`, etc.
- Selector arguments with recursively nested sub-messages:
  - `{name, plural, offset:1 =0 {...} one {...} other {...}}`
  - `{name, selectordinal, one {...} two {...} few {...} other {...}}`
  - `{name, select, male {...} female {...} other {...}}`
- The `#` placeholder inside plural/selectordinal branches
- Quoted literal text (`'{'`, `'#'`, etc.) and the `''` escaped-apostrophe sequence
- Positional (`{0}`) and named (`{name}`) argument references

## Known v1 limitations

- `#` is tokenized uniformly everywhere rather than only inside plural/selectordinal branches (it's only meaningful there per the ICU spec, but treating it context-free keeps the grammar simple — same spirit as this project's other DSL grammars).
- Argument `style` text (e.g. a number/date skeleton) is treated as an opaque run of text rather than parsed into its own sub-grammar.

## License

MIT
