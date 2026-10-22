"use client";
import { useRef, useState } from "react";

export type PickerAsset = { id: number; name: string; href: string; markdown: string; image: boolean; label: string; ext: string };

export function CopyButton({ text, label, className = "btn btn-light btn-sm" }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => {
      // Links to the site's own files are copied as full URLs so they work anywhere.
      const full = text.startsWith("/") && !text.startsWith("//") ? window.location.origin + text : text;
      try { await navigator.clipboard.writeText(full); } catch { /* clipboard blocked: leave the text visible below */ }
      setDone(true); setTimeout(() => setDone(false), 1600);
    }}>{done ? "Copied" : label}</button>
  );
}

function Tile({ a, onPick, action }: { a: PickerAsset; onPick: () => void; action: string }) {
  return (
    <button type="button" className="atile" onClick={onPick} title={`${action}: ${a.name}`}>
      <span className="athumb">{a.image ? <img src={a.href} alt="" loading="lazy" /> : <span className="adoc">{a.ext}</span>}</span>
      <span className="aname">{a.name}</span>
      <small>{a.label}</small>
    </button>
  );
}

function Library({ assets, onPick, action, empty }: { assets: PickerAsset[]; onPick: (a: PickerAsset) => void; action: string; empty: string }) {
  const [q, setQ] = useState("");
  const shown = q ? assets.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())) : assets;
  return (
    <div className="apick-pop">
      <div className="apick-bar">
        <input className="input" placeholder="Search the library" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the library" />
        <a className="lnk" href="/admin/assets" target="_blank" rel="noreferrer">Upload or manage assets ↗</a>
      </div>
      {shown.length ? <div className="agrid sm">{shown.map((a) => <Tile key={a.id} a={a} onPick={() => onPick(a)} action={action} />)}</div>
        : <p className="muted" style={{ fontSize: 14, padding: "8px 2px" }}>{assets.length ? "Nothing matches that search." : empty}</p>}
    </div>
  );
}

/** Hero image field: type a URL or choose an image from the library. */
export function HeroPicker({ assets, name, defaultValue }: { assets: PickerAsset[]; name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLDetailsElement>(null);
  const images = assets.filter((a) => a.image);
  return (
    <div className="heropick">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {value && <img className="heroprev" src={value} alt="" />}
        <input className="input" name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="/media/12/hero.jpg" style={{ flex: 1 }} />
        {value && <button type="button" className="btn btn-light btn-sm" onClick={() => setValue("")}>Clear</button>}
      </div>
      <details className="apick" ref={ref}>
        <summary className="lnk">Choose from the library</summary>
        <Library assets={images} action="Use as hero image" empty="No images in the library yet."
          onPick={(a) => { setValue(a.href); if (ref.current) ref.current.open = false; }} />
      </details>
    </div>
  );
}

/** Insert an image or a download link into the body textarea, at the cursor. */
export function InsertAsset({ assets, target }: { assets: PickerAsset[]; target: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [note, setNote] = useState("");
  return (
    <>
    <details className="apick" ref={ref}>
      <summary className="lnk">Insert an image or file from the library</summary>
      <Library assets={assets} action="Insert" empty="The library is empty."
        onPick={(a) => {
          const ta = ref.current?.closest("form")?.querySelector<HTMLTextAreaElement>(`textarea[name="${target}"]`);
          if (!ta) return;
          const at = ta.selectionStart ?? ta.value.length;
          const before = ta.value.slice(0, at), after = ta.value.slice(ta.selectionEnd ?? at);
          const pad = (before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "");
          const snippet = `${pad}${a.markdown}\n\n`;
          ta.value = before + snippet + after;
          ta.focus();
          ta.selectionStart = ta.selectionEnd = before.length + snippet.length;
          setNote(`Inserted “${a.name}”.`);
          if (ref.current) ref.current.open = false;
        }} />
    </details>
    {note && <small className="muted" style={{ display: "block", marginTop: 4 }}>{note}</small>}
    </>
  );
}
