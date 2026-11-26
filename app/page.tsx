"use client";

import { useEffect, useRef, useState } from "react";
import type { Village } from "@/lib/coc";
import HistoryChart, { formatDate, type ChartPoint } from "./HistoryChart";

// Tagi, joka haetaan automaattisesti sivun latautuessa.
const DEFAULT_TAG = "#JRCL00VU";

type XpPoint = { expLevel: number; recordedAt: string };
type HeistPoint = { darkElixirLooted: number; recordedAt: string };
type WarStarsPoint = { warStars: number; recordedAt: string };

const formatNumber = (n: number) => n.toLocaleString("fi-FI");
/** 68485634 -> "68,5 milj." */
const formatCompact = (n: number) =>
  n.toLocaleString("fi-FI", { notation: "compact", maximumFractionDigits: 1 });

type LeagueSeason = {
  seasonStart: string;
  rank: number;
  leagueName: string;
  leagueTrophies: number;
  placement: number;
  attackWins: number;
  attackLosses: number;
  maxBattles: number;
};

type LeagueHistory = {
  tiers: { rank: number; name: string }[];
  history: LeagueSeason[];
};

/** "Electro League 31" -> "Electro 31", "Legend League I" -> "Legend I". */
const shortLeague = (name: string) => name.replace(" League", "");

export default function Home() {
  const [tag, setTag] = useState(DEFAULT_TAG);
  const [village, setVillage] = useState<Village | null>(null);
  const [xpHistory, setXpHistory] = useState<XpPoint[] | null>(null);
  const [heistHistory, setHeistHistory] = useState<HeistPoint[] | null>(null);
  const [warStarsHistory, setWarStarsHistory] = useState<WarStarsPoint[] | null>(null);
  const [leagueHistory, setLeagueHistory] = useState<LeagueHistory | null>(null);
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
    setXpHistory(null);
    setHeistHistory(null);
    setWarStarsHistory(null);
    setLeagueHistory(null);
    try {
      const base = `/api/player/${encodeURIComponent(cleaned)}`;
      const res = await fetch(base);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Haku epäonnistui");
        return;
      }
      setVillage(data);

      // Historiat haetaan vasta kylähaun jälkeen, jolloin juuri tallennetut
      // tiedot ovat jo mukana. Epäonnistuminen ei kaada sivua.
      const [xpRes, heistRes, warStarsRes, leagueRes] = await Promise.all([
        fetch(`${base}/xp-history`),
        fetch(`${base}/heist-history`),
        fetch(`${base}/war-stars-history`),
        fetch(`${base}/league-history`),
      ]);
      if (xpRes.ok) setXpHistory((await xpRes.json()).history);
      if (heistRes.ok) setHeistHistory((await heistRes.json()).history);
      if (warStarsRes.ok) setWarStarsHistory((await warStarsRes.json()).history);
      if (leagueRes.ok) setLeagueHistory(await leagueRes.json());
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
            {village.league && <li>Liiga: {village.league}</li>}
            <li>
              {village.isLegend ? "Pokaalit" : "Viikon pokaalit"}: {village.trophies}
            </li>
            {village.bestLeague && <li>Paras liiga: {village.bestLeague}</li>}
            <li>Sotatähdet: {village.warStars}</li>
            <li>
              Hyökkäysvoitot: {village.attackWins}, puolustusvoitot:{" "}
              {village.defenseWins}
            </li>
            <li>
              Lahjoitukset: {village.donations} annettu,{" "}
              {village.donationsReceived} saatu
            </li>
            {village.darkElixirLooted !== null && (
              <li>Ryöstetty Dark Elixir yhteensä: {formatNumber(village.darkElixirLooted)}</li>
            )}
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

          {xpHistory && (
            <>
              <h3>XP-historia</h3>
              <XpHistoryChart history={xpHistory} />
            </>
          )}

          {heistHistory && (
            <>
              <h3>Ryöstetty Dark Elixir</h3>
              <HeistHistoryChart history={heistHistory} />
            </>
          )}

          {warStarsHistory && (
            <>
              <h3>Sotatähdet</h3>
              <WarStarsHistoryChart history={warStarsHistory} />
            </>
          )}

          {leagueHistory && (
            <>
              <h3>Liigahistoria</h3>
              <LeagueHistoryChart data={leagueHistory} />
            </>
          )}
        </section>
      )}
    </main>
  );
}

