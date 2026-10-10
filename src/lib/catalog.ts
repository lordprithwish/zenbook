import { categories, cheatsheets } from "../data/index.ts"
import { href } from "./router.ts"
import type { Hit } from "./search.ts"
import type { Cheatsheet, Command, UserTemplate } from "./types.ts"

// Everything that can be favorited, recommended or linked as related, by key:
// "linux/pwd" for a command, "cheatsheets/ssh" for a sheet, "my/<id>" for a template.

export interface Item extends Hit {
  key: string
  kind: "command" | "sheet" | "template"
  catId?: string
  cmd?: Command
  sheet?: Cheatsheet
}

const items = new Map<string, Item>()
for (const cat of categories)
  for (const cmd of cat.commands)
    items.set(`${cat.id}/${cmd.id}`, {
      key: `${cat.id}/${cmd.id}`,
      kind: "command",
      title: cmd.name,
      sub: cmd.summary,
      group: cat.title,
      href: href(cat.id, cmd.id),
      mono: true,
      catId: cat.id,
      cmd,
    })
for (const sheet of cheatsheets)
  items.set(`cheatsheets/${sheet.id}`, {
    key: `cheatsheets/${sheet.id}`,
    kind: "sheet",
    title: sheet.title,
    sub: sheet.summary,
    group: "Cheatsheet",
    href: href("cheatsheets", sheet.id),
    mono: false,
    sheet,
  })

/** Find a command, sheet or one of the user's templates by its key. */
export function lookup(key: string, templates: UserTemplate[] = []) {
  if (!key.startsWith("my/")) return items.get(key)
  const t = templates.find((t) => `my/${t.id}` === key)
  if (!t) return undefined
  const item: Item = {
    key,
    kind: "template",
    title: t.name,
    sub: t.summary || "Your template",
    group: "My templates",
    href: href("my", t.id),
    mono: true,
    catId: "my",
    cmd: { id: t.id, name: t.name, summary: t.summary, template: t.template },
  }
  return item
}

/** "pwd" written in the linux category means "linux/pwd". */
export const refKey = (ref: string, catId: string) =>
  ref.includes("/") ? ref : `${catId}/${ref}`

// Links as written in the data, and the same links read backwards.
const forward = new Map<string, string[]>()
const backward = new Map<string, string[]>()
const add = (map: Map<string, string[]>, from: string, to: string) =>
  map.set(from, [...(map.get(from) ?? []), to])
for (const cat of categories)
  for (const cmd of cat.commands)
    for (const ref of cmd.related ?? []) {
      const from = `${cat.id}/${cmd.id}`
      const to = refKey(ref, cat.id)
      add(forward, from, to)
      add(backward, to, from)
    }

const neighbours = (key: string) => [
  ...new Set([...(forward.get(key) ?? []), ...(backward.get(key) ?? [])]),
]

/** What to show under "Related": the links written for `key` first, then those pointing at it. */
export const related = (key: string, limit = 8): Item[] =>
  neighbours(key)
    .filter((k) => k !== key)
    .flatMap((k) => items.get(k) ?? [])
    .slice(0, limit)

/** Where to start when there is nothing to base a recommendation on. */
export const STARTERS = [
  "linux/pwd",
  "linux/ls",
  "linux/grep",
  "git/status",
  "git/commit",
  "docker/ps",
  "ssh/connect",
  "cheatsheets/shell",
]

/**
 * Commands and sheets linked to the ones in `from` but not in it, the most
 * linked first. Earlier keys in `from` weigh more. Each comes with the key
 * that led to it, to explain the pick.
 */
export function recommend(
  from: string[],
  limit = 6
): { item: Item; via: Item }[] {
  const have = new Set(from)
  const scores = new Map<string, { score: number; via: string }>()
  from.forEach((key, i) => {
    const weight = 1 + 1 / (i + 1)
    for (const k of neighbours(key)) {
      if (have.has(k) || !items.has(k)) continue
      const prev = scores.get(k)
      scores.set(k, {
        score: (prev?.score ?? 0) + weight,
        via: prev?.via ?? key,
      })
    }
  })
  return [...scores]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .flatMap(([k, { via }]) => {
      const item = items.get(k)!
      const from = items.get(via)
      return from ? [{ item, via: from }] : []
    })
}
