// src/components/TemplateCard.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";

export default function TemplateCard({ template, onSelect, selected = false }) {
  const { profile, updateProfile } = useUser();
  const [settingDefault, setSettingDefault] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sellerFromProfile = () => {
    const meta = (profile && profile.metadata) || {};
    return {
      sellerName: meta.sellerName || localStorage.getItem("sellerName") || "Seller Name",
      sellerLogoUrl: meta.sellerLogoUrl || localStorage.getItem("sellerLogoUrl") || "/favicon.ico",
      sellerPhone: meta.sellerPhone || localStorage.getItem("sellerPhone") || "",
      sellerEmail: meta.sellerEmail || localStorage.getItem("sellerEmail") || "",
      sellerAddress: meta.sellerAddress || localStorage.getItem("sellerAddress") || "",
      sellerTagline: meta.sellerTagline || localStorage.getItem("sellerTagline") || "",
    };
  };

  const handlePreview = () => {
    const seller = sellerFromProfile();
    const invoiceData = template.sampleData || {};
    // Include mode so listeners can decide how to show the preview (modal vs inline)
    window.dispatchEvent(
      new CustomEvent("template-preview", {
        detail: { template, mode: "preview", invoiceData, seller },
      })
    );
  };

  const handleUse = () => {
    // call onSelect with template id (gallery/app expects id)
    if (onSelect) onSelect(template.id);
    // broadcast a concise selected event (other listeners can react)
    window.dispatchEvent(
      new CustomEvent("template-selected", {
        detail: { templateId: template.id },
      })
    );
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

  const isSelected = !!selected;
  const borderStyle = isSelected
    ? "2px solid #16a34a"
    : hovered
    ? "2px solid #2563eb"
    : "1px solid #e5e7eb";

  return (
    <div
      className="template-card"
      role="group"
      aria-label={template.name}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePreview();
        }
      }}
      style={{
        position: "relative",
        border: borderStyle,
        borderRadius: 12,
        padding: 12,
        boxShadow: hovered ? "0 4px 10px rgba(37, 99, 235, 0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.25s ease-in-out",
        backgroundColor: "#fff",
        minWidth: 200,
      }}
    >
      {/* Selected check overlay */}
      {isSelected && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "#16a34a",
            color: "white",
            borderRadius: 18,
            padding: "4px 8px",
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 4px 10px rgba(22,163,74,0.15)",
            zIndex: 4,
          }}
        >
          ✓ Selected
        </div>
      )}

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
            objectFit: "cover",
            height: 120,
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

      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, minHeight: 40 }}>{template.description}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          className="btn-outline"
          onClick={handlePreview}
          aria-label={`Preview ${template.name}`}
          style={{ flex: 1 }}
        >
          Preview
        </button>
        <button className="btn-primary" onClick={handleUse} aria-label={`Use ${template.name}`} style={{ flex: 1 }}>
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
