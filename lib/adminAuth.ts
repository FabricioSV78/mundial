import { createHash, timingSafeEqual } from "node:crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest();
}

export function isAdminTokenValid(token: string) {
  const configuredToken = process.env.ADMIN_SYNC_TOKEN;

  if (!configuredToken || !token) {
    return false;
  }

  return timingSafeEqual(hashToken(token), hashToken(configuredToken));
}

export function isAdminRequestAuthorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  return isAdminTokenValid(token);
}
