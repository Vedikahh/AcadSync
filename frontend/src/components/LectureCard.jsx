import { formatTime12h } from "../utils/formatTime";
import "./LectureCard.css";

const TYPE_LABELS = {
  lecture: "Lecture",
  lab:     "Lab",
  exam:    "Exam",
};

export default function LectureCard({ lecture }) {
  const isOngoing = () => {
    const now = new Date();
    const [startH, startM] = lecture.startTime.split(":").map(Number);
    const [endH, endM]     = lecture.endTime.split(":").map(Number);
    const nowMins   = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins   = endH * 60 + endM;
    return nowMins >= startMins && nowMins <= endMins;
  };

  const ongoing = isOngoing();

  return (
    <div className={`lecture-card ${ongoing ? "lecture-card-ongoing" : ""}`}>
      {ongoing && <div className="lecture-live-badge">Live</div>}
      <div className="lecture-card-header">
        <span className="lecture-time">{formatTime12h(lecture.startTime)} – {formatTime12h(lecture.endTime)}</span>
        <span className="lecture-dept-badge">{lecture.department}</span>
      </div>
      <h4 className="lecture-subject">{lecture.subject || "Untitled"}</h4>
      <div className="lecture-meta">
        <span className="lecture-meta-item">
          <span className="lecture-meta-icon">FAC</span>
          <span>{lecture.faculty}</span>
        </span>
        <span className="lecture-meta-item">
          <span className="lecture-meta-icon">RM</span>
          <span>Room {lecture.room}</span>
        </span>
      </div>
      {lecture.type && (
        <span className={`lecture-type-badge lecture-type-${lecture.type}`}>
          {TYPE_LABELS[lecture.type] || lecture.type}
        </span>
      )}
    </div>
  );
}
