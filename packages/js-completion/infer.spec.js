const { describe, expect, test } = require('@jest/globals');
const { EditorState } = require('@codemirror/state');
const { syntaxTree } = require('@codemirror/language');
const { javascript } = require('@codemirror/lang-javascript');
const { createContext, inferNode } = require('./infer.js');
const { resolveScope } = require('./completion.js');

// Infers the type of the receiver of the last `.` in `doc`.
function receiverType(doc, { ts = false } = {}) {
  const state = EditorState.create({ doc, extensions: [javascript({ typescript: ts })] });
  const pos = doc.lastIndexOf('.') + 1;
  const node = syntaxTree(state).resolveInner(pos, -1);
  const member = node.name === 'MemberExpression' ? node : node.parent;
  return inferNode(member.firstChild, createContext(state, resolveScope()));
}

describe('inferNode', () => {
  test.each([
    ['"a".', 'String'],
    ['`a${1}`.', 'String'],
    ['1.5.', 'Number'],
    ['true.', 'Boolean'],
    ['/x/.', 'RegExp'],
    ['[].', 'Array'],
    ['(() => 1).', 'Function'],
    ['(typeof x).', 'String'],
    ['new Set().', 'Set'],
    ['parseInt("1").', 'Number'],
    ['String(1).', 'String'],
    ['Array.from(x).', 'Array'],
  ])('%s -> %s', (doc, type) => {
    expect(receiverType(doc)).toEqual({ kind: 'instance', type });
  });

  test('object literals keep their node', () => {
    const descriptor = receiverType('({ a: 1 }).');
    expect(descriptor.kind).toBe('object');
    expect(descriptor.node.name).toBe('ObjectExpression');
  });

  test('global namespaces resolve to live values', () => {
    const descriptor = receiverType('Math.');
    expect(descriptor.kind).toBe('value');
    expect(descriptor.value).toBe(Math);
    expect(descriptor.globalName).toBe('Math');
  });

  test('numeric statics become instances', () => {
    expect(receiverType('Number.MAX_VALUE.')).toEqual({ kind: 'instance', type: 'Number' });
  });

  test('unknown things are null', () => {
    expect(receiverType('foo.')).toBeNull();
    expect(receiverType('foo().')).toBeNull();
    expect(receiverType('a[0].')).toBeNull();
    expect(receiverType('a + b.')).toBeNull();
  });

  test('long declaration chains terminate', () => {
    const doc = Array.from({ length: 40 }, (_, i) => `const v${i + 1} = v${i};`).join('\n') + '\nv40.';
    expect(receiverType(`const v0 = "x";\n${doc}`)).toBeNull();
  });
});
