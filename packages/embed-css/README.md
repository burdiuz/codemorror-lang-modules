# @actualwave/codemirror-lang-embed-css

CSS highlighting and **property / value autocompletion** inside `` css`…` `` and
styled-components-style `` styled.X`…` `` / `` styled(Component)`…` `` tagged templates in
JS/TS/JSX/TSX for [CodeMirror 6](https://codemirror.net/). It is based on
[`@codemirror/lang-css`](https://github.com/codemirror/lang-css).

```js
const button = css`
  color: #fff;
  padding: 12px 16px;
`

const Card = styled.View`
  flex: 1;
  margin: 4px;
`

const Wrapper = styled(Container)`
  display: flex;
`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-css @actualwave/codemirror-lang-embed-core \
  @codemirror/lang-css @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createCss } from "@actualwave/codemirror-lang-embed-css"

const css = createCss()

const registry = createTagRegistry()
registry.register(css.matcher, css.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const a = css`col`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, css.extension]),
  ],
  parent: document.body,
})
```

## Which tags match

| Tag | Matches |
| --- | --- |
| `` css`…` `` | yes |
| `` styled`…` ``, `` styled.View`…` ``, `` styled.div`…` `` | yes |
| `` styled(Button)`…` `` | yes (a call collapses to its callee) |
| `` styled['View']`…` `` | no (bracket access) |

The matcher is `tagPath[0] === 'css' || tagPath[0] === 'styled'`. To also support another tag
(for example `keyframes` or `createGlobalStyle`), register another matcher with the same
language:

```js
import { matchTagName } from "@actualwave/codemirror-lang-embed-core"
registry.register(matchTagName("keyframes"), css.language)
```

## Suggestions

`css.extension` is the completion source of `@codemirror/lang-css` (property names, values,
colors, units, at-rules). The template content is a bare declaration list with no `selector { … }`
wrapper, so the package parses it with CSS's `Styles` top rule, the same way `lang-html` handles
`style="…"` attributes. Property names are therefore suggested inside the template (rather than
selectors).

There is no configuration; `createEmbedding()` takes no arguments.

> Without `css.extension` you get highlighting only.

## Returns

`createEmbedding()` → `{ matcher, language: { parser }, extension }`.

## License

MIT
