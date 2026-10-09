import {
  ListIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  TerminalWindowIcon,
  XIcon,
} from "@phosphor-icons/react"
import { Fragment, useEffect, useRef, type ReactNode } from "react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { categories, cheatsheets } from "@/data"
import { href, useRoute } from "@/lib/router"
import { cn } from "@/lib/utils"

/** Drives a native <dialog>: focus trap, Escape and the backdrop come from the browser. */
export function useModal(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])
  return ref
}

export function Logo() {
  return (
    <a
      href="#/"
      className="flex items-center gap-2 rounded-md label-mono text-[15px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <TerminalWindowIcon weight="fill" className="size-5 text-link" />
      zenbook
    </a>
  )
}

const isLibrary = (page?: string) =>
  page === "library" || categories.some((c) => c.id === page)

const MAIN_NAV: [
  label: string,
  to: string,
  active: (page?: string) => boolean,
][] = [
  ["Library", href("library"), isLibrary],
  ["Cheatsheets", href("cheatsheets"), (page) => page === "cheatsheets"],
  ["My Zenbook", href("my"), (page) => page === "my"],
]

export function Header({
  route,
  onSearch,
  onMenu,
}: {
  route: string[]
  onSearch: () => void
  onMenu: () => void
}) {
  const { setTheme } = useTheme()
  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={onMenu}
        >
          <ListIcon />
        </Button>
        <Logo />
        <nav
          aria-label="Main"
          className="ml-5 hidden items-center gap-1 label-mono text-[13px] md:flex"
        >
          {MAIN_NAV.map(([label, to, active]) => (
            <a
              key={to}
              href={to}
              aria-current={active(route[0]) ? "page" : undefined}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search"
          aria-keyshortcuts="/ Control+K Meta+K"
          className="ml-auto flex size-9 items-center justify-center gap-2 rounded-md border bg-muted/40 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-64 sm:justify-start sm:px-2.5 lg:w-80"
        >
          <MagnifyingGlassIcon className="size-4 shrink-0" />
          <span className="hidden sm:inline">Search commands and flags</span>
          <kbd className="ml-auto hidden rounded-sm border bg-background px-1.5 font-mono text-[11px] sm:inline">
            /
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Switch between light and dark theme"
          title="Switch theme (D)"
          onClick={() =>
            setTheme(
              document.documentElement.classList.contains("dark")
                ? "light"
                : "dark"
            )
          }
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
        </Button>
      </div>
    </header>
  )
}

function NavLink({
  to,
  active,
  className,
  children,
}: {
  to: string
  active: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-2 py-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-link/10 aria-[current=page]:font-medium aria-[current=page]:text-link",
        className
      )}
    >
      {children}
    </a>
  )
}

const groupTitle = "font-semibold text-foreground"
const list = "mt-1 flex flex-col gap-0.5"

export function SidebarNav({ route }: { route: string[] }) {
  const [page, sub] = route
  return (
    <nav aria-label="Sections" className="flex flex-col gap-6 text-sm">
      <div>
        <NavLink
          to={href("library")}
          active={page === "library"}
          className={groupTitle}
        >
          Library
        </NavLink>
        <ul className={list}>
          {categories.map((cat) => (
            <li key={cat.id}>
              <NavLink to={href(cat.id)} active={page === cat.id && !sub}>
                {cat.title}
              </NavLink>
              {page === cat.id && (
                <ul className="my-1 ml-3 flex flex-col gap-0.5 border-l pl-2 font-mono text-[13px]">
                  {cat.commands.map((cmd) => (
                    <li key={cmd.id}>
                      <NavLink
                        to={href(cat.id, cmd.id)}
                        active={sub === cmd.id}
                      >
                        {cmd.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <NavLink
          to={href("cheatsheets")}
          active={page === "cheatsheets" && !sub}
          className={groupTitle}
        >
          Cheatsheets
        </NavLink>
        <ul className={list}>
          {cheatsheets.map((sheet) => (
            <li key={sheet.id}>
              <NavLink
                to={href("cheatsheets", sheet.id)}
                active={page === "cheatsheets" && sub === sheet.id}
              >
                {sheet.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <NavLink
          to={href("my")}
          active={page === "my" && !sub}
          className={groupTitle}
        >
          My Zenbook
        </NavLink>
        <ul className={list}>
          {["favorites", "recommended", "presets", "templates"].map((id) => (
            <li key={id}>
              <NavLink
                to={href("my", id)}
                active={page === "my" && sub === id}
                className="capitalize"
              >
                {id}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

/** The mobile navigation: the same sidebar inside a native modal dialog. */
export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useModal(open)
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Navigation"
      // A click on the backdrop lands on the dialog itself; a click on a link means we are leaving.
      onClick={(e) =>
        (e.target === e.currentTarget ||
          (e.target as HTMLElement).closest("a")) &&
        onClose()
      }
      className="m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r bg-background p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
        <div className="flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function Shell({
  route,
  children,
}: {
  route: string[]
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px]">
      <aside className="hidden w-60 shrink-0 border-r lg:block">
        <div className="sticky top-14 h-[calc(100dvh-3.5rem)] [scrollbar-width:thin] overflow-y-auto px-3 py-6">
          <SidebarNav route={route} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export interface TocItem {
  label: string
  /** A route whose last segment is the id of the element to scroll to. */
  to: string
}

/** The standard documentation page: breadcrumb, title, lead, content, and a contents rail. */
export function Page({
  path,
  title,
  lead,
  actions,
  toc,
  children,
}: {
  path: [label: string, to?: string][]
  title: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  toc?: TocItem[]
  children: ReactNode
}) {
  const current = href(...useRoute())
  return (
    <div className="mx-auto flex w-full max-w-5xl gap-12 px-4 py-8 sm:px-8 lg:py-10">
      <main tabIndex={-1} className="min-w-0 flex-1 outline-none">
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-xs text-muted-foreground"
        >
          <a href={href("library")} className="hover:text-foreground">
            ~
          </a>
          {path.map(([label, to]) => (
            <Fragment key={label}>
              {" / "}
              {to ? (
                <a href={to} className="hover:text-foreground">
                  {label}
                </a>
              ) : (
                <span aria-current="page">{label}</span>
              )}
            </Fragment>
          ))}
        </nav>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <h1 className="text-3xl font-bold">{title}</h1>
          {actions}
        </div>
        {lead && (
          <p className="mt-3 max-w-[65ch] leading-relaxed text-muted-foreground">
            {lead}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-10">{children}</div>
      </main>
      {toc && toc.length > 2 && (
        <nav
          aria-label="On this page"
          className="hidden w-44 shrink-0 text-sm xl:block"
        >
          <div className="sticky top-24">
            <p className="font-semibold">On this page</p>
            <ul className="mt-2 flex flex-col gap-1 border-l">
              {toc.map((item) => (
                <li key={item.to}>
                  <a
                    href={item.to}
                    aria-current={current === item.to ? "location" : undefined}
                    className="-ml-px block border-l border-transparent py-0.5 pl-3 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=location]:border-link aria-[current=location]:text-link"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  )
}

/** A titled block of a page that the contents rail can link to. */
export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}
