async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

export const getDeepDive = (title, description) => post('/api/deep-dive', { title, description });
export const getCurrentAffairs = () => post('/api/current-affairs', {});
export const discoverIncident = (query) => post('/api/discover', { query });
