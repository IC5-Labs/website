/**
 * HTML emails in the website's look: the deep navy page, the reversed IC5 logo, light blue
 * eyebrows, white headlines and the violet button. Built with tables and inline styles because
 * that is what email clients render reliably. Every email also gets a plain-text version.
 */
const C = { ink: "#001923", dark: "#00165E", violet: "#2400A7", deep: "#002FA7", light: "#62D0FF", muted: "#9FB6C7", body: "#D5E3EE", line: "#123B52" };
const FONT = `'Google Sans Flex','Google Sans',Roboto,'Segoe UI',Helvetica,Arial,sans-serif`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Detail = [label: string, value: string];

function layout(o: { origin: string; preheader: string; eyebrow: string; title: string; intro: string; details: Detail[]; button: { label: string; href: string }; after: string; footnote: string }) {
  const rows = o.details.map(([k, v], i) => `
              <tr>
                <td class="k" style="padding:12px 18px;${i ? `border-top:1px solid ${C.line};` : ""}font:500 13px/1.4 ${FONT};color:${C.muted};width:132px;vertical-align:top">${esc(k)}</td>
                <td class="v" style="padding:12px 18px;${i ? `border-top:1px solid ${C.line};` : ""}word-break:break-word;font:700 14px/1.4 ${FONT};color:#FFFFFF;vertical-align:top">${esc(v)}</td>
              </tr>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(o.title)}</title>
<style>@media (max-width:520px){.px{padding-left:22px!important;padding-right:22px!important}.k{width:96px!important;padding-left:14px!important;padding-right:8px!important}.v{padding-left:8px!important;padding-right:14px!important}h1{font-size:26px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.ink}">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink}">
  <tr><td align="center" style="padding:36px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
      <tr><td style="padding:0 4px 22px">
        <a href="${o.origin}" style="text-decoration:none"><img src="${o.origin}/assets/logo-rev.png" width="48" height="48" alt="IC5 Labs" style="display:block;border:0;width:48px;height:48px"></a>
      </td></tr>
      <tr><td style="background-color:${C.dark};background-image:linear-gradient(135deg,${C.dark} 0%,${C.violet} 70%,${C.deep} 100%);border-radius:18px 18px 0 0;padding:38px 40px 34px" class="px">
        <div style="font:700 12px/1 ${FONT};letter-spacing:.2em;text-transform:uppercase;color:${C.light}">${esc(o.eyebrow)}</div>
        <h1 style="margin:14px 0 0;font:800 30px/1.15 ${FONT};letter-spacing:-.02em;color:#FFFFFF">${esc(o.title)}</h1>
      </td></tr>
      <tr><td style="background:#00222F;border:1px solid ${C.line};border-top:0;border-radius:0 0 18px 18px;padding:32px 40px 36px" class="px">
        <p style="margin:0;font:400 16px/1.6 ${FONT};color:${C.body}">${o.intro}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 28px;border:1px solid ${C.line};border-radius:12px;border-collapse:separate;background:${C.ink}">${rows}
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:10px;background:${C.violet}"><a href="${o.button.href}" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:#FFFFFF;text-decoration:none;border-radius:10px">${esc(o.button.label)} &rarr;</a></td>
        </tr></table>
        <p style="margin:26px 0 0;font:400 14px/1.6 ${FONT};color:${C.muted}">${o.after}</p>
      </td></tr>
      <tr><td style="padding:26px 6px 0;font:400 12px/1.6 ${FONT};color:#6F899C">
        ${o.footnote}<br><br>
        <a href="${o.origin}" style="color:${C.light};text-decoration:none">ic5labs.com</a> &nbsp;·&nbsp;
        <a href="${o.origin}/privacy" style="color:${C.muted};text-decoration:none">Privacy</a> &nbsp;·&nbsp;
        <a href="${o.origin}/terms" style="color:${C.muted};text-decoration:none">Terms</a> &nbsp;·&nbsp;
        <a href="mailto:support@ic5labs.com" style="color:${C.muted};text-decoration:none">support@ic5labs.com</a><br>
        © ${new Date().getFullYear()} IC5 Labs, Inc. ServiceNow is a trademark of ServiceNow, Inc.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const text = (lines: (string | false | null | undefined)[]) => lines.filter((l) => l !== false && l != null).join("\n");

type Person = { name: string | null; email: string };
const who = (p: Person) => p.name || p.email;
const whoFull = (p: Person) => (p.name ? `${p.name} (${p.email})` : p.email);

/** Sent when someone else creates a user account for this person. */
export function accountCreatedEmail(o: { origin: string; to: Person; by: Person; accountName?: string | null; accountRole?: "account_admin" | "member" | null; siteAdmin: boolean }) {
  const signin = `${o.origin}/signin`;
  const role = o.siteAdmin ? "IC5 Labs admin" : o.accountRole === "account_admin" ? "Account admin" : o.accountName ? "Member" : null;
  const details: Detail[] = [["Sign in with", o.to.email], ["Created by", whoFull(o.by)]];
  if (o.accountName) details.push(["Company", o.accountName]);
  if (role) details.push(["Role", role]);
  const hi = o.to.name ? `Hi ${esc(o.to.name.split(" ")[0])},` : "Hi,";
  const subject = `${who(o.by)} created your IC5 Labs account`;
  return {
    subject,
    html: layout({
      origin: o.origin,
      preheader: `${who(o.by)} set up an IC5 Labs account for ${o.to.email}.`,
      eyebrow: "Welcome to IC5 Labs",
      title: "Your account is ready",
      intro: `${hi} <b style="color:#FFFFFF">${esc(whoFull(o.by))}</b> created an IC5 Labs account for you${o.accountName ? ` on the <b style="color:#FFFFFF">${esc(o.accountName)}</b> company account` : ""}.`,
      details,
      button: { label: "Sign in to IC5 Labs", href: signin },
      after: `Sign in with the account that uses <b style="color:${C.body}">${esc(o.to.email)}</b>. There’s no password to set up. Once you’re in, you can see licenses, documentation, requests and support cases${o.accountName ? ` for ${esc(o.accountName)}` : ""}.`,
      footnote: `You’re receiving this because ${esc(whoFull(o.by))} added ${esc(o.to.email)} to IC5 Labs. If you weren’t expecting it, reply to this email or contact support@ic5labs.com.`,
    }),
    text: text([
      "Your IC5 Labs account is ready", "",
      `${o.to.name ? `Hi ${o.to.name.split(" ")[0]},` : "Hi,"} ${whoFull(o.by)} created an IC5 Labs account for you${o.accountName ? ` on the ${o.accountName} company account` : ""}.`, "",
      ...details.map(([k, v]) => `${k}: ${v}`), "",
      `Sign in: ${signin}`,
      `Use the account that goes with ${o.to.email}. There's no password to set up.`, "",
      `If you weren't expecting this, reply to this email or contact support@ic5labs.com.`,
      "IC5 Labs, Inc. · ic5labs.com",
    ]),
  };
}

