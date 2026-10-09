# @actualwave/codemirror-lang-js-completion

Lightweight JavaScript autocompletion for [CodeMirror 6](https://codemirror.net/). It suggests
globals (`setTimeout`, `Math`, `fetch` …) and **members after a dot** (`"abc".toLowerCase`,
`list.map`, `new Map().get`, `this.items`) without the TypeScript compiler, a worker or any
download. It is meant for constrained environments such as Android WebViews and TV devices.

```js
const text = "  Hello  ";
text.trim().split(" ").|      // → map, filter, join, … (an Array)
new Date().getTime().|        // → toFixed, toString, … (a Number)
Math.|                        // → PI, max, floor, …
```

## Installation

```bash
npm install @actualwave/codemirror-lang-js-completion \
  @codemirror/autocomplete @codemirror/language @codemirror/state @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { createSupportExtension } from "@actualwave/codemirror-lang-js-completion"

const js = javascript({ jsx: true })

new EditorView({
  doc: "const s = 'abc';\ns.",
  extensions: [basicSetup, js, createSupportExtension(js)],
  parent: document.body,
})
```

`createSupportExtension(jsLanguageSupport, config?)` returns an extension that adds the source to
`jsLanguageSupport.language`. Pass the support whose `language` the editor uses. When combining
with the tagged-template embeds, that is the **wrapped** support returned by
`embedTaggedTemplates`:

```js
const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new LanguageSupport(embedded.language, [
  embedded.support,
  createSupportExtension(embedded),
])
```

You can also use the source directly:

```js
import { jsCompletionSource } from "@actualwave/codemirror-lang-js-completion"
import { javascriptLanguage } from "@codemirror/lang-javascript"

javascriptLanguage.data.of({ autocomplete: jsCompletionSource({ globals: ["Math", "JSON"] }) })
```

## What gets suggested

### After a dot

The receiver (the expression left of the `.` or `?.`) is typed with a small inference pass over
the syntax tree. The members are then read from the real prototype or object at runtime, so the
list matches the JavaScript engine it runs in.

| Receiver | Example | Members from |
| --- | --- | --- |
| literal | `"x".`, `1.5.`, `[].`, `/x/.`, `` `t`. ``, `(() => 1).` | `String`, `Number`, `Array`, `RegExp`, `Function` |
| constructor | `new Map().`, `new Date().`, `new Promise(…).` | that built-in's prototype |
| variable | `const s = "x"; s.` | whatever its initializer is |
| call | `s.trim().`, `list.map(…).`, `Object.keys(o).`, `parseInt(x).`, `fetch(…).` | a table of return types (see below) |
| property | `o.items.`, `str.length.`, `url.searchParams.` | object literal values, class fields, known properties |
| object literal | `const o = { a: 1, run() {} }; o.` | its keys, then `Object.prototype` |
| class instance | `const a = new A(); a.` | fields, methods and accessors (public, non-static), including those of a local or built-in `extends` class |
| class itself | `A.` | its `static` members |
| `this` | `this.` | the enclosing class or object literal (static context handled) |
| global namespace | `Math.`, `JSON.`, `Object.`, `console.`, `Promise.` | the object's own members |
| custom global | `api.`, `api.user.` | your own object (see `globals`) |
| TypeScript annotation | `let a: string[]`, `p: Map<string, number>`, `f(): string` | `Array`, `Map`, `String` … |

Variables are resolved through the nearest enclosing declaration: `const`/`let`/`var`, function
and arrow parameters (annotations and default values), `for … in` (a `String`) and `catch (e)`
(an `Error`). Parenthesized expressions and `await` are followed. When the receiver can't be
typed, the source returns nothing, so you never get misleading suggestions.

Return types known to the inference (the *names* of members are never listed by hand):

- `String` methods: transforms return `String`, `split`/`match` return `Array`, `indexOf`-like return `Number`, `includes`/`startsWith`/`endsWith` return `Boolean`.
- `Array` methods: `map`/`filter`/`slice`/`sort`/`concat`/… return `Array`, `join` returns `String`, `push`/`indexOf`/… return `Number`, `some`/`every`/`includes` return `Boolean`.
- `Number`, `BigInt`, `Boolean` formatting methods return `String`.
- `Map`/`Set`/`WeakMap`/`WeakSet` `set`/`add` return the collection, `has`/`delete` return `Boolean`.
- `Date`: `get*`/`set*` return `Number`, `to*String` return `String`.
- `RegExp`, `Promise` (`then`/`catch`/`finally` stay a `Promise`), `Function#bind`, `Error`, `URL`, `URLSearchParams`.
- Statics: `Array.from/of/isArray`, `Object.keys/values/entries/assign/freeze/fromEntries/…`, `JSON.stringify`, all of `Math`, `Number.*`, `String.fromCharCode`, `Promise.all/resolve/…`, `Date.now`.
- Global calls: `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `String()`, `Number()`, `Boolean()`, `Array()`, `encodeURIComponent` and friends, `fetch`.

### Elsewhere

Anywhere a name is expected, the configured globals are suggested. By default these are the
language built-ins plus timers and a few web APIs, and notably **not** `window` or `document`:

`Object Array String Number Boolean Symbol BigInt Math JSON Date RegExp Map Set WeakMap WeakSet
Promise Proxy Reflect Intl Error TypeError RangeError SyntaxError ReferenceError parseInt
parseFloat isNaN isFinite NaN Infinity undefined encodeURIComponent decodeURIComponent encodeURI
decodeURI setTimeout clearTimeout setInterval clearInterval queueMicrotask structuredClone console
fetch URL URLSearchParams`

Names that don't exist in the current environment are skipped automatically.

## Configuration

`createSupportExtension(js, config?)` and `jsCompletionSource(config?)` take:

| Option | Description |
| --- | --- |
| `globals` | `string[]`: names to expose, read from `globalThis`. Or an object `{ name: value }`: your own scope. Defaults to `DEFAULT_GLOBALS`. |

```js
import { createSupportExtension, DEFAULT_GLOBALS } from "@actualwave/codemirror-lang-js-completion"

// Add a few names to the defaults
createSupportExtension(js, { globals: [...DEFAULT_GLOBALS, "localStorage", "requestAnimationFrame"] })

// Only what your scripting API provides
createSupportExtension(js, {
  globals: {
    Math,
    console,
    app: { version: "1.0", navigate() {}, user: { name: "x" } },
  },
})
```

With an object scope, `app.` suggests `version`, `navigate`, `user`; `app.user.` suggests `name`;
and `app.version.` suggests the `String` methods because the value is a string. Anything listed
in `globals` also becomes known to the inference (so `new Map()` is only understood when `Map` is
in the scope).

## Limits

This is a heuristic, not a type checker.

- No types across files or from `import`s.
- Untyped function parameters, destructured names (`const [a] = x`), array elements and the
  resolved value of a `Promise` are unknown, so there are no suggestions for them.
- Assignments after the declaration (`let x; x = "a"`) and control-flow narrowing are not followed.
- The return types of your own functions are only known from TypeScript annotations.
- Members are listed from the type, not checked against it, and without signatures or docs.
- A dot after something unknown produces nothing, not a fallback list.

For full type-aware completion you need a TypeScript language service, which is much heavier.

## Notes

- Nothing is invoked while listing members (accessors such as `Map.prototype.size` are read as
  descriptors only), so completion has no side effects.
- Results are cached per type, so repeated completions are cheap.
- Tests: `npm test -w @actualwave/codemirror-lang-js-completion`.

## License

MIT
