import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react"
import { useMemo, useState, type CSSProperties, type ReactNode } from "react"

import { CommandBuilder } from "@/components/builder"
import { HitLine } from "@/components/search"
import { Logo } from "@/components/shell"
import { buttonVariants } from "@/components/ui/button"
import { categories, cheatsheets } from "@/data"
import { href } from "@/lib/router"
import { buildIndex, search } from "@/lib/search"
import { cn } from "@/lib/utils"
import { CheatRow } from "@/pages/cheatsheets"
import { Callout, commandCount } from "@/pages/library"

// Every preview on this page is the real component fed with real library data.
// The motion classes (scrub, reveal, lit, marquee) live in index.css.
const command = (catId: string, id: string) =>
  categories.find((c) => c.id === catId)?.commands.find((c) => c.id === id)

const all = categories.flatMap((cat) => cat.commands)
const every = (n: number) => (_: unknown, i: number) => i % n === 0

/** Text for the two moving bands: a sample of command names, and of long flags. */
const NAMES = all
  .filter((cmd) => !cmd.lang && String(cmd.template).startsWith(cmd.name))
  .map((cmd) => cmd.name)
  .filter(every(5))
const FLAGS = [
  ...new Set(all.flatMap((cmd) => cmd.flags ?? []).map(([flag]) => flag)),
]
  .filter((flag) => /^--[a-z-]+$/.test(flag))
  .filter(every(5))

/** The placeholder syntax of a user template, as shown on the landing page. */
const SYNTAX = [
  ["{{name}}", "a value you fill in"],
  ["{{name=default}}", "a value that starts prefilled"],
  ["{{name?}}", "a value that can be left out"],
]

const THESIS =
  "You rarely need the whole manual. You need the right command, a reminder of what its flags do, and your own values in it."

const container = "mx-auto w-full max-w-[1400px] px-4 sm:px-8"
// Pass it after the size classes: cn drops a leading that comes before a font size.
const display = "leading-[0.95] font-extrabold tracking-tight"
const cta = "px-4 label-mono text-[13px]"
const nudge = "transition-transform group-hover/button:translate-x-0.5"

/** Inline custom properties, which React's style type does not know. */
const vars = (v: Record<`--${string}`, number>) => v as CSSProperties

function Hero() {
  const clone = command("git", "clone")
  return (
    <section className="relative overflow-clip">
      <div
        className={cn(
          container,
          "grid grid-cols-1 items-center gap-12 pt-12 pb-16 lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:py-12"
        )}
      >
        <div>
          <p className="label-mono text-[13px] text-muted-foreground">
            {commandCount} commands / {categories.length} categories /{" "}
            {cheatsheets.length} cheatsheets
          </p>
          <h1
            className={cn(
              // Capped by the window height, so the buttons stay above the fold on a short laptop.
              "mt-6 text-[2.75rem] sm:text-6xl xl:text-[min(4.5rem,9.5dvh)]",
              display
            )}
          >
            {["Find", "Understand", "Customize", "Copy"].map((verb, i) => (
              // Each line rises out of its own mask. The padding keeps descenders unclipped.
              <span
                key={verb}
                className="mb-[-0.14em] block overflow-clip pb-[0.14em]"
              >
                <span
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="block duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-both slide-in-from-bottom-[125%] motion-safe:animate-in"
                >
                  {verb}{" "}
                  <span className="font-medium text-muted-foreground">it.</span>
                </span>
              </span>
            ))}
          </h1>
          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            A static reference library for developers. Every command has
            editable variables, so what you copy already fits your environment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={href("library")}
              className={buttonVariants({ size: "lg", className: cta })}
            >
              Open the library
              <ArrowRightIcon className={nudge} />
            </a>
            <a
              href={href("cheatsheets")}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: cta,
              })}
            >
              Browse cheatsheets
            </a>
          </div>
        </div>
        <div className="relative">
          <span
            aria-hidden
            className="scrub pointer-events-none absolute top-[-0.62em] left-0 hidden font-mono text-[clamp(9rem,19vw,17rem)] leading-none font-bold whitespace-nowrap text-foreground/5 select-none [--from:0_-5rem] [--to:0_5rem] lg:block"
          >
            {"{{ }}"}
          </span>
          {clone && (
            <div className="scrub relative [--from:0_2.5rem] [--to:0_-2.5rem]">
              <p className="mb-3 flex items-center gap-2.5 label-mono text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute size-full rounded-full bg-link opacity-60 motion-safe:animate-ping" />
                  <span className="relative size-2 rounded-full bg-link" />
                </span>
                Live. Change a value and the command rewrites itself.
              </p>
              <div className="rounded-lg bg-background">
                <CommandBuilder cmdKey="git/clone" source={clone} />
              </div>
            </div>
          )}
        </div>
      </div>
      <p
        aria-hidden
        className="absolute bottom-6 left-1/2 hidden items-center gap-2 label-mono text-xs text-muted-foreground lg:[@media(min-height:48rem)]:flex"
      >
        <ArrowDownIcon className="size-3.5 motion-safe:animate-bounce" />
        Scroll
      </p>
    </section>
  )
}

