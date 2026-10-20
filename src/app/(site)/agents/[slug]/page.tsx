import { notFound } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { AgentFlow, CatalogDetail, postsForProducts, type CrossLink } from "@/components/catalog-page";
import { demoHref } from "@/lib/promo";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.query.agents.findFirst({ where: eq(s.agents.slug, slug) });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug);
  return a ? { title: a.name, description: a.page?.lede ?? a.description } : {};
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a || !a.page || !a.active) notFound();

  const [own, app] = await Promise.all([
    a.productId ? db.query.products.findFirst({ where: eq(s.products.id, a.productId) }) : null,
    db.query.products.findFirst({ where: and(eq(s.products.name, a.appName), eq(s.products.kind, "app")) }),
  ]);
  const siblings = await db.select().from(s.agents).where(and(eq(s.agents.appName, a.appName), ne(s.agents.id, a.id), eq(s.agents.active, true))).orderBy(asc(s.agents.sortOrder));
  const posts = await postsForProducts([own?.id, app?.id].filter((x): x is number => !!x));

  const links: CrossLink[] = [];
  if (app?.active) links.push({ href: `/products/${app.slug}`, tag: `PRODUCT · ${app.plan?.toUpperCase()} PLAN`, title: app.name, body: app.tagline ?? "" });
  for (const sib of siblings.filter((x) => x.page)) links.push({ href: `/agents/${sib.slug}`, tag: sib.live ? "AI AGENT · LIVE ON THE STORE" : `AI AGENT · ${sib.tier?.toUpperCase()} PLAN`, title: sib.name, body: sib.description });

  const interestSlug = app?.slug ?? own?.slug;
  return (
    <CatalogDetail
      active="/agents"
      crumbs={[["/agents", "AI Agents"], [`/agents/${a.slug}`, a.name]]}
      eyebrow={a.live ? "AI agent · Live on the ServiceNow Store" : `AI agent · ${a.appName}${a.tier ? ` · ${a.tier} plan` : ""}`}
      name={a.name}
      page={a.page}
      visual={<AgentFlow name={a.name} app={a.appName} reads={a.page.reads ?? []} produces={a.page.produces ?? []} />}
      demoHref={demoHref(interestSlug)}
      secondary={a.live && own?.hasDocs && own.active ? { href: `/docs/${own.slug}`, label: "Read the docs" } : { href: "/agents", label: "All AI agents" }}
      agentLinks={{}}
      requirements={a.page.requirements ? { rows: a.page.requirements, docsHref: own?.hasDocs && own.active ? `/docs/${own.slug}` : undefined } : undefined}
      more={{ eyebrow: a.appName, title: `More in ${a.appName}.`, links }}
      posts={posts}
    />
  );
}
