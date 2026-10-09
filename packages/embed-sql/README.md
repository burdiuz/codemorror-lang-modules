# @actualwave/codemirror-lang-embed-sql

SQL highlighting and **keyword / schema autocompletion** inside `` sql`…` `` tagged templates in
JS/TS/JSX/TSX for [CodeMirror 6](https://codemirror.net/). It uses
[`@codemirror/lang-sql`](https://github.com/codemirror/lang-sql), so every dialect it supports is
available.

```js
const query = sql`
  SELECT id, name
  FROM users
  WHERE active = true
`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-sql @actualwave/codemirror-lang-embed-core \
  @codemirror/lang-sql @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createSql } from "@actualwave/codemirror-lang-embed-sql"

const sql = createSql()

const registry = createTagRegistry()
registry.register(sql.matcher, sql.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const q = sql`SEL`",
  extensions: [
    basicSetup, // includes autocompletion()
    // `sql.extension` provides suggestions – do not leave it out
    new LanguageSupport(embedded.language, [embedded.support, sql.extension]),
  ],
  parent: document.body,
})
```

Typing `SE` inside the template now suggests `SELECT`, `SET` and so on.

## Configuration

`createEmbedding(config?)` passes `config` straight to `sql(config)` from
`@codemirror/lang-sql` (`SQLConfig`):

| Option | Description |
| --- | --- |
| `dialect` | `StandardSQL` (default), `PostgreSQL`, `MySQL`, `MariaSQL`, `MSSQL`, `SQLite`, `Cassandra`, `PLSQL` |
| `schema` | tables and columns for completion |
| `defaultTable` | complete this table's columns at the top level |
| `defaultSchema` | complete this schema's tables without a prefix |
| `upperCaseKeywords` | suggest `SELECT` rather than `select` |
| `keywordCompletion` | `(label, type) => Completion` to customize keyword entries |

Keyword completion is always on. `schema` adds table and column suggestions on top of it.

### Dialect and upper-case keywords

```js
import { PostgreSQL } from "@codemirror/lang-sql"

const sql = createSql({ dialect: PostgreSQL, upperCaseKeywords: true })
```

### Schema (tables and columns)

```js
const sql = createSql({
  schema: {
    users: ["id", "name", "email", "active"],
    orders: ["id", "user_id", "total"],
  },
  defaultTable: "users",
})
```

Now ``sql`SELECT us…` `` suggests `users`, and ``sql`SELECT users.` `` suggests its columns. Nested
namespaces (`{ public: { users: [...] } }`) and rich `Completion` objects are supported; see
[`SQLNamespace`](https://codemirror.net/docs/ref/#lang-sql.SQLNamespace).

## Notes

- The tag must be the bare identifier `sql`. `db.sql`…`` and `sql(...)`…`` are not matched. To use
  another name, register your own matcher with the core package:
  `registry.register(matchTagName("query"), sql.language)`.
- `${...}` interpolations are skipped by the SQL parser and do not produce syntax errors.
- Peer dependency: `@codemirror/lang-sql ^6`.

## Returns

`createEmbedding(config?)` → `{ matcher, language, extension }`.

## License

MIT
