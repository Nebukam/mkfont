// ============================================================
// Finds user-facing text written as literals instead of catalog lookups.
//   npm run check:i18n          (also runs in the test suite: src/renderer/src/__tests__/i18n.test.ts)
//
// Flags, in the renderer and main process sources:
//  - JSX text with a letter in it ("<p>No glyphs</p>");
//  - text-like string / template literals given to text attributes and props
//    (aria-label, title, placeholder, tip, label…), to text properties of object
//    literals ({ label: 'Save' }), and to the toast / dialog helpers.
// "Text-like": has a letter and reads as words (a space, a capital, or ending
// punctuation), so ids such as 'all' or 'block' pass.
//
// A literal that must stay (a brand name, a file extension shown as is) takes an
// `i18n-ignore` comment on its line or the line above, with the reason.
// ============================================================

import ts from 'typescript'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

export interface Finding {
  file: string
  line: number
  text: string
  why: string
}

/** Source roots, relative to the repository. */
const ROOTS = ['src/renderer/src', 'src/main', 'src/preload']

/** Not user-facing, or Unicode data (see docs/i18n.md). Paths use forward slashes. */
const EXCLUDE: RegExp[] = [
  /\/__tests__\//,
  /\.test\.tsx?$/,
  /\.d\.ts$/,
  /^src\/renderer\/src\/locales\//,
  /^src\/renderer\/src\/i18n\//,
  /^src\/main\/locales\//,
  /^src\/renderer\/src\/data\//,
  /^src\/renderer\/src\/core\/unicode(-blocks)?\.ts$/,
  /^src\/renderer\/src\/core\/gc-ranges\.ts$/,
  /^src\/renderer\/src\/dev-mock-electron\.ts$/
]

/** JSX attributes and props that carry text. */
const TEXT_ATTR =
  /^(aria-(label|description|valuetext|roledescription|placeholder)|title|placeholder|alt|label|tip|data-tip|hint|description|message|detail|heading|header|caption|text|confirm|cancel|emptyText|empty|subtitle|[a-zA-Z]+(Label|Text|Tip|Title|Message|Hint|Placeholder))$/
/** Object literal properties that carry text. */
const TEXT_PROP =
  /^(label|title|tip|message|detail|description|placeholder|hint|header|heading|caption|text|subtitle|confirmLabel|cancelLabel|okLabel|buttonLabel|emptyText|ariaLabel|aria-label|aria-description|buttons|[a-zA-Z]+(Label|Tip|Title|Message|Hint|Text))$/
/** Calls whose arguments are shown. */
const TEXT_CALL = /^(toast\.(info|success|warning|error|action)|alert|confirm|setTitle|showMessageBox|showErrorBox)$/
/** Calls whose arguments are never shown. */
const SILENT_CALL = /^(console\.\w+|t|i18n\.t|tm|msg|require|import|Error|TypeError|RangeError|log|debug|warn|cn|clsx|querySelector|querySelectorAll|closest|getElementById|addEventListener|removeEventListener|getItem|setItem|matchMedia|createElement|startsWith|endsWith|includes|split|replace|test|match|join|has|get|set|delete|send|invoke|on|once|handle|emit|getPath|setAttribute|getAttribute|removeAttribute)$/

const LETTER = /\p{L}/u

