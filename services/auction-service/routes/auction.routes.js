const express = require('express')
const router = express.Router()

const { createAuction, getAllAuctions, getAuctionById, updateAuction, deleteAuction, updateBid, getMyAuctions, adminDeleteAuction } = require('../controllers/auction.controller')
const { verifyToken } = require('../middleware/auth.middleware')

// ADMIN route - must be FIRST before /:id catches it
router.delete('/api/auctions/admin/:id', adminDeleteAuction)

// PUBLIC routes
router.get('/api/auctions', getAllAuctions)
router.get('/api/auctions/my', verifyToken, getMyAuctions)
router.get('/api/auctions/:id', getAuctionById)

// PROTECTED routes
router.post('/api/auctions', verifyToken, createAuction)
router.put('/api/auctions/:id', verifyToken, updateAuction)
router.delete('/api/auctions/:id', verifyToken, deleteAuction)

// INTERNAL route - Bid Service only
router.put('/api/auctions/:id/bid', updateBid)

module.exports = router

