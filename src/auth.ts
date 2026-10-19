import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Slack from "next-auth/providers/slack";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { upsertUserOnSignIn } from "@/lib/users";

/** Providers are enabled only when their credentials are configured. */
const providers: Provider[] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) providers.push(GitHub);
if (process.env.AUTH_SLACK_ID && process.env.AUTH_SLACK_SECRET) providers.push(Slack);

/**
 * Development-only email sign-in for local testing. Never set ENABLE_DEV_LOGIN in production.
 */
export const devLoginEnabled = process.env.ENABLE_DEV_LOGIN === "true" && process.env.REPLIT_DEPLOYMENT !== "1";
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Development login",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
        return { id: email, email, name: email.split("@")[0] };
      },
    }),
  );
}

export const enabledProviders = providers
  .map((p) => (typeof p === "function" ? p() : p))
  .map((p) => ({ id: p.id, name: p.name }));

const config: NextAuthConfig = {
  providers,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return "/signin?error=NoEmail";
      if (account?.provider === "google" && profile && (profile as { email_verified?: boolean }).email_verified === false) {
        return "/signin?error=UnverifiedEmail";
      }
      if (account?.provider === "slack" && profile && (profile as { email_verified?: boolean }).email_verified === false) {
        return "/signin?error=UnverifiedEmail";
      }
      await upsertUserOnSignIn({ email, name: user.name ?? null, image: user.image ?? null, provider: account?.provider ?? "unknown" });
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email.toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (token.email && session.user) session.user.email = token.email as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
