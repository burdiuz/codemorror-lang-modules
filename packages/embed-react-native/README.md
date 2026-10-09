# @actualwave/codemirror-lang-embed-react-native

React / React Native aware **autocompletion** for JS/TS/JSX/TSX in
[CodeMirror 6](https://codemirror.net/): import specifiers and symbols, JSX tags and props, and
`style={{ … }}` / `StyleSheet.create({ … })` properties and values. It wraps
[`@actualwave/codemirror-lang-react-native`](../react-native) so it can be merged into a language
that uses embedded templates.

There is nothing to parse here; the completion works on top of the normal JS/JSX syntax tree. So
the package exports `createSupportExtension()` rather than `createEmbedding()`.

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-react-native \
  @actualwave/codemirror-lang-react-native \
  @codemirror/autocomplete @codemirror/language @codemirror/state @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createSupportExtension as createReactNative } from "@actualwave/codemirror-lang-embed-react-native"

const embedded = embedTaggedTemplates(
  javascript({ jsx: true, typescript: true }),
  createTagRegistry(), // register other embeds here
)

new EditorView({
  doc: `import { View } from "react-native"\nconst a = <View st`,
  extensions: [
    basicSetup,
    new LanguageSupport(embedded.language, [embedded.support, createReactNative(embedded)]),
  ],
  parent: document.body,
})
```

> Pass the support whose `language` the editor actually uses. With embedded templates, that is the
> **wrapped** support (`embedded`). The completion source is attached to that `language` object;
> attaching it to a different one (such as the plain `javascript()` language) has no effect.

## Configuration

`createSupportExtension(jsLanguageSupport, config?)` passes `config` to
`reactNativeCompletionSource(config)`:

| Option | Description |
| --- | --- |
| `modules` | extra module data, merged over the built-in `react` and `react-native` entries |
| `styleFactories` | extra function names (besides `StyleSheet.create`) whose object arguments are treated as style dictionaries |

### Adding your own modules

```js
createReactNative(embedded, {
  modules: {
    "expo-image": {
      Image: {
        type: "type",
        props: ["source", "style", "contentFit", "transition"],
      },
    },
  },
  styleFactories: ["createStyles", "makeStyles"],
})
```

With this, ``import { Image } from "expo-image"`` is suggested, `<Image ` offers its props, and
`createStyles({ box: { | } })` offers style properties.

## What gets suggested

- Module names inside `import … from "|"`.
- Named exports inside `import { | } from "react-native"` (excluding ones already imported).
- JSX tag names after `<` (only components imported in the file).
- JSX props inside an open tag, resolved through the file's imports.
- Imported hooks, variables and components by local name (`useSta` → `useState`).
- Style property names in `style={{ … }}` and `StyleSheet.create({ … })`, plus the known values for
  enum-like properties (`flexDirection`, `resizeMode`, `textAlign` …).

See the [`react-native` package README](../react-native/README.md) for details of each context.

## Returns

`createSupportExtension(jsLanguageSupport, config?)` → an `Extension`
(`jsLanguageSupport.language.data.of({ autocomplete })`).

## License

MIT
