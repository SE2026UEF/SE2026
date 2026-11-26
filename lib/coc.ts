const COC_API_BASE = "https://api.clashofclans.com/v1";

/** Unranked-liigan id. Liigan järjestysluku = id - LEAGUE_TIER_BASE_ID (0–36). */
export const LEAGUE_TIER_BASE_ID = 105000000;
/** Legend League III:n id. Tätä suuremmat id:t ovat Legend-liigoja. */
export const LEGEND_TIER_MIN_ID = 105000034;

/** Frontille palautettava, karsittu näkymä kylän tiedoista. */
export type Village = {
  tag: string;
  name: string;
  townHallLevel: number;
  expLevel: number;
  /** Ranked-liigoissa viikon turnauspokaalit, Legend-liigoissa Legend-pokaalit. */
  trophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  donations: number;
  donationsReceived: number;
  /** Ryöstetty Dark Elixir yhteensä (Heroic Heist -saavutuksen value). */
  darkElixirLooted: number | null;
  builderHallLevel: number | null;
  builderBaseTrophies: number | null;
  league: string | null;
  leagueTierId: number | null;
  isLegend: boolean;
  /** Paras liiga nykyisen liigan ja tallennetun/API:n liigahistorian perusteella. */
  bestLeague: string | null;
  role: string | null;
  clan: { tag: string; name: string; level: number } | null;
  heroes: { name: string; level: number; maxLevel: number }[];
};

/** Yksi rivi CoC API:n /players/{tag}/leaguehistory-vastauksesta. */
export type ApiLeagueSeason = {
  leagueSeasonId: number;
  leagueTrophies: number;
  leagueTierId: number;
  placement: number;
  attackWins: number;
  attackLosses: number;
  defenseWins: number;
  defenseLosses: number;
  defenseStars: number;
  maxBattles: number;
};

export type ApiLeagueTier = { id: number; name: string; iconUrl: string | null };

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

/** GET-pyyntö CoC API:in. Heittää CocApiErrorin, jos vastaus ei ole OK. */
async function cocFetch(path: string) {
  const token = process.env.COC_API_TOKEN;
  if (!token) {
    throw new CocApiError(500, "COC_API_TOKEN puuttuu .env-tiedostosta");
  }

  const res = await fetch(`${COC_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  // Virhevastaus voi olla myös ei-JSONia (esim. huoltokatko), joten parsitaan varoen.
  const body = await res.json().catch(() => null);

  if (!res.ok || !body) {
    throw new CocApiError(
      res.status,
      body?.message ?? body?.reason ?? `Clash of Clans API vastasi tilalla ${res.status}`,
      body?.reason,
    );
  }
  return body;
}

const playerPath = (tag: string) => `/players/${encodeURIComponent(`#${tag}`)}`;

export async function getVillage(tag: string): Promise<Village> {
  const body = await cocFetch(playerPath(tag));
  const leagueTierId: number | null = body.leagueTier?.id ?? null;

  return {
    tag: body.tag,
    name: body.name,
    townHallLevel: body.townHallLevel,
    expLevel: body.expLevel,
    trophies: body.trophies,
    warStars: body.warStars,
    attackWins: body.attackWins,
    defenseWins: body.defenseWins,
    donations: body.donations,
    donationsReceived: body.donationsReceived,
    darkElixirLooted: achievementValue(body.achievements, "Heroic Heist"),
    builderHallLevel: body.builderHallLevel ?? null,
    builderBaseTrophies: body.builderBaseTrophies ?? null,
    league: body.leagueTier?.name ?? null,
    leagueTierId,
    isLegend: leagueTierId !== null && leagueTierId >= LEGEND_TIER_MIN_ID,
    // Reitti tarkentaa tämän historian perusteella (ks. app/api/player/[tag]/route.ts).
    bestLeague: body.leagueTier?.name ?? null,
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

/** Saavutuksen laskurin arvo nimen perusteella (null, jos saavutusta ei löydy). */
function achievementValue(
  achievements: { name: string; value: number; village: string }[] | undefined,
  name: string,
): number | null {
  return achievements?.find((a) => a.name === name && a.village === "home")?.value ?? null;
}

/** Viimeisimmät viikkoturnausten tulokset (API palauttaa vain muutaman viikon). */
export async function getLeagueHistory(tag: string): Promise<ApiLeagueSeason[]> {
  const body = await cocFetch(`${playerPath(tag)}/leaguehistory`);
  return body.items ?? [];
}

// Liigatasot muuttuvat harvoin, joten ne haetaan kerran prosessia kohden.
let tierCache: Promise<ApiLeagueTier[]> | null = null;

export function getLeagueTiers(): Promise<ApiLeagueTier[]> {
  tierCache ??= cocFetch("/leaguetiers")
    .then((body) =>
      (body.items ?? []).map(
        (t: { id: number; name: string; iconUrls?: { small?: string } }) => ({
          id: t.id,
          name: t.name,
          iconUrl: t.iconUrls?.small ?? null,
        }),
      ),
    )
    .catch((err) => {
      tierCache = null; // epäonnistunutta hakua ei jätetä välimuistiin
      throw err;
    });
  return tierCache;
}
