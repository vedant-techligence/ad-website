import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const INDUSTRIES = ["Technology", "Advertising", "Retail", "Healthcare", "Education", "Other"];
const REPORT_FREQUENCIES = ["daily", "weekly", "monthly"];

function Profile() {
  const { user, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    businessName: user?.businessName || "",
    industry: user?.industry || "",
    website: user?.website || "",
    reportFrequency: user?.preferences?.reportFrequency || "weekly",
    healthAlertThreshold: user?.preferences?.healthAlertThreshold ?? 65,
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put("/auth/profile", {
        name: form.name,
        businessName: form.businessName,
        industry: form.industry,
        website: form.website,
        preferences: {
          reportFrequency: form.reportFrequency,
          healthAlertThreshold: Number(form.healthAlertThreshold),
        },
      });
      await refreshProfile();
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
        <h2>Your Profile</h2>
        <p className="profile-email">{user?.email}</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-section-title">Account</div>

          <div className="profile-field">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="Full Name" required />
          </div>

          <div className="profile-section-title">Business</div>

          <div className="profile-row">
            <div className="profile-field">
              <label>Business Name</label>
              <input type="text" value={form.businessName} onChange={set("businessName")} placeholder="Business Name" />
            </div>
            <div className="profile-field">
              <label>Industry</label>
              <select value={form.industry} onChange={set("industry")}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div className="profile-field">
            <label>Website</label>
            <input type="url" value={form.website} onChange={set("website")} placeholder="https://example.com" />
          </div>

          <div className="profile-section-title">Preferences</div>

          <div className="profile-row">
            <div className="profile-field">
              <label>Report Frequency</label>
              <select value={form.reportFrequency} onChange={set("reportFrequency")}>
                {REPORT_FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div className="profile-field">
              <label>Health Alert Threshold ({form.healthAlertThreshold})</label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.healthAlertThreshold}
                onChange={set("healthAlertThreshold")}
                className="profile-range"
              />
            </div>
          </div>

          <button type="submit" className="profile-button" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
