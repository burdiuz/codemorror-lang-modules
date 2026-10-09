import {EditorView} from '@codemirror/view'
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language'
import {tags as t} from '@lezer/highlight'

// All colors come from CSS variables defined in index.html, so the editor
// follows the page's light/dark switch (prefers-color-scheme or data-theme)
// without reconfiguring CodeMirror.
const editorTheme = EditorView.theme({
  '&': {
    color: 'var(--text)',
    backgroundColor: 'var(--panel)',
  },
  '.cm-content': {caretColor: 'var(--text)'},
  '.cm-cursor, .cm-dropCursor': {borderLeftColor: 'var(--text)'},
  '&.cm-focused': {outline: 'none'},
  '.cm-gutters': {
    backgroundColor: 'var(--panel)',
    color: 'var(--muted)',
    border: 'none',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLine': {backgroundColor: 'var(--active-line)'},
  '.cm-activeLineGutter': {backgroundColor: 'var(--active-line)', color: 'var(--text)'},
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    {backgroundColor: 'var(--selection)'},
  '.cm-selectionMatch': {backgroundColor: 'var(--selection-match)'},
  '&.cm-focused .cm-matchingBracket': {backgroundColor: 'var(--selection-match)', outline: '1px solid var(--border)'},
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
  },

  // Panels & search
  '.cm-panels': {backgroundColor: 'var(--panel)', color: 'var(--text)'},
  '.cm-panels.cm-panels-top': {borderBottom: '1px solid var(--border)'},
  '.cm-panels.cm-panels-bottom': {borderTop: '1px solid var(--border)'},
  '.cm-textfield': {
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  '.cm-button': {
    backgroundImage: 'none',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  '.cm-searchMatch': {backgroundColor: 'var(--selection-match)'},
  '.cm-searchMatch-selected': {backgroundColor: 'var(--selection)'},

  // Tooltips & autocompletion
  '.cm-tooltip': {
    backgroundColor: 'var(--panel)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12.5px',
    maxHeight: '16em',
  },
  '.cm-tooltip-autocomplete > ul > li': {padding: '2px 10px', lineHeight: '1.6'},
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
  },
  '.cm-completionMatchedText': {textDecoration: 'none', fontWeight: '700', color: 'var(--accent)'},
  '.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionMatchedText': {color: 'inherit'},
  '.cm-completionDetail': {color: 'var(--muted)', fontStyle: 'normal', marginLeft: '0.8em'},
  '.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail': {color: 'inherit', opacity: 0.8},
  '.cm-completionIcon': {opacity: 0.7},
  '.cm-tooltip.cm-completionInfo': {padding: '6px 10px'},
})

const highlightStyle = HighlightStyle.define([
  {tag: [t.keyword, t.operatorKeyword, t.modifier], color: 'var(--syn-keyword)'},
  {tag: [t.controlKeyword, t.moduleKeyword], color: 'var(--syn-keyword)'},
  {tag: [t.name, t.deleted, t.character, t.macroName], color: 'var(--text)'},
  {tag: [t.variableName, t.propertyName], color: 'var(--syn-variable)'},
  {tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: 'var(--syn-function)'},
  {tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: 'var(--syn-definition)'},
  {tag: [t.typeName, t.className, t.namespace], color: 'var(--syn-type)'},
  {tag: [t.number, t.bool, t.null, t.atom, t.self], color: 'var(--syn-number)'},
  {tag: [t.string, t.special(t.string), t.regexp, t.inserted], color: 'var(--syn-string)'},
  {tag: [t.color, t.constant(t.name), t.standard(t.name)], color: 'var(--syn-number)'},
  {tag: [t.operator, t.punctuation, t.separator, t.bracket], color: 'var(--syn-punct)'},
  {tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--muted)', fontStyle: 'italic'},
  {tag: [t.tagName, t.angleBracket], color: 'var(--syn-tag)'},
  {tag: t.attributeName, color: 'var(--syn-function)'},
  {tag: [t.meta, t.processingInstruction], color: 'var(--syn-punct)'},
  {tag: t.invalid, color: 'var(--syn-invalid)'},
  {tag: t.heading, fontWeight: 'bold'},
  {tag: t.emphasis, fontStyle: 'italic'},
  {tag: t.strong, fontWeight: 'bold'},
])

export const demoTheme = [editorTheme, syntaxHighlighting(highlightStyle)]
