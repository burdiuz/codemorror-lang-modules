# codemirror-lang-glsl

[GLSL](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language) (OpenGL Shading Language) syntax support for [CodeMirror 6](https://codemirror.net/).

Targets GLSL ES 1.00/3.00 (WebGL 1/2) — the dialect used for real-time graphics shaders in browsers, mobile GPU pipelines, and Skia-adjacent tooling.

## Installation

```bash
npm install @actualwave/codemirror-lang-glsl
```

## Usage

```js
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { glsl } from "@actualwave/codemirror-lang-glsl"

const state = EditorState.create({
  doc: `precision highp float;
uniform vec2 resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = vec4(uv, 0.0, 1.0);
}`,
  extensions: [glsl()],
})

const view = new EditorView({ state, parent: document.body })
```

## API

### `glsl()`

Returns a `LanguageSupport` instance. This is the main extension to add to your editor.

### `glslLanguage`

The `LRLanguage` instance for GLSL. Use this when you need direct access to the language object, for example to add language-specific extensions via `glslLanguage.data.of(...)`.

### `glslHighlighting`

The highlight style prop source used by the parser. Exported for advanced use cases where you want to build a custom language configuration.

## Features

- Syntax highlighting for keywords, types, qualifiers, literals, operators, and comments
- Built-in type names: scalars (`float`, `int`, `uint`, `bool`), vectors (`vec2`–`vec4`, `ivec2`–`ivec4`, `uvec2`–`uvec4`, `bvec2`–`bvec4`), matrices (`mat2`–`mat4`, non-square `mat2x3`…`mat4x3`), and samplers (`sampler2D`, `samplerCube`, `sampler3D`, `sampler2DArray`, shadow and integer variants)
- Qualifiers: `const`, `in`, `out`, `inout`, `attribute`, `varying`, `uniform`, `centroid`, `flat`, `smooth`, `noperspective`, `invariant`, `precise`
- Precision qualifiers (`highp`, `mediump`, `lowp`) and `precision` statements
- `layout(...)` qualifiers (e.g. `layout(location = 0)`)
- Function prototypes (forward declarations) in addition to full definitions
- `switch`/`case`/`default` statements (GLSL ES 3.00)
- Boolean literals (`true`/`false`)
- Block indentation and code folding for `{}` blocks and struct definitions
- Line (`//`) and block (`/* */`) comment tokens
- Preprocessor directives (`#version`, `#define`, etc.)

## License

MIT
