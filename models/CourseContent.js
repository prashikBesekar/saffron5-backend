const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'assignment'], default: 'video' },
  duration: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  videoSource: {
    type: String,
    enum: ['youtube', 'googledrive', 'vimeo', 'direct', 'other'],
    default: 'youtube',
  },
  fileUrl: { type: String, default: '' },
  preview: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: [lessonSchema],
})

const courseContentSchema = new mongoose.Schema({
  courseSlug: {
    type: String,
    required: true,
    unique: true,
  },
  courseTitle: { type: String, required: true },
  modules: [moduleSchema],
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('CourseContent', courseContentSchema)