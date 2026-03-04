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
  pathRewrite: { '^/api/auth': '/api/auth' },
   on: {
    proxyReq: (proxyReq, req) => {
      if (req.headers['authorization']) {
        proxyReq.setHeader('authorization', req.headers['authorization'])
      }
    }
  }
}))

app.use('/api/auctions', createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  pathRewrite: { '^/api/auctions': '/api/auctions' }
}))

app.use('/api/bids', createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  pathRewrite: { '^/api/bids': '/api/bids' }
}))

app.use('/api/notifications', createProxyMiddleware({
  target: 'http://localhost:5004',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' }
}))

app.listen(5000, () => {
  console.log('API Gateway running on port 5000')
})