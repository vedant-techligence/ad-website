import React from 'react';
import { compactNumber } from '../../utils/format';

function LiveStatusWidget({ status }) {
  if (!status) {
    return (
      <div className="feature-card feature-page-card">
        <h2 className="feature-title">Live Robot Status</h2>
        <p>No live data available.</p>
      </div>
    );
  }

  const { crowdSize, density, robotHealth, currentAdDisplayed } = status;

  return (
    <div className="feature-card feature-page-card">
      <p className="section-kicker">Live Dashboard</p>
      <h2 className="feature-title">Robot Status</h2>
      <div className="feature-list" style={{ marginTop: '1rem' }}>
        <article className="feature-list-card">
          <div style={{ flex: 1 }}>
            <h3>Crowd Size</h3>
            <p>Live camera count</p>
          </div>
          <div className="feature-chip-column">
            <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#0a8d6b" }}>{compactNumber(crowdSize)}</span>
          </div>
        </article>
        
        <article className="feature-list-card">
          <div style={{ flex: 1 }}>
            <h3>Density</h3>
            <p>Crowd density estimation</p>
          </div>
          <div className="feature-chip-column">
            <span style={{ 
              background: density === 'High' ? "rgba(178,41,75,0.12)" : density === 'Medium' ? "rgba(198,126,16,0.14)" : "rgba(10,141,107,0.12)",
              color: density === 'High' ? "#9d2040" : density === 'Medium' ? "#8a4f08" : "#0a8d6b",
            }}>
              {density || 'Unknown'}
            </span>
          </div>
        </article>

        <article className="feature-list-card">
          <div style={{ flex: 1 }}>
            <h3>Currently Playing</h3>
            <p>Dynamic Ad Selected</p>
          </div>
          <div className="feature-chip-column">
            <span style={{ background: "rgba(0,168,204,0.1)", color: "#00556f" }}>{currentAdDisplayed || 'None'}</span>
          </div>
        </article>

        <article className="feature-list-card">
          <div style={{ flex: 1 }}>
            <h3>Robot Health</h3>
            <p>Battery & Connectivity</p>
          </div>
          <div className="feature-chip-column">
            <span style={{ color: robotHealth?.batteryLevel > 20 ? "#0a8d6b" : "#9d2040" }}>🔋 {robotHealth?.batteryLevel}%</span>
            <span style={{ color: robotHealth?.connectivityStatus === 'Online' ? "#0a8d6b" : "#9d2040" }}>📡 {robotHealth?.connectivityStatus}</span>
          </div>
        </article>
      </div>
    </div>
  );
}

export default LiveStatusWidget;
