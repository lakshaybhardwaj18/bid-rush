const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    console.log('Auth header received:', authHeader)
    console.log('JWT_SECRET:', process.env.JWT_SECRET)

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    console.log('Token extracted:', token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('Decoded:', decoded)
    
    req.user = decoded
    next()

  } catch (error) {
    console.log('JWT Error:', error.message)
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = { verifyToken }
