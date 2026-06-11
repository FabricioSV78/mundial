import { randomBytes } from "node:crypto";

export function createInviteCode() {
  return randomBytes(4).toString("base64url").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
}
