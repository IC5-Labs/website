import Link from "next/link";
import { SiteNav } from "@/components/site";
import { docsCatalog, searchDocs } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documentation" };

export default async function DocsHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const catalog = await docsCatalog();
  const results = sp.q ? await searchDocs(sp.q, sp.product, sp.version) : null;
  const live = catalog.find((c) => c.versions.length);
  const latest = live?.versions[0]?.version;
  return (
    <div className="appbody docsbody">
      <section className="dhero"><div className="dots" /><div className="wrap" style={{ position: "relative" }}>
        <SiteNav active="/resources" />
        <div style={{ marginTop: 56 }}>
          <div className="eyebrow">Documentation</div>
          <h1>Install, configure, and get the most from IC5 Labs products.</h1>
          <form className="bigsearch" action="/docs" role="search" style={{ padding: 6 }}>
            {sp.product && <input type="hidden" name="product" value={sp.product} />}
            {sp.version && <input type="hidden" name="version" value={sp.version} />}
            <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search all documentation" aria-label="Search documentation" style={{ border: 0, background: "transparent", fontSize: 17 }} />
            <button className="btn btn-primary btn-sm" type="submit">Search</button>
          </form>
          {live && latest && (
            <div className="popular"><span>Popular:</span>
              <Link href={`/docs/${live.product.slug}/${latest}/installation#configuration-instructions`}>Configuration instructions</Link>
              <Link href={`/docs/${live.product.slug}/${latest}/installation#external-systems-connection`}>External systems connection</Link>
              <Link href={`/docs/${live.product.slug}/${latest}/installation#troubleshooting`}>Troubleshooting</Link>
            </div>
          )}
        </div>
      </div></section>
      <main className="wrap" style={{ padding: "56px 24px 90px" }}>
        {results && (
          <div className="panel" style={{ marginTop: 0, marginBottom: 36 }}>
            <div className="phead"><div><h2>Search results</h2><p>{results.length} result{results.length === 1 ? "" : "s"} for “{sp.q}”{sp.version ? ` in v${sp.version}` : ""}</p></div>{(sp.product || sp.version) && <Link className="lnk" href={`/docs?q=${encodeURIComponent(sp.q ?? "")}`}>Search all versions</Link>}</div>
            {results.length ? results.map((r) => (
              <Link key={r.href} href={r.href} className="lic" style={{ display: "block" }}><b style={{ color: "var(--dark)", fontSize: 16 }}>{r.title}</b> <span className="vtag">{r.product} v{r.version}</span><p className="muted" style={{ marginTop: 6, fontSize: 14.5 }}>{r.snippet}</p></Link>
            )) : <div className="empty">No matches. Try a different term.</div>}
          </div>
        )}
        <h2 className="dh2">Choose a product</h2>
        <div className="dgrid">
          {catalog.map(({ product: p, versions, pages }) => versions.length ? (
            <div key={p.id} className="dcardp live">
              <div className="dch"><span className="lmark lm2">{p.shortName}</span><div><h3>{p.name}</h3><span className="muted">{p.kind === "store_app" ? "ServiceNow Store application" : "Product Builder Experience"}</span></div></div>
              <div className="vchips">{versions.map((v) => <Link key={v.version} className={`vchip ${v.status === "latest" ? "lt" : ""}`} href={`/docs/${p.slug}/${v.version}`}>v{v.version}{v.status === "latest" ? " · Latest" : ""}</Link>)}</div>
              <div className="dlinks">{pages.filter((d) => d.version === versions[0].version).sort((a, b) => a.sortOrder - b.sortOrder).map((d) => <Link key={d.slug} href={`/docs/${p.slug}/${versions[0].version}/${d.slug}`}>{d.title} →</Link>)}</div>
            </div>
          ) : (
            <div key={p.id} className="dcardp">
              <div className="dch"><span className="lmark">{p.shortName}</span><div><h3>{p.name}</h3><span className="muted">Product Builder Experience</span></div></div>
              <p className="soonp">Documentation will publish with the first release. Each release will get its own versioned set.</p>
            </div>
          ))}
        </div>
        <div className="panel" id="versions" style={{ marginTop: 36 }}>
          <div className="phead"><div><h2>Versions and support</h2><p style={{ whiteSpace: "normal" }}>Every product version keeps its own documentation. Switch versions from the version menu on any docs page; older versions show a banner linking to the latest.</p></div></div>
          <div className="tblwrap tblscroll"><table className="vtable"><thead><tr><th>PRODUCT</th><th>VERSION</th><th>STATUS</th><th></th></tr></thead><tbody>
            {catalog.flatMap(({ product: p, versions }) => versions.map((v) => (
              <tr key={p.id + v.version}><td><b>{p.name}</b></td><td className="mono">v{v.version}</td><td><span className={`vtag ${v.status === "latest" ? "lt" : ""}`}>{v.status[0].toUpperCase() + v.status.slice(1)}</span></td><td><Link className="lnk" href={`/docs/${p.slug}/${v.version}`}>View docs</Link></td></tr>
            )))}
          </tbody></table></div>
        </div>
        <div className="grid3" style={{ marginTop: 22 }}>
          <Link className="doc" href="/account/cases/new"><div className="ico">?</div><div><h4>Open a support case</h4><p>Get help from IC5 Labs, Monday to Friday, 9am to 5pm Eastern.</p></div></Link>
          <Link className="doc" href="/pricing#support"><div className="ico">⏱</div><div><h4>Service level agreements</h4><p>Severity definitions and response targets.</p></div></Link>
          <Link className="doc" href="/resources"><div className="ico">≡</div><div><h4>Blog and insights</h4><p>Articles on customer signals and product decisions.</p></div></Link>
        </div>
      </main>
    </div>
  );
}
