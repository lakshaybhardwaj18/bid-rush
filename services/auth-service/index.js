const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log('Request received:', req.method, req.path)
  next()
})

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Auth Service running' })
})

// Routes — mounted at root because gateway already has /api/auth
app.use('/', authRoutes)

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(process.env.PORT, () => {
      console.log(`Auth Service running on port ${process.env.PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error)
  })