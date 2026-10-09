const {
  METHOD_RETURNS,
  PROPERTY_TYPES,
  STATIC_RETURNS,
  GLOBAL_CALL_RETURNS,
  TS_KEYWORD_TYPES,
  dateMethodReturn,
} = require('./types.js');

// A deliberately small, heuristic type inference over the Lezer JS syntax tree.
// It answers one question: "what is the thing to the left of this `.`?" — and
// answers it only when that is cheap and certain (literals, constructors,
// simple declarations, annotated TS types, a table of well-known method return
// types). Anything else resolves to null and produces no suggestions, so a
// wrong guess never reaches the user.
//
// Results are descriptors:
//   { kind: 'instance', type }             an instance of a built-in ('String', 'Map', ...)
//   { kind: 'object', node }               an object literal (its keys are suggested)
//   { kind: 'class', node }                an instance of a class declared in this file
//   { kind: 'classStatic', node }          that class itself (`Foo.`)
//   { kind: 'value', value, globalName? }  a live value from the globals scope (`Math`, `console`, ...)

const MAX_DEPTH = 16;

function createContext(state, scope) {
  return {
    scope: scope || {},
    read: (node) => state.sliceDoc(node.from, node.to),
    depth: 0,
    active: new Set(),
  };
}

function instance(type) {
  return type ? { kind: 'instance', type } : null;
}

// `Map`, `Date`, `Promise`... — a built-in that can be both annotated and constructed.
function isBuiltinType(name) {
  if (!/^[A-Z]/.test(name)) return false;
  const ctor = globalThis[name];
  return typeof ctor === 'function' && ctor.prototype != null;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function childNamed(node, name) {
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.name === name) return child;
  }
  return null;
}

// The expression inside `( ... )`.
function innerOf(parenthesized) {
  for (let child = parenthesized.firstChild; child; child = child.nextSibling) {
    if (child.name !== '(' && child.name !== ')') return child;
  }
  return null;
}

function propertyNameOf(memberExpression, ctx) {
  const last = memberExpression.lastChild;
  return last && last.name === 'PropertyName' ? ctx.read(last) : null;
}

function firstArgument(callExpression) {
  const args = childNamed(callExpression, 'ArgList');
  if (!args) return null;
  for (let child = args.firstChild; child; child = child.nextSibling) {
    if (child.name !== '(' && child.name !== ')' && child.name !== ',') return child;
  }
  return null;
}

// ---- declarations -----------------------------------------------------------

// Reads `name [: Type] [= init]` starting at a VariableDefinition.
function readDefinition(definition) {
  let next = definition.nextSibling;
  let annotation = null;
  let init = null;
  if (next && next.name === 'TypeAnnotation') {
    annotation = next;
    next = next.nextSibling;
  }
  if (next && next.name === 'Equals') init = next.nextSibling;
  return { kind: 'variable', annotation, init, at: definition.from };
}

function collectDefinitions(parent, name, ctx, found) {
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    if (child.name === 'VariableDefinition' && ctx.read(child) === name) {
      found.push(readDefinition(child));
    }
  }
}

function collectDeclarations(container, name, ctx, found) {
  for (let child = container.firstChild; child; child = child.nextSibling) {
    switch (child.name) {
      case 'VariableDeclaration':
        collectDefinitions(child, name, ctx, found);
        break;
      case 'ExportDeclaration':
      case 'ForSpec':
        collectDeclarations(child, name, ctx, found);
        break;
      case 'FunctionDeclaration':
      case 'ClassDeclaration': {
        const id = childNamed(child, 'VariableDefinition');
        if (id && ctx.read(id) === name) {
          found.push({
            kind: child.name === 'FunctionDeclaration' ? 'function' : 'class',
            node: child,
            at: child.from,
          });
        }
        break;
      }
      case 'ParamList':
        collectDefinitions(child, name, ctx, found);
        break;
      case 'ForInSpec':
      case 'ForOfSpec': {
        const before = found.length;
        collectDefinitions(child, name, ctx, found);
        if (found.length > before) {
          found[found.length - 1] = {
            kind: child.name === 'ForInSpec' ? 'forIn' : 'unknown',
            at: child.from,
          };
        }
        break;
      }
      case 'VariableDefinition':
        // Only a catch clause binds its own direct child; elsewhere it is a function's own name.
        if (container.name === 'CatchClause' && ctx.read(child) === name) {
          found.push({ kind: 'catch', at: child.from });
        }
        break;
      default:
    }
  }
}

