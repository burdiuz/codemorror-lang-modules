import {styleTags, tags as t} from "@lezer/highlight"

export const skslHighlighting = styleTags({
  // Keywords
  "if else for while do return discard break continue": t.controlKeyword,
  "struct": t.definitionKeyword,
  "uniform const in out inout flat noperspective": t.modifier,

  // Type names (built-in types only — identifier fallback handled separately)
  "void bool int uint float double half": t.typeName,
  "bool2 bool3 bool4 bvec2 bvec3 bvec4": t.typeName,
  "int2 int3 int4 ivec2 ivec3 ivec4": t.typeName,
  "uint2 uint3 uint4 uvec2 uvec3 uvec4": t.typeName,
  "float2 float3 float4 vec2 vec3 vec4": t.typeName,
  "half2 half3 half4": t.typeName,
  "double2 double3 double4 dvec2 dvec3 dvec4": t.typeName,
  "float2x2 float3x3 float4x4": t.typeName,
  "float2x3 float2x4 float3x2 float3x4 float4x2 float4x3": t.typeName,
  "mat2 mat3 mat4": t.typeName,
  "mat2x2 mat2x3 mat2x4 mat3x2 mat3x3 mat3x4 mat4x2 mat4x3 mat4x4": t.typeName,
  "half2x2 half3x3 half4x4": t.typeName,
  "shader colorFilter blender sampler2D samplerCube": t.typeName,

  // Identifiers
  "identifier": t.variableName,

  // Function definition name
  "FunctionDef/identifier": t.function(t.definition(t.variableName)),

  // Struct name
  "StructDef/identifier": t.definition(t.typeName),

  // Uniform variable name
  "UniformDecl/identifier": t.definition(t.variableName),

  // Variable declarator name
  "declarator/identifier": t.definition(t.variableName),

  // Literals
  "Literal": t.number,

  // Comments
  "LineComment": t.lineComment,
  "BlockComment": t.blockComment,

  // Preprocessor
  "PreprocessorDirective": t.processingInstruction,

  // Delimiters
  "{ }": t.brace,
  "( )": t.paren,
  "[ ]": t.squareBracket,
  "; ,": t.separator,
  ". ? :": t.punctuation,

  // Operators
  "logicalOr logicalAnd": t.logicOperator,
  "eqOp relOp": t.compareOperator,
  "shiftOp": t.bitwiseOperator,
  "addOp": t.arithmeticOperator,
  "mulOp": t.arithmeticOperator,
  "unaryOp": t.operator,
  "assignOp": t.definitionOperator,
  "| ^ &": t.bitwiseOperator,

  // Field access dot
  "FieldAccess/\".\"": t.derefOperator,
})
