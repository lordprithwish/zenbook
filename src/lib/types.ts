import type { Draft, Lang, Template, VarDef } from "./template.ts"

/**
 * The content model. Everything the site shows comes from objects of these shapes in src/data.
 * Adding a command or a category is a data change only.
 */
export interface Command {
  /** URL slug, unique inside its category. */
  id: string
  name: string
  summary: string
  /** One line, or an array of lines. Placeholders: {{name}}, {{name=default}}, {{name?}}. */
  template: Template
  /** Details for the placeholders. Key order is the order of the input fields. */
  vars?: Record<string, VarDef>
  flags?: [flag: string, description: string][]
  examples?: [title: string, code: string][]
  /** Shown as a warning. Use for anything destructive or hard to undo. */
  warn?: string
  /** Tips. Backticks mark inline code. */
  notes?: string[]
  trouble?: [problem: string, fix: string][]
  /** Extra search keywords. */
  tags?: string[]
  lang?: Lang
}

export interface Category {
  /** URL slug. Must not be "library", "cheatsheets" or "my". */
  id: string
  title: string
  summary: string
  intro: string
  commands: Command[]
}

export interface Cheatsheet {
  id: string
  title: string
  summary: string
  groups: {
    title: string
    /** [command template, description, destructive?] */
    rows: [cmd: string, desc: string, danger?: boolean][]
  }[]
}

/** A command the user wrote. Stored in the browser. */
export interface UserTemplate {
  id: string
  name: string
  summary: string
  template: string
}

export interface Preset {
  id: string
  /** "category/command" */
  cmd: string
  name: string
  draft: Draft
}
