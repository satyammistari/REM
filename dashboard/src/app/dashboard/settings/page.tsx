"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SDK_VERSION = "0.1.0";
const APP_VERSION = "0.1.0";

function InputRow({
  label,
  description,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
          {label}
        </div>
        {description && (
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {description}
          </div>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-64 px-3 py-1.5 rounded-[6px] text-[13px] outline-none transition-colors"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--violet)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real app, persist to localStorage or a context
    if (typeof window !== "undefined") {
      localStorage.setItem("rem_api_url", apiUrl);
      localStorage.setItem("rem_api_key", apiKey);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Configure connection and preferences for the REM dashboard.
        </p>
      </div>

      {/* Connection section */}
      <Card className="mb-4 p-0 overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Connection
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            API endpoint and authentication for the REM Go API.
          </p>
        </div>
        <div className="px-5">
          <InputRow
            label="API URL"
            description="Base URL for the REM Go API server."
            value={apiUrl}
            onChange={setApiUrl}
            placeholder="http://localhost:8080"
          />
          <InputRow
            label="API Key"
            description="Bearer token for authenticating requests."
            value={apiKey}
            onChange={setApiKey}
            type="password"
            placeholder="rem_sk_..."
          />
          <div className="py-4 flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
              style={{
                background: saved ? "rgba(34,197,94,0.15)" : "var(--violet)",
                color: saved ? "#4ade80" : "#fff",
                border: saved ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
              }}
            >
              {saved ? "Saved!" : "Save settings"}
            </button>
          </div>
        </div>
      </Card>

      {/* About section */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            About
          </h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label: "Dashboard version", value: `v${APP_VERSION}` },
            { label: "SDK version", value: `v${SDK_VERSION}` },
            { label: "API URL", value: apiUrl || "—" },
            {
              label: "Documentation",
              value: (
                <a
                  href="https://github.com/your-org/rem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--violet-light)" }}
                >
                  github.com/your-org/rem
                </a>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-[13px]">
              <span style={{ color: "var(--text-muted)" }}>{label}</span>
              <span style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
