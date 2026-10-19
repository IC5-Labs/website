import Link from "next/link";
import { MarketingHeader, SiteFooter, Flash } from "@/components/site";
import { publishedResources, docsCatalog } from "@/lib/content";
import { subscribeNewsletter } from "@/lib/actions/public";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resources" };

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [blogs, insights, documents, catalog] = await Promise.all([
    publishedResources("blog"), publishedResources("insight"), publishedResources("document"), docsCatalog(),
  ]);
  const [featured, ...rest] = blogs;
  const docProducts = catalog.filter((c) => c.versions.length);
  return (
    <>
      <MarketingHeader active="/resources">
        <div className="phero"><div className="eyebrow">Resources</div><h1>Field notes on building <span className="grad">what customers need.</span></h1><p className="lede">Articles, research, and documentation for ServiceNow builders and product teams.</p></div>
      </MarketingHeader>

      {featured && (
        <section className="blk dark2" style={{ paddingTop: 20 }}><div className="wrap">
          <div className="featpost">
            <Link className="art" href={`/resources/${featured.slug}`} style={{ background: featured.heroImage ? `url(${featured.heroImage}) center/cover` : undefined, padding: 28, justifyContent: "flex-start" }}>
              <span className="pill" style={{ alignSelf: "flex-start", background: "rgba(0,22,94,.7)" }}><b>FEATURED</b> {featured.category?.split("·")[0]?.trim()}</span>
            </Link>
            <div className="txt">
              <div className="eyebrow">{featured.category}</div>
              <h3>{featured.title}</h3>
              <p>{featured.summary}</p>
              <div className="meta">{featured.authorName} · {fmtDate(featured.publishedAt)}</div>
              <Link className="btn btn-primary" href={`/resources/${featured.slug}`} style={{ marginTop: 26 }}>Read the article &nbsp;→</Link>
            </div>
          </div>
        </div></section>
      )}

      <section className="blk light"><div className="wrap">
        <div className="eyebrow">Blog</div>
        <h2>Coding is cheap. Knowing what to code isn’t.</h2>
        {rest.length ? (
          <div className="grid3 mt">{rest.map((r) => (
            <Link key={r.id} className="post link-card" href={`/resources/${r.slug}`}>
              <div className={`th${r.heroImage ? " img" : ""}`}>{r.heroImage && <img src={r.heroImage} alt="" />}<span>{(r.category ?? "Article").split("·")[0].trim().toUpperCase()}</span></div>
              <div className="b"><h4>{r.title}</h4><p>{r.summary}</p><div className="meta">{fmtDate(r.publishedAt)}</div></div>
            </Link>
          ))}</div>
        ) : <p className="sub">More articles are on the way. Subscribe below to get them first.</p>}
      </div></section>

      {insights.length > 0 && (
        <section className="blk dark2" id="insights"><div className="wrap">
          <div className="eyebrow">Series · State of Product 2027</div>
          <h2>What the data says about product decisions.</h2>
          <p className="sub">Our read on Atlassian’s State of Product 2027, a Wakefield Research survey of 1,000 product professionals in the US, Germany and France, August 2026.</p>
          <div className="tiles">{insights.map((r) => (
            <Link key={r.id} className="t" href={`/resources/${r.slug}`}>{r.heroImage && <img src={r.heroImage} alt={r.title} />}<h5>{r.title}</h5></Link>
          ))}</div>
        </div></section>
      )}

      <section className="blk white" id="docs"><div className="wrap">
        <div className="eyebrow">Documentation</div>
        <h2>Install, configure, and support.</h2>
        <div className="grid3 mt">
          {docProducts.map((c) => (
            <Link key={c.product.id} className="doc" href={`/docs/${c.product.slug}`}><div className="ico">↓</div><div><h4>{c.product.name} documentation</h4><p>Installation and configuration, versions {c.versions.map((v) => "v" + v.version).join(", ")}.</p></div></Link>
          ))}
          {documents.map((d) => (
            <Link key={d.id} className="doc" href={`/resources/${d.slug}`}><div className="ico">≡</div><div><h4>{d.title}</h4><p>{d.summary}</p></div></Link>
          ))}
          <Link className="doc" href="/pricing#support"><div className="ico">⏱</div><div><h4>Service level agreements</h4><p>Severity definitions, response targets, and how to reach support.</p></div></Link>
        </div>
      </div></section>

      <section className="blk native" id="newsletter"><div className="wrap center">
        <div className="eyebrow">Newsletter</div>
        <h2>Better inputs, in your inbox.</h2>
        <p className="sub">One email a month on customer signals, product decisions, and building on ServiceNow. No fluff.</p>
        <div style={{ maxWidth: 560, margin: "24px auto 0" }}>
          {sp.newsletter === "ok" && <Flash ok="You’re subscribed. Watch for the next issue." />}
          {sp.newsletter === "invalid" && <Flash err="Please enter a valid email address." />}
        </div>
        <form className="nl" style={{ maxWidth: 560, margin: "12px auto 0" }} action={subscribeNewsletter}>
          <input type="hidden" name="back" value="/resources" />
          <input className="input dark-input" type="email" name="email" placeholder="Work email" required aria-label="Work email" />
          <button className="btn btn-primary" type="submit">Subscribe</button>
        </form>
      </div></section>
      <SiteFooter />
    </>
  );
}
