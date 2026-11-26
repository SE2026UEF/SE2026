import { NextResponse } from "next/server";
import {
  CocApiError,
  getLeagueHistory,
  getLeagueTiers,
  getVillage,
  normalizeTag,
  type ApiLeagueSeason,
  type Village,
} from "@/lib/coc";
import { getBestStoredTierId, saveLeagueHistory, saveVillage } from "@/lib/tracking";

// GET /api/player/ABC123  (tagi ilman #-merkkiä tai %23-enkoodattuna)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> },
) {
  const tag = normalizeTag((await params).tag);
  if (!tag) {
    return NextResponse.json({ error: "Virheellinen tagi" }, { status: 400 });
  }

  try {
    // Liigahistorian haun epäonnistuminen ei estä kylähakua.
    const [village, seasons] = await Promise.all([
      getVillage(tag),
      getLeagueHistory(tag).catch((err) => {
        console.error("Liigahistorian haku epäonnistui:", err);
        return [] as ApiLeagueSeason[];
      }),
    ]);

    // Tallennuksen epäonnistuminen (esim. tietokanta alhaalla) ei estä hakua.
    let bestStoredTierId: number | null = null;
    try {
      await saveVillage(village);
      await saveLeagueHistory(tag, seasons);
      bestStoredTierId = await getBestStoredTierId(tag);
    } catch (dbErr) {
      console.error("Kylän tallennus epäonnistui:", dbErr);
    }

    village.bestLeague = await resolveBestLeague(village, seasons, bestStoredTierId);
    return NextResponse.json(village);
  } catch (err) {
    if (err instanceof CocApiError) {
      const message =
        err.status === 404
          ? "Kylää ei löytynyt tällä tagilla"
          : err.status === 403
            ? `Clash of Clans API hylkäsi avaimen (${err.message}). Tarkista avain ja sen sallittu IP-osoite.`
            : err.message;
      return NextResponse.json({ error: message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Clash of Clans API:in ei saatu yhteyttä" },
      { status: 502 },
    );
  }
}

/**
 * Paras liiga = suurin liiga-id nykyisestä liigasta, API:n palauttamasta
 * historiasta ja kantaan tallennetusta historiasta (id:t ovat järjestyksessä).
 */
async function resolveBestLeague(
  village: Village,
  seasons: ApiLeagueSeason[],
  bestStoredTierId: number | null,
): Promise<string | null> {
  const ids = [village.leagueTierId, bestStoredTierId, ...seasons.map((s) => s.leagueTierId)]
    .filter((id): id is number => id !== null);
  if (ids.length === 0) return null;

  const bestId = Math.max(...ids);
  if (bestId === village.leagueTierId) return village.league;

  try {
    const tiers = await getLeagueTiers();
    return tiers.find((t) => t.id === bestId)?.name ?? village.league;
  } catch {
    return village.league;
  }
}
