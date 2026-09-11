import "server-only";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Resend — the single transactional-email provider for the site.
 *   - contact-form forwarding        (sendContactMessage)
 *   - winner-confirmation emails      (sendWinnerEmail)
 *   - admin failure alerts           (sendAdminAlert)
 *
 * We call Resend's HTTP API directly (no SDK) to keep the dependency surface
 * small. https://resend.com/docs/api-reference/emails/send-email
 */
const RESEND_URL = "https://api.resend.com/emails";

export interface SendResult {
  ok: boolean;
  /** Provider message id when available — handy for the audit trail. */
  id?: string;
  reason?: string;
}

/** An email attachment — `content` is base64. `contentId` makes it inline (`cid:`). */
export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
  contentId?: string;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional Reply-To — used so the admin can reply straight to a contact sender. */
  replyTo?: { email: string; name?: string };
  attachments?: EmailAttachment[];
}

/** Low-level send. Callers handle the "not configured" case themselves. */
async function send({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
}: SendArgs): Promise<SendResult> {
  const { apiKey, senderEmail, senderName } = serverEnv.resend;

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Resend not configured — would email "${subject}" to a recipient`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "resend-not-configured" };
  }

  const body: Record<string, unknown> = {
    from: `${senderName} <${senderEmail}>`,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) {
    body.reply_to = replyTo.name ? `${replyTo.name} <${replyTo.email}>` : replyTo.email;
  }
  if (attachments?.length) {
    body.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      ...(a.contentType ? { content_type: a.contentType } : {}),
      ...(a.contentId ? { content_id: a.contentId } : {}),
    }));
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Log status only — never the recipient or payload (PII).
      console.error(`Resend send failed: HTTP ${res.status}`);
      return { ok: false, reason: `http-${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    console.error("Resend send failed: request error");
    return { ok: false, reason: "request-error" };
  }
}

/**
 * Forward a contact-form message to the admin inbox. `replyTo` is the sender so
 * the admin can reply directly.
 */
export async function sendContactMessage(args: {
  name: string;
  email: string;
  message: string;
}): Promise<SendResult> {
  const { apiKey, senderEmail } = serverEnv.resend;
  const to = serverEnv.adminNotifyEmail;

  if (!apiKey || !senderEmail || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] contact message from ${args.email} (email not configured)`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "resend-not-configured" };
  }

  const text =
    `New contact message\n\n` +
    `Name: ${args.name}\nEmail: ${args.email}\n\n${args.message}`;

  return send({
    to,
    replyTo: { email: args.email, name: args.name },
    subject: `Contact form: ${args.name}`,
    text,
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(
      text,
    )}</pre>`,
  });
}

export function sendWinnerEmail(args: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";

  const text =
    `${first}, you won! 🎉\n\n` +
    `Out of everyone who entered the Lilac draw, your name came out of the hat. ` +
    `Congratulations — this really is you.\n\n` +
    `What happens next: someone from the Lilac team will email you very soon with ` +
    `all the details and how to claim your prize. Keep an eye on this inbox.\n\n` +
    `Your name is also up on the winners page now — go and see it: ` +
    `${publicEnv.siteUrl}/results\n\n` +
    `So glad it's you.\n\nThe Lilac Team`;

  const html = shell(
    `<tr><td style="padding:32px 32px 8px;font-size:16px;line-height:1.7;text-align:center;">
<span style="font-size:22px;font-weight:bold;color:#211b26;">${escapeHtml(first)}, you won!</span>
</td></tr>
<tr><td style="padding:8px 40px 4px;font-size:16px;line-height:1.7;text-align:center;color:#4a4353;">
Out of everyone who entered the Lilac draw, your name came out of the hat.
<strong style="color:#211b26;">Congratulations</strong> — this really is you.
</td></tr>
<tr><td style="padding:20px 32px 4px;">${divider()}</td></tr>
<tr><td style="padding:16px 32px 4px;font-size:15px;line-height:1.7;text-align:center;color:#4a4353;">
Someone from the Lilac team will email you very soon with all the details and how to claim your prize — keep an eye on this inbox.
</td></tr>
<tr><td style="padding:24px 32px 12px;text-align:center;">
${button(`${publicEnv.siteUrl}/results`, "See your name on the winners page")}
</td></tr>
<tr><td style="padding:4px 32px 8px;font-size:14px;line-height:1.6;color:#a39cc4;text-align:center;">
So glad it&rsquo;s you.
</td></tr>`,
    "🎉",
  );

  return send({ to: args.to, subject: `${first}, you won the Lilac draw! 🎉`, html, text });
}

