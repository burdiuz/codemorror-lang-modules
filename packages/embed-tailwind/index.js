const { tailwindCompletionSource } = require('./completion.js');
const { tailwindHighlightPlugin, tailwindHighlightTheme } = require('./decoration.js');

// Unlike the other embed-* packages (embed-sql/embed-graphql/embed-css/
// embed-sksl), Tailwind has no grammar to parse — `` tw`...` `` content is a
// flat space-separated list of utility class names (see TODO.md item 6: "no
// language structure inside `tw`...` ` to parse... this isn't a parseMixed
// grammar problem like the other DSLs"). So instead of `createEmbedding()`
// (matcher + nested Language for the tag registry), this package exports
// `createSupportExtension(jsLanguageSupport)`, returning plain CM extensions
// (a completion source + a decoration ViewPlugin) to merge into the JS/TSX
// language's `support` array.
function createSupportExtension(jsLanguageSupport) {
  return [
    jsLanguageSupport.language.data.of({ autocomplete: tailwindCompletionSource }),
    tailwindHighlightPlugin,
    tailwindHighlightTheme,
  ];
}

module.exports = { createSupportExtension };
