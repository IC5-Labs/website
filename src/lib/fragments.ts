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

/** The product mockup (`<div class="vis">…</div>`) from a product's section of the products page. */
export function productVisual(slug: string): string | null {
  const html = fragment("products-body");
  const at = html.indexOf(`id="${slug}"`);
  if (at < 0) return null;
  const start = html.indexOf('<div class="vis">', at);
  if (start < 0) return null;
  const tag = /<\/?div\b[^>]*>/g;
  tag.lastIndex = start;
  let depth = 0;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return null;
}

const APPS: [string, string][] = [["customer-signals", "Customer Signals"], ["product-model", "Product Model"], ["release-intelligence", "Release Intelligence"]];

/**
 * Link the static marketing markup to the product and agent pages: agent chips become links,
 * and each app's chip row (Customer Signals, Product Model, Release Intelligence, in that order)
 * is followed by a link to the app's page.
 */
export function withCatalogLinks(html: string): string {
  let i = 0;
  return html
    .replace(/<span class="agent">([^<]+)<\/span>/g, (_, name: string) =>
      `<a class="agent" href="/agents/${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${name}</a>`)
    .replace(/<div class="agents">(?:(?!<\/div>)[\s\S])*<\/div>/g, (chips) => {
      const app = APPS[i++];
      return app ? `${chips}<a class="lnk dlink" href="/products/${app[0]}">Explore ${app[1]} &nbsp;→</a>` : chips;
    });
}
