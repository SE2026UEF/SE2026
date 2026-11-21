const COC_API_BASE = "https://api.clashofclans.com/v1";

/** Frontille palautettava, karsittu näkymä kylän tiedoista. */
export type Village = {
  tag: string;
  name: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  donations: number;
  donationsReceived: number;
  builderHallLevel: number | null;
  builderBaseTrophies: number | null;
  league: string | null;
  role: string | null;
  clan: { tag: string; name: string; level: number } | null;
  heroes: { name: string; level: number; maxLevel: number }[];
};

export class CocApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public reason?: string,
  ) {
    super(message);
  }
}

/** "#abc o12 " -> "ABC012". Palauttaa null, jos tagi ei ole kelvollinen. */
export function normalizeTag(input: string): string | null {
  const tag = input.trim().toUpperCase().replace(/^#/, "").replace(/O/g, "0");
  return /^[0-9A-Z]{3,12}$/.test(tag) ? tag : null;
}

export async function getVillage(tag: string): Promise<Village> {
  const token = process.env.COC_API_TOKEN;
  if (!token) {
    throw new CocApiError(500, "COC_API_TOKEN puuttuu .env-tiedostosta");
  }

  const res = await fetch(
    `${COC_API_BASE}/players/${encodeURIComponent(`#${tag}`)}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    },
  );

  // Virhevastaus voi olla myös ei-JSONia (esim. huoltokatko), joten parsitaan varoen.
  const body = await res.json().catch(() => null);

  if (!res.ok || !body) {
    throw new CocApiError(
      res.status,
      body?.message ?? body?.reason ?? `Clash of Clans API vastasi tilalla ${res.status}`,
      body?.reason,
    );
  }

  return {
    tag: body.tag,
    name: body.name,
    townHallLevel: body.townHallLevel,
    expLevel: body.expLevel,
    trophies: body.trophies,
    bestTrophies: body.bestTrophies,
    warStars: body.warStars,
    attackWins: body.attackWins,
    defenseWins: body.defenseWins,
    donations: body.donations,
    donationsReceived: body.donationsReceived,
    builderHallLevel: body.builderHallLevel ?? null,
    builderBaseTrophies: body.builderBaseTrophies ?? null,
    league: body.leagueTier?.name ?? body.league?.name ?? null,
    role: body.role ?? null,
    clan: body.clan
      ? { tag: body.clan.tag, name: body.clan.name, level: body.clan.clanLevel }
      : null,
    heroes: (body.heroes ?? [])
      .filter((h: { village: string }) => h.village === "home")
      .map((h: { name: string; level: number; maxLevel: number }) => ({
        name: h.name,
        level: h.level,
        maxLevel: h.maxLevel,
      })),
  };
}
