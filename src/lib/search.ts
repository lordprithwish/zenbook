import { href } from "./router.ts"
import { compile, render } from "./template.ts"
import type { Category, Cheatsheet, UserTemplate } from "./types.ts"
import { slugify } from "./utils.ts"

export type HitKind = "category" | "command" | "sheet" | "line" | "template"

export interface Hit {
  title: string
  sub: string
  group: string
  href: string
  /** The title is a command, so show it in the mono face. */
  mono: boolean
  kind: HitKind
  /** The favorites key, for things that can be favorited: "git/clone", "cheatsheets/ssh", "my/<id>". */
  key?: string
}

interface Entry extends Hit {
  t: string
  keywords: string
  body: string
  /** Distinct words of the title and keywords, for typo tolerance. */
  words: string[]
  boost: number
}

const entry = (hit: Hit, keywords: string, body: string, boost = 0): Entry => ({
  ...hit,
  t: hit.title.toLowerCase(),
  keywords: keywords.toLowerCase(),
  body: body.toLowerCase(),
  words: [
    ...new Set(
      `${hit.title} ${keywords}`
        .toLowerCase()
        .split(/[^a-z0-9_-]+/)
        .filter((w) => w.length > 2)
    ),
  ],
  boost,
})

export function buildIndex(
  categories: Category[],
  cheatsheets: Cheatsheet[],
  templates: UserTemplate[]
): Entry[] {
  const out: Entry[] = []
  for (const cat of categories) {
    out.push(
      entry(
        {
          title: cat.title,
          sub: cat.summary,
          group: "Category",
          href: href(cat.id),
          mono: false,
          kind: "category",
        },
        cat.id,
        cat.intro,
        2
      )
    )
    for (const cmd of cat.commands)
      out.push(
        entry(
          {
            title: cmd.name,
            sub: cmd.summary,
            group: cat.title,
            href: href(cat.id, cmd.id),
            mono: true,
            kind: "command",
            key: `${cat.id}/${cmd.id}`,
          },
          [cat.title, ...(cmd.tags ?? [])].join(" "),
          [
            cmd.summary,
            render(compile(cmd.template, cmd.vars, cmd.lang)).text,
            ...(cmd.flags ?? []).flat(),
            ...(cmd.examples ?? []).flat(),
            ...(cmd.notes ?? []),
            ...(cmd.trouble ?? []).flat(),
            cmd.warn ?? "",
          ].join("\n"),
          5
        )
      )
  }
  for (const sheet of cheatsheets) {
    out.push(
      entry(
        {
          title: sheet.title,
          sub: sheet.summary,
          group: "Cheatsheet",
          href: href("cheatsheets", sheet.id),
          mono: false,
          kind: "sheet",
          key: `cheatsheets/${sheet.id}`,
        },
        "cheatsheet cheat sheet",
        "",
        2
      )
    )
    for (const group of sheet.groups)
      for (const [cmd, desc] of group.rows)
        out.push(
          entry(
            {
              title: render(compile(cmd)).text,
              sub: desc,
              group: sheet.title,
              href: href("cheatsheets", sheet.id, slugify(group.title)),
              mono: true,
              kind: "line",
            },
            group.title,
            desc
          )
        )
  }
  for (const t of templates)
    out.push(
      entry(
        {
          title: t.name,
          sub: t.summary || "Your template",
          group: "My templates",
          href: href("my", t.id),
          mono: true,
          kind: "template",
          key: `my/${t.id}`,
        },
        "my custom template",
        t.template,
        5
      )
    )
  return out
}

/** Words that carry no meaning in a question like "how do I move a file". */
const STOP = new Set(
  "a an the i me my we you to do does how can could what which where's is am are in on of for with from into onto and or it this that all some any want need command commands please".split(
    " "
  )
)

/**
 * Plain words people search with, and the names they stand for. A synonym
 * counts for a little less than the word itself.
 */
