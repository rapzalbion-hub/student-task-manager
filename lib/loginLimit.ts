import { createHash } from "crypto";
import { query } from "./database";

export const MAX_ATTEMPTS = 5;
const key = (role: string, id: string) => createHash("sha256").update(`${role}:${id.trim().toLowerCase()}`).digest("hex");

/** Menit tersisa jika identitas terkunci, 0 jika tidak. */
export async function lockedFor(role: string, id: string) {
  const [r] = await query<{ remaining_seconds: number; attempts: number }>(
    "SELECT attempts,GREATEST(0,TIMESTAMPDIFF(SECOND,NOW(3),DATE_ADD(window_started_at, INTERVAL 15 MINUTE))) remaining_seconds FROM login_attempts WHERE identity_hash=? AND window_started_at>=DATE_SUB(NOW(3), INTERVAL 15 MINUTE)",
    [key(role, id)],
  );
  if (!r || Number(r.attempts) < MAX_ATTEMPTS) return 0;
  return Math.max(1, Math.ceil(Number(r.remaining_seconds) / 60));
}

/** Catat gagal login; mengembalikan jumlah gagal dalam jendela waktu. */
export async function recordFail(role: string, id: string) {
  const k = key(role, id);
  await query(`INSERT INTO login_attempts (identity_hash,window_started_at,attempts) VALUES (?,NOW(3),1)
    ON DUPLICATE KEY UPDATE attempts=LEAST(${MAX_ATTEMPTS + 1},IF(window_started_at<DATE_SUB(NOW(3), INTERVAL 15 MINUTE),1,attempts+1)),
    window_started_at=IF(window_started_at<DATE_SUB(NOW(3), INTERVAL 15 MINUTE),NOW(3),window_started_at)`, [k]);
  await query("DELETE FROM login_attempts WHERE window_started_at<DATE_SUB(NOW(3), INTERVAL 1 DAY)");
  const [r] = await query<{ attempts: number }>(
    "SELECT attempts FROM login_attempts WHERE identity_hash=?", [k],
  );
  return Number(r.attempts);
}

export const clearFails = (role: string, id: string) =>
  query("DELETE FROM login_attempts WHERE identity_hash=?", [key(role, id)]);
