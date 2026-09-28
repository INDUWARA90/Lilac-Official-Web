import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Mailjet (free tier) — sends the e-ticket QR + reference to a buyer once an
 * admin approves their purchase, the winner notice once the draw runs, and a
 * copy of contact-form messages to the admin inbox.
 *
 * Auth is HTTP Basic with the API key as username, secret key as password —
 * https://dev.mailjet.com/email/guides/send-api-v31/
 *
 * Called directly from this Next.js app's server code, same shape as the
 * Brevo/Resend modules before it — no Supabase Edge Function in between.
 */
const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";

export interface SendResult {
  ok: boolean;
  /** Provider message id when available — handy for the audit trail. */
  id?: string;
  reason?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  /** Base64-encoded file content (no data: URI prefix). */
  base64Content: string;
  /**
   * When set, sent as an INLINE attachment (Mailjet's `InlinedAttachments`)
   * and referenced from the HTML body via `<img src="cid:THIS_VALUE">` — the
   * image then shows directly in the email, no download/open step needed.
   * Omit for a plain downloadable attachment instead.
   */
  contentId?: string;
}

interface SendArgs {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  replyTo?: { email: string; name?: string };
}

function configured(): boolean {
  const { apiKey, secretKey, senderEmail } = serverEnv.mailjet;
  return Boolean(apiKey && secretKey && senderEmail);
}

/** Low-level send. Callers handle the "not configured" case themselves. */
async function send({ to, toName, subject, text, html, attachments, replyTo }: SendArgs): Promise<SendResult> {
  const { apiKey, secretKey, senderEmail, senderName } = serverEnv.mailjet;

  if (!configured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Mailjet not configured — would email "${subject}" to a recipient`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "mailjet-not-configured" };
  }

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const message: Record<string, unknown> = {
    From: { Email: senderEmail, Name: senderName },
    To: [{ Email: to, Name: toName || to }],
    Subject: subject,
    TextPart: text,
    HTMLPart: html,
  };
  if (replyTo) {
    message.ReplyTo = { Email: replyTo.email, Name: replyTo.name || replyTo.email };
  }
  const inline = attachments?.filter((a) => a.contentId) ?? [];
  const plain = attachments?.filter((a) => !a.contentId) ?? [];
  if (inline.length) {
    // Shows directly in the email body via <img src="cid:...">, no open/
    // download step — see EmailAttachment.contentId.
    message.InlinedAttachments = inline.map((a) => ({
      ContentType: a.contentType,
      Filename: a.filename,
      Base64Content: a.base64Content,
      ContentID: a.contentId,
    }));
  }
  if (plain.length) {
    message.Attachments = plain.map((a) => ({
      ContentType: a.contentType,
      Filename: a.filename,
      Base64Content: a.base64Content,
    }));
  }

  try {
    const res = await fetch(MAILJET_SEND_URL, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ Messages: [message] }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      Messages?: { Status?: string; To?: { MessageID?: number }[]; Errors?: { ErrorMessage?: string }[] }[];
    };
    const result = data.Messages?.[0];

    if (!res.ok || result?.Status !== "success") {
      // Log status only — never the recipient or payload (PII).
      const reason = result?.Errors?.[0]?.ErrorMessage || result?.Status || `http-${res.status}`;
      console.error(`Mailjet send failed: ${reason}`);
      return { ok: false, reason };
    }

    const id = result.To?.[0]?.MessageID;
    return { ok: true, id: id ? String(id) : undefined };
  } catch {
    console.error("Mailjet send failed: request error");
    return { ok: false, reason: "request-error" };
  }
}

/** The e-ticket(s) — sent once an admin approves the payment. */
export function sendTicketApproved(args: {
  to: string;
  name: string;
  reference: string;
  /** `cid` must match the `contentId` of the corresponding entry in `attachments`. */
  tickets: { seatLabel: string; url: string; cid: string }[];
  attachments: EmailAttachment[];
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const isOne = args.tickets.length === 1;

  const text =
    `${first}, you're in! \n\n` +
    `Your transfer's confirmed and your Lilac ticket${isOne ? " is" : "s are"} ready. ` +
    `We can't wait to see you there.\n\n` +
    `Reference: ${args.reference}\n\n` +
    args.tickets.map((t) => `${t.seatLabel}: ${t.url}`).join("\n") +
    `\n\nYour QR code${isOne ? " is" : "s are"} below — show it at the door, that's it, ` +
    `you're through.\n\nThe Lilac Team`;

  // The QR is an INLINE image (cid:...), shown directly in the body — not
  // just a downloadable attachment the recipient has to open first.
  const rows = args.tickets
    .map(
      (t) => `<tr><td style="padding:10px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece7fa;border-radius:16px;overflow:hidden;">
<tr><td style="background:#f8f6fd;padding:11px 20px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#5a45d6;">🎫 ${escapeHtml(t.seatLabel)}</td></tr>
<tr><td style="padding:22px 20px;text-align:center;border-top:1px dashed #ddd5f5;">
<img src="cid:${escapeHtml(t.cid)}" width="220" height="220" alt="QR code for ${escapeHtml(t.seatLabel)}" style="display:block;margin:0 auto 16px;width:220px;height:220px;border:1px solid #ece7fa;border-radius:12px;">
${button(t.url, "Open this ticket")}
</td></tr>
</table>
</td></tr>`,
    )
    .join("");

  const html = shell(
    `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.65;text-align:center;">
<p style="margin:0;"><strong>${escapeHtml(first)}</strong>, you&rsquo;re in!</p>
</td></tr>
<tr><td style="padding:6px 36px 24px;font-size:15px;line-height:1.65;color:#4a4353;text-align:center;">
Your transfer&rsquo;s confirmed and your ticket${isOne ? " is" : "s are"} ready below. We can&rsquo;t wait to see you there.
</td></tr>
<tr><td style="padding:0 32px 6px;text-align:center;">
<span style="display:inline-block;background:#f8f6fd;border-radius:9999px;padding:6px 16px;font-size:13px;font-weight:bold;color:#5a45d6;">Ref: ${escapeHtml(args.reference)}</span>
</td></tr>
<tr><td style="padding:10px 32px 20px;font-size:13px;color:#6c6577;text-align:center;">📲 Show the QR code at the door — that&rsquo;s it, you&rsquo;re through.</td></tr>
${rows}
<tr><td style="height:14px;"></td></tr>`,
    "🎉",
  );

  return send({
    to: args.to,
    toName: args.name,
    subject: `🎉 You're in — your Lilac ticket${isOne ? "" : "s"} (${args.reference})`,
    text,
    html,
    attachments: args.attachments,
  });
}

/** Sent to a raffle winner once the draw has picked them. */
export function sendWinnerEmail(args: { to: string; name: string }): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const text =
    `${first}, you won! 🎉\n\n` +
    `Out of everyone who entered the Lilac draw, your name came out of the hat. ` +
    `Congratulations — this really is you.\n\n` +
    `Someone from the Lilac team will be in touch soon with the details. Your name is also up ` +
    `on the public winners page now.\n\nThe Lilac Team`;

  const html = shell(
    `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.65;text-align:center;">
<p style="margin:0;"><strong>${escapeHtml(first)}</strong>, you won!</p>
</td></tr>
<tr><td style="padding:6px 36px 24px;font-size:16px;line-height:1.65;color:#4a4353;text-align:center;">
Out of everyone who entered the Lilac draw, your name came out of the hat.
<strong style="color:#211b26;">Congratulations</strong> — this really is you.
</td></tr>
<tr><td style="padding:0 36px 20px;font-size:14px;line-height:1.6;color:#6c6577;text-align:center;">
Someone from the Lilac team will be in touch soon with the details.
</td></tr>`,
    "🎉",
  );

  return send({
    to: args.to,
    toName: args.name,
    subject: `${first}, you won the Lilac draw! 🎉`,
    text,
    html,
  });
}

