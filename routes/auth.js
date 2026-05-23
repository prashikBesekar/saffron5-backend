const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Student = require('../models/Student')
const Admin = require('../models/Admin')

// Helper — generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

// ─── STUDENT REGISTER ───────────────────────────────
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, phone, password, course, state } = req.body

    // Check if already exists
    const exists = await Student.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email already registered.' })
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10)

    // Create student
    const student = await Student.create({
      name, email, phone, password: hashed, course, state,
    })

    res.status(201).json({
      message: 'Registration successful!',
      token: generateToken(student._id, 'student'),
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        course: student.course,
        status: student.status,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// ─── STUDENT LOGIN ───────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const student = await Student.findOne({ email })
    if (!student) {
      return res.status(400).json({ message: 'Invalid email or password.' })
    }

    const match = await bcrypt.compare(password, student.password)
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password.' })
    }

    res.json({
      message: 'Login successful!',
      token: generateToken(student._id, 'student'),
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        course: student.course,
        status: student.status,
        studyMaterials: student.studyMaterials,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// ─── ADMIN LOGIN ─────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials.' })
    }

    const match = await bcrypt.compare(password, admin.password)
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials.' })
    }

    res.json({
      message: 'Admin login successful!',
      token: generateToken(admin._id, 'admin'),
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

module.exports = router