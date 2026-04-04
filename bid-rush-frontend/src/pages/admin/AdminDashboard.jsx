import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("auctions");
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("adminAuth") !== "true") {
      navigate("/admin/login");
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const auctionsRes = await api.get("/api/auctions");
        const data = Array.isArray(auctionsRes.data)
          ? auctionsRes.data
          : auctionsRes.data.auctions || [];
        setAuctions(data);

        const allBids = [];
        for (const auction of data) {
          try {
            const bidsRes = await api.get(`/api/bids/auction/${auction._id}`);
            const auctionBids = bidsRes.data.bids || [];
            auctionBids.forEach((bid) => {
              allBids.push({ ...bid, auctionTitle: auction.title });
            });
          } catch (e) {}
        }
        setBids(allBids);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

 const handleDelete = async (id) => {
  if (!window.confirm("Delete this auction?")) return;
  try {
    await api.delete(`/api/auctions/admin/${id}`, {
      headers: {
        "x-admin-secret": "bidrush-admin-secret-2024",
      },
    });
    setAuctions((prev) => prev.filter((a) => a._id !== id));
    setBids((prev) => prev.filter((b) => b.auctionId !== id));
  } catch (err) {
    alert("Failed to delete auction.");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  const statusBadge = (s) => {
    if (s === "active") return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (s === "ended") return "bg-red-50 text-red-500 border border-red-100";
    return "bg-amber-50 text-amber-600 border border-amber-100";
  };

  const tabs = [
    { key: "auctions", label: "Auctions", count: auctions.length },
    { key: "bids", label: "Bids", count: bids.length },
  ];

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm uppercase tracking-widest animate-pulse">
          Loading admin data...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 animate-fadeUp">
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-widest mb-2">
              Admin Panel
            </p>
            <h1 className="font-display text-4xl font-bold text-gray-900">
              BidRush Admin
            </h1>
            <div className="mt-3 w-10 h-0.5 bg-emerald-400" />
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition font-medium"
          >
            Logout →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fadeUp">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Auctions</p>
            <p className="font-display text-3xl font-bold text-gray-900">{auctions.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Bids</p>
            <p className="font-display text-3xl font-bold text-gray-900">{bids.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Active Auctions</p>
            <p className="font-display text-3xl font-bold text-emerald-500">
              {auctions.filter((a) => a.status === "active").length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Ended Auctions</p>
            <p className="font-display text-3xl font-bold text-red-400">
              {auctions.filter((a) => a.status === "ended").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 animate-fadeUp">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Auctions */}
        {activeTab === "auctions" && (
          <div className="space-y-3 animate-fadeIn">
            {auctions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
                No auctions found.
              </div>
            ) : (
              auctions.map((auction) => (
                <div
                  key={auction._id}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{auction.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(auction.status)}`}>
                        {auction.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Created by: <span className="text-gray-600">{auction.createdBy || "—"}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Deadline: <span className="text-gray-600">{new Date(auction.endTime).toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Current Bid: <span className="text-emerald-600 font-semibold">Rs. {(auction.currentBid || auction.startPrice)?.toLocaleString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(auction._id)}
                    className="ml-4 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-100 hover:border-red-500 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Bids */}
        {activeTab === "bids" && (
          <div className="space-y-3 animate-fadeIn">
            {bids.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
                No bids found.
              </div>
            ) : (
              bids.map((bid, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{bid.auctionTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Bidder: <span className="text-gray-600">{bid.userId || "—"}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Time: {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-emerald-600 font-bold font-display">
                    Rs. {bid.amount?.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;