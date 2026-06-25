import React from 'react';

function AIRecommendationsPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="feature-card feature-page-card">
        <h2 className="feature-title">AI Recommendations</h2>
        <p>No recommendations at this time.</p>
      </div>
    );
  }

  return (
    <div className="feature-card feature-page-card">
      <p className="section-kicker">AI Engine</p>
      <h2 className="feature-title">Optimization Insights</h2>
      <div className="feature-list" style={{ marginTop: '1rem' }}>
        {recommendations.map((rec, index) => (
          <article key={index} className="feature-list-card" style={{ borderLeft: `4px solid ${getColorForType(rec.type)}` }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', color: getColorForType(rec.type) }}>{rec.type}</h3>
              <p style={{ marginTop: '0.3rem', color: 'var(--text-primary)' }}>{rec.message}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function getColorForType(type) {
  switch (type) {
    case 'Alert': return '#b2294b';
    case 'Improvement': return '#a96413';
    case 'Optimization': return '#0a8d6b';
    default: return '#00a8cc';
  }
}

export default AIRecommendationsPanel;
