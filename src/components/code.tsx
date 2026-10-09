import { CheckIcon, CopyIcon, WarningIcon } from "@phosphor-icons/react"
import { Fragment, useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { Lang, Seg } from "@/lib/template"
import { cn, copyText } from "@/lib/utils"

// ---------------------------------------------------------------- highlighting

const SH =
  /(?<com>(?<=^|\s)#.*$)|(?<str>"(?:[^"\\]|\\.)*"|'[^']*')|(?<ph><[A-Za-z_][\w-]*>)|(?<var>\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[0-9@#?$!*])|(?<op>&&|\|\||\d?>>?(?:&\d)?|&>|<<?|[|;&])|(?<flag>(?<=^|[\s(=[])--?[A-Za-z0-9][\w-]*)|(?<ws>\s+)|(?<word>[^\s"'|;&<>$()[\]]+)|(?<any>[\s\S])/gm

const SQL_WORDS =
  "SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|DATABASE|INDEX|VIEW|USER|ROLE|GRANT|REVOKE|ON|TO|ALL|PRIVILEGES|AND|OR|NOT|NULL|IS|IN|AS|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|UNIQUE|IF|EXISTS|WITH|PASSWORD|OWNER|EXPLAIN|ANALYZE|BEGIN|COMMIT|ROLLBACK|TRUNCATE|DESC|ASC|CASCADE|IDENTIFIED|UNION|RETURNING|SHOW|USE|COPY|LIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|ADD|COLUMN|CONSTRAINT|VACUUM|SCHEMA|TABLES|DATABASES|RENAME|CONCURRENTLY"
const SQL = new RegExp(
  `(?<com>--.*$)|(?<str>'(?:[^']|'')*')|(?<ph><[A-Za-z_][\\w-]*>)|(?<flag>\\b(?:${SQL_WORDS})\\b)|(?<ws>\\s+)|(?<any>[\\s\\S])`,
  "gim"
)

/** Words after which the next word is still a command. */
const PREFIX = new Set([
  "sudo",
  "xargs",
  "time",
  "watch",
  "nohup",
  "exec",
  "env",
])

const STYLE: Record<string, string> = {
  com: "text-muted-foreground italic",
  str: "text-tok-str",
  ph: "text-tok-var",
  var: "text-tok-var",
  op: "text-muted-foreground",
  flag: "text-link",
  cmd: "font-semibold",
}

/**
 * A small tokenizer, enough to make shell and SQL one-liners scannable.
 * `atCommand` says whether the text starts where a command name is expected.
 */
export function highlight(code: string, lang: Lang = "sh", atCommand = true) {
  if (lang === "text") return [code]
  const out: ReactNode[] = []
  let plain = ""
  let expectCommand = atCommand && lang === "sh"
  let lastWord = ""
  const flush = () => {
    if (plain) out.push(plain)
    plain = ""
  }
  for (const m of code.matchAll(lang === "sql" ? SQL : SH)) {
    const groups = m.groups!
    const type = Object.keys(groups).find((k) => groups[k] !== undefined)!
    const text = m[0]
    let style = STYLE[type]
    if (type === "ws") {
      if (text.includes("\n") && lastWord !== "\\")
        expectCommand = lang === "sh"
    } else if (type === "op") {
      if (/^(&&|\|\||[|;&])$/.test(text)) expectCommand = true
    } else if (type === "any") {
      if (text === "(") expectCommand = true
    } else if (type === "word") {
      if (expectCommand && text !== "\\" && !/^\w+=/.test(text)) {
        style = STYLE.cmd
        expectCommand = PREFIX.has(text)
      }
      lastWord = text
    } else if (type !== "com") {
      expectCommand = false
    }
    if (style) {
      flush()
      out.push(
        <span key={out.length} className={style}>
          {text}
        </span>
      )
    } else plain += text
  }
  flush()
  return out
}

// --------------------------------------------------------------------- copying

/** Copy state that resets itself, so a button can flash "copied". */
function useCopy() {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle")
  useEffect(() => {
    if (state === "idle") return
    const timer = setTimeout(() => setState("idle"), 1400)
    return () => clearTimeout(timer)
  }, [state])
  const copy = async (text: string) =>
    setState((await copyText(text)) ? "ok" : "fail")
  return [state, copy] as const
}

export function CopyButton({
  text,
  label = "Copy",
  children,
  className,
  ...props
}: {
  text: string
  label?: string
  children?: ReactNode
} & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const [state, copy] = useCopy()
  const Icon =
    state === "ok" ? CheckIcon : state === "fail" ? WarningIcon : CopyIcon
  return (
    <Button
      variant="ghost"
      size={children ? "sm" : "icon-sm"}
      aria-label={children ? undefined : label}
      title={label}
      className={cn(
        "shrink-0 label-mono text-xs",
        state === "ok" && "text-tok-str",
        className
      )}
      {...props}
      onClick={() => copy(text)}
    >
      <Icon weight={state === "ok" ? "bold" : "regular"} />
      {children &&
        (state === "ok" ? "Copied" : state === "fail" ? "Failed" : children)}
      <span role="status" className="sr-only">
        {state === "ok" ? "Copied" : state === "fail" ? "Copy failed" : ""}
      </span>
    </Button>
  )
}

// ---------------------------------------------------------------------- blocks

/** Prose with `inline code` marked by backticks. */
export function Inline({ text }: { text: string }) {
  return text.split("`").map((part, i) =>
    i % 2 ? (
      <code
        key={i}
        className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      >
        {part}
      </code>
    ) : (
      part
    )
  )
}

/** A static, copyable code block. Used for documentation and examples. */
export function CodeBlock({
  code,
  lang,
  className,
}: {
  code: string
  lang?: Lang
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1 rounded-lg border bg-muted/50 py-1 pr-1 pl-3",
        className
      )}
    >
      <pre className="min-w-0 flex-1 py-1.5 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">
        <code>{highlight(code, lang)}</code>
      </pre>
      <CopyButton text={code} label="Copy example" />
    </div>
  )
}

/**
 * A generated command, drawn from its segments. Literal text is highlighted,
 * the user's values are tinted, and missing required values stand out.
 * With `interactive`, each value is a button that copies just that part.
 */
export function CommandLine({
  segs,
  lang,
  interactive,
}: {
  segs: Seg[]
  lang?: Lang
  interactive?: boolean
}) {
  const [copied, setCopied] = useState(-1)
  useEffect(() => {
    if (copied < 0) return
    const timer = setTimeout(() => setCopied(-1), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  return segs.map((seg, i) => {
    if (seg.kind === "text")
      return <Fragment key={i}>{highlight(seg.text, lang, i === 0)}</Fragment>
    if (seg.kind === "missing")
      return (
        <span
          key={i}
          className="rounded-sm bg-tok-var/15 text-tok-var underline decoration-dashed underline-offset-4"
        >
          {seg.text}
        </span>
      )
    if (!interactive)
      return (
        <span key={i} className="text-link">
          {seg.text}
        </span>
      )
    return (
      <button
        key={i}
        type="button"
        title="Copy this part"
        onClick={async () => (await copyText(seg.text)) && setCopied(i)}
        className={cn(
          "rounded-sm text-left break-words whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
          copied === i
            ? "bg-tok-str/25 text-tok-str"
            : "bg-link/15 text-link hover:bg-link/30"
        )}
      >
        {seg.text}
        {copied === i && (
          <span role="status" className="sr-only">
            Copied {seg.text}
          </span>
        )}
      </button>
    )
  })
}
