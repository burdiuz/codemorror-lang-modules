# Token Patterns

## Built-in Character Classes
```
@asciiLetter    →  $[a-zA-Z]
@asciiLowercase →  $[a-z]
@asciiUppercase →  $[A-Z]
@digit          →  $[0-9]
@whitespace     →  Unicode whitespace
@eof            →  End of file (tokens only, not rules)
_               →  Any single character
```

## Character Set Syntax
```
$[a-z]      — range a to z
$[.,;]      — literal chars . , ;
$[a-zA-Z_]  — union of ranges
![x]        — any char EXCEPT x
![\n]       — any char except newline
![]         — any character (same as _)
```

---

## Common Token Patterns

### Identifiers
```
// ASCII:
identifier { $[a-zA-Z_] $[a-zA-Z0-9_]* }

// Unicode-aware:
identifier { (@asciiLetter | $[_$À-￿]) (@asciiLetter | @digit | $[_$À-￿])* }
```

### Numbers (C-like, comprehensive)
```
Number {
  // float
  @digit+ "." @digit* ($[eE] $[+\-]? @digit+)? $[fF]? |
  "." @digit+ ($[eE] $[+\-]? @digit+)? $[fF]? |
  @digit+ $[eE] $[+\-]? @digit+ $[fF]? |
  // hex
  "0x" $[0-9a-fA-F]+ |
  // binary
  "0b" $[01]+ |
  // octal
  "0o" $[0-7]+ |
  // decimal integer
  @digit+ $[uU]?
}
```

### Strings with escape sequences
```
// Separate content/escape tokens (recommended for incremental parsing):
String        { '"' (stringEscape | stringContent)* '"' }
stringContent { !["\\]+ }
stringEscape  { "\\" _ }

// Inline (simpler, fine for most use cases):
String { '"' (!["\\] | "\\" _)* '"' }

// With optional closing quote (tolerates incomplete input):
String { '"' (!["\\] | "\\" _)* '"'? }

// Single-quoted:
String { "'" (!['\\] | "\\" _)* "'"? }
```

### Template literals / interpolated strings
```
@skip {} {
  TemplateString { "`" (templateEscape | templateContent | Interpolation)* templateEnd }
}
@local tokens {
  InterpolationStart[@name="${"] { "${" }
  templateEnd    { "`" }
  templateEscape { "\\" _ }
  @else templateContent
}
Interpolation { InterpolationStart expression "}" }
```

### Line comments
```
LineComment { "//" ![\n]* }   // C-style
LineComment { "#"  ![\n]* }   // Python/shell-style
LineComment { "--" ![\n]* }   // SQL/Haskell-style
LineComment { ";" ![\n]* }    // Lisp-style
```

### Block comments (simple inline)
```
BlockComment { "/*" blockCommentRest }
blockCommentRest { ![*] blockCommentRest | "*" blockCommentAfterStar }
blockCommentAfterStar { "/" | "*" blockCommentAfterStar | ![/*] blockCommentRest }
```

### Block comments (incremental-friendly, split per newline)
Splitting on `\n` lets the incremental parser reuse unchanged lines — preferred for large files:
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

### End-of-file token (for indentation-sensitive languages)
```
@tokens {
  eof { @eof }
}
```

### Preprocessor directives
```
PreprocessorDirective { "#" ![\n]* }
```

---

## Token Precedence

When two patterns could match the same input, declare which wins (earlier = higher priority):
```
@tokens {
  Comment { "//" ![\n]* }
  Divide  { "/" }
  @precedence { Comment, Divide }
}
```
Longest match wins by default. `@precedence` only breaks ties between same-length matches.

---

## Contextual Tokenization: Two Identifier Tokens

When keywords must be valid identifiers in some positions, define two separate tokens with identical patterns. Lezer's contextual tokenizer picks the right one based on parse position:
```
@tokens {
  Identifier   { identChar (identChar | @digit)* }
  PropertyName { identChar (identChar | @digit)* }
  // identical — contextual tokenization picks the right one
}
```
`@specialize` applies to `Identifier` but not `PropertyName`, so `get` is a keyword in statement position but a valid property name otherwise.

---

## Raw Strings / Heredocs

Multi-line strings with dynamic closing delimiters (Python `"""`, Rust `r##"`) cannot be expressed in `@tokens`. Use `@external tokens` — implement the tokenizer in JavaScript, scanning for the matching delimiter manually.
