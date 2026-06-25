import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#00a8cc', '#0055cc', '#0a8d6b', '#a96413', '#b2294b', '#64748b', '#8b5cf6', '#ec4899'];

function InteractionStatsChart({ interactions }) {
  const data = useMemo(() => {
    if (!interactions || !interactions.questionsCategoryCount) return [];
    return Object.entries(interactions.questionsCategoryCount).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
  }, [interactions]);

  if (!interactions || data.length === 0) {
    return (
      <div className="feature-card feature-page-card feature-chart-card">
        <h2 className="feature-title">Interaction Stats</h2>
        <p>No data available.</p>
      </div>
    );
  }

  return (
    <div className="feature-card feature-page-card feature-chart-card">
      <p className="section-kicker">Conversations</p>
      <h2 className="feature-title">Questions by Category</h2>
      <div style={{ marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Average Success Rate: <strong>{interactions.avgSuccessRate.toFixed(1)}%</strong>
        </span>
      </div>
      <div className="feature-chart-wrap" style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "12px" }} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default InteractionStatsChart;
