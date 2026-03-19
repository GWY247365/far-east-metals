export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { name, email, tel, service, message, subscribe } = body;

    if (!name || !email || !service) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store in KV or send email via external service
    // For now, log and return success
    // You can integrate with services like:
    // - Cloudflare KV (free tier: 100k reads/day, 1k writes/day)
    // - Resend (free tier: 100 emails/day)
    // - EmailJS (free tier: 200 emails/month)

    console.log('Contact form submission:', { name, email, tel, service, message, subscribe });

    // If you set up KV binding named CONTACTS:
    if (context.env.CONTACTS) {
      const key = `${Date.now()}-${email}`;
      await context.env.CONTACTS.put(key, JSON.stringify({
        name, email, tel, service, message, subscribe,
        timestamp: new Date().toISOString(),
      }));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
