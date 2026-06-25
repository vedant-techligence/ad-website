import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "./adminPricing.css";

const PLACEMENT_GROUPS = {
  "Malls — Pune": {
    phoenix_marketcity_pune: "Phoenix Marketcity Pune",
    amanora_mall: "Amanora Mall",
    seasons_mall: "Seasons Mall",
    westend_mall: "Westend Mall",
    pavilion_mall: "Pavilion Mall",
    elpro_city_square: "Elpro City Square",
    the_pavillion: "The Pavillion",
  },
  "Hotels — Pune": {
    jw_marriott_pune: "JW Marriott Hotel Pune",
    conrad_pune: "Conrad Pune",
    ritz_carlton_pune: "The Ritz-Carlton, Pune",
    hyatt_regency_pune: "Hyatt Regency Pune",
    sheraton_grand_pune: "Sheraton Grand Pune Bund Garden Hotel",
    novotel_pune: "Novotel Pune Nagar Road",
    blue_diamond_pune: "Blue Diamond Pune",
  },
  "Other Locations": {
    hospital: "Hospital",
    metro: "Metro Station",
    airport: "Airport",
    other: "Other",
  },
};

function Field({ label, value, onChange, step = "1", hint }) {
  return (
    <div className="pricing-field">
      <label>{label}</label>
      <input type="number" step={step} min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="pricing-preview">{hint}</span>}
    </div>
  );
}

function AdminPricing() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/pricing").then((res) => setConfig(res.data)).catch(() => toast.error("Failed to load pricing."));
  }, []);

  const set = (field, val) => setConfig((prev) => ({ ...prev, [field]: val }));
  const setPlacement = (key, val) =>
    setConfig((prev) => ({ ...prev, placementMultipliers: { ...prev.placementMultipliers, [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/pricing", config);
      setConfig(res.data);
      toast.success("Pricing updated.");
    } catch {
      toast.error("Failed to save pricing.");
    } finally {
      setSaving(false);
    }
  };

  const preview = (mult) => {
    if (!config) return "—";
    const d = config.defaultDurationDays || 30;
    const r = config.defaultRepeatRate || 3;
    const base = d * r * config.baseRatePerDay * mult;
    const withFee = base + config.platformFee;
    const total = Math.round(withFee * (1 + config.gstRate));
    return `${d}d × ${r}x × ₹${config.baseRatePerDay} × ${mult} + fee + GST = ₹${total.toLocaleString("en-IN")}`;
  };

  if (!config) return <div className="pricing-loading">Loading pricing config...</div>;

  return (
    <div className="pricing-page">
      <div className="pricing-inner">
        <div className="pricing-header">
          <h2>Pricing Configuration</h2>
          <p>Changes apply immediately to all new campaign cost estimates.</p>
          {config.updatedBy && <p className="pricing-updated">Last updated by: {config.updatedBy}</p>}
        </div>

        <div className="pricing-formula-box">
          <p className="pricing-formula-title">How pricing is calculated</p>
          <code>
            Base Cost = Duration (days) × Repeat Rate (plays/day) × Base Rate Per Day (₹)<br />
            Adjusted  = Base Cost × Placement Multiplier<br />
            With Fee  = Adjusted Cost + Platform Fee<br />
            GST       = With Fee × GST Rate<br />
            <strong>Total = With Fee + GST</strong>
          </code>
          <p className="pricing-formula-example">
            Current defaults: {config.defaultDurationDays}d × {config.defaultRepeatRate}x × ₹{config.baseRatePerDay} =
            base ₹{(config.defaultDurationDays * config.defaultRepeatRate * config.baseRatePerDay).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="pricing-sections">
          <div className="pricing-group">
            <h3>Base Rates</h3>
            <div className="pricing-group-grid">
              <Field label="Base Rate Per Day (₹)" value={config.baseRatePerDay} step="1" onChange={(v) => set("baseRatePerDay", v)} />
              <Field label="Platform Fee (₹)" value={config.platformFee} step="1" onChange={(v) => set("platformFee", v)} />
              <Field label="GST Rate (e.g. 0.18 = 18%)" value={config.gstRate} step="0.01" onChange={(v) => set("gstRate", v)} />
            </div>
          </div>

          <div className="pricing-group">
            <h3>Campaign Defaults</h3>
            <div className="pricing-group-grid">
              <Field label="Default Duration (days)" value={config.defaultDurationDays} step="1" onChange={(v) => set("defaultDurationDays", v)} hint="Pre-filled when user creates a campaign" />
              <Field label="Default Repeat Rate (plays/day)" value={config.defaultRepeatRate} step="1" onChange={(v) => set("defaultRepeatRate", v)} hint="How many times per day the ad plays by default" />
              <Field label="Min Repeat Rate" value={config.minRepeatRate} step="1" onChange={(v) => set("minRepeatRate", v)} />
              <Field label="Max Repeat Rate" value={config.maxRepeatRate} step="1" onChange={(v) => set("maxRepeatRate", v)} />
            </div>
          </div>

          {Object.entries(PLACEMENT_GROUPS).map(([groupName, locations]) => (
            <div key={groupName} className="pricing-group">
              <h3>Placement — {groupName}</h3>
              <div className="pricing-group-grid">
                {Object.entries(locations).map(([key, label]) => {
                  const mult = config.placementMultipliers?.[key] ?? 1;
                  return (
                    <Field
                      key={key}
                      label={label}
                      value={mult}
                      step="0.1"
                      onChange={(v) => setPlacement(key, v)}
                      hint={preview(mult)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button className="pricing-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Pricing Config"}
        </button>
      </div>
    </div>
  );
}

export default AdminPricing;
