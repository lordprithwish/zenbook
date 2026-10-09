/**
 * Command template engine. Pure and dependency-free so `pnpm check` can run it in Node.
 *
 * Placeholders:  {{name}}   {{name=default}}   {{name?}} (optional)   \{{ (a literal "{{")
 *
 * A value is never edited. It is only quoted or escaped so the shell (or SQL) reads it
 * as the single value the user typed, and the UI can show when that happened.
 * In "text" templates (config files, cron lines) values are inserted exactly as typed.
 */

export type Lang = "sh" | "sql" | "text"
export type Template = string | string[]

export interface VarDef {
  /** Field label. Defaults to the placeholder name. */
  label?: string
  /** One-line explanation of the argument, shown under the input. */
  hint?: string
  /** Initial value. For a toggle, any non-empty string means on. */
  default?: string
  placeholder?: string
  /** Leave the argument out of the command when the value is empty. */
  optional?: boolean
  /** How the value is written, "{}" being the value: "--depth {}", "-p{}", ":{}". A toggle emits it as is. */
  format?: string
  /** A checkbox that emits `format` when on. */
  toggle?: boolean
  /** A fixed list of choices, written exactly as given. */
  options?: string[]
  /** auto: quote only when needed. always: always single-quote. raw: never touch the value. */
  quote?: "auto" | "always" | "raw"
}

export interface Field {
  name: string
  kind: "text" | "select" | "toggle"
  label: string
  hint?: string
  placeholder?: string
  options?: string[]
  format?: string
  quote: "auto" | "always" | "raw"
  optional: boolean
  default: string
}

/** What the user changed. Untouched fields follow the template defaults. */
export interface Draft {
  values?: Record<string, string>
  /** Names inserted exactly as typed, without quoting. */
  raw?: string[]
}

/** Quote context of a placeholder: bare, inside '...', or inside "...". */
type Ctx = "" | "'" | '"'
type Tok = string | { name: string; ctx: Ctx }
interface Line {
  indent: string
  toks: Tok[]
}

export interface Compiled {
  lines: Line[]
  fields: Field[]
  lang: Lang
}

export interface Seg {
  kind: "text" | "value" | "missing"
  text: string
  name?: string
}

export interface Rendered {
  segs: Seg[]
  text: string
  /** Required fields that are still empty. */
  missing: string[]
  /** Fields whose value had to be quoted or escaped. */
  quoted: string[]
}

