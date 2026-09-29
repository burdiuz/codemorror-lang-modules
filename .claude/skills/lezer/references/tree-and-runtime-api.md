# Tree & Runtime API

## Accessing the Tree (in CodeMirror)

```typescript
import {syntaxTree} from "@codemirror/language"

const tree = syntaxTree(editorState)
const node = tree.resolve(pos, 1)    // node at position, bias right (1) or left (-1)
const node = tree.resolveInner(pos)  // enters overlaid/mounted trees too
```

---

## `SyntaxNode` — Convenient Access

```typescript
node.name          // string — node type name
node.type          // NodeType
node.from          // start position (inclusive)
node.to            // end position (exclusive)

// Navigation (all return SyntaxNode | null):
node.parent
node.firstChild
node.lastChild
node.nextSibling
node.prevSibling

// Position-based:
node.childAfter(pos)          // first child ending after pos
node.childBefore(pos)         // last child starting before pos
node.resolve(pos, side)       // innermost node at pos (side: -1 | 0 | 1)

// By type name or @isGroup name:
node.getChild("TypeName")              // first child of that type/group
node.getChildren("Statement")          // all children of that type/group
// With before/after constraints:
node.getChild("Expression", "=", null) // first Expression after "=" sibling
node.getChild("Identifier", null, "(") // first Identifier before "(" sibling

// Read a node prop:
node.prop(NodeProp.closedBy)    // string[] | undefined

// Create cursor at this node:
node.cursor()
```

---

## `TreeCursor` — Efficient Bulk Iteration

Use instead of `SyntaxNode` navigation when visiting many nodes — no per-node allocation.

```typescript
const cursor = tree.cursor()
// or start at position:
const cursor = tree.cursorAt(pos, 1)

// Movement (all return boolean — false if can't move):
cursor.firstChild()
cursor.lastChild()
cursor.parent()
cursor.nextSibling()
cursor.prevSibling()
cursor.next()     // pre-order: first child → next sibling → parent's next sibling
cursor.prev()     // reverse pre-order

// State:
cursor.name       // string
cursor.type       // NodeType
cursor.from
cursor.to

// Full traversal:
do {
  console.log(cursor.name, cursor.from, cursor.to)
} while (cursor.next())

// Subtree traversal with callbacks:
cursor.iterate(
  node => {
    if (node.name === "String") return false  // false = skip children
  },
  node => { /* leave */ }
)

// Test ancestors:
cursor.matchContext(["Block", "IfStatement"])  // true if direct parents match
```

---

## `Tree.iterate` — Walk Without a Cursor

```typescript
tree.iterate({
  enter(node) {    // node is SyntaxNodeRef (name, from, to, type)
    if (node.name === "FunctionDef") {
      console.log("function at", node.from)
      return false   // skip this node's children
    }
  },
  leave(node) { },
  from: 0,           // only visit nodes overlapping this range
  to: doc.length,
})
```

---

## `ExternalTokenizer` API

```typescript
import {ExternalTokenizer} from "@lezer/lr"
import {myToken} from "./syntax.grammar.terms"

export const myTokenizer = new ExternalTokenizer((input, stack) => {
  // input.next              — char code at current position (-1 = EOF)
  // input.pos               — absolute current position
  // input.peek(offset)      — char code at offset from current; peek(0) == next
  // input.advance(n = 1)    — move forward n chars, returns new input.next
  // input.acceptToken(id, endOffset = 0)  — emit token; end = pos + endOffset
  // input.acceptTokenTo(id, absPos)       — emit token ending at absolute pos

  // stack.pos               — input position parsed up to
  // stack.context           — current ContextTracker value
  // stack.canShift(term)    — true if term can be shifted right now
  // stack.dialectEnabled(id) — true if dialect is active

  if (input.next === 10 /* \n */) {
    input.acceptToken(myToken)
  }
}, {
  contextual: false,   // true = re-run at every position (no caching)
  fallback: false,     // true = run after another tokenizer already matched
  extend: false,       // true = don't stop after accepting a token
})
```

---

## `ContextTracker` API

```typescript
import {ContextTracker} from "@lezer/lr"

class MyContext {
  constructor(readonly depth: number, readonly parent: MyContext | null) {
    this.hash = depth ^ (parent?.hash ?? 0)
  }
  hash: number
}

export const myTracker = new ContextTracker<MyContext>({
  start: new MyContext(0, null),

  // Called on every token shift — return same or new context:
  shift(context, term, stack, input) {
    return context
  },

  // Called on rule reductions (optional):
  reduce(context, term, stack, input) {
    return context
  },

  // Called when reusing a cached node (optional):
  reuse(context, node, stack, input) {
    return context
  },

  hash: ctx => ctx.hash,
  strict: false,    // false = allow context mismatch on cache reuse
})
```

Context values must be **immutable** — always return a new object instead of mutating.
