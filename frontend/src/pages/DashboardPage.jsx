import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { auth } from "../auth";

const CATEGORIES = ["Academic", "Hostel", "Transport", "Other"];
const STATUSES = ["Pending", "Resolved"];

const emptyForm = { title: "", description: "", category: "Academic" };

function DashboardPage() {
  const navigate = useNavigate();
  const token = auth.getToken();

  // Student info
  const [student, setStudent] = useState(null);

  // Grievances list
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit / Edit form
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null means not searching

  // Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg("");
  };

  // ── Load all grievances ──────────────────────────────────────────────────
  const loadGrievances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGrievances(token);
      setGrievances(data.grievances || []);
    } catch (err) {
      if (err.message.includes("Unauthorized")) {
        auth.clearToken();
        navigate("/login");
      } else {
        showError(err.message || "Failed to load grievances");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    // Try to get student name from localStorage (saved at login)
    const name = localStorage.getItem("student_name");
    if (name) setStudent({ name });
    loadGrievances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit / Update grievance ──────────────────────────────────────────
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormLoading(true);

    try {
      if (editingId) {
        await api.updateGrievance(token, editingId, form);
        showSuccess("Grievance updated successfully!");
        setEditingId(null);
      } else {
        await api.submitGrievance(token, form);
        showSuccess("Grievance submitted successfully!");
      }
      setForm(emptyForm);
      setSearchResults(null);
      setSearchQuery("");
      await loadGrievances();
    } catch (err) {
      showError(err.message || "Action failed");
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (g) => {
    setEditingId(g._id);
    setForm({ title: g.title, description: g.description, category: g.category });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // ── Toggle status ─────────────────────────────────────────────────────
  const toggleStatus = async (g) => {
    try {
      const newStatus = g.status === "Pending" ? "Resolved" : "Pending";
      await api.updateGrievance(token, g._id, { status: newStatus });
      showSuccess(`Marked as ${newStatus}`);
      if (searchResults) {
        setSearchResults((prev) =>
          prev.map((item) => (item._id === g._id ? { ...item, status: newStatus } : item))
        );
      }
      await loadGrievances();
    } catch (err) {
      showError(err.message || "Failed to update status");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this grievance? This cannot be undone.")) return;
    try {
      await api.deleteGrievance(token, id);
      showSuccess("Grievance deleted.");
      if (searchResults) {
        setSearchResults((prev) => prev.filter((g) => g._id !== id));
      }
      if (editingId === id) cancelEdit();
      await loadGrievances();
    } catch (err) {
      showError(err.message || "Failed to delete");
    }
  };

  // ── Search ─────────────────────────────────────────────────────────────
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await api.searchGrievances(token, searchQuery.trim());
      setSearchResults(data.grievances || []);
    } catch (err) {
      showError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    auth.clearToken();
    localStorage.removeItem("student_name");
    navigate("/login");
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const displayList = searchResults !== null ? searchResults : grievances;

  const categoryColor = (cat) => {
    const map = {
      Academic: "tag-academic",
      Hostel: "tag-hostel",
      Transport: "tag-transport",
      Other: "tag-other",
    };
    return map[cat] || "";
  };

  return (
    <main className="page dashboard-page">

      {/* ── Header ── */}
      <section className="card glass dashboard-header">
        <div>
          <p className="eyebrow">Student Grievance Portal</p>
          <h1>{student ? `Hello, ${student.name}` : "Dashboard"}</h1>
          <p className="muted">Submit, track, and manage your grievances below.</p>
        </div>
        <button className="ghost logout-btn" onClick={handleLogout}>⏻ Logout</button>
      </section>

      {/* ── Feedback ── */}
      {successMsg && <p className="success-text center feedback-bar">{successMsg}</p>}
      {errorMsg && <p className="error-text center feedback-bar">{errorMsg}</p>}

      {/* ── Submit / Edit Form ── */}
      <section className="card glass form-section">
        <h2>{editingId ? "✏️ Edit Grievance" : "📝 Submit a Grievance"}</h2>
        <form className="form grievance-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="g-title">Title</label>
              <input
                id="g-title"
                type="text"
                placeholder="Brief summary of your issue"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="g-category">Category</label>
              <select
                id="g-category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="g-description">Description</label>
          <textarea
            id="g-description"
            placeholder="Describe your grievance in detail..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            required
          />

          <div className="form-actions">
            <button type="submit" disabled={formLoading}>
              {formLoading ? "Saving..." : editingId ? "Update Grievance" : "Submit Grievance"}
            </button>
            {editingId && (
              <button type="button" className="ghost" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── Search ── */}
      <section className="card glass search-section">
        <h2>🔍 Search Grievances</h2>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            id="search-input"
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
          {searchResults !== null && (
            <button type="button" className="ghost" onClick={clearSearch}>
              Clear
            </button>
          )}
        </form>
        {searchResults !== null && (
          <p className="muted search-info">
            {searchResults.length === 0
              ? `No results for "${searchQuery}"`
              : `${searchResults.length} result(s) for "${searchQuery}"`}
          </p>
        )}
      </section>

      {/* ── Grievance List ── */}
      <section className="grievance-list-section">
        <div className="list-header">
          <h2>
            {searchResults !== null ? "Search Results" : "All Grievances"}
            <span className="count-badge">{displayList.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="card glass loading-card">
            <p className="muted">Loading grievances...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="card glass empty-card">
            <p className="muted">
              {searchResults !== null
                ? "No grievances match your search."
                : "No grievances yet. Submit your first one above!"}
            </p>
          </div>
        ) : (
          <div className="grievance-grid">
            {displayList.map((g) => (
              <article key={g._id} className="card glass grievance-card">
                <div className="grievance-card-top">
                  <span className={`tag ${categoryColor(g.category)}`}>{g.category}</span>
                  <span className={`status-badge ${g.status === "Resolved" ? "resolved" : "pending"}`}>
                    {g.status}
                  </span>
                </div>
                <h3 className="grievance-title">{g.title}</h3>
                <p className="grievance-desc">{g.description}</p>
                <p className="grievance-date muted">
                  {new Date(g.date || g.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="grievance-actions">
                  <button
                    className={`status-toggle ${g.status === "Resolved" ? "ghost" : ""}`}
                    onClick={() => toggleStatus(g)}
                    title="Toggle status"
                  >
                    {g.status === "Pending" ? "✓ Mark Resolved" : "↺ Mark Pending"}
                  </button>
                  <button className="ghost edit-btn" onClick={() => startEdit(g)}>
                    ✏️ Edit
                  </button>
                  <button className="danger-btn" onClick={() => handleDelete(g._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
