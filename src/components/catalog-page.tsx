import Link from "next/link";
import type { ReactNode } from "react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { CatalogPage } from "@/db/schema";
import { MarketingHeader, SiteFooter, CtaBand } from "@/components/site";
import { fmtDate } from "@/lib/format";

export type CrossLink = { href: string; tag: string; title: string; body: string };

/** Published blog posts whose featured product is one of these. */
export async function postsForProducts(productIds: number[]) {
  if (!productIds.length) return [];
  return db.select().from(s.resources)
    .where(and(eq(s.resources.type, "blog"), eq(s.resources.status, "published"), inArray(s.resources.productId, productIds)))
    .orderBy(desc(s.resources.publishedAt)).limit(3);
}

/** Reads → agent → produces, for an agent's hero. */
export function AgentFlow({ name, app, reads, produces }: { name: string; app: string; reads: string[]; produces: string[] }) {
  return (
    <div className="vis flowvis">
      <div className="top"><b>{name}</b><span>{app}</span></div>
      <div className="bd">
        <h6>READS</h6>
        <div className="fitems">{reads.map((r) => <div key={r} className="fitem">{r}</div>)}</div>
        <div className="fcore"><span className="fdot" /><b>{name}</b><small>Suggestions staged for human review</small></div>
        <h6>PRODUCES</h6>
        <div className="fitems">{produces.map((r) => <div key={r} className="fitem out">{r}</div>)}</div>
      </div>
    </div>
  );
}

