import { randomInt } from "crypto";
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const rand = (n: number) => Array.from({ length: n }, () => A[randomInt(A.length)]).join("");
export const lecturerCode = () => "DSN-" + rand(6);
export function taskCode(courseName: string) {
  const w = courseName.trim().split(/\s+/).pop()!.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  return `TGS-${w}-${rand(4)}`;
}
