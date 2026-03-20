import "./StatsCard.css";

export default function StatsCard({ icon, value, label, color = "blue", trend, onClick }) {
  return (
    <div
      className={`stats-card stats-${color} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stats-content">
        <div className="stats-info">
          <span className="stats-label">{label}</span>
          <div className="stats-value">{value}</div>
        </div>
        {icon && (
          <div className="stats-icon-wrapper">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="stats-trend">
          <span className={trend >= 0 ? "trend-up" : "trend-down"}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="trend-text">vs last week</span>
        </div>
      )}
    </div>
  );
}
