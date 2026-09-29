import {CompletionContext, CompletionSource, completeFromList, snippetCompletion as snip} from "@codemirror/autocomplete"
import {syntaxTree} from "@codemirror/language"
import type {SyntaxNode} from "@lezer/common"

// ICU MessageFormat completion is context-sensitive rather than a flat
// keyword list: `plural`/`select`/`other`/etc are only valid at specific
// grammar positions (see syntax.grammar's `kw<term>` comment — they share
// the open `identifier` namespace, so what's offered depends on where the
// cursor actually is).

const pluralCategoryComplete = completeFromList([
  {label: "zero", type: "keyword"},
  {label: "one", type: "keyword"},
  {label: "two", type: "keyword"},
  {label: "few", type: "keyword"},
  {label: "many", type: "keyword"},
  {label: "other", type: "keyword"},
])

const selectCategoryComplete = completeFromList([
  {label: "other", type: "keyword"},
])

const argTypeComplete = completeFromList([
  {label: "plural", type: "keyword"},
  {label: "selectordinal", type: "keyword"},
  {label: "select", type: "keyword"},
  {label: "number", type: "keyword"},
  {label: "date", type: "keyword"},
  {label: "time", type: "keyword"},
  {label: "duration", type: "keyword"},
  {label: "spellout", type: "keyword"},
  {label: "ordinal", type: "keyword"},
])

const messageSnippetComplete = completeFromList([
  snip("{${name}, plural, one {# item} other {# items}}", {label: "plural", type: "keyword", detail: "plural argument"}),
  snip("{${name}, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}", {label: "selectordinal", type: "keyword", detail: "ordinal argument"}),
  snip("{${name}, select, ${key} {${value}} other {${other}}}", {label: "select", type: "keyword", detail: "select argument"}),
])

export const icuCompletionSource: CompletionSource = (context: CompletionContext) => {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1)
  for (let n: SyntaxNode | null = node; n; n = n.parent) {
    switch (n.name) {
      // Already inside a case branch's own message text — its content is
      // plain text (or nested arguments), not a selector keyword position.
      case "PluralCase":
      case "SelectCase":
        return null
      case "PluralArg":
        return pluralCategoryComplete(context)
      case "SelectArg":
        return selectCategoryComplete(context)
      // Still naming the argument (`{na|`) — nothing to suggest until past
      // the comma that follows ArgName.
      case "ArgName":
        return null
      case "Argument":
        return n.getChild("ArgName") ? argTypeComplete(context) : null
      case "Message":
        return messageSnippetComplete(context)
    }
  }
  return null
}
