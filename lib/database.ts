import { Pool } from "pg";
declare global { var _pool: Pool | undefined; }

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum diisi untuk koneksi PostgreSQL.");
  return new Pool({ connectionString, max: 10 });
}
export const pool = globalThis._pool ?? (globalThis._pool = createPool());

function postgresSql(sql: string) {
  let out = "", parameter = 0, quote = "";
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote && sql[i + 1] === quote) out += sql[++i];
      else if (ch === quote) quote = "";
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
    } else if (ch === "?") out += `$${++parameter}`;
    else out += ch;
  }
  return out;
}

let lastClose = 0;
async function closeExpired() {
  if (Date.now() - lastClose < 30000) return;
  lastClose = Date.now();
  try { await pool.query("UPDATE tasks SET status='closed' WHERE status='active' AND deadline<NOW()"); }
  catch (e) { console.error("Gagal menutup tugas yang melewati tenggat.", e); }
}

export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  await closeExpired();
  const result = await pool.query(postgresSql(sql), params);
  return result.rows as T[];
}
