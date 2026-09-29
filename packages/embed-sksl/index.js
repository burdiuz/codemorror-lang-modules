const { skslLanguage, sksl } = require('@actualwave/codemirror-lang-sksl');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

// @actualwave/codemirror-lang-sksl exports a ready-to-use LRLanguage
// (skslLanguage) directly, same shape as cm6-graphql's graphqlLanguage — no
// factory call needed for the grammar itself. This is the same grammar the
// `.sksl` file mode uses; see SINGLE_FILE_PROTOTYPES.md's "Relationship to
// .sksl files" section. The sksl() factory's `.support` carries the
// completion source, so it's still called for that.
function createEmbedding() {
  return {
    matcher: matchTagName('sksl'),
    language: skslLanguage,
    extension: sksl().support,
  };
}

module.exports = { createEmbedding };
