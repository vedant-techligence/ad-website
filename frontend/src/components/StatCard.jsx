function StatCard({ label, value, helper, accent = "teal" }) {
  const accents = {
    teal: "from-teal-500/15 to-teal-50 text-teal-900",
    amber: "from-amber-500/15 to-amber-50 text-amber-900",
    slate: "from-slate-900/10 to-slate-50 text-slate-900",
    rose: "from-rose-500/15 to-rose-50 text-rose-900",
  };

  return (
    <div className={`rounded-[26px] border border-white/70 bg-gradient-to-br ${accents[accent]} p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-70">{label}</p>
      <p className="mt-4 font-display text-3xl">{value}</p>
      <p className="mt-2 text-sm opacity-80">{helper}</p>
    </div>
  );
}

export default StatCard;
