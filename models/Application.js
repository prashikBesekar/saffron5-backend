const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  course: { type: String, required: true },
  fee: { type: String, default: '' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  qualification: { type: String, default: '' },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'enrolled', 'rejected'],
    default: 'new',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Application', applicationSchema)