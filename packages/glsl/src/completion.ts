import {completeFromList} from "@codemirror/autocomplete"
import type {CompletionSource} from "@codemirror/autocomplete"

// Built-in GLSL ES / desktop GLSL vocabulary — types, qualifiers/keywords,
// standard-library functions, and the handful of predeclared gl_* variables.
// Not exhaustive of every dialect variant (e.g. GLSL ES 3.00's image/atomic
// builtins), just the common surface a shader author actually types.

const TYPES = [
  "void", "bool", "int", "uint", "float", "double",
  "vec2", "vec3", "vec4", "ivec2", "ivec3", "ivec4",
  "uvec2", "uvec3", "uvec4", "bvec2", "bvec3", "bvec4",
  "mat2", "mat3", "mat4",
  "mat2x2", "mat2x3", "mat2x4", "mat3x2", "mat3x3", "mat3x4", "mat4x2", "mat4x3", "mat4x4",
  "sampler2D", "sampler3D", "samplerCube", "sampler2DArray",
  "sampler2DShadow", "samplerCubeShadow", "isampler2D", "usampler2D",
]

const QUALIFIERS = [
  "attribute", "varying", "uniform", "in", "out", "inout", "const",
  "precision", "highp", "mediump", "lowp",
  "invariant", "flat", "noperspective", "smooth", "layout",
  "struct", "return", "if", "else", "for", "while", "do",
  "break", "continue", "discard", "true", "false",
]

const FUNCTIONS = [
  "radians", "degrees", "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
  "abs", "sign", "floor", "trunc", "round", "roundEven", "ceil", "fract",
  "mod", "modf", "min", "max", "clamp", "mix", "step", "smoothstep",
  "isnan", "isinf",
  "length", "distance", "dot", "cross", "normalize", "faceforward", "reflect", "refract",
  "matrixCompMult", "outerProduct", "transpose", "inverse", "determinant",
  "lessThan", "lessThanEqual", "greaterThan", "greaterThanEqual", "equal", "notEqual", "any", "all", "not",
  "texture", "texture2D", "textureCube", "textureProj", "textureLod", "texelFetch", "textureSize", "textureGrad",
  "dFdx", "dFdy", "fwidth",
]

const VARIABLES = [
  "gl_Position", "gl_PointSize", "gl_FragColor", "gl_FragCoord",
  "gl_FrontFacing", "gl_PointCoord", "gl_FragDepth", "gl_VertexID", "gl_InstanceID",
]

const completions = [
  ...TYPES.map((label) => ({label, type: "type"})),
  ...QUALIFIERS.map((label) => ({label, type: "keyword"})),
  ...FUNCTIONS.map((label) => ({label, type: "function", boost: -1})),
  ...VARIABLES.map((label) => ({label, type: "variable"})),
]

export const glslCompletionSource: CompletionSource = completeFromList(completions)
