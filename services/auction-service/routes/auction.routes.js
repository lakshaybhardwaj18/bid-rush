// ============================================================
// auction.routes.js — Maps URLs to controller functions
// Follows same style as Member 1's auth.routes.js
// ============================================================

const express = require('express')
const router = express.Router()
const { createAuction, getAllAuctions, getAuctionById, updateAuction, deleteAuction, updateBid, getMyAuctions } = require('../controllers/auction.controller')
// ✅ Using { verifyToken } — EXACTLY matching Member 1's export name
const { verifyToken } = require('../middleware/auth.middleware')
// PUBLIC routes — no login needed
router.get('/api/auctions', getAllAuctions)
router.get('/api/auctions/my', verifyToken, getMyAuctions)
router.get('/api/auctions/:id', getAuctionById)
//router.get('/api/auctions/transactions/my', verifyToken, getMyTransactions)
// PROTECTED routes — login required
router.post('/api/auctions', verifyToken, createAuction)
router.put('/api/auctions/:id', verifyToken, updateAuction)
router.delete('/api/auctions/:id', verifyToken, deleteAuction)
// INTERNAL route — Bid Service only
router.put('/api/auctions/:id/bid', updateBid)
module.exports = router
