import {
  ArrowLeftIcon,
  ArrowRightIcon,
  StarIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { Fragment, type ReactNode } from "react"

import { CommandBuilder, useBuilder } from "@/components/builder"
import { CodeBlock, CommandLine, CopyButton, Inline } from "@/components/code"
import { Page, Section, type TocItem } from "@/components/shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { categories } from "@/data"
import { href } from "@/lib/router"
import { useFavorites } from "@/lib/store"
import type { Category, Command } from "@/lib/types"

export const commandCount = categories.reduce(
  (n, cat) => n + cat.commands.length,
  0
)

const link =
  "rounded-sm outline-none hover:text-link focus-visible:ring-2 focus-visible:ring-ring"

export function Callout({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm leading-relaxed"
    >
      <WarningIcon
        weight="fill"
        className="mt-0.5 size-4 shrink-0 text-destructive"
      />
      <span>
        <strong className="font-semibold text-destructive">Warning. </strong>
        {children}
      </span>
    </p>
  )
}

/** One command in a list: name, summary, and the command with the user's own values, ready to copy. */
export function CommandRow({
  catId,
  cmd,
  action,
}: {
  catId: string
  cmd: Command
  action?: ReactNode
}) {
  const b = useBuilder(`${catId}/${cmd.id}`, cmd)
  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <a
          href={href(catId, cmd.id)}
          className={`font-mono text-[15px] font-semibold ${link}`}
        >
          {cmd.name}
        </a>
        <span className="text-sm text-muted-foreground">{cmd.summary}</span>
      </div>
      <div className="flex items-start gap-0.5 rounded-md border bg-muted/40 py-0.5 pr-0.5 pl-3">
        {cmd.warn && (
          <WarningIcon
            weight="fill"
            aria-label="Has a warning"
            className="mt-2.5 mr-2 size-3.5 shrink-0 text-destructive"
          />
        )}
        <code className="min-w-0 flex-1 py-1.5 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">
          <CommandLine segs={b.out.segs} lang={cmd.lang} />
        </code>
        <CopyButton
          text={b.out.text}
          label={`Copy ${cmd.name}`}
          disabled={b.out.missing.length > 0}
        />
        {action}
      </div>
    </li>
  )
}

export function CategoryPage({ cat }: { cat: Category }) {
  return (
    <Page path={[[cat.id]]} title={cat.title} lead={cat.intro}>
      <ul className="flex flex-col gap-6">
        {cat.commands.map((cmd) => (
          <CommandRow key={cmd.id} catId={cat.id} cmd={cmd} />
        ))}
      </ul>
    </Page>
  )
}

