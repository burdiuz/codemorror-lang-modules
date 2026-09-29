const { syntaxTree } = require('@codemirror/language');
const { Decoration, ViewPlugin, EditorView } = require('@codemirror/view');
const { RangeSetBuilder, Prec } = require('@codemirror/state');
const { getTaggedTemplateTagPath, templateContentRanges, docAsInput } = require('@actualwave/codemirror-lang-embed-core');
const { TAILWIND_CLASSES, TAILWIND_CATEGORIES } = require('./data.js');

const TOKEN_RE = /[^\s`]+/g;

const decorationByCategory = new Map(
  TAILWIND_CATEGORIES.map((category) => [category, Decoration.mark({ class: `cm-tw-${category}` })]),
);

// Collects every `tw`-tagged TemplateString's content ranges that intersect
// [from, to) — same tag-matching primitive embed-core uses for parseMixed and
// completion.js uses for the CompletionSource, just driving decoration this
// time (see TODO.md item 6).
function twContentRangesIn(state, from, to) {
  const ranges = [];
  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (node.name !== 'TemplateString') return;
      const tagPath = getTaggedTemplateTagPath(node.node, docAsInput(state.doc));
      if (!tagPath || tagPath.length !== 1 || tagPath[0] !== 'tw') return;
      for (const range of templateContentRanges(node.node)) ranges.push(range);
    },
  });
  return ranges;
}

function buildDecorations(view) {
  const builder = new RangeSetBuilder();
  const seen = [];
  for (const { from, to } of view.visibleRanges) {
    for (const range of twContentRangesIn(view.state, from, to)) {
      seen.push(range);
    }
  }
  // Visible ranges can overlap at chunk boundaries — dedupe by range identity
  // (same node can't produce the same [from,to) twice from disjoint queries,
  // but a template spanning multiple visible chunks could; sort+merge is
  // unnecessary for correctness here since Decoration ranges just need
  // ascending, non-overlapping input, and token matches within one template
  // range never repeat).
  seen.sort((a, b) => a.from - b.from || a.to - b.to);

  const text = view.state.doc;
  for (const { from, to } of seen) {
    const chunk = text.sliceString(from, to);
    TOKEN_RE.lastIndex = 0;
    let match;
    while ((match = TOKEN_RE.exec(chunk))) {
      const token = match[0];
      const category = TAILWIND_CLASSES.get(token);
      if (!category) continue; // unknown/arbitrary-value token — leave undecorated (v1)
      const start = from + match.index;
      builder.add(start, start + token.length, decorationByCategory.get(category));
    }
  }
  return builder.finish();
}

// Mark decorations nest by facet precedence — the higher-precedence one
// becomes the *inner* DOM element (see @codemirror/view's Decoration.mark
// doc comment). @codemirror/language's syntaxHighlighting() wraps its
// treeHighlighter in Prec.high(...), so it paints `.tok-string` as the
// innermost span around the whole `tw`-tagged template content. Without
// out-precedencing that, our per-category `.cm-tw-*` span ends up as the
// *outer* element and `.tok-string`'s own color always wins (an element's
// own matching rule beats an ancestor's color regardless of specificity).
// Prec.highest here makes ours the inner span instead, so it wins.
const tailwindHighlightPlugin = Prec.highest(
  ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = buildDecorations(view);
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations },
  ),
);

// Default category colors. Downstream (react-native-codeditor's editor.html)
// overrides these per active editor theme, the same way _themePackageMap
// remaps @uiw theme exports — see TODO.md item 6's "Category colors need to
// be defined per editor theme... not hardcoded" note. These are just the
// standalone/demo defaults so the plugin isn't inert without that wiring.
const tailwindHighlightTheme = EditorView.baseTheme({
  '.cm-tw-layout': { color: '#569cd6' },
  '.cm-tw-spacing': { color: '#9cdcfe' },
  '.cm-tw-sizing': { color: '#4ec9b0' },
  '.cm-tw-typography': { color: '#c586c0' },
  '.cm-tw-colors': { color: '#ce9178' },
  '.cm-tw-borders': { color: '#d7ba7d' },
  '.cm-tw-effects': { color: '#b5cea8' },
  '.cm-tw-positioning': { color: '#dcdcaa' },
});

module.exports = { tailwindHighlightPlugin, tailwindHighlightTheme };
