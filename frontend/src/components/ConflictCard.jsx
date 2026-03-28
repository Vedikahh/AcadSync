import "./ConflictCard.css";
import { AlertTriangle } from "lucide-react";


const SEVERITY_CONFIG = {
  high:   { label: "High Risk",   cls: "severity-high"   },
  medium: { label: "Medium", cls: "severity-medium" },
  low:    { label: "Low",    cls: "severity-low"    },
};

export default function ConflictCard({ conflict }) {
  const sev = SEVERITY_CONFIG[conflict.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;

  return (
    <div className={`conflict-card ${sev.cls}`}>
      <div className="conflict-card-header">
        <div className="conflict-badge">
          <AlertTriangle size={20} className="conflict-badge-icon" style={{ marginRight: '6px' }} />
          {sev.label}
        </div>
        <span className="conflict-time">{conflict.date}</span>
      </div>

      <h4 className="conflict-event-name">{conflict.eventName}</h4>

      <div className="conflict-details-grid">
        <div className="conflict-detail">
          <span className="conflict-label">Clashes with</span>
          <span className="conflict-value conflict-highlight">{conflict.clashWith}</span>
        </div>
        <div className="conflict-detail">
          <span className="conflict-label">Overlap Time</span>
          <span className="conflict-value">{conflict.timeOverlap}</span>
        </div>
        
        {conflict.venue && (
          <div className="conflict-detail">
            <span className="conflict-label">Venue Limit</span>
            <span className="conflict-value">{conflict.venue}</span>
          </div>
        )}
        
        {conflict.affectedStudents && (
          <div className="conflict-detail">
            <span className="conflict-label">Affected Impact</span>
            <span className="conflict-value">~{conflict.affectedStudents} students</span>
          </div>
        )}
      </div>
    </div>
  );
}
