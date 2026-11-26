// Testidata: keksitty XP-, Dark Elixir- ja sotatähtihistoria oletuskylälle #JRCL00VU
// (noin vuosi taaksepäin). Viimeiset seed-pisteet ovat tarkoituksella oikeita
// nykyarvoja pienempiä, jotta seuraava haku tallentaa oikeat arvot historian jatkoksi.
//
// Aja: npx prisma db seed   (ajetaan myös automaattisesti `prisma migrate reset` -komennon jälkeen)
// HUOM: poistaa ensin kylän kaikki aiemmat rivit, myös sovelluksen tallentamat
// (cascade poistaa myös liigahistorian; se tuodaan API:sta uudelleen seuraavalla haulla).
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

const TAG = "JRCL00VU";
const NAME = "Judo Sloth";

// [päivää sitten, XP-taso]
const XP_HISTORY: [number, number][] = [
  [365, 241],
  [330, 243],
  [300, 246],
  [270, 248],
  [240, 250],
  [210, 253],
  [180, 255],
  [150, 257],
  [120, 260],
  [90, 262],
  [60, 264],
  [30, 266],
  [7, 268],
];

// [päivää sitten, ryöstetty Dark Elixir yhteensä]. Viimeinen arvo on oikeaa
// nykyarvoa (n. 68,5 milj.) pienempi, jotta seuraava haku jatkaa historiaa.
const HEIST_HISTORY: [number, number][] = [
  [365, 55_120_000],
  [330, 56_340_000],
  [300, 57_410_000],
  [270, 58_250_000],
  [240, 59_480_000],
  [210, 60_730_000],
  [180, 61_690_000],
  [150, 62_880_000],
  [120, 64_010_000],
  [90, 65_120_000],
  [60, 66_350_000],
  [30, 67_420_000],
  [7, 68_210_000],
];

// [päivää sitten, sotatähdet yhteensä]. Viimeinen arvo on oikeaa nykyarvoa
// (n. 4094) pienempi, jotta seuraava haku jatkaa historiaa.
const WAR_STARS_HISTORY: [number, number][] = [
  [365, 3901],
  [330, 3918],
  [300, 3932],
  [270, 3950],
  [240, 3963],
  [210, 3981],
  [180, 3996],
  [150, 4012],
  [120, 4027],
  [90, 4043],
  [60, 4058],
  [30, 4074],
  [7, 4085],
];

async function main() {
  // Poistetaan vanhat SEED-testikylät, jos ne ovat yhä kannassa aiemmasta seedistä.
  await prisma.player.deleteMany({ where: { tag: { startsWith: "SEED" } } });

  // Cascade poistaa myös kylän XP-rivit, joten seedin voi ajaa monta kertaa.
  await prisma.player.deleteMany({ where: { tag: TAG } });
  await prisma.player.create({
    data: {
      tag: TAG,
      name: NAME,
      xpHistory: {
        create: XP_HISTORY.map(([days, expLevel]) => ({
          expLevel,
          recordedAt: daysAgo(days),
        })),
      },
      heistHistory: {
        create: HEIST_HISTORY.map(([days, darkElixirLooted]) => ({
          darkElixirLooted,
          recordedAt: daysAgo(days),
        })),
      },
      warStarsHistory: {
        create: WAR_STARS_HISTORY.map(([days, warStars]) => ({
          warStars,
          recordedAt: daysAgo(days),
        })),
      },
    },
  });
  console.log(
    `Seedattu ${NAME} (#${TAG}): ${XP_HISTORY.length} XP-riviä, ` +
      `${HEIST_HISTORY.length} Dark Elixir -riviä, ${WAR_STARS_HISTORY.length} sotatähtiriviä`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
