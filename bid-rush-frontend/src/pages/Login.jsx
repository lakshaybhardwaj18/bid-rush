import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/axios";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/auctions");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      {/* background blobs */}
      <div className="absolute top-20 left-1/3 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass neon-border rounded-2xl p-8 w-full max-w-md animate-fadeUp">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Welcome back
          </h1>
          <p className="text-white/40 text-sm">Log in to keep bidding</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl mb-4 text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {["email", "password"].map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-2">
                {field}
              </label>
              <input
                type={field}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                placeholder={field === "email" ? "you@example.com" : "••••••••"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all duration-200"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 mt-2"
          >
            {loading ? "Logging in..." : "Let's Go →"}
          </button>
        </form>

        <p className="text-sm text-center text-white/30 mt-6">
          New here?{" "}
          <Link
            to="/register"
            className="text-purple-400 hover:text-purple-300 transition"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
