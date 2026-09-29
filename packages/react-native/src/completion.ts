import {syntaxTree} from "@codemirror/language"
import type {CompletionContext, CompletionResult, CompletionSource} from "@codemirror/autocomplete"
import {BUILTIN_MODULES, STYLE_PROPERTIES, type ModuleRegistry} from "./data"
import {collectImports, findImportDeclaration, getImportSource, getImportGroupNames} from "./imports"
import {classifyJsxContext, getTagName, findStyleObjectContext, classifyStylePosition, getExistingStyleKeys} from "./jsx"

export interface ReactNativeCompletionConfig {
  // Merged on top of BUILTIN_MODULES (react, react-native) — use this to add
  // completion data for other packages a specific project uses, e.g.
  // expo-image or react-native-safe-area-context.
  modules?: ModuleRegistry
  // Callee text (e.g. "StyleSheet.create") whose sole object argument's
  // per-key values should be treated as RN style dictionaries. Defaults to
  // ["StyleSheet.create"]; pass additional entries for aliased imports
  // (e.g. import { StyleSheet as RNStyleSheet } doesn't change the callee
  // text seen here, but a local helper wrapping StyleSheet.create would).
  styleFactories?: string[]
}

function mergeModules(config?: ReactNativeCompletionConfig): ModuleRegistry {
  if (!config?.modules) return BUILTIN_MODULES
  return {...BUILTIN_MODULES, ...config.modules}
}

function resolveEntry(modules: ModuleRegistry, source: string, localName: string, imported: string) {
  const moduleExports = modules[source]
  if (!moduleExports) return null
  const exportedName = imported === "default" || imported === "*" ? localName : imported
  const entry = moduleExports[exportedName]
  return entry ? {entry, exportedName} : null
}

const IDENTIFIER_WORD = /[A-Za-z_$][\w$]*$/
const MODULE_SPECIFIER_WORD = /[\w@/.-]*$/
const STYLE_VALUE_WORD = /[\w-]*$/

function completeImportModuleSpecifier(context: CompletionContext, modules: ModuleRegistry): CompletionResult | null {
  const word = context.matchBefore(MODULE_SPECIFIER_WORD)
  const from = word ? word.from : context.pos
  const options = Object.keys(modules).map((name) => ({label: name, type: "namespace" as const}))
  return {from, options, validFor: MODULE_SPECIFIER_WORD}
}

function completeImportSymbols(
  context: CompletionContext,
  importDecl: import("@lezer/common").SyntaxNode,
  modules: ModuleRegistry,
): CompletionResult | null {
  const source = getImportSource(context.state, importDecl)
  if (!source) return null
  const moduleExports = modules[source]
  if (!moduleExports) return null

  const alreadyImported = getImportGroupNames(context.state, importDecl)
  const word = context.matchBefore(IDENTIFIER_WORD)
  const from = word ? word.from : context.pos

  const options = Object.entries(moduleExports)
    .filter(([name]) => !alreadyImported.has(name))
    .map(([name, entry]) => ({
      label: name,
      type: entry.type === "function" ? "function" : entry.type === "type" ? "class" : "variable",
      detail: entry.detail || source,
    }))
  if (!options.length) return null
  return {from, options, validFor: /^[\w$]*$/}
}

function completeStyleProperty(context: CompletionContext, styleFactories: string[]): CompletionResult | null {
  const objectExpression = findStyleObjectContext(context.state, context.pos, styleFactories)
  if (!objectExpression) return null

  const position = classifyStylePosition(context.state, context.pos, objectExpression)

  if (position.kind === "value") {
    const values = position.propertyName ? STYLE_PROPERTIES[position.propertyName] : undefined
    if (!values) return null
    const valueNode = position.property?.getChild("String")
    const insideString = !!valueNode && context.pos > valueNode.from && context.pos <= valueNode.to
    const word = context.matchBefore(STYLE_VALUE_WORD)
    const from = word ? word.from : context.pos
    const options = insideString
      ? values.map((v) => ({label: v, type: "constant" as const}))
      : values.map((v) => ({label: v, type: "constant" as const, apply: `'${v}'`}))
    return {from, options, validFor: STYLE_VALUE_WORD}
  }

  const existing = getExistingStyleKeys(context.state, objectExpression)
  const word = context.matchBefore(IDENTIFIER_WORD)
  const from = word ? word.from : context.pos
  const options = Object.keys(STYLE_PROPERTIES)
    .filter((name) => !existing.has(name))
    .map((name) => ({label: name, type: "property" as const}))
  return {from, options, validFor: /^[\w$]*$/}
}

