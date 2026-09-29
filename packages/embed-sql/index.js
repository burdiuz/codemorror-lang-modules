const { sql } = require('@codemirror/lang-sql');
const { matchTagName } = require('@actualwave/codemirror-lang-embed-core');

// config is passed through to @codemirror/lang-sql's sql() (dialect, schema,
// etc.) — see that package's SQLConfig type. sql()'s `.support` always
// includes keyword completion (schema completion is additive on top, only if
// config.schema is given) — see SQLConfig in @codemirror/lang-sql source.
function createEmbedding(config) {
  const support = sql(config);
  return {
    matcher: matchTagName('sql'),
    language: support.language,
    extension: support.support,
  };
}

module.exports = { createEmbedding };
