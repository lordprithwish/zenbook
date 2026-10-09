import type { Category, Cheatsheet } from "../lib/types.ts"
import sheets from "./cheatsheets.ts"
import databases from "./databases.ts"
import docker from "./docker.ts"
import git from "./git.ts"
import kubernetes from "./kubernetes.ts"
import languages from "./languages.ts"
import linux from "./linux.ts"
import networking from "./networking.ts"
import ssh from "./ssh.ts"
import tools from "./tools.ts"

// The order here is the order in the sidebar. To add a category: write a file
// that exports a Category, import it, and add it to this list. No UI changes needed.
export const categories: Category[] = [
  linux,
  git,
  docker,
  kubernetes,
  networking,
  ssh,
  databases,
  languages,
  tools,
]

export const cheatsheets: Cheatsheet[] = sheets
