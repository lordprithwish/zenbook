# Zenbook

An interactive developer knowledge base: documentation, cheatsheets and commands with
editable variables, in one fast static site.

**Find it. Understand it. Customize it. Copy it.**

- **Library**: commands grouped by category (Linux, Git, Docker, Kubernetes, Networking,
  SSH, Databases, Programming Languages, Development Tools). Each has a summary, flags,
  examples, notes, troubleshooting, and a warning when it can destroy data.
- **Command builder**: every command is a template. Type your values, watch the command
  update, copy all of it or one part.
- **Cheatsheets**: compact pages where every line copies with one click and lines with
  values can be edited in place.
- **My Zenbook**: favorites, presets and your own templates, stored in the browser.

No account, no backend. The output is a folder of static files.

## Run it

```bash
pnpm install
pnpm dev        # development server
pnpm check      # test the template engine and validate all content
pnpm build      # type-check and build to dist/
pnpm preview    # serve the build locally
pnpm lint
```

`pnpm check` runs TypeScript directly in Node, so it needs Node 22.18 or newer.

## Deploy

Upload `dist/` to any static host. Routing uses the URL hash (`#/git/clone`) and asset
paths are relative, so the site works at a domain root or in a subfolder, with no rewrite
rules and no 404 fallback page.

| Host | Setting |
| --- | --- |
| GitHub Pages | Publish the contents of `dist/` |
| Cloudflare Pages | Build command `pnpm build`, output directory `dist` |
| Anything else | Copy `dist/` to the web root or a subfolder |

## Add content

All content lives in `src/data`. Adding a command, a category or a cheatsheet is a data
change. No component needs to be written or touched.

### A command

Add an object to the `commands` array of a category file such as `src/data/git.ts`:

```ts
{
  id: "clone",                       // URL slug: #/git/clone
  name: "git clone",
  summary: "Copy a remote repository into a new local directory.",
  template: "git clone {{depth}} {{url}} {{dir}}",
  vars: {
    url: { label: "Repository URL", default: "git@github.com:user/project.git", hint: "SSH or HTTPS address." },
    dir: { optional: true, default: "my-project", hint: "Folder to clone into." },
    depth: { optional: true, format: "--depth {}", placeholder: "1", hint: "Only the last N commits." },
  },
  flags: [["--depth <n>", "Shallow clone."]],
  examples: [["Fast clone for CI", "git clone --depth 1 https://github.com/user/project.git"]],
  warn: "Shown as a warning. Use it for anything destructive.",
  notes: ["Tips. Backticks mark `inline code`."],
  trouble: [["The error message", "How to fix it."]],
  tags: ["extra", "search", "words"],
}
```

Only `id`, `name`, `summary` and `template` are required.

### Template syntax

| Write | Meaning |
| --- | --- |
| `{{name}}` | A required value |
| `{{name=default}}` | A value that starts prefilled |
| `{{name?}}` | An optional value, left out when empty |
| `\{{` | A literal `{{` |

A template can be one string or an array of lines. A line whose placeholders are all
empty disappears, and a dangling `\` continuation is removed with it. Text that does not
look like a placeholder, such as Docker's `{{.Names}}`, is left alone.

### Variable options

Each key of `vars` describes one placeholder. The key order is the order of the inputs.

| Option | Effect |
| --- | --- |
| `label`, `hint`, `placeholder` | Text for the input field |
| `default` | Initial value. For a toggle, any non-empty string means on |
| `optional` | Leave the argument out when the value is empty |
| `format` | How the value is written, `{}` being the value: `"--depth {}"`, `"-p {}"`, `":{}"` |
| `toggle` | A checkbox that emits `format` when on |
| `options` | A fixed list of choices, shown as a select |
| `quote` | `auto` (default), `always`, or `raw` to never touch the value |

Set `lang: "sql"` for SQL statements and `lang: "text"` for config snippets such as a
crontab line, where values must go in exactly as typed.

### A category

Create `src/data/<name>.ts` that exports a `Category`, then add it to the list in
`src/data/index.ts`. The order of that list is the order in the sidebar.

### A cheatsheet

Add a sheet to `src/data/cheatsheets.ts`. Each row is
`[command, description, destructive?]`. Rows that use `{{name=default}}` become editable
in place.

### Check your work

`pnpm check` fails if an id is duplicated, a variable is not used in its template, or a
command does not render a complete working example from its defaults.

## How commands are generated

The engine in `src/lib/template.ts` never edits a value. It only adds what the shell
needs to read the value as the single argument you typed:

- A value made of safe characters is inserted as it is.
- Anything else is wrapped in single quotes. A leading `~/` stays outside the quotes so it
  still expands.
- A placeholder that already sits inside quotes in the template is escaped for that kind
  of quote, not wrapped again.
- In SQL templates a quote inside a value is doubled.
- When a value was quoted, the field shows a `quoted` tag. Clicking it switches that field
  to `raw`, which inserts the value exactly as typed, for cases like `$HOME` or `*.log`.
- A required value that is empty shows as `<name>` and copying is disabled until it is
  filled in.

## Keyboard

| Key | Action |
| --- | --- |
| `/` or `Ctrl K` | Search everything |
| `↑` `↓` `Enter` | Move through results and open one |
| `Esc` | Close search or the menu |
| `D` | Switch between light and dark |

## Project layout

```
src/
  data/         content: one file per category, plus cheatsheets
  lib/          template engine, search, hash router, localStorage store
  components/   builder, code blocks, search dialog, page shell
  pages/        landing, library, cheatsheets, My Zenbook
scripts/check.ts   engine tests and content validation
```

Personal data is kept in `localStorage` under keys that start with `zb:`. Clearing site
data resets it.
