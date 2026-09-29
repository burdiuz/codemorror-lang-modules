# Highlight API

## `styleTags` — Mapping Nodes to Tags

```typescript
import {styleTags, tags as t} from "@lezer/highlight"

export const myHighlighting = styleTags({
  // Space-separated: apply the same tag to multiple nodes
  "if else for while do return break continue": t.controlKeyword,
  "struct class enum":                          t.definitionKeyword,
  "import export from":                         t.moduleKeyword,
  "const let var":                              t.keyword,
  "in out inout":                               t.modifier,
  "void bool int float double":                 t.typeName,

  // Position-specific paths (Parent/Child syntax):
  "identifier":                                 t.variableName,
  "FunctionDef/identifier":                     t.function(t.definition(t.variableName)),
  "StructDef/identifier":                       t.definition(t.typeName),
  "declarator/identifier":                      t.definition(t.variableName),
  "CallExpression/identifier":                  t.function(t.variableName),
  "MemberExpression/PropertyName":              t.propertyName,

  // Literals:
  "Number Integer Float": t.number,
  "String":               t.string,
  "Escape":               t.escape,
  "Boolean":              t.bool,
  "Null":                 t.null,
  "RegExp":               t.regexp,

  // Comments:
  "LineComment":  t.lineComment,
  "BlockComment": t.blockComment,
  "DocComment":   t.docComment,

  // Misc:
  "PreprocessorDirective": t.processingInstruction,
  "Annotation":            t.annotation,

  // Delimiter literals — use the token text as the key:
  "{ }": t.brace,
  "( )": t.paren,
  "[ ]": t.squareBracket,
  "< >": t.angleBracket,
  "; ,": t.separator,
  ".":   t.derefOperator,

  // Operators:
  "logicalOr logicalAnd": t.logicOperator,
  "eqOp relOp":           t.compareOperator,
  "shiftOp":              t.bitwiseOperator,
  "addOp mulOp":          t.arithmeticOperator,
  "unaryOp":              t.operator,
  "assignOp":             t.definitionOperator,
  "| ^ &":                t.bitwiseOperator,
})
```

---

## Path Selector Syntax

| Selector | Matches |
|----------|---------|
| `"Name"` | Any node named `Name` anywhere in the tree |
| `"A B"` | Both `A` and `B` (space-separated) |
| `"Parent/Child"` | `Child` that is a **direct** child of `Parent` |
| `"Parent/.../Child"` | `Child` **anywhere** inside `Parent` |
| `"Name!"` | `Name` with the `!` flag — reduces highlight opacity (dimmer/secondary) |

---

## All Tags

```typescript
// Comments
t.comment, t.lineComment, t.blockComment, t.docComment

// Names
t.name, t.variableName, t.typeName, t.tagName, t.propertyName
t.className, t.labelName, t.namespace, t.macroName

// Literals
t.literal, t.string, t.docString, t.character, t.attributeValue
t.number, t.integer, t.float, t.bool, t.regexp, t.escape, t.url

// Keywords
t.keyword, t.self, t.null, t.unit, t.modifier, t.operatorKeyword
t.controlKeyword, t.definitionKeyword, t.moduleKeyword

// Operators
t.operator, t.derefOperator, t.arithmeticOperator, t.logicOperator
t.bitwiseOperator, t.compareOperator, t.updateOperator
t.definitionOperator, t.typeOperator, t.controlOperator

// Punctuation
t.punctuation, t.separator, t.bracket
t.angleBracket, t.squareBracket, t.paren, t.brace

// Markup / prose
t.content, t.heading
t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6
t.contentSeparator, t.list, t.quote, t.emphasis, t.strong
t.link, t.monospace, t.strikethrough, t.inserted, t.deleted, t.changed

// Misc
t.invalid, t.meta, t.documentMeta, t.annotation, t.processingInstruction
```

## Tag Modifier Functions

Wrap any tag to add semantic meaning:

```typescript
t.definition(tag)   // the place where something is defined
t.constant(tag)     // a constant value
t.function(tag)     // something called as a function
t.standard(tag)     // part of the language standard library
t.local(tag)        // a scope-local name
```

Examples:
```typescript
t.function(t.variableName)              // function reference
t.function(t.definition(t.variableName)) // function definition
t.definition(t.typeName)                // type being defined
t.constant(t.variableName)              // constant variable
```
