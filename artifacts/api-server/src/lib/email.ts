import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Sinovera Transit Global <support@sinoveratransit.com>";
const SUPPORT = "support@sinoveratransit.com";
const BRAND_COLOR = "#0d2144";
const ACCENT = "#f5a623";
const LOGO_URL = "https://global-transit-world.replit.app/logo-3d.png";

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:${BRAND_COLOR};padding:24px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="STG" width="72" height="72"
               style="display:inline-block;vertical-align:middle;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));" />
          <div style="display:inline-block;vertical-align:middle;margin-left:14px;text-align:left;">
            <div style="color:${ACCENT};font-size:22px;font-weight:900;letter-spacing:2px;line-height:1;">STG</div>
            <div style="color:#ffffff;font-size:11px;font-weight:500;opacity:0.75;letter-spacing:0.5px;margin-top:3px;">Sinovera Transit Global</div>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e8ecf0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Sinovera Transit Global · 128 Logistics Blvd, Qianhai Free Trade Zone, Shenzhen 518055</p>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Sinovera Transit Global. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND_COLOR};">${text}</h1>`;
}
function para(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${text}</p>`;
}
function divider() {
  return `<hr style="border:none;border-top:1px solid #e8ecf0;margin:24px 0;">`;
}
function badge(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#64748b;width:140px;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;font-weight:600;color:${BRAND_COLOR};">${value}</td>
  </tr>`;
}
function infoTable(rows: Array<[string, string]>) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:8px;margin:20px 0;border:1px solid #e8ecf0;">
    ${rows.map(([l, v]) => badge(l, v)).join("")}
  </table>`;
}
function trackingButton(trackingNumber: string) {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="https://sinoveratransit.com/track/${trackingNumber}"
       style="display:inline-block;background:${ACCENT};color:${BRAND_COLOR};font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.5px;">
      Track My Shipment →
    </a>
  </div>`;
}

// ─── 1. Contact enquiry received (to support) ─────────────────────────────────
export async function sendContactEnquiryToSupport(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const body = `
    ${heading("New Contact Enquiry")}
    ${para(`You have received a new message from the Sinovera website contact form.`)}
    ${divider()}
    ${infoTable([
      ["From", data.name],
      ["Email", data.email],
      ["Subject", data.subject],
    ])}
    <div style="background:#f8fafc;border-left:4px solid ${ACCENT};border-radius:4px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    </div>
    ${divider()}
    ${para(`Reply directly to <a href="mailto:${data.email}" style="color:${ACCENT};">${data.email}</a>`)}
  `;
  return resend.emails.send({
    from: FROM,
    to: SUPPORT,
    replyTo: data.email,
    subject: `[Enquiry] ${data.subject} — ${data.name}`,
    html: baseTemplate("New Enquiry", body),
  });
}