/** One band of oversized text. Scrolling slides the row; inside it the list loops on its own. */
function Band({
  items,
  reverse,
  className,
}: {
  items: string[]
  reverse?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "scrub flex w-max",
        reverse ? "[--from:-25vw_0]" : "[--to:-25vw_0]"
      )}
    >
      <div className={cn("marquee flex", reverse && "direction-reverse")}>
        {/* Twice, so the loop has no seam. */}
        {[0, 1].map((copy) => (
          <ul key={copy} className={cn("flex whitespace-nowrap", className)}>
            {items.map((item) => (
              <li
                key={item}
                className="after:mx-[0.4em] after:opacity-40 after:content-['/']"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

function Bands() {
  return (
    <section
      aria-hidden
      className="flex flex-col gap-1 overflow-clip border-y py-8 font-mono text-[clamp(2.25rem,6.5vw,5rem)] leading-[1.1] font-bold tracking-tight select-none sm:py-12"
    >
      <Band items={NAMES} />
      <Band
        items={FLAGS}
        reverse
        className="text-transparent [-webkit-text-stroke:1px_var(--muted-foreground)]"
      />
    </section>
  )
}

function LiveSearch() {
  const index = useMemo(() => buildIndex(categories, cheatsheets, []), [])
  const [query, setQuery] = useState("undo commit")
  const hits = search(index, query, 4)
  return (
    <div className="rounded-lg border bg-background">
      <label className="flex items-center gap-2.5 border-b px-3">
        <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Try a search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="Try a command, a flag or a task"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <ul className="p-1.5">
        {hits.map((hit) => (
          <li key={hit.href + hit.title}>
            <a
              href={hit.href}
              className="flex items-baseline gap-3 rounded-md px-2.5 py-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HitLine hit={hit} />
            </a>
          </li>
        ))}
        {!hits.length && (
          <li className="px-2.5 py-4 text-sm text-muted-foreground">
            {query.trim()
              ? "Nothing matches that. Try “force” or “stash”."
              : "Type something to search."}
          </li>
        )}
      </ul>
    </div>
  )
}

/**
 * One step of the workflow. On a tall, wide screen the plates pin under the header and
 * stack, each one stopping a title bar lower, so the four titles end up reading as a list.
 */
function Plate({
  index,
  title,
  hint,
  text,
  link: [label, to],
  children,
}: {
  index: number
  title: string
  hint: string
  text: string
  link: [label: string, to: string]
  children: ReactNode
}) {
  return (
    <li
      style={vars({ "--i": index })}
      className="rounded-xl border bg-card shadow-[0_-14px_30px_-22px] shadow-foreground/25 lg:top-[calc(4.5rem+var(--i)*2.75rem)] lg:[@media(min-height:44rem)]:sticky"
    >
      <div className="flex h-11 items-center gap-3 border-b px-5 lg:px-8">
        <span className="font-mono text-xs text-link">0{index + 1}</span>
        <h3 className="font-bold">{title}</h3>
        <span className="ml-auto hidden label-mono text-xs text-muted-foreground sm:block">
          {hint}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 p-5 lg:min-h-92 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14 lg:p-8">
        <div className="flex flex-col items-start gap-6">
          <p className="max-w-[28ch] text-xl leading-snug font-medium text-balance lg:text-2xl">
            {text}
          </p>
          <a
            href={to}
            className={buttonVariants({
              variant: "outline",
              className: "mt-auto px-3 label-mono text-[13px]",
            })}
          >
            {label}
            <ArrowRightIcon className={nudge} />
          </a>
        </div>
        <div className="min-w-0 self-center">{children}</div>
      </div>
    </li>
  )
}

function HowItWorks() {
  const reset = command("git", "reset")
  const rows =
    cheatsheets.find((s) => s.id === "git-undo")?.groups[1]?.rows.slice(0, 4) ??
    []
  const words = THESIS.split(" ")
  return (
    <section>
      <div className={cn(container, "pt-20 pb-16 lg:pt-36")}>
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
          <h2 className="label-mono text-[13px] text-muted-foreground lg:pt-3">
            Built for how you look things up
          </h2>
          <p className="lit text-[1.75rem] leading-[1.12] font-bold tracking-tight sm:text-4xl xl:text-5xl">
            {words.map((word, i) => (
              <span key={i} style={vars({ "--at": i / words.length })}>
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
        {/* The empty box at the end leaves room for the finished stack to stay put for a moment. */}
        <ol className="mt-14 flex flex-col gap-5 lg:mt-24 lg:after:h-[14vh] lg:after:content-['']">
          <Plate
            index={0}
            title="Find"
            hint="Press / anywhere"
            text="Press / on any page. Search matches command names, flags, and plain tasks."
            link={["Open the library", href("library")]}
          >
            <LiveSearch />
          </Plate>
          <Plate
            index={1}
            title="Understand"
            hint="Flags, arguments, warnings"
            text="Each command explains its flags and arguments, and warns you before it destroys anything."
            link={["Read git reset", href("git", "reset")]}
          >
            {reset && (
              <div className="flex flex-col gap-4">
                <p className="font-mono text-[15px] font-semibold">
                  {reset.name}
                </p>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                  {reset.flags?.map(([flag, text]) => (
                    <div key={flag} className="contents">
                      <dt className="font-mono text-[13px] text-link">
                        {flag}
                      </dt>
                      <dd className="text-muted-foreground">{text}</dd>
                    </div>
                  ))}
                </dl>
                <Callout>{reset.warn}</Callout>
              </div>
            )}
          </Plate>
          <Plate
            index={2}
            title="Customize"
            hint="Presets, favorites, templates"
            text="Save a set of values as a preset, star the commands you use, and write templates of your own."
            link={["Write a template", href("my", "templates")]}
          >
            <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-5 gap-y-3 rounded-lg border bg-background px-4 py-4 text-sm">
              {SYNTAX.map(([code, meaning]) => (
                <div key={code} className="contents">
                  <dt className="font-mono text-[13px] text-tok-var">{code}</dt>
                  <dd className="text-muted-foreground">{meaning}</dd>
                </div>
              ))}
            </dl>
          </Plate>
          <Plate
            index={3}
            title="Copy"
            hint="One click"
            text="One click copies the finished command. In a builder, click any value to copy only that part."
            link={["Open this cheatsheet", href("cheatsheets", "git-undo")]}
          >
            <ul className="flex flex-col">
              {rows.map((row) => (
                <CheatRow key={row[0]} row={row} />
              ))}
            </ul>
          </Plate>
        </ol>
      </div>
    </section>
  )
}

function Directory() {
  return (
    <section className="border-t">
      <div
        className={cn(
          container,
          "grid grid-cols-1 gap-10 py-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20 lg:py-32"
        )}
      >
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className={cn("text-4xl text-balance sm:text-5xl", display)}>
            <span className="text-link">{commandCount}</span> commands in{" "}
            {categories.length} categories
          </h2>
          <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Each one opens with a working example. Change the values and the
            command updates as you type.
          </p>
        </div>
        <ul className="border-t">
          {categories.map((cat) => (
            <li key={cat.id} className="reveal border-b">
              <a
                href={href(cat.id)}
                className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 px-1 py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 bg-muted transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
                <span className="relative font-mono text-2xl font-bold tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 sm:text-4xl">
                  ~/{cat.id}
                </span>
                <span className="relative flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground group-hover:text-link">
                  {cat.commands.length} commands
                  <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="relative col-span-2 text-sm text-muted-foreground transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                  {cat.summary}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="border-t">
      <div
        className={cn(
          container,
          "grid grid-cols-1 items-end gap-10 py-24 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-20 lg:py-36"
        )}
      >
        <h2 className={cn("text-[2.75rem] sm:text-6xl xl:text-7xl", display)}>
          <span className="reveal block">No account.</span>
          <span className="reveal block">No backend.</span>
          <span className="reveal block text-muted-foreground">
            Nothing to install.
          </span>
        </h2>
        <div>
          <p className="max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Zenbook is a folder of static files. Your presets, favorites and
            templates are saved in this browser and never leave it.
          </p>
          <a
            href={href("library")}
            className={buttonVariants({
              size: "lg",
              className: cn(cta, "mt-8"),
            })}
          >
            Open the library
            <ArrowRightIcon className={nudge} />
          </a>
        </div>
      </div>
    </section>
  )
}

export function Landing() {
  return (
    <>
      <main tabIndex={-1} className="outline-none">
        <Hero />
        <Bands />
        <HowItWorks />
        <Directory />
        <Closing />
      </main>
      <footer className="border-t">
        <div
          className={cn(
            container,
            "flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-8 text-sm text-muted-foreground"
          )}
        >
          <Logo />
          <nav
            aria-label="Footer"
            className="flex gap-6 label-mono text-[13px]"
          >
            <a href={href("library")} className="hover:text-foreground">
              Library
            </a>
            <a href={href("cheatsheets")} className="hover:text-foreground">
              Cheatsheets
            </a>
            <a href={href("my")} className="hover:text-foreground">
              My Zenbook
            </a>
          </nav>
          <p>
            Press{" "}
            <kbd className="rounded-sm border px-1.5 font-mono text-[11px]">
              /
            </kbd>{" "}
            to search and{" "}
            <kbd className="rounded-sm border px-1.5 font-mono text-[11px]">
              D
            </kbd>{" "}
            to switch theme.
          </p>
        </div>
        {/* The wordmark rises into the last screen. It is sized to the container, not the window. */}
        <div aria-hidden className={cn(container, "@container overflow-clip")}>
          <p className="scrub font-mono text-[25.8cqw] leading-[0.78] font-bold tracking-tighter text-foreground/10 select-none [--from:0_45%] [animation-range:entry]">
            zenbook
          </p>
        </div>
      </footer>
    </>
  )
}
