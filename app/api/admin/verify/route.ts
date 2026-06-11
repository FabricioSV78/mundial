import { NextResponse } from "next/server";
import { isAdminTokenValid } from "@/lib/adminAuth";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(buildRateLimitKey(request, "admin-verify"), {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Demasiados intentos admin. Espera un momento." },
      { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  return NextResponse.json({ ok: isAdminTokenValid(token) });
}
