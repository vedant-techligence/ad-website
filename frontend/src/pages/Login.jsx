import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  // redirect if already logged in
  useEffect(() => {
    if (authLoading || !user) return;

    if (user.isBanned) {
      navigate("/banned", { replace: true });
    } else if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate(
        user.isProfileComplete ? "/dashboard" : "/onboarding",
        { replace: true }
      );
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { role, isProfileComplete, isBanned } = await login(
        email,
        password
      );

      if (isBanned) navigate("/banned");
      else if (role === "admin") navigate("/admin/dashboard");
      else navigate(isProfileComplete ? "/dashboard" : "/onboarding");

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || user) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <p className="login-subtitle">
          Welcome back. Sign in to your account.
        </p>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="login-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          New user? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;