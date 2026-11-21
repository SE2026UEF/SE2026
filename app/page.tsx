"use client";

import { useEffect, useRef, useState } from "react";
import type { Village } from "@/lib/coc";
import XpChart, { type XpPoint } from "./XpChart";

// Tagi, joka haetaan automaattisesti sivun latautuessa.
const DEFAULT_TAG = "#JRCL00VU";

export default function Home() {
  const [tag, setTag] = useState(DEFAULT_TAG);
  const [village, setVillage] = useState<Village | null>(null);
  const [history, setHistory] = useState<XpPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dev-tilassa React ajaa efektin kahdesti; ref estää tuplahaun
  // (ja sen, että kaksi samanaikaista tallennusta kilpailisi keskenään).
  const didAutoFetch = useRef(false);
  useEffect(() => {
    if (didAutoFetch.current) return;
    didAutoFetch.current = true;
    fetchVillage(DEFAULT_TAG);
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    fetchVillage(tag);
  }

  async function fetchVillage(input: string) {
    const cleaned = input.trim().replace(/^#/, "");
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setVillage(null);
    setHistory(null);
    try {
      const res = await fetch(`/api/player/${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Haku epäonnistui");
        return;
      }
      setVillage(data);

      // Historia haetaan vasta kylähaun jälkeen, jolloin juuri tallennettu
      // nykyinen taso on jo mukana. Epäonnistuminen ei kaada sivua.
      const histRes = await fetch(`/api/player/${encodeURIComponent(cleaned)}/xp-history`);
      if (histRes.ok) {
        setHistory((await histRes.json()).history);
      }
    } catch {
      setError("Palvelimeen ei saatu yhteyttä");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Clash of Clans Tracker</h1>

      <form onSubmit={search}>
        <label htmlFor="tag">Kylän tagi: </label>
        <input
          id="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#ABC123"
        />{" "}
        <button type="submit" disabled={loading}>
          {loading ? "Haetaan…" : "Hae"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {village && (
        <section>
          <h2>
            {village.name} ({village.tag})
          </h2>
          <ul>
            <li>Town Hall: {village.townHallLevel}</li>
            <li>Kokemustaso: {village.expLevel}</li>
            <li>
              Pokaalit: {village.trophies} (ennätys {village.bestTrophies})
            </li>
            {village.league && <li>Liiga: {village.league}</li>}
            <li>Sotatähdet: {village.warStars}</li>
            <li>
              Hyökkäysvoitot: {village.attackWins}, puolustusvoitot:{" "}
              {village.defenseWins}
            </li>
            <li>
              Lahjoitukset: {village.donations} annettu,{" "}
              {village.donationsReceived} saatu
            </li>
            {village.builderHallLevel !== null && (
              <li>
                Builder Hall: {village.builderHallLevel}
                {village.builderBaseTrophies !== null &&
                  ` (${village.builderBaseTrophies} pokaalia)`}
              </li>
            )}
            <li>
              Klaani:{" "}
              {village.clan
                ? `${village.clan.name} (${village.clan.tag}), taso ${village.clan.level}${village.role ? `, rooli: ${village.role}` : ""}`
                : "ei klaania"}
            </li>
          </ul>

          {village.heroes.length > 0 && (
            <>
              <h3>Sankarit</h3>
              <ul>
                {village.heroes.map((hero) => (
                  <li key={hero.name}>
                    {hero.name}: {hero.level} / {hero.maxLevel}
                  </li>
                ))}
              </ul>
            </>
          )}

          {history && (
            <>
              <h3>XP-historia</h3>
              <XpChart history={history} />
            </>
          )}
        </section>
      )}
    </main>
  );
}
