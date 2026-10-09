import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useMemo, useState, type ReactNode } from "react"

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
const command = (catId: string, id: string) =>
  categories.find((c) => c.id === catId)?.commands.find((c) => c.id === id)

/** The placeholder syntax of a user template, as shown on the landing page. */
const SYNTAX = [
  ["{{name}}", "a value you fill in"],
  ["{{name=default}}", "a value that starts prefilled"],
  ["{{name?}}", "a value that can be left out"],
]

const container = "mx-auto w-full max-w-[1400px] px-4 sm:px-8"
const h2 = "text-3xl font-bold text-balance sm:text-4xl"

function Hero() {
  const clone = command("git", "clone")
  return (
    <section
      className={cn(
        container,
        "grid grid-cols-1 items-center gap-10 pt-10 pb-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14 lg:pt-20 lg:pb-24"
      )}
    >
      <div>
        <h1 className="text-[2rem] leading-[1.1] font-bold min-[400px]:text-4xl sm:text-5xl lg:text-4xl xl:text-[2.75rem] 2xl:text-5xl">
          {/* One sentence per line on small screens, two lines on wide ones. */}
          <span className="block lg:inline">Find it. </span>
          <span className="block lg:inline">Understand it.</span>
          <br className="hidden lg:block" />
          <span className="block lg:inline">Customize it. </span>
          <span className="block lg:inline">Copy it.</span>
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
          A static reference library for developers. Every command has editable
          variables, so what you copy already fits your environment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={href("library")}
            className={buttonVariants({
              size: "lg",
              className: "px-4 label-mono text-[13px]",
            })}
          >
            Open the library
            <ArrowRightIcon />
          </a>
          <a
            href={href("cheatsheets")}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "px-4 label-mono text-[13px]",
            })}
          >
            Browse cheatsheets
          </a>
        </div>
      </div>
      {clone && <CommandBuilder cmdKey="git/clone" source={clone} />}
    </section>
  )
}

function Cell({
  title,
  text,
  className,
  children,
}: {
  title: string
  text: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-lg border p-5 sm:p-6",
        className
      )}
    >
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-1.5 max-w-[52ch] leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
      {children}
    </div>
  )
}

function LiveSearch() {
  const index = useMemo(() => buildIndex(categories, cheatsheets, []), [])
  const [query, setQuery] = useState("undo commit")
  const hits = search(index, query, 4)
  return (
    <div className="mt-auto rounded-lg border bg-background">
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

function HowItWorks() {
  const reset = command("git", "reset")
  const rows =
    cheatsheets.find((s) => s.id === "git-undo")?.groups[1]?.rows.slice(0, 4) ??
    []
  return (
    <section className="border-t">
      <div className={cn(container, "py-16 lg:py-24")}>
        <h2 className={h2}>Built for how you look things up</h2>
        <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
          You rarely need the whole manual. You need the right command, a
          reminder of what its flags do, and your own values in it.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Cell
            className="bg-muted/40 lg:col-span-3"
            title="Find"
            text="Press / on any page. Search matches command names, flags, and plain tasks."
          >
            <LiveSearch />
          </Cell>
          <Cell
            className="lg:col-span-2"
            title="Understand"
            text="Each command explains its flags and arguments, and warns you before it destroys anything."
          >
            {reset && (
              <div className="mt-auto flex flex-col gap-4">
                <a
                  href={href("git", "reset")}
                  className="self-start rounded-sm font-mono text-[15px] font-semibold outline-none hover:text-link focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {reset.name}
                </a>
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
          </Cell>
          <Cell
            className="bg-link/[0.07] lg:col-span-2"
            title="Customize"
            text="Save a set of values as a preset, star the commands you use, and write templates of your own."
          >
            <div className="mt-auto flex flex-col gap-4">
              <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-4 gap-y-2 rounded-lg border bg-background px-3.5 py-3 text-sm">
                {SYNTAX.map(([code, meaning]) => (
                  <div key={code} className="contents">
                    <dt className="font-mono text-[13px] text-tok-var">
                      {code}
                    </dt>
                    <dd className="text-muted-foreground">{meaning}</dd>
                  </div>
                ))}
              </dl>
              <a
                href={href("my", "templates")}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "self-start bg-background px-3 label-mono text-[13px]",
                })}
              >
                Write a template
                <ArrowRightIcon />
              </a>
            </div>
          </Cell>
          <Cell
            className="lg:col-span-3"
            title="Copy"
            text="One click copies the finished command. In a builder, click any value to copy only that part."
          >
            <ul className="mt-auto flex flex-col">
              {rows.map((row) => (
                <CheatRow key={row[0]} row={row} />
              ))}
            </ul>
          </Cell>
        </div>
      </div>
    </section>
  )
}

function Directory() {
  return (
    <section className="border-t bg-muted/40">
      <div className={cn(container, "py-16 lg:py-24")}>
        <h2 className={h2}>
          {commandCount} commands in {categories.length} categories
        </h2>
        <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
          Each one opens with a working example. Change the values and the
          command updates as you type.
        </p>
        <ul className="mt-10 flex max-w-4xl flex-col">
          {categories.map((cat) => (
            <li key={cat.id}>
              <a
                href={href(cat.id)}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-0.5 rounded-md px-3 py-3 outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[9.5rem_minmax(0,1fr)_auto]"
              >
                <span className="font-mono text-sm font-semibold">
                  ~/{cat.id}
                </span>
                <span className="col-span-2 row-start-2 text-sm text-muted-foreground sm:col-span-1 sm:row-start-auto">
                  {cat.summary}
                </span>
                <span className="font-mono text-[13px] text-muted-foreground group-hover:text-link">
                  {cat.commands.length} commands
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
      <div className={cn(container, "py-20 lg:py-28")}>
        <h2 className="text-3xl leading-[1.15] font-bold text-balance sm:text-4xl lg:text-5xl">
          No account. No backend. Nothing to install.
        </h2>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-muted-foreground">
          Zenbook is a folder of static files. Your presets, favorites and
          templates are saved in this browser and never leave it.
        </p>
        <a
          href={href("library")}
          className={buttonVariants({
            size: "lg",
            className: "mt-8 px-4 label-mono text-[13px]",
          })}
        >
          Open the library
          <ArrowRightIcon />
        </a>
      </div>
    </section>
  )
}

export function Landing() {
  return (
    <>
      <main tabIndex={-1} className="outline-none">
        <Hero />
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
      </footer>
    </>
  )
}
