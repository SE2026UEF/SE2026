import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health/db — testaa, että tietokantayhteys toimii.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Tietokantaan ei saatu yhteyttä" },
      { status: 503 },
    );
  }
}
