import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <Link to="/auctions" className="flex items-center gap-2">
        <span className="text-xl font-display font-bold text-white tracking-tight">
          BID<span className="text-purple-400">RUSH</span>
        </span>
        <span className="text-yellow-400 text-lg">⚡</span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-white/50 hidden sm:block">
              gm, <span className="text-white font-medium">{user.name}</span>
            </span>
            <Link
              to="/create-auction"
              className="bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
            >
              + Drop Auction
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-white/60 hover:text-white transition"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-red-400 transition"
            >
              Leave →
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-white/60 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
            >
              Join Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
