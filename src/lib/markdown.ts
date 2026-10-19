import "server-only";
import { Marked } from "marked";
import { slugify } from "./format";

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
        const plain = text.replace(/<[^>]+>/g, "");
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
