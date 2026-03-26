import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";

function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useEffect 1 — fetch auctions
  useEffect(() => {
    api
      .get("/api/auctions")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.auctions || [];
        setAuctions(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load auctions.");
        setLoading(false);
      });
  }, []);

  // useEffect 2 — filter
  useEffect(() => {
    let result = Array.isArray(auctions) ? auctions : [];

    if (search) {
      result = result.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (status !== "all") {
      result = result.filter((a) => a.status === status);
    }

    setFiltered(result);
  }, [search, status, auctions]);

  const statusStyle = (s) => {
    if (s === "active")
      return "bg-green-500/15 text-green-400 border border-green-500/20";
    if (s === "ended")
      return "bg-red-500/15 text-red-400 border border-red-500/20";
    return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse font-display text-xl">
          Loading drops...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-10">
      <div className="absolute top-32 left-10 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fadeUp">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-2">
            Live Now
          </p>
          <h1 className="font-display text-5xl font-bold text-white leading-tight">
            Active Auctions
          </h1>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fadeUp">
          <input
            type="text"
            placeholder="Search drops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
          >
            <option value="all" className="bg-[#0a0a0f]">
              All
            </option>
            <option value="active" className="bg-[#0a0a0f]">
              Active
            </option>
            <option value="upcoming" className="bg-[#0a0a0f]">
              Upcoming
            </option>
            <option value="ended" className="bg-[#0a0a0f]">
              Ended
            </option>
          </select>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center text-white/30 mt-32 font-display text-2xl">
            No auctions found 👻
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((auction, i) => (
              <div
                key={auction._id}
                className="glass rounded-2xl p-5 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 animate-fadeUp"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-display font-bold text-white text-lg leading-tight pr-2">
                    {auction.title}
                  </h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusStyle(auction.status)}`}
                  >
                    {auction.status}
                  </span>
                </div>

                <p className="text-white/40 text-sm mb-4 line-clamp-2">
                  {auction.description}
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Start</span>
                    <span className="text-white/70 font-medium">
                      Rs. {auction.startPrice}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Current Bid</span>
                    <span className="text-purple-400 font-bold">
                      Rs. {auction.currentBid || auction.startPrice}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Ends</span>
                    <span className="text-white/60 text-xs">
                      {new Date(auction.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/auctions/${auction._id}`}
                  className="block text-center bg-purple-500/20 hover:bg-purple-500 border border-purple-500/30 text-purple-300 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200"
                >
                  Place Bid →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionList;
