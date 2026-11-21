import { NextResponse } from "next/server";
import { CocApiError, getVillage, normalizeTag } from "@/lib/coc";
import { saveVillage } from "@/lib/tracking";

// GET /api/player/ABC123  (tagi ilman #-merkkiä tai %23-enkoodattuna)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag: string }> },
) {
  const tag = normalizeTag((await params).tag);
  if (!tag) {
    return NextResponse.json({ error: "Virheellinen tagi" }, { status: 400 });
  }

  try {
    const village = await getVillage(tag);

    // Tallennuksen epäonnistuminen (esim. tietokanta alhaalla) ei estä hakua.
    try {
      await saveVillage(village);
    } catch (dbErr) {
      console.error("Kylän tallennus epäonnistui:", dbErr);
    }

    return NextResponse.json(village);
  } catch (err) {
    if (err instanceof CocApiError) {
      const message =
        err.status === 404
          ? "Kylää ei löytynyt tällä tagilla"
          : err.status === 403
            ? `Clash of Clans API hylkäsi avaimen (${err.message}). Tarkista avain ja sen sallittu IP-osoite.`
            : err.message;
      return NextResponse.json({ error: message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Clash of Clans API:in ei saatu yhteyttä" },
      { status: 502 },
    );
  }
}
