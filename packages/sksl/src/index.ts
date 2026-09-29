import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {skslCompletionSource} from "./completion"

export const skslLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Block: delimitedIndent({closing: "}", align: false}),
      }),
      foldNodeProp.add({
        Block: foldInside,
        StructDef: foldInside,
      }),
    ]
  }),
  languageData: {
    commentTokens: {line: "//", block: {open: "/*", close: "*/"}},
    indentOnInput: /^\s*\}$/,
  }
})

export function sksl() {
  return new LanguageSupport(skslLanguage, skslLanguage.data.of({autocomplete: skslCompletionSource}))
}
