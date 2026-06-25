import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "./PricingCalculator.css";

const PLACEMENTS = {
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

const today = new Date().toISOString().slice(0, 10);
const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function PricingCalculator() {
  const [pricing, setPricing] = useState(null);
  const [calc, setCalc] = useState({ placement: "phoenix_marketcity_pune", startDate: today, endDate: future, repeatRate: 3 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/pricing").then((res) => setPricing(res.data)).catch(() => {});
  }, []);

  const set = (field, value) => setCalc((prev) => ({ ...prev, [field]: value }));

  const handleCalculate = async () => {
    if (!calc.startDate || !calc.endDate || !calc.repeatRate) return;
    setLoading(true);
    try {
      const res = await api.post("/campaigns/estimate", {
        startDate: calc.startDate,
        endDate: calc.endDate,
        repeatRate: Number(calc.repeatRate),
        dailyBudgetCap: 0,
        placement: calc.placement,
      });
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getPlacementLabel = (key) => {
    for (const group of Object.values(PLACEMENTS)) {
      if (group[key]) return group[key];
    }
    return key;
  };

  const placementMult = pricing?.placementMultipliers?.[calc.placement] ?? "—";

  return (
    <div className="calc-page">
      <div className="calc-inner">
        <div className="calc-header">
          <p className="calc-eyebrow">Robot Advertising</p>
          <h1>Pricing Calculator</h1>
          <p className="calc-subtitle">
            Estimate your campaign cost before committing. All rates are live from our current pricing configuration.
          </p>
        </div>

        {pricing && (
          <div className="calc-rates-strip">
            <div className="calc-rate-item">
              <span className="calc-rate-val">{fmt(pricing.baseRatePerDay)}</span>
              <span className="calc-rate-label">Base rate / day</span>
            </div>
            <div className="calc-rate-item">
              <span className="calc-rate-val">{fmt(pricing.platformFee)}</span>
              <span className="calc-rate-label">Platform fee</span>
            </div>
            <div className="calc-rate-item">
              <span className="calc-rate-val">{(pricing.gstRate * 100).toFixed(0)}%</span>
              <span className="calc-rate-label">GST</span>
            </div>
            <div className="calc-rate-item">
              <span className="calc-rate-val">×{placementMult}</span>
              <span className="calc-rate-label">Location multiplier</span>
            </div>
          </div>
        )}

        <div className="calc-layout">
          <div className="calc-card">
            <h2>Configure your campaign</h2>

            <label className="calc-label">
              Robot Placement Location
              <select value={calc.placement} onChange={(e) => set("placement", e.target.value)}>
                {Object.entries(PLACEMENTS).map(([group, locs]) => (
                  <optgroup key={group} label={group}>
                    {Object.entries(locs).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}{pricing?.placementMultipliers?.[key] ? ` (×${pricing.placementMultipliers[key]})` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="calc-row">
              <label className="calc-label">
                Start Date
                <input type="date" value={calc.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </label>
              <label className="calc-label">
                End Date
                <input type="date" value={calc.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </label>
            </div>

            <label className="calc-label">
              Repeat Rate — plays per day
              <div className="calc-repeat-row">
                <input type="range" min="1" max="20" step="1" value={calc.repeatRate}
                  onChange={(e) => set("repeatRate", Number(e.target.value))} className="calc-slider" />
                <span className="calc-repeat-val">{calc.repeatRate}× / day</span>
              </div>
              <p className="calc-hint">Higher repeat rate = more impressions = higher cost</p>
            </label>

            {pricing && (
              <div className="calc-formula-preview">
                <p className="calc-formula-title">Pricing formula</p>
                <div className="calc-formula-steps">
                  <div className="calc-step"><span className="calc-step-num">1</span><span>Duration × Repeat Rate × {fmt(pricing.baseRatePerDay)}/day = Base Cost</span></div>
                  <div className="calc-step"><span className="calc-step-num">2</span><span>Base Cost × {getPlacementLabel(calc.placement)} multiplier (×{placementMult}) = Adjusted</span></div>
                  <div className="calc-step"><span className="calc-step-num">3</span><span>Adjusted + Platform Fee ({fmt(pricing.platformFee)}) = Subtotal</span></div>
                  <div className="calc-step"><span className="calc-step-num">4</span><span>Subtotal + GST ({(pricing.gstRate * 100).toFixed(0)}%) = <strong>Total</strong></span></div>
                </div>
              </div>
            )}

            <button className="calc-btn" onClick={handleCalculate} disabled={loading}>
              {loading ? "Calculating..." : "Calculate Cost"}
            </button>
          </div>

          {result ? (
            <div className="calc-result-card">
              <h2>Cost Breakdown</h2>
              <p className="calc-result-location">📍 {getPlacementLabel(calc.placement)}</p>

              <div className="calc-formula">
                <div className="calc-formula-row"><span>Campaign Duration</span><span>{result.durationDays} days</span></div>
                <div className="calc-formula-row"><span>Repeat Rate</span><span>{result.breakdown.repeatRate}× per day</span></div>
                <div className="calc-formula-row"><span>Base Rate Per Day</span><span>{fmt(result.breakdown.baseRatePerDay)}</span></div>
                <div className="calc-formula-divider">
                  <span className="calc-formula-eq">
                    {result.durationDays}d × {result.breakdown.repeatRate}x × {fmt(result.breakdown.baseRatePerDay)} = {fmt(result.breakdown.baseCost)}
                  </span>
                </div>
                <div className="calc-formula-row"><span>Base Cost</span><span>{fmt(result.breakdown.baseCost)}</span></div>
                <div className="calc-formula-row"><span>Location Multiplier</span><span>×{result.breakdown.placementMultiplier}</span></div>
                <div className="calc-formula-row calc-highlight"><span>Adjusted Cost</span><span>{fmt(result.breakdown.adjustedCost)}</span></div>
                <div className="calc-formula-row"><span>Platform Fee</span><span>+{fmt(result.breakdown.platformFee)}</span></div>
                <div className="calc-formula-row"><span>GST (18%)</span><span>+{fmt(result.breakdown.gst)}</span></div>
                <div className="calc-formula-total"><span>Total Estimated Cost</span><span>{fmt(result.breakdown.estimatedCost)}</span></div>
                <div className="calc-formula-row calc-daily"><span>Average Daily Cost</span><span>{fmt(result.avgDailyCost)}</span></div>
              </div>

              {result.budgetWarning && <p className="calc-warning">{result.budgetWarning}</p>}
              <Link to="/campaigns" className="calc-cta">Create Campaign →</Link>
            </div>
          ) : (
            <div className="calc-result-card calc-result-empty">
              <div className="calc-empty-icon">₹</div>
              <h2>Your estimate will appear here</h2>
              <p>Configure your campaign and click Calculate Cost to see a full breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingCalculator;
