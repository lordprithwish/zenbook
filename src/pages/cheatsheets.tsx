import {
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { useState } from "react"

import { Fields, useBuilder } from "@/components/builder"
import { CommandLine, CopyButton } from "@/components/code"
import { Page, Section } from "@/components/shell"
import { Button } from "@/components/ui/button"
import { cheatsheets } from "@/data"
import { href } from "@/lib/router"
import type { Cheatsheet } from "@/lib/types"
import { cn, slugify } from "@/lib/utils"

type Row = Cheatsheet["groups"][number]["rows"][number]

/** One line of a cheatsheet. Lines with placeholders can be edited in place. */
export function CheatRow({ row: [template, desc, danger] }: { row: Row }) {
  // Keyed by the line itself, so edits survive reordering the sheet.
  const key = `cheat/${template}`
  const b = useBuilder(key, { template })
  const [editing, setEditing] = useState(false)
  return (
    <li className="-mx-2 rounded-md px-2 hover:bg-muted/40">
      <div className="flex items-start gap-0.5">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-0.5 py-2 md:grid-cols-2">
          <code className="font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">
            <CommandLine segs={b.out.segs} />
          </code>
          <span className="text-sm text-muted-foreground">
            {danger && (
              <WarningIcon
                weight="fill"
                aria-label="Destructive:"
                className="mr-1.5 inline size-3.5 -translate-y-px text-destructive"
              />
            )}
            {desc}
          </span>
        </div>
        {b.compiled.fields.length > 0 ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={editing}
            aria-label="Edit the values in this line"
            title="Edit values"
            className={cn("mt-0.5", b.modified && "text-link")}
            onClick={() => setEditing(!editing)}
          >
            <SlidersHorizontalIcon />
          </Button>
        ) : (
          <span className="size-8 shrink-0" />
        )}
        <CopyButton
          text={b.out.text}
          label="Copy this line"
          className="mt-0.5"
          disabled={b.out.missing.length > 0}
        />
      </div>
      {editing && (
        <div className="mb-3 flex flex-col gap-3 rounded-lg border bg-background p-3">
          <Fields b={b} id={slugify(key)} />
          <Button
            variant="ghost"
            size="xs"
            className="self-start label-mono"
            disabled={!b.modified}
            onClick={b.reset}
          >
            Reset to defaults
          </Button>
        </div>
      )}
    </li>
  )
}

export function CheatsheetPage({ sheet }: { sheet: Cheatsheet }) {
  const [filter, setFilter] = useState("")
  const terms = filter.toLowerCase().split(/\s+/).filter(Boolean)
  const groups = sheet.groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter(([cmd, desc]) =>
        terms.every((term) => `${cmd} ${desc}`.toLowerCase().includes(term))
      ),
    }))
    .filter((group) => group.rows.length)

  return (
    <Page
      path={[["cheatsheets", href("cheatsheets")], [sheet.id]]}
      title={sheet.title}
      lead={sheet.summary}
      toc={sheet.groups.map((group) => ({
        label: group.title,
        to: href("cheatsheets", sheet.id, slugify(group.title)),
      }))}
    >
      <label className="relative block max-w-sm">
        <span className="sr-only">Filter this sheet</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter this sheet"
          spellCheck={false}
          className="h-9 w-full rounded-md border border-input bg-background pr-2.5 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      {groups.map((group) => (
        <Section
          key={group.title}
          id={slugify(group.title)}
          title={group.title}
        >
          <ul className="flex flex-col">
            {group.rows.map((row) => (
              <CheatRow key={row[0]} row={row} />
            ))}
          </ul>
        </Section>
      ))}
      {!groups.length && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
          No line on this sheet matches “{filter}”. Press / to search the whole
          library instead.
        </p>
      )}
    </Page>
  )
}

export function CheatsheetsPage() {
  return (
    <Page
      path={[["cheatsheets"]]}
      title="Cheatsheets"
      lead="Compact pages for the commands and workflows you reach for most. Every line copies with one click, and lines with values can be edited in place."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {cheatsheets.map((sheet) => (
          <li key={sheet.id}>
            <a
              href={href("cheatsheets", sheet.id)}
              className="flex h-full flex-col gap-1.5 rounded-lg border p-4 outline-none hover:border-link/50 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-semibold">{sheet.title}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                {sheet.summary}
              </span>
              <span className="mt-auto pt-2 label-mono text-xs text-muted-foreground">
                {sheet.groups.reduce((n, group) => n + group.rows.length, 0)}{" "}
                lines in {sheet.groups.length} groups
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  )
}
