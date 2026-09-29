# Common Patterns

## Test Tree Rules

### Lowercase rules and tokens are invisible

Rules and tokens whose names start with a **lowercase letter** do not appear as nodes in the syntax tree — they are transparent. Their children float up to the nearest named ancestor.

**Always omit lowercase names from expected trees.**

```
// Grammar:
expression     { UnaryExpr | expression addOp expression | ... }  // invisible
declaratorList { declarator ("," declarator)* }                    // invisible
declarator     { identifier ("=" expression)? }                    // invisible

// Input: float y = 1.0;
// Actual tree: VarDecl(TypeName(float), UnaryExpr(PostfixExpr(PrimaryExpr(Literal))))
//              ← declaratorList, declarator, expression — invisible
//              ← identifier, addOp, relOp, etc. — invisible lowercase tokens

// WRONG expected tree:
Program(VarDecl(TypeName(float),declaratorList(declarator(identifier,expression(UnaryExpr(...))))))

// CORRECT expected tree:
Program(VarDecl(TypeName(float),UnaryExpr(PostfixExpr(PrimaryExpr(Literal)))))
```

**Visible nodes**: `CapitalizedName` rules + `@specialize[@name=term]` keyword tokens (e.g. `uniform`, `if`, `struct`, `discard`).

### Punctuation is optional in expected trees

Literal tokens (`";"`, `"("`, `"{"`) may be omitted from expected trees — the test runner skips them during comparison. Include them only to explicitly assert their presence.

### Programmatic testing with `testTree`

```javascript
import {parser} from "./dist/index.js"
import {testTree} from "@lezer/generator/dist/test"

const tree = parser.parse("float x = 1.0;")
testTree(tree, "Program(VarDecl(TypeName(float),UnaryExpr(PostfixExpr(PrimaryExpr(Literal)))))")
// Throws with a diff if the tree doesn't match
```

Error messages show the **actual** tree — copy-paste it to build correct expected trees.

---

## Complete JSON Grammar (end-to-end working example)

### `syntax.grammar`
```
@top JsonText { value }

value { True | False | Null | Number | String | Object | Array }

True  { @specialize[@name=True]  <identifier, "true">  }
False { @specialize[@name=False] <identifier, "false"> }
Null  { @specialize[@name=Null]  <identifier, "null">  }

Object { "{" commaSep<Property> "}" }
Array  { "[" commaSep<value> "]" }
Property { PropertyName ":" value }

commaSep<content> { "" | content ("," content)* }

@tokens {
  Number {
    "-"? (@digit+ ("." @digit*)? | "." @digit+) ($[eE] $[+\-]? @digit+)?
  }
  String       { '"' (!["\\] | "\\" _)* '"' }
  PropertyName { '"' (!["\\] | "\\" _)* '"' }
  identifier   { $[a-z]+ }
  whitespace   { $[ \t\n\r]+ }
  "{" "}" "[" "]" ":" ","
}

@skip { whitespace }
@detectDelim
```

### `highlight.ts`
```typescript
import {styleTags, tags as t} from "@lezer/highlight"

export const jsonHighlighting = styleTags({
  "True False Null": t.keyword,
  "Number":          t.number,
  "String":          t.string,
  "PropertyName":    t.propertyName,
  "{ }":             t.brace,
  "[ ]":             t.squareBracket,
  ": ,":             t.separator,
})
```

### `index.ts`
```typescript
import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, foldNodeProp, foldInside} from "@codemirror/language"

export const jsonLanguage = LRLanguage.define({
  name: "json",
  parser: parser.configure({
    props: [foldNodeProp.add({ Object: foldInside, Array: foldInside })]
  }),
  languageData: {
    closeBrackets: { brackets: ["{", "[", '"'] },
  }
})

export function json() { return new LanguageSupport(jsonLanguage) }
```

### `test/cases.txt`
```
# Object

{"a": 1, "b": true}

==>

JsonText(Object(Property(PropertyName, Number), Property(PropertyName, True)))

# Nested

{"x": [1, 2]}

==>

JsonText(Object(Property(PropertyName, Array(Number, Number))))
```

---

## Operator Precedence Tower (C-like)

