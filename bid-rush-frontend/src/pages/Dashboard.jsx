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
        const [bidsRes, auctionsRes, transactionsRes] = await Promise.all([
          api.get("/api/bids/my-bids"),
          api.get("/api/auctions/my"),
          //api.get("/api/auctions/user/mytransactions"),
        ]);
        setMyBids(bidsRes.data.bids || []);
        setMyAuctions(auctionsRes.data.auctions || []);
       // setMyTransactions(transactionsRes.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const tabs = [
    { key: "bids", label: " My Bids", count: myBids.length },
    { key: "auctions", label: " My Auctions", count: myAuctions.length },
    {
      key: "transactions",
      label: " Transactions",
      count: myTransactions.length,
    },
  ];

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse font-display text-xl">
          Loading your stuff...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-10">
      <div className="absolute top-20 right-20 w-80 h-80 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeUp">
          <p className="text-purple-400 text-sm tracking-widest uppercase mb-1">
            Your Space
          </p>
          <h1 className="font-display text-4xl font-bold text-white">
            Greetings, {user?.name}
          </h1>
          <p className="text-white/30 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 animate-fadeUp">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "glass text-white/50 hover:text-white"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-white/10"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab 1 — Bids */}
        {activeTab === "bids" && (
          <div className="space-y-3 animate-fadeIn">
            {myBids.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-white/30">
                No bids placed yet ...
              </div>
            ) : (
              myBids.map((bid, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-5 flex items-center justify-between hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {bid.auctionTitle}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold font-display">
                      Rs. {bid.amount}
                    </p>
                    <Link
                      to={`/auctions/${bid.auctionId}`}
                      className="text-xs text-white/30 hover:text-purple-400 transition"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2 — Auctions */}
        {activeTab === "auctions" && (
          <div className="space-y-3 animate-fadeIn">
            {myAuctions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-white/30">
                No auctions created yet.{" "}
                <Link
                  to="/create-auction"
                  className="text-purple-400 hover:underline"
                >
                  Drop one now
                </Link>
              </div>
            ) : (
              myAuctions.map((auction, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-5 flex items-center justify-between hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">
                        {auction.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          auction.status === "active"
                            ? "bg-green-500/15 text-green-400"
                            : auction.status === "ended"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-yellow-500/15 text-yellow-400"
                        }`}
                      >
                        {auction.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/30">
                      Ends: {new Date(auction.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold font-display">
                      Rs. {auction.currentBid || auction.startPrice}
                    </p>
                    <Link
                      to={`/auctions/${auction._id}`}
                      className="text-xs text-white/30 hover:text-purple-400 transition"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3 — Transactions */}
        {activeTab === "transactions" && (
          <div className="space-y-3 animate-fadeIn">
            {myTransactions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-white/30">
                No transactions yet 📭
              </div>
            ) : (
              myTransactions.map((tx, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-5 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-display font-bold text-white">
                      {tx.auctionTitle}
                    </p>
                    <p className="text-purple-400 font-bold font-display">
                      Rs. {tx.finalPrice}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      {tx.winnerId === user?._id
                        ? " You won — Seller Info"
                        : " Sold — Winner Info"}
                    </p>
                    {["name", "email", "phone", "city"].map((k) => (
                      <p key={k} className="text-sm text-white/50 capitalize">
                        {k}:{" "}
                        <span className="text-white font-medium">
                          {tx.contactInfo?.[k]}
                        </span>
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-white/20 mt-3">
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
