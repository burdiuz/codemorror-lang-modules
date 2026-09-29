const { glslLanguage, glsl } = require('@actualwave/codemirror-lang-glsl');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

function createEmbedding() {
  return {
    matcher: matchTagName('glsl'),
    language: glslLanguage,
    extension: glsl().support,
  };
}

module.exports = { createEmbedding };
