# Language Features

## `LanguageDescription` — Lazy Loading

Registers a language with metadata and a dynamic loader. Used by plugins that need to find or load languages on demand (e.g. Markdown code block highlighting, file-extension detection).

```typescript
import {LanguageDescription} from "@codemirror/language"

export const myLangDescription = LanguageDescription.of({
  name: "MyLang",                          // display name
  alias: ["mylang", "ml"],                 // alternative names (lowercased)
  extensions: [".ml", ".myl"],             // file extensions
  filename: /\.myl?$/,                     // filename regexp (optional)
  load() {
    // Dynamic import — language bundle loaded only when needed:
    return import("./index.js").then(m => m.myLang())
  },
})

// If already loaded:
LanguageDescription.of({
  name: "JSON",
  extensions: [".json"],
  support: jsonLanguageSupport,
})
```

### Finding a Language

```typescript
// By filename:
const desc = LanguageDescription.matchFilename(descriptions, "index.ts")

// By name (fuzzy optional):
const desc = LanguageDescription.matchLanguageName(descriptions, "TypeScript", true)

// Load it:
if (desc) {
  const support = await desc.load()   // returns LanguageSupport
  // or check if already loaded:
  if (desc.support) { /* use desc.support synchronously */ }
}
```

---

## Autocompletion Integration

### Static completions

```typescript
import {completeFromList} from "@codemirror/autocomplete"

export const myCompletion = myLanguage.data.of({
  autocomplete: completeFromList([
    { label: "if",     type: "keyword" },
    { label: "while",  type: "keyword" },
    { label: "float4", type: "type" },
    { label: "sin",    type: "function", detail: "(float) → float" },
    { label: "cos",    type: "function", detail: "(float) → float" },
  ])
})

export function myLang() {
  return new LanguageSupport(myLanguage, [myCompletion])
}
```

### Context-aware completions (tree-based)

```typescript
import {CompletionContext, CompletionResult} from "@codemirror/autocomplete"
import {syntaxTree} from "@codemirror/language"

function myCompleter(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const node = syntaxTree(context.state).resolve(context.pos, -1)

  if (node.name === "FieldAccess") {
    return { from: word.from, options: memberCompletions }
  }
  return { from: word.from, options: globalCompletions }
}

const myCompletion = myLanguage.data.of({ autocomplete: myCompleter })
```

---

## Language Nesting

### Separate parser per embedded region (`parseMixed`)

Use when embedded code has a completely different language (CSS inside HTML, JS inside HTML):

```typescript
import {parseMixed} from "@lezer/common"

const mixedParser = htmlParser.configure({
  wrap: parseMixed(node => {
    if (node.name === "ScriptText") return { parser: javascriptParser }
    if (node.name === "StyleText")  return { parser: cssParser }
    return null
  })
})
```

The nested parser gets its own full syntax tree mounted at those nodes. Queries (`getChild`, `syntaxTree`, etc.) transparently enter mounted trees.

### Sublanguages (different language data, same parser)

Use when parts of the document need different completion/comment/indent data without a separate parser:

```typescript
import {defineLanguageFacet, sublanguageProp} from "@codemirror/language"

const embeddedFacet = defineLanguageFacet({
  commentTokens: { line: "--" },
  autocomplete: myEmbeddedCompleter,
})

const configuredParser = myParser.configure({
  props: [
    sublanguageProp.add({
      top: [{
        type: "extend",    // "extend" adds to parent data; "replace" replaces it
        test: (node, state) => isInsideEmbeddedRegion(node, state),
        facet: embeddedFacet,
      }]
    })
  ]
})
```
