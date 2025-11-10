// src/components/TemplateCard.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

export default function TemplateCard({ template, onSelect }) {
  const { profile, updateProfile } = useUser();
  const [settingDefault, setSettingDefault] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handlePreview = () => {
    window.dispatchEvent(new CustomEvent("template-preview", { detail: template }));
  };

  const handleUse = () => {
    if (onSelect) onSelect(template);
    window.dispatchEvent(new CustomEvent("template-selected", { detail: template }));
  };

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try {
      const meta = (profile && profile.metadata) || {};
      const newMeta = { ...meta, default_invoice_template: template.id };
      const { data, error } = await updateProfile({ metadata: newMeta });
      if (error) alert("Failed to set default template: " + (error.message || JSON.stringify(error)));
      else alert(`${template.name} saved as your default invoice template.`);
    } catch (err) {
      console.error("setDefault error", err);
      alert("Failed to set default template.");
    } finally {
      setSettingDefault(false);
    }
  };

  return (
    <div
      className="template-card"
      role="group"
      aria-label={template.name}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: hovered ? "2px solid #2563eb" : "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        boxShadow: hovered ? "0 4px 10px rgba(37, 99, 235, 0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.25s ease-in-out",
        backgroundColor: "#fff",
      }}
    >
      {template.thumbnail ? (
        <img
          className="template-thumb"
          src={template.thumbnail}
          alt={`${template.name} thumbnail`}
          style={{
            width: "100%",
            borderRadius: 8,
            marginBottom: 10,
            border: "1px solid #f1f5f9",
          }}
        />
      ) : (
        <div
          className="template-thumb"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 120,
            background: "#f8fafc",
            borderRadius: 8,
            color: "#334155",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {template.category.toUpperCase()} • {template.name}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{template.name}</div>
        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{template.category}</div>
      </div>

      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, minHeight: 40 }}>
        {template.description}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          className="btn-outline"
          onClick={handlePreview}
          aria-label={`Preview ${template.name}`}
          style={{ flex: 1 }}
        >
          Preview
        </button>
        <button
          className="btn-primary"
          onClick={handleUse}
          aria-label={`Use ${template.name}`}
          style={{ flex: 1 }}
        >
          Use this
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          className="btn-pill"
          onClick={handleSetDefault}
          disabled={settingDefault}
          title="Save as your default invoice template"
          style={{
            background: settingDefault ? "#e2e8f0" : "#f1f5f9",
            color: "#334155",
            fontSize: 12,
            borderRadius: 20,
            padding: "4px 10px",
            border: "none",
            cursor: settingDefault ? "not-allowed" : "pointer",
          }}
        >
          {settingDefault ? "Saving..." : "Set default"}
        </button>
      </div>
    </div>
  );
}