export function LibraryPage() {
  return (
    <Page
      path={[["library"]]}
      title="Library"
      lead={`${commandCount} commands in ${categories.length} categories. Every one opens with a working example you can edit before you copy.`}
      toc={categories.map((cat) => ({
        label: cat.title,
        to: href("library", cat.id),
      }))}
    >
      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} aria-labelledby={`${cat.id}-title`}>
          <h2 id={`${cat.id}-title`} className="text-lg font-semibold">
            <a href={href(cat.id)} className={link}>
              {cat.title}
            </a>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{cat.summary}</p>
          <ul className="mt-3 columns-2 gap-x-8 font-mono text-[13px] sm:columns-3">
            {cat.commands.map((cmd) => (
              <li key={cmd.id} className="py-0.5">
                <a
                  href={href(cat.id, cmd.id)}
                  className={`text-muted-foreground ${link}`}
                >
                  {cmd.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  )
}

/** The reference card for one command. `list` gives the neighbours for previous and next. */
export function CommandPage({
  catId,
  cmd,
  list,
  children,
}: {
  catId: string
  cmd: Command
  list: Command[]
  children?: ReactNode
}) {
  const key = `${catId}/${cmd.id}`
  const [favorites, setFavorites] = useFavorites()
  const starred = favorites.includes(key)
  const at = list.findIndex((c) => c.id === cmd.id)
  const prev = list[at - 1]
  const next = list[at + 1]

  const toc: TocItem[] = [
    { label: "Command", to: href(catId, cmd.id, "command") },
    ...(cmd.flags
      ? [{ label: "Flags", to: href(catId, cmd.id, "flags") }]
      : []),
    ...(cmd.examples
      ? [{ label: "Examples", to: href(catId, cmd.id, "examples") }]
      : []),
    ...(cmd.notes
      ? [{ label: "Notes", to: href(catId, cmd.id, "notes") }]
      : []),
    ...(cmd.trouble
      ? [
          {
            label: "Troubleshooting",
            to: href(catId, cmd.id, "troubleshooting"),
          },
        ]
      : []),
  ]

  return (
    <Page
      path={[[catId, href(catId)], [cmd.id]]}
      title={<span className="font-mono">{cmd.name}</span>}
      lead={cmd.summary}
      toc={toc}
      actions={
        <Button
          variant="outline"
          size="sm"
          className="label-mono text-xs"
          aria-pressed={starred}
          onClick={() =>
            setFavorites(
              starred ? favorites.filter((k) => k !== key) : [...favorites, key]
            )
          }
        >
          <StarIcon
            weight={starred ? "fill" : "regular"}
            className={starred ? "text-tok-var" : ""}
          />
          {starred ? "Favorited" : "Favorite"}
        </Button>
      }
    >
      <section
        id="command"
        aria-label="Command"
        className="flex flex-col gap-4"
      >
        {cmd.warn && <Callout>{cmd.warn}</Callout>}
        <CommandBuilder cmdKey={key} source={cmd} />
        {children}
      </section>

      {cmd.flags && (
        <Section id="flags" title="Flags">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-[fit-content(45%)_1fr]">
            {cmd.flags.map(([flag, text]) => (
              <Fragment key={flag}>
                <dt className="font-mono text-[13px] break-words text-link">
                  {flag}
                </dt>
                <dd className="mb-2 leading-relaxed text-muted-foreground sm:mb-0">
                  <Inline text={text} />
                </dd>
              </Fragment>
            ))}
          </dl>
        </Section>
      )}

      {cmd.examples && (
        <Section id="examples" title="Examples">
          <div className="flex flex-col gap-5">
            {cmd.examples.map(([title, code]) => (
              <figure key={title} className="flex flex-col gap-2">
                <figcaption className="text-sm">
                  <Inline text={title} />
                </figcaption>
                <CodeBlock code={code} lang={cmd.lang} />
              </figure>
            ))}
          </div>
        </Section>
      )}

      {cmd.notes && (
        <Section id="notes" title="Notes">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed marker:text-muted-foreground">
            {cmd.notes.map((note) => (
              <li key={note}>
                <Inline text={note} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cmd.trouble && (
        <Section id="troubleshooting" title="Troubleshooting">
          <dl className="flex flex-col gap-4 text-sm leading-relaxed">
            {cmd.trouble.map(([problem, fix]) => (
              <div key={problem}>
                <dt className="font-semibold">
                  <Inline text={problem} />
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  <Inline text={fix} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {(prev || next) && (
        <nav
          aria-label="More commands"
          className="grid grid-cols-2 gap-4 border-t pt-6 font-mono text-[13px] font-semibold"
        >
          {prev ? (
            <a
              href={href(catId, prev.id)}
              className={`flex min-w-0 items-center gap-2 py-1 ${link}`}
            >
              <ArrowLeftIcon className="size-4 shrink-0" />
              <span className="truncate">{prev.name}</span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a
              href={href(catId, next.id)}
              className={`flex min-w-0 items-center justify-end gap-2 py-1 ${link}`}
            >
              <span className="truncate">{next.name}</span>
              <ArrowRightIcon className="size-4 shrink-0" />
            </a>
          )}
        </nav>
      )}
    </Page>
  )
}

export function NotFound() {
  return (
    <Page
      path={[["not-found"]]}
      title="Nothing at this address"
      lead="The link may be old, or the command was renamed."
    >
      <div className="flex flex-wrap gap-2">
        <a href={href("library")} className={buttonVariants()}>
          Open the library
        </a>
        <a href="#/" className={buttonVariants({ variant: "outline" })}>
          Back to the start
        </a>
      </div>
    </Page>
  )
}
