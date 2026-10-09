// Self-check for the template engine and the content data. Run with `pnpm check`.
import assert from "node:assert/strict"

import { categories, cheatsheets } from "../src/data/index.ts"
import {
  lookup,
  recommend,
  refKey,
  related,
  STARTERS,
} from "../src/lib/catalog.ts"
import { buildIndex, search } from "../src/lib/search.ts"
import {
  compile,
  isModified,
  quote,
  render,
  templateText,
} from "../src/lib/template.ts"

// --- quoting -----------------------------------------------------------------
assert.equal(quote("abc"), "abc")
assert.equal(
  quote("git@github.com:user/project.git"),
  "git@github.com:user/project.git"
)
assert.equal(quote("my file.txt"), "'my file.txt'")
assert.equal(quote("it's"), `'it'\\''s'`)
assert.equal(quote("$HOME"), "'$HOME'")
assert.equal(quote("a;rm -rf /"), "'a;rm -rf /'")
assert.equal(quote("*.log"), "'*.log'")
assert.equal(quote("~"), "~")
assert.equal(quote("~/src"), "~/src")
assert.equal(quote("~/my dir"), "~/'my dir'")
assert.equal(quote("fix", true), "'fix'")
assert.equal(quote(""), "''")
assert.equal(quote("naïve"), "'naïve'")
assert.equal(quote("KEY=value"), "KEY=value")
assert.equal(quote("=ls"), "'=ls'")
assert.equal(quote("a!b"), "'a!b'")

// --- optional arguments and required fields ----------------------------------
const clone = compile("git clone {{depth}} {{url}} {{dir}}", {
  url: { default: "git@github.com:user/project.git" },
  dir: { optional: true },
  depth: { optional: true, format: "--depth {}" },
})
assert.deepEqual(
  clone.fields.map((f) => f.name),
  ["url", "dir", "depth"]
)
assert.equal(render(clone).text, "git clone git@github.com:user/project.git")
assert.equal(
  render(clone, { values: { dir: "my project", depth: "1" } }).text,
  "git clone --depth 1 git@github.com:user/project.git 'my project'"
)
const empty = render(clone, { values: { url: "" } })
assert.equal(empty.text, "git clone <url>")
assert.deepEqual(empty.missing, ["url"])
assert.equal(templateText(clone), "git clone [--depth <depth>] <url> [<dir>]")
assert.equal(isModified(clone, {}), false)
assert.equal(isModified(clone, { values: { dir: "x" } }), true)

// --- a value is never read as a replacement pattern ---------------------------
const grep = compile("grep {{p}} f", { p: { format: "-e {}" } })
assert.equal(render(grep, { values: { p: "$&" } }).text, "grep -e '$&' f")
assert.equal(
  render(grep, { values: { p: "$1" }, raw: ["p"] }).text,
  "grep -e $1 f"
)

// --- raw mode and the quoted report -------------------------------------------
const quotedRun = render(clone, { values: { dir: "$HOME/x" } })
assert.equal(
  quotedRun.text,
  "git clone git@github.com:user/project.git '$HOME/x'"
)
assert.deepEqual(quotedRun.quoted, ["dir"])
const rawRun = render(clone, { values: { dir: "$HOME/x" }, raw: ["dir"] })
assert.equal(rawRun.text, "git clone git@github.com:user/project.git $HOME/x")
assert.deepEqual(rawRun.quoted, [])

// --- multiple lines: omitted lines vanish, no dangling continuation -----------
const run = compile(
  ["docker run -d \\", "  {{name}} \\", "  {{port}} \\", "  {{image}}"],
  {
    name: { optional: true, format: "--name {}" },
    port: { optional: true, format: "-p {}" },
    image: { default: "nginx" },
  }
)
assert.equal(render(run).text, "docker run -d \\\n  nginx")
assert.equal(
  render(run, { values: { name: "web" } }).text,
  "docker run -d \\\n  --name web \\\n  nginx"
)
const tail = compile(["tar -czf a.tgz src \\", "  {{exclude?}}"])
assert.equal(render(tail).text, "tar -czf a.tgz src")
assert.equal(
  render(tail, { values: { exclude: "x" } }).text,
  "tar -czf a.tgz src \\\n  x"
)
const lead = compile("{{sudo}} apt install {{pkg=curl}}", {
  sudo: { toggle: true, format: "sudo" },
})
assert.equal(render(lead).text, "apt install curl")
assert.equal(
  render(lead, { values: { sudo: "1" } }).text,
  "sudo apt install curl"
)

