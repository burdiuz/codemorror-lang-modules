import {EditorView, basicSetup} from 'codemirror'
import {Compartment} from '@codemirror/state'
import {LanguageSupport} from '@codemirror/language'
import {javascript} from '@codemirror/lang-javascript'
import {demoTheme} from './theme.js'
import {createTagRegistry, embedTaggedTemplates} from '@actualwave/codemirror-lang-embed-core'
import {createEmbedding as createSqlEmbedding} from '@actualwave/codemirror-lang-embed-sql'
import {createEmbedding as createCssEmbedding} from '@actualwave/codemirror-lang-embed-css'
import {createEmbedding as createGraphqlEmbedding} from '@actualwave/codemirror-lang-embed-graphql'
import {createEmbedding as createGlslEmbedding} from '@actualwave/codemirror-lang-embed-glsl'
import {createEmbedding as createSkslEmbedding} from '@actualwave/codemirror-lang-embed-sksl'
import {createEmbedding as createIcuEmbedding} from '@actualwave/codemirror-lang-embed-icu-messageformat'
import {createSupportExtension as createTailwindSupport} from '@actualwave/codemirror-lang-embed-tailwind'
import {createSupportExtension as createReactNativeSupport} from '@actualwave/codemirror-lang-embed-react-native'

// Each entry is either a tagged-template embedding (`tag`: returns
// { matcher, language, extension }) or a support extension (`support`: receives
// the JS language support and returns extensions to merge into it).
const EMBEDS = [
  {
    id: 'sql',
    label: 'SQL',
    usage: 'sql`…`',
    tag: () => createSqlEmbedding(),
  },
  {
    id: 'css',
    label: 'CSS',
    usage: 'css`…`, styled.View`…`',
    tag: () => createCssEmbedding(),
  },
  {
    id: 'graphql',
    label: 'GraphQL',
    usage: 'gql`…`',
    tag: () => createGraphqlEmbedding(),
  },
  {
    id: 'glsl',
    label: 'GLSL',
    usage: 'glsl`…`',
    tag: () => createGlslEmbedding(),
  },
  {
    id: 'sksl',
    label: 'SkSL',
    usage: 'sksl`…`',
    tag: () => createSkslEmbedding(),
  },
  {
    id: 'icu',
    label: 'ICU MessageFormat',
    usage: 't`…`',
    tag: () => createIcuEmbedding(),
  },
  {
    id: 'tailwind',
    label: 'Tailwind classes',
    usage: 'tw`…`',
    support: (js) => createTailwindSupport(js),
  },
  {
    id: 'react-native',
    label: 'React Native completion',
    usage: 'imports, JSX props, StyleSheet.create',
    support: (js) => createReactNativeSupport(js),
  },
]

const SAMPLE = `import {StyleSheet, Text, View} from 'react-native';

// SQL
const query = sql\`
  SELECT id, name, email
  FROM users
  WHERE active = true
  ORDER BY name;
\`;

// GraphQL
const userQuery = gql\`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
\`;

// CSS
const button = css\`
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
\`;

// styled-components style
const Card = styled.View\`
  flex: 1;
  margin: 4px;
\`;

// Tailwind (twrnc) classes
const panel = tw\`flex-1 p-4 bg-white rounded-lg\`;

// ICU MessageFormat
const inbox = t\`You have {count, plural, one {# message} other {# messages}}\`;

// GLSL
const fragment = glsl\`
  precision mediump float;
  uniform vec2 resolution;
  void main() {
    gl_FragColor = vec4(resolution.x, 0.0, 0.0, 1.0);
  }
\`;

// SkSL
const effect = sksl\`
  uniform float2 size;
  half4 main(float2 coord) {
    return half4(coord / size, 0.0, 1.0);
  }
\`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

// React Native completion: try typing inside <View style={{ or <Text …
export function App({count}) {
  return (
    <View style={styles.container}>
      <Text>{inbox}</Text>
    </View>
  );
}
`

const enabled = new Set(EMBEDS.map((embed) => embed.id))
const languageCompartment = new Compartment()

function buildLanguageSupport() {
  const js = javascript({jsx: true, typescript: true})
  const registry = createTagRegistry()
  const tagExtensions = []

  for (const embed of EMBEDS) {
    if (!enabled.has(embed.id) || !embed.tag) continue
    const {matcher, language, extension} = embed.tag()
    registry.register(matcher, language)
    // Carries the nested language's completion/language data (e.g. SQL keywords).
    if (extension) tagExtensions.push(extension)
  }

  // Support extensions read language data off the wrapped language, so they
  // must be built from the embedded support, not the plain JS one.
  const embedded = embedTaggedTemplates(js, registry)
  const extensions = []
  for (const embed of EMBEDS) {
    if (!enabled.has(embed.id) || !embed.support) continue
    extensions.push(embed.support(embedded))
  }

  return new LanguageSupport(embedded.language, [embedded.support, tagExtensions, extensions])
}

const view = new EditorView({
  doc: SAMPLE,
  extensions: [basicSetup, demoTheme, languageCompartment.of(buildLanguageSupport())],
  parent: document.getElementById('editor'),
})

function renderToggles() {
  const container = document.getElementById('toggles')
  for (const embed of EMBEDS) {
    const label = document.createElement('label')
    label.className = 'toggle'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = enabled.has(embed.id)
    input.addEventListener('change', () => {
      if (input.checked) enabled.add(embed.id)
      else enabled.delete(embed.id)
      view.dispatch({effects: languageCompartment.reconfigure(buildLanguageSupport())})
    })

    const name = document.createElement('span')
    name.className = 'toggle-name'
    name.textContent = embed.label

    const usage = document.createElement('code')
    usage.className = 'toggle-usage'
    usage.textContent = embed.usage

    label.append(input, name, usage)
    container.append(label)
  }
}

document.getElementById('reset').addEventListener('click', () => {
  view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: SAMPLE}})
})

renderToggles()