```
expression { AssignExpr }

AssignExpr      { ConditionalExpr | UnaryExpr assignOp AssignExpr }
ConditionalExpr { LogicalOrExpr ("?" expression ":" ConditionalExpr)? }
LogicalOrExpr   { LogicalAndExpr (logicalOr  LogicalAndExpr)* }
LogicalAndExpr  { BitwiseOrExpr  (logicalAnd BitwiseOrExpr)* }
BitwiseOrExpr   { BitwiseXorExpr ("|" BitwiseXorExpr)* }
BitwiseXorExpr  { BitwiseAndExpr ("^" BitwiseAndExpr)* }
BitwiseAndExpr  { EqualityExpr   ("&" EqualityExpr)* }
EqualityExpr    { RelationalExpr (eqOp RelationalExpr)* }
RelationalExpr  { ShiftExpr      (relOp ShiftExpr)* }
ShiftExpr       { AddExpr        (shiftOp AddExpr)* }
AddExpr         { MulExpr        (addOp MulExpr)* }
MulExpr         { UnaryExpr      (mulOp UnaryExpr)* }
UnaryExpr       { PostfixExpr | unaryOp UnaryExpr }
PostfixExpr     { PrimaryExpr (FieldAccess | IndexAccess | CallArgs | PostfixOp)* }

FieldAccess { "." identifier }
IndexAccess { "[" expression "]" }
CallArgs    { "(" argList? ")" }
PostfixOp   { "++" | "--" }
argList     { expression ("," expression)* }

PrimaryExpr { identifier | Literal | "(" expression ")" }
```

---

## Keyword Template

```
kw<term> { @specialize[@name={term}] <identifier, term> }
```

Usage: `kw<"if">`, `kw<"return">`, `kw<"float4">`. All create specialized identifier tokens.

---

## Dangling Else

```
IfStmt {
  kw<"if"> "(" expression ")" ~else statement
  (~else kw<"else"> statement)?
}
```

---

## Automatic Semicolon Insertion (ASI)

```
// grammar:
@external tokens noSemicolon from "./tokens" { noSemi }
semi { ";" | insertSemi }
ReturnStatement { kw<"return"> (noSemi expression)? semi }

// tokens.js:
export const noSemicolon = new ExternalTokenizer((input, stack) => {
  const {next} = input
  if (next === 32 || next === 9) return   // whitespace — don't match
  if (next === 47 && (input.peek(1) === 47 || input.peek(1) === 42)) return  // comment
  if (next !== 125 && next !== 59 && next !== -1)
    input.acceptToken(noSemi)
}, {contextual: true})
```

---

## Preprocessor Directives

```
PreprocessorDirective { "#" ![\n]* }
```

Add to `topLevelItem` alternatives and/or inside `@skip`.

---

## Block Comments (incremental-friendly)

```
@skip {} {
  BlockComment { "/*" (blockCommentContent | blockCommentNewline)* blockCommentEnd }
}
@local tokens {
  blockCommentEnd     { "*/" }
  blockCommentNewline { "\n" }
  @else blockCommentContent
}
```

---

## Indentation-Sensitive Languages (Python/YAML style)

```
// grammar:
@external tokens indentTokens from "./tokens" { indent, dedent, blankLineStart }
@context trackIndent from "./tokens"
@top Tree { element* }
element { Atom | Section }
Atom    { Identifier lineEnd }
Section { Identifier lineEnd Block }
Block   { indent element+ (dedent | eof) }
lineEnd { newline | eof }
@skip { spaces | Comment | blankLineStart (spaces | Comment)* lineEnd }
@tokens {
  spaces { $[ \t]+ }
  newline { "\n" }
  eof { @eof }
  Comment { "#" ![\n]+ }
  Identifier { $[a-zA-Z0-9_]+ }
}
```

```javascript
// tokens.js:
import {ExternalTokenizer, ContextTracker} from "@lezer/lr"
import {indent, dedent, blankLineStart} from "./syntax.grammar.terms"

class IndentLevel {
  constructor(parent, depth) {
    this.parent = parent; this.depth = depth
    this.hash = (parent ? parent.hash + (parent.hash << 8) : 0) + depth + (depth << 4)
  }
}

export const trackIndent = new ContextTracker({
  start: new IndentLevel(null, 0),
  shift(context, term, stack, input) {
    if (term == indent) return new IndentLevel(context, stack.pos - input.pos)
    if (term == dedent) return context.parent
    return context
  },
  hash: ctx => ctx.hash
})

export const indentation = new ExternalTokenizer((input, stack) => {
  if (input.peek(-1) !== -1 && input.peek(-1) !== 10) return
  let spaces = 0
  while (input.next === 32 || input.next === 9) { input.advance(); spaces++ }
  if (input.next === 10 || input.next === 35) {
    if (stack.canShift(blankLineStart)) input.acceptToken(blankLineStart, -spaces)
  } else if (spaces > stack.context.depth) {
    input.acceptToken(indent)
  } else if (spaces < stack.context.depth) {
    input.acceptToken(dedent, -spaces)
  }
})
```
