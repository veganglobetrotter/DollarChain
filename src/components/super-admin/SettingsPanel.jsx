// src/components/super-admin/SettingsPanel.jsx
import React from "react";

export default function SettingsPanel({ settings = {}, toggleShow7Day }) {
  return (
    <div>
      <h2>Settings</h2>

      <div>
        <label>
          <input
            type="checkbox"
            checked={!!settings["charts.show7DayMA"]}
            onChange={toggleShow7Day}
          />
          Show 7-day MA on charts
        </label>
      </div>

      {/* Add more settings controls here as needed */}
    </div>
  );
}
