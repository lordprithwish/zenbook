import { StarIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { Item } from "@/lib/catalog"
import { useFavorite } from "@/lib/store"
import { cn } from "@/lib/utils"

/** A star that adds `itemKey` to favorites or takes it out. `name` labels the icon-only form. */
export function FavoriteButton({
  itemKey,
  name,
  full,
  className,
}: {
  itemKey: string
  name: string
  /** Show the word next to the star. */
  full?: boolean
  className?: string
}) {
  const [on, toggle] = useFavorite(itemKey)
  const star = (
    <StarIcon
      weight={on ? "fill" : "regular"}
      className={on ? "text-tok-var" : ""}
    />
  )
  if (full)
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("label-mono text-xs", className)}
        aria-pressed={on}
        onClick={toggle}
      >
        {star}
        {on ? "Favorited" : "Favorite"}
      </Button>
    )
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={on}
      aria-label={`Favorite ${name}`}
      title={on ? "Remove from favorites" : "Add to favorites"}
      className={className}
      onClick={toggle}
    >
      {star}
    </Button>
  )
}

/** A compact list of commands and sheets, each a link with its summary and a favorite star. */
export function ItemList({
  items,
  note,
}: {
  items: Item[]
  /** An extra line per item, such as why it is recommended. */
  note?: (item: Item) => ReactNode
}) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.key}
          className="-mx-2 flex items-start gap-1 rounded-md px-2 hover:bg-muted/40"
        >
          <a
            href={item.href}
            className="min-w-0 flex-1 rounded-sm py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-baseline gap-2">
              <span
                className={cn(
                  "truncate",
                  item.mono
                    ? "font-mono text-[13px] font-semibold"
                    : "text-sm font-semibold"
                )}
              >
                {item.title}
              </span>
              <span className="shrink-0 label-mono text-[11px] text-muted-foreground">
                {item.group}
              </span>
            </span>
            <span className="block text-sm leading-snug text-muted-foreground">
              {item.sub}
            </span>
            {note && (
              <span className="mt-0.5 block text-xs text-muted-foreground/80">
                {note(item)}
              </span>
            )}
          </a>
          <FavoriteButton
            itemKey={item.key}
            name={item.title}
            className="mt-1.5"
          />
        </li>
      ))}
    </ul>
  )
}
