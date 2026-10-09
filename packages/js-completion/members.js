const { HIDDEN_MEMBERS, HIDDEN_STATICS } = require('./types.js');
const { findDeclaration, isBuiltinType, childNamed } = require('./infer.js');

const IDENT = /^[A-Za-z_$][\w$]*$/;

function propertyKind(object, name) {
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(object, name);
  } catch (_) {
    return null;
  }
  if (!descriptor) return null;
  // Accessors are never invoked (`Map.prototype.size` throws off an instance).
  return typeof descriptor.value === 'function' ? 'method' : 'property';
}

const instanceCache = new Map();

// Every member of `new Type()`, found by walking the real prototype chain, so the
// list always matches the engine the editor runs in. Members of deeper prototypes
// (Object.prototype's) rank lower.
function instanceOptions(type) {
  if (instanceCache.has(type)) return instanceCache.get(type);
  const options = [];
  const ctor = globalThis[type];
  if (typeof ctor === 'function' && ctor.prototype) {
    const seen = new Set();
    let depth = 0;
    for (let object = ctor.prototype; object; object = Object.getPrototypeOf(object)) {
      for (const name of Object.getOwnPropertyNames(object)) {
        if (seen.has(name) || !IDENT.test(name) || name.startsWith('__') || HIDDEN_MEMBERS.has(name)) continue;
        const kind = propertyKind(object, name);
        if (!kind) continue;
        seen.add(name);
        options.push({ label: name, type: kind, boost: -depth });
      }
      depth += 1;
    }
  }
  instanceCache.set(type, options);
  return options;
}

const staticCache = new WeakMap();

// Own members of a namespace/constructor/custom API object (`Math.`, `Object.`).
function staticOptions(value) {
  if (staticCache.has(value)) return staticCache.get(value);
  const isFunction = typeof value === 'function';
  const options = [];
  for (const name of Object.getOwnPropertyNames(value)) {
    if (!IDENT.test(name) || (isFunction && HIDDEN_STATICS.has(name))) continue;
    const kind = propertyKind(value, name);
    if (!kind) continue;
    options.push({
      label: name,
      type: kind === 'method' && /^[A-Z]/.test(name) ? 'class' : kind,
    });
  }
  staticCache.set(value, options);
  return options;
}

function literalOptions(objectNode, ctx) {
  const options = [];
  for (let property = objectNode.firstChild; property; property = property.nextSibling) {
    if (property.name !== 'Property') continue;
    const id = property.firstChild;
    if (!id || id.name !== 'PropertyDefinition') continue;
    const colon = id.nextSibling;
    const value = colon && colon.name === ':' ? colon.nextSibling : null;
    const isMethod = Boolean(childNamed(property, 'ParamList'))
      || Boolean(value && (value.name === 'ArrowFunction' || value.name === 'FunctionExpression'));
    options.push({ label: ctx.read(id), type: isMethod ? 'method' : 'property', boost: 2 });
  }
  return options;
}

function classOptions(classNode, ctx, wantStatic, visited) {
  if (visited.has(classNode.from)) return [];
  visited.add(classNode.from);

  const options = [];
  const body = childNamed(classNode, 'ClassBody');
  if (body) {
    for (let member = body.firstChild; member; member = member.nextSibling) {
      if (member.name !== 'PropertyDeclaration' && member.name !== 'MethodDeclaration') continue;
      if (Boolean(childNamed(member, 'static')) !== wantStatic) continue;
      const id = childNamed(member, 'PropertyDefinition');
      if (!id) continue;
      const label = ctx.read(id);
      if (label === 'constructor') continue;
      const accessor = childNamed(member, 'get') || childNamed(member, 'set');
      options.push({
        label,
        type: member.name === 'MethodDeclaration' && !accessor ? 'method' : 'property',
        boost: 2,
      });
    }
  }

  if (!wantStatic) {
    let parent = null;
    for (let child = classNode.firstChild; child; child = child.nextSibling) {
      if (child.name === 'extends') parent = child.nextSibling;
    }
    if (parent && parent.name === 'VariableName') {
      const name = ctx.read(parent);
      const declaration = findDeclaration(name, parent, ctx);
      if (declaration && declaration.kind === 'class') {
        options.push(...classOptions(declaration.node, ctx, false, visited).map((option) => ({ ...option, boost: 1 })));
      } else if (!declaration && isBuiltinType(name)) {
        options.push(...instanceOptions(name));
      }
    }
  }
  return options;
}

function dedupe(options) {
  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.label)) return false;
    seen.add(option.label);
    return true;
  });
}

// Turns an inference descriptor into completion options.
function membersOf(descriptor, ctx) {
  switch (descriptor.kind) {
    case 'instance':
      return instanceOptions(descriptor.type);
    case 'object':
      return dedupe([...literalOptions(descriptor.node, ctx), ...instanceOptions('Object')]);
    case 'class':
      return dedupe([...classOptions(descriptor.node, ctx, false, new Set()), ...instanceOptions('Object')]);
    case 'classStatic':
      return dedupe(classOptions(descriptor.node, ctx, true, new Set()));
    case 'value':
      return staticOptions(descriptor.value);
    default:
      return [];
  }
}

module.exports = { membersOf, instanceOptions, staticOptions };
