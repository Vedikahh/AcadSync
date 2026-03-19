import { useState, useEffect } from "react";
import { getSchedules, createSchedule, deleteSchedule } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AcademicSchedule.css";

const DEPARTMENTS = ["All", "CSE", "ECE", "ME", "CE", "IT", "MBA", "MCA"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_FORM = {
  subject: "", faculty: "", department: "CSE", day: "Monday",
  startTime: "", endTime: "", room: "", type: "lecture",
};

const TYPE_COLORS = {
  lecture: { bg: "rgba(99,102,241,0.15)", color: "#818cf8", label: "Lecture" },
  lab:     { bg: "rgba(34,197,94,0.15)",  color: "#4ade80", label: "Lab" },
  exam:    { bg: "rgba(239,68,68,0.15)",  color: "#f87171", label: "Exam" },
};

export default function AcademicSchedule() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const [lectures, setLectures] = useState([]);
  const [deptFilter, setDeptFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedules();
      setLectures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load schedules", err);
      showToast("❌ Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const filtered = lectures.filter((l) => {
    if (deptFilter !== "All" && l.department !== deptFilter) return false;
    if (dayFilter !== "All" && l.day !== dayFilter) return false;
    return true;
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleAddLecture = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.faculty.trim()) errs.faculty = "Faculty is required";
    if (!form.startTime) errs.startTime = "Start time required";
    if (!form.endTime) errs.endTime = "End time required";
    if (!form.room.trim()) errs.room = "Room is required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      const newSchedule = await createSchedule(form);
      setLectures((prev) => [...prev, newSchedule]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      showToast("✅ Lecture slot added!");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to add lecture");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      setLectures((prev) => prev.filter((l) => l._id !== id && l.id !== id));
      showToast("🗑 Lecture removed.");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to delete lecture");
    }
  };

  return (
    <div className="as-page">
      {toast && <div className="as-toast">{toast}</div>}

      {/* Header */}
      <div className="as-header">
        <div>
          <h1 className="as-title">📚 Academic Schedule</h1>
          <p className="as-sub">Manage lecture slots, labs, and exam schedules across departments</p>
        </div>
        {isAdmin && (
          <div className="as-header-actions">
            <button className="as-btn-csv" onClick={() => showToast("📄 CSV upload coming soon!")}>
              ↑ Upload CSV
            </button>
            <button className="as-btn-add" onClick={() => setShowForm(!showForm)}>
              {showForm ? "✕ Cancel" : "+ Add Lecture"}
            </button>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && isAdmin && (
        <div className="as-form-card">
          <h3 className="as-form-title">Add New Lecture Slot</h3>
          <form onSubmit={handleAddLecture} className="as-form">
            <div className="as-form-row">
              <div className="as-field">
                <label>Subject *</label>
                <input name="subject" placeholder="Subject name" value={form.subject} onChange={handleChange} className={errors.subject ? "as-input-err" : ""} />
                {errors.subject && <span className="as-err">{errors.subject}</span>}
              </div>
              <div className="as-field">
                <label>Faculty *</label>
                <input name="faculty" placeholder="Faculty name" value={form.faculty} onChange={handleChange} className={errors.faculty ? "as-input-err" : ""} />
                {errors.faculty && <span className="as-err">{errors.faculty}</span>}
              </div>
            </div>
            <div className="as-form-row">
              <div className="as-field">
                <label>Department</label>
                <select name="department" value={form.department} onChange={handleChange}>
                  {DEPARTMENTS.filter((d) => d !== "All").map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="as-field">
                <label>Day</label>
                <select name="day" value={form.day} onChange={handleChange}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="as-field">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
            </div>
            <div className="as-form-row">
              <div className="as-field">
                <label>Start Time *</label>
                <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className={errors.startTime ? "as-input-err" : ""} />
                {errors.startTime && <span className="as-err">{errors.startTime}</span>}
              </div>
              <div className="as-field">
                <label>End Time *</label>
                <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className={errors.endTime ? "as-input-err" : ""} />
                {errors.endTime && <span className="as-err">{errors.endTime}</span>}
              </div>
              <div className="as-field">
                <label>Room *</label>
                <input name="room" placeholder="e.g. A-201" value={form.room} onChange={handleChange} className={errors.room ? "as-input-err" : ""} />
                {errors.room && <span className="as-err">{errors.room}</span>}
              </div>
            </div>
            <div className="as-form-submit">
              <button type="submit" className="as-btn-submit">Add Lecture</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="as-filters">
        <div className="as-filter-group">
          <span className="as-filter-label">Department:</span>
          {DEPARTMENTS.map((d) => (
            <button key={d} className={`as-filter-btn ${deptFilter === d ? "as-filter-btn-active" : ""}`} onClick={() => setDeptFilter(d)}>{d}</button>
          ))}
        </div>
        <div className="as-filter-group">
          <span className="as-filter-label">Day:</span>
          {["All", ...DAYS].map((d) => (
            <button key={d} className={`as-filter-btn ${dayFilter === d ? "as-filter-btn-active" : ""}`} onClick={() => setDayFilter(d)}>{d.slice(0, 3)}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading schedules...</div>
      ) : filtered.length === 0 ? (
        <div className="as-empty"><span>📭</span><p>No lecture slots match your filter.</p></div>
      ) : (
        <div className="as-table-wrapper">
          <table className="as-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Dept</th>
                <th>Day</th>
                <th>Time</th>
                <th>Room</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const typeCfg = TYPE_COLORS[l.type] || TYPE_COLORS.lecture;
                const id = l._id || l.id;
                return (
                  <tr key={id} className="as-row">
                    <td><span className="as-subject">{l.subject}</span></td>
                    <td className="as-faculty">{l.faculty}</td>
                    <td><span className="as-dept-badge">{l.department}</span></td>
                    <td className="as-day">{l.day}</td>
                    <td className="as-time">{l.startTime} – {l.endTime}</td>
                    <td className="as-room">🏛 {l.room}</td>
                    <td>
                      <span className="as-type-badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td>
                      {isAdmin && (
                        <button className="as-btn-del" onClick={() => handleDelete(id)} title="Remove">🗑</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
