// ============================================================
// auction.controller.js — All business logic
// req.user.userId → comes from Member 1's JWT token
// (he does: jwt.sign({ userId: user._id, email: user.email }, ...))
// ============================================================

const Auction = require('../models/auction.model')

// ---- CREATE AUCTION ----
// POST /auctions  (login required)
const createAuction = async (req, res) => {
  try {
    const { title, description, image, category, startPrice, startTime, endTime } = req.body

    if (!title || !description || !startPrice || !startTime || !endTime || !category) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }

    // Determine status based on startTime
    const now = new Date()
    let status = 'upcoming'
    if (new Date(startTime) <= now) status = 'active'

    const auction = await Auction.create({
      title,
      description,
      image: image || '',
      category,
      startPrice,
      currentBid: startPrice,   // start currentBid at the opening price
      startTime,
      endTime,
      status,
      createdBy: req.user.userId  // ✅ Member 1 stores userId in JWT
    })

    res.status(201).json({ message: 'Auction created successfully', auction })

  } catch (error) {
    console.error('createAuction error:', error)
    res.status(500).json({ message: 'Server error during auction creation' })
  }
}

// ---- GET ALL AUCTIONS ----
// GET /auctions  (public — no login needed)
// Supports filters: ?status=active  ?category=Electronics
const getAllAuctions = async (req, res) => {
  try {
    const query = {}
    if (req.query.status) query.status = req.query.status
    if (req.query.category) query.category = req.query.category

    const auctions = await Auction.find(query).sort({ createdAt: -1 })
    res.status(200).json({ count: auctions.length, auctions })

  } catch (error) {
    console.error('getAllAuctions error:', error)
    res.status(500).json({ message: 'Server error fetching auctions' })
  }
}

// ---- GET SINGLE AUCTION ----
// GET /auctions/:id  (public)
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    res.status(200).json({ auction })

  } catch (error) {
    console.error('getAuctionById error:', error)
    res.status(500).json({ message: 'Server error fetching auction' })
  }
}

// ---- UPDATE AUCTION ----
// PUT /auctions/:id  (login required, only creator can update, only if upcoming)
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    // Check ownership — req.user.userId from JWT vs auction.createdBy in DB
    if (auction.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own auctions' })
    }

    if (auction.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot edit an active or ended auction' })
    }

    const { title, description, image, category, startPrice, startTime, endTime } = req.body

    if (title) auction.title = title
    if (description) auction.description = description
    if (image) auction.image = image
    if (category) auction.category = category
    if (startPrice) auction.startPrice = startPrice
    if (startTime) auction.startTime = startTime
    if (endTime) auction.endTime = endTime

    await auction.save()
    res.status(200).json({ message: 'Auction updated successfully', auction })

  } catch (error) {
    console.error('updateAuction error:', error)
    res.status(500).json({ message: 'Server error updating auction' })
  }
}

// ---- DELETE AUCTION ----
// DELETE /auctions/:id  (login required, only creator, only if upcoming)
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    if (auction.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own auctions' })
    }

    if (auction.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot delete an active or ended auction' })
    }

    await Auction.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Auction deleted successfully' })

  } catch (error) {
    console.error('deleteAuction error:', error)
    res.status(500).json({ message: 'Server error deleting auction' })
  }
}

// ---- UPDATE BID (Internal — called by Member 3's Bid Service ONLY) ----
// PUT /auctions/:id/bid
// Member 3 calls this with header: x-internal-secret
const updateBid = async (req, res) => {
  try {
    // Security check — only Bid Service can call this, not frontend
    const internalSecret = req.headers['x-internal-secret']
    if (internalSecret !== process.env.INTERNAL_SECRET) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const { currentBid, currentBidder } = req.body
    const auction = await Auction.findById(req.params.id)

    if (!auction) return res.status(404).json({ message: 'Auction not found' })
    if (auction.status !== 'active') return res.status(400).json({ message: 'Auction is not active' })

    auction.currentBid = currentBid
    auction.currentBidder = currentBidder
    await auction.save()

    res.status(200).json({ message: 'Bid updated on auction', auction })

  } catch (error) {
    console.error('updateBid error:', error)
    res.status(500).json({ message: 'Server error updating bid' })
  }
}

// ---- GET MY AUCTIONS ----
// GET /auctions/my  (login required)
// Shows all auctions created by the logged-in user (for dashboard)
const getMyAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ createdBy: req.user.userId }).sort({ createdAt: -1 })
    res.status(200).json({ count: auctions.length, auctions })

  } catch (error) {
    console.error('getMyAuctions error:', error)
    res.status(500).json({ message: 'Server error fetching your auctions' })
  }
}

module.exports = { createAuction, getAllAuctions, getAuctionById, updateAuction, deleteAuction, updateBid, getMyAuctions }
