import { href } from "./router.ts"
import { compile, render } from "./template.ts"
import type { Category, Cheatsheet, UserTemplate } from "./types.ts"
import { slugify } from "./utils.ts"

export interface Hit {
  title: string
  sub: string
  group: string
  href: string
  /** The title is a command, so show it in the mono face. */
  mono: boolean
}

interface Entry extends Hit {
  t: string
  keywords: string
  body: string
  boost: number
}

const entry = (hit: Hit, keywords: string, body: string, boost = 0): Entry => ({
  ...hit,
  t: hit.title.toLowerCase(),
  keywords: keywords.toLowerCase(),
  body: body.toLowerCase(),
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
        },
        "my custom template",
        t.template,
        5
      )
    )
  return out
}

// ponytail: linear substring scan, no typo tolerance. Fine for a few thousand entries;
// swap in MiniSearch or Fuse if the library outgrows that or needs fuzzy matching.
export function search(index: Entry[], query: string, limit = 30): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const scored: [number, Entry][] = []
  for (const e of index) {
    let total = e.boost
    for (const term of terms) {
      const score =
        e.t === term
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
      if (!score) {
        total = 0
        break
      }
      total += score
    }
    if (total) scored.push([total, e])
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].t.length - b[1].t.length)
    .slice(0, limit)
    .map(([, e]) => e)
}
