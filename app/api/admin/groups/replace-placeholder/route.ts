import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { replacePlaceholderTeam } from "@/lib/tournament/officialGroupsService";

const schema = z.object({
  placeholderTeamId: z.string().min(1),
  realTeamId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Datos invalidos." }, { status: 400 });
    }

    const result = await replacePlaceholderTeam(parsed.data.placeholderTeamId, parsed.data.realTeamId);

    return NextResponse.json({
      ok: true,
      message: "Placeholder reemplazado sin borrar historial.",
      result,
    });
  } catch (error) {
    console.error("[admin/groups/replace-placeholder] failed", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo reemplazar el placeholder." },
      { status: 500 },
    );
  }
}
