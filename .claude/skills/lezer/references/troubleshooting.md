# Troubleshooting

## Compile Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Unexpected token 'identifier'` at `@specialize` | Old `{ "literal" }` curly-brace syntax | Use `@specialize[...] <token, "literal">` angle brackets |
| `reduce/reduce conflict` between `TypeName` and `PrimaryExpr` | `identifier` appears in both `TypeName` and `PrimaryExpr` | Remove `TypeName` from `PrimaryExpr`; use only `identifier` there |
| `reduce/reduce conflict` (general) | Two rules reduce the same input in the same LR state | Remove one path, or use GLR with matching `~name` markers on both sides |
| `shift/reduce conflict` | Parser can't decide to extend a rule or complete it | Use `~name` markers on both conflicting positions |
| `Too many terms` | More than ~65k terminal + nonterminal names | Reduce the number of named rules/tokens |
| Grammar cycle | A nullable rule that can loop without consuming input | Ensure every rule path consumes at least one token |
| `Cannot find module './syntax.grammar'` at runtime | Grammar not compiled yet | Run `npm run prepare`; check rollup config includes `lezer()` plugin |
| `Unexpected token '{'` at `@specialize` | Same old-syntax issue | Use `<token, literal>` not `token { literal }` |

---

## C-Like Grammar Gotchas

### 1. `identifier` in `TypeName` → reduce/reduce conflict

If `TypeName` has `identifier` as a fallback for user-defined struct types, it creates a reduce/reduce conflict with `PrimaryExpr → identifier` in expression position.

```
// BAD:
TypeName { kw<"float"> | identifier }   // ← identifier causes conflict

// GOOD:
TypeName { kw<"float"> | kw<"int"> /* built-ins only */ }
PrimaryExpr { identifier | Literal | "(" expression ")" }
```

User-defined struct names in declarations match as `identifier` and won't get `t.typeName` highlighting automatically — acceptable for a syntax highlighter.

### 2. `TypeName` in `PrimaryExpr` → same conflict

**Simple fix** (recommended): keep only `identifier` in `PrimaryExpr`. Built-in type constructors like `float4(...)` still work because `float4` is a specialized `identifier` token that matches `PrimaryExpr → identifier`.

**Advanced**: if you need explicit `TypeName` in `PrimaryExpr` (e.g. to highlight constructors differently), use `~tc` GLR markers on both sides of the ambiguity:
```
VarDecl  { qualifier* TypeName ~tc (ArraySuffix)? declaratorList }
PrimaryExpr { identifier | TypeName ~tc | Literal | "(" expression ")" }
```
The parser forks at `TypeName`, resolving when `[` is followed by content consistent with only one interpretation (array declaration vs index access).

### 3. Dangling else

Always add `~else` markers:
```
IfStmt {
  kw<"if"> "(" expression ")" ~else statement
  (~else kw<"else"> statement)?
}
```

### 4. For-loop initializer function call

`for (Type x = foo(…); …)` — after `foo`, the `(` is ambiguous. Fix: keyword-only `TypeName`. Once the parser sees a known type keyword it commits to `VarDecl`, and `(` after the initializer is unambiguously a function call.

### 5. `++`/`--` as both prefix and postfix

Define `unaryOp` (prefix) and `postfixOp` (postfix) as separate token sets to avoid ambiguity, or use `@precedence`.

### 6. `>>` ambiguity (template closer vs right-shift)

Split `>>` into two `>` tokens with a precedence declaration, or use GLR with `~` markers.

### 7. Top-level function declaration vs expression statement

Use `@cut` with a high-precedence `!statement` marker so the parser commits once `function Identifier` is seen:
```
@precedence { ..., statement @cut }
FunctionDeclaration { !statement kw<"function"> Identifier ParamList Block }
```

### 8. `VarDecl` vs `ExprStmt` ambiguity

When `TypeName` is keyword-only, `VarDecl` only starts with a known type keyword. Any statement starting with an unknown identifier can only be an `ExprStmt`. Struct-typed variable declarations (`MyStruct foo;`) won't parse as `VarDecl` — acceptable for syntax highlighting.

---

## Debugging Tips

- Run `npm run prepare 2>&1` — the Rollup + Lezer plugin prints grammar errors inline
- Conflict messages show the exact LR state input (e.g. `TypeName "[" identifier · "]"`) — read the `Shared origin` chain to find which two rule paths collide
- Add `--names` to the CLI build to include term names in the output — makes debugging parse states easier
- Use `testTree` (from `@lezer/generator/dist/test`) in a Node script to interactively check specific inputs without running the full test suite
