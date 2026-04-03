import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import socket from "../utils/socket";

function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (auctions.length === 0) return;
    socket.connect();
    auctions.forEach((auction) => {
      if (auction.status === "active") {
        socket.emit("join_auction", auction._id);
      }
    });
    socket.on("new_bid", (bidData) => {
      setAuctions((prev) =>
        prev.map((auction) =>
          auction._id === bidData.auctionId
            ? { ...auction, currentBid: bidData.amount }
            : auction
        )
      );
    });
    return () => {
      socket.off("new_bid");
      socket.disconnect();
    };
  }, [auctions.length]);

  useEffect(() => {
    let result = Array.isArray(auctions) ? auctions : [];
    if (search) {
      result = result.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status !== "all") {
      result = result.filter((a) => a.status === status);
    }
    setFiltered(result);
  }, [search, status, auctions]);

  const statusBadge = (s) => {
    if (s === "active")
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (s === "ended")
      return "bg-red-50 text-red-500 border border-red-100";
    return "bg-amber-50 text-amber-600 border border-amber-100";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm tracking-widest uppercase animate-pulse">
          Loading auctions...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-sm">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 animate-fadeUp">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-emerald-600 text-xs font-semibold tracking-widest uppercase">
              Live Now
            </p>
          </div>
          <h1 className="font-display text-5xl font-bold text-gray-900 leading-tight">
            Active Auctions
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-emerald-400" />
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fadeUp">
          <input
            type="text"
            placeholder="Search auctions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-emerald-400 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {/* Count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-5 animate-fadeIn">
            Showing {filtered.length} auction{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-32 text-lg font-display">
            No auctions found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((auction, i) => (
              <div
                key={auction._id}
                className="card p-5 animate-fadeUp"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Title row */}
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-display font-bold text-gray-900 text-lg leading-snug pr-2">
                    {auction.title}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusBadge(auction.status)}`}>
                    {auction.status}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {auction.description}
                </p>

                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Start Price</span>
                    <span className="text-gray-700 font-medium">
                      Rs. {auction.startPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Bid</span>
                    <span className="text-emerald-600 font-bold">
                      Rs. {(auction.currentBid || auction.startPrice)?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ends</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(auction.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/auctions/${auction._id}`}
                  className="block text-center bg-gray-900 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200"
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
