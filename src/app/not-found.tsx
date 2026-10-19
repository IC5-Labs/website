import Link from "next/link";
import { AppHeader, AppFooter } from "@/components/site";

export default function NotFound() {
  return (
    <div className="appbody">
      <AppHeader />
      <main className="wrap" style={{ padding: "100px 24px", textAlign: "center" }}>
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: "var(--dark)", marginTop: 10 }}>We couldn’t find that page.</h1>
        <p className="s" style={{ marginTop: 12 }}>It may have moved, or you may not have access to it.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}><Link className="btn btn-violet" href="/">Go home</Link><Link className="btn btn-light" href="/docs">Documentation</Link></div>
      </main>
      <AppFooter />
    </div>
  );
}
