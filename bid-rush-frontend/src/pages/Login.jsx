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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1676181739859-08330dea8999?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Feature Marquee Box */}
      <div className="absolute top-24 w-full flex justify-center z-10 px-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg py-3">
          <div className="animate-marquee flex gap-16 text-white text-base font-semibold px-6">
            <span>Real-time Bidding</span>
            <span>Secure JWT Authentication</span>
            <span>Live Auction Updates</span>
            <span>Transparent Bid History</span>
            <span>Scalable Microservice Architecture</span>

            {/* duplicate for smooth loop */}
            <span>Real-time Bidding</span>
            <span>Secure JWT Authentication</span>
            <span>Live Auction Updates</span>
            <span>Transparent Bid History</span>
            <span>Scalable Microservice Architecture</span>
          </div>
        </div>
      </div>
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm animate-fadeUp">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-display text-2xl font-bold text-white">
            Bid<span className="text-emerald-400">Rush</span>
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
              Welcome back
            </h1>
            <p className="text-gray-400 text-sm">Log in to keep bidding</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-2.5 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {["email", "password"].map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  {field}
                </label>

                <input
                  type={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  placeholder={
                    field === "email" ? "you@example.com" : "••••••••"
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-all duration-200 mt-2 text-sm"
            >
              {loading ? "Logging in..." : "Let's Go →"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-6">
            New here?{" "}
            <Link
              to="/register"
              className="text-emerald-600 hover:text-emerald-500 font-medium transition"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
