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

type CatalogItem = { slug: string; name: string; active: boolean };

/** End index (exclusive) of the element whose opening tag starts at `start`, by balancing tags of the same name. */
function elementEnd(html: string, start: number, tagName: string): number {
  const tag = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "g");
  tag.lastIndex = start;
  let depth = 0;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return html.length;
}

/** Remove a section of static markup by its opening tag, e.g. '<section class="blk light" id="csa">'. */
export function removeElement(html: string, openingTag: string): string {
  const start = html.indexOf(openingTag);
  if (start < 0) return html;
  const name = openingTag.match(/^<(\w+)/)![1];
  return html.slice(0, start) + html.slice(elementEnd(html, start, name));
}

/**
 * Fit the approved static marketing markup to the catalog in the database:
 * - sections and cards for inactive products are removed, and active ones get a link to their page;
 * - agent chips link to the agent's page, and chips for inactive agents are removed.
 */
export function withCatalogLinks(html: string, catalog: { products: CatalogItem[]; agents: CatalogItem[] }): string {
  const bySlug = new Map(catalog.products.map((p) => [p.slug, p]));
  const byName = new Map(catalog.products.map((p) => [p.name, p]));
  const agentByName = new Map(catalog.agents.map((a) => [a.name, a]));

  // Product blocks: deep-dive sections on the products page and app cards on the homepage.
  const opens = [...html.matchAll(/<div class="dive" id="([a-z0-9-]+)">|<div class="app(?: live)?">/g)];
  for (const m of opens.reverse()) {
    const start = m.index!;
    const end = elementEnd(html, start, "div");
    const block = html.slice(start, end);
    const product = m[1] ? bySlug.get(m[1]) : byName.get(block.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() ?? "");
    if (!product) continue;
    let next = "";
    if (product.active) {
      const link = `<a class="lnk dlink" href="/products/${product.slug}">Explore ${product.name} &nbsp;→</a>`;
      const chips = block.match(/<div class="agents">(?:(?!<\/div>)[\s\S])*<\/div>/);
      next = chips ? block.replace(chips[0], chips[0] + link) : block;
    }
    html = html.slice(0, start) + next + html.slice(end);
  }

  return html.replace(/<span class="agent">([^<]+)<\/span>/g, (chip, name: string) => {
    const a = agentByName.get(name.trim());
    if (!a) return chip;
    return a.active ? `<a class="agent" href="/agents/${a.slug}">${name}</a>` : "";
  });
}
