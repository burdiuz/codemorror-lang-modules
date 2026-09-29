import {styleTags, tags as t} from "@lezer/highlight"

export const glslHighlighting = styleTags({
  // Keywords
  "if else for while do switch case default return discard break continue": t.controlKeyword,
  "struct": t.definitionKeyword,
  "precision": t.definitionKeyword,
  "layout": t.definitionKeyword,
  "const in out inout attribute varying uniform centroid flat smooth noperspective invariant precise": t.modifier,
  "highp mediump lowp": t.modifier,

  // Type names (built-in types only — identifier fallback handled separately)
  "void bool int uint float": t.typeName,
  "vec2 vec3 vec4 bvec2 bvec3 bvec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4": t.typeName,
  "mat2 mat3 mat4": t.typeName,
  "mat2x2 mat2x3 mat2x4 mat3x2 mat3x3 mat3x4 mat4x2 mat4x3 mat4x4": t.typeName,
  "sampler2D samplerCube sampler3D sampler2DArray": t.typeName,
  "sampler2DShadow samplerCubeShadow sampler2DArrayShadow": t.typeName,
  "isampler2D isampler3D isamplerCube isampler2DArray": t.typeName,
  "usampler2D usampler3D usamplerCube usampler2DArray": t.typeName,

  // Boolean literals
  "BoolLiteral": t.bool,

  // Identifiers
  "identifier": t.variableName,

  // Function definition / prototype name
  "FunctionDef/identifier": t.function(t.definition(t.variableName)),
  "FunctionProto/identifier": t.function(t.definition(t.variableName)),

  // Struct name
  "StructDef/identifier": t.definition(t.typeName),

  // Variable declarator name
  "declarator/identifier": t.definition(t.variableName),

  // layout(...) item names
  "layoutItem/identifier": t.propertyName,

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
