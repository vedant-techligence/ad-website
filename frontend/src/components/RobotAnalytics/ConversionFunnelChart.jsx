import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { compactNumber } from '../../utils/format';

function ConversionFunnelChart({ funnel }) {
  if (!funnel) {
    return (
      <div className="feature-card feature-page-card feature-chart-card">
        <h2 className="feature-title">Engagement Funnel</h2>
        <p>No data available.</p>
      </div>
    );
  }

  const data = [
    { name: 'Footfall', value: funnel.footfall },
    { name: 'Looking', value: funnel.peopleLooking },
    { name: 'Impressions', value: funnel.qualifiedImpressions },
    { name: 'Approaching', value: funnel.approaching },
    { name: 'Conversations', value: funnel.startingConversations },
    { name: 'Leads/Conversions', value: (funnel.qualifiedLeads || 0) + (funnel.purchases || 0) },
  ];

  const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#0f172a'];

  return (
    <div className="feature-card feature-page-card feature-chart-card">
      <p className="section-kicker">Audience Journey</p>
      <h2 className="feature-title">Engagement Funnel</h2>
      <div className="feature-chart-wrap" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#2a4a6a", fontSize: 12 }} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              formatter={(value) => compactNumber(value)}
              contentStyle={{ borderRadius: "12px" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ConversionFunnelChart;