/** A plain word, once quotes, brackets and ending punctuation are off (a colon stays: "lyr:"). */
const isWord = (tok: string): boolean => /^\p{L}{2,}$/u.test(tok.replace(/^[“"‘'(«]+|[”"’')»\].,!?…;]+$/gu, ''))

/** URLs, paths, colours, markup, CSS values, MIME types, shortcut specs. */
function isCodeLike(v: string): boolean {
  // URLs, paths, colours, CSS variables, code point notation.
  if (/^(https?:|mailto:|file:|data:|blob:|\.|\/|#|--|U\+)/.test(v)) return true
  // Markup, attribute selectors, CSS values (fonts, lengths, gradients).
  if (/<[a-z!?][^>]*(\s[\w:-]+=|\/>)|<\/[a-z]|="|\bsans-serif\b|\bsystem-ui\b|\b\d+(px|vh|vw|rem|em)\b|gradient\(/i.test(v)) return true
  if (/^[\w.-]+\/[\w.+-]+$/.test(v)) return true // MIME type
  if (/^(Ctrl|Alt|Shift|Meta|Cmd)\+/.test(v)) return true // shortcut spec
  return false
}

export function isTextLike(s: string): boolean {
  const v = s.trim()
  if (!LETTER.test(v) || isCodeLike(v)) return false
  const tokens = v.split(/\s+/)
  // Ids, keys, path data, transforms, history merge keys ("tr:a:b"): no plain word.
  if (!tokens.some(isWord)) return false
  if (tokens.length === 1) {
    if (/^[a-z]/.test(v) && !/[.!?…]$/.test(v)) return false // id, key, CSS class
    if (/^[a-z][\w-]*(\.[\w-]+)*\.$/.test(v)) return false // catalog key prefix: `commands.${id}`
    if (/^\p{Lu}\p{Ll}*\p{Lu}/u.test(v)) return false // PascalCase identifier, key name (ArrowUp)
    if (/^[A-Z0-9_]+$/.test(v) && v.length <= 4) return false // short codes: OTF, TTF
  } else if (tokens.every((tk) => /^\p{Lu}\p{Ll}+\p{Lu}\w*$/u.test(tk))) return false // key names
  // Tailwind class lists: lowercase tokens, some with a dash or brackets.
  if (/^[a-z!-]/.test(v) && tokens.every((tk) => /^[!a-z0-9[\]:/().%,_#&>*+=-]+$/.test(tk)) && tokens.some((tk) => /[-[\]:/]/.test(tk)) && !/[.!?…]$/.test(v))
    return false
  return true
}

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name)) out.push(p)
  }
}

function calleeName(e: ts.LeftHandSideExpression): string {
  if (ts.isIdentifier(e)) return e.text
  if (ts.isPropertyAccessExpression(e)) {
    const left = ts.isIdentifier(e.expression) ? e.expression.text : ts.isPropertyAccessExpression(e.expression) ? e.expression.name.text : ''
    return left ? `${left}.${e.name.text}` : e.name.text
  }
  return ''
}

function propName(n: ts.PropertyName | ts.JsxAttributeName): string {
  if (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isPrivateIdentifier(n)) return n.text
  if (ts.isJsxNamespacedName(n)) return `${n.namespace.text}:${n.name.text}`
  return ''
}

/** Static text of a literal, or null. Template literals count their fixed parts. */
function literalText(n: ts.Node): string | null {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text
  if (ts.isTemplateExpression(n)) return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ')
  return null
}

/** A template that puts a word beside a value, space between: `${n} glyphs`, `Set ${f} of`. */
function templateHasWords(n: ts.Node): boolean {
  if (!ts.isTemplateExpression(n)) return false
  return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].some((part) => /(^|\s)\p{L}{2,}(\s|$)/u.test(part) && /\s/.test(part))
}

const textLike = (n: ts.Node, text: string): boolean => isTextLike(text) || (templateHasWords(n) && !isCodeLike(text.trim()))

const COMPARE = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.InKeyword
])

/** The literal is an id: compared, a case label, an index, an import, a type. */
function isNonTextPosition(n: ts.Node): boolean {
  const p = n.parent
  if (!p) return false
  if (ts.isBinaryExpression(p) && COMPARE.has(p.operatorToken.kind)) return true
  if (ts.isCaseClause(p) || ts.isElementAccessExpression(p) || ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true
  if (ts.isLiteralTypeNode(p) || ts.isExternalModuleReference(p)) return true
  if (ts.isPropertyAssignment(p) && p.name === n) return true
  return false
}

/** Inside a call that never shows its arguments (console, t, class names…). */
function inSilentCall(n: ts.Node): boolean {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
      const name = calleeName(p.expression)
      if (SILENT_CALL.test(name) || SILENT_CALL.test(name.split('.').pop() ?? '')) return true
    }
    if (ts.isJsxAttribute(p) || ts.isPropertyAssignment(p) || ts.isFunctionLike(p) || ts.isStatement(p)) return false
  }
  return false
}

/** JSX attributes are checked by name (text attributes above; className, d, style… never). */
function inJsxAttribute(n: ts.Node): boolean {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isJsxAttribute(p)) return true
    if (ts.isFunctionLike(p) || ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p)) return false
  }
  return false
}

