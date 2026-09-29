import typescript from "@rollup/plugin-typescript"
import copy from "rollup-plugin-copy"

export default {
  input: "src/index.ts",
  external: id => id != "tslib" && !/^(\.?\/|\w:)/.test(id),
  output: [
    {file: "dist/index.cjs", format: "cjs"},
    {dir: "./dist", format: "es"}
  ],
  plugins: [
    typescript({declarationDir: "./dist/types", outputToFilesystem: true}),
    copy({
      targets: [
        {src: "LICENSE", dest: "dist"},
        {src: "README.md", dest: "dist"},
        {src: "package.json", dest: "dist"},
      ]
    })
  ]
}
