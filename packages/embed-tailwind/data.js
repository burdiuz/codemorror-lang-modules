// Categorized Tailwind/twrnc utility class list, generated from small scale
// tables rather than hand-listed one by one — see TODO.md item 6: "Category
// must be data-driven per class, not prefix-derived. Tailwind overloads
// prefixes across categories (`text-lg` is typography, `text-red-500` is
// color, `text-center` is alignment/layout, all starting with `text-`)."
// Web-only categories (grid, filters, tables, SVG) are intentionally omitted
// — this targets the RN-relevant subset twrnc actually implements.

const SPACING_SCALE = [
  '0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8',
  '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44',
  '48', '52', '56', '60', '64', '72', '80', '96',
];

const FRACTIONS = [
  '1/2', '1/3', '2/3', '1/4', '2/4', '3/4', '1/5', '2/5', '3/5', '4/5',
  '1/6', '2/6', '3/6', '4/6', '5/6',
  '1/12', '2/12', '3/12', '4/12', '5/12', '6/12', '7/12', '8/12', '9/12', '10/12', '11/12',
  'full',
];

const COLOR_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow',
  'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet',
  'purple', 'fuchsia', 'pink', 'rose',
];

const COLOR_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const OPACITY_SCALE = ['0', '5', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100'];

const ROUNDED_SIZES = ['none', 'sm', '', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
const ROUNDED_CORNERS = ['t', 'r', 'b', 'l', 'tl', 'tr', 'br', 'bl'];

// class -> category, built up by the add() calls below.
const CLASSES = new Map();

function add(category, ...names) {
  for (const name of names) {
    if (name) CLASSES.set(name, category);
  }
}

function addScaled(category, prefixes, scales) {
  for (const prefix of prefixes) {
    for (const scale of scales) {
      add(category, `${prefix}-${scale}`);
    }
  }
}

// --- Spacing: padding, margin (+ negative), gap, space-between ---
addScaled('spacing', ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py'], SPACING_SCALE);
addScaled('spacing', ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my'], SPACING_SCALE);
for (const prefix of ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my']) {
  for (const scale of SPACING_SCALE) add('spacing', `-${prefix}-${scale}`);
}
addScaled('spacing', ['gap', 'gap-x', 'gap-y'], SPACING_SCALE);
addScaled('spacing', ['space-x', 'space-y'], SPACING_SCALE);
add('spacing', 'space-x-reverse', 'space-y-reverse');

// --- Sizing: width/height (+ min/max), fractions, full/screen/auto ---
const SIZING_PREFIXES = ['w', 'h', 'min-w', 'min-h', 'max-w', 'max-h'];
addScaled('sizing', SIZING_PREFIXES, SPACING_SCALE);
addScaled('sizing', SIZING_PREFIXES, FRACTIONS);
for (const prefix of SIZING_PREFIXES) {
  add('sizing', `${prefix}-auto`, `${prefix}-screen`, `${prefix}-min`, `${prefix}-max`, `${prefix}-fit`);
}

// --- Layout: display, flexbox container/item, alignment, order ---
add('layout', 'flex', 'hidden', 'inline', 'inline-block', 'block');
add('layout', 'flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse');
add('layout', 'flex-wrap', 'flex-wrap-reverse', 'flex-nowrap');
add('layout', 'flex-1', 'flex-auto', 'flex-initial', 'flex-none');
add('layout', 'grow', 'grow-0', 'shrink', 'shrink-0');
addScaled('layout', ['basis'], SPACING_SCALE);
addScaled('layout', ['basis'], FRACTIONS);
add('layout', 'basis-auto');
add('layout', 'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch');
add('layout', 'content-start', 'content-end', 'content-center', 'content-between', 'content-around', 'content-evenly');
add('layout', 'self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline');
add('layout', 'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly');
for (let i = 1; i <= 12; i++) add('layout', `order-${i}`);
add('layout', 'order-first', 'order-last', 'order-none');

// --- Positioning: position, inset/top/right/bottom/left, z-index ---
add('positioning', 'absolute', 'relative', 'static');
addScaled('positioning', ['inset', 'inset-x', 'inset-y', 'top', 'right', 'bottom', 'left'], SPACING_SCALE);
add('positioning', 'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto');

// --- Typography: size/weight/style/align/decoration/transform/spacing ---
add('typography', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl');
add('typography', 'font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black');
add('typography', 'italic', 'not-italic');
add('typography', 'text-left', 'text-center', 'text-right', 'text-justify');
add('typography', 'underline', 'line-through', 'no-underline');
add('typography', 'uppercase', 'lowercase', 'capitalize', 'normal-case');
add('typography', 'tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest');
add('typography', 'leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose');
addScaled('typography', ['leading'], ['3', '4', '5', '6', '7', '8', '9', '10']);

// --- Colors: background/text/border color scales (distinct strings from the
// typography/border families above — e.g. `text-red-500` vs `text-lg`) ---
for (const prefix of ['bg', 'text', 'border']) {
  for (const color of COLOR_NAMES) {
    for (const shade of COLOR_SHADES) add('colors', `${prefix}-${color}-${shade}`);
  }
  add('colors', `${prefix}-black`, `${prefix}-white`, `${prefix}-transparent`, `${prefix}-current`);
}

// --- Borders: width/side/style/radius (border *color* lives in "colors") ---
add('borders', 'border', 'border-0', 'border-2', 'border-4', 'border-8');
for (const side of ['t', 'r', 'b', 'l']) {
  add('borders', `border-${side}`, `border-${side}-0`, `border-${side}-2`, `border-${side}-4`, `border-${side}-8`);
}
add('borders', 'border-solid', 'border-dashed', 'border-dotted');
for (const size of ROUNDED_SIZES) add('borders', size ? `rounded-${size}` : 'rounded');
for (const corner of ROUNDED_CORNERS) {
  for (const size of ROUNDED_SIZES) add('borders', size ? `rounded-${corner}-${size}` : `rounded-${corner}`);
}

// --- Effects: opacity, shadow ---
for (const value of OPACITY_SCALE) add('effects', `opacity-${value}`);
add('effects', 'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none');

/** @type {ReadonlyMap<string, string>} className -> category */
const TAILWIND_CLASSES = CLASSES;

/** Sorted array of all known class names, for completion filtering. */
const TAILWIND_CLASS_NAMES = Array.from(CLASSES.keys()).sort();

/** All category names, in the order documented by TODO.md item 6. */
const TAILWIND_CATEGORIES = ['layout', 'spacing', 'sizing', 'typography', 'colors', 'borders', 'effects', 'positioning'];

module.exports = { TAILWIND_CLASSES, TAILWIND_CLASS_NAMES, TAILWIND_CATEGORIES };
