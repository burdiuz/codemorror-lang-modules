# Conflict Resolution

LR parsers fail on ambiguous grammars. The generator throws on all conflicts — both shift/reduce and reduce/reduce. They must all be resolved explicitly.

## Types of Conflicts

- **Reduce/reduce**: two different rules can reduce the same input in the same LR state
- **Shift/reduce**: parser can't decide whether to extend the current rule or complete it

---

## `~name` — Conflict Markers

Mark both sides of a known, acceptable ambiguity with the same name. Lezer resolves it without error. Default resolution: **shift** for shift/reduce, **first rule** for reduce/reduce.

### Dangling else (shift/reduce)
```
IfStmt {
  kw<"if"> "(" expression ")" ~else statement
  (~else kw<"else"> statement)?
}
```
Both `~else` positions suppress the conflict. Resolution: shift (else binds to innermost if).

### GLR splitting (both parses continue in parallel)
When two rules are genuinely ambiguous until more context is seen:
```
ArrayExpr    { "[" commaSep<expression> ~destructure "]" }
ArrayPattern { "[" commaSep<pattern>    ~destructure "]" }
```
Lezer keeps both parse branches alive past `[`, resolving when the contents differ.

---

## `!name` — Inline Precedence

Marks which `@precedence` level applies at a specific position:
```
@precedence { times @left, plus @left, rel @left }

BinaryExpr {
  expression !times mulOp expression |
  expression !plus  addOp expression |
  expression !rel   relOp expression
}
```
`times` before `plus` means `*` binds tighter than `+`. Prevents `a + b * c` → `(a+b)*c`.

---

## `@cut` in `@precedence`

Commits the parser to the current rule when it passes the `!name` marker — discards all competing parse states. Use to distinguish declarations from expressions:

```
@precedence { ..., statement @cut }

FunctionDeclaration { !statement kw<"function"> Identifier ParamList Block }
```
Once `function` is seen and `!statement` is passed, the parser cannot backtrack to a function expression.

---

## Token Precedence (inside `@tokens`)

When two token patterns could match the same input, declare which wins:
```
@tokens {
  Comment { "//" ![\n]* }
  Divide  { "/" }
  @precedence { Comment, Divide }
}
```
Longest match wins by default. `@precedence` only breaks ties between same-length matches.

---

## The Most Common Conflicts

### reduce/reduce: `TypeName` vs `identifier` in `PrimaryExpr`

**Cause**: `TypeName` has `identifier` as a fallback for user-defined struct types, and `PrimaryExpr` also has `identifier`. Both can reduce the same input in expression position.

**Fix**: Remove `identifier` from `TypeName` (built-in types only) AND remove `TypeName` from `PrimaryExpr`. Use only `identifier` in `PrimaryExpr` — built-in type keywords (e.g. `float4`) are specialized identifier tokens and still match.

```
// BAD:
TypeName   { kw<"float"> | kw<"int"> | identifier }   // ← identifier here causes conflict
PrimaryExpr{ identifier | TypeName | Literal | "(" expression ")" }

// GOOD:
TypeName   { kw<"float"> | kw<"int"> }   // built-ins only
PrimaryExpr{ identifier | Literal | "(" expression ")" }
```

### shift/reduce: dangling else

Always use `~else` markers — see above.

### shift/reduce: for-loop initializer function call

`for (Type x = foo(…); …)` — after `foo`, the `(` is ambiguous: is it a function call or the start of the loop condition?

**Fix**: make `TypeName` keyword-only. The parser commits to `VarDecl` once it sees a known type keyword, so `(` after the initializer expression is unambiguously a function call.
