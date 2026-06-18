import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Onboarding.css";

function Onboarding() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleFinish = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/onboarding", {
        businessName,
        industry,
        website,
      });
      setSession(response.data.token, response.data.user);
      toast.success("Workspace is ready.");
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {step === 1 ? (
          <>
            <div className="onboarding-illustration">
              <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
                <rect x="10" y="20" width="100" height="70" rx="6" fill="#e8f4f8" stroke="#00a8cc" strokeWidth="1.5" />
                <rect x="20" y="32" width="60" height="6" rx="3" fill="#00a8cc" opacity="0.4" />
                <rect x="20" y="44" width="45" height="4" rx="2" fill="#c0dce8" />
                <rect x="20" y="54" width="50" height="4" rx="2" fill="#c0dce8" />
                <rect x="20" y="64" width="38" height="4" rx="2" fill="#c0dce8" />
                <circle cx="130" cy="50" r="20" fill="#f0f9ff" stroke="#0055cc" strokeWidth="1.5" />
                <line x1="122" y1="50" x2="138" y2="50" stroke="#0055cc" strokeWidth="2" strokeLinecap="round" />
                <line x1="130" y1="42" x2="130" y2="58" stroke="#0055cc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="130" cy="85" r="12" fill="#00a8cc" opacity="0.15" />
                <ellipse cx="130" cy="85" rx="7" ry="7" fill="#00a8cc" opacity="0.3" />
              </svg>
            </div>
            <h2>Welcome to Ads Platform</h2>
            <p className="onboarding-subtitle">
              Finish your company setup and we will provision demo campaigns, reports,
              notifications, and geo analytics automatically.
            </p>
            <button className="onboarding-button" onClick={() => setStep(2)}>
              Next
            </button>
          </>
        ) : (
          <>
            <h2>Set Your Profile</h2>
            {error && <p className="onboarding-error">{error}</p>}
            <form onSubmit={handleFinish}>
              <label className="onboarding-label">Business Name</label>
              <input
                className="onboarding-input"
                type="text"
                placeholder="Business Name"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
              />
              <label className="onboarding-label">Industry</label>
              <select
                className="onboarding-input onboarding-select"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                required
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Advertising">Advertising</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
              <label className="onboarding-label">Website</label>
              <input
                className="onboarding-input"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
              <button className="onboarding-button" type="submit" disabled={submitting}>
                {submitting ? "Finishing..." : "Finish Setup"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
