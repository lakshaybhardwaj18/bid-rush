import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/axios";
import socket from "../utils/socket";

function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [contactCard, setContactCard] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api
      .get(`/api/auctions/${id}`)
      .then((res) => {
        setAuction(res.data.auction);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load auction.");
        setLoading(false);
      });
    api
      .get(`/api/bids/${id}`)
      .then((res) => setBids(res.data))
      .catch(() => {});
  }, [id]);
 
  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      const diff = new Date(auction.endTime) - new Date();
      if (diff <= 0) {
        setTimeLeft("Auction Ended");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  useEffect(() => {
    socket.connect();
    socket.emit("join_auction", id);
    socket.on("new_bid", (bidData) => {
      setBids((prev) => [bidData, ...prev]);
      setAuction((prev) => ({ ...prev, currentBid: bidData.amount }));
    });
    socket.on("outbid_alert", (data) => {
      if (user && data.outbidUserId === user._id)
        alert("⚠️ You have been outbid!");
    });
    socket.on("auction_ending_soon", () =>
      alert(" Ending in less than 5 minutes!"),
    );
    socket.on("auction_won", (data) =>
      setContactCard({
        type: "winner",
        item: data.auctionTitle,
        price: data.finalPrice,
        contact: data.sellerInfo,
      }),
    );
    socket.on("auction_sold", (data) =>
      setContactCard({
        type: "seller",
        item: data.auctionTitle,
        price: data.finalPrice,
        contact: data.winnerInfo,
      }),
    );
    return () => {
      socket.off("new_bid");
      socket.off("outbid_alert");
      socket.off("auction_ending_soon");
      socket.off("auction_won");
      socket.off("auction_sold");
      socket.disconnect();
    };
  }, [id]);

  const handleBid = async () => {
    setBidError("");
    setBidSuccess("");
    if (!bidAmount || isNaN(bidAmount)) {
      setBidError("Enter a valid amount.");
      return;
    }
    setBidLoading(true);
    try {
      await api.post("/api/bids/place", { auctionId: id, amount: Number(bidAmount) });
      setBidSuccess("Bid placed! ");
      setBidAmount("");
    } catch (err) {
      setBidError(err.response?.data?.message || "Failed to place bid.");
    } finally {
      setBidLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse font-display text-xl">
          Loading auction...
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
      <div className="absolute top-32 right-10 w-80 h-80 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Auction Info */}
        <div className="glass neon-border rounded-2xl p-6 animate-fadeUp">
          <div className="flex items-start justify-between mb-3">
            <h1 className="font-display text-2xl font-bold text-white">
              {auction.title}
            </h1>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                auction.status === "active"
                  ? "bg-green-500/15 text-green-400 border border-green-500/20"
                  : "bg-red-500/15 text-red-400 border border-red-500/20"
              }`}
            >
              {auction.status}
            </span>
          </div>

          <p className="text-white/40 text-sm mb-5">{auction.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Starting Price</p>
              <p className="font-display text-xl font-bold text-white">
                Rs. {auction.startPrice}
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Highest Bid</p>
              <p className="font-display text-xl font-bold text-purple-400">
                Rs. {auction.currentBid || auction.startPrice}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-center animate-pulse-glow">
            <p className="text-white/40 text-xs mb-1 uppercase tracking-widest">
              Time Left
            </p>
            <p className="font-display text-2xl font-bold text-yellow-400">
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Place Bid */}
        {auction.status === "active" && user && (
          <div className="glass rounded-2xl p-6 animate-fadeUp">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Place Your Bid
            </h2>

            {bidError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl mb-3 text-sm animate-fadeIn">
                {bidError}
              </div>
            )}
            {bidSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl mb-3 text-sm animate-fadeIn">
                {bidSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`> Rs. ${auction.currentBid || auction.startPrice}`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all"
              />
              <button
                onClick={handleBid}
                disabled={bidLoading}
                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                {bidLoading ? "..." : "Bid Now"}
              </button>
            </div>
          </div>
        )}

        {/* Live Bid Feed */}
        <div className="glass rounded-2xl p-6 animate-fadeUp">
          <h2 className="font-display text-lg font-bold text-white mb-4">
            Live Feed 📡
          </h2>

          {bids.length === 0 ? (
            <p className="text-white/30 text-sm">
              No bids yet. Be the first 👀
            </p>
          ) : (
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all animate-ticker ${
                    i === 0
                      ? "bg-purple-500/15 border border-purple-500/20"
                      : "bg-white/3 border border-white/5"
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {bid.userName}
                    </p>
                    <p className="text-xs text-white/30">
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold font-display ${i === 0 ? "text-purple-400" : "text-white/60"}`}
                    >
                      Rs. {bid.amount}
                    </p>
                    {i === 0 && (
                      <p className="text-xs text-purple-400/60">leading</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Card */}
        {contactCard && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 animate-fadeUp">
            <h2 className="font-display text-xl font-bold text-green-400 mb-1">
              {contactCard.type === "winner" ? " You won!" : " Auction sold!"}
            </h2>
            <p className="text-white/50 text-sm mb-1">
              Item: <span className="text-white">{contactCard.item}</span>
            </p>
            <p className="text-white/50 text-sm mb-4">
              Price:{" "}
              <span className="text-green-400 font-bold">
                Rs. {contactCard.price}
              </span>
            </p>
            <div className="border-t border-white/10 pt-4 space-y-1">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                {contactCard.type === "winner"
                  ? "Seller Details"
                  : "Winner Details"}
              </p>
              {["name", "email", "phone", "city"].map((k) => (
                <p key={k} className="text-sm text-white/60 capitalize">
                  {k}:{" "}
                  <span className="text-white font-medium">
                    {contactCard.contact?.[k]}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionDetail;
