"use client";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; text: string; className?: string };

/**
 * Table-of-contents links that highlight the section being read. The highlight
 * follows the scroll position, and jumps straight to a section when its link is clicked.
 * `offset` is how far below the top of the window a heading counts as "reached".
 */
export function TocLinks({ items, offset = 120 }: { items: Item[]; offset?: number }) {
  const [active, setActive] = useState(items[0]?.id);
  const clicked = useRef<string | null>(null);
  const settle = useRef<number>(0);

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => !!h);
    if (!headings.length) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      // While a clicked link's smooth scroll is running, keep the clicked section selected.
      if (clicked.current) {
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => { clicked.current = null; }, 150);
        return;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = headings[0].id;
      if (atBottom) current = headings[headings.length - 1].id;
      else for (const h of headings) if (h.getBoundingClientRect().top <= offset) current = h.id;
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (fromHash && headings.some((h) => h.id === fromHash)) setActive(fromHash);
    else update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Lazy images above a heading change its position without a scroll event.
    const resize = new ResizeObserver(onScroll);
    resize.observe(document.body);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle.current);
    };
  }, [items, offset]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setActive(id);
    clicked.current = id;
    window.clearTimeout(settle.current);
    // If the page can't scroll (already in place), release the lock right away.
    settle.current = window.setTimeout(() => { clicked.current = null; }, 400);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} onClick={(e) => go(e, i.id)} aria-current={active === i.id ? "location" : undefined}
          className={[i.className, active === i.id ? "on" : ""].filter(Boolean).join(" ") || undefined}>{i.text}</a>
      ))}
    </>
  );
}
