const { describe, expect, test } = require('@jest/globals');
const { EditorState } = require('@codemirror/state');
const { CompletionContext } = require('@codemirror/autocomplete');
const { javascript } = require('@codemirror/lang-javascript');
const { jsCompletionSource } = require('./completion.js');

// `doc` contains one `|` marking the cursor. Returns the completion result or null.
function run(doc, { ts = false, explicit = false, config } = {}) {
  const pos = doc.indexOf('|');
  const state = EditorState.create({
    doc: doc.replace('|', ''),
    selection: { anchor: pos },
    extensions: [javascript({ typescript: ts })],
  });
  return jsCompletionSource(config)(new CompletionContext(state, pos, explicit));
}

function labels(doc, options) {
  const result = run(doc, options);
  return result ? result.options.map((option) => option.label) : null;
}

describe('member completion', () => {
  test('suggests String methods after a string literal', () => {
    const result = labels('"abc".|');
    expect(result).toEqual(expect.arrayContaining(['toLowerCase', 'trim', 'length', 'split']));
    expect(result).not.toContain('map');
  });

  test('works on a partially typed member', () => {
    const result = run('const s = "abc";\ns.toLo|');
    expect(result.from).toBe('const s = "abc";\ns.'.length);
    expect(result.options.map((o) => o.label)).toContain('toLowerCase');
  });

  test('follows a variable to its initializer', () => {
    expect(labels('const list = [1, 2];\nlist.|')).toEqual(expect.arrayContaining(['map', 'filter', 'push']));
  });

  test('follows method return types through a chain', () => {
    const result = labels('const s = " a b ";\ns.trim().split(" ").|');
    expect(result).toContain('map');
    expect(result).not.toContain('toLowerCase');
  });

  test('knows constructors', () => {
    expect(labels('const m = new Map();\nm.|')).toEqual(expect.arrayContaining(['get', 'set', 'has', 'size']));
    expect(labels('new Date().|')).toEqual(expect.arrayContaining(['getTime', 'toISOString']));
  });

  test('knows Date accessors by pattern', () => {
    expect(labels('new Date().getTime().|')).toContain('toFixed');
    expect(labels('new Date().toISOString().|')).toContain('toLowerCase');
  });

  test('Promise chains stay Promises', () => {
    expect(labels('fetch("/x").then(r => r).|')).toEqual(expect.arrayContaining(['then', 'catch', 'finally']));
  });

  test('suggests statics for built-in namespaces', () => {
    expect(labels('Math.|')).toEqual(expect.arrayContaining(['PI', 'max', 'floor']));
    expect(labels('JSON.|')).toEqual(expect.arrayContaining(['parse', 'stringify']));
    expect(labels('Object.|')).toEqual(expect.arrayContaining(['keys', 'entries']));
    expect(labels('console.|')).toContain('log');
  });

  test('does not leak Function.prototype noise into statics', () => {
    const result = labels('Array.|');
    expect(result).toEqual(expect.arrayContaining(['from', 'isArray']));
    expect(result).not.toContain('prototype');
    expect(result).not.toContain('call');
  });

  test('uses static return types', () => {
    expect(labels('Object.keys({}).|')).toContain('map');
    expect(labels('JSON.stringify({}).|')).toContain('toUpperCase');
    expect(labels('Math.max(1, 2).|')).toContain('toFixed');
  });

  test('Object.freeze keeps the type of its argument', () => {
    expect(labels('Object.freeze([1]).|')).toContain('map');
  });

  test('suggests object literal keys', () => {
    const result = labels('const o = { name: "x", run() {}, go: () => 1 };\no.|');
    expect(result).toEqual(expect.arrayContaining(['name', 'run', 'go', 'hasOwnProperty']));
  });

  test('infers property types of object literal values', () => {
    expect(labels('const o = { items: [1] };\no.items.|')).toContain('map');
    expect(labels('const o = { title: "t" };\no.title.|')).toContain('trim');
  });

  test('suggests members of classes declared in the file', () => {
    const doc = `class A { x = []; static make() {} get g() { return 1; } run() {} #hidden = 1; }
const a = new A();
a.|`;
    const result = labels(doc);
    expect(result).toEqual(expect.arrayContaining(['x', 'g', 'run']));
    expect(result).not.toContain('make');
    expect(result).not.toContain('#hidden');
    expect(labels(doc.replace('a.|', 'A.|'))).toEqual(['make']);
  });

  test('completes `this` inside class methods, including fields and inheritance', () => {
    const doc = `class Base { base() {} }
class A extends Base { items = []; run() { this.| } }`;
    expect(labels(doc)).toEqual(expect.arrayContaining(['items', 'run', 'base']));
    expect(labels(doc.replace('this.|', 'this.items.|'))).toContain('map');
  });

  test('extending a built-in class brings its members', () => {
    expect(labels('class E extends Error { run() { this.| } }')).toEqual(expect.arrayContaining(['run', 'message']));
  });

  test('completes `this` inside an object literal method', () => {
    expect(labels('const o = { a: 1, m() { this.| } };')).toContain('a');
  });

  test('handles optional chaining', () => {
    expect(labels('const s = "x";\ns?.|')).toContain('trim');
  });

  test('parenthesized and awaited values', () => {
    expect(labels('("x").|')).toContain('trim');
    expect(labels('async function f() { (await "x").| }')).toContain('trim');
    expect(labels('async function f() { (await fetch("/")).| }')).toBeNull();
  });

  test('resolves the nearest enclosing declaration', () => {
    const doc = `const v = "outer";
function f() { const v = []; v.| }`;
    expect(labels(doc)).toContain('map');
  });

  test('resolves function parameters with default values', () => {
    expect(labels('function f(a = "x") { a.| }')).toContain('trim');
  });

  test('for-in variables are strings, catch variables are errors', () => {
    expect(labels('for (const k in {}) { k.| }')).toContain('toLowerCase');
    expect(labels('try {} catch (e) { e.| }')).toContain('message');
  });

  test('ignores self-referencing declarations', () => {
    expect(labels('const a = a.b;\na.|')).toBeNull();
  });

  test('declines when the receiver type is unknown', () => {
    expect(labels('foo.|')).toBeNull();
    expect(labels('const x = unknownCall();\nx.|')).toBeNull();
    expect(labels('const [first] = list;\nfirst.|')).toBeNull();
  });

  test('a local variable shadows a global of the same name', () => {
    expect(labels('const Math = "x";\nMath.|')).toContain('trim');
  });
});