function ignored(sf: ts.SourceFile, n: ts.Node): boolean {
  const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line
  const lines = sf.text.split('\n')
  return /i18n-ignore/.test(lines[line] ?? '') || /i18n-ignore/.test(lines[line - 1] ?? '')
}

/** Text-like literals anywhere inside `expr` (conditionals, ||, template parts…). */
function textLiterals(expr: ts.Node, cb: (lit: ts.Node, text: string) => void): void {
  const visit = (n: ts.Node): void => {
    // A nested function or JSX element is checked on its own.
    if (ts.isFunctionLike(n) || ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) return
    const text = literalText(n)
    if (text !== null) {
      if (!isNonTextPosition(n) && !inSilentCall(n) && textLike(n, text)) cb(n, text)
      if (!ts.isTemplateExpression(n)) return
    }
    ts.forEachChild(n, visit)
  }
  visit(expr)
}

export function checkSource(file: string, source: string): Finding[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const out: Finding[] = []
  const seen = new Set<ts.Node>()
  const report = (n: ts.Node, text: string, why: string): void => {
    seen.add(n)
    if (ignored(sf, n)) return
    out.push({ file, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, text: text.trim().slice(0, 80), why })
  }
  const visit = (n: ts.Node): void => {
    if (ts.isJsxText(n)) {
      const text = n.text.trim()
      if (LETTER.test(text)) report(n, text, 'JSX text')
    } else if (ts.isJsxAttribute(n) && n.initializer) {
      const name = propName(n.name)
      if (TEXT_ATTR.test(name)) textLiterals(n.initializer, (lit, text) => report(lit, text, `${name}=`))
    } else if (ts.isPropertyAssignment(n)) {
      const name = propName(n.name)
      if (TEXT_PROP.test(name)) textLiterals(n.initializer, (lit, text) => report(lit, text, `${name}:`))
    } else if (ts.isCallExpression(n)) {
      const name = calleeName(n.expression)
      if (TEXT_CALL.test(name)) for (const a of n.arguments) if (!ts.isObjectLiteralExpression(a)) textLiterals(a, (lit, text) => report(lit, text, `${name}()`))
    } else if (literalText(n) !== null && !seen.has(n) && !inJsxAttribute(n)) {
      const text = literalText(n)!
      if (!isNonTextPosition(n) && !inSilentCall(n) && textLike(n, text)) report(n, text, 'literal')
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return out
}

export function checkRepo(root: string): Finding[] {
  const files: string[] = []
  for (const r of ROOTS) walk(join(root, r), files)
  const out: Finding[] = []
  for (const f of files) {
    const rel = relative(root, f).split(sep).join('/')
    if (EXCLUDE.some((x) => x.test(rel))) continue
    out.push(...checkSource(rel, readFileSync(f, 'utf-8')))
  }
  return out
}

// CLI
if (process.argv[1] && /i18n-literals\.ts$/.test(process.argv[1])) {
  const findings = checkRepo(process.cwd())
  for (const f of findings) console.log(`${f.file}:${f.line}  [${f.why}]  ${f.text}`)
  console.log(findings.length ? `\n${findings.length} user-facing literal(s). Move them to src/renderer/src/locales (or src/main/locales).` : 'No user-facing literals.')
  process.exit(findings.length ? 1 : 0)
}
