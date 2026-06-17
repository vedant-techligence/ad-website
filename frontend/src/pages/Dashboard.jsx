import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Dashboard</h2>
        <p>Welcome to your Ads Platform dashboard.</p>
        <p className="dashboard-copy">
          Launch campaigns, verify ad safety, and publish approved creatives to
          public robot displays.
        </p>
        <Link className="dashboard-link" to="/campaigns">
          Open Campaign Verification
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
