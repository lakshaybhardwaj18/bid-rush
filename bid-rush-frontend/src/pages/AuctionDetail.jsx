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
      .then(async (res) => {
        const auctionData = res.data.auction;
        setAuction(auctionData);
        setLoading(false);

        if (auctionData.status === "ended" && auctionData.winner && user) {
          try {
            const [winnerRes, sellerRes] = await Promise.all([
              api.get(`/api/auth/user/${auctionData.winner}`),
              api.get(`/api/auth/user/${auctionData.createdBy}`),
            ]);
            // ✅ Fixed: user.id instead of user._id
            const isWinner = String(user.id) === String(auctionData.winner);
            setContactCard({
              type: isWinner ? "winner" : "seller",
              item: auctionData.title,
              price: auctionData.currentBid,
              // winnerRes.data and sellerRes.data are direct user objects
              contact: isWinner ? sellerRes.data : winnerRes.data,
            });
          } catch (e) {
            console.error("[AuctionDetail] Failed to load contact info:", e.message);
          }
        }
      })
      .catch(() => {
        setError("Failed to load auction.");
        setLoading(false);
      });

    api
      .get(`/api/bids/auction/${id}`)
      .then((res) => setBids(res.data.bids || []))
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
      // ✅ Updates live feed with new bid
      setBids((prev) => [bidData, ...prev]);
      // ✅ Updates highest bid display
      setAuction((prev) => ({ ...prev, currentBid: bidData.amount }));
    });

    socket.on("outbid_alert", (data) => {
      // ✅ Fixed: user.id instead of user._id
      if (user && data.targetUserId === user.id)
        alert("You have been outbid!");
    });

    socket.on("auction_ending_soon", () =>
      alert("Ending in less than 5 minutes!")
    );

    socket.on("auction_won", (data) => {
      setContactCard({
        type: "winner",
        item: data.auctionTitle,
        price: data.finalPrice,
        contact: data.sellerInfo,
      });
      setAuction((prev) => ({ ...prev, status: "ended" }));
    });

    socket.on("auction_sold", (data) => {
      setContactCard({
        type: "seller",
        item: data.auctionTitle,
        price: data.finalPrice,
        contact: data.winnerInfo,
      });
      setAuction((prev) => ({ ...prev, status: "ended" }));
    });

    return () => {
      socket.off("new_bid");
      socket.off("outbid_alert");
      socket.off("auction_ending_soon");
      socket.off("auction_won");
      socket.off("auction_sold");
      socket.emit("leave_auction", id);
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
      await api.post("/api/bids/place", {
        auctionId: id,
        amount: Number(bidAmount),
      });
      setBidSuccess("Bid placed!");
      setBidAmount("");
    } catch (err) {
      setBidError(err.response?.data?.message || "Failed to place bid.");
    } finally {
      setBidLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm uppercase tracking-widest animate-pulse">
          Loading auction...
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
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Auction Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-fadeUp">
          <div className="flex items-start justify-between mb-3">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {auction.title}
            </h1>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                auction.status === "active"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-red-50 text-red-500 border border-red-100"
              }`}
            >
              {auction.status}
            </span>
          </div>

          <p className="text-gray-500 text-sm mb-5">{auction.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Starting Price</p>
              <p className="font-display text-xl font-bold text-gray-800">
                Rs. {auction.startPrice?.toLocaleString()}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-emerald-600 text-xs mb-1">Highest Bid</p>
              <p className="font-display text-xl font-bold text-emerald-600">
                Rs. {(auction.currentBid || auction.startPrice)?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <p className="text-amber-600 text-xs mb-1 uppercase tracking-widest font-semibold">
              Time Left
            </p>
            <p className="font-display text-2xl font-bold text-amber-500">
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Place Bid — ✅ Fixed: hidden for auction creator */}
        {auction.status === "active" && user &&
         String(user.id) !== String(auction.createdBy) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-fadeUp">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
              Place Your Bid
            </h2>

            {bidError && (
              <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-2.5 rounded-lg mb-3 text-sm animate-fadeIn">
                {bidError}
              </div>
            )}
            {bidSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-lg mb-3 text-sm animate-fadeIn">
                {bidSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`> Rs. ${(auction.currentBid || auction.startPrice)?.toLocaleString()}`}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
              <button
                onClick={handleBid}
                disabled={bidLoading}
                className="bg-gray-900 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm"
              >
                {bidLoading ? "..." : "Bid Now"}
              </button>
            </div>
          </div>
        )}

        {/* Live Bid Feed */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-fadeUp">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
            Live Feed
          </h2>

          {bids.length === 0 ? (
            <p className="text-gray-400 text-sm">No bids yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    i === 0
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {bid.userId || "Bidder"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {bid.createdAt
                        ? new Date(bid.createdAt).toLocaleTimeString()
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold font-display ${
                      i === 0 ? "text-emerald-600" : "text-gray-500"
                    }`}>
                      Rs. {bid.amount?.toLocaleString()}
                    </p>
                    {i === 0 && (
                      <p className="text-xs text-emerald-400">leading</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Card */}
        {contactCard && (
          <div className="bg-emerald-900 border border-emerald-700 rounded-2xl p-6 animate-fadeUp">
            <h2 className="font-display text-xl font-bold text-emerald-300 mb-1">
              {contactCard.type === "winner" ? "🎉 You Won!" : "💰 Auction Sold!"}
            </h2>
            <p className="text-emerald-100/60 text-sm mb-1">
              Item: <span className="text-white">{contactCard.item}</span>
            </p>
            <p className="text-emerald-100/60 text-sm mb-4">
              Price:{" "}
              <span className="text-emerald-300 font-bold">
                Rs. {contactCard.price?.toLocaleString()}
              </span>
            </p>
            <div className="border-t border-emerald-700 pt-4 space-y-1.5">
              <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2 font-semibold">
                {contactCard.type === "winner" ? "Seller Details" : "Winner Details"}
              </p>
              {["name", "email", "phone", "city"].map((k) => (
                <p key={k} className="text-sm text-emerald-100/60 capitalize">
                  {k}:{" "}
                  <span className="text-white font-medium">
                    {contactCard.contact?.[k] || "—"}
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