// Finds the nearest enclosing declaration of `name` visible from `fromNode`.
function findDeclaration(name, fromNode, ctx) {
  for (let container = fromNode.parent; container; container = container.parent) {
    const found = [];
    collectDeclarations(container, name, ctx, found);
    if (!found.length) continue;
    // Prefer the closest declaration written before the usage (handles redeclared `var`s).
    let best = null;
    for (const candidate of found) {
      if (candidate.at <= fromNode.from && (!best || candidate.at > best.at)) best = candidate;
    }
    return best || found[0];
  }
  return null;
}

// ---- TypeScript annotations ---------------------------------------------------

function typeNodeToDescriptor(typeNode, ctx) {
  if (!typeNode) return null;
  switch (typeNode.name) {
    case 'TypeName': {
      const text = ctx.read(typeNode);
      if (hasOwn(TS_KEYWORD_TYPES, text)) return instance(TS_KEYWORD_TYPES[text]);
      const declaration = findDeclaration(text, typeNode, ctx);
      if (declaration) {
        return declaration.kind === 'class' ? { kind: 'class', node: declaration.node } : null;
      }
      return isBuiltinType(text) ? instance(text) : null;
    }
    case 'ArrayType':
      return instance('Array');
    case 'ParameterizedType':
      return typeNodeToDescriptor(typeNode.firstChild, ctx);
    default:
      return null;
  }
}

function annotationToDescriptor(annotation, ctx) {
  return annotation ? typeNodeToDescriptor(annotation.lastChild, ctx) : null;
}

// ---- values -------------------------------------------------------------------

function descriptorFromValue(value, globalName) {
  switch (typeof value) {
    case 'string': return instance('String');
    case 'number': return instance('Number');
    case 'boolean': return instance('Boolean');
    case 'bigint': return instance('BigInt');
    case 'symbol': return instance('Symbol');
    case 'function': return { kind: 'value', value, globalName };
    case 'object':
      if (value === null) return null;
      return Array.isArray(value) ? instance('Array') : { kind: 'value', value, globalName };
    default: return null;
  }
}

function descriptorFromDeclaration(declaration, ctx) {
  switch (declaration.kind) {
    case 'variable':
      return annotationToDescriptor(declaration.annotation, ctx)
        || (declaration.init ? inferNode(declaration.init, ctx) : null);
    case 'function': return instance('Function');
    case 'class': return { kind: 'classStatic', node: declaration.node };
    case 'forIn': return instance('String');
    case 'catch': return instance('Error');
    default: return null;
  }
}

// ---- expressions ----------------------------------------------------------------

function inferVariable(node, ctx) {
  const name = ctx.read(node);
  const declaration = findDeclaration(name, node, ctx);
  if (declaration) return descriptorFromDeclaration(declaration, ctx);
  return hasOwn(ctx.scope, name) ? descriptorFromValue(ctx.scope[name], name) : null;
}

function inferThis(node) {
  let member = null;
  for (let current = node.parent; current; current = current.parent) {
    if (current.name === 'MethodDeclaration' || current.name === 'PropertyDeclaration') {
      member = current;
    } else if (current.name === 'ClassBody') {
      const isStatic = member && childNamed(member, 'static');
      return { kind: isStatic ? 'classStatic' : 'class', node: current.parent };
    } else if (current.name === 'ObjectExpression') {
      return { kind: 'object', node: current };
    }
  }
  return null;
}

function inferNew(node, ctx) {
  const callee = childNamed(node, 'VariableName');
  if (!callee) return null;
  const name = ctx.read(callee);
  const declaration = findDeclaration(name, callee, ctx);
  if (declaration) {
    return declaration.kind === 'class' ? { kind: 'class', node: declaration.node } : null;
  }
  return hasOwn(ctx.scope, name) && isBuiltinType(name) ? instance(name) : null;
}

function inferCall(node, ctx) {
  const callee = node.firstChild;
  if (!callee) return null;

  if (callee.name === 'VariableName') {
    const name = ctx.read(callee);
    const declaration = findDeclaration(name, callee, ctx);
    if (declaration) {
      if (declaration.kind !== 'function') return null;
      return annotationToDescriptor(childNamed(declaration.node, 'TypeAnnotation'), ctx);
    }
    return hasOwn(ctx.scope, name) && hasOwn(GLOBAL_CALL_RETURNS, name)
      ? instance(GLOBAL_CALL_RETURNS[name])
      : null;
  }

  if (callee.name !== 'MemberExpression' || !callee.firstChild) return null;
  const property = propertyNameOf(callee, ctx);
  if (!property) return null;
  const receiver = inferNode(callee.firstChild, ctx);
  if (!receiver) return null;

  if (receiver.kind === 'instance') {
    const { type } = receiver;
    const returns = type === 'Date'
      ? dateMethodReturn(property)
      : (METHOD_RETURNS[type] && METHOD_RETURNS[type][property])
        || (METHOD_RETURNS.Object && METHOD_RETURNS.Object[property]);
    return instance(returns);
  }

  if (receiver.kind === 'value' && receiver.globalName && hasOwn(STATIC_RETURNS, receiver.globalName)) {
    const table = STATIC_RETURNS[receiver.globalName];
    const returns = hasOwn(table, property) ? table[property] : table['*'];
    if (returns === '@arg0') {
      const argument = firstArgument(node);
      return argument ? inferNode(argument, ctx) : null;
    }
    return instance(returns);
  }

  return null;
}

