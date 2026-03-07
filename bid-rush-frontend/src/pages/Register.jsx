import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/axios";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });
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
      await api.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name", type: "text", placeholder: "Rahul Sharma" },
    { name: "email", type: "email", placeholder: "you@example.com" },
    { name: "password", type: "password", placeholder: "••••••••" },
    { name: "phone", type: "tel", placeholder: "9876543210" },
    { name: "city", type: "text", placeholder: "Mumbai" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="absolute top-20 right-1/3 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="glass neon-border rounded-2xl p-8 w-full max-w-md animate-fadeUp">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Join BidRush ⚡
          </h1>
          <p className="text-white/40 text-sm">
            Create your account and start bidding
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-2">
                {field.name}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required
                placeholder={field.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all duration-200"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 mt-2"
          >
            {loading ? "Creating..." : "Create Account →"}
          </button>
        </form>

        <p className="text-sm text-center text-white/30 mt-6">
          Already in?{" "}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 transition"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
