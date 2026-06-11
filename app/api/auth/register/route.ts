import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rateLimit";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(buildRateLimitKey(request, "auth-register"), {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, message: "Demasiados intentos. Vuelve a intentar en unos minutos." },
        { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Registro invalido." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: parsed.data.username }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Ese email o usuario ya existe." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        username: parsed.data.username,
        name: parsed.data.username,
        favoriteCountry: parsed.data.favoriteCountry,
        passwordHash: hashPassword(parsed.data.password),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Cuenta creada. Ya puedes iniciar sesion.",
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("[auth/register] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo registrar. Revisa la base de datos." },
      { status: 500 },
    );
  }
}