// ─── 2. Contact confirmation (to visitor) ────────────────────────────────────
export async function sendContactConfirmation(data: {
  name: string;
  email: string;
  subject: string;
}) {
  const body = `
    ${heading(`Hi ${data.name},`)}
    ${para("Thank you for reaching out to Sinovera Transit Global. We've received your message and a member of our logistics team will get back to you within <strong>24 hours</strong>.")}
    ${divider()}
    ${infoTable([["Your subject", data.subject]])}
    ${para("In the meantime, feel free to explore our services or track an existing shipment on our website.")}
    <div style="text-align:center;margin:28px 0;">
      <a href="https://sinoveratransit.com/track"
         style="display:inline-block;background:${ACCENT};color:${BRAND_COLOR};font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;">
        Track a Shipment
      </a>
    </div>
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: "We received your enquiry — Sinovera Transit Global",
    html: baseTemplate("Enquiry Received", body),
  });
}

// ─── 3. Shipment created — receiver notification ──────────────────────────────
export async function sendShipmentCreatedToReceiver(data: {
  email: string;
  receiverName: string;
  senderName: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  shippingMethod: string;
  estimatedDelivery?: string | null;
}) {
  const methodLabel = data.shippingMethod.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const rows: Array<[string, string]> = [
    ["Tracking #", data.trackingNumber],
    ["From", data.origin],
    ["To", data.destination],
    ["Service", methodLabel],
  ];
  if (data.estimatedDelivery) rows.push(["Est. Delivery", new Date(data.estimatedDelivery).toDateString()]);

  const body = `
    ${heading(`Your shipment is on its way, ${data.receiverName}!`)}
    ${para(`<strong>${data.senderName}</strong> has registered a shipment destined for you through Sinovera Transit Global. You can track it in real time using the details below.`)}
    ${divider()}
    ${infoTable(rows)}
    ${trackingButton(data.trackingNumber)}
    ${para(`Bookmark or save your tracking number: <strong style="font-family:monospace;font-size:16px;color:${BRAND_COLOR};">${data.trackingNumber}</strong>`)}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Your shipment ${data.trackingNumber} is on its way`,
    html: baseTemplate("Shipment On Its Way", body),
  });
}

// ─── 4. Shipment created — sender confirmation ───────────────────────────────
export async function sendShipmentCreatedToSender(data: {
  email: string;
  senderName: string;
  receiverName: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  shippingMethod: string;
  estimatedDelivery?: string | null;
}) {
  const methodLabel = data.shippingMethod.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const rows: Array<[string, string]> = [
    ["Tracking #", data.trackingNumber],
    ["Receiver", data.receiverName],
    ["From", data.origin],
    ["To", data.destination],
    ["Service", methodLabel],
  ];
  if (data.estimatedDelivery) rows.push(["Est. Delivery", new Date(data.estimatedDelivery).toDateString()]);

  const body = `
    ${heading(`Shipment registered, ${data.senderName}!`)}
    ${para("Your shipment has been successfully registered in the Sinovera system. Use the tracking number below to monitor its progress.")}
    ${divider()}
    ${infoTable(rows)}
    ${trackingButton(data.trackingNumber)}
    ${para("Our team will update the tracking status as your shipment moves. You'll receive an email at each key milestone.")}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Shipment ${data.trackingNumber} registered — Sinovera Transit Global`,
    html: baseTemplate("Shipment Registered", body),
  });
}

// ─── 5. Tracking status update ────────────────────────────────────────────────
export async function sendTrackingUpdate(data: {
  email: string;
  name: string;
  trackingNumber: string;
  status: string;
  description: string;
  location?: string | null;
  eventTime: string;
}) {
  const statusLabel = data.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const rows: Array<[string, string]> = [
    ["Tracking #", data.trackingNumber],
    ["Status", statusLabel],
    ["Time", new Date(data.eventTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
  ];
  if (data.location) rows.push(["Location", data.location]);

  const body = `
    ${heading(`Tracking update for ${data.trackingNumber}`)}
    ${para(`Hi ${data.name}, there's a new update on your shipment.`)}
    ${divider()}
    <div style="background:#f0f9ff;border-left:4px solid ${ACCENT};border-radius:4px;padding:14px 20px;margin:16px 0;">
      <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND_COLOR};">${statusLabel}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#475569;">${data.description}</p>
    </div>
    ${infoTable(rows)}
    ${trackingButton(data.trackingNumber)}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Update: ${statusLabel} — ${data.trackingNumber}`,
    html: baseTemplate("Tracking Update", body),
  });
}

// ─── 6. Shipment hold activated ──────────────────────────────────────────────
export async function sendHoldNotification(data: {
  email: string;
  name: string;
  trackingNumber: string;
  reason: string;
  publicMessage: string;
  expectedResolutionDate?: Date | null;
}) {
  const rows: Array<[string, string]> = [
    ["Tracking #", data.trackingNumber],
    ["Hold Reason", data.reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())],
  ];
  if (data.expectedResolutionDate) {
    rows.push(["Expected Resolution", new Date(data.expectedResolutionDate).toDateString()]);
  }

  const body = `
    ${heading(`Action required: your shipment is on hold`)}
    ${para(`Hi ${data.name}, your shipment <strong style="font-family:monospace;color:${BRAND_COLOR};">${data.trackingNumber}</strong> has been placed on hold and requires your attention.`)}
    ${divider()}
    <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 20px;margin:16px 0;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#92400e;">Shipment On Hold</p>
      <p style="margin:6px 0 0;font-size:14px;color:#78350f;">${data.publicMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    </div>
    ${infoTable(rows)}
    ${para(`If you have questions or need to take action, please contact our support team at <a href="mailto:${SUPPORT}" style="color:${ACCENT};">${SUPPORT}</a> quoting your tracking number.`)}
    ${trackingButton(data.trackingNumber)}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Action required: Shipment ${data.trackingNumber} is on hold`,
    html: baseTemplate("Shipment On Hold", body),
  });
}

// ─── 7. Shipment hold released ────────────────────────────────────────────────
export async function sendHoldReleasedNotification(data: {
  email: string;
  name: string;
  trackingNumber: string;
}) {
  const body = `
    ${heading(`Good news — your shipment is moving again!`)}
    ${para(`Hi ${data.name}, the hold on your shipment <strong style="font-family:monospace;color:${BRAND_COLOR};">${data.trackingNumber}</strong> has been resolved and it is now back in transit.`)}
    ${divider()}
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:14px 20px;margin:16px 0;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#14532d;">Hold Released</p>
      <p style="margin:6px 0 0;font-size:14px;color:#166534;">Your shipment has been cleared and is on its way to you.</p>
    </div>
    ${infoTable([["Tracking #", data.trackingNumber]])}
    ${trackingButton(data.trackingNumber)}
    ${para(`Thank you for your patience. If you have any further questions, contact us at <a href="mailto:${SUPPORT}" style="color:${ACCENT};">${SUPPORT}</a>.`)}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Your shipment ${data.trackingNumber} is back on track`,
    html: baseTemplate("Hold Released", body),
  });
}

// ─── 8. Generic notification email ───────────────────────────────────────────
export async function sendNotificationEmail(data: {
  email: string;
  name: string;
  title: string;
  message: string;
  trackingNumber?: string | null;
}) {
  const body = `
    ${heading(data.title)}
    ${para(`Hi ${data.name},`)}
    ${para(data.message)}
    ${data.trackingNumber ? trackingButton(data.trackingNumber) : ""}
  `;
  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `${data.title} — Sinovera Transit Global`,
    html: baseTemplate(data.title, body),
  });
}
