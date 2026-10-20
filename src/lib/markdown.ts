import "server-only";
import { Marked } from "marked";
import { slugify } from "./format";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
/** Heading text comes back HTML-escaped; the table of contents renders it as plain text. */
function decodeEntities(t: string) {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m);
}

export type TocItem = { level: number; text: string; id: string };

/** Render trusted (admin-authored) markdown to HTML and collect a table of contents. */
export function renderMarkdown(md: string, opts: { shiftHeadings?: number } = {}) {
  const toc: TocItem[] = [];
  const shift = opts.shiftHeadings ?? 0;
  const used = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = decodeEntities(text.replace(/<[^>]+>/g, ""));
        let id = slugify(plain) || "section";
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        const level = Math.min(6, depth + shift);
        toc.push({ level: depth, text: plain, id });
        return `<h${level} id="${id}">${text}</h${level}>`;
      },
      table(token) {
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`).join("");
        return `<div class="tblwrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      },
      code({ text, lang }) {
        const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<div class="code"><div class="codebar"><span>${(lang || "code").toUpperCase()}</span></div><pre><code>${esc}</code></pre></div>`;
      },
      image({ href, text }) {
        return `<span class="shot"><img src="${href}" alt="${text || ""}" loading="lazy"></span>`;
      },
    },
  });
  const html = marked.parse(md, { async: false }) as string;
  return { html, toc };
}
