const express = require('express')
const router = express.Router()
const Application = require('../models/Application')
const Student = require('../models/Student')
const bcrypt = require('bcryptjs')
const { protectAdmin } = require('../middleware/auth')

// Get all applications
router.get('/applications', protectAdmin, async (req, res) => {
  try {
    const applications = await Application.find()
      .sort({ createdAt: -1 })
    res.json({ applications })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// Update application status
router.patch('/applications/:id', protectAdmin, async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    res.json({ message: 'Status updated!', application })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// Get all students
router.get('/students', protectAdmin, async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json({ students })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// Get dashboard stats
router.get('/stats', protectAdmin, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments()
    const totalApplications = await Application.countDocuments()
    const newApplications = await Application.countDocuments({ status: 'new' })
    const enrolled = await Application.countDocuments({ status: 'enrolled' })

    res.json({
      totalStudents,
      totalApplications,
      newApplications,
      enrolled,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// Create first admin (run once only)
router.post('/setup', async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body

    if (setupKey !== 'SAFFRON5SETUP2026') {
      return res.status(403).json({ message: 'Invalid setup key.' })
    }

    const exists = await require('../models/Admin').findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Admin already exists.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const admin = await require('../models/Admin').create({
      name, email, password: hashed,
    })

    res.status(201).json({ message: 'Admin created!', admin: { name: admin.name, email: admin.email } })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// Approve student and unlock course
router.post('/enroll-student', protectAdmin, async (req, res) => {
  try {
    const { applicationId, studentEmail, studentPhone, courseName } = req.body

    // 1. Update application status to enrolled
    await Application.findByIdAndUpdate(applicationId, {
      status: 'enrolled'
    })

    // 2. Find student account by email or phone
    let student = await Student.findOne({
      $or: [
        { email: studentEmail },
        { phone: studentPhone }
      ]
    })

    // 3. If student has an account — update their status
    if (student) {
      await Student.findByIdAndUpdate(student._id, {
        status: 'approved',
        course: courseName,
      })

      return res.json({
        message: `✅ Student enrolled successfully! Course unlocked for ${student.name}.`,
        hasAccount: true,
        studentName: student.name,
      })
    }

    // 4. If no account yet — just update application
    return res.json({
      message: `✅ Application marked as enrolled. Student needs to register at /register to access course.`,
      hasAccount: false,
    })

  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

module.exports = router