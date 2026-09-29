import {syntaxTree} from "@codemirror/language"
import type {EditorState} from "@codemirror/state"
import type {SyntaxNode} from "@lezer/common"

export type JsxContext =
  | {kind: "tag-name"; openTag: SyntaxNode}
  | {kind: "attribute-name"; openTag: SyntaxNode}

// Classifies the cursor position relative to the nearest enclosing JSX tag,
// if any: 'tag-name' when completing the element name itself (right after
// `<` or `</`), 'attribute-name' when inside an open tag's attribute list,
// otherwise null (plain expression/statement context).
export function classifyJsxContext(state: EditorState, pos: number): JsxContext | null {
  const tree = syntaxTree(state)
  const node = tree.resolveInner(pos, -1)

  for (let cur: SyntaxNode | null = node; cur; cur = cur.parent) {
    if (cur.name === "JSXOpenTag" || cur.name === "JSXSelfClosingTag" || cur.name === "JSXStartTag") {
      const openTag = cur.name === "JSXStartTag" ? cur.parent : cur
      if (!openTag) break
      const tagIdentifier = openTag.getChild("JSXIdentifier")
      // Inside the tag name itself (cursor within/immediately after it, and
      // no attribute has started yet).
      if (tagIdentifier && pos <= tagIdentifier.to && pos >= tagIdentifier.from) {
        return {kind: "tag-name", openTag}
      }
      if (tagIdentifier && pos < tagIdentifier.from) {
        return {kind: "tag-name", openTag}
      }
      return {kind: "attribute-name", openTag}
    }
    if (cur.name === "JSXAttribute") {
      const openTag = cur.parent
      if (openTag) return {kind: "attribute-name", openTag}
    }
    // Anything further out than the element itself is a normal
    // expression/statement context, not a tag we're inside.
    if (cur.name === "JSXElement" || cur.name === "JSXFragment") break
  }

  return null
}

export function getTagName(state: EditorState, openTag: SyntaxNode): string | null {
  const identifier = openTag.getChild("JSXIdentifier")
  if (!identifier) return null
  return state.doc.sliceString(identifier.from, identifier.to)
}

export interface StylePropertyPosition {
  kind: "name" | "value"
  // The enclosing style ObjectExpression — used to read existing keys when
  // completing a name, so already-set properties aren't re-suggested.
  objectExpression: SyntaxNode
  // Set only for kind: "value" — the Property node whose value is being
  // completed, so the property's own name can be looked up.
  property?: SyntaxNode
  propertyName?: string
}

const DEFAULT_STYLE_FACTORIES = ["StyleSheet.create"]

function calleeText(state: EditorState, call: SyntaxNode): string | null {
  const callee = call.firstChild
  if (!callee) return null
  return state.doc.sliceString(callee.from, callee.to)
}

// Detects whether the cursor sits inside a React Native style dictionary:
// either a JSX `style={{ ... }}` attribute value, or one of the per-key
// objects passed to `StyleSheet.create({ ... })` (or an equivalent factory
// name supplied via `styleFactories`). Only the *nearest* enclosing
// ObjectExpression is considered — the outer object passed to
// StyleSheet.create has arbitrary developer-chosen keys (its values are the
// actual style dicts), not style property names itself.
export function findStyleObjectContext(
  state: EditorState,
  pos: number,
  styleFactories: string[] = DEFAULT_STYLE_FACTORIES,
): SyntaxNode | null {
  const tree = syntaxTree(state)

  for (let cur: SyntaxNode | null = tree.resolveInner(pos, -1); cur; cur = cur.parent) {
    if (cur.name !== "ObjectExpression") continue

    const parent = cur.parent
    if (parent && parent.name === "JSXEscape") {
      const attr = parent.parent
      if (attr && attr.name === "JSXAttribute") {
        const idNode = attr.getChild("JSXIdentifier")
        if (idNode && state.doc.sliceString(idNode.from, idNode.to) === "style") {
          return cur
        }
      }
    }

    // Nested inside `<factory>({ key: { ← here } })`.
    if (parent && parent.name === "Property") {
      const outerObject = parent.parent
      if (outerObject && outerObject.name === "ObjectExpression") {
        const argList = outerObject.parent
        if (argList && argList.name === "ArgList") {
          const call = argList.parent
          if (call && call.name === "CallExpression") {
            const text = calleeText(state, call)
            if (text && styleFactories.includes(text)) return cur
          }
        }
      }
    }

    // Only the nearest enclosing ObjectExpression is ever a candidate.
    break
  }

  return null
}

export function classifyStylePosition(state: EditorState, pos: number, objectExpression: SyntaxNode): StylePropertyPosition {
  for (const property of objectExpression.getChildren("Property")) {
    if (pos < property.from || pos > property.to) continue
    const colon = property.getChild(":")
    const propDef = property.getChild("PropertyDefinition")
    const propertyName = propDef ? state.doc.sliceString(propDef.from, propDef.to) : undefined
    if (colon && pos > colon.to) {
      return {kind: "value", objectExpression, property, propertyName}
    }
    return {kind: "name", objectExpression, property}
  }
  return {kind: "name", objectExpression}
}

export function getExistingStyleKeys(state: EditorState, objectExpression: SyntaxNode): Set<string> {
  const keys = new Set<string>()
  for (const property of objectExpression.getChildren("Property")) {
    const propDef = property.getChild("PropertyDefinition")
    if (propDef) keys.add(state.doc.sliceString(propDef.from, propDef.to))
  }
  return keys
}
