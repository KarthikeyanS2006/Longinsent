const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

async function groqRequest(prompt, temperature = 0.5) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY || GROQ_KEY.startsWith('gsk_YOUR')) {
    const err = new Error('GROQ_API_KEY missing. Set it in Vercel → Settings → Environment Variables.');
    err.status = 503;
    throw err;
  }
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a JSON-only historical database. Output RAW JSON. No markdown fences, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: 16384,
      reasoning_effort: 'low',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Groq API error ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

function extractJson(content) {
  let out = content.trim();
  if (out.startsWith('```json')) out = out.slice(7);
  else if (out.startsWith('```')) out = out.slice(3);
  if (out.endsWith('```')) out = out.slice(0, -3);
  return out.trim();
}

function fail(res, e) {
  res.status(e.status || 500).json({ error: e.message });
}

export async function deepDiveHandler(req, res) {
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const prompt = `
      You are a world-class historian for the KEYAN GROUPS RESEARCH ARCHIVE.
      Provide a deep dive into: "${title}".
      Context: ${description || 'No context provided'}.

      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "title": "A compelling title",
        "intro": "A strong, engaging opening paragraph summarizing the event (approx 60-80 words).",
        "content": "The rest of the detailed historical analysis, including timelines (YEAR: Event), global significance, and 3 archival secrets. Use markdown formatting."
      }`;
  try {
    const raw = await groqRequest(prompt);
    const data = JSON.parse(extractJson(raw));
    res.json({
      title: data.title || title,
      intro: data.intro || '',
      content: data.content || '',
    });
  } catch (e) {
    fail(res, e);
  }
}

export async function currentAffairsHandler(_req, res) {
  const date = new Date();
  const dateStr = `${date.getMonth() + 1}-${date.getDate()}`;
  const prompt = `
      Identify 5 MAJOR historical events that happened on this day ($dateStr) in history.
      Focus on events with global impact or scientific significance.

      STRICT OUTPUT FORMAT (JSON ARRAY ONLY):
      [
        {
          "year": "YYYY",
          "title": "Event Title",
          "description": "2 sentence summary."
        }
      ]`;
  try {
    const raw = await groqRequest(prompt);
    const list = JSON.parse(extractJson(raw));
    res.json(
      list.map((e) => ({
        year: String(e.year ?? '????'),
        title: String(e.title ?? 'Unknown Event'),
        description: String(e.description ?? ''),
      })),
    );
  } catch (e) {
    fail(res, e);
  }
}

export async function discoverHandler(req, res) {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query required' });
  const prompt = `
      User Query: "${query}"
      If valid history, return JSON:
      {
        "title": "Clear Title",
        "description": "Brief summary",
        "date": "YYYY-MM-DD"
      }`;
  try {
    const raw = await groqRequest(prompt, 0.3);
    const data = JSON.parse(extractJson(raw));
    const safeTitle = encodeURIComponent(data.title || query);
    res.json({
      title: data.title || 'Unknown',
      description: data.description || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      image_url: `https://loremflickr.com/800/600/history,${safeTitle}`,
    });
  } catch (e) {
    fail(res, e);
  }
}

export function healthHandler(_req, res) {
  const key = process.env.GROQ_API_KEY;
  res.json({ ok: true, groqKeyConfigured: Boolean(key && !key.startsWith('gsk_YOUR')) });
}
