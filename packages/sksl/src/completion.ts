import {completeFromList} from "@codemirror/autocomplete"
import type {CompletionSource} from "@codemirror/autocomplete"

// Built-in SkSL vocabulary. SkSL (Skia's shading language) is GLSL-derived
// but diverges in its scalar/vector naming (half*/float* instead of a single
// float* family) and its runtime-effect-specific types/functions — not
// exhaustive of every Skia version's additions, just the common surface a
// runtime-effect author actually types.

const TYPES = [
  "void", "bool", "int", "float", "half",
  "bool2", "bool3", "bool4", "int2", "int3", "int4",
  "float2", "float3", "float4", "half2", "half3", "half4",
  "float2x2", "float3x3", "float4x4", "half2x2", "half3x3", "half4x4",
  "shader", "colorFilter", "blender",
]

const QUALIFIERS = [
  "in", "out", "inout", "uniform", "const", "layout",
  "struct", "return", "if", "else", "for", "while", "do",
  "break", "continue", "discard", "true", "false",
]

const FUNCTIONS = [
  "sample", "unpremul", "premul", "saturate",
  "radians", "degrees", "sin", "cos", "tan", "asin", "acos", "atan",
  "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
  "abs", "sign", "floor", "ceil", "fract", "mod",
  "min", "max", "clamp", "mix", "step", "smoothstep",
  "length", "distance", "dot", "cross", "normalize", "reflect", "refract",
  "inverse", "transpose",
  "lessThan", "lessThanEqual", "greaterThan", "greaterThanEqual", "equal", "notEqual", "any", "all", "not",
]

const VARIABLES = ["sk_FragCoord"]

const completions = [
  ...TYPES.map((label) => ({label, type: "type"})),
  ...QUALIFIERS.map((label) => ({label, type: "keyword"})),
  ...FUNCTIONS.map((label) => ({label, type: "function", boost: -1})),
  ...VARIABLES.map((label) => ({label, type: "variable"})),
]

export const skslCompletionSource: CompletionSource = completeFromList(completions)
