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
router.get('/auctions', getAllAuctions)
router.get('/auctions/my', verifyToken, getMyAuctions)   // must be before /auctions/:id
router.get('/auctions/:id', getAuctionById)

// PROTECTED routes — login required
router.post('/auctions', verifyToken, createAuction)
router.put('/auctions/:id', verifyToken, updateAuction)
router.delete('/auctions/:id', verifyToken, deleteAuction)

// INTERNAL route — Bid Service only
router.put('/auctions/:id/bid', updateBid)

module.exports = router
