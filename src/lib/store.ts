import { useCallback, useMemo, useSyncExternalStore } from "react"

import type { Draft } from "./template.ts"
import type { Preset, UserTemplate } from "./types.ts"

// Everything personal lives in localStorage. If storage is blocked or full,
// the site keeps working from memory for the rest of the visit.

let disk: Storage | null = null
try {
  disk = window.localStorage
  disk.getItem("zb")
} catch {
  disk = null
}
const memory = new Map<string, string>()
const listeners = new Set<() => void>()

const read = (key: string) =>
  disk ? disk.getItem(key) : (memory.get(key) ?? null)

function write(key: string, value: string | null) {
  try {
    if (value === null) disk?.removeItem(key)
    else disk?.setItem(key, value)
  } catch {
    disk = null
  }
  if (!disk) {
    if (value === null) memory.delete(key)
    else memory.set(key, value)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

/** `fallback` must be a stable reference. Stored data that fails `valid` is ignored. */
function useStored<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => boolean
) {
  const raw = useSyncExternalStore(subscribe, () => read(key))
  const value = useMemo((): T => {
    if (raw === null) return fallback
    try {
      const parsed: unknown = JSON.parse(raw)
      return valid(parsed) ? (parsed as T) : fallback
    } catch {
      return fallback
    }
  }, [raw, fallback, valid])
  const set = useCallback(
    (next: T | null) => write(key, next === null ? null : JSON.stringify(next)),
    [key]
  )
  return [value, set] as const
}

const isString = (v: unknown): v is string => typeof v === "string"
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const isDraft = (v: unknown) =>
  isObject(v) &&
  (v.values === undefined ||
    (isObject(v.values) && Object.values(v.values).every(isString))) &&
  (v.raw === undefined || (Array.isArray(v.raw) && v.raw.every(isString)))
const isList = (item: (v: unknown) => boolean) => (v: unknown) =>
  Array.isArray(v) && v.every(item)

const isFavorites = isList(isString)
const isPresets = isList(
  (v) =>
    isObject(v) && [v.id, v.cmd, v.name].every(isString) && isDraft(v.draft)
)
const isTemplates = isList(
  (v) => isObject(v) && [v.id, v.name, v.summary, v.template].every(isString)
)

const NO_DRAFT: Draft = {}
const NONE: never[] = []

export const useDraft = (key: string) =>
  useStored<Draft>(`zb:draft:${key}`, NO_DRAFT, isDraft)
export const useFavorites = () =>
  useStored<string[]>("zb:favorites", NONE, isFavorites)
export const usePresets = () =>
  useStored<Preset[]>("zb:presets", NONE, isPresets)
export const useTemplates = () =>
  useStored<UserTemplate[]>("zb:templates", NONE, isTemplates)

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