// --- placeholders inside quotes are escaped, not wrapped ----------------------
const commit = compile('git commit -m "{{msg}}"')
assert.equal(
  render(commit, { values: { msg: 'say "hi" to $USER' } }).text,
  'git commit -m "say \\"hi\\" to \\$USER"'
)
const echo = compile("echo '{{t}}' && echo {{t}}")
assert.equal(
  render(echo, { values: { t: "it's" } }).text,
  `echo 'it'\\''s' && echo 'it'\\''s'`
)
const afterComment = compile(["# don't touch", "ls {{dir=my dir}}"])
assert.equal(render(afterComment).text, "# don't touch\nls 'my dir'")

// --- SQL: quotes are doubled, bare identifiers are left alone -----------------
const user = compile("CREATE USER {{user}} WITH PASSWORD '{{pw}}';", {}, "sql")
assert.equal(
  render(user, { values: { user: "app", pw: "o'brien" } }).text,
  "CREATE USER app WITH PASSWORD 'o''brien';"
)

// --- text templates: values go in exactly as typed, optional lines still vanish ---
const host = compile(
  ["Host {{alias}}", "  HostName {{host}}", "  {{port}}", "  {{note}}"],
  {
    port: { optional: true, format: "Port {}" },
    note: { optional: true, format: "# {}" },
  },
  "text"
)
assert.equal(
  render(host, {
    values: { alias: "prod", host: "example.com", note: "don't panic" },
  }).text,
  "Host prod\n  HostName example.com\n  # don't panic"
)
const cron = compile("{{minute}} {{hour}} * * * {{command}}", {}, "text")
assert.equal(
  render(cron, {
    values: {
      minute: "*/5",
      hour: "*",
      command: "/usr/bin/backup.sh >> /var/log/b.log 2>&1",
    },
  }).text,
  "*/5 * * * * /usr/bin/backup.sh >> /var/log/b.log 2>&1"
)
const steps = compile("git reset --hard HEAD@{{{steps=1}}}")
assert.equal(render(steps).text, "git reset --hard HEAD@{1}")

// --- literal braces, toggles, selects, inline syntax --------------------------
const fmt = compile("docker ps --format '{{.Names}}' \\{{end}}")
assert.equal(fmt.fields.length, 0)
assert.equal(render(fmt).text, "docker ps --format '{{.Names}}' {{end}}")
const rm = compile("rm {{r}} {{f}} {{path}}", {
  r: { toggle: true, format: "-r" },
  f: { toggle: true, format: "-f", default: "1" },
  path: { default: "build" },
})
assert.equal(render(rm).text, "rm -f build")
assert.equal(templateText(rm), "rm [-r] [-f] <path>")
const unit = compile("systemctl {{action}} {{unit}}", {
  action: { options: ["start", "stop"] },
  unit: { default: "nginx" },
})
assert.equal(render(unit).text, "systemctl start nginx")
const inline = compile("mkdir -p {{dir=my app}} {{mode?}}")
assert.equal(render(inline).text, "mkdir -p 'my app'")
assert.equal(inline.fields[1].optional, true)

