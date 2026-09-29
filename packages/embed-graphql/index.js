const { graphqlLanguage } = require('cm6-graphql');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

// cm6-graphql exports a ready-to-use LRLanguage (graphqlLanguage) directly —
// no factory call needed, unlike @codemirror/lang-sql's sql(config).language.
function createEmbedding() {
  return {
    matcher: matchTagName('gql'),
    language: graphqlLanguage,
  };
}

module.exports = { createEmbedding };
