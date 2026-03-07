// ============================================================
// auth.middleware.js
// COPIED EXACTLY from Member 1's code — do not modify
// He exports { verifyToken } and uses req.user.userId
// ============================================================

const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.replace('Bearer', '').trim()
    console.log('Token received in auction service:', token)
console.log('JWT_SECRET:', process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' })
    }
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = { verifyToken }
