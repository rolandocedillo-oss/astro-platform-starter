/*
  API Proxy
  Last Updated: 2026-01-28
  Changelog: See CHANGELOG.md.
*/



export const prerender = false;

export async function POST({ request }) {
  const apiKey = (import.meta.env.MY_SERVICE_API_KEY || process.env.MY_SERVICE_API_KEY || '').trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server secret missing', hint: 'Set MY_SERVICE_API_KEY in .env and restart dev server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let prompt = '';
  try {
    const raw = await request.text();
    if (raw) {
      const body = JSON.parse(raw);
      prompt = body?.prompt || '';
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
