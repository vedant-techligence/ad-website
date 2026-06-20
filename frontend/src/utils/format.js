export const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const compactNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

export const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const formatDate = (isoString, opts = {}) => {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: opts.dateStyle || "medium",
    ...opts,
  }).format(new Date(isoString));
};
