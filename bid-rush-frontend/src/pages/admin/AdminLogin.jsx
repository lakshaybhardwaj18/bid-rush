import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "Admin69@gmail.com";
const ADMIN_PASSWORD = "BidRush@123";

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      navigate("/admin");
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fadeUp">

        <div className="text-center mb-10">
          <span className="font-display text-2xl font-bold text-gray-900">
            Bid<span className="text-emerald-500">Rush</span>
          </span>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
              Admin Login
            </h1>
            <p className="text-gray-400 text-sm">Restricted access only</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-2.5 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Admin69@gmail.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 mt-2 text-sm"
            >
              Login as Admin →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;