// src/components/TemplateCard.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

export default function TemplateCard({ template, onSelect }) {
  const { profile, updateProfile } = useUser();
  const [settingDefault, setSettingDefault] = useState(false);

  const handlePreview = () => {
    // let other parts of app (InvoicePreview.jsx) listen for this event
    window.dispatchEvent(new CustomEvent("template-preview", { detail: template }));
  };

  const handleUse = () => {
    if (onSelect) onSelect(template);
    // also dispatch a convenience event that other components can listen to
    window.dispatchEvent(new CustomEvent("template-selected", { detail: template }));
  };

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try {
      const meta = (profile && profile.metadata) || {};
      const newMeta = { ...meta, default_invoice_template: template.id };
      const { data, error } = await updateProfile({ metadata: newMeta });
      if (error) {
        alert("Failed to set default template: " + (error.message || JSON.stringify(error)));
      } else {
        alert(`${template.name} saved as your default invoice template.`);
      }
    } catch (err) {
      console.error("setDefault error", err);
      alert("Failed to set default template.");
    } finally {
      setSettingDefault(false);
    }
  };

  return (
    <div className="template-card" role="group" aria-label={template.name} tabIndex={0}>
      {/* thumbnail or placeholder */}
      {template.thumbnail ? (
        <img className="template-thumb" src={template.thumbnail} alt={`${template.name} thumbnail`} />
      ) : (
        <div className="template-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontWeight: 700 }}>
          {template.category.toUpperCase()} • {template.name}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{template.name}</div>
        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{template.category}</div>
      </div>

      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{template.description}</div>

      <div className="template-actions" style={{ marginTop: 10 }}>
        <button className="btn-outline" onClick={handlePreview} aria-label={`Preview ${template.name}`}>Preview</button>
        <button className="btn-primary" onClick={handleUse} aria-label={`Use ${template.name}`}>Use this</button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          className="btn-pill"
          onClick={handleSetDefault}
          disabled={settingDefault}
          title="Save as your default invoice template"
        >
          {settingDefault ? "Saving..." : "Set as default"}
        </button>
      </div>
    </div>
  );
}