// --- content data -------------------------------------------------------------
const RESERVED = ["library", "cheatsheets", "my"]
const slug = /^[a-z0-9][a-z0-9-]*$/
const seen = new Set<string>()
let commands = 0
for (const cat of categories) {
  assert.match(cat.id, slug, `category id ${cat.id}`)
  assert.ok(!RESERVED.includes(cat.id), `category id ${cat.id} is reserved`)
  assert.ok(!seen.has(cat.id), `duplicate category ${cat.id}`)
  seen.add(cat.id)
  const ids = new Set<string>()
  for (const cmd of cat.commands) {
    const at = `${cat.id}/${cmd.id}`
    commands++
    assert.match(cmd.id, slug, at)
    assert.ok(!ids.has(cmd.id), `duplicate command ${at}`)
    ids.add(cmd.id)
    const c = compile(cmd.template, cmd.vars, cmd.lang)
    for (const name of Object.keys(cmd.vars ?? {}))
      assert.ok(
        c.fields.some((f) => f.name === name),
        `${at}: var "${name}" is not in the template`
      )
    for (const f of c.fields) {
      if (f.kind === "toggle")
        assert.ok(f.format, `${at}: toggle "${f.name}" needs a format`)
      if (f.kind === "select" && f.default)
        assert.ok(
          f.options!.includes(f.default),
          `${at}: default of "${f.name}" is not an option`
        )
    }
    // Every built-in command must be a working example before the user types anything.
    const out = render(c)
    assert.deepEqual(
      out.missing,
      [],
      `${at}: required values without a default`
    )
    assert.ok(out.text.trim(), `${at}: renders empty`)
    for (const text of [
      cmd.name,
      cmd.summary,
      out.text,
      cmd.warn ?? "",
      ...(cmd.notes ?? []),
    ])
      assert.ok(!/[—–]/.test(text), `${at}: use a plain hyphen`)
  }
}
for (const sheet of cheatsheets) {
  assert.match(sheet.id, slug, `cheatsheet id ${sheet.id}`)
  for (const group of sheet.groups)
    for (const [cmd] of group.rows)
      assert.deepEqual(
        render(compile(cmd)).missing,
        [],
        `${sheet.id}: "${cmd}" needs defaults`
      )
}

// --- related links point at something real ------------------------------------
for (const cat of categories)
  for (const cmd of cat.commands)
    for (const ref of cmd.related ?? []) {
      const key = refKey(ref, cat.id)
      assert.ok(lookup(key), `${cat.id}/${cmd.id}: related "${ref}" not found`)
      assert.notEqual(key, `${cat.id}/${cmd.id}`, `${key} relates to itself`)
    }
for (const key of STARTERS) assert.ok(lookup(key), `starter ${key} not found`)
// Links work both ways: mv names pwd, so pwd lists mv.
assert.ok(related("linux/mv").some((i) => i.key === "linux/pwd"))
assert.ok(related("linux/pwd").some((i) => i.key === "linux/mv"))
assert.ok(related("cheatsheets/git-undo").some((i) => i.key === "git/reset"))
const picks = recommend(["linux/mv"])
assert.ok(picks.length && picks.every(({ item }) => item.key !== "linux/mv"))

// --- search: plain questions, synonyms, typos ----------------------------------
const index = buildIndex(categories, cheatsheets, [])
const top = (q: string, n = 3) =>
  search(index, q, n).map((h) => h.key ?? h.title)
assert.equal(top("pwd")[0], "linux/pwd")
assert.ok(top("where am i").includes("linux/pwd"), "where am i")
assert.ok(top("how do I rename a file").includes("linux/mv"), "rename")
assert.ok(top("delete a directory").includes("linux/rm"), "delete")
assert.ok(top("undo commit", 5).includes("git/reset"), "undo commit")
assert.ok(top("kubctl logs").includes("kubernetes/logs"), "typo")
assert.ok(top("dokcer ps").includes("docker/ps"), "typo")
assert.deepEqual(search(index, "zzzzqqq"), [])
assert.equal(
  search(index, "status", 1, new Set(["docker/ps"]))[0].key,
  "git/status",
  "a favorite boost does not bury an exact name"
)

console.log(
  `ok: engine checks passed, ${categories.length} categories, ${commands} commands, ${cheatsheets.length} cheatsheets`
)
