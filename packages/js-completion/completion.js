const { syntaxTree } = require('@codemirror/language');
const { DEFAULT_GLOBALS } = require('./types.js');
const { createContext, inferNode } = require('./infer.js');
const { membersOf } = require('./members.js');

const IDENT = /^[\w$\xa1-￿][\w$\d\xa1-￿]*$/;

// Nodes in which neither names nor members are completed. Mirrors the list
// @codemirror/lang-javascript uses for its own sources.
const DONT_COMPLETE = new Set([
  'TemplateString', 'String', 'RegExp',
  'LineComment', 'BlockComment',
  'VariableDefinition', 'TypeDefinition', 'Label',
  'PropertyDefinition', 'PropertyName',
  'PrivatePropertyDefinition', 'PrivatePropertyName',
  'JSXText', 'JSXAttributeValue', 'JSXOpenTag', 'JSXCloseTag', 'JSXSelfClosingTag',
  '.', '?.',
]);

// `globals` is either a list of global names to expose (read off globalThis, absent
// ones are skipped) or a ready-made scope object ({ name: value }).
function resolveScope(globals) {
  const source = globals == null ? DEFAULT_GLOBALS : globals;
  if (!Array.isArray(source)) return source;
  const scope = {};
  for (const name of source) {
    if (name in globalThis) scope[name] = globalThis[name];
  }
  return scope;
}

function globalOptions(scope) {
  return Object.keys(scope).map((label) => {
    const value = scope[label];
    let type = 'variable';
    if (typeof value === 'function') type = /^[A-Z]/.test(label) ? 'class' : 'function';
    return { label, type };
  });
}

// Finds the MemberExpression whose property is being typed, and where the typed
// name starts. Handles `a.|`, `a.b|`, and `a?.b|`.
function memberContext(inner, pos) {
  if (inner.name === 'PropertyName' && inner.parent && inner.parent.name === 'MemberExpression') {
    return { member: inner.parent, from: inner.from };
  }
  if ((inner.name === '.' || inner.name === '?.') && inner.parent && inner.parent.name === 'MemberExpression') {
    return { member: inner.parent, from: pos };
  }
  if (inner.name === 'MemberExpression') return { member: inner, from: pos };
  return null;
}

/**
 * A `CompletionSource` for plain JavaScript that suggests:
 *  - after a `.`, the members of whatever the receiver is inferred to be
 *    (strings, arrays, numbers, Map/Set/Date/Promise/..., object literals, classes
 *    declared in the file, `this`, `Math`/`JSON`/`Object`/... and custom globals);
 *  - elsewhere, the configured globals (`setTimeout`, `Math`, `fetch`, ...).
 * It declines (returns null) whenever the receiver's type isn't known.
 *
 * @param {{ globals?: string[] | object }} [config]
 */
function jsCompletionSource(config = {}) {
  const scope = resolveScope(config.globals);
  const globals = globalOptions(scope);

  return (context) => {
    const { state, pos } = context;
    const inner = syntaxTree(state).resolveInner(pos, -1);

    const access = memberContext(inner, pos);
    if (access) {
      const receiver = access.member.firstChild;
      if (!receiver || receiver === inner) return null;
      const descriptor = inferNode(receiver, createContext(state, scope));
      if (!descriptor) return null;
      const options = membersOf(descriptor, createContext(state, scope));
      return options.length ? { from: access.from, options, validFor: IDENT } : null;
    }

    if (DONT_COMPLETE.has(inner.name)) return null;
    const isWord = inner.name === 'VariableName'
      || (inner.to - inner.from < 20 && IDENT.test(state.sliceDoc(inner.from, inner.to)));
    if (!isWord && !context.explicit) return null;
    return { from: isWord ? inner.from : pos, options: globals, validFor: IDENT };
  };
}

module.exports = { jsCompletionSource, resolveScope };
