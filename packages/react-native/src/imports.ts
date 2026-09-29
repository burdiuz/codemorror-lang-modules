import {syntaxTree} from "@codemirror/language"
import type {EditorState} from "@codemirror/state"
import type {SyntaxNode} from "@lezer/common"

export interface ImportInfo {
  source: string
  // The name as exported by the module — "default" for a default import,
  // "*" for a namespace import, or the actual named export otherwise.
  imported: string
}

// Walks every ImportDeclaration in the document and builds
// Map<localName, ImportInfo>. This is the scoping mechanism completion.ts
// relies on: nothing curated is ever suggested unless its local name is
// actually present here for the current document.
export function collectImports(state: EditorState): Map<string, ImportInfo> {
  const imports = new Map<string, ImportInfo>()
  const doc = state.doc
  const tree = syntaxTree(state)

  tree.iterate({
    enter(node) {
      if (node.name !== "ImportDeclaration") return

      const stringNode = node.node.getChild("String")
      if (!stringNode) return
      const raw = doc.sliceString(stringNode.from, stringNode.to)
      const source = raw.slice(1, -1)

      // Default import: `import Foo from '...'` — a VariableDefinition
      // directly under ImportDeclaration (not nested in an ImportGroup).
      for (const child of node.node.getChildren("VariableDefinition")) {
        imports.set(doc.sliceString(child.from, child.to), {source, imported: "default"})
      }

      // Namespace import: `import * as Foo from '...'`.
      if (node.node.getChild("Star")) {
        const varDef = node.node.getChild("VariableDefinition")
        if (varDef) imports.set(doc.sliceString(varDef.from, varDef.to), {source, imported: "*"})
      }

      // Named imports: `import { a, b as c } from '...'`, nested inside an
      // ImportGroup child.
      const group = node.node.getChild("ImportGroup")
      if (!group) return
      for (const child of group.getChildren("VariableDefinition")) {
        // A VariableDefinition directly inside ImportGroup with no sibling
        // VariableName means no alias — local name === imported name.
        const name = doc.sliceString(child.from, child.to)
        imports.set(name, {source, imported: name})
      }
      for (const varName of group.getChildren("VariableName")) {
        // `VariableName as VariableDefinition` — the alias pair.
        const parent = varName.parent
        if (!parent) continue
        const aliasDef = parent.getChildren("VariableDefinition").find((d: SyntaxNode) => d.from > varName.to)
        if (!aliasDef) continue
        imports.set(doc.sliceString(aliasDef.from, aliasDef.to), {
          source,
          imported: doc.sliceString(varName.from, varName.to),
        })
      }
    },
  })

  return imports
}

// Finds the nearest enclosing ImportDeclaration, if any — used by the import
// module-specifier and named-symbol completions, which both need the
// declaration's own source string regardless of where inside it the cursor
// currently sits.
export function findImportDeclaration(node: SyntaxNode | null): SyntaxNode | null {
  for (let cur = node; cur; cur = cur.parent) {
    if (cur.name === "ImportDeclaration") return cur
  }
  return null
}

export function getImportSource(state: EditorState, importDecl: SyntaxNode): string | null {
  const stringNode = importDecl.getChild("String")
  if (!stringNode) return null
  const raw = state.doc.sliceString(stringNode.from, stringNode.to)
  return raw.slice(1, -1)
}

// Local/imported names already listed in this ImportDeclaration's own
// ImportGroup, so the named-symbol completion doesn't re-suggest something
// the statement already imports.
export function getImportGroupNames(state: EditorState, importDecl: SyntaxNode): Set<string> {
  const names = new Set<string>()
  const group = importDecl.getChild("ImportGroup")
  if (!group) return names
  for (const child of group.getChildren("VariableDefinition")) {
    names.add(state.doc.sliceString(child.from, child.to))
  }
  for (const varName of group.getChildren("VariableName")) {
    names.add(state.doc.sliceString(varName.from, varName.to))
  }
  return names
}
