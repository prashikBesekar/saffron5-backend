const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // your React app
  credentials: true,
}))
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://saffron5-institute.netlify.app', // your netlify URL
    'https://institute.saffron5health.com',   // your real domain
  ],
  credentials: true,
}))

// Routes (we'll add these soon)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/course-content', require('./routes/courseContent'))

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ Saffron5 Backend is running!' })
})

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected!')
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err)
  })