import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock3,
  MapPin,
  User,
  Users,
  Tag,
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getEvents } from "../services/api";
import "./EventDetailsPage.css";

const STATUS_LABELS = {
  pending: { label: "Pending Review", cls: "pending" },
  approved: { label: "Approved", cls: "approved" },
  rejected: { label: "Rejected", cls: "rejected" },
};

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(location.state?.event || null);
  const [isLoading, setIsLoading] = useState(!location.state?.event);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getEvents();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((item) => (item._id || item.id) === eventId);

        if (!found) {
          setError("Event not found.");
          return;
        }

        setEvent({ ...found, id: found._id || found.id });
      } catch (err) {
        console.error("Failed to load event details", err);
        setError("Could not load event details right now.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [event, eventId]);

  const status = useMemo(() => {
    if (!event) return STATUS_LABELS.pending;
    return STATUS_LABELS[event.status] || STATUS_LABELS.pending;
  }, [event]);

  if (isLoading) {
    return (
      <div className="event-details-page">
        <div className="event-details-shell app-skeleton" style={{ minHeight: "420px" }} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-page">
        <div className="event-details-empty">
          <p>{error || "Event details are unavailable."}</p>
          <button className="event-details-btn" onClick={() => navigate(location.state?.fromManageEvents ? "/manage-events" : "/events")}>Back to Events</button>
        </div>
      </div>
    );
  }

  const createdById = event.createdBy?._id || event.createdBy;
  const isOwner = user?.id === createdById;
  const canEdit = isOwner && user?.role === "organizer";
  const backPath = location.state?.fromManageEvents ? "/manage-events" : "/events";

  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date not available";

  const createdAt = event.createdAt
    ? new Date(event.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  return (
    <div className="event-details-page">
      <div className="event-details-bg-orb orb-a" />
      <div className="event-details-bg-orb orb-b" />

      <div className="event-details-shell">
        <button className="event-details-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <header className="event-hero">
          <div>
            <p className="event-hero-kicker">Event Spotlight</p>
            <h1>{event.title}</h1>
            <p className="event-hero-desc">{event.description}</p>
          </div>
          <div className={`event-details-status status-${status.cls}`}>{status.label}</div>
        </header>

        <section className="event-details-grid">
          <article className="event-details-card">
            <h2>Schedule and Venue</h2>
            <div className="event-info-list">
              <p><Calendar size={16} /> {dateLabel}</p>
              <p><Clock3 size={16} /> {event.startTime} - {event.endTime}</p>
              <p><MapPin size={16} /> {event.venue}</p>
              <p><User size={16} /> {event.createdBy?.name || event.organizer || "Unknown organizer"}</p>
              {event.participants ? <p><Users size={16} /> {event.participants} participants expected</p> : null}
              {event.category ? <p><Tag size={16} /> Category: {event.category}</p> : null}
              {event.type ? <p><ClipboardList size={16} /> Type: {event.type}</p> : null}
            </div>
          </article>

          <article className="event-details-card">
            <h2>Review and Notes</h2>
            <div className="event-notes-list">
              <p><strong>Requested:</strong> {createdAt}</p>
              <p><strong>Department:</strong> {event.department || "Not specified"}</p>
              {event.adminReviewNote ? <p><strong>Admin Note:</strong> {event.adminReviewNote}</p> : null}
              {event.rejectionReason ? <p className="event-rejection"><AlertTriangle size={16} /> {event.rejectionReason}</p> : null}
              {event.conflicts?.length ? (
                <div className="event-conflicts">
                  <h3>Detected Conflicts</h3>
                  <ul>
                    {event.conflicts.map((conflict, index) => (
                      <li key={`${conflict}-${index}`}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="event-no-conflicts">No scheduling conflicts recorded.</p>
              )}
            </div>
          </article>
        </section>

        <footer className="event-details-actions">
          <button className="event-details-btn" onClick={() => navigate(backPath)}>Browse Events</button>
          {canEdit ? (
            <button
              className="event-details-btn event-details-btn-primary"
              onClick={() => navigate("/create-event", { state: { eventData: event } })}
            >
              Edit This Event
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