export function sendAdminAlert(subject: string, text: string): Promise<SendResult> {
  if (!serverEnv.adminNotifyEmail) return Promise.resolve({ ok: false, reason: "no-admin-email" });
  return send({
    to: serverEnv.adminNotifyEmail,
    subject: `[Lilac admin] ${subject}`,
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(text)}</pre>`,
    text,
  });
}

/**
 * Shared card shell — brand header, rounded card, consistent footer. `emoji`,
 * when given, sits under the brand bar; a small touch that makes each email
 * read as its own moment (a request logged, a ticket confirmed, a hiccup to
 * sort out) instead of one generic notice template wearing three subjects.
 */
function shell(inner: string, emoji?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#efeaf9;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#211b26;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeaf9;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(69,50,159,0.14);">
<tr><td style="background:linear-gradient(135deg,#6a53e8,#45329f);padding:${emoji ? "30px 32px 24px" : "26px 32px"};text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;letter-spacing:1px;color:#ffffff;">Lilac</div>
${emoji ? `<div style="font-size:38px;line-height:1;padding-top:12px;">${emoji}</div>` : ""}
</td></tr>
${inner}
${footer()}
</table>
<div style="padding:18px 12px 0;font-size:12px;color:#9089a8;">You&rsquo;re receiving this because of an action on ${escapeHtml(publicEnv.siteUrl.replace(/^https?:\/\//, ""))}.</div>
</td></tr></table></body></html>`;
}

/** Filled pill CTA — the one visual language for every "go do something" link. */
function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6a53e8,#45329f);border-radius:9999px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">${escapeHtml(label)}</a>`;
}

/** Thin brand-tinted rule used to separate a message from its details. */
function divider(): string {
  return `<div style="height:1px;background:linear-gradient(90deg,transparent,#e0d9f5,transparent);"></div>`;
}

