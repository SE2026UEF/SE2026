const COC_API_BASE = "https://api.clashofclans.com/v1";

export type Achievement = {
  name: string;
  stars: number;
  value: number;
  target: number;
  info: string;
  village: "home" | "builderBase";
};

export type UnitItem = {
  name: string;
  level: number;
  maxLevel: number;
  village?: "home" | "builderBase";
};

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
  heroes: UnitItem[];
  troops: UnitItem[];
  spells: UnitItem[];
  achievements: Achievement[];
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
      .filter((h: { village?: string }) => h.village === "home")
      .map((h: { name: string; level: number; maxLevel: number; village?: string }) => ({
        name: h.name,
        level: h.level,
        maxLevel: h.maxLevel,
        village: h.village === "builderBase" ? "builderBase" : "home",
      })),
    troops: (body.troops ?? [])
      .filter((t: { village?: string }) => t.village === "home")
      .map((t: { name: string; level: number; maxLevel: number; village?: string }) => ({
        name: t.name,
        level: t.level,
        maxLevel: t.maxLevel,
        village: t.village === "builderBase" ? "builderBase" : "home",
      })),
    spells: (body.spells ?? [])
      .map((s: { name: string; level: number; maxLevel: number; village?: string }) => ({
        name: s.name,
        level: s.level,
        maxLevel: s.maxLevel,
        village: s.village === "builderBase" ? "builderBase" : "home",
      })),
    achievements: (body.achievements ?? []).map(
      (a: {
        name: string;
        stars: number;
        value: number;
        target: number;
        info: string;
        village?: string;
      }) => ({
        name: a.name,
        stars: a.stars,
        value: a.value,
        target: a.target,
        info: a.info,
        village: a.village === "builderBase" ? "builderBase" : "home",
      }),
    ),
  };
}