import { useState } from "react";
import { X } from "lucide-react";

const defaultForm = {
  title: "",
  brandName: "",
  robotPlacement: "",
  destinationUrl: "",
  description: "",
  callToAction: "",
  spokenWords: "",
  slideText: "",
  status: "active",
  budgetAllocated: 12000,
  budgetCurrency: "USD",
  startDate: "",
  endDate: "",
  audienceSegments: "Commuters, Shoppers",
  regions: "NCR, Delhi",
  devices: "QR, Touchscreen",
  channels: "Robot Display, Interactive Kiosk",
  tags: "brand, launch",
  city: "New Delhi",
  venue: "Central Lobby",
  lat: "28.6139",
  lng: "77.2090",
  goalImpressions: 150000,
  goalConversions: 1800,
  goalEngagementRate: 6.5,
};

function CampaignFormModal({ open, onClose, onSubmit, submitting, initialValues }) {
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [files, setFiles] = useState([]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form, files);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/60 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Campaign Management
            </p>
            <h3 className="mt-2 font-display text-3xl text-slate-900">
              {initialValues ? "Edit campaign" : "Create campaign"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Configure placements, budgets, audience, transcript, and creative metadata for robot delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Campaign title" name="title" value={form.title} onChange={handleChange} />
            <Field label="Brand name" name="brandName" value={form.brandName} onChange={handleChange} />
            <Field label="Robot placement" name="robotPlacement" value={form.robotPlacement} onChange={handleChange} />
            <Field label="Destination URL" name="destinationUrl" value={form.destinationUrl} onChange={handleChange} />
            <Field label="City" name="city" value={form.city} onChange={handleChange} />
            <Field label="Venue" name="venue" value={form.venue} onChange={handleChange} />
            <Field label="Latitude" name="lat" value={form.lat} onChange={handleChange} type="number" step="0.0001" />
            <Field label="Longitude" name="lng" value={form.lng} onChange={handleChange} type="number" step="0.0001" />
            <Field label="Status" name="status" value={form.status} onChange={handleChange} />
            <Field label="Budget allocated" name="budgetAllocated" value={form.budgetAllocated} onChange={handleChange} type="number" />
            <Field label="Budget currency" name="budgetCurrency" value={form.budgetCurrency} onChange={handleChange} />
            <Field label="Channels" name="channels" value={form.channels} onChange={handleChange} />
            <Field label="Audience segments" name="audienceSegments" value={form.audienceSegments} onChange={handleChange} />
            <Field label="Regions" name="regions" value={form.regions} onChange={handleChange} />
            <Field label="Devices" name="devices" value={form.devices} onChange={handleChange} />
            <Field label="Tags" name="tags" value={form.tags} onChange={handleChange} />
            <Field label="Start date" name="startDate" value={form.startDate} onChange={handleChange} type="date" />
            <Field label="End date" name="endDate" value={form.endDate} onChange={handleChange} type="date" />
            <Field label="Goal impressions" name="goalImpressions" value={form.goalImpressions} onChange={handleChange} type="number" />
            <Field label="Goal conversions" name="goalConversions" value={form.goalConversions} onChange={handleChange} type="number" />
            <Field label="Goal engagement %" name="goalEngagementRate" value={form.goalEngagementRate} onChange={handleChange} type="number" step="0.1" />
          </div>

          <TextArea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
          <TextArea
            label="Call to action"
            name="callToAction"
            value={form.callToAction}
            onChange={handleChange}
            rows={2}
          />
          <TextArea
            label="Spoken words"
            name="spokenWords"
            value={form.spokenWords}
            onChange={handleChange}
          />
          <TextArea
            label="Slide text"
            name="slideText"
            value={form.slideText}
            onChange={handleChange}
          />

          <label className="block rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-700">
            <span className="mb-2 block font-semibold text-slate-900">Creative files</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="block w-full text-sm text-slate-600"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Optional on edit. Upload images or videos for policy verification.
            </span>
          </label>

          {!!files.length && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <span
                  key={`${file.name}-${file.size}`}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                >
                  {file.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Saving..." : initialValues ? "Update campaign" : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function buildInitialForm(initialValues) {
  if (!initialValues) {
    return defaultForm;
  }

  return {
    ...defaultForm,
    ...initialValues,
    budgetAllocated: initialValues.budget?.allocated ?? defaultForm.budgetAllocated,
    budgetCurrency: initialValues.budget?.currency ?? defaultForm.budgetCurrency,
    startDate: initialValues.schedule?.startDate?.slice?.(0, 10) || "",
    endDate: initialValues.schedule?.endDate?.slice?.(0, 10) || "",
    audienceSegments: (initialValues.targeting?.audienceSegments || []).join(", "),
    regions: (initialValues.targeting?.regions || []).join(", "),
    devices: (initialValues.targeting?.devices || []).join(", "),
    channels: (initialValues.channels || []).join(", "),
    tags: (initialValues.tags || []).join(", "),
    city: initialValues.location?.city || "",
    venue: initialValues.location?.venue || "",
    lat: initialValues.location?.lat ?? defaultForm.lat,
    lng: initialValues.location?.lng ?? defaultForm.lng,
    goalImpressions: initialValues.performanceGoals?.impressions ?? defaultForm.goalImpressions,
    goalConversions: initialValues.performanceGoals?.conversions ?? defaultForm.goalConversions,
    goalEngagementRate:
      initialValues.performanceGoals?.engagementRate ?? defaultForm.goalEngagementRate,
  };
}

function Field({ label, name, value, onChange, type = "text", step }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function TextArea({ label, name, value, onChange, rows = 4 }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

export default CampaignFormModal;
