import { useState, useEffect } from "react";
import API from "../api/axios";
import "./Profile.css";

const INDUSTRIES = ["Technology", "Retail", "Healthcare", "Education", "Finance", "Food & Beverage", "Real Estate", "Entertainment", "Travel", "Other"];
const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Singapore", "Australia/Sydney"];

export default function Profile() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", businessName: "",
    industry: "", website: "", companySize: "",
    country: "", city: "", bio: "", linkedIn: "", twitter: "", timezone: "",
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    API.get("/auth/me")
      .then(({ data }) => {
        const u = data.user;
        setForm({
          name:         u.name         || "",
          email:        u.email        || "",
          phone:        u.phone        || "",
          businessName: u.businessName || "",
          industry:     u.industry     || "",
          website:      u.website      || "",
          companySize:  u.companySize  || "",
          country:      u.country      || "",
          city:         u.city         || "",
          bio:          u.bio          || "",
          linkedIn:     u.linkedIn     || "",
          twitter:      u.twitter      || "",
          timezone:     u.timezone     || "",
        });
      })
      .catch(() => setAlert({ type: "error", msg: "Failed to load profile." }))
      .finally(() => setLoading(false));
  }, []);

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      await API.put("/auth/profile", form);
      setAlert({ type: "success", msg: "Profile updated successfully." });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-page"><div className="profile-container">Loading...</div></div>;

  const initials = form.name ? form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-header-info">
            <h1>{form.name || "Your Profile"}</h1>
            <p>{form.email}</p>
            {form.businessName && <span className="profile-badge">{form.businessName}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Personal Info */}
          <div className="profile-card">
            <h2>Personal Information</h2>
            {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
            <div className="profile-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={set} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" value={form.email} disabled />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={set} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select name="timezone" value={form.timezone} onChange={set}>
                  <option value="">Select timezone</option>
                  {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>City</label>
                <input name="city" value={form.city} onChange={set} placeholder="Mumbai" />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input name="country" value={form.country} onChange={set} placeholder="India" />
              </div>
            </div>
            <div className="profile-grid full" style={{ marginTop: 20 }}>
              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" value={form.bio} onChange={set} placeholder="Tell us a little about yourself..." maxLength={300} />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="profile-card">
            <h2>Business Information</h2>
            <div className="profile-grid">
              <div className="form-group">
                <label>Business Name</label>
                <input name="businessName" value={form.businessName} onChange={set} placeholder="Techligence Ads" />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select name="industry" value={form.industry} onChange={set}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select name="companySize" value={form.companySize} onChange={set}>
                  <option value="">Select size</option>
                  {["1-10","11-50","51-200","201-500","500+"].map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Website</label>
                <input name="website" value={form.website} onChange={set} placeholder="https://yourcompany.com" />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input name="linkedIn" value={form.linkedIn} onChange={set} placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div className="form-group">
                <label>Twitter / X</label>
                <input name="twitter" value={form.twitter} onChange={set} placeholder="https://twitter.com/yourhandle" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