describe('TypeScript annotations', () => {
  test('uses keyword and generic types', () => {
    expect(labels('let a: string;\na.|', { ts: true })).toContain('trim');
    expect(labels('let a: number[] = x;\na.|', { ts: true })).toContain('map');
    expect(labels('let a: Map<string, number> = x;\na.|', { ts: true })).toContain('get');
    expect(labels('function f(p: Date) { p.| }', { ts: true })).toContain('getTime');
  });

  test('annotation wins over initializer; unknown annotations fall back to it', () => {
    expect(labels('const a: any = "x";\na.|', { ts: true })).toContain('trim');
  });

  test('function return type annotations', () => {
    expect(labels('function f(): string { return ""; }\nf().|', { ts: true })).toContain('trim');
  });

  test('annotations naming classes in the file', () => {
    expect(labels('class A { run() {} }\nlet a: A;\na.|', { ts: true })).toContain('run');
  });
});

describe('global completion', () => {
  test('suggests configured globals by default', () => {
    const result = labels('setTi|');
    expect(result).toEqual(expect.arrayContaining(['setTimeout', 'Math', 'console']));
  });

  test('does not suggest window or document', () => {
    const result = labels('x|');
    expect(result).not.toContain('window');
    expect(result).not.toContain('document');
  });

  test('accepts a list of names', () => {
    const result = labels('x|', { config: { globals: ['Math', 'nonexistentGlobal'] } });
    expect(result).toEqual(['Math']);
  });

  test('accepts a custom scope object, including for member completion', () => {
    const globals = { api: { get() {}, version: 1 } };
    expect(labels('ap|', { config: { globals } })).toEqual(['api']);
    expect(labels('api.|', { config: { globals } })).toEqual(['get', 'version']);
    expect(labels('api.version.|', { config: { globals } })).toContain('toFixed');
  });

  test('a global missing from the configured scope is not inferred', () => {
    expect(labels('new Map().|', { config: { globals: ['Math'] } })).toBeNull();
  });

  test('stays quiet where names are not completable', () => {
    expect(run('"str|"')).toBeNull();
    expect(run('// com|')).toBeNull();
    expect(run('const na|')).toBeNull();
    expect(run('const o = { ke| }')).toBeNull();
  });

  test('offers globals on explicit completion with no word', () => {
    expect(run('|', { explicit: true }).options.length).toBeGreaterThan(0);
    expect(run('|')).toBeNull();
  });
});
