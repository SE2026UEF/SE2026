import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Yksi PrismaClient per prosessi. Dev-tilassa hot reload lataisi moduulin
// uudelleen ja avaisi joka kerta uuden yhteyspoolin, joten instanssi
// talletetaan globalThis-olioon.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL puuttuu .env-tiedostosta");
  }
  // Adapteri hyväksyy mysql://-osoitteen sellaisenaan.
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
