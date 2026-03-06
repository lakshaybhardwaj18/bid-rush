const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())

app.get('/', (req, res) => {
  res.json({ message: 'API Gateway running' })
})

app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' }
}))

app.use('/api/auctions', createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  pathRewrite: { '^/api/auctions': '/auctions' }
}))

app.use('/api/bids', createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  pathRewrite: { '^/api/bids': '/bids' }
}))

app.use('/api/notifications', createProxyMiddleware({
  target: 'http://localhost:5004',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/notifications' }
}))

app.listen(5000, () => {
  console.log('API Gateway running on port 5000')
})