// src/components/TemplateGallery.jsx
import React from "react";
import { TEMPLATES } from "../lib/templates";
import TemplateCard from "./TemplateCard";

export default function TemplateGallery({ onSelect }) {
  const local = TEMPLATES.filter((t) => t.category === "local");
  const accent = TEMPLATES.filter((t) => t.category === "accent");
  const minimal = TEMPLATES.filter((t) => t.category === "minimal");

  const rows = [
    { key: "local", title: "Print-Friendly (Localised)", templates: local },
    { key: "accent", title: "Colour Accent", templates: accent },
    { key: "minimal", title: "Clean Minimalist", templates: minimal },
  ];

  return (
    <div className="template-gallery" style={{ marginTop: 16 }}>
      {rows.map((r) => (
        <div key={r.key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#374151", fontWeight: 700, marginBottom: 10 }}>{r.title}</div>
          <div className="template-row" role={`template-row-${r.key}`}>
            {r.templates.map((t) => (
              <TemplateCard key={t.id} template={t} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
