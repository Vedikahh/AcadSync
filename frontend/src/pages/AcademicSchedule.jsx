import { useState, useEffect, useRef } from "react";
import {
  getSchedules,
  importSchedules,
  deleteSchedule,
  getScheduleImportHistory,
  rollbackScheduleImport,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import { formatTime12h } from "../utils/formatTime";
import "./AcademicSchedule.css";


const DEPARTMENTS = ["All", "COMPS", "AIML", "AIDS", "IOT", "Mechanical"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TYPE_COLORS = {
  lecture: { bg: "rgba(99,102,241,0.15)", color: "#818cf8", label: "Lecture" },
  lab:     { bg: "rgba(34,197,94,0.15)",  color: "#4ade80", label: "Lab" },
  exam:    { bg: "rgba(239,68,68,0.15)",  color: "#f87171", label: "Exam" },
};

export default function AcademicSchedule() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const csvInputRef = useRef(null);
  
  const [lectures, setLectures] = useState([]);
  const [deptFilter, setDeptFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState("replace");
  const [pendingImport, setPendingImport] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRollingBackId, setIsRollingBackId] = useState("");

  useEffect(() => {
    fetchSchedules();

    socket.on('calendarUpdate', fetchSchedules);
    return () => { socket.off('calendarUpdate', fetchSchedules); };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchImportHistory();
    }
  }, [isAdmin]);


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

  const fetchImportHistory = async () => {
    if (!isAdmin) return;
    try {
      setIsHistoryLoading(true);
      const history = await getScheduleImportHistory();
      setImportHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error("Failed to load import history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const sortByDayAndTime = (a, b) => {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayA = dayOrder.indexOf(a.day);
    const dayB = dayOrder.indexOf(b.day);

    if (dayA !== dayB) return dayA - dayB;
    return String(a.startTime || "").localeCompare(String(b.startTime || ""));
  };

  const filtered = lectures.filter((l) => {
    if (deptFilter !== "All" && l.department !== deptFilter) return false;
    if (dayFilter !== "All" && l.day !== dayFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = [l.subject, l.title, l.faculty, l.department, l.room, l.day, l.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort(sortByDayAndTime);

  const clearAllFilters = () => {
    setDeptFilter("All");
    setDayFilter("All");
    setSearchQuery("");
  };

  const splitCsvLine = (line) => {
    const cols = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];

      if (ch === '"') {
        const nextIsQuote = line[i + 1] === '"';
        if (inQuotes && nextIsQuote) {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }

    cols.push(current.trim());
    return cols;
  };

  const parseCsvToRows = (csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error("CSV must include a header and at least one data row");
    }

    const headers = splitCsvLine(lines[0]).map((h) =>
      h.replace(/^\uFEFF/, "").replace(/^"|"$/g, "").trim()
    );
    const required = ["faculty", "department", "startTime", "endTime", "room"];

    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length > 0) {
      throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);
    }

    const hasSubject = headers.includes("subject");
    const hasTitle = headers.includes("title");
    if (!hasSubject && !hasTitle) {
      throw new Error("CSV must include either a subject or title column");
    }

    const hasDay = headers.includes("day");
    const hasDate = headers.includes("date");
    if (!hasDay && !hasDate) {
      throw new Error("CSV must include either a day or date column");
    }

    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line).map((v) => v.replace(/^"|"$/g, ""));
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = (values[idx] || "").trim();
      });
      return row;
    });
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      setIsImporting(true);
      const csvText = await file.text();
      const rows = parseCsvToRows(csvText);
      const preview = await importSchedules(rows, importMode, true);
      setPendingImport({
        fileName: file.name,
        rows,
        mode: importMode,
        report: preview.report,
        rowErrors: preview.rowErrors || [],
        previewRows: preview.previewRows || [],
      });
      showToast("Validation complete. Review preview before import.");
    } catch (err) {
      console.error(err);
      showToast(`❌ Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!pendingImport) return;

    try {
      setIsImporting(true);
      const result = await importSchedules(pendingImport.rows, pendingImport.mode, false);
      showToast(`✅ ${result.insertedCount || pendingImport.report?.validRows || 0} schedule row(s) imported`);
      setPendingImport(null);
      await fetchSchedules();
      await fetchImportHistory();
    } catch (err) {
      console.error(err);
      showToast(`❌ Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!versionId) return;

    const proceed = window.confirm("Rollback to the schedule set before this import? This replaces current schedule data.");
    if (!proceed) return;

    try {
      setIsRollingBackId(versionId);
      const result = await rollbackScheduleImport(versionId);
      showToast(`✅ Rollback completed. Restored ${result.restoredCount || 0} row(s).`);
      await fetchSchedules();
      await fetchImportHistory();
    } catch (err) {
      console.error(err);
      showToast(`❌ Rollback failed: ${err.message}`);
    } finally {
      setIsRollingBackId("");
    }
  };

  const formatHistoryMeta = (item) => {
    const when = item?.createdAt ? new Date(item.createdAt).toLocaleString() : "-";
    const actor = item?.createdBy?.name || item?.createdBy?.email || "Admin";
    return `${when} by ${actor}`;
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
          <h1 className="as-title"> Academic Schedule</h1>
          <p className="as-sub">Manage lecture slots, labs, and exam schedules across departments</p>
        </div>
        {isAdmin && (
          <div className="as-header-actions">
            <select
              className="as-mode-select"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              disabled={isImporting || Boolean(pendingImport)}
            >
              <option value="replace">Replace Existing</option>
              <option value="append">Append to Existing</option>
            </select>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleCsvUpload}
            />
            <button className="as-btn-csv" onClick={() => csvInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? "Validating CSV..." : "Upload CSV"}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="as-import-note">
          <strong>Admin import workflow:</strong> Upload CSV for validation preview, review row-level issues, then commit.
          Modes: Replace overwrites all schedule rows, Append adds new rows. Required columns: subject (or title), faculty, department, startTime, endTime, room, and either day or date. Optional: type (lecture/lab/exam).
        </div>
      )}

      {isAdmin && pendingImport && (
        <div className="as-preview-card">
          <div className="as-preview-head">
            <div>
              <h3>Import Preview</h3>
              <p>{pendingImport.fileName} • mode: {pendingImport.mode}</p>
            </div>
            <div className="as-preview-actions">
              <button
                className="as-clear-btn"
                onClick={() => setPendingImport(null)}
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                className="as-btn-submit"
                onClick={handleCommitImport}
                disabled={isImporting || pendingImport.rowErrors.length > 0}
                title={pendingImport.rowErrors.length > 0 ? "Fix row errors before committing" : "Commit import"}
              >
                {isImporting ? "Importing..." : "Commit Import"}
              </button>
            </div>
          </div>

          <div className="as-preview-stats">
            <div><span>Total Rows</span><strong>{pendingImport.report?.totalRows || 0}</strong></div>
            <div><span>Valid Rows</span><strong>{pendingImport.report?.validRows || 0}</strong></div>
            <div><span>Invalid Rows</span><strong>{pendingImport.report?.invalidRows || 0}</strong></div>
          </div>

          {pendingImport.rowErrors.length > 0 ? (
            <div className="as-error-report">
              <h4>Row-level Errors</h4>
              <div className="as-error-list">
                {pendingImport.rowErrors.map((err, idx) => (
                  <div key={`${err.rowNumber}-${idx}`} className="as-error-item">
                    <div className="as-error-row">CSV Row {err.rowNumber}</div>
                    <div className="as-error-msg">{(err.errors || []).join("; ")}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="as-preview-table-wrap">
              <h4>Validated Preview (first {pendingImport.previewRows.length} rows)</h4>
              <table className="as-preview-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingImport.previewRows.map((row, idx) => (
                    <tr key={`${row.subject}-${idx}`}>
                      <td>{row.subject}</td>
                      <td>{row.faculty}</td>
                      <td>{row.department}</td>
                      <td>{row.day}</td>
                      <td>{row.startTime} - {row.endTime}</td>
                      <td>{row.room}</td>
                      <td>{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="as-history-card">
          <div className="as-history-head">
            <h3>Recent Import Versions</h3>
            <button className="as-clear-btn" onClick={fetchImportHistory} disabled={isHistoryLoading}>Refresh</button>
          </div>

          {isHistoryLoading ? (
            <p className="as-history-empty">Loading import history...</p>
          ) : importHistory.length === 0 ? (
            <p className="as-history-empty">No import versions available yet.</p>
          ) : (
            <div className="as-history-list">
              {importHistory.map((item) => (
                <div key={item._id} className="as-history-item">
                  <div>
                    <div className="as-history-title">
                      <strong>{String(item.mode || "-").toUpperCase()}</strong>
                      <span>{formatHistoryMeta(item)}</span>
                    </div>
                    <div className="as-history-meta">
                      total: {item.totalRows} | valid: {item.validRows} | invalid: {item.invalidRows} | inserted: {item.insertedCount}
                    </div>
                  </div>
                  {item.mode !== "rollback" && (
                    <button
                      className="as-btn-csv"
                      onClick={() => handleRollback(item._id)}
                      disabled={Boolean(isRollingBackId) || Boolean(pendingImport)}
                    >
                      {isRollingBackId === item._id ? "Rolling Back..." : "Rollback"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="as-toolbar">
        <div className="as-search-wrap">
          <input
            className="as-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, faculty, room, department..."
          />
        </div>
        <button className="as-clear-btn" onClick={clearAllFilters}>Clear Filters</button>
      </div>

      <div className="as-stats-row">
        <div className="as-stat-card">
          <span className="as-stat-label">Total Slots</span>
          <strong>{lectures.length}</strong>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Showing</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="as-stat-card">
          <span className="as-stat-label">Active Filters</span>
          <strong>{[deptFilter !== "All", dayFilter !== "All", Boolean(searchQuery.trim())].filter(Boolean).length}</strong>
        </div>
      </div>

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
        <div className="as-empty">
          <span>📭</span>
          <p>No lecture slots match your filter.</p>
          <button className="as-clear-btn" onClick={clearAllFilters}>Reset and Show All</button>
        </div>
      ) : (
        <>
        <div className="as-mobile-list">
          {filtered.map((l) => {
            const typeCfg = TYPE_COLORS[l.type] || TYPE_COLORS.lecture;
            const id = l._id || l.id;
            return (
              <div key={id} className="as-mobile-card">
                <div className="as-mobile-head">
                  <span className="as-subject">{l.subject || l.title || "Untitled"}</span>
                  <span className="as-type-badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                    {typeCfg.label}
                  </span>
                </div>
                <div className="as-mobile-meta">{l.faculty} • {l.department}</div>
                <div className="as-mobile-meta">{l.day} • {formatTime12h(l.startTime)} - {formatTime12h(l.endTime)}</div>
                <div className="as-mobile-meta">Room: {l.room}</div>
              </div>
            );
          })}
        </div>
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
                    <td><span className="as-subject">{l.subject || l.title || "Untitled"}</span></td>
                    <td className="as-faculty">{l.faculty}</td>
                    <td><span className="as-dept-badge">{l.department}</span></td>
                    <td className="as-day">{l.day}</td>
                    <td className="as-time">{formatTime12h(l.startTime)} - {formatTime12h(l.endTime)}</td>
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
        </>
      )}
    </div>
  );
}
