import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/axios";
import Panel from "../components/Panel";
import DataTable from "../components/DataTable";
import { currency, percent } from "../utils/format";

function CompareCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState({ items: [], winner: null });

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/campaigns", { params: { limit: 20 } });
      setCampaigns(response.data.items);
    };

    load();
  }, []);

  const canCompare = selected.length >= 2;

  const compare = async () => {
    if (!canCompare) {
      toast.error("Select at least two campaigns.");
      return;
    }

    const response = await api.get("/campaigns/compare", {
      params: { campaignIds: selected.join(",") },
    });
    setComparison(response.data);
  };

  const selectedLookup = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="space-y-6">
      <Panel
        eyebrow="Campaign Comparison"
        title="Benchmark campaigns side by side"
        description="Compare health, spend, ROAS, CTR, sentiment, and conversions across your most important robot campaigns."
        action={(
          <button
            type="button"
            onClick={compare}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Run comparison
          </button>
        )}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <label
              key={campaign._id}
              className={`rounded-[24px] border p-4 transition ${
                selectedLookup.has(campaign._id)
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLookup.has(campaign._id)}
                onChange={() =>
                  setSelected((current) =>
                    current.includes(campaign._id)
                      ? current.filter((item) => item !== campaign._id)
                      : current.length >= 3
                        ? [...current.slice(1), campaign._id]
                        : [...current, campaign._id],
                  )
                }
                className="sr-only"
              />
              <p className="font-semibold text-slate-900">{campaign.title}</p>
              <p className="mt-1 text-sm text-slate-600">{campaign.brandName}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
                  Health {campaign.healthScore}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800">
                  {campaign.status}
                </span>
              </div>
            </label>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow="Comparison Results"
          title={comparison.winner ? `Winner: ${comparison.winner.title}` : "Awaiting selection"}
          description="Health, revenue efficiency, and response rates are pulled from the comparison API."
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison.items}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="healthScore" fill="#0f766e" radius={[10, 10, 0, 0]} />
                <Bar dataKey="roas" fill="#f97316" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          eyebrow="Detailed Table"
          title="Campaign benchmarks"
          description="Use this to compare spend efficiency and overall delivery quality."
        >
          <DataTable
            columns={[
              { key: "title", label: "Campaign" },
              { key: "healthScore", label: "Health" },
              { key: "ctr", label: "CTR", render: (row) => percent(row.ctr) },
              { key: "spend", label: "Spend", render: (row) => currency(row.spend) },
              { key: "roas", label: "ROAS" },
            ]}
            rows={comparison.items}
            emptyLabel="Select 2-3 campaigns, then run comparison."
          />
        </Panel>
      </div>
    </div>
  );
}

export default CompareCampaigns;
