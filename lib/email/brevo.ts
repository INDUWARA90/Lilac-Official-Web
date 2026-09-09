import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Brevo transactional email — used ONLY for entry-verification emails
 * (free tier: 300/day). Winner-confirmation emails go through Resend instead,
 * so a spike in verification volume can never exhaust the winner-email quota.
 *
 * We call Brevo's HTTP API directly (no SDK) to keep the dependency surface
 * small. https://developers.brevo.com/reference/sendtransacemail
 */
const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

export interface SendResult {
  ok: boolean;
  /** Provider message id when available — handy for the audit trail. */
  id?: string;
  reason?: string;
}

type BrevoPayload = Record<string, unknown>;

/** Low-level send. Callers handle the "not configured" case themselves. */
async function postToBrevo(payload: BrevoPayload): Promise<SendResult> {
  const { apiKey } = serverEnv.brevo;
  try {
    const res = await fetch(BREVO_SEND_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Log status only — never the recipient or payload (PII).
      console.error(`Brevo send failed: HTTP ${res.status}`);
      return { ok: false, reason: `http-${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, id: data.messageId };
  } catch {
    console.error("Brevo send failed: request error");
    return { ok: false, reason: "request-error" };
  }
}

interface VerificationEmailArgs {
  to: string;
  name: string;
  verifyUrl: string;
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: VerificationEmailArgs): Promise<SendResult> {
  const { apiKey, senderEmail, senderName } = serverEnv.brevo;

  // No key configured: don't block the flow. In dev, surface the link (the URL
  // is not in the PII set) so the flow is testable without Brevo.
  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] verification link (Brevo not configured): ${verifyUrl}`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "brevo-not-configured" };
  }

  const firstName = name.split(" ")[0] || "there";

  return postToBrevo({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name }],
    subject: "Confirm your Lilac entry",
    textContent:
      `Dear ${firstName},\n\n` +
      `Thank you for entering the Lilac draw. To confirm your entry, please ` +
      `open the link below:\n\n${verifyUrl}\n\n` +
      `Your entry is not counted until it has been confirmed. If you did not ` +
      `submit this entry, no action is required.\n\n` +
      `Regards,\nThe Lilac Team`,
    htmlContent: verificationHtml(firstName, verifyUrl),
  });
}

/**
 * Forward a contact-form message to the admin inbox. Sent via Brevo (not
 * Resend) so it never competes with winner-confirmation emails for quota.
 * `replyTo` is the sender so the admin can reply directly.
 */
export async function sendContactMessage(args: {
  name: string;
  email: string;
  message: string;
}): Promise<SendResult> {
  const { apiKey, senderEmail, senderName } = serverEnv.brevo;
  const to = serverEnv.adminNotifyEmail;

  if (!apiKey || !senderEmail || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] contact message from ${args.email} (email not configured)`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "brevo-not-configured" };
  }

  const text =
    `New contact message\n\n` +
    `Name: ${args.name}\nEmail: ${args.email}\n\n${args.message}`;

  return postToBrevo({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    replyTo: { email: args.email, name: args.name },
    subject: `Contact form: ${args.name}`,
    textContent: text,
    htmlContent: `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(
      text,
    )}</pre>`,
  });
}

function verificationHtml(firstName: string, verifyUrl: string): string {
  // Inline styles only — email clients strip <style>/external CSS.
  return `<!doctype html>
<html>
  <body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#211b26;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 24px;">
      <tr><td style="font-size:20px;font-weight:bold;color:#45329f;padding-bottom:24px;">Lilac</td></tr>
      <tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px;">Dear ${escapeHtml(firstName)},</td></tr>
      <tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px;">
        Thank you for entering the Lilac draw. To confirm your entry, please select the button below.
        Your entry is not counted until it has been confirmed.
      </td></tr>
      <tr><td style="padding:8px 0 24px;">
        <a href="${escapeHtml(verifyUrl)}"
           style="display:inline-block;padding:12px 28px;border:1px solid #5a45d6;border-radius:9999px;color:#45329f;text-decoration:none;font-weight:bold;">
          Confirm my entry
        </a>
      </td></tr>
      <tr><td style="font-size:13px;line-height:1.6;color:#6c6577;padding-bottom:16px;">
        If the button does not work, copy and paste this address into your browser:<br>
        <span style="word-break:break-all;">${escapeHtml(verifyUrl)}</span>
      </td></tr>
      <tr><td style="font-size:13px;line-height:1.6;color:#6c6577;">
        If you did not submit this entry, no action is required.
      </td></tr>
      <tr><td style="font-size:14px;line-height:1.6;padding-top:24px;">Regards,<br>The Lilac Team</td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
