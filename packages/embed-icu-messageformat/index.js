const { icuMessageFormatLanguage, icuMessageFormat } = require('@actualwave/codemirror-lang-icu-messageformat');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

function createEmbedding() {
  return {
    matcher: matchTagName('t'),
    language: icuMessageFormatLanguage,
    extension: icuMessageFormat().support,
  };
}

module.exports = { createEmbedding };
