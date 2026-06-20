import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import RobotsMap from "../components/RobotsMap";
import "./FeaturePages.css";

const STATUS_STYLES = {
  active:      { bg: "rgba(10,141,107,0.12)",  color: "#0a8d6b" },
  charging:    { bg: "rgba(198,126,16,0.14)",  color: "#8a4f08" },
  maintenance: { bg: "rgba(0,85,204,0.12)",    color: "#003a96" },
  offline:     { bg: "rgba(178,41,75,0.12)",   color: "#9d2040" },
};

function Geo() {
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    let active = true;
    void api.get("/dashboard/geo").then((response) => {
      if (!active) return;
      setGeo(response.data);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("Failed to load geo analytics.");
      setLoading(false);
      toast.error("Failed to load geo data.");
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-width feature-card feature-page-card">
          <h2 className="feature-title">Loading geo analytics...</h2>
        </div>
      </div>
    );
  }

  if (error || !geo) {
    return (
      <div className="page-shell">
        <div className="page-width feature-card feature-page-card">
          <p className="feature-error-box">{error || "No geo data available."}</p>
        </div>
      </div>
    );
  }

  const cities = ["all", ...new Set(geo.items.map((r) => r.city).filter(Boolean))];
  const filteredRobots = selectedCity === "all" ? geo.items : geo.items.filter((r) => r.city === selectedCity);

  const totalImpressions = geo.items.reduce((s, r) => s + (r.todayImpressions || 0), 0);
  const activeCount = geo.items.filter((r) => r.status === "active").length;
  const avgBattery = geo.items.length
    ? Math.round(geo.items.reduce((s, r) => s + (r.batteryLevel || 0), 0) / geo.items.length)
    : 0;

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Geo Analytics</p>
        <h1 className="feature-title">Robot Location Tracking</h1>
        <p className="feature-copy">
          Monitor live robot placement, daily impression output, battery levels, and
          route history across all deployment cities.
        </p>
      </section>

      {/* Summary metrics */}
      <section className="page-width feature-metrics-row" style={{ marginTop: "1.25rem" }}>
        <article className="feature-metric-card">
          <span>{geo.items.length}</span>
          <p>Total robots</p>
          <small>{activeCount} active now</small>
        </article>
        <article className="feature-metric-card">
          <span>{geo.byCity.length}</span>
          <p>Deployment cities</p>
          <small>{cities.length - 1} cities tracked</small>
        </article>
        <article className="feature-metric-card">
          <span>{totalImpressions.toLocaleString("en-IN")}</span>
          <p>Today's impressions</p>
          <small>Across entire fleet</small>
        </article>
        <article className="feature-metric-card">
          <span>{avgBattery}%</span>
          <p>Avg battery</p>
          <small>Fleet average</small>
        </article>
      </section>

      {/* City filter */}
      <section className="page-width" style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setSelectedCity(city)}
            className={`feature-tab-btn${selectedCity === city ? " active" : ""}`}
          >
            {city === "all" ? "All cities" : city}
          </button>
        ))}
      </section>

      <section className="page-width feature-grid-two">
        {/* Map */}
        <div className="feature-card feature-page-card">
          <p className="section-kicker">Live Map</p>
          <h2 className="feature-title">Current robot locations — {selectedCity === "all" ? "all cities" : selectedCity}</h2>
          <div className="feature-map-wrap">
            <RobotsMap robots={filteredRobots} />
          </div>
        </div>

        {/* City summary */}
        <div className="feature-card feature-page-card">
          <p className="section-kicker">City Summary</p>
          <h2 className="feature-title">Deployment by city</h2>
          <div className="feature-list">
            {geo.byCity.map((city) => (
              <article key={city.city} className="feature-list-card" style={{ cursor: "pointer" }} onClick={() => setSelectedCity(city.city === selectedCity ? "all" : city.city)}>
                <div style={{ flex: 1 }}>
                  <h3>{city.city}</h3>
                  <p>{city.robotCount} robot{city.robotCount !== 1 ? "s" : ""} deployed</p>
                </div>
                <div className="feature-chip-column">
                  <span>{city.impressions.toLocaleString("en-IN")} impressions</span>
                  <span>{city.avgBattery}% avg battery</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Robot fleet table */}
      <section className="page-width feature-card feature-page-card" style={{ marginTop: "1.3rem" }}>
        <p className="section-kicker">Robot Fleet</p>
        <h2 className="feature-title">Tracked units — {filteredRobots.length} robot{filteredRobots.length !== 1 ? "s" : ""}</h2>
        <div className="feature-list" style={{ marginTop: "1rem" }}>
          {filteredRobots.map((robot) => {
            const st = STATUS_STYLES[robot.status] || STATUS_STYLES.offline;
            return (
              <article key={robot.id} className="feature-list-card">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <h3>{robot.name}</h3>
                    <span style={{ padding: "0.25rem 0.65rem", borderRadius: "999px", fontFamily: "var(--font-heading)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", background: st.bg, color: st.color }}>
                      {robot.status}
                    </span>
                  </div>
                  <p>{robot.city} · Code: {robot.robotCode}</p>
                  {robot.currentLocation?.address && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{robot.currentLocation.address}</p>
                  )}
                </div>
                <div className="feature-chip-column">
                  <span>🔋 {robot.batteryLevel}%</span>
                  <span>📡 Network {robot.networkQuality}%</span>
                  <span>⬆️ Uptime {robot.uptimePct}%</span>
                  <span>👁️ {(robot.todayImpressions || 0).toLocaleString("en-IN")} today</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Geo;
