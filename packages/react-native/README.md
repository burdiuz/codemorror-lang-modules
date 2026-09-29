# codemirror-lang-react-native

Contextual completion for React / React Native code in [CodeMirror 6](https://codemirror.net/): import clauses, JSX tag/attribute names, and RN style dictionaries — layered on top of the existing JS/JSX language, no separate grammar involved.

## Installation

```bash
npm install @actualwave/codemirror-lang-react-native
```

## Usage

```js
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { javascript } from "@codemirror/lang-javascript"
import { autocompletion } from "@codemirror/autocomplete"
import { reactNativeCompletionSource } from "@actualwave/codemirror-lang-react-native"

const jsx = javascript({ jsx: true, typescript: true })

const state = EditorState.create({
  doc: `import { useState } from "react"\nimport { View, Text } from "react-native"\n`,
  extensions: [
    jsx,
    jsx.language.data.of({ autocomplete: reactNativeCompletionSource() }),
    autocompletion(),
  ],
})

const view = new EditorView({ state, parent: document.body })
```

## API

### `reactNativeCompletionSource(config?)`

Returns a `CompletionSource` for `@codemirror/autocomplete`. Register it against a JS/JSX language's `languageData` (e.g. via `language.data.of({ autocomplete: ... })`), not as a standalone `LanguageSupport` — this package has no grammar of its own.

`config` (all fields optional):

- **`modules`** — a `ModuleRegistry` merged on top of `BUILTIN_MODULES` (`react` and `react-native`, always available). Use this to add completion data for other packages a project depends on, e.g. `expo-image` or `@shopify/react-native-skia`:

  ```js
  reactNativeCompletionSource({
    modules: {
      "expo-image": {
        Image: { type: "type", props: ["source", "style", "contentFit", "transition"] },
      },
    },
  })
  ```

- **`styleFactories`** — additional callee names (besides `StyleSheet.create`) whose object argument's per-key values should be treated as RN style dictionaries.

### What gets suggested, and when

- **Import module specifiers** — inside `import { ... } from "|"`, suggests known module names (`react`, `react-native`, plus anything from `config.modules`).
- **Import named symbols** — back inside `import { | } from "react-native"`, suggests that module's exports, excluding names already present in the same import statement.
- **JSX tag names** — after `<`, suggests component names, but only for names actually present in the file's own `import` statements (nothing is ever suggested unscoped).
- **JSX attribute names** — inside an open tag, suggests that component's known props, resolved the same import-scoped way.
- **General scope** — outside JSX, suggests imported hooks/variables/components by local name (e.g. `useSta` → `useState`).
- **Style properties** — inside `style={{ ... }}` or `StyleSheet.create({ ... })`'s nested per-key objects, suggests RN style property names (excluding ones already set), and for enum-like properties (`flexDirection`, `resizeMode`, `textAlign`, ...) suggests their known values.

### Other exports

`BUILTIN_MODULES`, `STYLE_PROPERTIES`, `ModuleRegistry`/`ModuleExports`/`ModuleExportEntry` types, and the lower-level helpers (`collectImports`, `classifyJsxContext`, `findStyleObjectContext`, etc.) are exported for reuse by adapter packages or custom completion sources.

## License

MIT
