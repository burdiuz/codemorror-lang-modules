# Build Setup

## `rollup.config.js`

```javascript
import {lezer} from "@lezer/generator/rollup"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "./src/index.ts",
  external: ["@codemirror/language", "@lezer/highlight", "@lezer/lr", "@lezer/common"],
  output: [
    { file: "./dist/index.cjs", format: "cjs" },
    { dir: "./dist", format: "es" },
  ],
  plugins: [lezer(), typescript()],
}
```

The `lezer()` Rollup plugin transforms `.grammar` files into parse-table JS modules during the build. The generated `.grammar.d.ts` type declaration is also produced automatically.

---

## `package.json`

```json
{
  "name": "codemirror-lang-mylang",
  "version": "0.1.0",
  "description": "MyLang syntax support for CodeMirror 6",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "exports": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "types": "dist/index.d.ts",
  "sideEffects": false,
  "scripts": {
    "prepare": "rollup -c",
    "test": "mocha test/test.js"
  },
  "dependencies": {
    "@codemirror/language": "^6.0.0",
    "@lezer/highlight": "^1.0.0",
    "@lezer/lr": "^1.0.0"
  },
  "devDependencies": {
    "@lezer/generator": "^1.0.0",
    "@rollup/plugin-typescript": "^12.0.0",
    "mocha": "^10.0.0",
    "rollup": "^4.0.0",
    "tslib": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## `test/test.js`

```javascript
import {myLanguage} from "../dist/index.js"
import {fileTests} from "@lezer/generator/dist/test"
import * as fs from "fs"
import * as path from "path"
import {fileURLToPath} from "url"

const caseDir = path.dirname(fileURLToPath(import.meta.url))

for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue
  const name = /^[^.]*/.exec(file)[0]
  describe(name, () => {
    for (const {name, run} of fileTests(fs.readFileSync(path.join(caseDir, file), "utf8"), file))
      it(name, () => run(myLanguage.parser))
  })
}
```

---

## CLI Build (without Rollup)

```bash
npx lezer-generator src/lang.grammar -o src/parser.js
```

| Flag | Effect |
|------|--------|
| `--cjs` | CommonJS output |
| `--typeScript` | TypeScript output |
| `--names` | Include term names in output (useful for debugging parse states) |
| `--export Name` | Set the parser's export name |
| `--noTerms` | Skip generating the `.terms` file |
