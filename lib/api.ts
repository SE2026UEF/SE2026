import { NextResponse } from "next/server";
import { CocApiError } from "@/lib/coc";

/**
 * Muuttaa CoC API -kutsun virheen frontille sopivaksi JSON-vastaukseksi.
 * `notFoundMessage` näytetään, kun API vastaa 404 (esim. tagilla ei löydy mitään).
 */
export function cocErrorResponse(err: unknown, notFoundMessage: string) {
  if (err instanceof CocApiError) {
    const message =
      err.status === 404
        ? notFoundMessage
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