function XpHistoryChart({ history }: { history: XpPoint[] }) {
  if (history.length === 0) return <p>Ei vielä tallennettua XP-historiaa.</p>;

  const points: ChartPoint[] = history.map((p) => {
    const date = new Date(p.recordedAt);
    return { date, value: p.expLevel, title: `${formatDate(date)}: XP-taso ${p.expLevel}` };
  });
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <HistoryChart
      points={points}
      ariaLabel={`XP-taso ${formatDate(first.date)}–${formatDate(last.date)}: ${first.value} → ${last.value}`}
    />
  );
}

function HeistHistoryChart({ history }: { history: HeistPoint[] }) {
  if (history.length === 0) return <p>Ei vielä tallennettua Dark Elixir -historiaa.</p>;

  // Vihjeessä myös kasvu edellisestä tallennuksesta.
  const points: ChartPoint[] = history.map((p, i) => {
    const date = new Date(p.recordedAt);
    const gain = i > 0 ? p.darkElixirLooted - history[i - 1].darkElixirLooted : null;
    return {
      date,
      value: p.darkElixirLooted,
      title:
        `${formatDate(date)}: ${formatNumber(p.darkElixirLooted)} Dark Elixir` +
        (gain !== null ? `\n+${formatNumber(gain)} edellisestä` : ""),
    };
  });
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <HistoryChart
      points={points}
      ariaLabel={`Ryöstetty Dark Elixir ${formatDate(first.date)}–${formatDate(last.date)}: ${formatNumber(first.value)} → ${formatNumber(last.value)}`}
      formatTick={formatCompact}
      marginLeft={72}
      marginRight={84}
    />
  );
}

function WarStarsHistoryChart({ history }: { history: WarStarsPoint[] }) {
  if (history.length === 0) return <p>Ei vielä tallennettua sotatähtien historiaa.</p>;

  // Vihjeessä myös kasvu edellisestä tallennuksesta.
  const points: ChartPoint[] = history.map((p, i) => {
    const date = new Date(p.recordedAt);
    const gain = i > 0 ? p.warStars - history[i - 1].warStars : null;
    return {
      date,
      value: p.warStars,
      title:
        `${formatDate(date)}: ${formatNumber(p.warStars)} sotatähteä` +
        (gain !== null ? `\n+${formatNumber(gain)} edellisestä` : ""),
    };
  });
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <HistoryChart
      points={points}
      ariaLabel={`Sotatähdet ${formatDate(first.date)}–${formatDate(last.date)}: ${first.value} → ${last.value}`}
      formatTick={formatNumber}
      marginLeft={48}
      marginRight={52}
    />
  );
}

function LeagueHistoryChart({ data }: { data: LeagueHistory }) {
  if (data.history.length === 0) return <p>Ei vielä tallennettua liigahistoriaa.</p>;

  const names = new Map(data.tiers.map((t) => [t.rank, shortLeague(t.name)]));

  const points: ChartPoint[] = data.history.map((s) => {
    const date = new Date(s.seasonStart);
    const used = s.attackWins + s.attackLosses;
    return {
      date,
      value: s.rank,
      title:
        `Viikko ${formatDate(date)}: ${s.leagueName}\n` +
        `Sijoitus ${s.placement}, ${s.leagueTrophies} pokaalia, hyökkäyksiä ${used}/${s.maxBattles}`,
    };
  });
  const first = data.history[0];
  const last = data.history[data.history.length - 1];

  return (
    <HistoryChart
      points={points}
      ariaLabel={`Liiga viikoittain ${formatDate(points[0].date)}–${formatDate(points[points.length - 1].date)}: ${first.leagueName} → ${last.leagueName}`}
      formatTick={(rank) => names.get(rank) ?? ""}
      tickCount={6}
      marginLeft={84}
      marginRight={72}
    />
  );
}
