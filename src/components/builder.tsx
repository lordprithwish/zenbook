import {
  ArrowCounterClockwiseIcon,
  FloppyDiskIcon,
  XIcon,
} from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent } from "react"

import { CommandLine, CopyButton, highlight } from "@/components/code"
import { Button } from "@/components/ui/button"
import { newId, useDraft, usePresets } from "@/lib/store"
import {
  compile,
  isModified,
  render,
  snapshot,
  templateText,
  valueOf,
  type Draft,
  type Field,
  type Lang,
  type Template,
  type VarDef,
} from "@/lib/template"
import { cn } from "@/lib/utils"

interface Source {
  template: Template
  vars?: Record<string, VarDef>
  lang?: Lang
}

/**
 * The state behind every interactive command: the compiled template, the user's
 * saved edits (kept apart from the template), and the command they produce.
 */
export function useBuilder(key: string, { template, vars, lang }: Source) {
  const compiled = useMemo(
    () => compile(template, vars, lang),
    [template, vars, lang]
  )
  const [draft, setDraft] = useDraft(key)
  const out = useMemo(() => render(compiled, draft), [compiled, draft])
  // Storing nothing when the values match the defaults keeps "modified" honest.
  const apply = (next: Draft) =>
    setDraft(isModified(compiled, next) ? next : null)
  return {
    compiled,
    draft,
    out,
    modified: isModified(compiled, draft),
    apply,
    reset: () => setDraft(null),
    set: (name: string, value: string) =>
      apply({ ...draft, values: { ...draft.values, [name]: value } }),
    toggleRaw: (name: string) =>
      apply({
        ...draft,
        raw: draft.raw?.includes(name)
          ? draft.raw.filter((n) => n !== name)
          : [...(draft.raw ?? []), name],
      }),
  }
}

export type Builder = ReturnType<typeof useBuilder>

const input =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2.5 font-mono text-[13px] font-normal outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"

function FieldInput({
  field: f,
  b,
  id,
}: {
  field: Field
  b: Builder
  id: string
}) {
  const value = valueOf(f, b.draft)
  const flag = f.format?.replace("{}", "").trim()

  if (f.kind === "toggle")
    return (
      <div className="flex flex-col gap-1">
        <label className="flex min-h-9 items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => b.set(f.name, e.target.checked ? "1" : "")}
            aria-describedby={f.hint ? `${id}-hint` : undefined}
            className="size-4 shrink-0 accent-primary"
          />
          {f.label}
          <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
            {flag}
          </span>
        </label>
        {f.hint && (
          <p
            id={`${id}-hint`}
            className="text-xs leading-snug text-muted-foreground"
          >
            {f.hint}
          </p>
        )}
      </div>
    )

  const missing = b.out.missing.includes(f.name)
  const raw = !!b.draft.raw?.includes(f.name)
  const quoted = b.out.quoted.includes(f.name)
  const dash = f.kind === "text" && !f.format && value.startsWith("-")

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {f.label}
          {!f.optional && (
            <span aria-hidden className="text-destructive">
              {" "}
              *
            </span>
          )}
        </label>
        <span className="font-mono text-xs text-muted-foreground">
          {flag || (f.optional ? "optional" : "")}
        </span>
      </div>
      {f.kind === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(e) => b.set(f.name, e.target.value)}
          aria-describedby={`${id}-hint`}
          className={input}
        >
          {f.optional && <option value="">(none)</option>}
          {f.options!.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={id}
            value={value}
            onChange={(e) => b.set(f.name, e.target.value)}
            placeholder={f.placeholder}
            required={!f.optional}
            aria-invalid={missing || undefined}
            aria-describedby={`${id}-hint`}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className={cn(input, (quoted || raw) && "pr-16")}
          />
          {(quoted || raw) && (
            <button
              type="button"
              onClick={() => b.toggleRaw(f.name)}
              aria-pressed={raw}
              title={
                raw
                  ? "Inserted exactly as typed. Click to let Zenbook quote it again."
                  : "Quoted so it stays one value. Click to insert it exactly as typed."
              }
              className={cn(
                "absolute top-1.5 right-1.5 h-6 rounded-sm px-1.5 font-mono text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                raw
                  ? "bg-tok-var/15 text-tok-var"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {raw ? "raw" : "quoted"}
            </button>
          )}
        </div>
      )}
      <p
        id={`${id}-hint`}
        className="text-xs leading-snug text-muted-foreground"
      >
        {missing ? (
          <span className="text-destructive">Required. </span>
        ) : dash ? (
          <span className="text-tok-var">
            Starts with a dash, so it may be read as an option.{" "}
          </span>
        ) : null}
        {f.hint}
      </p>
    </div>
  )
}

export function Fields({ b, id }: { b: Builder; id: string }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {b.compiled.fields.map((field) => (
        <FieldInput
          key={field.name}
          field={field}
          b={b}
          id={`${id}-${field.name}`}
        />
      ))}
    </div>
  )
}

