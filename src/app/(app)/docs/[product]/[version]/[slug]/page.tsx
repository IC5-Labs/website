import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { AppHeader } from "@/components/site";
import { db, schema as s } from "@/db";
import { docsCatalog } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { fmtDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/users";
import { TocLinks } from "@/components/toc";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ product: string; version: string; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { product, version, slug } = await params;
  const p = await db.query.products.findFirst({ where: and(eq(s.products.slug, product), eq(s.products.active, true)) });
  if (!p) return {};
  const d = await db.query.documentation.findFirst({ where: and(eq(s.documentation.productId, p.id), eq(s.documentation.version, version), eq(s.documentation.slug, slug)) });
  return d ? { title: `${d.title} · ${p.name} v${version} docs` } : {};
}

const vlabel = (st: string) => st[0].toUpperCase() + st.slice(1);

export default async function DocPage({ params }: P) {
  const { product, version, slug } = await params;
  const catalog = await docsCatalog();
  const entry = catalog.find((c) => c.product.slug === product);
  if (!entry) notFound();
  const user = await getCurrentUser();
  const doc = await db.query.documentation.findFirst({
    where: and(eq(s.documentation.productId, entry.product.id), eq(s.documentation.version, version), eq(s.documentation.slug, slug)),
  });
  if (!doc || (doc.versionStatus === "draft" && user?.role !== "admin")) notFound();

  const { html, toc } = renderMarkdown(doc.body, { shiftHeadings: 1 });
  const latest = entry.versions[0];
  const isLatest = latest?.version === version;
  const pages = entry.pages.filter((p) => p.version === version).sort((a, b) => a.sortOrder - b.sortOrder);
  const sections = [...new Set(pages.map((p) => p.section))];
  const idx = pages.findIndex((p) => p.slug === slug);
  const prev = pages[idx - 1], next = pages[idx + 1];
  const otherVersionHas = (v: string) => entry.pages.some((p) => p.version === v && p.slug === slug);
  const verHref = (v: string) => `/docs/${product}/${v}${otherVersionHas(v) ? `/${slug}` : ""}`;
  const thisStatus = doc.versionStatus;
  const docProducts = catalog.filter((c) => c.versions.length);
  const words = doc.body.split(/\s+/).length;

  return (
    <div className="appbody docsbody">
      <AppHeader active="/resources" />
      <div className="docbar"><div className="wrap dbin">
        <Link className="dhome" href="/docs"><b>Docs</b></Link><span className="dsep">/</span>
        <details className="dd">
          <summary className="ddbtn"><span className="pm">{entry.product.shortName}</span>{entry.product.name}<i>▾</i></summary>
          <div className="ddmenu prodmenu"><h6>PRODUCTS</h6>
            {catalog.map((c) => c.versions.length ? (
              <Link key={c.product.id} className={c.product.id === entry.product.id ? "on" : ""} href={`/docs/${c.product.slug}`}><span className="pm">{c.product.shortName}</span><span><b>{c.product.name}</b><small>v{c.versions[0].version} latest</small></span></Link>
            ) : (
              <Link key={c.product.id} className="soon" href="/docs"><span className="pm">{c.product.shortName}</span><span><b>{c.product.name}</b><small>Docs available at release</small></span></Link>
            ))}
          </div>
        </details>
        <details className="dd">
          <summary className="ddbtn ver">v{version}<span className={`vtag ${thisStatus === "latest" ? "lt" : ""}`}>{vlabel(thisStatus)}</span><i>▾</i></summary>
          <div className="ddmenu vermenu"><h6>VERSIONS</h6>
            {entry.versions.map((v) => (
              <Link key={v.version} href={verHref(v.version)} className={v.version === version ? "on" : ""}><b>v{v.version}</b><span className={`vtag ${v.status === "latest" ? "lt" : ""}`}>{vlabel(v.status)}</span>{v.version === version && <i>✓</i>}</Link>
            ))}
            <div className="ddfoot"><Link href="/docs#versions">Version support policy →</Link></div>
          </div>
        </details>
        <form className="dsearch" action="/docs" role="search" style={{ padding: 0, background: "transparent", border: 0 }}>
          <input type="hidden" name="product" value={product} /><input type="hidden" name="version" value={version} /><input className="input" name="q" placeholder={`Search ${entry.product.name} v${version} docs`} style={{ padding: "9px 12px", fontSize: 14 }} aria-label="Search docs" />
        </form>
        <Link className="dcase" href="/account/cases/new">Open a support case</Link>
      </div></div>

      <div className="docgrid wrap">
        <aside className="dnav">
          <div className="dnavver">{entry.product.name} <b>v{version}</b></div>
          {sections.map((sec) => (
            <div key={sec}>
              <h6>{sec.toUpperCase()}</h6>
              {pages.filter((p) => p.section === sec).map((p) => (
                <div key={p.slug}>
                  <Link href={`/docs/${product}/${version}/${p.slug}`} className={p.slug === slug ? "on" : undefined}>{p.title}</Link>
                  {p.slug === slug && <div className="subnav">{toc.filter((t) => t.level === 1).map((t) => <a key={t.id} href={`#${t.id}`}>{t.text}</a>)}</div>}
                </div>
              ))}
            </div>
          ))}
          <h6>REFERENCE</h6>
          <Link href="/pricing#support">Service level agreements</Link>
          <Link href="/resources#docs">All resources</Link>
          {docProducts.length > 1 && <><h6>OTHER PRODUCTS</h6>{docProducts.filter((c) => c.product.id !== entry.product.id).map((c) => <Link key={c.product.id} href={`/docs/${c.product.slug}`}>{c.product.name}</Link>)}</>}
        </aside>

        <article className="docmain">
          {!isLatest && latest && (
            <div className="verbanner"><b>You’re viewing documentation for v{version}.</b> The latest version is v{latest.version}. <Link href={verHref(latest.version)}>View this page in v{latest.version} →</Link></div>
          )}
          {thisStatus === "draft" && <div className="verbanner">Draft. Only admins can see this page.</div>}
          <div className="dcrumb"><Link href="/docs">Docs</Link> / <Link href={`/docs/${product}`}>{entry.product.name}</Link> / <span className="mono">v{version}</span> / <b>{doc.title}</b></div>
          <h1>{doc.title}</h1>
          <div className="dmeta">
            <span className={`vtag ${isLatest ? "lt" : ""}`}>v{version}{isLatest ? " · Latest" : ""}</span>
            <span>Applies to {entry.product.name} v{version}</span>
            <span>Updated {fmtDate(doc.updatedAt)}</span>
            <span>{Math.max(1, Math.round(words / 230))} min read</span>
          </div>
          {doc.summary && <p className="dlead">{doc.summary}</p>}
          <div className="prose docprose" dangerouslySetInnerHTML={{ __html: html }} />
          <div className="helpful"><span>Was this page helpful?</span><span className="muted" style={{ marginLeft: "auto" }}>Found an issue in the docs? <Link href="/account/cases/new?severity=4">Open a Severity 4 case</Link></span></div>
          {(prev || next) && (
            <div className="pn">
              {prev ? <Link href={`/docs/${product}/${version}/${prev.slug}`}><small>Previous</small>{prev.title}</Link> : <span />}
              {next ? <Link href={`/docs/${product}/${version}/${next.slug}`} style={{ textAlign: "right" }}><small>Next</small>{next.title}</Link> : <span />}
            </div>
          )}
        </article>

        <aside className="dtoc">
          <h6>ON THIS PAGE</h6>
          <TocLinks offset={140} items={toc.filter((t) => t.level <= 2).map((t) => ({ id: t.id, text: t.text, className: t.level === 2 ? "l2" : undefined }))} />
          <div className="vbox"><h6>THIS PAGE IN OTHER VERSIONS</h6>
            {entry.versions.filter((v) => otherVersionHas(v.version)).map((v) => (
              <Link key={v.version} href={verHref(v.version)} className={v.version === version ? "on" : ""}>v{v.version} <span className={`vtag ${v.status === "latest" ? "lt" : ""}`}>{vlabel(v.status)}</span></Link>
            ))}
          </div>
          <div className="vbox"><h6>NEED HELP?</h6><Link href="/account/cases/new" className="lnk">Open a support case</Link><Link href="/account/licenses" className="lnk">Your licenses</Link></div>
        </aside>
      </div>
    </div>
  );
}
