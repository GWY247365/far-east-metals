/* ──────────────────────────────────────────
   Far East Metals – Cloudflare Worker
   • Serves static assets
   • Handles /api/contact with KV + SMTP email
   ────────────────────────────────────────── */

// ── SMTP via TCP connect() ──────────────────

async function smtpSend({ host, port, user, pass, from, to, subject, htmlBody }) {
  const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Helper: read SMTP response
  async function readReply() {
    const { value } = await reader.read();
    return value ? decoder.decode(value) : '';
  }

  // Helper: send SMTP command
  async function send(cmd) {
    await writer.write(encoder.encode(cmd + '\r\n'));
  }

  try {
    // Greeting
    await readReply();

    // EHLO
    await send(`EHLO fareastmetals.com.hk`);
    await readReply();

    // AUTH LOGIN
    await send('AUTH LOGIN');
    await readReply();

    await send(btoa(user));
    await readReply();

    await send(btoa(pass));
    const authReply = await readReply();
    if (!authReply.startsWith('235')) {
      throw new Error('SMTP auth failed: ' + authReply.trim());
    }

    // MAIL FROM
    await send(`MAIL FROM:<${from}>`);
    const fromReply = await readReply();
    if (!fromReply.startsWith('250')) {
      throw new Error('MAIL FROM failed: ' + fromReply.trim());
    }

    // RCPT TO
    await send(`RCPT TO:<${to}>`);
    const toReply = await readReply();
    if (!toReply.startsWith('250')) {
      throw new Error('RCPT TO failed: ' + toReply.trim());
    }

    // DATA
    await send('DATA');
    const dataReply = await readReply();
    if (!dataReply.startsWith('354')) {
      throw new Error('DATA failed: ' + dataReply.trim());
    }

    // Build MIME message
    const boundary = '----=_Part_' + Date.now();
    const mime = [
      `From: Far East Metals <${from}>`,
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
      '',
      '.',  // End of DATA
    ].join('\r\n');

    await writer.write(encoder.encode(mime));
    const sendReply = await readReply();
    if (!sendReply.startsWith('250')) {
      throw new Error('Send failed: ' + sendReply.trim());
    }

    // QUIT
    await send('QUIT');
    await readReply();

    return { success: true };
  } catch (err) {
    throw err;
  } finally {
    try { writer.close(); } catch (_) {}
    try { reader.cancel(); } catch (_) {}
  }
}

// ── Email HTML template ─────────────────────

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

// ── Main Worker ─────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Debug: check env bindings (temporary)
    if (url.pathname === '/api/debug-env') {
      return new Response(JSON.stringify({
        hasAssets: !!env.ASSETS,
        hasContacts: !!env.CONTACTS,
        hasSmtpUser: !!env.SMTP_USER,
        hasSmtpPass: !!env.SMTP_PASS,
        smtpUserType: typeof env.SMTP_USER,
        envKeys: Object.keys(env),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

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

        // Simple rate limiting by IP
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

        // Send email via SMTP (NetEase)
        let emailSent = false;
        let emailError = null;

        if (env.SMTP_USER && env.SMTP_PASS) {
          try {
            await smtpSend({
              host: 'smtp.qiye.163.com',
              port: 465,
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
              from: env.SMTP_USER,
              to: env.SMTP_USER,
              subject: `New Inquiry: ${service} - from ${name}`,
              htmlBody: buildEmailHtml({ name, email, tel, service, message, subscribe }),
            });
            emailSent = true;
          } catch (emailErr) {
            emailError = emailErr.message || String(emailErr);
            console.error('SMTP send failed:', emailError);
          }
        } else {
          emailError = 'SMTP credentials not configured';
        }

        return new Response(JSON.stringify({
          success: true,
          emailSent,
          emailError,
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
