import Link from "next/link";
import { Flash } from "@/components/site";
import { CopyButton } from "@/components/asset-tools";
import { uploadAssets } from "@/lib/actions/assets";
import { ASSET_ACCEPT, ASSET_ERRORS, assetHref, assetLabel, assetMarkdown, isImage, listAssets, usageCounts } from "@/lib/assets";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assets" };


export default async function AdminAssets({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const all = await listAssets();
  const used = await usageCounts(all.map((a) => a.id));
  const kind = sp.kind === "image" || sp.kind === "document" ? sp.kind : "";
  const q = sp.q?.toLowerCase().trim();
  const shown = all
    .filter((a) => !kind || (kind === "image") === isImage(a))
    .filter((a) => !q || [a.name, a.filename, a.alt ?? ""].some((x) => x.toLowerCase().includes(q)));
  const tab = (k: string) => `/admin/assets${k ? `?kind=${k}` : ""}`;
  return (
    <>
      {sp.ok === "uploaded" && <Flash ok={`Uploaded ${sp.n ?? 1} files.`} />}
      {sp.ok === "deleted" && <Flash ok="Asset deleted." />}
      {sp.error && <Flash err={`${sp.file ? `${sp.file}: ` : ""}${ASSET_ERRORS[sp.error] ?? "Couldn’t upload."}`} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Assets</h1><p className="s">Images and documents to use in blog posts, documents, insights, and documentation. Upload once, reuse anywhere.</p></div></div>
      <section className="panel">
        <form action={uploadAssets} className="aupload">
          <label className="adrop">
            <b>Choose files to upload</b>
            <small>Images (PNG, JPG, GIF, WebP, AVIF) and documents (PDF, Word, Excel, PowerPoint, CSV, text, ZIP). Up to 25 MB each. You can pick several at once.</small>
            <input type="file" name="files" multiple required accept={ASSET_ACCEPT} />
          </label>
          <button className="btn btn-violet" type="submit">Upload</button>
        </form>
      </section>
      <div className="abar">
        <div className="tabsline" style={{ margin: 0 }}>{[["", `All · ${all.length}`], ["image", "Images"], ["document", "Documents"]].map(([k, l]) => <Link key={k} href={tab(k)} className={kind === k ? "on" : ""}>{l}</Link>)}</div>
        <form action="/admin/assets">{kind && <input type="hidden" name="kind" value={kind} />}<input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search assets" aria-label="Search assets" style={{ padding: "9px 12px", width: 240 }} /></form>
      </div>
      {shown.length ? (
        <div className="agrid">
          {shown.map((a) => (
            <div className="assetcard" key={a.id}>
              <Link href={`/admin/assets/${a.id}`} className="athumb">{isImage(a) ? <img src={assetHref(a)} alt={a.alt ?? ""} loading="lazy" /> : <span className="adoc">{a.filename.split(".").pop()?.toUpperCase()}</span>}</Link>
              <div className="abody">
                <Link href={`/admin/assets/${a.id}`} className="aname">{a.name}</Link>
                <small>{assetLabel(a)}</small>
                <small>{used.get(a.id) ? `Used in ${used.get(a.id)} ${used.get(a.id) === 1 ? "place" : "places"}` : "Not used yet"} · {fmtDate(a.updatedAt)}</small>
                <div className="aact">
                  <CopyButton text={assetHref(a)} label="Copy link" />
                  <CopyButton text={assetMarkdown(a)} label="Copy Markdown" />
                  <Link className="btn btn-light btn-sm" href={`/admin/assets/${a.id}`}>Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <section className="panel"><div className="empty">{all.length ? "No assets match." : "No assets yet. Upload images and documents above."}</div></section>}
    </>
  );
}
