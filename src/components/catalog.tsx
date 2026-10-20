import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { money } from "@/lib/format";

export async function getPlans() {
  return db.select().from(s.products).where(eq(s.products.kind, "app")).orderBy(asc(s.products.sortOrder));
}

export async function PricingTiers({ withButtons }: { withButtons?: boolean }) {
  const plans = (await getPlans()).filter((p) => p.active);
  const agents = await db.select().from(s.agents).orderBy(asc(s.agents.sortOrder));
  return (
    <div className="tiers">
      {plans.map((p, i) => {
        const featured = i === 1;
        const users = p.userLimit ? `Up to ${p.userLimit} users` : "Unlimited users";
        const prev = i > 0 ? ` · Everything in ${plans[i - 1].plan}` : "";
        const ag = agents.filter((a) => a.productId === p.id).map((a) => a.name).join(" · ");
        return (
          <div key={p.id} className={`tier${featured ? " feat" : ""}`}>
            <div className="nm">{(p.plan ?? p.name).toUpperCase()}</div>
            <div className="pr">{money(p.priceAnnual)} <small>/ year / instance</small></div>
            <div className="us">{users}{prev}</div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {ag && <div className="ag">{ag}</div>}
            {withButtons && (
              <Link className={`btn ${featured ? "btn-primary" : "btn-ghost"}`} href={`/demo?plan=${encodeURIComponent(p.plan ?? "")}`}>{featured ? "Book a demo" : "Talk to us"}</Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function AgentGrid() {
  const agents = await db.select().from(s.agents).orderBy(asc(s.agents.sortOrder));
  return (
    <div className="grid3 mt">
      {agents.map((a) => (
        <Link key={a.id} href={`/agents/${a.slug}`} className={`acard link-card${a.live ? " live" : ""}`}>
          <span className="tier">{a.live ? "Live on the Store" : a.tier}</span>
          <div className="app">{a.appName.toUpperCase()}</div>
          <h3>{a.name}</h3>
          <p>{a.description}</p>
          <span className="more">Explore the agent →</span>
        </Link>
      ))}
      <div className="acard" style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div><div className="app">ALL AGENTS</div><h3>Built on ServiceNow AI Agent Studio and Now Assist Skill Kit</h3><p>Agents run in your instance, use the model provider your administrator approved, and stage every suggestion for human review.</p></div>
        <Link className="btn btn-ghost" href="#governance" style={{ flex: "0 0 auto" }}>How we govern AI</Link>
      </div>
    </div>
  );
}
