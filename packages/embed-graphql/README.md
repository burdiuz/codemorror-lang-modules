# @actualwave/codemirror-lang-embed-graphql

[GraphQL](https://graphql.org/) syntax highlighting inside `` gql`…` `` tagged templates in
JS/TS/JSX/TSX for [CodeMirror 6](https://codemirror.net/). The grammar is a trimmed copy of the one
in [cm6-graphql](https://github.com/graphql/graphiql/tree/main/packages/cm6-graphql) (MIT; see
`graphql-language.js`).

```js
const userQuery = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`
```

## Installation

```bash
npm install @actualwave/codemirror-lang-embed-graphql @actualwave/codemirror-lang-embed-core \
  @codemirror/language @lezer/highlight @lezer/lr @codemirror/lang-javascript
```

## Usage

```js
import { EditorView, basicSetup } from "codemirror"
import { LanguageSupport } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"
import { createTagRegistry, embedTaggedTemplates } from "@actualwave/codemirror-lang-embed-core"
import { createEmbedding as createGraphql } from "@actualwave/codemirror-lang-embed-graphql"

const graphql = createGraphql()

const registry = createTagRegistry()
registry.register(graphql.matcher, graphql.language)

const embedded = embedTaggedTemplates(javascript({ jsx: true, typescript: true }), registry)

new EditorView({
  doc: "const q = gql`{ viewer { id } }`",
  extensions: [basicSetup, new LanguageSupport(embedded.language, embedded.support)],
  parent: document.body,
})
```

## Suggestions

This embed provides **highlighting, indentation and folding only**. `createEmbedding()` returns no
`extension`, so there is no GraphQL autocompletion. Autocompletion requires a schema, which this
package does not take. If you need it, add your own completion source (for example from
`cm6-graphql` with your schema) as language data on the GraphQL language, and add the resulting
extension to the editor:

```js
const completion = graphql.language.data.of({ autocomplete: myGraphqlCompletionSource })

new LanguageSupport(embedded.language, [embedded.support, completion])
```

## Notes

- Only the bare tag `gql` matches. To also match `graphql`, register another matcher:

  ```js
  import { matchTagName } from "@actualwave/codemirror-lang-embed-core"
  registry.register(matchTagName("graphql"), graphql.language)
  ```
- `${...}` interpolations (fragments, for example) are excluded from the parse.
- The module also exports `graphqlLanguage` and `graphqlLanguageSupport()` in
  `graphql-language.js` for use outside of tagged templates.

## Returns

`createEmbedding()` → `{ matcher, language: graphqlLanguage }`.

## License

MIT
