export function sessionKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32 || secret.startsWith("REPLACE_WITH_")) return null;
  return new TextEncoder().encode(secret);
}
