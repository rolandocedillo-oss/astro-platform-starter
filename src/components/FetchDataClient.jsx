import { useEffect, useState } from 'react';

export default function FetchDataClient({ q }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: q || 'hello' }),
    })
      .then((r) => r.json())
      .then(setData)
      .catch((err) => setData({ error: err.message }));
  }, [q]);

  if (!data) return <div>Loading…</div>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
