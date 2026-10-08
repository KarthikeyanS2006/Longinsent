import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from 'dotenv';

config();

const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const csvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../historical_vault_data.csv');
const text = readFileSync(csvPath, 'utf8');
const lines = text.trim().split(/\r?\n/);

function parseLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      cells.push(cur);
      cur = '';
    } else cur += c;
  }
  cells.push(cur);
  return cells;
}

const rows = lines
  .slice(1)
  .map((line) => {
    const cells = parseLine(line);
    return {
      title: cells[0]?.trim(),
      description: cells[1]?.trim(),
      incident_date: cells[2]?.trim() || null,
    };
  })
  .filter((r) => r.title);

console.log(`Seeding ${rows.length} incidents from ${csvPath} ...`);

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

const existingRes = await fetch(`${url}/rest/v1/incidents?select=title`, { headers });
if (!existingRes.ok) {
  console.error(`Read failed (${existingRes.status}): ${await existingRes.text()}`);
  process.exit(1);
}
const existing = new Set((await existingRes.json()).map((r) => r.title));
const fresh = rows.filter((r) => !existing.has(r.title));
if (!fresh.length) {
  console.log('OK - vault already seeded, nothing to add.');
  process.exit(0);
}

const res = await fetch(`${url}/rest/v1/incidents`, {
  method: 'POST',
  headers: {
    ...headers,
    Prefer: 'return=representation',
  },
  body: JSON.stringify(fresh),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Seed failed (${res.status}): ${body}`);
  process.exit(1);
}
const inserted = JSON.parse(body);
console.log(`OK - ${inserted.length} rows in vault (duplicates skipped on re-run).`);
