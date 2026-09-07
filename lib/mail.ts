// Transactional mail over SMTP via nodemailer. Server-only. Any mailbox with
// SMTP works — a Gmail App Password is the zero-cost, no-domain option.
//
// Every sender here swallows failures: an order or message is already saved
// by the time we notify, and a mail outage must never surface as a failed
// checkout. With SMTP_HOST unset (local dev) mails are logged, not sent.
import nodemailer, { type Transporter } from "nodemailer";
import type { Order, Settings } from "@/lib/store";
import { orderTrackingPath } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

// One transporter per process; nodemailer keeps the connection settings and
// opens a socket per send (no pool — a kitchen sends a handful a day).
let transporter: Transporter | null = null;

function smtp(): Transporter | null {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    // 465 = implicit TLS; set SMTP_SECURE=false for 587 + STARTTLS.
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const transport = smtp();
  if (!transport) {
    console.info(`[mail skipped: SMTP not configured] to=${mail.to} subject="${mail.subject}"`);
    return false;
  }
  try {
    await transport.sendMail({
      // Gmail rewrites `from` to the authenticated account; MAIL_FROM sets the display name.
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      replyTo: mail.replyTo,
    });
    return true;
  } catch (err) {
    console.error("mail failed", err);
    return false;
  }
}

/* ---------------------------- Order notices ---------------------------- */

const rupees = (n: number) => `₹${n.toFixed(0)}`;

function describeOrder(o: Order): string {
  const lines = o.items.map((it) => `  ${it.qty} × ${it.name} — ${rupees(it.price * it.qty)}`);
  return [
    `Order ${o.id}`,
    "",
    ...lines,
    "",
    `Subtotal  ${rupees(o.subtotal)}`,
    `Delivery  ${o.delivery === 0 ? "Free" : rupees(o.delivery)}`,
    `Total     ${rupees(o.total)}`,
    `Payment   ${o.payment}`,
    "",
    "Deliver to:",
    `  ${o.name}`,
    `  ${o.address ?? ""}`,
    `  ${o.city ?? ""}, ${o.state ?? ""} ${o.pincode ?? ""}`,
    `  ${o.phone}`,
  ].join("\n");
}

// Kitchen + customer, right after the order row is saved.
export async function notifyOrderPlaced(order: Order, settings: Settings): Promise<void> {
  const details = describeOrder(order);
  // Needs SITE_URL to build an absolute link; omitted until that is configured.
  const trackUrl = absoluteUrl(orderTrackingPath(order.id));
  const trackLine = trackUrl ? `\n\nTrack your order: ${trackUrl}` : "";
  await Promise.all([
    sendMail({
      to: settings.email,
      subject: `New order ${order.id} — ${rupees(order.total)} from ${order.name}`,
      text: `A new order has been placed.\n\n${details}`,
      replyTo: order.email,
    }),
    sendMail({
      to: order.email,
      subject: `Your ${settings.storeName} order ${order.id}`,
      text:
        `Thank you, ${order.name}! We've received your order and will call ` +
        `${order.phone} to confirm delivery.\n\n${details}${trackLine}\n\n` +
        `Questions? Reply to this email or call ${settings.phone}.`,
      replyTo: settings.email,
    }),
  ]);
}

// Customer only, and only for the stages a shopper actually cares about.
const STATUS_NOTICE: Record<string, string> = {
  Confirmed: "Your order is confirmed and the kitchen is on it.",
  Dispatched: "Your order is on its way.",
  Delivered: "Your order has been delivered. We hope you enjoy it!",
  Cancelled: "Your order has been cancelled. If this is unexpected, please get in touch.",
};

export async function notifyOrderStatus(order: Order, settings: Settings): Promise<void> {
  const notice = STATUS_NOTICE[order.status];
  if (!notice) return;
  await sendMail({
    to: order.email,
    subject: `Order ${order.id}: ${order.status}`,
    text: `${notice}\n\n${describeOrder(order)}\n\nQuestions? Reply to this email or call ${settings.phone}.`,
    replyTo: settings.email,
  });
}

/* --------------------------- Contact messages -------------------------- */

export async function notifyContactMessage(
  msg: { name: string; email: string; subject: string; body: string },
  settings: Settings,
): Promise<void> {
  await sendMail({
    to: settings.email,
    subject: `Contact form: ${msg.subject}`,
    text: `From ${msg.name} <${msg.email}>\n\n${msg.body}`,
    replyTo: msg.email,
  });
}
