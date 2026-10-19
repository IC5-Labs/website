# IC5 Labs website

The ic5labs.com site: marketing pages, blog and resources, versioned product documentation, a signed-in customer account area for licenses, requests, and support cases, and an admin console.

Built with Next.js (App Router), PostgreSQL through Drizzle ORM, and Auth.js for Google, GitHub, and Slack sign-in. Hosted on Replit.

## Who can do what

| Role | How it’s assigned | Can |
| --- | --- | --- |
| Visitor | Not signed in | Read marketing pages, blog posts, documents, insights, and product docs; subscribe to the newsletter; request a demo |
| Member | Joins a company account by invitation | See and manage their company’s licenses, requests, and support cases; open cases and reply |
| Account admin | First person from a company to sign up, or promoted by another account admin | Everything a member can, plus invite teammates by email, promote or demote account admins, remove members, set license instances |
| Admin | `kit@ic5labs.com` is seeded as admin; admins can grant it to others | Manage all cases (replies, internal notes, status, severity, assignee), blog posts, documents, insights, versioned docs, users, accounts, licenses, and requests |

Company accounts are matched by work email domain. A second person from the same domain without an invitation is asked to request one from their account admin. Personal email domains (Gmail, Outlook and similar) get single-person accounts.

## Data model

Defined in `src/db/schema.ts`; migrations in `drizzle/`.

- `user`: individual person, unique by email; platform role (`admin` or `user`), company account, and account role (`account_admin` or `member`)
- `account`: company account; many users belong to one account
- `invite`: pending email invitation to join an account
- `resource`: blog post, document, or insight (Markdown body, draft or published); a blog post's featured product sets its call to action and sidebar promo, or the full product suite when none is set
- `product`: products and plans for sale
- `agent`: AI agents for sale, linked to a product
- `documentation`: versioned product docs, one row per page per version; each version is `latest`, `supported`, `deprecated`, or `draft`
- `case` and `case_comment`: customer support cases and their conversation, including support-only internal notes
- `request`: demo requests, information requests, license change requests, and newsletter signups
- `license`: a license for an account to use a product (plan, seats, instance, version, term, status)
- `seed_run`: one-time data steps the seed has applied, so they never overwrite later admin edits

## Running it

Requires Node.js 22 and PostgreSQL.

```bash
cp .env.example .env.local    # fill in DATABASE_URL and AUTH_SECRET at minimum
npm install
npm run db:setup              # apply migrations and seed (safe to re-run)
npm run dev                   # http://localhost:5000
```

`npm start` runs migrations and the seed before starting, so a fresh database is set up on first deploy. The seed only inserts missing rows; it never overwrites content edited in the admin console.

## Sign-in providers

Each provider button appears once its two environment variables are set. Register these callback URLs, replacing the domain if you use a custom one:

| Provider | Where to create the OAuth app | Callback URL | Variables |
| --- | --- | --- | --- |
| Google | Google Cloud Console → APIs and Services → Credentials → OAuth client ID (Web application) | `https://website-ic5labs.replit.app/api/auth/callback/google` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| GitHub | GitHub → Settings → Developer settings → OAuth Apps | `https://website-ic5labs.replit.app/api/auth/callback/github` | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` |
| Slack | api.slack.com/apps → your app → OAuth and Permissions (Sign in with Slack, OpenID scopes `openid`, `email`, `profile`) | `https://website-ic5labs.replit.app/api/auth/callback/slack` | `AUTH_SLACK_ID`, `AUTH_SLACK_SECRET` |

Also set `AUTH_SECRET` (generate with `openssl rand -base64 32`) and `AUTH_URL` (the public site URL).

## Documentation versions

In the admin console, Documentation → “Copy to new version” duplicates every page of a version as a draft. Edit the new pages, then set the version to Latest; the previous latest becomes Supported and its pages show a banner linking to the same page in the new version. Pages live at `/docs/<product>/<version>/<page>`.

## Tests

`tests/e2e.mjs` signs in as several users and checks the permission model end to end: company creation, invitations, account admin roles, case visibility across companies, admin replies and internal notes, licenses, requests, publishing, and docs versioning. It uses a development-only email sign-in that is enabled with `ENABLE_DEV_LOGIN=true` and is always disabled on Replit deployments.

```bash
./tests/reset-db.sh                        # recreates the local test database
ENABLE_DEV_LOGIN=true npm run build && ENABLE_DEV_LOGIN=true npm start
node tests/e2e.mjs
```

## Design

Marketing page markup in `src/content/fragments/` is the signed-off static design, served as-is so desktop rendering matches the approved mockups. Data-driven parts (pricing tiers, agents, resources, docs) are rendered from the database with the same classes. Styles are in `src/app/globals.css`, including tablet and phone breakpoints.
