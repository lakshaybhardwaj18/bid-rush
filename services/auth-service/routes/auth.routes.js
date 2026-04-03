const express = require('express')
const router = express.Router()
const {
  register,
  login,
  getUserById,
  getProfile
} = require('../controllers/auth.controller')
const { verifyToken } = require('../middleware/auth.middleware')

// Internal service middleware
const internalAuth = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret && secret === process.env.INTERNAL_SECRET) {
    return next();
  }
  return verifyToken(req, res, next);
};

router.post('/register', register)
router.post('/login', login)
router.get('/profile', verifyToken, getProfile)
router.get('/user/:id', internalAuth, getUserById)  // ← changed this line

module.exports = router