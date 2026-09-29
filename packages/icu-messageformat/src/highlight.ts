import {styleTags, tags as t} from "@lezer/highlight"

export const icuHighlighting = styleTags({
  "Text": t.content,
  "PoundSign": t.special(t.number),
  "EscapedApos": t.escape,
  "QuotedLiteral": t.string,

  "ArgName": t.variableName,
  "ArgType": t.typeName,
  "ArgStyle": t.string,

  "plural selectordinal select": t.keyword,
  "offset": t.keyword,
  "zero one two few many other": t.atom,

  "ExactValue": t.number,
  "number": t.number,

  "{ }": t.brace,
  "= : ,": t.separator,
})
