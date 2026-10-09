# @actualwave/codemirror-lang-embed-glsl

[GLSL](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language) highlighting and
autocompletion inside `` glsl`…` `` tagged templates in JS/TS/JSX/TSX for
[CodeMirror 6](https://codemirror.net/). The grammar comes from
[`@actualwave/codemirror-lang-glsl`](../glsl).

```js
const fragment = glsl`
  precision mediump float;
  uniform vec2 resolution;
  void main() {
    gl_FragColor = vec4(gl_FragCoord.xy / resolution, 0.0, 1.0);
  }
`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-glsl @actualwave/codemirror-lang-embed-core \
  @actualwave/codemirror-lang-glsl @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createGlsl } from "@actualwave/codemirror-lang-embed-glsl"

const glsl = createGlsl()

const registry = createTagRegistry()
registry.register(glsl.matcher, glsl.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const f = glsl`vec`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, glsl.extension]),
  ],
  parent: document.body,
})
```

## Suggestions

`glsl.extension` carries the GLSL completion source (types, qualifiers and keywords, built-in
functions and the common `gl_*` variables). Add it to the `LanguageSupport` as shown; without it the editor shows
highlighting only.

There is no configuration; `createEmbedding()` takes no arguments.

## Notes

- Only the bare tag `glsl` matches. Use `registry.register(matchTagName("frag"), glsl.language)`
  from the core package to add other names.
- `${...}` interpolations are excluded from the GLSL parse.
- Peer dependency: `@actualwave/codemirror-lang-glsl ^0.1.0`.

## Returns

`createEmbedding()` → `{ matcher, language: glslLanguage, extension }`.

## License

MIT
