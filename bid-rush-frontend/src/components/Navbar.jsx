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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/auctions" className="flex items-center gap-2">
        <span className="text-lg font-display font-bold text-gray-900 tracking-tight">
          Bid<span className="text-emerald-500">Rush</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mb-3 inline-block" />
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-400 hidden sm:block">
              Hi, <span className="text-gray-700 font-medium">{user.name}</span>
            </span>
            <Link
              to="/create-auction"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200"
            >
              + Drop Auction
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900 transition"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-500 transition"
            >
              Leave →
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200"
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
