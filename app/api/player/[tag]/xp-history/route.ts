import { NextResponse } from "next/server";
import { normalizeTag } from "@/lib/coc";
import { prisma } from "@/lib/prisma";

// GET /api/player/ABC123/xp-history — kylän tallennettu XP-historia vanhimmasta uusimpaan.
// Palauttaa tyhjän listan, jos kylää ei ole vielä tallennettu.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> },
) {
  const tag = normalizeTag((await params).tag);
  if (!tag) {
    return NextResponse.json({ error: "Virheellinen tagi" }, { status: 400 });
  }

  try {
    const history = await prisma.xpSnapshot.findMany({
      where: { playerTag: tag },
      orderBy: { recordedAt: "asc" },
      select: { expLevel: true, recordedAt: true },
    });
    return NextResponse.json({ tag: `#${tag}`, history });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "XP-historiaa ei saatu tietokannasta" },
      { status: 503 },
    );
  }
}
