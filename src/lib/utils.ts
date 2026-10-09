export { cn } from "cn"

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

/** Clipboard write with a fallback for pages served without HTTPS. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.style.cssText = "position:fixed;opacity:0"
    document.body.append(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}
