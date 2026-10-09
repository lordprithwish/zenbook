import { ArrowRightIcon, TrashIcon } from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent, type ReactNode } from "react"

import { CommandLine, CopyButton, highlight } from "@/components/code"
import { FavoriteButton, ItemList } from "@/components/items"
import { Page, Section } from "@/components/shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { categories } from "@/data"
import { lookup, recommend, STARTERS, type Item } from "@/lib/catalog"
import { href } from "@/lib/router"
import {
  newId,
  useDraft,
  useFavorites,
  useFavoritesView,
  usePresets,
  useRecent,
  useTemplates,
  type FavoritesView,
} from "@/lib/store"
import { cn } from "@/lib/utils"
import { compile, render, templateText } from "@/lib/template"
import type { Command, Preset, UserTemplate } from "@/lib/types"
import { CommandRow } from "@/pages/library"

export const asCommand = (t: UserTemplate): Command => ({
  id: t.id,
  name: t.name,
  summary: t.summary,
  template: t.template,
})

/** Resolve a "category/command" key against the library and the user's own templates. */
export function findCommand(key: string, templates: UserTemplate[]) {
  const [catId, id] = key.split("/")
  const cmd =
    catId === "my"
      ? templates.filter((t) => t.id === id).map(asCommand)[0]
      : categories
          .find((c) => c.id === catId)
          ?.commands.find((c) => c.id === id)
  return cmd ? { catId, cmd } : null
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed px-4 py-6 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

const field =
  "w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/** Create a template, or edit one when `initial` is given. */
export function TemplateForm({ initial }: { initial?: UserTemplate }) {
  const [templates, setTemplates] = useTemplates()
  const [name, setName] = useState(initial?.name ?? "")
  const [summary, setSummary] = useState(initial?.summary ?? "")
  const [template, setTemplate] = useState(initial?.template ?? "")
  const [saved, setSaved] = useState(false)
  const preview = useMemo(
    () => (template.trim() ? compile(template) : null),
    [template]
  )
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value)
    setSaved(false)
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !template.trim()) return
    const next: UserTemplate = {
      id: initial?.id ?? newId(),
      name: name.trim(),
      summary: summary.trim(),
      template: template.trimEnd(),
    }
    if (initial) {
      setTemplates(templates.map((t) => (t.id === next.id ? next : t)))
      setSaved(true)
    } else {
      setTemplates([...templates, next])
      window.location.hash = href("my", next.id)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tpl-name" className="text-sm font-medium">
            Name{" "}
            <span aria-hidden className="text-destructive">
              *
            </span>
          </label>
          <input
            id="tpl-name"
            value={name}
            onChange={(e) => edit(setName)(e.target.value)}
            required
            maxLength={60}
            placeholder="deploy to staging"
            className={`${field} h-9 font-mono text-[13px] font-normal`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tpl-summary" className="text-sm font-medium">
            Description
          </label>
          <input
            id="tpl-summary"
            value={summary}
            onChange={(e) => edit(setSummary)(e.target.value)}
            maxLength={140}
            placeholder="What it does, in a few words"
            className={`${field} h-9`}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tpl-template" className="text-sm font-medium">
          Template{" "}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </label>
        <textarea
          id="tpl-template"
          value={template}
          onChange={(e) => edit(setTemplate)(e.target.value)}
          required
          rows={4}
          spellCheck={false}
          autoCapitalize="off"
          aria-describedby="tpl-help"
          placeholder={
            "rsync -avz {{source=./dist/}} {{user=deploy}}@{{host}}:{{path=/var/www/app}}"
          }
          className={`${field} py-2 font-mono text-[13px] leading-relaxed font-normal`}
        />
        <p
          id="tpl-help"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          Write <code className="font-mono">{"{{name}}"}</code> for a value you
          fill in, <code className="font-mono">{"{{name=default}}"}</code> to
          prefill it, and <code className="font-mono">{"{{name?}}"}</code> for
          one that can be left out. Values are quoted for the shell when needed,
          also inside quotes you write yourself.
        </p>
      </div>
      {preview && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2.5 font-mono text-[13px] leading-relaxed">
          <p className="mb-1 font-sans text-xs text-muted-foreground">
            Preview, with {preview.fields.length || "no"} variable
            {preview.fields.length === 1 ? "" : "s"}
          </p>
          <pre className="break-words whitespace-pre-wrap">
            <code>{highlight(templateText(preview))}</code>
          </pre>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          className="label-mono text-xs"
          disabled={!name.trim() || !template.trim()}
        >
          {initial ? "Save changes" : "Save template"}
        </Button>
        <span role="status" className="text-sm text-muted-foreground">
          {saved ? "Saved." : ""}
        </span>
      </div>
    </form>
  )
}

/** Edit and delete controls, shown on the page of a template the user owns. */
export function TemplateTools({ template }: { template: UserTemplate }) {
  const key = `my/${template.id}`
  const [templates, setTemplates] = useTemplates()
  const [favorites, setFavorites] = useFavorites()
  const [presets, setPresets] = usePresets()
  const [, setDraft] = useDraft(key)

  const remove = () => {
    if (
      !window.confirm(
        `Delete the template “${template.name}”? Its presets go with it.`
      )
    )
      return
    setFavorites(favorites.filter((k) => k !== key))
    setPresets(presets.filter((p) => p.cmd !== key))
    setDraft(null)
    setTemplates(templates.filter((t) => t.id !== template.id))
    window.location.hash = href("my", "templates")
  }

  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Edit this template
      </summary>
      <div className="flex flex-col gap-4 border-t p-4">
        <TemplateForm initial={template} />
        <Button
          variant="destructive"
          size="sm"
          className="self-start label-mono text-xs"
          onClick={remove}
        >
          <TrashIcon />
          Delete template
        </Button>
      </div>
    </details>
  )
}

