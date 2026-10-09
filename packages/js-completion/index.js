const { jsCompletionSource, resolveScope } = require('./completion.js');
const { DEFAULT_GLOBALS } = require('./types.js');

// Like embed-tailwind and embed-react-native, there is no grammar here: the
// completions are layered on the existing JS parser. The source is attached to
// `jsLanguageSupport.language`, so pass the same support whose `language` the
// editor uses (the one returned by embedTaggedTemplates, when embedding).
function createSupportExtension(jsLanguageSupport, config) {
  return jsLanguageSupport.language.data.of({
    autocomplete: jsCompletionSource(config),
  });
}

module.exports = { createSupportExtension, jsCompletionSource, resolveScope, DEFAULT_GLOBALS };
