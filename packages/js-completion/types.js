// Static knowledge the inference pass needs and that runtime reflection
// can't provide: what a method *returns*. Member *names* are never listed
// here — they come from reflecting the real prototype (see members.js), so they
// always match the JS engine the editor runs in.
//
// Return values are type names, i.e. the name of a global constructor
// ('String', 'Array', ...), or the marker '@this' (returns the receiver's own
// type) / '@arg0' (returns the type of the first argument).

const STRING_RETURNS = {
  String: [
    'at', 'charAt', 'concat', 'normalize', 'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll',
    'slice', 'substr', 'substring', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase',
    'toString', 'toUpperCase', 'toWellFormed', 'trim', 'trimEnd', 'trimLeft', 'trimRight',
    'trimStart', 'valueOf',
  ],
  Number: [
    'charCodeAt', 'codePointAt', 'indexOf', 'lastIndexOf', 'localeCompare', 'search',
  ],
  Boolean: ['endsWith', 'includes', 'isWellFormed', 'startsWith'],
  Array: ['match', 'split'],
};

const ARRAY_RETURNS = {
  Array: [
    'concat', 'copyWithin', 'fill', 'filter', 'flat', 'flatMap', 'map', 'reverse', 'slice', 'sort',
    'splice', 'toReversed', 'toSorted', 'toSpliced', 'with',
  ],
  String: ['join', 'toLocaleString', 'toString'],
  Number: ['findIndex', 'findLastIndex', 'indexOf', 'lastIndexOf', 'push', 'unshift'],
  Boolean: ['every', 'includes', 'some'],
};

function invert(byType) {
  const out = {};
  for (const [type, names] of Object.entries(byType)) {
    for (const name of names) out[name] = type;
  }
  return out;
}

// type -> { methodName: returnType }
const METHOD_RETURNS = {
  String: invert(STRING_RETURNS),
  Array: invert(ARRAY_RETURNS),
  Number: invert({
    String: ['toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toString'],
    Number: ['valueOf'],
  }),
  BigInt: invert({ String: ['toLocaleString', 'toString'], BigInt: ['valueOf'] }),
  Boolean: invert({ String: ['toString'], Boolean: ['valueOf'] }),
  Map: invert({ Map: ['set'], Boolean: ['delete', 'has'] }),
  Set: invert({ Set: ['add'], Boolean: ['delete', 'has'] }),
  WeakMap: invert({ WeakMap: ['set'], Boolean: ['delete', 'has'] }),
  WeakSet: invert({ WeakSet: ['add'], Boolean: ['delete', 'has'] }),
  RegExp: invert({ Boolean: ['test'], Array: ['exec'], String: ['toString'] }),
  Promise: invert({ Promise: ['catch', 'finally', 'then'] }),
  Function: invert({ Function: ['bind'], String: ['toString'] }),
  Error: invert({ String: ['toString'] }),
  URL: invert({ String: ['toJSON', 'toString'] }),
  URLSearchParams: invert({ Boolean: ['has'], String: ['get', 'toString'], Array: ['getAll'] }),
  Object: invert({
    Boolean: ['hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable'],
    String: ['toLocaleString', 'toString'],
  }),
};

// Date has dozens of accessors that follow a naming pattern.
function dateMethodReturn(name) {
  if (/^(get|set)/.test(name) || name === 'valueOf') return 'Number';
  if (/^to.*String$|^toJSON$/.test(name)) return 'String';
  return null;
}

// type -> { propertyName: type } for non-method members.
const PROPERTY_TYPES = {
  String: { length: 'Number' },
  Array: { length: 'Number' },
  Function: { length: 'Number', name: 'String' },
  Map: { size: 'Number' },
  Set: { size: 'Number' },
  RegExp: {
    source: 'String', flags: 'String', lastIndex: 'Number',
    global: 'Boolean', ignoreCase: 'Boolean', multiline: 'Boolean', sticky: 'Boolean',
  },
  Error: { message: 'String', name: 'String', stack: 'String' },
  URL: {
    hash: 'String', host: 'String', hostname: 'String', href: 'String', origin: 'String',
    password: 'String', pathname: 'String', port: 'String', protocol: 'String', search: 'String',
    searchParams: 'URLSearchParams', username: 'String',
  },
};

