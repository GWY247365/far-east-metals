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

          // Increment rate limit counter (expires in 1 hour)
          await env.CONTACTS.put(rateLimitKey, String(count + 1), { expirationTtl: 3600 });

          // Store submission
          const key = `${Date.now()}-${email}`;
          await env.CONTACTS.put(key, JSON.stringify({
            name, email, tel, service, message, subscribe,
            ip: clientIP,
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

    // All other requests → static assets
    return env.ASSETS.fetch(request);
  },
};
