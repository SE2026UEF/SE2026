"use client";

import { useEffect, useRef, useState } from "react";
import type { Village } from "@/lib/coc";
import XpChart, { type XpPoint } from "./XpChart";

const DEFAULT_TAG = "#JRCL00VU";

export default function Home() {
  const [tag, setTag] = useState(DEFAULT_TAG);
  const [village, setVillage] = useState<Village | null>(null);
  const [history, setHistory] = useState<XpPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [armyTab, setArmyTab] = useState<"heroes" | "troops" | "spells">("heroes");
  const [showAllAchievements, setShowAllAchievements] = useState(false);

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
    try {
      const res = await fetch(`/api/player/${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Haku epäonnistui");
        setVillage(null);
        return;
      }
      setVillage(data);

      const histRes = await fetch(`/api/player/${encodeURIComponent(cleaned)}/xp-history`);
      if (histRes.ok) {
        setHistory((await histRes.json()).history);
      } else {
        setHistory(null);
      }
    } catch {
      setError("Palvelimeen ei saatu yhteyttä");
    } finally {
      setLoading(false);
    }
  }

  const visibleAchievements =
    village?.achievements?.filter((ach) => (showAllAchievements ? true : ach.stars < 3)) ?? [];

  const completedAchievementsCount =
    village?.achievements?.filter((ach) => ach.stars >= 3).length ?? 0;

  const currentUnits =
    armyTab === "heroes"
      ? village?.heroes ?? []
      : armyTab === "troops"
      ? village?.troops?.filter((t) => t.village === "home") ?? []
      : village?.spells ?? [];

  const maxedUnitsCount = currentUnits.filter((u) => u.level === u.maxLevel).length;

  return (
    <main className="page-wrapper">
      <header className="topbar">
        <div>
          <div className="badge-pill">Clash of Clans Stats</div>
          <h1 className="page-title">Clash of Clans Tracker</h1>
        </div>

        <form onSubmit={search} className="search-form">
          <label htmlFor="tag" className="sr-only">
            Kylän tagi
          </label>
          <input
            id="tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="#ABC123"
            className="search-input"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Haetaan…" : "Hae"}
          </button>
        </form>
      </header>

      {error && (
        <div role="alert" className="error-box">
          {error}
        </div>
      )}

      {village && (
        <>
          {/* YLÄPALKKI */}
          <section className="hero-card">
            <div>
              <div className="player-identity">
                <h2 className="player-name">{village.name}</h2>
                <span className="tag-chip">{village.tag}</span>
                {village.league && <span className="league-chip">{village.league}</span>}
              </div>
              <p className="clan-line">
                {village.clan ? (
                  <>
                    Klaani: <strong>{village.clan.name}</strong> ({village.clan.tag}) • Taso{" "}
                    {village.clan.level}
                    {village.role ? ` • Rooli: ${village.role}` : ""}
                  </>
                ) : (
                  "Ei klaania"
                )}
              </p>
            </div>

            <div className="hero-stats">
              <div className="stat-tile">
                <div className="stat-label">Town Hall</div>
                <div className="stat-value amber">TH {village.townHallLevel}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Kokemus</div>
                <div className="stat-value sky">Lv. {village.expLevel}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Pokaalit</div>
                <div className="stat-value">{village.trophies}</div>
                <div className="stat-sub">Ennätys {village.bestTrophies}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Sotatähdet</div>
                <div className="stat-value amber">★ {village.warStars}</div>
              </div>
            </div>
          </section>

          {/* KOLME LAATIKKOA */}
          <div className="three-col-grid">
            {/* 1. SAAVUTUKSET */}
            <section className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Saavutukset</h3>
                  {village.achievements && village.achievements.length > 0 && (
                    <p className="panel-subtitle">
                      3 tähden saavutuksia: {completedAchievementsCount} / {village.achievements.length}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllAchievements(!showAllAchievements)}
                  className="btn-secondary"
                >
                  {showAllAchievements ? "Vain kesken" : "Näytä kaikki"}
                </button>
              </div>

              {visibleAchievements.length > 0 ? (
                <ul className="scroll-list">
                  {visibleAchievements.map((ach, idx) => {
                    const pct =
                      ach.target > 0
                        ? Math.min(100, Math.round((ach.value / ach.target) * 100))
                        : 100;

                    return (
                      <li
                        key={`${ach.village}-${ach.name}-${ach.target}-${idx}`}
                        className="achievement-item"
                      >
                        <div className="achievement-top">
                          <span className="achievement-name">{ach.name}</span>
                          <span className="stars">
                            {"★".repeat(ach.stars)}
                            <span className="stars-empty">{"☆".repeat(3 - ach.stars)}</span>
                          </span>
                        </div>
                        <p className="achievement-info">{ach.info}</p>
                        <div className="progress-meta">
                          <span>{ach.village === "builderBase" ? "Builder Base" : "Kotikylä"}</span>
                          <span>
                            {ach.value.toLocaleString("fi-FI")} / {ach.target.toLocaleString("fi-FI")} ({pct}%)
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${ach.stars >= 3 ? "done" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="muted-empty">Ei näytettäviä saavutuksia.</p>
              )}
            </section>

            {/* 2. ARMEIJA */}
            <section className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Armeija</h3>
                  <p className="panel-subtitle">
                    Maksimitasolla: {maxedUnitsCount} / {currentUnits.length}
                  </p>
                </div>

                <div className="tab-group">
                  {(
                    [
                      ["heroes", "Sankarit"],
                      ["troops", "Joukot"],
                      ["spells", "Loitsut"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setArmyTab(key)}
                      className={`tab-btn ${armyTab === key ? "active" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {currentUnits.length > 0 ? (
                <ul className="unit-grid">
                  {currentUnits.map((unit, idx) => {
                    const isMax = unit.level === unit.maxLevel;
                    return (
                      <li
                        key={`${armyTab}-${unit.village ?? "home"}-${unit.name}-${idx}`}
                        className={`unit-item ${isMax ? "maxed" : ""}`}
                      >
                        <span className="unit-name" title={unit.name}>
                          {unit.name}
                        </span>
                        <span className="unit-level">
                          {unit.level}/{unit.maxLevel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="muted-empty">Ei tietoja tässä kategoriassa.</p>
              )}
            </section>

            {/* 3. TILASTOT & XP-HISTORIA */}
            <section className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Kausitilastot & Kehitys</h3>
                  <p className="panel-subtitle">Taistelut, lahjoitukset ja XP-kehitys</p>
                </div>
              </div>

              <div className="stats-mini-grid">
                <div className="mini-stat">
                  <div className="mini-stat-label">Hyökkäysvoitot</div>
                  <div className="mini-stat-value">{village.attackWins}</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-label">Puolustusvoitot</div>
                  <div className="mini-stat-value">{village.defenseWins}</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-label">Lahjoitukset (annettu)</div>
                  <div className="mini-stat-value emerald">{village.donations}</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-label">Lahjoitukset (saatu)</div>
                  <div className="mini-stat-value">{village.donationsReceived}</div>
                </div>
              </div>

              {village.builderHallLevel !== null && (
                <div className="builder-banner">
                  <span>
                    <strong>Builder Base:</strong> BH {village.builderHallLevel}
                  </span>
                  {village.builderBaseTrophies !== null && (
                    <span>{village.builderBaseTrophies} pokaalia</span>
                  )}
                </div>
              )}

              {history && (
                <div className="chart-box">
                  <div className="chart-heading">XP-historia</div>
                  <div className="chart-frame">
                    <XpChart history={history} />
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}