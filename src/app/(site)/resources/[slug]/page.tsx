import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader, SiteFooter, CtaBand, Social } from "@/components/site";
import { publishedResources, resourceBySlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/users";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const r = await resourceBySlug((await params).slug);
  return r ? { title: r.title.split(":")[0], description: r.summary ?? undefined } : {};
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await resourceBySlug(slug);
  const user = await getCurrentUser();
  if (!r || (r.status !== "published" && user?.role !== "admin")) notFound();
  const { html, toc } = renderMarkdown(r.body ?? "");
  const h2 = toc.filter((t) => t.level === 2);
  const words = (r.body ?? "").split(/\s+/).length;
  const related = (await publishedResources(r.type)).filter((x) => x.id !== r.id).slice(0, 3);
  const isBlog = r.type === "blog";
  const label = r.type === "blog" ? "Blog" : r.type === "insight" ? "Insights" : "Documents";
  return (
    <>
      <MarketingHeader active="/resources">
        <div className={`phero${isBlog && r.heroImage ? "" : " nohero"}`} style={{ maxWidth: 1000, marginTop: 64 }}>
          <div className="crumbs"><Link href="/resources">Resources</Link> &nbsp;/&nbsp; <Link href={r.type === "insight" ? "/resources#insights" : "/resources"}>{label}</Link> &nbsp;/&nbsp; <b>{r.title.split(":")[0]}</b></div>
          {r.status !== "published" && <div className="flash info" style={{ marginTop: 18 }}>Draft preview. Only admins can see this page.</div>}
          {r.category && <div className="eyebrow" style={{ marginTop: 30 }}>{r.category}</div>}
          <h1 style={{ fontSize: 54, lineHeight: 1.06 }}>{r.title}</h1>
          <div className="byline">
            {r.authorName === "Kit Corry" && <img src="/assets/kit-corry.jpg" alt="" />}
            {r.authorName && <div><b>{r.authorName}</b>{r.authorTitle && <span>{r.authorTitle}</span>}</div>}
            {r.publishedAt && <><i /><span>{fmtDate(r.publishedAt, { month: "long", day: "numeric", year: "numeric" })}</span></>}
            <i /><span>{Math.max(1, Math.round(words / 230))} min read</span>
          </div>
        </div>
      </MarketingHeader>
      <section className="artwrap">
        <div className="wrap">
          {isBlog && r.heroImage ? (
            <figure className="arthero"><img src={r.heroImage} alt="" /></figure>
          ) : null}
          <div className="artgrid">
            <article className="prose">
              {!isBlog && r.heroImage && <img className="insight-hero" src={r.heroImage} alt={r.title} />}
              {r.summary && isBlog && <p className="lead">{r.summary}</p>}
              <div dangerouslySetInnerHTML={{ __html: html }} />
              <div className="inlinecta"><div><b>Ready to see it in action?</b><span>Learn how Customer Signals Agent turns customer conversations into evidence your whole team can build from.</span></div><Link className="btn btn-primary" href="/agents#csa">Explore Customer Signals Agent &nbsp;→</Link></div>
            </article>
            <aside className="side">
              {h2.length > 1 && (
                <div className="toc"><h6>IN THIS ARTICLE</h6>{h2.map((t, i) => <a key={t.id} href={`#${t.id}`} className={i === 0 ? "on" : undefined}>{t.text}</a>)}</div>
              )}
              <div className="promo"><div className="eyebrow">Live on the ServiceNow Store</div><h4>Customer Signals Agent</h4><p>Turn meeting transcripts into evidence-backed customer needs, inside your instance.</p><Link className="btn btn-primary" href="/demo">Book a demo</Link></div>
              <div className="share"><h6>SHARE</h6><Social /></div>
            </aside>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="blk light" style={{ paddingTop: 90 }}><div className="wrap">
          <div className="eyebrow">Keep reading</div>
          <h2>More on building what customers need</h2>
          <div className="grid3 mt">{related.map((x) => (
            <Link key={x.id} className="post link-card" href={`/resources/${x.slug}`}>
              <div className={`th${x.heroImage ? " img" : ""}`}>{x.heroImage && <img src={x.heroImage} alt="" />}<span>{(x.category ?? label).split("·")[0].trim().toUpperCase()}</span></div>
              <div className="b"><h4>{x.title}</h4><p>{x.summary}</p><div className="meta">{fmtDate(x.publishedAt)}</div></div>
            </Link>
          ))}</div>
        </div></section>
      )}
      <CtaBand title="See the bottleneck move on your own team." text="Bring a customer transcript to a 30-minute demo and watch Customer Signals Agent turn it into evidence-backed needs." />
      <SiteFooter />
    </>
  );
}
