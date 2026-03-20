import { EmailMessage } from 'cloudflare:email';

function buildMimeEmail({ from, to, subject, htmlBody }) {
  const boundary = '----=_Part_' + Date.now();
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ];
  return lines.join('\r\n');
}

function buildEmailHtml({ name, email, tel, service, message, subscribe }) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<h2 style="color:#F5A623;border-bottom:2px solid #F5A623;padding-bottom:10px">New Contact Form Submission</h2>
<table style="width:100%;border-collapse:collapse;margin-top:16px">
<tr><td style="padding:10px 0;font-weight:bold;color:#333;width:120px;vertical-align:top">Name</td><td style="padding:10px 0;color:#555">${name}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;color:#333;vertical-align:top">Email</td><td style="padding:10px 0;color:#555"><a href="mailto:${email}" style="color:#F5A623">${email}</a></td></tr>
<tr><td style="padding:10px 0;font-weight:bold;color:#333;vertical-align:top">Tel</td><td style="padding:10px 0;color:#555">${tel || 'Not provided'}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;color:#333;vertical-align:top">Service</td><td style="padding:10px 0;color:#555">${service}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;color:#333;vertical-align:top">Message</td><td style="padding:10px 0;color:#555;white-space:pre-wrap">${message || 'No message'}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;color:#333;vertical-align:top">Subscribe</td><td style="padding:10px 0;color:#555">${subscribe ? 'Yes' : 'No'}</td></tr>
</table>
<p style="margin-top:20px;font-size:12px;color:#999">Sent from fareastmetals.com.hk contact form</p>
</div>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle contact form API
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, email, tel, service, message, subscribe } = body;

        // Validate required fields
        if (!name || !email || !service) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(JSON.stringify({ error: 'Invalid email address' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Simple rate limiting by IP (max 5 submissions per hour)
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (env.CONTACTS) {
          const rateLimitKey = `ratelimit-${clientIP}`;
          const existing = await env.CONTACTS.get(rateLimitKey);
          const count = existing ? parseInt(existing, 10) : 0;

          if (count >= 5) {
            return new Response(JSON.stringify({ error: 'Too many submissions. Please try again later.' }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          await env.CONTACTS.put(rateLimitKey, String(count + 1), { expirationTtl: 3600 });

          const key = `${Date.now()}-${email}`;
          await env.CONTACTS.put(key, JSON.stringify({
            name, email, tel, service, message, subscribe,
            ip: clientIP,
            timestamp: new Date().toISOString(),
          }));
        }

        // Send email via Cloudflare Email Workers
        let emailError = null;
        if (env.SEND_EMAIL) {
          try {
            const rawMime = buildMimeEmail({
              from: 'Far East Metals <noreply@fareastmetals.com.hk>',
              to: 'info@fareastmetals.com.hk',
              subject: `New Inquiry: ${service} - from ${name}`,
              htmlBody: buildEmailHtml({ name, email, tel, service, message, subscribe }),
            });

            // Convert string to ReadableStream as required by EmailMessage
            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(rawMime);
            const stream = new ReadableStream({
              start(controller) {
                controller.enqueue(uint8Array);
                controller.close();
              },
            });

            const emailMessage = new EmailMessage(
              'noreply@fareastmetals.com.hk',
              'info@fareastmetals.com.hk',
              stream
            );
            await env.SEND_EMAIL.send(emailMessage);
          } catch (emailErr) {
            emailError = emailErr.message || String(emailErr);
            console.error('Email send failed:', emailError);
          }
        } else {
          emailError = 'SEND_EMAIL binding not available';
        }

        return new Response(JSON.stringify({
          success: true,
          emailSent: !emailError,
          emailError: emailError,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal server error', detail: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // All other requests → static assets
    return env.ASSETS.fetch(request);
  },
};
