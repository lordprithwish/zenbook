import { useMemo, useSyncExternalStore } from "react"

// Hash routing: deep links work on any static host, with no server rewrites.

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

const decode = (part: string) => {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

/** "#/git/clone" gives ["git", "clone"]. */
export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(
    () => hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decode),
    [hash]
  )
}

export const href = (...parts: string[]) =>
  "#/" + parts.map(encodeURIComponent).join("/")