const PLACEHOLDER =
  /\\(\{\{)|\{\{\s*([A-Za-z_][\w-]*)\s*(\?)?\s*(?:=([^{}]*?))?\s*\}\}/g
// Characters no shell treats specially. A leading "=" is excluded: zsh expands =name to a command path.
const SAFE = /^[\w@%+:,./-][\w@%+=:,./-]*$/

const single = (v: string) => `'${v.replace(/'/g, `'\\''`)}'`

/** Quote one shell argument. A leading ~ or ~/ stays outside the quotes so it still expands. */
export function quote(value: string, always = false): string {
  if (always) return single(value)
  const home = /^~(\/|$)/.exec(value)?.[0] ?? ""
  const rest = value.slice(home.length)
  if (home && !rest) return home
  return home + (SAFE.test(rest) ? rest : single(rest))
}

function protect(value: string, ctx: Ctx, lang: Lang, always: boolean) {
  if (lang === "text") return value
  const sql = lang === "sql"
  if (ctx === "'") return value.replace(/'/g, sql ? "''" : `'\\''`)
  if (ctx === '"')
    return sql ? value.replace(/"/g, '""') : value.replace(/[\\"$`]/g, "\\$&")
  return sql ? value : quote(value, always)
}

export function compile(
  template: Template,
  vars: Record<string, VarDef> = {},
  lang: Lang = "sh"
): Compiled {
  const sql = lang === "sql"
  const inline = new Map<string, { optional?: boolean; default?: string }>()

  // Track whether we are inside quotes, so a placeholder there is escaped instead of wrapped.
  let ctx: Ctx = ""
  let escaped = false
  let comment = false
  let prev = " "
  const scan = (text: string) => {
    if (lang === "text") return
    for (const ch of text) {
      if (comment) continue
      if (escaped) escaped = false
      else if (ctx === "'") ctx = ch === "'" ? "" : ctx
      else if (ch === "\\" && !sql) escaped = true
      else if (ctx === '"') ctx = ch === '"' ? "" : ctx
      else if (ch === "'" || ch === '"') ctx = ch
      else if (ch === "#" && !sql && /\s/.test(prev)) comment = true
      prev = ch
    }
  }

  const source = Array.isArray(template) ? template : template.split("\n")
  const lines = source.map((raw): Line => {
    const indent = /^[ \t]*/.exec(raw)![0]
    const toks: Tok[] = []
    const push = (text: string) => {
      if (!text) return
      scan(text)
      const last = toks.length - 1
      if (typeof toks[last] === "string") toks[last] += text
      else toks.push(text)
    }
    let at = indent.length
    for (const m of raw.matchAll(PLACEHOLDER)) {
      push(raw.slice(at, m.index))
      at = m.index + m[0].length
      if (m[1]) {
        push(m[1])
        continue
      }
      if (!inline.has(m[2]))
        inline.set(m[2], { optional: m[3] ? true : undefined, default: m[4] })
      toks.push({ name: m[2], ctx })
      prev = "x"
    }
    push(raw.slice(at))
    // A new line ends a comment and a trailing backslash. Quotes may span lines.
    comment = false
    escaped = false
    prev = " "
    return { indent, toks }
  })

  // Fields follow the order of `vars` (the author's order), then any undeclared placeholders.
  const names = new Set([
    ...Object.keys(vars).filter((n) => inline.has(n)),
    ...inline.keys(),
  ])
  const fields = [...names].map((name): Field => {
    const def = vars[name] ?? {}
    const found = inline.get(name)!
    const kind = def.options ? "select" : def.toggle ? "toggle" : "text"
    const optional = def.optional ?? found.optional ?? kind === "toggle"
    const label = def.label ?? name.replace(/[_-]+/g, " ")
    return {
      name,
      kind,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      hint: def.hint,
      placeholder: def.placeholder,
      options: def.options,
      format: def.format,
      quote: def.quote ?? "auto",
      optional,
      default:
        def.default ??
        found.default ??
        (kind === "select" && !optional ? def.options![0] : ""),
    }
  })

  return { lines, fields, lang }
}

export const valueOf = (field: Field, draft: Draft) =>
  draft.values?.[field.name] ?? field.default

const placeholder = (f: Field) =>
  f.kind === "toggle"
    ? (f.format ?? "")
    : (f.format ?? "{}").replace("{}", () => `<${f.name}>`)

export function render(c: Compiled, draft: Draft = {}): Rendered {
  const byName = new Map(c.fields.map((f) => [f.name, f]))
  const missing = new Set<string>()
  const quoted = new Set<string>()
  const kept: Seg[][] = []
  let droppedTail = false

  for (const line of c.lines) {
    const segs: Seg[] = []
    let vars = 0
    let shown = 0
    let trimNext = false

    for (const tok of line.toks) {
      if (typeof tok === "string") {
        const text = trimNext ? tok.replace(/^[ \t]+/, "") : tok
        trimNext = false
        if (text) segs.push({ kind: "text", text })
        continue
      }
      vars++
      const f = byName.get(tok.name)!
      const value = valueOf(f, draft)
      let text: string | null = null
      if (f.kind === "toggle") text = value && f.format ? f.format : null
      else if (value !== "") {
        const verbatim =
          f.kind === "select" ||
          f.quote === "raw" ||
          !!draft.raw?.includes(f.name)
        const v = verbatim
          ? value
          : protect(value, tok.ctx, c.lang, f.quote === "always")
        if (v !== value) quoted.add(f.name)
        // A function replacer, so "$&" and friends in a value are not treated as patterns.
        text = f.format ? f.format.replace("{}", () => v) : v
      }

      if (text !== null) {
        shown++
        segs.push({ kind: "value", text, name: f.name })
      } else if (!f.optional) {
        shown++
        missing.add(f.name)
        segs.push({ kind: "missing", text: placeholder(f), name: f.name })
      } else {
        // Omitted: also drop the whitespace before it, or after it at the start of a line.
        const last = segs[segs.length - 1]
        if (last?.kind === "text") {
          last.text = last.text.replace(/[ \t]+$/, "")
          if (!last.text) segs.pop()
        }
        if (!segs.length) trimNext = true
      }
    }

    // A line whose placeholders were all omitted, with nothing else on it, disappears.
    const rest = segs.map((s) => s.text).join("")
    if (vars && !shown && /^[\s\\]*$/.test(rest)) {
      droppedTail = true
      continue
    }
    droppedTail = false
    if (line.indent) segs.unshift({ kind: "text", text: line.indent })
    kept.push(segs)
  }

  // If the last lines were dropped, the line before them must not end in a continuation.
  const tail = kept[kept.length - 1]?.at(-1)
  if (droppedTail && tail?.kind === "text")
    tail.text = tail.text.replace(/[ \t]*\\$/, "")

  const segs: Seg[] = []
  kept.forEach((line, i) => {
    for (const seg of i
      ? [{ kind: "text", text: "\n" } as Seg, ...line]
      : line) {
      const last = segs[segs.length - 1]
      if (seg.kind === "text" && last?.kind === "text") last.text += seg.text
      else if (seg.text) segs.push({ ...seg })
    }
  })

  return {
    segs,
    text: segs.map((s) => s.text).join(""),
    missing: [...missing],
    quoted: [...quoted],
  }
}

/** The readable form: `git clone [--depth <depth>] <url> [<dir>]`. */
export function templateText(c: Compiled): string {
  const byName = new Map(c.fields.map((f) => [f.name, f]))
  return c.lines
    .map(
      (line) =>
        line.indent +
        line.toks
          .map((tok) => {
            if (typeof tok === "string") return tok
            const f = byName.get(tok.name)!
            return f.optional ? `[${placeholder(f)}]` : placeholder(f)
          })
          .join("")
    )
    .join("\n")
}

export const isModified = (c: Compiled, draft: Draft) =>
  !!draft.raw?.length || c.fields.some((f) => valueOf(f, draft) !== f.default)

/** Every value spelled out, so a saved preset does not shift if a default changes later. */
export const snapshot = (c: Compiled, draft: Draft): Draft => ({
  values: Object.fromEntries(c.fields.map((f) => [f.name, valueOf(f, draft)])),
  raw: draft.raw?.filter((n) => c.fields.some((f) => f.name === n)) ?? [],
})
