import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getLeagueTiers, type ApiLeagueSeason, type Village } from "@/lib/coc";

/**
 * Tallentaa kylän, XP-tason, sotatähdet ja ryöstetyn Dark Elixirin määrän. Uusi
 * tilannekuvarivi syntyy vain, jos arvo on muuttunut viimeisimmästä
 * tallennuksesta, jotta jokainen haku ei luo identtistä riviä.
 * Player.updatedAt kertoo silti, milloin kylä nähtiin viimeksi.
 */
export async function saveVillage(village: Village) {
  const tag = village.tag.replace(/^#/, "");

  // Serializable estää sen, että kaksi samanaikaista hakua näkisivät saman
  // "viimeisimmän" rivin ja lisäisivät kumpikin uuden. Törmäyksessä MySQL
  // keskeyttää toisen transaktion (P2034), ja se yritetään uudelleen
  // satunnaisen viiveen jälkeen, jotta uusintayritykset eivät törmää taas.
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.player.upsert({
            where: { tag },
            create: { tag, name: village.name },
            update: { name: village.name },
          });

          // Jokaiselle seurattavalle arvolle: lisää rivi, jos arvo eroaa viimeisimmästä.
          const where = { playerTag: tag };
          const orderBy = { recordedAt: "desc" } as const;

          const xp = await tx.xpSnapshot.findFirst({ where, orderBy });
          if (xp?.expLevel !== village.expLevel) {
            await tx.xpSnapshot.create({ data: { ...where, expLevel: village.expLevel } });
          }

          const stars = await tx.warStarsSnapshot.findFirst({ where, orderBy });
          if (stars?.warStars !== village.warStars) {
            await tx.warStarsSnapshot.create({ data: { ...where, warStars: village.warStars } });
          }

          if (village.darkElixirLooted !== null) {
            const heist = await tx.heistSnapshot.findFirst({ where, orderBy });
            if (heist?.darkElixirLooted !== village.darkElixirLooted) {
              await tx.heistSnapshot.create({
                data: { ...where, darkElixirLooted: village.darkElixirLooted },
              });
            }
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return;
    } catch (err) {
      const conflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!conflict || attempt >= MAX_ATTEMPTS) throw err;
      await sleep(Math.random() * 50 * attempt);
    }
  }
}

const MAX_ATTEMPTS = 5;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tallentaa viikkoturnausten tulokset. Valmiin viikon tulos ei enää muutu,
 * joten jo tallennetut viikot ohitetaan (skipDuplicates = INSERT IGNORE).
 * Pääavain (playerTag, seasonId) estää tuplat myös samanaikaisissa hauissa.
 * Kutsu vasta saveVillagen jälkeen, koska rivit viittaavat players-tauluun.
 */
export async function saveLeagueHistory(tag: string, seasons: ApiLeagueSeason[]) {
  if (seasons.length === 0) return;

  await ensureLeagueTiers(seasons.map((s) => s.leagueTierId));

  await prisma.leagueSeasonResult.createMany({
    data: seasons.map((s) => ({
      playerTag: tag,
      seasonId: s.leagueSeasonId,
      leagueTierId: s.leagueTierId,
      leagueTrophies: s.leagueTrophies,
      placement: s.placement,
      attackWins: s.attackWins,
      attackLosses: s.attackLosses,
      defenseWins: s.defenseWins,
      defenseLosses: s.defenseLosses,
      defenseStars: s.defenseStars,
      maxBattles: s.maxBattles,
    })),
    skipDuplicates: true,
  });
}

/** Hakee liigatasot API:sta kantaan, jos jokin tarvittavista puuttuu. */
async function ensureLeagueTiers(ids: number[]) {
  const needed = [...new Set(ids)];
  const existing = await prisma.leagueTier.count({ where: { id: { in: needed } } });
  if (existing === needed.length) return;

  const tiers = await getLeagueTiers();
  await prisma.leagueTier.createMany({ data: tiers, skipDuplicates: true });
}

/** Paras (suurin id) liiga, jossa pelaaja on tallennetun historian mukaan ollut. */
export async function getBestStoredTierId(tag: string): Promise<number | null> {
  const result = await prisma.leagueSeasonResult.aggregate({
    where: { playerTag: tag },
    _max: { leagueTierId: true },
  });
  return result._max.leagueTierId;
}
