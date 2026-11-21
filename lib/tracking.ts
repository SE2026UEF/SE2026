import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Village } from "@/lib/coc";

/**
 * Tallentaa kylän ja sen XP-tason. Uusi XP-rivi syntyy vain, jos taso on
 * muuttunut viimeisimmästä tallennuksesta, jotta jokainen haku ei luo
 * identtistä riviä. Player.updatedAt kertoo silti, milloin kylä nähtiin viimeksi.
 */
export async function saveVillage(village: Village) {
  const tag = village.tag.replace(/^#/, "");

  // Serializable estää sen, että kaksi samanaikaista hakua näkisivät saman
  // "viimeisimmän" rivin ja lisäisivät kumpikin uuden. Törmäyksessä MySQL
  // keskeyttää toisen transaktion (P2034), ja se yritetään uudelleen.
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.player.upsert({
            where: { tag },
            create: { tag, name: village.name },
            update: { name: village.name },
          });

          const latest = await tx.xpSnapshot.findFirst({
            where: { playerTag: tag },
            orderBy: { recordedAt: "desc" },
          });

          if (latest?.expLevel !== village.expLevel) {
            await tx.xpSnapshot.create({
              data: { playerTag: tag, expLevel: village.expLevel },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return;
    } catch (err) {
      const conflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!conflict || attempt >= 3) throw err;
    }
  }
}