export async function CatalogDetail(props: {
  active: "/products" | "/agents";
  crumbs: [string, string][];
  eyebrow: string;
  name: string;
  page: CatalogPage;
  visual: ReactNode;
  demoHref: string;
  secondary?: { href: string; label: string };
  agentLinks: Record<string, string>;
  planStrip?: ReactNode;
  requirements?: { rows: [string, string][]; docsHref?: string };
  more: { title: string; eyebrow: string; links: CrossLink[] };
  posts: Awaited<ReturnType<typeof postsForProducts>>;
}) {
  const { page: p } = props;
  const { problem, approach } = p;
  return (
    <>
      <MarketingHeader active={props.active}>
        <div className="cathero">
          <div>
            <div className="crumbs">{props.crumbs.map(([href, label], i) => <span key={href}>{i > 0 && " / "}{i === props.crumbs.length - 1 ? <b>{label}</b> : <Link href={href}>{label}</Link>}</span>)}</div>
            <div className="eyebrow" style={{ marginTop: 26 }}>{props.eyebrow}</div>
            <h1>{p.headline} <span className="grad">{p.accent}</span></h1>
            <p className="lede">{p.lede}</p>
            <div className="ctas">
              <Link className="btn btn-primary" href={props.demoHref}>Book a demo &nbsp;→</Link>
              {props.secondary && <Link className="btn btn-ghost" href={props.secondary.href}>{props.secondary.label}</Link>}
            </div>
          </div>
          <div className="dvis">{props.visual}</div>
        </div>
      </MarketingHeader>

      <section className="blk light" id="problem"><div className="wrap">
        <div className="grid2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">The problem</div>
            <h2>{problem.title}</h2>
            <p className="sub">{problem.body}</p>
            {problem.quote && <div className="pain">“{problem.quote}”</div>}
          </div>
          <div className="pstack">
            {problem.points.map((pt, i) => (
              <div key={pt.title} className="lcard prow"><div className="ico">{String(i + 1).padStart(2, "0")}</div><div><h3>{pt.title}</h3><p>{pt.body}</p></div></div>
            ))}
          </div>
        </div>
      </div></section>

      <section className="blk white" id="approach"><div className="wrap">
        <div className="grid2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">The approach</div>
            <h2>{approach.title}</h2>
            <p className="sub">{approach.body}</p>
            {approach.before && approach.after && (
              <div className="ba balist">
                <div className="b"><h6>BEFORE</h6><ul>{approach.before.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div className="a"><h6>AFTER</h6><ul>{approach.after.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            )}
          </div>
          <div className="outc">
            <h6>PRIMARY OUTCOMES</h6>
            {approach.outcomes.map((o) => <div key={o} className="orow"><i>→</i><span>{o}</span></div>)}
          </div>
        </div>
        {approach.steps && (
          <div className="steps mt">
            {approach.steps.map((st, i) => <div key={st.title} className="step"><div className="n">{String(i + 1).padStart(2, "0")}</div><h4>{st.title}</h4><p>{st.body}</p></div>)}
          </div>
        )}
      </div></section>

      <section className="blk dark2" id="capabilities"><div className="wrap">
        <div className="eyebrow">Capabilities</div>
        <h2>{p.capabilitiesTitle}</h2>
        <div className={`${p.capabilities.length % 4 === 0 || p.capabilities.length === 7 ? "grid4" : "grid3"} mt`}>
          {p.capabilities.map((c) => {
            const href = c.agent ? props.agentLinks[c.agent] : undefined;
            const body = (<>{c.agent && <span className="tag">AI AGENT</span>}<h3>{c.title}</h3><p>{c.body}</p>{href && <span className="lnk">Explore the agent →</span>}</>);
            return href
              ? <Link key={c.title} href={href} className="dcard capcard link-card">{body}</Link>
              : <div key={c.title} className="dcard capcard">{body}</div>;
          })}
        </div>
        {props.planStrip}
      </div></section>

      {props.requirements && (
        <section className="blk light" id="requirements"><div className="wrap">
          <div className="grid2" style={{ alignItems: "start" }}>
            <div>
              <div className="eyebrow">Get started</div>
              <h2>Install it from the ServiceNow Store.</h2>
              <p className="sub">Check the requirements, install on a sub-production instance, and analyze your first transcript. The installation guide walks through every step.</p>
              <div className="ctas">
                {props.requirements.docsHref && <Link className="btn btn-violet" href={props.requirements.docsHref}>Installation guide &nbsp;→</Link>}
                <Link className="btn btn-light" href={props.demoHref}>Book a demo</Link>
              </div>
            </div>
            <div className="req" style={{ color: "#fff" }}>
              <h4>SYSTEM REQUIREMENTS</h4>
              {props.requirements.rows.map(([k, v]) => <div key={k} className="row"><span className="k">{k}</span><span>{k === "Roles" ? v.split(" · ").map((r, i) => <span key={r}>{i > 0 && " · "}<code>{r}</code></span>) : v}</span></div>)}
            </div>
          </div>
        </div></section>
      )}

      {props.more.links.length > 0 && (
        <section className={`blk ${props.requirements ? "white" : "light"}`} id="more"><div className="wrap">
          <div className="eyebrow">{props.more.eyebrow}</div>
          <h2>{props.more.title}</h2>
          <div className="grid3 mt">
            {props.more.links.map((l) => (
              <Link key={l.href} href={l.href} className="lcard link-card xcard"><span className="tag">{l.tag}</span><h3>{l.title}</h3><p>{l.body}</p><span className="lnk">Learn more →</span></Link>
            ))}
          </div>
        </div></section>
      )}

      {props.posts.length > 0 && (
        <section className={`blk ${props.requirements ? "light" : "white"}`} id="reading"><div className="wrap">
          <div className="eyebrow">Further reading</div>
          <h2>From the blog.</h2>
          <div className="grid3 mt">{props.posts.map((r) => (
            <Link key={r.id} className="post link-card" href={`/resources/${r.slug}`}>
              <div className={`th${r.heroImage ? " img" : ""}`}>{r.heroImage && <img src={r.heroImage} alt="" />}<span>{(r.category ?? "Article").split("·")[0].trim().toUpperCase()}</span></div>
              <div className="b"><h4>{r.title}</h4><p>{r.summary}</p><div className="meta">{fmtDate(r.publishedAt)}</div></div>
            </Link>
          ))}</div>
        </div></section>
      )}

      <CtaBand title={`See ${props.name} on your own instance.`} text="A 30-minute session with the team that built it. Bring a real customer conversation, or use our demo data." />
      <SiteFooter />
    </>
  );
}