function inferObjectKey(objectNode, key, ctx) {
  for (let property = objectNode.firstChild; property; property = property.nextSibling) {
    if (property.name !== 'Property') continue;
    const id = property.firstChild;
    if (!id || id.name !== 'PropertyDefinition' || ctx.read(id) !== key) continue;
    if (childNamed(property, 'ParamList')) return instance('Function');
    const colon = id.nextSibling;
    if (colon && colon.name === ':') return inferNode(colon.nextSibling, ctx);
    // shorthand `{ key }` refers to the variable of the same name
    const declaration = findDeclaration(key, id, ctx);
    return declaration ? descriptorFromDeclaration(declaration, ctx) : null;
  }
  return null;
}

function inferClassField(classNode, key, wantStatic, ctx) {
  const body = childNamed(classNode, 'ClassBody');
  if (!body) return null;
  for (let member = body.firstChild; member; member = member.nextSibling) {
    if (member.name !== 'PropertyDeclaration' && member.name !== 'MethodDeclaration') continue;
    if (Boolean(childNamed(member, 'static')) !== wantStatic) continue;
    const id = childNamed(member, 'PropertyDefinition');
    if (!id || ctx.read(id) !== key) continue;
    if (member.name === 'MethodDeclaration') return instance('Function');
    const field = readDefinition(id);
    return annotationToDescriptor(field.annotation, ctx) || (field.init ? inferNode(field.init, ctx) : null);
  }
  return null;
}

function inferMember(node, ctx) {
  const property = propertyNameOf(node, ctx);
  if (!property || !node.firstChild) return null;
  const receiver = inferNode(node.firstChild, ctx);
  if (!receiver) return null;

  switch (receiver.kind) {
    case 'instance':
      return instance(PROPERTY_TYPES[receiver.type] && PROPERTY_TYPES[receiver.type][property]);
    case 'object':
      return inferObjectKey(receiver.node, property, ctx);
    case 'class':
      return inferClassField(receiver.node, property, false, ctx);
    case 'classStatic':
      return inferClassField(receiver.node, property, true, ctx);
    case 'value': {
      const descriptor = Object.getOwnPropertyDescriptor(receiver.value, property);
      return descriptor && 'value' in descriptor ? descriptorFromValue(descriptor.value) : null;
    }
    default:
      return null;
  }
}

function infer(node, ctx) {
  switch (node.name) {
    case 'String':
    case 'TemplateString':
      return instance('String');
    case 'Number':
      return instance('Number');
    case 'BooleanLiteral':
      return instance('Boolean');
    case 'RegExp':
      return instance('RegExp');
    case 'ArrayExpression':
      return instance('Array');
    case 'ArrowFunction':
    case 'FunctionExpression':
      return instance('Function');
    case 'ObjectExpression':
      return { kind: 'object', node };
    case 'ParenthesizedExpression':
      return inferNode(innerOf(node), ctx);
    case 'UnaryExpression':
      return node.firstChild && node.firstChild.name === 'typeof' ? instance('String') : null;
    case 'AwaitExpression': {
      const awaited = inferNode(node.lastChild, ctx);
      // The resolved type of a Promise isn't tracked.
      return awaited && awaited.kind === 'instance' && awaited.type === 'Promise' ? null : awaited;
    }
    case 'this':
      return inferThis(node);
    case 'VariableName':
      return inferVariable(node, ctx);
    case 'NewExpression':
      return inferNew(node, ctx);
    case 'CallExpression':
      return inferCall(node, ctx);
    case 'MemberExpression':
      return inferMember(node, ctx);
    default:
      return null;
  }
}

// Guards against runaway recursion and self-referencing declarations
// (`const a = a.b`).
function inferNode(node, ctx) {
  if (!node || ctx.depth >= MAX_DEPTH) return null;
  const key = `${node.name}:${node.from}:${node.to}`;
  if (ctx.active.has(key)) return null;
  ctx.active.add(key);
  ctx.depth += 1;
  try {
    return infer(node, ctx);
  } finally {
    ctx.active.delete(key);
    ctx.depth -= 1;
  }
}

module.exports = {
  createContext,
  inferNode,
  findDeclaration,
  isBuiltinType,
  childNamed,
};
