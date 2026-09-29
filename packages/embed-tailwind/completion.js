const { syntaxTree } = require('@codemirror/language');
const { getTaggedTemplateTagPath, templateContentRanges, docAsInput } = require('@actualwave/codemirror-lang-embed-core');
const { TAILWIND_CLASS_NAMES } = require('./data.js');

// Finds the innermost TemplateString node at `pos` (if any) whose tag is `tw`.
// Mirrors embed-core's getTaggedTemplateTagPath usage in parseMixed, but
// driving a CompletionSource instead of a nested parser — see TODO.md item 6:
// "same tag-name-matching primitive used for parseMixed, just driving
// completions instead of a sub-parser."
function findTwTemplateAt(state, pos) {
  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);
  for (let cur = node; cur; cur = cur.parent) {
    if (cur.name !== 'TemplateString') continue;
    const tagPath = getTaggedTemplateTagPath(cur, docAsInput(state.doc));
    if (tagPath && tagPath.length === 1 && tagPath[0] === 'tw') return cur;
  }
  return null;
}

function isInsideContentRanges(pos, ranges) {
  return ranges.some((r) => pos >= r.from && pos <= r.to);
}

/**
 * A `CompletionSource` (see @codemirror/autocomplete) that suggests Tailwind
 * (twrnc) class names while the cursor is inside a `` tw`...` `` tagged
 * template's literal content, and declines (returns null) everywhere else so
 * normal JS/TSX completions are unaffected.
 */
function tailwindCompletionSource(context) {
  const templateNode = findTwTemplateAt(context.state, context.pos);
  if (!templateNode) return null;

  const ranges = templateContentRanges(templateNode);
  if (!isInsideContentRanges(context.pos, ranges)) return null;

  const word = context.matchBefore(/[^\s`]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const query = word.text;
  const from = word.from;

  // Arbitrary-value bracket syntax (bg-[#123456], p-[13px]) — don't try to
  // complete inside the brackets, just don't offer suggestions there (stretch
  // goal per TODO.md item 6; v1 just avoids breaking on it).
  if (query.includes('[')) return null;

  const options = TAILWIND_CLASS_NAMES.filter((name) => name.startsWith(query)).map((label) => ({
    label,
    type: 'class',
  }));
  if (!options.length) return null;

  return { from, options, validFor: /^[^\s`]*$/ };
}

module.exports = { tailwindCompletionSource, findTwTemplateAt, isInsideContentRanges };
