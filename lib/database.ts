import mysql from "mysql2/promise";
declare global { var _pool: mysql.Pool | undefined; }

function createPool(): mysql.Pool {
  if (process.env.DATABASE_URL) return mysql.createPool(process.env.DATABASE_URL);
  return mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 10 });
}
export const pool: mysql.Pool = globalThis._pool ?? (globalThis._pool = createPool());

// Selalu prepared statement: query("SELECT ... WHERE id = ?", [id])
let lastClose = 0;
/** Tugas otomatis berstatus 'closed' setelah deadline lewat (dicek paling sering tiap 30 detik). */
async function closeExpired() {
  if (Date.now() - lastClose < 30000) return;
  lastClose = Date.now();
  try { await pool.execute("UPDATE tasks SET status='closed' WHERE status='active' AND deadline<NOW()"); }
  catch (e) { console.error("Gagal menutup tugas yang melewati tenggat.", e); }
}

export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  await closeExpired();
  const [rows] = await pool.execute(sql, params as any);
  return rows as T[];
}