// Same lookup for members of global namespaces/constructors (`Math.`, `Object.`).
// A '*' key is the fallback for every other member.
const STATIC_RETURNS = {
  Array: { from: 'Array', of: 'Array', isArray: 'Boolean' },
  Object: {
    assign: '@arg0', create: 'Object', entries: 'Array', freeze: '@arg0', fromEntries: 'Object',
    getOwnPropertyNames: 'Array', getOwnPropertySymbols: 'Array', hasOwn: 'Boolean', is: 'Boolean',
    isExtensible: 'Boolean', isFrozen: 'Boolean', isSealed: 'Boolean', keys: 'Array',
    preventExtensions: '@arg0', seal: '@arg0', values: 'Array',
  },
  JSON: { stringify: 'String' },
  Math: { '*': 'Number' },
  Number: {
    isFinite: 'Boolean', isInteger: 'Boolean', isNaN: 'Boolean', isSafeInteger: 'Boolean',
    '*': 'Number',
  },
  String: { fromCharCode: 'String', fromCodePoint: 'String', raw: 'String' },
  Date: { now: 'Number', parse: 'Number', UTC: 'Number' },
  Promise: {
    all: 'Promise', allSettled: 'Promise', any: 'Promise', race: 'Promise', reject: 'Promise',
    resolve: 'Promise', withResolvers: 'Object',
  },
  BigInt: { asIntN: 'BigInt', asUintN: 'BigInt' },
};

// Global functions called without `new`.
const GLOBAL_CALL_RETURNS = {
  Array: 'Array',
  BigInt: 'BigInt',
  Boolean: 'Boolean',
  Number: 'Number',
  Object: 'Object',
  String: 'String',
  decodeURI: 'String',
  decodeURIComponent: 'String',
  encodeURI: 'String',
  encodeURIComponent: 'String',
  fetch: 'Promise',
  isFinite: 'Boolean',
  isNaN: 'Boolean',
  parseFloat: 'Number',
  parseInt: 'Number',
};

// TypeScript keyword types -> runtime type names (for annotations).
const TS_KEYWORD_TYPES = {
  bigint: 'BigInt',
  boolean: 'Boolean',
  number: 'Number',
  object: 'Object',
  string: 'String',
};

// Members that exist on prototypes for historical reasons and are noise.
const HIDDEN_MEMBERS = new Set([
  'constructor', 'caller', 'callee', 'arguments',
  'toSource', 'unwatch', 'watch',
]);

// Own properties of a constructor that aren't useful as `Ctor.` suggestions.
const HIDDEN_STATICS = new Set(['prototype', 'length', 'name', 'caller', 'arguments']);

// Globals suggested (and usable as `Math.`-style receivers) by default.
// Deliberately excludes `window`, `document` and the rest of the browser's
// global surface; pass `globals` to the source to change this.
const DEFAULT_GLOBALS = [
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
  'Math', 'JSON', 'Date', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'Proxy', 'Reflect', 'Intl',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'NaN', 'Infinity', 'undefined',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'queueMicrotask', 'structuredClone', 'console', 'fetch', 'URL', 'URLSearchParams',
];

module.exports = {
  METHOD_RETURNS,
  PROPERTY_TYPES,
  STATIC_RETURNS,
  GLOBAL_CALL_RETURNS,
  TS_KEYWORD_TYPES,
  HIDDEN_MEMBERS,
  HIDDEN_STATICS,
  DEFAULT_GLOBALS,
  dateMethodReturn,
};
