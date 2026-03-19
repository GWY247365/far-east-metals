export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle contact form API
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, email, tel, service, message, subscribe } = body;

        if (!name || !email || !service) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Store in KV if binding exists
        if (env.CONTACTS) {
          const key = `${Date.now()}-${email}`;
          await env.CONTACTS.put(key, JSON.stringify({
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

    // All other requests → static assets
    return env.ASSETS.fetch(request);
  },
};
