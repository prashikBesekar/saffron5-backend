const express = require('express')
const router = express.Router()
const Blog = require('../models/Blog')
const { protectAdmin } = require('../middleware/auth')

// ─── GET all blogs for admin (includes drafts) ───────
router.get('/admin/all', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query

    const filter = {}
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Blog.countDocuments(filter)
    const blogs = await Blog.find(filter)
      .select('title slug category language status views createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({ blogs, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) })
  } catch (err) {
    console.error('❌ Admin blogs error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// ─── CREATE blog (admin only) ────────────────────────
router.post('/', protectAdmin, async (req, res) => {
  try {
    console.log('📝 Incoming blog data:', JSON.stringify(req.body, null, 2))

    const {
      title,
      content,
      excerpt,
      category,
      language,
      icon,
      tags,
      status,
      author,
      image,
      imageCaption,
    } = req.body

    // Validation
    if (!title?.trim()) {
      console.warn('⚠️ Title missing')
      return res.status(400).json({ error: 'Title required' })
    }
    if (!content?.trim()) {
      console.warn('⚠️ Content missing')
      return res.status(400).json({ error: 'Content required' })
    }

    console.log('✅ Validation passed')

    // Convert tags to array if string
    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : []

    const blog = new Blog({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || content.substring(0, 150),
      category: category?.trim() || 'General',
      language: language || 'hindi',
      icon: icon || '📝',
      tags: tagsArray,
      status: status || 'published',
      author: author?.trim() || 'Saffron5 Institute',
      image: image?.trim() || null,
      imageCaption: imageCaption?.trim() || null,
      views: 0,
    })

    console.log('💾 Saving to database...')
    await blog.save()
    console.log('✅ Blog saved:', blog._id)

    res.status(201).json({ message: '✅ Blog published!', blog })
  } catch (err) {
    console.error('❌ Create blog error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({
      error: err.message,
      details: err.errors ? Object.keys(err.errors).map(k => `${k}: ${err.errors[k].message}`) : []
    })
    const updateData = {}
if (title) updateData.title = title.trim()
if (content) updateData.content = content.trim()
if (language) updateData.blogLanguage = language  //CHANGED from language
.select('title slug category blogLanguage status views createdAt updatedAt')  
const languages = await Blog.distinct('blogLanguage', { status: 'published' }) 
if (language) filter.blogLanguage = language 
.select('title slug excerpt category blogLanguage icon image imageCaption tags author createdAt views')  
  }
})

// BULK CREATE blogs (admin only) 
router.post('/bulk', protectAdmin, async (req, res) => {
  try {
    const { blogs } = req.body

    if (!blogs || !Array.isArray(blogs) || blogs.length === 0) {
      return res.status(400).json({ message: 'No blogs provided.' })
    }

    const results = []
    const errors = []

    for (const blogData of blogs) {
      try {
        const blog = await Blog.create({
          title: blogData.title,
          content: blogData.content,
          excerpt: blogData.excerpt || '',
          category: blogData.category || 'General',
          language: blogData.language || 'hindi',
          icon: blogData.icon || '📝',
          tags: blogData.tags || [],
          image: blogData.image?.trim() || null,
          imageCaption: blogData.imageCaption?.trim() || null,
          status: blogData.status || 'published',
          author: blogData.author || 'Saffron5 Institute',
        })
        results.push(blog.title)
      } catch (err) {
        errors.push({ title: blogData.title, error: err.message })
      }
    }

    res.status(201).json({
      message: `✅ ${results.length} blogs uploaded successfully!`,
      uploaded: results.length,
      failed: errors.length,
      errors,
    })
  } catch (err) {
    console.error('❌ Bulk upload error:', err.message)
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

// UPDATE blog (admin only) 
router.patch('/:id', protectAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      language,
      icon,
      tags,
      status,
      author,
      image,
      imageCaption,
    } = req.body

    // Convert tags to array if string
    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : []

    const updateData = {}
    if (title) updateData.title = title.trim()
    if (content) updateData.content = content.trim()
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || content?.substring(0, 150)
    if (category) updateData.category = category.trim()
    if (language) updateData.language = language
    if (icon) updateData.icon = icon
    if (tags) updateData.tags = tagsArray
    if (status) updateData.status = status
    if (author) updateData.author = author.trim()
    if (image !== undefined) updateData.image = image?.trim() || null
    if (imageCaption !== undefined) updateData.imageCaption = imageCaption?.trim() || null
    updateData.updatedAt = Date.now()

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!blog) return res.status(404).json({ message: 'Blog not found.' })

    res.json({ message: '✅ Blog updated!', blog })
  } catch (err) {
    console.error('❌ Update blog error:', err.message)
    res.status(500).json({ message: 'Server error.', error: err.message })
  }
})

//  DELETE blog (admin only)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id)
    if (!blog) return res.status(404).json({ message: 'Blog not found.' })

    res.json({ message: '✅ Blog deleted!' })
  } catch (err) {
    console.error('❌ Delete blog error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})


//GET meta (categories & languages) 
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { status: 'published' })
    const languages = await Blog.distinct('language', { status: 'published' })
    const total = await Blog.countDocuments({ status: 'published' })
    res.json({ categories, languages, total })
  } catch (err) {
    console.error('❌ Meta error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})


//GET all published blogs (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      language,
      search,
      status = 'published'
    } = req.query

    // Build filter
    const filter = { status }
    if (category) filter.category = category
    if (language) filter.language = language
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const total = await Blog.countDocuments(filter)
    const blogs = await Blog.find(filter)
      .select('title slug excerpt category language icon image imageCaption tags author createdAt views')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      blogs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    })
  } catch (err) {
    console.error('❌ Get blogs error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// GET single blog by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
    })

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' })
    }

    // Increment views
    blog.views += 1
    await blog.save()

    res.json({ blog })
  } catch (err) {
    console.error('❌ Get blog by slug error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router