import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader, SiteFooter } from "@/components/site";
import { TocLinks } from "@/components/toc";
import { resourceBySlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/users";
import { fmtDate } from "@/lib/format";

/** A legal document (privacy policy, terms) stored as a resource and edited in the admin console. */
export async function LegalPage({ slug }: { slug: string }) {
  const r = await resourceBySlug(slug);
  const user = await getCurrentUser();
  if (!r || (r.status !== "published" && user?.role !== "admin")) notFound();
  const { html, toc } = renderMarkdown(r.body ?? "");
  const sections = toc.filter((t) => t.level === 2);
  const other = slug === "privacy" ? { href: "/terms", label: "Terms of Service" } : { href: "/privacy", label: "Privacy Policy" };
  return (
    <>
      <MarketingHeader>
        <div className="phero nohero" style={{ marginTop: 64 }}>
          {r.status !== "published" && <div className="flash info" style={{ marginBottom: 18 }}>Draft preview. Only admins can see this page.</div>}
          <div className="eyebrow">Legal</div>
          <h1 style={{ fontSize: 54, lineHeight: 1.06 }}>{r.title}</h1>
          {r.publishedAt && <p className="lede">Last updated {fmtDate(r.publishedAt, { month: "long", day: "numeric", year: "numeric" })}</p>}
        </div>
      </MarketingHeader>
      <section className="artwrap legaldoc"><div className="wrap">
        <div className="artgrid">
          <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="side">
            {sections.length > 1 && <div className="toc"><h6>ON THIS PAGE</h6><TocLinks items={sections.map((t) => ({ id: t.id, text: t.text }))} /></div>}
            <div className="lbox"><h6>QUESTIONS</h6><p className="legalnote">Email <a href="mailto:support@ic5labs.com">support@ic5labs.com</a>.</p><p className="legalnote"><Link href={other.href}>{other.label} →</Link></p></div>
          </aside>
        </div>
      </div></section>
      <SiteFooter />
    </>
  );
}