function PresetRow({
  preset,
  onDelete,
}: {
  preset: Preset
  onDelete: () => void
}) {
  const [templates] = useTemplates()
  const [, setDraft] = useDraft(preset.cmd)
  const found = findCommand(preset.cmd, templates)
  const out = found
    ? render(
        compile(found.cmd.template, found.cmd.vars, found.cmd.lang),
        preset.draft
      )
    : null
  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
        <span className="font-mono font-semibold">{preset.name}</span>
        <span className="text-muted-foreground">
          {found
            ? `for ${found.cmd.name}`
            : "for a command that no longer exists"}
        </span>
      </div>
      <div className="flex items-start gap-0.5 rounded-md border bg-muted/40 py-0.5 pr-0.5 pl-3">
        <code className="min-w-0 flex-1 py-1.5 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">
          {out ? (
            <CommandLine segs={out.segs} lang={found!.cmd.lang} />
          ) : (
            preset.cmd
          )}
        </code>
        {out && found && (
          <>
            <CopyButton
              text={out.text}
              label={`Copy preset ${preset.name}`}
              disabled={out.missing.length > 0}
            />
            <a
              href={href(found.catId, found.cmd.id)}
              onClick={() => setDraft(preset.draft)}
              title="Open in the builder with these values"
              aria-label={`Open ${preset.name} in the builder`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <ArrowRightIcon />
            </a>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete preset ${preset.name}`}
          title="Delete preset"
          onClick={onDelete}
        >
          <TrashIcon />
        </Button>
      </div>
    </li>
  )
}

/** One favorite: a command with the user's values, ready to copy, or a cheatsheet. */
function FavoriteRow({ item }: { item: Item }) {
  const star = <FavoriteButton itemKey={item.key} name={item.title} />
  if (item.cmd && item.catId)
    return <CommandRow catId={item.catId} cmd={item.cmd} action={star} />
  return (
    <li className="flex items-start gap-1 rounded-md border bg-muted/40 py-0.5 pr-0.5 pl-3">
      <a
        href={item.href}
        className="min-w-0 flex-1 rounded-sm py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-semibold hover:text-link">{item.title}</span>
        <span className="ml-2 label-mono text-[11px] text-muted-foreground">
          Cheatsheet
        </span>
        <span className="block text-sm text-muted-foreground">{item.sub}</span>
      </a>
      {star}
    </li>
  )
}

const VIEWS: [FavoritesView, string][] = [
  ["grouped", "By group"],
  ["flat", "Flat list"],
]

/** Favorites in the order of the site: sheets, then each category, then the user's templates. */
function groupFavorites(items: Item[]): [title: string, items: Item[]][] {
  const order = [
    "Cheatsheet",
    ...categories.map((c) => c.title),
    "My templates",
  ]
  return order
    .map((group): [string, Item[]] => [
      group === "Cheatsheet" ? "Cheatsheets" : group,
      items.filter((item) => item.group === group),
    ])
    .filter(([, list]) => list.length)
}

function Favorites() {
  const [favorites] = useFavorites()
  const [templates] = useTemplates()
  const [view, setView] = useFavoritesView()
  const items = favorites.flatMap((key) => lookup(key, templates) ?? [])

  if (!items.length)
    return (
      <Empty>
        No favorites yet. Press the star on any command or cheatsheet to keep it
        here. Commands keep the values you last used.
      </Empty>
    )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {items.length} saved
          {view === "flat" ? ", most recently added first" : ""}
        </p>
        <div
          role="group"
          aria-label="Show favorites"
          className="flex rounded-md border p-0.5 label-mono text-xs"
        >
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className="rounded-sm px-2.5 py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === "flat" ? (
        <ul className="flex flex-col gap-6">
          {[...items].reverse().map((item) => (
            <FavoriteRow key={item.key} item={item} />
          ))}
        </ul>
      ) : (
        groupFavorites(items).map(([title, list]) => (
          <div key={title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              {title}{" "}
              <span className="font-normal text-muted-foreground">
                {list.length}
              </span>
            </h3>
            <ul
              className={cn(
                "flex flex-col",
                list[0].kind === "sheet" ? "gap-2" : "gap-6"
              )}
            >
              {list.map((item) => (
                <FavoriteRow key={item.key} item={item} />
              ))}
            </ul>
          </div>
        ))
      )}
    </>
  )
}

/** Picks based on what the user favorited and opened, or a starter set for a first visit. */
function Recommended() {
  const [favorites] = useFavorites()
  const [recent] = useRecent()
  const picks = recommend([...new Set([...favorites, ...recent])])
  if (picks.length) {
    const why = new Map(picks.map(({ item, via }) => [item.key, via]))
    return (
      <ItemList
        items={picks.map(({ item }) => item)}
        note={(item) => (
          <>
            Goes with{" "}
            <span className={cn(why.get(item.key)?.mono && "font-mono")}>
              {why.get(item.key)?.title}
            </span>
          </>
        )}
      />
    )
  }
  return (
    <>
      <p className="-mt-2 text-sm text-muted-foreground">
        A few good places to start. Once you favorite or open commands, this
        list suggests the ones that usually go with them.
      </p>
      <ItemList items={STARTERS.flatMap((key) => lookup(key) ?? [])} />
    </>
  )
}

export function MyPage() {
  const [presets, setPresets] = usePresets()
  const [templates] = useTemplates()

  return (
    <Page
      path={[["my"]]}
      title="My Zenbook"
      lead="Your favorites, saved presets and own templates. They are stored in this browser only: no account, no sync, nothing sent anywhere."
      toc={["Favorites", "Recommended", "Presets", "Templates"].map(
        (label) => ({
          label,
          to: href("my", label.toLowerCase()),
        })
      )}
    >
      <Section id="favorites" title="Favorites">
        <Favorites />
      </Section>

      <Section id="recommended" title="Recommended">
        <Recommended />
      </Section>

      <Section id="presets" title="Presets">
        {presets.length ? (
          <ul className="flex flex-col gap-6">
            {presets.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                onDelete={() =>
                  setPresets(presets.filter((p) => p.id !== preset.id))
                }
              />
            ))}
          </ul>
        ) : (
          <Empty>
            No presets yet. Fill in a command, then press “Save current values”
            to keep that exact version as a reusable snippet.
          </Empty>
        )}
      </Section>

      <Section id="templates" title="Templates">
        {templates.length > 0 && (
          <ul className="flex flex-col gap-6">
            {templates.map((t) => (
              <CommandRow key={t.id} catId="my" cmd={asCommand(t)} />
            ))}
          </ul>
        )}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">New template</h3>
          <TemplateForm />
        </div>
      </Section>
    </Page>
  )
}
