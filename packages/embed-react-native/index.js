const { reactNativeCompletionSource } = require('@actualwave/codemirror-lang-react-native');

// Like embed-tailwind, this DSL has no grammar to parse — React/React Native
// contextual completion is layered entirely on the existing JS/JSX parser via
// a CompletionSource, so this package exports `createSupportExtension`
// (plain CM extensions to merge into the JS/TSX language's `support` array)
// rather than `createEmbedding()` (matcher + nested Language).
function createSupportExtension(jsLanguageSupport, config) {
  return jsLanguageSupport.language.data.of({
    autocomplete: reactNativeCompletionSource(config),
  });
}

module.exports = { createSupportExtension };
