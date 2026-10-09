import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useState, type KeyboardEvent } from "react"

import { useModal } from "@/components/shell"
import { categories, cheatsheets } from "@/data"
import { href } from "@/lib/router"
import { buildIndex, search, type Hit } from "@/lib/search"
import { useTemplates } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Shown before the user types: the top-level places to go. */
const BROWSE: Hit[] = [
  ...categories.map((cat) => ({
    title: cat.title,
    sub: cat.summary,
    group: "Category",
    href: href(cat.id),
    mono: false,
  })),
  ...cheatsheets.map((sheet) => ({
    title: sheet.title,
    sub: sheet.summary,
    group: "Cheatsheet",
    href: href("cheatsheets", sheet.id),
    mono: false,
  })),
]

/** The content of one result row. Shared with the live search on the landing page. */
export function HitLine({ hit }: { hit: Hit }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate",
            hit.mono
              ? "font-mono text-[13px] font-medium"
              : "text-sm font-semibold"
          )}
        >
          {hit.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {hit.sub}
        </span>
      </span>
      <span className="max-w-[40%] shrink-0 truncate label-mono text-[11px] text-muted-foreground">
        {hit.group}
      </span>
    </>
  )
}

function Panel({ onClose }: { onClose: () => void }) {
  const [templates] = useTemplates()
  const index = useMemo(
    () => buildIndex(categories, cheatsheets, templates),
    [templates]
  )
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const hits = useMemo(
    () => (query.trim() ? search(index, query) : BROWSE),
    [index, query]
  )

  useEffect(() => {
    document
      .getElementById(`hit-${active}`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const step = e.key === "ArrowDown" ? 1 : -1
      setActive((i) =>
        hits.length ? (i + step + hits.length) % hits.length : 0
      )
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault()
      window.location.hash = hits[active].href
      onClose()
    }
  }

  return (
    <div className="flex max-h-[min(70dvh,34rem)] flex-col">
      <div className="flex items-center gap-2.5 border-b px-3.5">
        <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search commands, flags, or a task like “undo commit”"
          role="combobox"
          aria-label="Search Zenbook"
          aria-expanded
          aria-controls="search-results"
          aria-activedescendant={hits[active] ? `hit-${active}` : undefined}
          spellCheck={false}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-sm border px-1.5 font-mono text-[11px] text-muted-foreground">
          esc
        </kbd>
      </div>
      <ul
        id="search-results"
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto p-1.5"
      >
        {hits.map((hit, i) => (
          <li key={hit.href + hit.title} role="presentation">
            <a
              id={`hit-${i}`}
              role="option"
              aria-selected={i === active}
              href={hit.href}
              onClick={onClose}
              onMouseMove={() => setActive(i)}
              className="flex items-baseline gap-3 rounded-md px-2.5 py-2 outline-none aria-selected:bg-muted"
            >
              <HitLine hit={hit} />
            </a>
          </li>
        ))}
        {!hits.length && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nothing matches “{query}”. Try a command name, a flag such as
            --force, or fewer words.
          </li>
        )}
      </ul>
      <p className="hidden gap-4 border-t px-3.5 py-2 label-mono text-[11px] text-muted-foreground sm:flex">
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span className="ml-auto">
          {query.trim()
            ? `${hits.length} results`
            : "Type to search everything"}
        </span>
      </p>
    </div>
  )
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const ref = useModal(open)
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label="Search"
      className="mx-auto mt-[12dvh] mb-auto w-[min(40rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-lg border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/50"
    >
      {/* Mounted only while open, so each search starts fresh. */}
      {open && <Panel onClose={onClose} />}
    </dialog>
  )
}
