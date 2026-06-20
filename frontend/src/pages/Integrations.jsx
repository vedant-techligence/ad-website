import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "./FeaturePages.css";

const INTEGRATIONS = [
  {
    id: "rekognition",
    name: "AWS Rekognition",
    description: "Image/video label detection and content moderation using Amazon Rekognition.",
    endpoint: "/integrations/rekognition/analyze",
    icon: "👁️",
    color: "#FF9900",
    fields: [{ name: "imageUrl", label: "Image URL", placeholder: "https://example.com/image.jpg" }],
  },
  {
    id: "transcribe",
    name: "AWS Transcribe",
    description: "Automatic speech recognition for robot ad audio tracks using Amazon Transcribe.",
    endpoint: "/integrations/transcribe",
    icon: "🎙️",
    color: "#146EB4",
    fields: [{ name: "audioUrl", label: "Audio/Video URL", placeholder: "https://example.com/audio.mp4" }],
  },
  {
    id: "comprehend",
    name: "AWS Comprehend",
    description: "Natural language processing for sentiment detection in ad copy and transcripts.",
    endpoint: "/integrations/comprehend/sentiment",
    icon: "🧠",
    color: "#1A9C3E",
    fields: [{ name: "text", label: "Text to analyze", placeholder: "Enter ad copy or spoken words..." }],
  },
  {
    id: "whisper",
    name: "OpenAI Whisper",
    description: "High-accuracy transcription for robot ad voiceovers using OpenAI Whisper.",
    endpoint: "/integrations/whisper/transcribe",
    icon: "🤫",
    color: "#10a37f",
    fields: [{ name: "audioUrl", label: "Audio URL", placeholder: "https://example.com/voiceover.mp3" }],
  },
  {
    id: "video_moderation",
    name: "Video Moderation",
    description: "Frame-by-frame visual content moderation for campaign video assets before going live.",
    endpoint: "/integrations/video-moderation",
    icon: "🎬",
    color: "#b2294b",
    fields: [{ name: "videoUrl", label: "Video URL", placeholder: "https://example.com/campaign.mp4" }],
  },
];

function Integrations() {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState({});
  const [inputs, setInputs] = useState({});

  const handleInput = (integrationId, fieldName, value) => {
    setInputs((cur) => ({
      ...cur,
      [integrationId]: { ...(cur[integrationId] || {}), [fieldName]: value },
    }));
  };

  const handleTest = async (integration) => {
    setLoading((cur) => ({ ...cur, [integration.id]: true }));
    setResponses((cur) => ({ ...cur, [integration.id]: null }));
    try {
      const body = inputs[integration.id] || {};
      const response = await api.post(integration.endpoint, body);
      setResponses((cur) => ({ ...cur, [integration.id]: response.data }));
      toast.success(`${integration.name} mock response received.`);
    } catch (err) {
      const msg = err.response?.data?.message || "Request failed.";
      setResponses((cur) => ({ ...cur, [integration.id]: { error: msg } }));
      toast.error(`${integration.name}: ${msg}`);
    } finally {
      setLoading((cur) => ({ ...cur, [integration.id]: false }));
    }
  };

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">AI Integrations</p>
        <h1 className="feature-title">AWS &amp; OpenAI Mock Endpoints</h1>
        <p className="feature-copy">
          These endpoints simulate future AI/ML integrations for the robot ad platform.
          Rekognition, Transcribe, Comprehend, Whisper, and video moderation are live mock APIs
          — ready to be connected to real cloud credentials when available.
        </p>
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "14px", background: "rgba(198,126,16,0.1)", border: "1px solid rgba(198,126,16,0.2)", color: "#8a4f08", fontSize: "0.9rem" }}>
          ⚠️ All responses are mocked. No real AWS or OpenAI calls are made.
        </div>
      </section>

      <section className="page-width" style={{ marginTop: "1.25rem", display: "grid", gap: "1.3rem", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
        {INTEGRATIONS.map((integration) => (
          <div key={integration.id} className="feature-card feature-page-card">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "2rem", flexShrink: 0 }}>{integration.icon}</span>
              <div>
                <p className="section-kicker" style={{ color: integration.color }}>{integration.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>{integration.description}</p>
              </div>
            </div>

            <div style={{ borderRadius: "12px", background: "rgba(240,249,255,0.8)", padding: "0.6rem 0.85rem", marginBottom: "0.85rem" }}>
              <code style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>POST {integration.endpoint}</code>
            </div>

            {integration.fields.map((field) => (
              <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.75rem" }}>
                {field.label}
                <input
                  style={{ border: "1px solid rgba(0,85,204,0.1)", borderRadius: "14px", padding: "0.75rem 1rem", background: "rgba(248,252,255,0.96)", color: "var(--text-primary)", outline: "none" }}
                  placeholder={field.placeholder}
                  value={(inputs[integration.id] || {})[field.name] || ""}
                  onChange={(e) => handleInput(integration.id, field.name, e.target.value)}
                />
              </label>
            ))}

            <button
              type="button"
              onClick={() => handleTest(integration)}
              disabled={loading[integration.id]}
              style={{ border: "none", borderRadius: "14px", padding: "0.75rem 1.2rem", background: `linear-gradient(135deg, ${integration.color}cc, ${integration.color})`, color: "#fff", fontFamily: "var(--font-heading)", fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: loading[integration.id] ? "wait" : "pointer", opacity: loading[integration.id] ? 0.7 : 1, width: "100%" }}
            >
              {loading[integration.id] ? "Testing..." : `Test ${integration.name}`}
            </button>

            {responses[integration.id] && (
              <div style={{ marginTop: "0.85rem" }}>
                {responses[integration.id].error ? (
                  <p style={{ color: "var(--danger)", fontSize: "0.88rem" }}>Error: {responses[integration.id].error}</p>
                ) : (
                  <div style={{ borderRadius: "12px", background: "rgba(240,249,255,0.9)", border: "1px solid rgba(0,168,204,0.15)", padding: "0.85rem" }}>
                    <p style={{ fontFamily: "var(--font-heading)", color: "var(--accent-blue)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Mock Response</p>
                    <pre style={{ fontSize: "0.78rem", color: "var(--text-secondary)", overflow: "auto", maxHeight: "200px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {JSON.stringify(responses[integration.id], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default Integrations;
