import { MagnifyingGlassIcon, StarIcon } from "@phosphor-icons/react"
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react"

import { useModal } from "@/components/shell"
import { categories, cheatsheets } from "@/data"
import { lookup } from "@/lib/catalog"
import { href } from "@/lib/router"
import { buildIndex, search, type Hit } from "@/lib/search"
import { useFavorites, useRecent, useTemplates } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Shown before the user types: the top-level places to go. */
const BROWSE: Hit[] = [
  ...categories.map((cat) => ({
    title: cat.title,
    sub: cat.summary,
    group: "Category",
    href: href(cat.id),
    mono: false,
    kind: "category" as const,
  })),
  ...cheatsheets.map((sheet) => ({
    title: sheet.title,
    sub: sheet.summary,
    group: "Cheatsheet",
    href: href("cheatsheets", sheet.id),
    mono: false,
    kind: "sheet" as const,
    key: `cheatsheets/${sheet.id}`,
  })),
]

type Scope = "all" | "commands" | "sheets" | "favorites"

const SCOPES: [
  scope: Scope,
  label: string,
  keep: (hit: Hit, favorites: ReadonlySet<string>) => boolean,
][] = [
  ["all", "All", () => true],
  [
    "commands",
    "Commands",
    (h) => h.kind === "command" || h.kind === "template",
  ],
  ["sheets", "Cheatsheets", (h) => h.kind === "sheet" || h.kind === "line"],
  ["favorites", "Favorites", (h, favs) => !!h.key && favs.has(h.key)],
]

/** The content of one result row. Shared with the live search on the landing page. */
export function HitLine({ hit, starred }: { hit: Hit; starred?: boolean }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "flex items-center gap-1.5 truncate",
            hit.mono
              ? "font-mono text-[13px] font-medium"
              : "text-sm font-semibold"
          )}
        >
          <span className="truncate">{hit.title}</span>
          {starred && (
            <StarIcon
              weight="fill"
              aria-label="Favorite"
              className="size-3 shrink-0 text-tok-var"
            />
          )}
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
  const [favorites] = useFavorites()
  const [recent] = useRecent()
  const index = useMemo(
    () => buildIndex(categories, cheatsheets, templates),
    [templates]
  )
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<Scope>("all")
  const [active, setActive] = useState(0)
  const favs = useMemo(() => new Set(favorites), [favorites])

  const ranked = useMemo(
    () => (query.trim() ? search(index, query, 300, favs) : []),
    [index, query, favs]
  )

  // With a query: one ranked list. Without: favorites, then recent, then places to browse.
  const keep = SCOPES.find(([id]) => id === scope)![2]
  const only = (list: Hit[]) => list.filter((h) => keep(h, favs))
  const resolve = (keys: string[]) =>
    keys.flatMap((key) => lookup(key, templates) ?? [])
  const sections: [heading: string, hits: Hit[]][] = (
    query.trim()
      ? [["", only(ranked).slice(0, 30)]]
      : [
          ["Favorites", only(resolve([...favorites].reverse()))],
          [
            "Recent",
            only(resolve(recent.filter((k) => !favs.has(k)))).slice(0, 5),
          ],
          ["Browse", only(BROWSE)],
        ]
  ).filter(([heading, list]) => !heading || list.length) as [string, Hit[]][]
  const hits = sections.flatMap(([, list]) => list)

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
          placeholder="Search commands, flags, or ask: “how do I rename a file”"
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
      <div
        role="group"
        aria-label="Search in"
        className="flex shrink-0 gap-1 overflow-x-auto border-b px-2.5 py-1.5 label-mono text-xs"
      >
        {SCOPES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={scope === id}
            // Keep the focus in the search box.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setScope(id)
              setActive(0)
            }}
            className="shrink-0 rounded-sm px-2 py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>
      <ul
        id="search-results"
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto p-1.5"
      >
        {sections.map(([heading, list], s) => {
          const start = sections
            .slice(0, s)
            .reduce((n, [, prev]) => n + prev.length, 0)
          return (
            <Fragment key={heading || "results"}>
              {heading && (
                <li
                  role="presentation"
                  className="px-2.5 pt-2.5 pb-1 label-mono text-[11px] text-muted-foreground"
                >
                  {heading}
                </li>
              )}
              {list.map((hit, n) => {
                const i = start + n
                return (
                  <li key={heading + hit.href + hit.title} role="presentation">
                    <a
                      id={`hit-${i}`}
                      role="option"
                      aria-selected={i === active}
                      href={hit.href}
                      onClick={onClose}
                      onMouseMove={() => setActive(i)}
                      className="flex items-baseline gap-3 rounded-md px-2.5 py-2 outline-none aria-selected:bg-muted"
                    >
                      <HitLine
                        hit={hit}
                        starred={!!hit.key && favs.has(hit.key)}
                      />
                    </a>
                  </li>
                )
              })}
            </Fragment>
          )
        })}
        {!hits.length && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            {scope === "favorites" && !favorites.length
              ? "No favorites yet. Press the star on a command or cheatsheet to add one."
              : query.trim()
                ? `Nothing matches “${query}”. Try a command name, a flag such as --force, or a task like “where am I”.`
                : "Nothing here yet. Type to search."}
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
