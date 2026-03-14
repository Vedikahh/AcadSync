import "./ConflictCard.css";

const SEVERITY_CONFIG = {
  high:   { label: "High",   cls: "severity-high"   },
  medium: { label: "Medium", cls: "severity-medium" },
  low:    { label: "Low",    cls: "severity-low"    },
};

export default function ConflictCard({ conflict }) {
  const sev = SEVERITY_CONFIG[conflict.severity] || SEVERITY_CONFIG.medium;

  return (
    <div className={`conflict-card ${sev.cls}`}>
      <div className="conflict-card-header">
        <span className="conflict-badge">{sev.label} Conflict</span>
        <span className="conflict-time">{conflict.date}</span>
      </div>

      <h4 className="conflict-event-name">{conflict.eventName}</h4>

      <div className="conflict-detail">
        <span className="conflict-label">Clashes with:</span>
        <span className="conflict-value">{conflict.clashWith}</span>
      </div>
      <div className="conflict-detail">
        <span className="conflict-label">Time overlap:</span>
        <span className="conflict-value">{conflict.timeOverlap}</span>
      </div>
      {conflict.venue && (
        <div className="conflict-detail">
          <span className="conflict-label">Venue:</span>
          <span className="conflict-value">{conflict.venue}</span>
        </div>
      )}
      {conflict.affectedStudents && (
        <div className="conflict-detail">
          <span className="conflict-label">Affected students:</span>
          <span className="conflict-value">~{conflict.affectedStudents}</span>
        </div>
      )}
    </div>
  );
}
