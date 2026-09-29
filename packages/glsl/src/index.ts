import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {glslCompletionSource} from "./completion"

export const glslLanguage = LRLanguage.define({
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

export function glsl() {
  return new LanguageSupport(glslLanguage, glslLanguage.data.of({autocomplete: glslCompletionSource}))
}
