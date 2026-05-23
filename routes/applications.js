const express = require('express')
const router = express.Router()
const Application = require('../models/Application')
const { protect } = require('../middleware/auth')

// Submit new application (public)
router.post('/', async (req, res) => {
  try {
    const application = await Application.create(req.body)
    res.status(201).json({
      message: 'Application submitted successfully!',
      application,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// Get my application status (student only)
router.get('/my-status', protect, async (req, res) => {
  try {
    const applications = await Application.find({
      phone: req.user.phone
    }).sort({ createdAt: -1 })

    res.json({ applications })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router