/**
 * Forward a contact-form message to the admin's inbox. `replyTo` lets the
 * admin reply straight to the sender. Best-effort — the message is already
 * saved to contact_messages either way (see /api/contact), so a Mailjet
 * hiccup here just means the admin finds out from /admin/messages instead.
 */
export function sendContactMessage(args: {
  name: string;
  email: string;
  message: string;
  to: string;
}): Promise<SendResult> {
  const text = `New contact message\n\nName: ${args.name}\nEmail: ${args.email}\n\n${args.message}`;
  const html = shell(
    `<tr><td style="padding:30px 32px 4px;font-size:16px;line-height:1.5;text-align:center;">
<p style="margin:0;"><strong>New contact message</strong></p>
</td></tr>
<tr><td style="padding:16px 32px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fd;border:1px solid #ece7fa;border-radius:14px;">
<tr><td style="padding:13px 20px;font-size:13px;color:#6c6577;">Name</td><td style="padding:13px 20px;text-align:right;font-size:14px;font-weight:bold;color:#211b26;">${escapeHtml(args.name)}</td></tr>
<tr><td style="padding:13px 20px;font-size:13px;color:#6c6577;border-top:1px solid #e6e2f7;">Email</td><td style="padding:13px 20px;text-align:right;font-size:14px;font-weight:bold;color:#211b26;border-top:1px solid #e6e2f7;">${escapeHtml(args.email)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 32px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fd;border:1px solid #ece7fa;border-radius:14px;">
<tr><td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#3d3646;">${escapeHtml(args.message).replace(/\n/g, "<br>")}</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 32px 4px;font-size:13px;color:#6c6577;text-align:center;">Reply to this email to answer them directly.</td></tr>`,
    "✉️",
  );

  return send({
    to: args.to,
    subject: `Contact form: ${args.name}`,
    text,
    html,
    replyTo: { email: args.email, name: args.name },
  });
}

function shell(inner: string, emoji?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#efeaf9;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#211b26;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeaf9;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(69,50,159,0.14);">
<tr><td style="background:linear-gradient(135deg,#6a53e8,#45329f);padding:${emoji ? "26px 32px 22px" : "22px 32px"};text-align:center;">
<div style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">Lilac</div>
${emoji ? `<div style="font-size:38px;line-height:1;padding-top:14px;">${emoji}</div>` : ""}
</td></tr>
${inner}
<tr><td style="padding:20px 32px 26px;border-top:1px solid #f0edf9;text-align:center;">
<div style="font-size:12px;color:#a39cc4;">The Lilac Team</div>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6a53e8,#45329f);border-radius:9999px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">${escapeHtml(label)}</a>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
