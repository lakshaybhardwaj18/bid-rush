const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  placeBid,
  getBidsByAuction,
  getHighestBid,
  getBidsByUser,
} = require('../controllers/bid.controller');

router.use(verifyToken);

router.post('/place', placeBid);
router.get('/auction/:auctionId', getBidsByAuction);
router.get('/highest/:auctionId', getHighestBid);
router.get('/my-bids', getBidsByUser);

module.exports = router;