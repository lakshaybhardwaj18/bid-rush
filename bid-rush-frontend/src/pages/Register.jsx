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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">

      <div className="w-full max-w-sm animate-fadeUp">

        {/* Logo mark */}
        <div className="text-center mb-10">
          <span className="font-display text-2xl font-bold text-gray-900">
            Bid<span className="text-emerald-500">Rush</span>
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
              Create account
            </h1>
            <p className="text-gray-400 text-sm">Join and start bidding</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-2.5 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 capitalize">
                  {field.name}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-all duration-200 mt-2 text-sm"
            >
              {loading ? "Creating..." : "Create Account →"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-6">
            Already in?{" "}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-medium transition">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
