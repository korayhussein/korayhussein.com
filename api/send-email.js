// Vercel Serverless Function for 100% White-Label Studio Email Dispatch (Resend)
export default async function handler(req, res) {
  // If invoked via Node.js req/res
  if (res && typeof res.status === "function") {
    return handleNodeRequest(req, res);
  }
  // Otherwise invoked via Web Standard Request
  return handleWebRequest(req);
}

// Named HTTP Method exports for modern Vercel / Edge runtimes
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function POST(req) {
  return handleWebRequest(req);
}

async function handleWebRequest(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await req.json();
    const result = await processEmailDispatch(data);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.error("Vercel Web Request error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleNodeRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const result = await processEmailDispatch(data);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Vercel Node Request error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function processEmailDispatch(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured in environment");
  }

  if (data.type === "delivery-ready") {
    const recipient = String(data.client_email || data.email || "").trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return { status: 400, body: { error: "Valid client email address is required" } };
    }
    const displayClient = String(data.name || "there").trim();
    const shootTitle = String(data.shoot_title || "Your Shoot").trim();
    const deliveryUrl = String(data.delivery_url || "https://korayhussein.com/#/client-portal").trim();
    const accessCode = String(data.access_code || "").trim();
    const subject = data.subject || "Your Final Images Are Ready — Koray Hussein Photography";

    const clientHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 26px; color: #f5f2ec; background-color: #090909; border: 1px solid #26221b;">
        <div style="border-bottom: 1px solid #2b261d; padding-bottom: 18px; margin-bottom: 26px;">
          <p style="font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #dfc49b; margin: 0 0 8px 0;">
            FINAL RETOUCHED COLLECTION
          </p>
          <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 400; letter-spacing: 0.02em; margin: 0; color: #ffffff;">
            Your images are ready
          </h1>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #e2dfd8; margin: 0 0 18px 0;">
          Hi ${escapeHtml(displayClient)},
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #e2dfd8; margin: 0 0 24px 0;">
          Your final retouched images${shootTitle ? ` from <strong>${escapeHtml(shootTitle)}</strong>` : ""} are ready to view and download on your private delivery page.
        </p>

        <div style="margin: 28px 0;">
          <a href="${escapeHtml(deliveryUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #dfc49b; color: #090909; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; padding: 14px 26px; border-radius: 999px;">
            Open Final Delivery Page &rarr;
          </a>
        </div>

        ${accessCode ? `
          <p style="font-size: 12px; color: #a7a298; margin: 0 0 14px 0;">
            Access Code (if prompted): <strong style="color: #dfc49b; letter-spacing: 0.08em;">${escapeHtml(accessCode)}</strong>
          </p>
        ` : ""}

        <p style="font-size: 12px; color: #a7a298; margin: 0 0 28px 0; word-break: break-all;">
          Direct link: <a href="${escapeHtml(deliveryUrl)}" target="_blank" rel="noopener noreferrer" style="color: #dfc49b;">${escapeHtml(deliveryUrl)}</a>
        </p>

        <div style="padding-top: 18px; border-top: 1px solid #26221b; font-size: 12px; line-height: 1.6; color: #9c968b;">
          <p style="margin: 0;">This is an auto-generated email. Please email <a href="mailto:contact@korayhussein.com" style="color: #dfc49b; text-decoration: underline;">contact@korayhussein.com</a> for any follow ups.</p>
        </div>
      </div>
    `;

    const sendWithResend = async (payload) => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      return { ok: r.ok, status: r.status, data: j };
    };

    let attempt = await sendWithResend({
      from: "Koray Hussein Photography <contact@korayhussein.com>",
      to: [recipient],
      bcc: ["contact@korayhussein.com"],
      reply_to: "contact@korayhussein.com",
      subject,
      html: clientHtml
    });

    if (!attempt.ok) {
      attempt = await sendWithResend({
        from: "Koray Hussein Photography <onboarding@resend.dev>",
        to: [recipient],
        bcc: ["contact@korayhussein.com"],
        reply_to: "contact@korayhussein.com",
        subject,
        html: clientHtml
      });
    }

    if (!attempt.ok) {
      const sandboxRes = await sendWithResend({
        from: "Koray Hussein Photography <onboarding@resend.dev>",
        to: ["contact@korayhussein.com"],
        reply_to: recipient,
        subject: `[Forward to ${recipient}] ${subject}`,
        html: `<p style="font-family:sans-serif;font-size:13px;color:#b00;">Note: Resend sender domain verification needed to email external recipients directly. Forward the link below to ${escapeHtml(recipient)}:</p>${clientHtml}`
      });
      if (!sandboxRes.ok) {
        return {
          status: sandboxRes.status,
          body: { error: attempt.data?.message || sandboxRes.data?.message || "Failed to send delivery notification email" }
        };
      }
      return {
        status: 200,
        body: { success: true, id: sandboxRes.data.id, sandboxFallback: true, recipient }
      };
    }

    return {
      status: 200,
      body: { success: true, id: attempt.data.id, sandboxFallback: false, recipient }
    };
  }

  const pageType = (data.page || "").toLowerCase();
  let fromLabel = "Koray Hussein Photography";
  let defaultSubject = "New Website Message";

  if (pageType.includes("book") || data.SELECTED_PACKAGE) {
    fromLabel = "Koray Hussein Photography (Bookings)";
    defaultSubject = `New Booking Request — ${data.SELECTED_PACKAGE || "Studio Shoot"}`;
  } else if (pageType.includes("testimonial")) {
    fromLabel = "Koray Hussein Photography (Testimonials)";
    defaultSubject = "New Testimonial Submission";
  } else if (pageType.includes("faq")) {
    fromLabel = "Koray Hussein Photography (FAQ)";
    defaultSubject = "New Question Submission";
  } else if (pageType.includes("about")) {
    fromLabel = "Koray Hussein Photography (About Me)";
    defaultSubject = "New Message from About Page";
  } else if (pageType.includes("cancellation") || pageType.includes("waitlist")) {
    fromLabel = "Koray Hussein Photography (Priority Waitlist)";
    defaultSubject = "New Cancellation Waitlist Signup";
  } else if (pageType.includes("client-portal") || pageType.includes("portal")) {
    fromLabel = "Koray Hussein Photography (Client Portal)";
    defaultSubject = "New Client Proofing Selections";
  }

  const subject = data.subject || data._subject || defaultSubject;
  const clientName = data.name || data["your name"] || "Website Visitor";
  const clientEmail = data.email || data["email address"] || data["client email"] || "";
  const clientInstagramOrWeb = data.instagram_or_website || data.instagram || data.socials || data["instagram handle"] || data["instagram handle / website"] || "";
  const message = data.message || data["your message"] || data.notes || "";

  // Build clean, editorial Georgia-serif table of details
  const rows = [];
  if (clientName) rows.push(`<tr><td style="padding: 9px 0; color: #888; width: 140px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Client:</td><td style="padding: 9px 0; font-weight: 600; color: #111;">${escapeHtml(clientName)}</td></tr>`);
  if (clientEmail) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Email:</td><td style="padding: 9px 0;"><a href="mailto:${escapeHtml(clientEmail)}" style="color: #111; text-decoration: underline; font-weight: 500;">${escapeHtml(clientEmail)}</a></td></tr>`);
  if (clientInstagramOrWeb) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Instagram / Web:</td><td style="padding: 9px 0; color: #111;">${formatSocialOrWebsiteLink(clientInstagramOrWeb)}</td></tr>`);

  if (data.SELECTED_PACKAGE) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Session:</td><td style="padding: 9px 0; font-weight: 600; color: #111;">${escapeHtml(data.SELECTED_PACKAGE)}</td></tr>`);
  if (data.IMAGE_PACKAGE) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Image Tier:</td><td style="padding: 9px 0; color: #111;">${escapeHtml(data.IMAGE_PACKAGE)}</td></tr>`);
  if (data.POLAROIDS_ADDON) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Polaroids Addon:</td><td style="padding: 9px 0; color: #111;">${escapeHtml(data.POLAROIDS_ADDON)}</td></tr>`);
  if (data.ESTIMATED_TOTAL) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estimated Total:</td><td style="padding: 9px 0; font-weight: 700; color: #111; font-size: 15px;">${escapeHtml(data.ESTIMATED_TOTAL)}</td></tr>`);
  if (data.DEPOSIT_REQUIRED) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Deposit to Secure:</td><td style="padding: 9px 0; font-weight: 600; color: #111;">${escapeHtml(data.DEPOSIT_REQUIRED)}</td></tr>`);

  const preferredDates = data.preferred_dates || data.DATES || data.dates || "";
  if (preferredDates) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Preferred Dates:</td><td style="padding: 9px 0; color: #111;">${escapeHtml(preferredDates)}</td></tr>`);

  const bookingAs = data.booking_as || data.role || data.ROLE || "";
  if (bookingAs) rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Booking As:</td><td style="padding: 9px 0; color: #111; font-weight: 500;">${escapeHtml(bookingAs)}</td></tr>`);

  const moodboardLink = data.moodboard_link || data.moodboard_url || "";
  if (moodboardLink) {
    const moodboardHref = /^https?:\/\//i.test(moodboardLink) ? moodboardLink : `https://${moodboardLink}`;
    rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Moodboard Link:</td><td style="padding: 9px 0;"><a href="${escapeHtml(moodboardHref)}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">${escapeHtml(moodboardLink)}</a></td></tr>`);
  }

  // Process attachments if submitted
  const attachments = [];
  if (Array.isArray(data.attachments)) {
    for (const att of data.attachments) {
      if (att && att.filename && att.content) {
        const rawBase64 = att.content.includes(",") ? att.content.split(",")[1] : att.content;
        attachments.push({
          filename: att.filename,
          content: rawBase64
        });
      }
    }
  }
  if (attachments.length > 0) {
    rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Inspiration Images:</td><td style="padding: 9px 0; color: #111; font-weight: 600;">${attachments.length} file(s) attached (see email attachments)</td></tr>`);
  }

  const reviewUrl = String(data.review_url || data["Review Gallery"] || "").trim();

  // Any other custom fields not handled above
  Object.keys(data).forEach((key) => {
    const skip = [
      "page", "subject", "_subject", "name", "email", "instagram", "socials", "message",
      "instagram_or_website", "instagram handle", "instagram handle / website",
      "preferred_dates", "booking_as", "moodboard_link", "moodboard_url", "review_url",
      "SELECTED_PACKAGE", "IMAGE_PACKAGE", "POLAROIDS_ADDON", "ESTIMATED_TOTAL",
      "DEPOSIT_REQUIRED", "NOTICE_POLICY", "DATES", "dates", "role", "ROLE", "attachments"
    ];
    const lowerKey = key.toLowerCase();
    if (
      key.startsWith("_") ||
      skip.includes(key) ||
      lowerKey.includes("captcha") ||
      lowerKey.includes("template") ||
      lowerKey.includes("next")
    ) {
      return;
    }
    if (typeof data[key] === "string" && data[key].trim()) {
      const val = data[key].trim();
      const renderedVal = /^https?:\/\//i.test(val)
        ? `<a href="${escapeHtml(val)}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 600;">Open Selected Proofs &rarr;</a>`
        : escapeHtml(val);
      rows.push(`<tr><td style="padding: 9px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(key)}:</td><td style="padding: 9px 0; color: #111;">${renderedVal}</td></tr>`);
    }
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; color: #111; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px 0; color: #111;">
          Koray Hussein Photography
        </h1>
        <p style="font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #888; margin: 0;">
          ${escapeHtml(fromLabel.replace("Koray Hussein Photography", "").trim() || "Website Enquiry")} &bull; korayhussein.com
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        ${rows.join("")}
      </table>

      ${/^https?:\/\//i.test(reviewUrl) ? `
        <div style="margin: 24px 0;">
          <a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #111111; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; padding: 14px 24px; border-radius: 4px;">
            View Client Selections &rarr;
          </a>
        </div>
      ` : ''}

      ${message ? `
        <div style="margin-top: 24px; padding: 20px; background-color: #f8f8f8; border-left: 3px solid #111;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 8px 0; font-weight: 600;">Message</p>
          <p style="font-family: Georgia, serif; font-size: 14px; line-height: 1.6; color: #222; margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
      ` : ''}

      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        <p style="margin: 0;">Hit <strong>Reply</strong> to respond directly to ${escapeHtml(clientName)}${clientEmail ? ` (${escapeHtml(clientEmail)})` : ''}.</p>
      </div>
    </div>
  `;

  const sender = `${fromLabel} <onboarding@resend.dev>`;
  const targetRecipient = "contact@korayhussein.com";

  const resendPayload = {
    from: sender,
    to: [targetRecipient],
    reply_to: clientEmail || targetRecipient,
    subject: subject,
    html: html
  };
  if (attachments.length > 0) {
    resendPayload.attachments = attachments;
  }

  console.log(`[send-email] Dispatching to ${targetRecipient}. Attachments count: ${attachments.length}`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(resendPayload)
  });

  const resData = await res.json();
  console.log(`[send-email] Resend status: ${res.status}, response id: ${resData.id || "none"}`);
  if (!res.ok) {
    console.error("Resend API Error:", resData);
    return {
      status: res.status,
      body: { error: resData.message || "Failed to send email" }
    };
  }

  return {
    status: 200,
    body: { success: true, id: resData.id }
  };
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatSocialOrWebsiteLink(raw) {
  if (!raw || typeof raw !== "string") return "";
  const val = raw.trim();
  if (!val) return "";

  // 1. If already a full URL (http:// or https://)
  if (/^https?:\/\//i.test(val)) {
    return `<a href="${escapeHtml(val)}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">${escapeHtml(val)}</a>`;
  }

  // 2. If starts with @ (e.g. @janedoe)
  if (val.startsWith("@")) {
    const handle = val.replace(/^@+/, "");
    const url = `https://instagram.com/${encodeURIComponent(handle)}`;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">@${escapeHtml(handle)}</a> <span style="color: #888; font-size: 12px; margin-left: 4px;">(Instagram)</span>`;
  }

  // 3. If contains instagram.com/ without protocol
  if (/instagram\.com\//i.test(val)) {
    const url = `https://${val.replace(/^https?:\/\//i, "")}`;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">${escapeHtml(val)}</a>`;
  }

  // 4. If looks like a domain / website (e.g. janedoe.com, www.portfolio.co.uk)
  if (val.includes(".") && !/\s/.test(val)) {
    const url = `https://${val.replace(/^https?:\/\//i, "")}`;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">${escapeHtml(val)}</a>`;
  }

  // 5. If clean handle without spaces (e.g. janedoe)
  if (!/\s/.test(val)) {
    const url = `https://instagram.com/${encodeURIComponent(val)}`;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #111; text-decoration: underline; font-weight: 500;">@${escapeHtml(val)}</a> <span style="color: #888; font-size: 12px; margin-left: 4px;">(Instagram)</span>`;
  }

  return escapeHtml(val);
}