/** The generated command on a terminal surface, with the template one click away. */
function Output({ b, lang }: { b: Builder; lang?: Lang }) {
  const [view, setView] = useState<"result" | "template">("result")
  const template = useMemo(() => templateText(b.compiled), [b.compiled])
  const editable = b.compiled.fields.length > 0
  const blocked = view === "result" && b.out.missing.length > 0
  const labels = b.compiled.fields
    .filter((f) => b.out.missing.includes(f.name))
    .map((f) => f.label)

  return (
    <div className="dark overflow-hidden rounded-lg border bg-term text-foreground">
      <div className="flex min-h-10 items-center gap-1 border-b px-1.5">
        {editable ? (
          (["result", "template"] as const).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={view === name}
              onClick={() => setView(name)}
              className="h-7 rounded-sm px-2 label-mono text-xs text-muted-foreground capitalize outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {name}
            </button>
          ))
        ) : (
          <span className="px-2 label-mono text-xs text-muted-foreground">
            Command
          </span>
        )}
        <CopyButton
          text={view === "result" ? b.out.text : template}
          label={view === "result" ? "Copy command" : "Copy template"}
          disabled={blocked}
          className="ml-auto"
        >
          Copy
        </CopyButton>
      </div>
      <pre className="px-4 py-3.5 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
        <code>
          {(lang ?? "sh") === "sh" && (
            <span aria-hidden className="text-muted-foreground select-none">
              ${" "}
            </span>
          )}
          {view === "result" ? (
            <CommandLine segs={b.out.segs} lang={lang} interactive />
          ) : (
            highlight(template, lang)
          )}
        </code>
      </pre>
      {editable && (
        <p
          role="status"
          className="border-t px-4 py-2 text-xs text-muted-foreground"
        >
          {blocked ? (
            <span className="text-tok-var">
              Fill in {labels.join(", ")} to copy this command.
            </span>
          ) : view === "result" ? (
            "Click a highlighted value to copy only that part."
          ) : (
            "<name> is required, [brackets] are optional."
          )}
        </p>
      )}
    </div>
  )
}

function Presets({ cmdKey, b }: { cmdKey: string; b: Builder }) {
  const [presets, setPresets] = usePresets()
  const [name, setName] = useState<string | null>(null)
  const mine = presets.filter((p) => p.cmd === cmdKey)
  const current = JSON.stringify(snapshot(b.compiled, b.draft))

  const save = (event: FormEvent) => {
    event.preventDefault()
    const label = name?.trim()
    if (!label) return
    setPresets([
      ...presets,
      {
        id: newId(),
        cmd: cmdKey,
        name: label,
        draft: snapshot(b.compiled, b.draft),
      },
    ])
    setName(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      <span className="text-sm font-medium">Presets</span>
      {mine.map((preset) => (
        <span
          key={preset.id}
          className={cn(
            "flex h-7 items-center rounded-md border font-mono text-xs",
            JSON.stringify(preset.draft) === current &&
              "border-link/50 bg-link/10 text-link"
          )}
        >
          <button
            type="button"
            onClick={() => b.apply(preset.draft)}
            title="Apply this preset"
            className="h-full rounded-l-md px-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {preset.name}
          </button>
          <button
            type="button"
            onClick={() =>
              setPresets(presets.filter((p) => p.id !== preset.id))
            }
            aria-label={`Delete preset ${preset.name}`}
            className="flex h-full items-center rounded-r-md border-l px-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      {name === null ? (
        <Button
          variant="outline"
          size="xs"
          className="label-mono"
          onClick={() => setName("")}
        >
          <FloppyDiskIcon />
          Save current values
        </Button>
      ) : (
        <form onSubmit={save} className="flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setName(null)}
            placeholder="Preset name"
            aria-label="Preset name"
            maxLength={40}
            className={cn(input, "h-7 w-40")}
          />
          <Button
            type="submit"
            size="xs"
            className="label-mono"
            disabled={!name.trim()}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="label-mono"
            onClick={() => setName(null)}
          >
            Cancel
          </Button>
        </form>
      )}
      {!mine.length && name === null && (
        <span className="text-xs text-muted-foreground">
          Keep a set of values to reuse later.
        </span>
      )}
    </div>
  )
}

/** Output, variable inputs, reset and presets: the full interactive command. */
export function CommandBuilder({
  cmdKey,
  source,
}: {
  cmdKey: string
  source: Source
}) {
  const b = useBuilder(cmdKey, source)
  return (
    <div className="flex flex-col gap-3">
      <Output b={b} lang={source.lang} />
      {b.compiled.fields.length > 0 && (
        <section
          aria-label="Variables"
          className="flex flex-col gap-4 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Variables</h2>
            <Button
              variant="ghost"
              size="xs"
              className="label-mono"
              disabled={!b.modified}
              onClick={b.reset}
            >
              <ArrowCounterClockwiseIcon />
              Reset to defaults
            </Button>
          </div>
          <Fields b={b} id={cmdKey.replace(/\W+/g, "-")} />
          <Presets cmdKey={cmdKey} b={b} />
        </section>
      )}
    </div>
  )
}
