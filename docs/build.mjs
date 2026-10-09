import * as esbuild from 'esbuild'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const docsDir = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(docsDir, '..', 'packages')

// Base grammar packages declare `main`/`exports` pointing at index.js/index.cjs,
// which only exist in their built `dist/` folder. Resolve them there so the demo
// always uses the compiled output. The embed-* packages are unbundled CommonJS
// sources and are resolved as-is.
const BASE_PACKAGES = ['sksl', 'glsl', 'icu-messageformat', 'react-native']

const distResolvePlugin = {
  name: 'dist-resolve',
  setup(build) {
    const filter = new RegExp(`^@actualwave/codemirror-lang-(${BASE_PACKAGES.join('|')})$`)
    build.onResolve({filter}, ({path: specifier}) => {
      const name = specifier.replace('@actualwave/codemirror-lang-', '')
      return {path: path.join(packagesDir, name, 'dist', 'index.js')}
    })
  },
}

// CommonJS embed packages call require('@codemirror/*') and require('@lezer/*'),
// which resolves to the .cjs builds, while ESM imports resolve to the .js builds.
// Two copies of @codemirror/state or @lezer/common break instanceof checks, so
// force every such package onto the ESM build regardless of the import kind.
const esmOnlyPlugin = {
  name: 'esm-only',
  setup(build) {
    build.onResolve({filter: /^(@codemirror\/|@lezer\/|codemirror$)/}, async (args) => {
      if (args.kind === 'import-statement') return undefined
      return build.resolve(args.path, {
        kind: 'import-statement',
        resolveDir: args.resolveDir,
        importer: args.importer,
      })
    })
  },
}

await esbuild.build({
  entryPoints: [path.join(docsDir, 'src', 'main.js')],
  outfile: path.join(docsDir, 'assets', 'main.js'),
  bundle: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  logLevel: 'info',
  plugins: [distResolvePlugin, esmOnlyPlugin],
})
