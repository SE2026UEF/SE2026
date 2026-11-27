import { NextResponse } from "next/server";
import { cocErrorResponse } from "@/lib/api";
import { getClan, normalizeTag } from "@/lib/coc";

// GET /api/clan/2YVPG98C8  (tagi ilman #-merkkiä tai %23-enkoodattuna)
// Palauttaa klaanin perustiedot, sotatilastot, pääkaupungin ja jäsenlistan
// (ks. Clan-tyyppi tiedostossa lib/coc.ts). Klaania ei tallenneta tietokantaan.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> },
) {
  const tag = normalizeTag((await params).tag);
  if (!tag) {
    return NextResponse.json({ error: "Virheellinen tagi" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getClan(tag));
  } catch (err) {
    return cocErrorResponse(err, "Klaania ei löytynyt tällä tagilla");
  }
}
