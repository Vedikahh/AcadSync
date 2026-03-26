import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getEvents } from "../services/api";
import { formatTime12h } from "../utils/formatTime";
import "./EventDetails.css";

function formatDate(rawDate) {
  if (!rawDate) return "TBA";
  const dateValue = new Date(rawDate);
  if (Number.isNaN(dateValue.getTime())) return "TBA";

  return dateValue.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(location.state?.event || null);
  const [isLoading, setIsLoading] = useState(!location.state?.event);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) return;

    const loadEvent = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getEvents();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((item) => {
          const id = item._id || item.id;
          return String(id) === String(eventId);
        });

        if (!found) {
          setError("Event not found.");
          return;
        }

        setEvent({ ...found, id: found._id || found.id });
      } catch (err) {
        setError(err.message || "Failed to load event.");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [event, eventId]);

  if (isLoading) {
    return <div className="event-details-page"><p className="ed-message">Loading event details...</p></div>;
  }

  if (error || !event) {
    return (
      <div className="event-details-page">
        <p className="ed-message ed-error">{error || "Event not found."}</p>
        <Link to="/events" className="ed-back-link">Back to Events</Link>
      </div>
    );
  }

  const effectiveStatus = event.isCompleted && event.status === "approved" ? "completed" : event.status;
  const statusLabel = effectiveStatus ? effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1) : "Pending";
  const statusClass = effectiveStatus === "approved"
    ? "ed-status-approved"
    : effectiveStatus === "rejected"
      ? "ed-status-rejected"
      : effectiveStatus === "cancelled"
        ? "ed-status-rejected"
        : effectiveStatus === "completed"
          ? "ed-status-approved"
      : "ed-status-pending";

  return (
    <div className="event-details-page">
      <div className="ed-top-row">
        <button className="ed-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <Link to="/events" className="ed-back-link">All Events</Link>
      </div>

      <article className="ed-card">
        <div className="ed-header">
          <span className={`ed-status ${statusClass}`}>{statusLabel}</span>
          <h1 className="ed-title">{event.title}</h1>
          <p className="ed-organizer">
            Organized by {event.organizer || event.createdBy?.name || "Unknown"}
            {event.department ? ` (${event.department})` : ""}
          </p>
        </div>

        <section className="ed-section">
          <h2>About</h2>
          <p>{event.description || "No description provided."}</p>
        </section>

        <section className="ed-grid">
          <div className="ed-item">
            <span className="ed-label">Date</span>
            <span className="ed-value">{formatDate(event.date)}</span>
          </div>
          <div className="ed-item">
            <span className="ed-label">Time</span>
            <span className="ed-value">{formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}</span>
          </div>
          <div className="ed-item">
            <span className="ed-label">Venue</span>
            <span className="ed-value">{event.venue || "To be announced"}</span>
          </div>
          <div className="ed-item">
            <span className="ed-label">Participants</span>
            <span className="ed-value">{event.participants ?? event.expectedParticipants ?? "Unspecified"}</span>
          </div>
        </section>

        {(event.equipments || event.resources) && (
          <section className="ed-section">
            <h2>Resources</h2>
            <p>{event.equipments || event.resources}</p>
          </section>
        )}
      </article>
    </div>
  );
}
