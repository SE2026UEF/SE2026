import { NextResponse } from "next/server";
import { LEAGUE_TIER_BASE_ID, normalizeTag } from "@/lib/coc";
import { prisma } from "@/lib/prisma";

// GET /api/player/ABC123/league-history — tallennetut viikkoturnaukset vanhimmasta uusimpaan.
// `tiers` sisältää kaikki tunnetut liigatasot kuvaajan akselin nimiä varten.
// `rank` on liigan järjestysluku: 0 = Unranked, 1–33 = ranked-liigat, 34–36 = Legend III–I.
// Palauttaa tyhjän historian, jos kylää ei ole vielä tallennettu.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> },
) {
  const tag = normalizeTag((await params).tag);
  if (!tag) {
    return NextResponse.json({ error: "Virheellinen tagi" }, { status: 400 });
  }

  try {
    const [rows, tiers] = await Promise.all([
      prisma.leagueSeasonResult.findMany({
        where: { playerTag: tag },
        orderBy: { seasonId: "asc" },
        include: { leagueTier: { select: { name: true } } },
      }),
      prisma.leagueTier.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      tag: `#${tag}`,
      tiers: tiers.map((t) => ({ rank: t.id - LEAGUE_TIER_BASE_ID, name: t.name })),
      history: rows.map((r) => ({
        seasonStart: new Date(r.seasonId * 1000).toISOString(),
        rank: r.leagueTierId - LEAGUE_TIER_BASE_ID,
        leagueName: r.leagueTier.name,
        leagueTrophies: r.leagueTrophies,
        placement: r.placement,
        attackWins: r.attackWins,
        attackLosses: r.attackLosses,
        defenseWins: r.defenseWins,
        defenseLosses: r.defenseLosses,
        maxBattles: r.maxBattles,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Liigahistoriaa ei saatu tietokannasta" },
      { status: 503 },
    );
  }
}
