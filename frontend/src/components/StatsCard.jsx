import "./StatsCard.css";

export default function StatsCard({ icon, value, label, color = "blue", trend, onClick }) {
  return (
    <div
      className={`stats-card stats-card-${color} ${onClick ? "stats-card-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stats-card-icon">{icon}</div>
      <div className="stats-card-body">
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-label">{label}</div>
        {trend !== undefined && (
          <div className={`stats-card-trend ${trend >= 0 ? "trend-up" : "trend-down"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% this week
          </div>
        )}
      </div>
    </div>
  );
}
