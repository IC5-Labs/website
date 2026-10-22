import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/site";
import { CopyButton } from "@/components/asset-tools";
import { deleteAsset, updateAsset } from "@/lib/actions/assets";
import { ASSET_ACCEPT, ASSET_ERRORS, assetHref, assetLabel, assetMarkdown, assetUsage, getAssetMeta, isImage } from "@/lib/assets";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit asset" };

const TYPE: Record<string, string> = { blog: "Blog post", document: "Document", insight: "Insight" };

export default async function EditAsset({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const a = await getAssetMeta(Number(id) || 0);
  if (!a) notFound();
  const usage = await assetUsage(a.id);
  const img = isImage(a);
  const href = assetHref(a);
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/assets">Assets</Link> / <b>{a.name.slice(0, 50)}</b></div>
      {sp.ok && <Flash ok={{ uploaded: "Uploaded. Add alt text so people using screen readers know what the image shows.", saved: "Saved.", replaced: "File replaced. Everywhere that uses this asset now shows the new file." }[sp.ok] ?? "Saved."} />}
      {sp.error && <Flash err={ASSET_ERRORS[sp.error] ?? "Couldn’t save."} />}
      <div className="ahead"><div><div className="eyebrow">Asset</div><h1>{a.name}</h1><p className="s">{assetLabel(a)} · Updated {fmtDate(a.updatedAt)}</p></div>
        <div className="ahead-act"><a className="btn btn-ghost2" href={href} target="_blank" rel="noreferrer">Open file ↗</a></div></div>
      <div className="aedit">
        <section className="panel">
          <div className="apreview">{img ? <img src={href} alt={a.alt ?? ""} /> : <span className="adoc lg">{a.filename.split(".").pop()?.toUpperCase()}</span>}</div>
          <div className="field" style={{ marginTop: 18 }}><span>Link</span><div className="copybox mono">{href}</div>
            <div className="aact"><CopyButton text={href} label="Copy link" /><CopyButton text={assetMarkdown(a)} label="Copy Markdown" /></div>
            <small>{img ? "Paste the Markdown into a resource body to show the image, or use the link as a hero image." : "Paste the Markdown into a resource body to add a download link."} Resource editors can also insert it straight from the library.</small></div>
        </section>
        <div>
          <form action={updateAsset} className="panel">
            <input type="hidden" name="id" value={a.id} />
            <div className="formgrid" style={{ gridTemplateColumns: "1fr" }}>
              <label className="field"><span>Name</span><input className="input" name="name" defaultValue={a.name} required maxLength={200} /><small>{img ? "Used to find it in the library." : "Used as the link text when inserted into a resource."}</small></label>
              {img && <label className="field"><span>Alt text</span><textarea className="textarea" name="alt" defaultValue={a.alt ?? ""} maxLength={300} style={{ minHeight: 70 }} placeholder="Describe what the image shows" /><small>Read aloud by screen readers and shown if the image can’t load.</small></label>}
              <label className="field"><span>Replace file</span><input className="input" type="file" name="file" accept={ASSET_ACCEPT} /><small>Keeps the same link, so every resource using it updates. Current file: {a.filename}</small></label>
            </div>
            <div style={{ marginTop: 18 }}><button className="btn btn-violet" type="submit">Save</button></div>
          </form>
          <section className="panel">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--dark)" }}>Where it’s used</h2>
            {usage.count ? (
              <ul className="ause">
                {usage.resources.map((r) => <li key={`r${r.id}`}><Link className="lnk" href={`/admin/resources/${r.id}`}>{r.title}</Link><small>{TYPE[r.type]}{r.status !== "published" ? " · Draft" : ""}</small></li>)}
                {usage.docs.map((d) => <li key={`d${d.id}`}><Link className="lnk" href={`/admin/docs/${d.id}`}>{d.title}</Link><small>Documentation · v{d.version}</small></li>)}
              </ul>
            ) : <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>Not used in any resource or documentation page yet.</p>}
          </section>
          <section className="panel">
            <details className="adel">
              <summary className="btn btn-danger btn-sm">Delete asset</summary>
              <form action={deleteAsset} className="adel-body">
                <input type="hidden" name="id" value={a.id} />
                <p>{usage.count ? <><b>This asset is used in {usage.count} {usage.count === 1 ? "place" : "places"}.</b> Deleting it breaks {img ? "the image" : "the link"} there. </> : null}Deleting can’t be undone.</p>
                <button className="btn btn-danger btn-sm" type="submit">Delete permanently</button>
              </form>
            </details>
          </section>
        </div>
      </div>
    </>
  );
}
