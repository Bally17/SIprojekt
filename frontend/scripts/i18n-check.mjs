// scripts/i18n-check.mjs
// Node 18+ (ESM). Potrebuje: glob, @babel/parser, @babel/traverse
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import * as babel from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = typeof traverseModule === "function" ? traverseModule : traverseModule.default;

// === CONFIG ===
const ROOT = process.cwd();
const LANGS = ["sk", "en"];
const LOCALES_DIR = path.join(ROOT, "src", "shared", "i18n", "locales");
const SRC_GLOB = ["src/**/*.{ts,tsx,js,jsx}"];
const IGNORE_GLOB = [
  "**/node_modules/**",
  "frontend/.next/**",
  "**/dist/**",
  "**/build/**",
  "src/app/helpers/page.tsx",
];
// Ak v kóde voláš t('key') bez namespace, doplní sa DEFAULT_NS[0]
const DEFAULT_NS = ["common"];

// Allowlist pre kľúče, ktoré môžu byť „nepoužité“
const ALLOW_UNUSED = new Set([
  // "brand.logoLetter",
]);

// === Hardcoded text scan ===
const IGNORE_TAGS = new Set(["style", "script"]);
const MUST_LOCALIZE_ATTRS = new Set([
  "aria-label",
  "title",
  "placeholder",
  // "alt",
  // "label",
]);
const LETTER_RE = /[A-Za-zÀ-ž]/;
const ONLY_SYMS_OR_WS = /^[\s.,;:!?()[\]{}<>'"@#$%^&*+=/\\|-]+$/;

// === helpers ===
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const flatten = (obj, prefix = "") => {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
};

// Načíta všetky namespaces v jazyku a vráti mapu { nsName: json }
const loadLangNamespaces = (lang) => {
  const langDir = path.join(LOCALES_DIR, lang);
  if (!fs.existsSync(langDir)) throw new Error(`Locales directory for '${lang}' not found: ${langDir}`);
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json")).sort();
  const map = {};
  for (const f of files) {
    const ns = path.basename(f, ".json"); // 'common', 'auth', ...
    map[ns] = readJson(path.join(langDir, f));
  }
  return map;
};

// Prefxuje kľúče názvom namespace → 'common.save', 'auth.login'
const namespacedKeys = (nsMap) =>
  Object.entries(nsMap).flatMap(([ns, json]) => flatten(json).map((k) => `${ns}.${k}`));
const toSet = (arr) => new Set(arr);

// === Load locales ===
const locales = {};
for (const lang of LANGS) locales[lang] = loadLangNamespaces(lang);
const keysByLang = {};
for (const lang of LANGS) keysByLang[lang] = namespacedKeys(locales[lang]);
const setsByLang = {};
for (const lang of LANGS) setsByLang[lang] = toSet(keysByLang[lang]);

// === Parse source & collect used keys ===
let files = [];
for (const pat of SRC_GLOB) {
  const found = globSync(pat, { ignore: IGNORE_GLOB }) || [];
  files = files.concat(found);
}
const usedKeys = new Set();
const hardcoded = [];

// Zachytíme rôzne vzory návratu z useLocalization()
const tVars = new Set(["t"]);   // pre t('x.y')
const msgsVars = new Set();     // premenne, ktoré držia 'msgs' (napr. msgs, m)
const i18nVars = new Set();     // premenne, ktoré držia celý návrat z hooku (napr. i18n)

// Pomocná funkcia: pridá kľúč; ak je bez namespace, doplní DEFAULT_NS[0]
const addKey = (key) => {
  if (!key || typeof key !== "string") return;
  if (key.includes(".")) usedKeys.add(key);
  else if (DEFAULT_NS[0]) usedKeys.add(`${DEFAULT_NS[0]}.${key}`);
  else usedKeys.add(key);
};

// util: zistí i18n-ignore na node/rodičovi
const hasI18nIgnore = (path) => {
  const check = (n) =>
    n?.leadingComments?.some((c) => /i18n-ignore/.test(c.value)) ||
    n?.trailingComments?.some((c) => /i18n-ignore/.test(c.value));
  return check(path.node) || check(path.parentPath?.node) || check(path.findParent((p) => p.isJSXElement())?.node);
};

// helper: zloží kľúč z MemberExpression chainu typu msgs.auth.success alebo i18n.msgs.auth.success
function extractMsgsKeyFromMember(node) {
  let cur = node;
  const parts = [];
  while (cur && (cur.type === "MemberExpression" || cur.type === "OptionalMemberExpression")) {
    const prop = cur.property;
    if (prop?.type === "Identifier") parts.unshift(prop.name);
    else if (prop?.type === "StringLiteral") parts.unshift(prop.value);
    else return null; // dynamický index – preskoč
    cur = cur.object;
  }
  if (!cur) return null;

  // base je buď ident zo zoznamu msgsVars (priame msgs) alebo i18nVar + .msgs
  if (cur.type === "Identifier" && msgsVars.has(cur.name)) {
    return parts.join(".");
  }
  if (cur.type === "MemberExpression" || cur.type === "OptionalMemberExpression") {
    const right = cur.property;
    const left = cur.object;
    if (right?.type === "Identifier" && right.name === "msgs" && left?.type === "Identifier" && i18nVars.has(left.name)) {
      return parts.join(".");
    }
  }
  return null;
}

// univerzálny helper: vyťahuje i18n kľúče z ľubovoľného výrazu (ternár, ??, ||, volanie, ...)
function collectKeysFromExpr(expr) {
  if (!expr) return;
  const isMem = (n) => n && (n.type === "MemberExpression" || n.type === "OptionalMemberExpression");

  if (isMem(expr)) {
    const k = extractMsgsKeyFromMember(expr);
    if (k) addKey(k);
    return;
  }

  if (expr.type === "CallExpression") {
    const cal = expr.callee;
    if (isMem(cal)) {
      const base = cal.object || cal;
      const k = extractMsgsKeyFromMember(base);
      if (k) addKey(k);
    }
    for (const a of expr.arguments || []) collectKeysFromExpr(a);
    return;
  }

  if (expr.type === "ConditionalExpression") {
    collectKeysFromExpr(expr.consequent);
    collectKeysFromExpr(expr.alternate);
    return;
  }

  if (expr.type === "LogicalExpression" || expr.type === "BinaryExpression" /* includes '??' in parser */) {
    collectKeysFromExpr(expr.left);
    collectKeysFromExpr(expr.right);
    return;
  }

  if (expr.type === "ArrayExpression") {
    for (const el of expr.elements) collectKeysFromExpr(el);
    return;
  }

  if (expr.type === "ObjectExpression") {
    for (const p of expr.properties) {
      if (p.type === "ObjectProperty") collectKeysFromExpr(p.value);
    }
    return;
  }
}

const parse = (code, filename) =>
  babel.parse(code, {
    sourceType: "module",
    plugins: [
      "typescript",
      "jsx",
      ["decorators", { decoratorsBeforeExport: true }],
      "classProperties",
      "classPrivateProperties",
    ],
    errorRecovery: true,
    sourceFilename: filename,
    ranges: true,
  });

for (const f of files) {
  let code = "";
  try {
    code = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  let ast;
  try {
    ast = parse(code, f);
  } catch (e) {
    console.warn(`⚠️  Parse failed for ${f}: ${e.message}`);
    continue;
  }

  traverse(ast, {
    // const t = useLocalization();
    // const i18n = useLocalization();
    // const { msgs } = useLocalization();
    VariableDeclarator(path) {
      const init = path.node.init;

      // zachyť i18n kľúče už v initializéroch (useState(msgs.auth.checking), atď.)
      if (init) collectKeysFromExpr(init);

      if (
        init &&
        init.type === "CallExpression" &&
        init.callee.type === "Identifier" &&
        init.callee.name === "useLocalization"
      ) {
        const id = path.node.id;
        // const something = useLocalization();
        if (id?.type === "Identifier") {
          i18nVars.add(id.name);
        }
        // const { msgs, t: tt } = useLocalization();
        if (id?.type === "ObjectPattern") {
          for (const prop of id.properties) {
            if (prop.type !== "ObjectProperty") continue;
            const keyName = prop.key.type === "Identifier" ? prop.key.name : null;
            if (!keyName) continue;
            const local = prop.value.type === "Identifier" ? prop.value.name : null;
            if (!local) continue;
            if (keyName === "msgs") msgsVars.add(local);
            if (keyName === "t") tVars.add(local);
          }
        }
      }
    },

    CallExpression(path) {
      const callee = path.node.callee;

      // univerzálne: prejdi argumenty (zachytí nullish/ternár/msgs.*)
      for (const a of path.node.arguments || []) collectKeysFromExpr(a);

      // Priame volanie: useLocalization("ns.key") – ak by si mal
      if (callee.type === "Identifier" && callee.name === "useLocalization") {
        const arg = path.node.arguments?.[0];
        if (arg?.type === "StringLiteral") addKey(arg.value);
      }

      // t("ns.key")
      if (callee.type === "Identifier" && tVars.has(callee.name)) {
        const arg = path.node.arguments?.[0];
        if (arg?.type === "StringLiteral") addKey(arg.value);
        if (arg && (arg.type === "MemberExpression" || arg.type === "OptionalMemberExpression")) {
          const k = extractMsgsKeyFromMember(arg);
          if (k) addKey(k);
        }
      }

      // t.something?.("ns.key")
      if (callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression") {
        const obj = callee.object;
        if (obj?.type === "Identifier" && tVars.has(obj.name)) {
          const arg = path.node.arguments?.[0];
          if (arg?.type === "StringLiteral") addKey(arg.value);
          if (arg && (arg.type === "MemberExpression" || arg.type === "OptionalMemberExpression")) {
            const k = extractMsgsKeyFromMember(arg);
            if (k) addKey(k);
          }
        }
      }

      // msgs.common.x.y.replace(...) – zober base objekt
      if (callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression") {
        const base = callee.object;
        if (base && (base.type === "MemberExpression" || base.type === "OptionalMemberExpression")) {
          const k = extractMsgsKeyFromMember(base);
          if (k) addKey(k);
        }
      }
    },

    // JSX expressiony
    JSXExpressionContainer(path) {
      if (hasI18nIgnore(path)) return;
      const expr = path.node.expression;

      // všeobecná extrakcia (msgs.*, ternár, nullish, metódy na preklade, ...)
      collectKeysFromExpr(expr);

      // string literály v JSX – hardcoded warning
      if (expr?.type === "StringLiteral") {
        const text = String(expr.value).trim();
        if (text && LETTER_RE.test(text) && !ONLY_SYMS_OR_WS.test(text)) {
          const { line, column } = path.node.loc.start;
          hardcoded.push({ file: f, line, column, text, tag: "@expr" });
        }
      }
    },

    // Hardcoded JSX text <p>ahoj</p>
    JSXText(path) {
      if (hasI18nIgnore(path)) return;
      const raw = path.node.value;
      const text = raw.replace(/\s+/g, " ").trim();
      if (!text) return;
      if (ONLY_SYMS_OR_WS.test(text)) return;
      if (!LETTER_RE.test(text)) return;

      const el = path.findParent((p) => p.isJSXElement())?.node;
      const name = el?.openingElement?.name;
      const tag =
        name?.type === "JSXIdentifier"
          ? name.name
          : name?.type === "JSXMemberExpression"
          ? `${name.object.name}.${name.property.name}`
          : "Unknown";

      if (IGNORE_TAGS.has(tag)) return;

      const { line, column } = path.node.loc.start;
      hardcoded.push({ file: f, line, column, text, tag });
    },

    // Hardcoded strings v props (placeholder, title, aria-label, …)
    JSXAttribute(path) {
      if (hasI18nIgnore(path)) return;
      const name = path.node.name;
      const attr = name.type === "JSXIdentifier" ? name.name : null;
      if (!attr || !MUST_LOCALIZE_ATTRS.has(attr)) return;

      const val = path.node.value;
      if (val?.type === "StringLiteral") {
        const text = val.value.trim();
        if (text && LETTER_RE.test(text) && !ONLY_SYMS_OR_WS.test(text)) {
          const { line, column } = path.node.loc.start;
          hardcoded.push({ file: f, line, column, text: `${attr}="${text}"`, tag: `@attr` });
        }
      }
      if (val?.type === "JSXExpressionContainer") {
        // prebehnúť aj ternár/msgs.* vo vnútri atribútu
        collectKeysFromExpr(val.expression);
        // a zároveň zachytiť priamo hardcoded string
        if (val.expression?.type === "StringLiteral") {
          const s = val.expression.value.trim();
          if (s && LETTER_RE.test(s) && !ONLY_SYMS_OR_WS.test(s)) {
            const { line, column } = path.node.loc.start;
            hardcoded.push({ file: f, line, column, text: `${attr}={"${s}"}`, tag: `@attr` });
          }
        }
      }
    },
  });
}

// === Comparisons ===
const [A, B] = LANGS; // sk, en
const setA = setsByLang[A];
const setB = setsByLang[B];

const missingInA = [...usedKeys].filter((k) => !setA.has(k));
const missingInB = [...usedKeys].filter((k) => !setB.has(k));

const shapeOnlyA = [...setA].filter((k) => !setB.has(k));
const shapeOnlyB = [...setB].filter((k) => !setA.has(k));

const unusedInA = [...setA].filter((k) => !usedKeys.has(k) && !ALLOW_UNUSED.has(k));
const unusedInB = [...setB].filter((k) => !usedKeys.has(k) && !ALLOW_UNUSED.has(k));

// === Report ===
const printGroup = (title, arr) => {
  if (!arr.length) return;
  console.log(`\n❌ ${title} (${arr.length})`);
  for (const k of arr.sort ? arr.sort() : arr) console.log(" -", k);
};

console.log("🔎 i18n check");
console.log(`• scanned files: ${files.length}`);
console.log(`• used keys:     ${usedKeys.size}`);
for (const lang of LANGS) console.log(`• ${lang} keys:     ${keysByLang[lang].length}`);

let hasError = false;
const failIf = (arr) => arr.length && (hasError = true);

// Chýbajúce preklady (používa sa v kóde, ale nie je v locale)
printGroup(`Missing in ${A} (used but not translated)`, missingInA); failIf(missingInA);
printGroup(`Missing in ${B} (used but not translated)`, missingInB); failIf(missingInB);

// Rozdielny tvar medzi jazykmi (kľúč existuje len v jednom)
printGroup(`Shape mismatch: present in ${A} only`, shapeOnlyA); failIf(shapeOnlyA);
printGroup(`Shape mismatch: present in ${B} only`, shapeOnlyB); failIf(shapeOnlyB);

// Nepoužívané kľúče
printGroup(`Unused in ${A}`, unusedInA); failIf(unusedInA);
printGroup(`Unused in ${B}`, unusedInB); failIf(unusedInB);

// Hardcoded texty
if (hardcoded.length) {
  hasError = true;
  console.log(`\n❌ Hardcoded JSX text found (${hardcoded.length})`);
  for (const h of hardcoded) {
    console.log(` - ${h.file}:${h.line}:${h.column}  ${h.tag}  ->  "${h.text}"`);
  }
  console.log("   (Add i18n key or use comment /* i18n-ignore */ to suppress)");
}

if (hasError) {
  console.error("\n❌ i18n check failed.\n");
  process.exit(1);
} else {
  console.log("\n✅ i18n check passed.\n");
}
