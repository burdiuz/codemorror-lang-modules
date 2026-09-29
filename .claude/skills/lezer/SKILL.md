---
name: lezer
description: Build CodeMirror 6 language packages using the Lezer LR parser generator. Use when creating syntax highlighting, indentation, folding, or autocompletion support for a programming language; when writing or debugging .grammar files; when working with @lezer/generator, @codemirror/language, or @lezer/highlight APIs; when resolving grammar conflicts (shift/reduce, reduce/reduce).
compatibility: Designed for Claude Code. Requires Node.js with @lezer/generator, @codemirror/language, @lezer/highlight, @lezer/lr installed.
metadata:
  author: Oleg Galaburda
  version: "1.0"
---

# Lezer Language Package

A CodeMirror 6 language package has three source files and a test suite.

## Project Structure

```
src/
├── syntax.grammar     # Lezer grammar — defines the parse tree
├── highlight.ts       # styleTags — maps node names to @lezer/highlight tags
└── index.ts           # LRLanguage.define + exported myLang() function
test/
├── test.js            # Mocha runner
└── cases.txt          # .txt test cases
rollup.config.js
package.json
```

## Workflow

1. Write `src/syntax.grammar`
2. Write `src/highlight.ts` referencing the grammar's node names
3. Wire together in `src/index.ts`
4. Run `npm run prepare` (Rollup + `@lezer/generator/rollup` plugin compiles the grammar)
5. Write test cases in `test/cases.txt`, run `npm test`

---

## Grammar File Skeleton

```
@top Program { topItem* }

@skip { whitespace | LineComment | BlockComment }

topItem { ... }

// rules...

@tokens {
  identifier { $[a-zA-Z_] $[a-zA-Z0-9_]* }
  LineComment { "//" ![\n]* }
  whitespace  { $[ \t\n\r]+ }
  "(" ")" "{" "}" "[" "]" ";" ","
}

@external propSource myHighlighting from "./highlight"

@detectDelim
```

See [grammar-directives.md](references/grammar-directives.md) for all directives.

---

## Keyword Pattern

The standard pattern for all C-like keywords. Use it everywhere:

```
kw<term> { @specialize[@name={term}] <identifier, term> }
```

**⚠ Lezer ≥ 1.x syntax**: angle brackets `<token, literal>`, NOT curly braces `{ "literal" }`.

Usage: `kw<"if">`, `kw<"return">`, `kw<"float4">` — all specialize the `identifier` token.

---

## highlight.ts Skeleton

```typescript
import {styleTags, tags as t} from "@lezer/highlight"

export const myHighlighting = styleTags({
  "if else for while return break continue": t.controlKeyword,
  "struct":        t.definitionKeyword,
  "const in out":  t.modifier,
  "void bool int float double": t.typeName,
  "identifier":    t.variableName,
  "FunctionDef/identifier": t.function(t.definition(t.variableName)),
  "Literal Number": t.number,
  "String":        t.string,
  "LineComment":   t.lineComment,
  "BlockComment":  t.blockComment,
  "{ }": t.brace, "( )": t.paren, "[ ]": t.squareBracket, "; ,": t.separator,
})
```

See [highlight-api.md](references/highlight-api.md) for all tags and path selector syntax.

---

## index.ts Skeleton

```typescript
import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"

export const myLanguage = LRLanguage.define({
  name: "my-lang",
  parser: parser.configure({
    props: [
      indentNodeProp.add({ Block: delimitedIndent({ closing: "}", align: false }) }),
      foldNodeProp.add({ Block: foldInside }),
    ]
  }),
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*\}$/,
  }
})

export function myLang() {
  return new LanguageSupport(myLanguage)
}
```

See [language-api.md](references/language-api.md) for indentation helpers, folding, and runtime config.

---

## Test Case Format

```
# test name

input code here

==>

Program(NodeName(childNode, OtherNode))
```

- `#` — test name (add `{"dialect":"foo"}` after name to configure parser)
- Punctuation tokens (`";"`, `"("`) are omitted from expected tree by default
- `⚠` — expected error node
- See [common-patterns.md](references/common-patterns.md) for a complete JSON grammar example

---

## rollup.config.js

```javascript
import {lezer} from "@lezer/generator/rollup"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "./src/index.ts",
  external: ["@codemirror/language", "@lezer/highlight", "@lezer/lr", "@lezer/common"],
  output: [
    { file: "./dist/index.cjs", format: "cjs" },
    { dir: "./dist", format: "es" },
  ],
  plugins: [lezer(), typescript()],
}
```

---

## Reference Files

| File | Contents |
|------|----------|
| [grammar-directives.md](references/grammar-directives.md) | All directives: `@top`, `@skip`, `@tokens`, `@external`, `@precedence`, `@dialects`, `@local`, `@isGroup`, `@detectDelim`, `@context`; rule naming; template rules; node properties (`[closedBy=...]`, pseudo-props); `@specialize` vs `@extend` |
| [token-patterns.md](references/token-patterns.md) | Built-in char classes, identifier/number/string/comment patterns, `@eof`, `@else` |
| [conflict-resolution.md](references/conflict-resolution.md) | `~name` markers, `!name` inline precedence, `@cut`, token `@precedence`, GLR splitting |
| [highlight-api.md](references/highlight-api.md) | `styleTags`, all `tags.*` names, path selector syntax, tag modifier functions |
| [language-api.md](references/language-api.md) | `LRLanguage.define`, `indentNodeProp`, `foldNodeProp`, `delimitedIndent`, `continuedIndent`, `foldInside`, runtime `parser.configure` |
| [tree-and-runtime-api.md](references/tree-and-runtime-api.md) | `SyntaxNode`, `TreeCursor`, `Tree.iterate`, `ExternalTokenizer`, `ContextTracker` |
| [language-features.md](references/language-features.md) | `LanguageDescription`, lazy loading, autocompletion, language nesting/sublanguages |
| [common-patterns.md](references/common-patterns.md) | Test tree rules (lowercase invisible, programmatic `testTree`), complete JSON grammar, operator precedence tower, block comments, ASI, preprocessor |
| [build-setup.md](references/build-setup.md) | `rollup.config.js`, complete `package.json`, `test/test.js` runner, CLI build flags |
| [troubleshooting.md](references/troubleshooting.md) | Compile error table, C-like grammar gotchas |
