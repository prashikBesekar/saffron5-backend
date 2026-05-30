const express = require('express')
const router = express.Router()
const CourseContent = require('../models/CourseContent')
const { protectAdmin, protect } = require('../middleware/auth')

// ─── GET course content (public — for course detail page) ───
router.get('/:slug', async (req, res) => {
  try {
    const content = await CourseContent.findOne({
      courseSlug: req.params.slug
    })
    if (!content) {
      return res.json({ modules: [] })
    }
    res.json({ modules: content.modules })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// ─── GET all courses list (admin) ───
router.get('/', protectAdmin, async (req, res) => {
  try {
    const courses = await CourseContent.find().select('courseSlug courseTitle modules')
    res.json({ courses })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// ─── ADD module to a course ───
router.post('/:slug/module', protectAdmin, async (req, res) => {
  try {
    const { courseTitle, moduleTitle } = req.body

    let content = await CourseContent.findOne({ courseSlug: req.params.slug })

    if (!content) {
      content = await CourseContent.create({
        courseSlug: req.params.slug,
        courseTitle,
        modules: [],
      })
    }

    const newModule = {
      title: moduleTitle,
      order: content.modules.length,
      lessons: [],
    }

    content.modules.push(newModule)
    content.updatedAt = Date.now()
    await content.save()

    res.status(201).json({
      message: 'Module added!',
      module: content.modules[content.modules.length - 1],
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// ─── ADD lesson/video to a module ───
router.post('/:slug/module/:moduleId/lesson', protectAdmin, async (req, res) => {
  try {
    const { title, type, duration, videoUrl, videoSource, fileUrl, preview } = req.body

    const content = await CourseContent.findOne({ courseSlug: req.params.slug })
    if (!content) {
      return res.status(404).json({ message: 'Course not found.' })
    }

    const module = content.modules.id(req.params.moduleId)
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' })
    }

    // Extract video ID from URL automatically
    let processedUrl = videoUrl
    if (videoSource === 'youtube' && videoUrl.includes('youtube.com')) {
      const urlParams = new URL(videoUrl)
      processedUrl = urlParams.searchParams.get('v') || videoUrl
    } else if (videoSource === 'youtube' && videoUrl.includes('youtu.be')) {
      processedUrl = videoUrl.split('/').pop()
    }

    module.lessons.push({
      title,
      type: type || 'video',
      duration: duration || '',
      videoUrl: processedUrl,
      videoSource: videoSource || 'youtube',
      fileUrl: fileUrl || '',
      preview: preview || false,
      order: module.lessons.length,
    })

    content.updatedAt = Date.now()
    await content.save()

    res.status(201).json({ message: 'Lesson added successfully!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// ─── DELETE a lesson ───
router.delete('/:slug/module/:moduleId/lesson/:lessonId', protectAdmin, async (req, res) => {
  try {
    const content = await CourseContent.findOne({ courseSlug: req.params.slug })
    if (!content) return res.status(404).json({ message: 'Course not found.' })

    const module = content.modules.id(req.params.moduleId)
    if (!module) return res.status(404).json({ message: 'Module not found.' })

    module.lessons.pull({ _id: req.params.lessonId })
    await content.save()

    res.json({ message: 'Lesson deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// ─── DELETE a module ───
router.delete('/:slug/module/:moduleId', protectAdmin, async (req, res) => {
  try {
    const content = await CourseContent.findOne({ courseSlug: req.params.slug })
    if (!content) return res.status(404).json({ message: 'Course not found.' })

    content.modules.pull({ _id: req.params.moduleId })
    await content.save()

    res.json({ message: 'Module deleted!' })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router