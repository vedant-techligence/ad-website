import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function HeatmapMock({ heatmapData }) {
  if (!heatmapData || heatmapData.length === 0) {
    return null; // hide if no data
  }

  // Formatting for a generic scatter plot to simulate a heatmap
  return (
    <div className="feature-card feature-page-card feature-chart-card">
      <p className="section-kicker">Location Data</p>
      <h2 className="feature-title">High-Footfall Areas</h2>
      <div className="feature-chart-wrap" style={{ height: '300px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="X Coord" hide />
            <YAxis type="number" dataKey="y" name="Y Coord" hide />
            <ZAxis type="number" dataKey="value" range={[100, 1000]} name="Density" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: "12px" }} />
            <Scatter name="Footfall" data={heatmapData} fill="#ff7300" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default HeatmapMock;
