export const prerender = false;

export async function POST({ request }) {
  const apiKey = import.meta.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_TTS_API_KEY || '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_TTS_API_KEY is not configured.' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const text = String(payload.text || '').trim();
  const languageCode = String(payload.languageCode || '').trim();
  const modelName = String(payload.modelName || '').trim();
  const voiceName = String(payload.voiceName || '').trim();

  if (!text || !languageCode) {
    return new Response(JSON.stringify({ error: 'text and languageCode are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const voice = { languageCode };
  if (voiceName) {
    voice.name = voiceName;
  }
  if (modelName) {
    voice.modelName = modelName;
  }

  const body = {
    input: { text },
    voice,
    audioConfig: { audioEncoding: 'MP3' }
  };

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: errorText || 'TTS request failed.' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await response.json();
  return new Response(JSON.stringify({
    audioContent: data.audioContent,
    audioEncoding: data.audioConfig?.audioEncoding || 'MP3'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
