const express = require('express')
const router = express.Router()
const {
  register,
  login,
  getUserById,
  getProfile
} = require('../controllers/auth.controller')
const { verifyToken } = require('../middleware/auth.middleware')

router.post('/register', register)
router.post('/login', login)
router.get('/profile', verifyToken, getProfile)
router.get('/user/:id', verifyToken, getUserById)

module.exports = router