/**
 * Builds the React/React Native contextual CompletionSource: import-scoped
 * hook/component/prop suggestions, JSX tag-name and attribute-name
 * completion, RN style dictionary property/value completion (inside
 * `style={{ }}` or `StyleSheet.create({ ... })`), and import statement
 * completion (module specifiers, then that module's exports).
 *
 * Nothing from `modules` is ever suggested as a hook/component/prop unless
 * its local name is actually present in the current document's own import
 * statements — this is the scoping rule the completion source is built
 * around, not an incidental detail.
 */
export function reactNativeCompletionSource(config?: ReactNativeCompletionConfig): CompletionSource {
  const modules = mergeModules(config)
  const styleFactories = config?.styleFactories?.length
    ? [...new Set([...config.styleFactories, "StyleSheet.create"])]
    : ["StyleSheet.create"]

  return (context: CompletionContext): CompletionResult | null => {
    const {state, pos} = context
    const tree = syntaxTree(state)
    const node = tree.resolveInner(pos, -1)

    const importDecl = findImportDeclaration(node)
    if (importDecl) {
      const stringNode = importDecl.getChild("String")
      if (stringNode && pos >= stringNode.from && pos <= stringNode.to) {
        return completeImportModuleSpecifier(context, modules)
      }
      if (importDecl.getChild("ImportGroup")) {
        return completeImportSymbols(context, importDecl, modules)
      }
    }

    const styleResult = completeStyleProperty(context, styleFactories)
    if (styleResult) return styleResult

    const imports = collectImports(state)
    if (imports.size === 0) return null

    const jsxContext = classifyJsxContext(state, pos)

    if (jsxContext && jsxContext.kind === "tag-name") {
      const word = context.matchBefore(IDENTIFIER_WORD)
      const from = word ? word.from : pos
      const options: {label: string; type: string; detail?: string}[] = []
      for (const [localName, importInfo] of imports) {
        const found = resolveEntry(modules, importInfo.source, localName, importInfo.imported)
        if (found && found.entry.type === "type") {
          options.push({label: localName, type: "class", detail: found.entry.detail || importInfo.source})
        }
      }
      if (!options.length) return null
      return {from, options, validFor: /^[\w$]*$/}
    }

    if (jsxContext && jsxContext.kind === "attribute-name") {
      const tagName = getTagName(state, jsxContext.openTag)
      if (!tagName) return null
      const importInfo = imports.get(tagName)
      if (!importInfo) return null
      const found = resolveEntry(modules, importInfo.source, tagName, importInfo.imported)
      if (!found || !found.entry.props) return null
      const word = context.matchBefore(IDENTIFIER_WORD)
      const from = word ? word.from : pos
      const options = found.entry.props.map((prop) => ({label: prop, type: "property"}))
      return {from, options, validFor: /^[\w$]*$/}
    }

    // General scope: offer every imported hook/variable/component by name,
    // e.g. `useSta|` outside any JSX.
    const word = context.matchBefore(IDENTIFIER_WORD)
    if (!word || (word.from === word.to && !context.explicit)) return null

    const options: {label: string; type: string; detail?: string}[] = []
    for (const [localName, importInfo] of imports) {
      const found = resolveEntry(modules, importInfo.source, localName, importInfo.imported)
      if (!found) continue
      options.push({
        label: localName,
        type: found.entry.type === "function" ? "function" : found.entry.type === "type" ? "class" : "variable",
        detail: found.entry.detail || importInfo.source,
      })
    }
    if (!options.length) return null
    return {from: word.from, options, validFor: /^[\w$]*$/}
  }
}
