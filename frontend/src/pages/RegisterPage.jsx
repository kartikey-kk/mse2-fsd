import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.register(form);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="card glass">
        <p className="eyebrow">Student Grievance Portal</p>
        <h1>Create account</h1>
        <p className="muted">Register to start submitting and managing grievances.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            minLength={6}
            required
          />

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="helper-text">
          Already registered? <Link to="/login">Go to login</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
