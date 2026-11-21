// Testidata: keksitty XP-historia oletuskylälle #JRCL00VU (noin vuosi taaksepäin).
// Viimeinen seed-piste (268) on tarkoituksella oikeaa nykytasoa alempi, jotta
// seuraava haku sovelluksessa tallentaa oikean tason historian jatkoksi.
//
// Aja: npx prisma db seed   (ajetaan myös automaattisesti `prisma migrate reset` -komennon jälkeen)
// HUOM: poistaa ensin kylän kaikki aiemmat rivit, myös sovelluksen tallentamat.
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
    },
  });
  console.log(`Seedattu ${NAME} (#${TAG}), ${XP_HISTORY.length} XP-riviä`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