/** Sent when a company account admin invites a teammate. */
export function teamInviteEmail(o: { origin: string; to: string; by: Person; accountName: string; accountRole: "account_admin" | "member"; token: string }) {
  const link = `${o.origin}/invite/${o.token}`;
  const role = o.accountRole === "account_admin" ? "Account admin" : "Member";
  const details: Detail[] = [["Company", o.accountName], ["Invited by", whoFull(o.by)], ["Role", role], ["Sign in with", o.to]];
  const subject = `${who(o.by)} invited you to join ${o.accountName} on IC5 Labs`;
  return {
    subject,
    html: layout({
      origin: o.origin,
      preheader: `Join ${o.accountName} on IC5 Labs.`,
      eyebrow: "You’re invited",
      title: `Join ${o.accountName} on IC5 Labs`,
      intro: `<b style="color:#FFFFFF">${esc(whoFull(o.by))}</b> invited you to join the <b style="color:#FFFFFF">${esc(o.accountName)}</b> company account on IC5 Labs.`,
      details,
      button: { label: "Accept invitation", href: link },
      after: `Sign in with the account that uses <b style="color:${C.body}">${esc(o.to)}</b> and you’ll join ${esc(o.accountName)} automatically. You’ll be able to see the company’s licenses, documentation, requests and support cases.`,
      footnote: `You’re receiving this because ${esc(whoFull(o.by))} invited ${esc(o.to)}. If you weren’t expecting it, you can ignore this email. Button not working? Paste this link into your browser: <a href="${link}" style="color:${C.muted};word-break:break-all">${esc(link)}</a>`,
    }),
    text: text([
      `Join ${o.accountName} on IC5 Labs`, "",
      `${whoFull(o.by)} invited you to join the ${o.accountName} company account on IC5 Labs.`, "",
      ...details.map(([k, v]) => `${k}: ${v}`), "",
      `Accept the invitation: ${link}`,
      `Sign in with the account that uses ${o.to} and you'll join automatically.`, "",
      "If you weren't expecting this, you can ignore this email.",
      "IC5 Labs, Inc. · ic5labs.com",
    ]),
  };
}
