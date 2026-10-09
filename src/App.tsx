import { useEffect, useState, type ReactNode } from "react"

import { SearchDialog } from "@/components/search"
import { Drawer, Header, Shell, SidebarNav } from "@/components/shell"
import { categories, cheatsheets } from "@/data"
import { lookup } from "@/lib/catalog"
import { useRoute } from "@/lib/router"
import { remember, useTemplates } from "@/lib/store"
import type { UserTemplate } from "@/lib/types"
import { CheatsheetPage, CheatsheetsPage } from "@/pages/cheatsheets"
import { Landing } from "@/pages/landing"
import {
  CategoryPage,
  CommandPage,
  LibraryPage,
  NotFound,
} from "@/pages/library"
import { asCommand, MyPage, TemplateTools } from "@/pages/my"

/**
 * Routes:  #/  ·  #/library  ·  #/<category>  ·  #/<category>/<command>
 *          #/cheatsheets[/<sheet>]  ·  #/my[/<template>]
 * A trailing segment that matches an element id on the page scrolls to it.
 */
function resolve(
  route: string[],
  templates: UserTemplate[]
): [title: string, page: ReactNode] {
  const [page, sub] = route
  if (page === "library") return ["Library", <LibraryPage />]
  if (page === "cheatsheets") {
    const sheet = cheatsheets.find((s) => s.id === sub)
    if (sheet)
      return [sheet.title, <CheatsheetPage key={sheet.id} sheet={sheet} />]
    return sub
      ? ["Not found", <NotFound />]
      : ["Cheatsheets", <CheatsheetsPage />]
  }
  if (page === "my") {
    const own = templates.find((t) => t.id === sub)
    if (!own) return ["My Zenbook", <MyPage />]
    return [
      own.name,
      <CommandPage
        key={own.id}
        catId="my"
        cmd={asCommand(own)}
        list={templates.map(asCommand)}
      >
        <TemplateTools template={own} />
      </CommandPage>,
    ]
  }
  const cat = categories.find((c) => c.id === page)
  const cmd = cat?.commands.find((c) => c.id === sub)
  if (cat && cmd)
    return [
      cmd.name,
      <CommandPage
        key={`${cat.id}/${cmd.id}`}
        catId={cat.id}
        cmd={cmd}
        list={cat.commands}
      />,
    ]
  if (cat && !sub) return [cat.title, <CategoryPage key={cat.id} cat={cat} />]
  return ["Not found", <NotFound />]
}

export function App() {
  const route = useRoute()
  const [templates] = useTemplates()
  const [searching, setSearching] = useState(false)
  const [menu, setMenu] = useState(false)
  const [title, page] = route.length
    ? resolve(route, templates)
    : ["", <Landing />]

  // "/" or Ctrl/Cmd+K opens search from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      const slash =
        e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey
      const modK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)
      if (!slash && !modK) return
      e.preventDefault()
      setSearching(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // The last route segment may name a section of the page. Otherwise start at the top.
  useEffect(() => {
    const target = document.getElementById(route.at(-1) ?? "")
    if (target?.closest("main")) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [route])

  // Commands and sheets the user opens feed "Recent" in search and the recommendations.
  const visit = route.slice(0, 2).join("/")
  useEffect(() => {
    if (lookup(visit, templates)) remember(visit)
  }, [visit, templates])

  useEffect(() => {
    document.title = title
      ? `${title} - Zenbook`
      : "Zenbook - developer knowledge base"
  }, [title])

  return (
    <>
      <button
        type="button"
        onClick={() => document.querySelector("main")?.focus()}
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-40 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-primary-foreground"
      >
        Skip to content
      </button>
      <Header
        route={route}
        onSearch={() => setSearching(true)}
        onMenu={() => setMenu(true)}
      />
      {route.length ? <Shell route={route}>{page}</Shell> : page}
      <Drawer open={menu} onClose={() => setMenu(false)}>
        <SidebarNav route={route} />
      </Drawer>
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </>
  )
}

export default App
