const { graphqlLanguage } = require('./graphql-language');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

// graphqlLanguage is a trimmed, MIT-attributed copy of cm6-graphql's grammar
// (see graphql-language.js) — a ready-to-use LRLanguage, no factory call
// needed, unlike @codemirror/lang-sql's sql(config).language.
function createEmbedding() {
  return {
    matcher: matchTagName('gql'),
    language: graphqlLanguage,
  };
}

module.exports = { createEmbedding };
