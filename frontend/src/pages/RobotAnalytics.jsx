import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LiveStatusWidget from "../components/RobotAnalytics/LiveStatusWidget";
import ConversionFunnelChart from "../components/RobotAnalytics/ConversionFunnelChart";
import InteractionStatsChart from "../components/RobotAnalytics/InteractionStatsChart";
import AIRecommendationsPanel from "../components/RobotAnalytics/AIRecommendationsPanel";
import HeatmapMock from "../components/RobotAnalytics/HeatmapMock";
import "./FeaturePages.css";

function RobotAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/robot-analytics/dashboard");
      setData(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load robot analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds for real-time-ish updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="page-shell">
        <div className="page-width feature-card feature-page-card">
          <h2 className="feature-title">Loading Robot Analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Hero */}
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Robot Engagement</p>
        <h1 className="feature-title">
          Live Robot Analytics
        </h1>
        <p className="feature-copy">
          Real-time audience monitoring, interaction funnel, and AI recommendations.
        </p>
      </section>

      <div className="page-width feature-grid-two" style={{ marginTop: "1.25rem", display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top Row: Live Status & Recommendations */}
        <div style={{ display: 'flex', gap: '1.25rem', flexDirection: 'row' }}>
          <div style={{ flex: 1 }}>
            <LiveStatusWidget status={data?.liveStatus} />
          </div>
          <div style={{ flex: 1 }}>
            <AIRecommendationsPanel recommendations={data?.aiRecommendations} />
          </div>
        </div>

        {/* Middle Row: Funnel & Interactions */}
        <div style={{ display: 'flex', gap: '1.25rem', flexDirection: 'row' }}>
          <div style={{ flex: 1 }}>
            <ConversionFunnelChart funnel={data?.funnel} />
          </div>
          <div style={{ flex: 1 }}>
            <InteractionStatsChart interactions={data?.interactions} />
          </div>
        </div>

        {/* Bottom Row: Heatmap */}
        <div>
          <HeatmapMock heatmapData={data?.heatmapData} />
        </div>

      </div>
    </div>
  );
}

export default RobotAnalytics;
