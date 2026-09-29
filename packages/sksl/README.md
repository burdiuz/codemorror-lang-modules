# @actualwave/codemirror-lang-sksl

[SkSL](https://skia.org/docs/user/sksl/) (Skia Shading Language) syntax support for [CodeMirror 6](https://codemirror.net/).

SkSL is a shading language used by the [Skia](https://skia.org/) graphics library, Google Chrome, and Flutter. It is closely related to GLSL with some differences in built-in types and qualifiers.

## Installation

```bash
npm install @actualwave/codemirror-lang-sksl
```

## Usage

```js
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { sksl } from "@actualwave/codemirror-lang-sksl"

const state = EditorState.create({
  doc: `uniform float2 resolution;

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / resolution;
  return half4(uv, 0.0, 1.0);
}`,
  extensions: [sksl()],
})

const view = new EditorView({ state, parent: document.body })
```

## API

### `sksl()`

Returns a `LanguageSupport` instance. This is the main extension to add to your editor.

### `skslLanguage`

The `LRLanguage` instance for SkSL. Use this when you need direct access to the language object, for example to add language-specific extensions via `skslLanguage.data.of(...)`.

### `skslHighlighting`

The highlight style prop source used by the parser. Exported for advanced use cases where you want to build a custom language configuration.

## Features

- Syntax highlighting for keywords, types, qualifiers, literals, operators, and comments
- Built-in type names: scalars (`float`, `half`, `int`, `uint`, `bool`), vectors (`float2`–`float4`, `vec2`–`vec4`, `half2`–`half4`, …), matrices (`float2x2`–`float4x4`, `mat2`–`mat4`, …), and Skia-specific types (`shader`, `colorFilter`, `blender`, `sampler2D`, `samplerCube`)
- Qualifiers: `uniform`, `const`, `in`, `out`, `inout`, `flat`, `noperspective`
- Block indentation and code folding for `{}` blocks and struct definitions
- Line (`//`) and block (`/* */`) comment tokens
- Preprocessor directives (`#version`, `#define`, etc.)

## License

MIT
