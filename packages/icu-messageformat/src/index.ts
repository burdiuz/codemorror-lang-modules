import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {icuCompletionSource} from "./completion"

export const icuMessageFormatLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Argument: delimitedIndent({closing: "}", align: false}),
      }),
      foldNodeProp.add({
        PluralCase: foldInside,
        SelectCase: foldInside,
      }),
    ]
  }),
  languageData: {}
})

export function icuMessageFormat() {
  return new LanguageSupport(icuMessageFormatLanguage, icuMessageFormatLanguage.data.of({autocomplete: icuCompletionSource}))
}
