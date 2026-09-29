# Grammar Directives

## `@top`
Declares the root rule. Multiple `@top` rules give the parser multiple entry points:
```
@top Script { statement* }
@top SingleExpression { expression }
```
Select at runtime: `parser.configure({ top: "SingleExpression" })`.

## `@skip`
Tokens that can appear anywhere without affecting structure:
```
@skip { whitespace | LineComment | BlockComment }
```
Disable for a sub-section (string contents, template literals):
```
@skip {} {
  String { stringOpen (stringEscape | stringContent)* stringClose }
}
```

## `@tokens`
Regular-language token rules. No general recursion — only tail calls allowed:
```
@tokens {
  identifier { $[a-zA-Z_] $[a-zA-Z0-9_]* }
  Number     { @digit+ ("." @digit+)? }
  LineComment { "//" ![\n]* }
  whitespace  { $[ \t\n\r]+ }
  "(" ")" "{" "}" ";" ","    // literal tokens — auto-included in tree
}
```

## `@external tokens`
Import tokens from JavaScript when regular-language patterns aren't enough (ASI, indentation):
```
@external tokens insertSemicolon from "./tokens" { insertSemi }
@external tokens indentTokens from "./tokens" { indent, dedent, blankLineStart }
```

## `@external specialize`
External keyword specialization (complex match logic):
```
@external specialize {identifier} specializeIdent from "./tokens" { keyword1, keyword2 }
```

## `@external propSource`
Import a `NodePropSource` (e.g. `styleTags`) to attach highlighting:
```
@external propSource myHighlighting from "./highlight"
```

## `@context`
Attach a `ContextTracker` for stateful tokenization (indentation levels, etc.):
```
@context trackIndent from "./tokens"
```

## `@precedence`
Declare operator precedence levels, highest to lowest:
```
@precedence {
  member,
  call,
  times @left,
  plus @left,
  rel @left,
  assign @right,
  statement @cut
}
```
- `@left` — left-associative
- `@right` — right-associative
- `@cut` — commits to this rule when the parser passes the `!statement` marker; discards competing rules. Used to distinguish `FunctionDeclaration` from `FunctionExpression`.

Mark positions: `expression !times mulOp expression`

## `@dialects`
Optional language variants:
```
@dialects { jsx typescript }
```
Enable at runtime: `parser.configure({ dialect: "typescript jsx" })`
Mark dialect-only rules: `rule[@dialect=jsx] { ... }`

## `@detectDelim`
Automatically infers `openedBy`/`closedBy` node props for bracket pairs. Always include when using `()`, `[]`, `{}`.

## `@local tokens`
Context-sensitive tokens scoped to a grammar sub-section. `@else` is a catch-all matching any character not claimed by others:
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
Also used for template string bodies, string content, etc.

## `@isGroup`
Tags all rule alternatives with a group node prop without creating a wrapper node. The rule must be lowercase (invisible in tree); `getChild("GroupName")` on any parent will find its children by group:
```
statement[@isGroup=Statement] {
  FunctionDeclaration |
  VariableDeclaration |
  IfStatement |
  ExpressionStatement { expression semi }
}
```
`parentNode.getChild("Statement")` finds `FunctionDeclaration`, `IfStatement`, etc. because they all carry the `Statement` group prop.

---

## Rule Naming

| Name style | Tree behavior |
|------------|---------------|
| `CapitalizedName` | Appears as a node in the syntax tree |
| `lowercase` | Structural only — invisible in the tree |
| `_Underscore` | Explicitly suppresses the node |

## Operators
```
A B       — sequence
A | B     — choice (commutative — order does NOT affect parsing)
A*        — zero or more
A+        — one or more
A?        — optional
(A | B)+  — grouped
```

## Token vs Rule Context
- Inside `@tokens {}`: `"ab"` = one token matching the two-character literal `ab`
- Outside `@tokens {}`: `"a" "b"` = token `a` followed by token `b`

---

## `@specialize` vs `@extend`

| | `@specialize` | `@extend` |
|---|---|---|
| When matched | Token becomes **only** the specialized type | Produces **both** the specialized and original token (GLR split) |
| Use case | Reserved keywords (`if`, `while`, `return`) | Contextual keywords valid as both keyword and identifier (`get`, `set`, `async`) |

```
// Reserved keyword — 'return' can never be an identifier:
kw<term> { @specialize[@name={term}] <identifier, term> }

// Contextual keyword — 'get' is also a valid property name:
propKw<term> { @extend[@name={term}] <PropertyName, term> }
```

When keywords must be valid as identifiers in some positions, define two separate tokens with identical patterns. Lezer's contextual tokenizer picks the right one based on parse position:
```
@tokens {
  Identifier   { $[a-zA-Z_] $[a-zA-Z0-9_]* }
  PropertyName { $[a-zA-Z_] $[a-zA-Z0-9_]* }
  // identical patterns — contextual tokenizer picks based on parse state
}
```
`@specialize` applies to `Identifier` but not `PropertyName`, so `get` is a keyword in statement position but a valid property name otherwise.

---

## Template Rules

Parameterized rules for reuse (angle bracket syntax):
```
commaSep<content>  { "" | content ("," content)* }
commaSep1<content> { content ("," content)* }
parenList<content> { "(" commaSep<content> ")" }
```
Usage: `commaSep<expression>`, `commaSep1<Identifier>`, `parenList<param>`

Template parameters splice into `@name`:
```
kw<term> { @specialize[@name={term}] <identifier, term> }
```
`kw<"if">` → node named `if` in the tree.

---

## Node Properties

Square bracket syntax after the rule name sets custom node props on the generated node type:
```
StartTag[closedBy="EndTag"] { "<" tagName ">" }
EndTag[openedBy="StartTag"] { "</" tagName ">" }
SomeToken[someProp=value]   { "token" }
```

### Pseudo-props (start with `@`)

| Prop | Effect |
|------|--------|
| `[@isGroup=GroupName]` | All choices in the rule carry the `group` prop — enables `node.getChild("GroupName")` |
| `[@name=Alias]` | Rename this node in the tree (used in `@specialize[@name=if]`) |
| `[@dialect=name]` | Rule is only active when that dialect is enabled |
| `[@export]` | Export this term's numeric ID in the generated `.terms` file |
