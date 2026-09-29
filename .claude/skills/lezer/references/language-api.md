# Language API

## `LRLanguage.define`

```typescript
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp,
        foldInside, delimitedIndent, continuedIndent, flatIndent} from "@codemirror/language"

export const myLanguage = LRLanguage.define({
  name: "my-lang",          // matched by LanguageDescription
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Block:       delimitedIndent({ closing: "}", align: false }),
        IfStatement: continuedIndent({ except: /^\s*else\b/ }),
        // Custom:
        SomeNode: context => context.baseIndent + context.unit,
      }),
      foldNodeProp.add({
        Block:    foldInside,
        StructDef: foldInside,
        // Custom range:
        FunctionBody: node => ({ from: node.from + 1, to: node.to - 1 }),
      }),
    ]
  }),
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*[\}\]\)]$/,  // re-indent when closing bracket typed
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
  }
})

export function myLang() {
  return new LanguageSupport(myLanguage)
}
```

---

## Indentation Helpers

| Helper | Use |
|--------|-----|
| `delimitedIndent({ closing, align?, units? })` | Bracketed blocks. Indent +1 unless line starts with `closing`. `align: true` aligns to the opening token. |
| `continuedIndent({ except?, units? })` | Indent +1. Skip lines matching `except` regexp (e.g. `else` after `if`). |
| `flatIndent` | No extra indent — align to base indentation of the node. |

### Custom indent function — `TreeIndentContext` API
```typescript
indentNodeProp.add({
  MyNode: (context: TreeIndentContext) => {
    context.node              // SyntaxNode being indented
    context.textAfter         // text after the cursor on the current line
    context.baseIndent        // column of the line this node starts on
    context.baseIndentFor(n)  // base indent for any SyntaxNode
    context.unit              // editor indent unit (spaces)
    context.continue()        // delegate to parent node's indentation
    return context.baseIndent + context.unit
  }
})
```

---

## Folding

```typescript
foldNodeProp.add({
  // foldInside: hides everything except first and last child (the delimiters)
  Block: foldInside,

  // Custom: return { from, to } or null
  MyNode: (node, state) => {
    if (!node.firstChild || !node.lastChild) return null
    return { from: node.firstChild.to, to: node.lastChild.from }
  },
})
```

---

## Runtime Parser Configuration

`parser.configure(options)` returns a new parser — original is unchanged:

```typescript
const configuredParser = parser.configure({
  top: "SingleExpression",        // override @top rule
  dialect: "typescript jsx",      // enable dialects (space-separated)
  props: [styleTags({...}), ...], // add node props
  tokenizers: [{ from: old, to: new }],     // replace external tokenizer
  specializers: [{ from: old, to: new }],   // replace external specializer
  contextTracker: myContextTracker,         // replace context tracker
  strict: false,                  // true = throw on errors (no recovery)
  bufferLength: 1024,             // max internal tree buffer size
})
```

`LRLanguage.configure(options, name?)` — same, at the language level:
```typescript
export const tsLanguage = myLanguage.configure({ dialect: "typescript" }, "typescript")
```

---

## `languageData` Fields

Common keys understood by CodeMirror extensions:

| Key | Type | Effect |
|-----|------|--------|
| `commentTokens` | `{ line?, block?: { open, close } }` | Used by comment-toggling commands |
| `indentOnInput` | `RegExp` | Re-indent the line whenever typed input matches |
| `closeBrackets` | `{ brackets: string[] }` | Auto-close brackets/quotes |
| `wordChars` | `string` | Extra characters counted as part of a word |
| `autocomplete` | function or list | Completion source (see language-features.md) |