const SYNONYMS: Record<string, string[]> = {
  where: ["pwd", "location"],
  location: ["pwd"],
  current: ["pwd"],
  folder: ["directory", "dir"],
  directory: ["folder", "dir"],
  navigate: ["cd"],
  move: ["mv"],
  rename: ["mv"],
  copy: ["cp", "scp", "rsync"],
  duplicate: ["cp"],
  delete: ["rm", "remove"],
  remove: ["rm", "delete"],
  erase: ["rm", "delete"],
  search: ["find", "grep", "rg"],
  find: ["search", "locate", "fd"],
  undo: ["reset", "revert", "restore", "reflog"],
  unstage: ["restore", "reset"],
  discard: ["restore", "clean"],
  download: ["curl", "wget", "pull"],
  upload: ["scp", "rsync", "push"],
  transfer: ["scp", "rsync"],
  zip: ["tar", "archive", "compress"],
  compress: ["tar", "archive"],
  unzip: ["extract", "tar"],
  extract: ["unpack", "tar"],
  permission: ["chmod", "chown"],
  permissions: ["chmod", "chown"],
  process: ["ps", "kill"],
  processes: ["ps"],
  terminate: ["kill"],
  port: ["ss", "nc", "port-forward"],
  ports: ["ss", "nmap"],
  space: ["df", "du"],
  disk: ["df", "du"],
  size: ["du"],
  log: ["logs", "journalctl", "tail"],
  logs: ["log", "journalctl", "tail"],
  service: ["systemctl"],
  schedule: ["cron", "crontab"],
  install: ["apt", "pip", "npm"],
  key: ["ssh-keygen"],
  backup: ["dump", "rsync"],
  container: ["docker"],
  containers: ["docker"],
  pod: ["kubectl"],
  pods: ["kubectl"],
  dns: ["dig"],
  certificate: ["openssl", "tls"],
  cert: ["openssl", "tls"],
  json: ["jq"],
  password: ["openssl rand"],
  replace: ["sed"],
  tunnel: ["forward"],
  firewall: ["ufw"],
  alias: ["aliases", "shorthand", "zsh"],
  aliases: ["alias", "shorthand", "zsh"],
  shortcut: ["shortcuts", "alias", "ctrl"],
  shortcuts: ["shortcut", "alias", "ctrl"],
  shorthand: ["alias", "shortcuts"],
  vi: ["vim"],
  editor: ["vim"],
}

/** True when `a` and `b` are at most `max` edits apart. Swapping two neighbouring letters is one edit. */
function near(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  return d[a.length][b.length] <= max
}

function termScore(e: Entry, term: string) {
  return e.t === term
    ? 100
    : e.t.startsWith(term)
      ? 60
      : ` ${e.t}`.includes(` ${term}`)
        ? 40
        : e.t.includes(term)
          ? 25
          : e.keywords.includes(term)
            ? 12
            : e.body.includes(term)
              ? 4
              : 0
}

/** The best score of a query word, its synonyms, or a near spelling of it. */
function score(e: Entry, term: string) {
  let best = termScore(e, term)
  for (const alt of SYNONYMS[term] ?? [])
    best = Math.max(best, Math.round(termScore(e, alt) * 0.7))
  if (!best && term.length > 3) {
    const max = term.length > 6 ? 2 : 1
    if (e.words.some((w) => near(term, w, max))) best = 8
  }
  return best
}

// ponytail: linear scan with a small thesaurus and edit-distance typo tolerance.
// Fine for a few thousand entries; swap in MiniSearch if the library outgrows that.
/**
 * Rank entries for a query. Plain questions work: filler words are dropped,
 * common words map to command names, and one typo per word is forgiven.
 * With three or more words, an entry may miss one of them.
 * Keys in `favorites` rank higher.
 */
export function search(
  index: Entry[],
  query: string,
  limit = 30,
  favorites?: ReadonlySet<string>
): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const meaningful = words.filter((w) => !STOP.has(w))
  const terms = meaningful.length ? meaningful : words
  const need = terms.length > 2 ? terms.length - 1 : terms.length
  const scored: [matched: number, total: number, e: Entry][] = []
  for (const e of index) {
    let matched = 0
    let missed = 0
    let total = e.boost
    for (const term of terms) {
      const s = score(e, term)
      if (s) {
        matched++
        total += s
      } else if (++missed > terms.length - need) break
    }
    if (matched < need) continue
    if (e.key && favorites?.has(e.key)) total += 20
    scored.push([matched, total, e])
  }
  return scored
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || a[2].t.length - b[2].t.length)
    .slice(0, limit)
    .map(([, , e]) => e)
}
