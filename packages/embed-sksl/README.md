# @actualwave/codemirror-lang-embed-sksl

SkSL ([Skia Shading Language](https://skia.org/docs/user/sksl/)) highlighting and
autocompletion inside `` sksl`…` `` tagged templates in JS/TS/JSX/TSX for
[CodeMirror 6](https://codemirror.net/), for example for `@shopify/react-native-skia` runtime
effects. The grammar comes from [`@actualwave/codemirror-lang-sksl`](../sksl).

```js
const effect = sksl`
  uniform float2 size;
  half4 main(float2 coord) {
    return half4(coord / size, 0.0, 1.0);
  }
`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-sksl @actualwave/codemirror-lang-embed-core \
  @actualwave/codemirror-lang-sksl @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createSksl } from "@actualwave/codemirror-lang-embed-sksl"

const sksl = createSksl()

const registry = createTagRegistry()
registry.register(sksl.matcher, sksl.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const e = sksl`half4 main(float2 c) { return half4(1); }`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, sksl.extension]),
  ],
  parent: document.body,
})
```

## Suggestions

`sksl.extension` is the SkSL completion source (types such as `half4` / `float2`, keywords and
qualifiers, built-in functions and `sk_FragCoord`). Include it in the `LanguageSupport`, otherwise only
highlighting works.

There is no configuration; `createEmbedding()` takes no arguments.

## Notes

- Only the bare tag `sksl` matches. Add other names with
  `registry.register(matchTagName("shader"), sksl.language)`.
- `${...}` interpolations are excluded from the SkSL parse.
- This is the same grammar used by standalone `.sksl` editors.
- Peer dependency: `@actualwave/codemirror-lang-sksl ^0.1.0`.

## Returns

`createEmbedding()` → `{ matcher, language: skslLanguage, extension }`.

## License

MIT
