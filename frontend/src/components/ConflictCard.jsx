import "./ConflictCard.css";
import { AlertTriangle } from "lucide-react";
import { formatEventDate, DATE_FALLBACK_TEXT } from "../utils/formatDate";


const SEVERITY_CONFIG = {
  high:   { label: "High Risk",   cls: "severity-high"   },
  medium: { label: "Medium", cls: "severity-medium" },
  low:    { label: "Low",    cls: "severity-low"    },
};

export default function ConflictCard({ conflict }) {
  const sev = SEVERITY_CONFIG[conflict.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
  const displayDate = formatEventDate(conflict.dateIso || conflict.date, { fallback: DATE_FALLBACK_TEXT });
  const overlapValue = conflict.timeOverlap
    || (conflict.conflictWindow?.startTime && conflict.conflictWindow?.endTime
      ? `${conflict.conflictWindow.startTime} - ${conflict.conflictWindow.endTime}`
      : "Not specified");
  const reasonText = conflict.blockingReason || conflict.message;
  const priorityText = conflict.priority ? `Priority ${conflict.priority}` : "";
  const conflictTitle = conflict.eventName || conflict.title || conflict.clashWith || "Schedule conflict";
  const clashTarget = conflict.clashWith || conflict.title || "Existing schedule item";

  return (
    <div className={`conflict-card ${sev.cls}`}>
      <div className="conflict-card-header">
        <div className="conflict-badge">
          <AlertTriangle size={20} className="conflict-badge-icon" style={{ marginRight: '6px' }} />
          {sev.label}
        </div>
        <span className="conflict-time">{displayDate}</span>
      </div>

      <h4 className="conflict-event-name">{conflictTitle}</h4>

      {conflict.isBlocking && <div className="conflict-pill blocking">Blocking</div>}

      <div className="conflict-details-grid">
        <div className="conflict-detail">
          <span className="conflict-label">Clashes with</span>
          <span className="conflict-value conflict-highlight">{clashTarget}</span>
        </div>
        <div className="conflict-detail">
          <span className="conflict-label">Overlap Time</span>
          <span className="conflict-value">{overlapValue}</span>
        </div>

        {priorityText && (
          <div className="conflict-detail">
            <span className="conflict-label">Priority</span>
            <span className="conflict-value">{priorityText}</span>
          </div>
        )}
        
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

      {reasonText && (
        <p className="conflict-reason">{reasonText}</p>
      )}
    </div>
  );
}