/** Label/value strip used for reference/quantity/amount-style facts. */
function infoCard(rows: { label: string; value: string; accent?: boolean }[]): string {
  const cells = rows
    .map(
      (r, i) => `<tr>
<td style="padding:13px 20px;font-size:13px;color:#6c6577;${i > 0 ? "border-top:1px solid #e6e2f7;" : ""}">${escapeHtml(r.label)}</td>
<td style="padding:13px 20px;text-align:right;font-size:14px;font-weight:bold;color:${r.accent ? "#5a45d6" : "#211b26"};${i > 0 ? "border-top:1px solid #e6e2f7;" : ""}">${r.value}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fd;border:1px solid #ece7fa;border-radius:14px;">${cells}</table>`;
}

/** Consistent sign-off, every email — brand strip + a home-page link back. */
function footer(): string {
  return `<tr><td style="padding:22px 32px 28px;border-top:1px solid #f0edf9;text-align:center;">
<a href="${escapeHtml(publicEnv.siteUrl)}" style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:bold;color:#6a53e8;text-decoration:none;letter-spacing:0.5px;">Lilac</a>
<div style="margin-top:4px;font-size:12px;color:#a39cc4;">The Lilac Team</div>
</td></tr>`;
}

/** Buyer confirmation the moment a purchase is submitted (payment not yet verified). */
export function sendTicketPending(args: {
  to: string;
  name: string;
  reference: string;
  quantity: number;
  amountLkr: number;
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const seatWord = args.quantity === 1 ? "seat" : "seats";
  const text =
    `${first}, you're almost in! 🎟️\n\n` +
    `We've got your request for ${args.quantity} Lilac ${seatWord} and the bank slip that ` +
    `came with it — thank you.\n\n` +
    `Reference: ${args.reference}\n` +
    `Tickets: ${args.quantity}\n` +
    `Amount: Rs. ${args.amountLkr.toLocaleString("en-LK")}\n\n` +
    `We're matching your transfer now, usually within a day or two. The moment it's ` +
    `confirmed, your e-ticket${args.quantity === 1 ? "" : "s"} — QR code${args.quantity === 1 ? "" : "s"} ` +
    `and all — will land right back in this inbox. No need to do anything else for now.\n\n` +
    `See you at Lilac.\n\nThe Lilac Team`;
  return send({
    to: args.to,
    subject: `You're almost in — request received (${args.reference})`,
    text,
    html: shell(
      `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.65;text-align:center;">
<p style="margin:0;"><strong>${escapeHtml(first)}</strong>, you&rsquo;re almost in!</p>
</td></tr>
<tr><td style="padding:6px 36px 22px;font-size:15px;line-height:1.65;color:#4a4353;text-align:center;">
We&rsquo;ve got your request for ${args.quantity} Lilac ${seatWord} and the bank slip that came with it — thank you.
</td></tr>
<tr><td style="padding:0 32px 8px;">
${infoCard([
  { label: "Reference", value: escapeHtml(args.reference), accent: true },
  { label: "Tickets", value: String(args.quantity) },
  { label: "Amount", value: `Rs.&nbsp;${args.amountLkr.toLocaleString("en-LK")}` },
])}
</td></tr>
<tr><td style="padding:22px 32px 4px;">${divider()}</td></tr>
<tr><td style="padding:18px 32px 28px;font-size:14px;line-height:1.7;color:#6c6577;text-align:center;">
🔍 We&rsquo;re matching your transfer now — usually within a day or two.<br>
The moment it&rsquo;s confirmed, your e-ticket${args.quantity === 1 ? "" : "s"} (QR code${args.quantity === 1 ? "" : "s"} included) will land right back in this inbox.<br>
Nothing else to do for now — see you at Lilac.
</td></tr>`,
      "🎟️",
    ),
  });
}

/** The e-ticket(s) — sent once an admin approves the payment. */
export function sendTicketApproved(args: {
  to: string;
  name: string;
  reference: string;
  tickets: { seatLabel: string; url: string }[];
  attachments: EmailAttachment[];
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const isOne = args.tickets.length === 1;
  const text =
    `${first}, you're in! 🎉\n\n` +
    `Your transfer's confirmed and your Lilac ticket${isOne ? " is" : "s are"} ready below. ` +
    `We can't wait to see you there.\n\n` +
    `Reference: ${args.reference}\n\n` +
    args.tickets.map((t) => `${t.seatLabel}: ${t.url}`).join("\n") +
    `\n\nJust show the QR code at the door — that's it, you're through.\n\nThe Lilac Team`;

  const rows = args.tickets
    .map(
      (t, i) => `<tr><td style="padding:10px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece7fa;border-radius:16px;overflow:hidden;">
<tr><td style="background:#f8f6fd;padding:11px 20px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#5a45d6;">🎫 ${escapeHtml(t.seatLabel)}</td></tr>
<tr><td style="padding:22px 20px;text-align:center;border-top:1px dashed #ddd5f5;">
<img src="cid:qr-${i}" width="180" height="180" alt="Ticket QR code" style="display:block;margin:0 auto 16px;border-radius:10px;" />
${button(t.url, "Open this ticket")}
</td></tr>
</table>
</td></tr>`,
    )
    .join("");

  return send({
    to: args.to,
    subject: `🎉 You're in — your Lilac ticket${isOne ? "" : "s"} (${args.reference})`,
    text,
    attachments: args.attachments,
    html: shell(
      `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.65;text-align:center;">
<p style="margin:0;"><strong>${escapeHtml(first)}</strong>, you&rsquo;re in!</p>
</td></tr>
<tr><td style="padding:6px 36px 24px;font-size:15px;line-height:1.65;color:#4a4353;text-align:center;">
Your transfer&rsquo;s confirmed and your ticket${isOne ? " is" : "s are"} ready below. We can&rsquo;t wait to see you there.
</td></tr>
<tr><td style="padding:0 32px 6px;">
${infoCard([{ label: "Reference", value: escapeHtml(args.reference), accent: true }])}
</td></tr>
<tr><td style="padding:10px 32px 20px;font-size:13px;color:#6c6577;text-align:center;">📲 Show the QR code at the door — that&rsquo;s it, you&rsquo;re through.</td></tr>
${rows}
<tr><td style="height:14px;"></td></tr>`,
      "🎉",
    ),
  });
}

/** Sent when an admin rejects a purchase. */
export function sendTicketRejected(args: {
  to: string;
  name: string;
  reference: string;
  reason: string;
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const text =
    `${first}, we hit a snag with your Lilac ticket request (${args.reference}).\n\n` +
    `${args.reason}\n\n` +
    `This isn't necessarily the end of the road — reply to this email and we'll help ` +
    `you sort it out.\n\nThe Lilac Team`;
  return send({
    to: args.to,
    subject: `Lilac tickets — let's sort this out (${args.reference})`,
    text,
    html: shell(
      `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.65;text-align:center;">
<p style="margin:0;"><strong>${escapeHtml(first)}</strong>, we hit a snag.</p>
</td></tr>
<tr><td style="padding:6px 36px 22px;font-size:15px;line-height:1.65;color:#4a4353;text-align:center;">
We couldn&rsquo;t confirm your ticket request just yet.
</td></tr>
<tr><td style="padding:0 32px 8px;">
${infoCard([{ label: "Reference", value: escapeHtml(args.reference) }])}
</td></tr>
<tr><td style="padding:16px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;border:1px solid #f3e6cf;border-radius:14px;">
<tr><td style="padding:16px 20px;font-size:14px;line-height:1.6;color:#7a5c1f;">📝 ${escapeHtml(args.reason)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:20px 32px 8px;font-size:14px;line-height:1.65;color:#6c6577;text-align:center;">
This isn&rsquo;t necessarily the end of the road.
</td></tr>
<tr><td style="padding:6px 32px 8px;text-align:center;">
${button(`mailto:${serverEnv.adminNotifyEmail || ""}`, "Reply and we'll sort it out")}
</td></tr>`,
      "🤔",
    ),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
