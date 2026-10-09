# @actualwave/codemirror-lang-embed-tailwind

Tailwind class-name **autocompletion** and **category-colored highlighting** inside
`` tw`…` `` tagged templates in JS/TS/JSX/TSX for [CodeMirror 6](https://codemirror.net/). It is
aimed at [twrnc](https://github.com/jaredh159/tailwind-react-native-classnames) (Tailwind for React
Native), but works for any ``tw`` usage.

```js
const panel = tw`flex-1 p-4 bg-white rounded-lg`
```

Unlike the other embeds, Tailwind has no grammar to parse: the template is a flat list of class
names. This package therefore exports `createSupportExtension()` rather than `createEmbedding()`.
It adds a completion source and a decoration plugin to the JS language.

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-tailwind @actualwave/codemirror-lang-embed-core \
  @codemirror/autocomplete @codemirror/language @codemirror/state @codemirror/view \
  @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createSupportExtension as createTailwind } from "@actualwave/codemirror-lang-embed-tailwind"

// 1. wrap JS (use an empty registry if you have no other embeds)
const embedded = embedTaggedTemplates(
  javascript({ jsx: true, typescript: true }),
  createTagRegistry(),
)

// 2. build Tailwind support from the *wrapped* support
new EditorView({
  doc: "const a = tw`flex-`",
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, createTailwind(embedded)]),
  ],
  parent: document.body,
})
```

> `createSupportExtension` attaches its completion source to `jsLanguageSupport.language`. Pass
> the *wrapped* support (`embedded`), the same object whose `language` you give to
> `LanguageSupport`. If you pass the plain `javascript()` support, the data is attached to a
> different language object and suggestions never appear.

## What you get

### Autocompletion

Inside a ``tw`…` `` template, the word under the cursor is matched against a built-in list of
Tailwind utility names by prefix (`bg-b` → `bg-black`, `bg-blue-500` …). Completions have type
`class`. It stays silent outside `tw` templates, so normal JS completions are not affected.

- Suggestions open as you type; press `Ctrl-Space` to open them on an empty word.
- Arbitrary values (`bg-[#123456]`, `p-[13px]`) are not completed.
- Interpolations (`${…}`) are skipped.

### Category highlighting

Known classes get a CSS class by category: `cm-tw-layout`, `cm-tw-spacing`, `cm-tw-sizing`,
`cm-tw-typography`, `cm-tw-colors`, `cm-tw-borders`, `cm-tw-effects`, `cm-tw-positioning`.
Unknown or arbitrary tokens are left undecorated. Default colors are built in (a dark-friendly
palette); override them with your own theme:

```js
EditorView.theme({
  ".cm-tw-layout": { color: "#0550ae" },
  ".cm-tw-spacing": { color: "#116329" },
  ".cm-tw-colors": { color: "#953800" },
})
```

The plugin runs at the highest precedence so its colors win over the normal string highlighting.

## Notes

- Only the bare tag `tw` is recognized (``tw`…` ``). `className="…"` attributes are not handled.
- The class list is static and not generated from your `tailwind.config`. Custom classes will not
  be suggested or colored.
- The data and plugins are also exported from the sub-modules: `completion.js`
  (`tailwindCompletionSource`) and `decoration.js` (`tailwindHighlightPlugin`,
  `tailwindHighlightTheme`) if you want to compose them by hand.

## Returns

`createSupportExtension(jsLanguageSupport)` → `Extension[]` (completion source, decoration plugin,
base theme).

## License

MIT
