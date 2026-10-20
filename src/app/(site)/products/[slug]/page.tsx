import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Html } from "@/components/site";
import { CatalogDetail, postsForProducts } from "@/components/catalog-page";
import { productVisual } from "@/lib/fragments";
import { demoHref } from "@/lib/promo";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.query.products.findFirst({ where: and(eq(s.products.slug, slug), eq(s.products.active, true)) });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  return p ? { title: p.name, description: p.page?.lede ?? p.description ?? undefined } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (p?.kind === "store_app") permanentRedirect(`/agents/${p.slug}`);
  if (!p || !p.page) notFound();

  const agents = await db.select().from(s.agents).where(eq(s.agents.appName, p.name)).orderBy(asc(s.agents.sortOrder));
  const others = await db.select().from(s.products).where(and(eq(s.products.active, true), ne(s.products.id, p.id))).orderBy(asc(s.products.sortOrder));
  const posts = await postsForProducts([p.id, ...agents.map((a) => a.productId).filter((x): x is number => !!x)]);
  const visual = productVisual(p.slug);
  const included = agents.filter((a) => a.productId === p.id).map((a) => a.name);

  return (
    <CatalogDetail
      active="/products"
      crumbs={[["/products", "Products"], [`/products/${p.slug}`, p.name]]}
      eyebrow={`Product Builder Experience${p.plan ? ` · ${p.plan} plan` : ""}`}
      name={p.name}
      page={p.page}
      visual={visual ? <Html html={visual} /> : null}
      demoHref={demoHref(p.slug)}
      secondary={{ href: "/pricing", label: "See pricing" }}
      agentLinks={Object.fromEntries(agents.map((a) => [a.slug, `/agents/${a.slug}`]))}
      planStrip={p.plan && (
        <div className="planstrip">
          <div><span className="k">PLAN</span><b>{p.plan}</b></div>
          <div><span className="k">PRICE</span><b>{money(p.priceAnnual)} <small>/ year / instance</small></b></div>
          <div><span className="k">USERS</span><b>{p.userLimit ? `Up to ${p.userLimit}` : "Unlimited"}</b></div>
          {included.length > 0 && <div className="wide"><span className="k">AI AGENTS INCLUDED</span><b>{included.join(" · ")}</b></div>}
          <Link className="btn btn-ghost" href="/pricing">Compare plans</Link>
        </div>
      )}
      more={{
        eyebrow: "Product Builder Experience",
        title: "Built to work together.",
        links: others.map((o) => ({
          href: o.kind === "store_app" ? `/agents/${o.slug}` : `/products/${o.slug}`,
          tag: o.kind === "store_app" ? "LIVE ON THE SERVICENOW STORE" : `${o.plan?.toUpperCase()} PLAN`,
          title: o.name,
          body: o.tagline ?? "",
        })),
      }}
      posts={posts}
    />
  );
}
