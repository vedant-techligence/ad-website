import { useEffect, useState } from "react";
import api from "../api/axios";
import RobotsMap from "../components/RobotsMap";
import "./FeaturePages.css";

function Geo() {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    let active = true;

    void api.get("/dashboard/geo").then((response) => {
      if (!active) {
        return;
      }

      setGeo(response.data);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!geo) {
    return (
      <div className="page-shell">
        <div className="page-width feature-card feature-page-card">
          <h2 className="feature-title">Loading geo analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Geo Analytics</p>
        <h1 className="feature-title">Robot location tracking</h1>
        <p className="feature-copy">
          Monitor live robot placement coverage, daily impression output, and route distribution across your deployment cities.
        </p>
      </section>

      <section className="page-width feature-grid-two">
        <div className="feature-card feature-page-card">
          <p className="section-kicker">Live Map</p>
          <h2 className="feature-title">Current robot locations</h2>
          <div className="feature-map-wrap">
            <RobotsMap robots={geo.items} />
          </div>
        </div>

        <div className="feature-card feature-page-card">
          <p className="section-kicker">City Summary</p>
          <h2 className="feature-title">Deployment by city</h2>
          <div className="feature-list">
            {(geo.byCity || []).map((city) => (
              <article key={city.city} className="feature-list-card">
                <div>
                  <h3>{city.city}</h3>
                  <p>{city.robotCount} robots deployed</p>
                </div>
                <div className="feature-chip-column">
                  <span>{city.impressions} impressions</span>
                  <span>{city.avgBattery}% avg battery</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-width feature-card feature-page-card">
        <p className="section-kicker">Robot Fleet</p>
        <h2 className="feature-title">Tracked robot units</h2>
        <div className="feature-list">
          {(geo.items || []).map((robot) => (
            <article key={robot.id} className="feature-list-card">
              <div>
                <h3>{robot.name}</h3>
                <p>{robot.city} • {robot.status}</p>
              </div>
              <div className="feature-chip-column">
                <span>Battery {robot.batteryLevel}%</span>
                <span>Network {robot.networkQuality}%</span>
                <span>Today {robot.todayImpressions} impressions</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Geo;
