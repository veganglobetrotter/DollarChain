export default function Sidebar({ activePanel, setActivePanel }) {
  const panels = ["Users", "Settings", "Posts", "Earnings"];
  return (
    <div>
      <h2>Super Admin Sidebar</h2>
      <ul>
        {panels.map((p) => (
          <li key={p}>
            <button
              style={{ fontWeight: activePanel === p ? "bold" : "normal" }}
              onClick={() => setActivePanel(p)}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
