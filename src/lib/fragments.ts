import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

const cache = new Map<string, string>();

/** Approved static markup for marketing pages, extracted from the signed-off design. */
export function fragment(name: string): string {
  if (!cache.has(name)) {
    cache.set(name, readFileSync(path.join(process.cwd(), "src/content/fragments", `${name}.html`), "utf8"));
  }
  return cache.get(name)!;
}

/** Split a fragment at a marker. Returns [before, fromMarker]. */
export function splitAt(html: string, marker: string): [string, string] {
  const i = html.indexOf(marker);
  if (i < 0) return [html, ""];
  return [html.slice(0, i), html.slice(i)];
}
