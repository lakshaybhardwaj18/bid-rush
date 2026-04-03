import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("bids");
  const [myBids, setMyBids] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bidsRes, auctionsRes] = await Promise.all([
          api.get("/api/bids/my-bids"),
          api.get("/api/auctions/my"),
        ]);
        setMyBids(bidsRes.data.bids || []);
        setMyAuctions(auctionsRes.data.auctions || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const tabs = [
    { key: "bids", label: "My Bids", count: myBids.length },
    { key: "auctions", label: "My Auctions", count: myAuctions.length },
    { key: "transactions", label: "Transactions", count: myTransactions.length },
  ];

  const statusBadge = (s) => {
    if (s === "active") return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (s === "ended") return "bg-red-50 text-red-500 border border-red-100";
    return "bg-amber-50 text-amber-600 border border-amber-100";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm uppercase tracking-widest animate-pulse">
          Loading your data...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 animate-fadeUp">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-widest mb-2">
            Your Space
          </p>
          <h1 className="font-display text-4xl font-bold text-gray-900">
            {user?.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          <div className="mt-4 w-10 h-0.5 bg-emerald-400" />
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

        {/* Tab: Bids */}
        {activeTab === "bids" && (
          <div className="space-y-3 animate-fadeIn">
            {myBids.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
                No bids placed yet.
              </div>
            ) : (
              myBids.map((bid, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{bid.auctionTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-bold font-display">
                      Rs. {bid.amount?.toLocaleString()}
                    </p>
                    <Link
                      to={`/auctions/${bid.auctionId}`}
                      className="text-xs text-gray-400 hover:text-emerald-500 transition"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Auctions */}
        {activeTab === "auctions" && (
          <div className="space-y-3 animate-fadeIn">
            {myAuctions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
                No auctions yet.{" "}
                <Link to="/create-auction" className="text-emerald-600 hover:underline font-medium">
                  Create one
                </Link>
              </div>
            ) : (
              myAuctions.map((auction, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{auction.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(auction.status)}`}>
                        {auction.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Ends: {new Date(auction.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-bold font-display">
                      Rs. {(auction.currentBid || auction.startPrice)?.toLocaleString()}
                    </p>
                    <Link
                      to={`/auctions/${auction._id}`}
                      className="text-xs text-gray-400 hover:text-emerald-500 transition"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Transactions */}
        {activeTab === "transactions" && (
          <div className="space-y-3 animate-fadeIn">
            {myTransactions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">
                No transactions yet.
              </div>
            ) : (
              myTransactions.map((tx, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-5 hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-display font-bold text-gray-900">{tx.auctionTitle}</p>
                    <p className="text-emerald-600 font-bold font-display">
                      Rs. {tx.finalPrice?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-semibold">
                      {tx.winnerId === user?._id ? "You Won — Seller Info" : "Sold — Winner Info"}
                    </p>
                    {["name", "email", "phone", "city"].map((k) => (
                      <p key={k} className="text-sm text-gray-500 capitalize">
                        {k}:{" "}
                        <span className="text-gray-800 font-medium">
                          {tx.contactInfo?.[k]}
                        </span>
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(tx.createdAt).toLocaleString()}
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

export default Dashboard;
