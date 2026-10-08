import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const key = env.match(/GROQ_API_KEY=(.+)/)[1].trim();

const prompt = `Identify 5 MAJOR historical events that happened on this day (10-8) in history.
Focus on events with global impact or scientific significance.

STRICT OUTPUT FORMAT (JSON ARRAY ONLY):
[ { "year": "YYYY", "title": "Event Title", "description": "2 sentence summary." } ]`;

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'You are a JSON-only historical database. Output RAW JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 16384,
    reasoning_effort: 'low',
  }),
});
const d = await res.json();
if (!res.ok) {
  console.log('API ERROR', res.status, JSON.stringify(d).slice(0, 500));
  process.exit(0);
}
const m = d.choices?.[0]?.message || {};
console.log('message keys:', Object.keys(m));
console.log('content length:', (m.content || '').length);
console.log('content preview:', JSON.stringify((m.content || '').slice(0, 200)));
console.log('reasoning length:', (m.reasoning || '').length);
console.log('finish_reason:', d.choices?.[0]?.finish_reason);
console.log('usage:', JSON.stringify(d.usage));
