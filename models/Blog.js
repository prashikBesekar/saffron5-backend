const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    category: { type: String, default: 'General' },
    blogLanguage: {
      type: String,
      enum: ['hindi', 'english', 'marathi', 'gujarati', 'other'],
      default: 'hindi',
    },
    icon: { type: String, default: '📝' },
    image: { type: String, default: null },
    imageCaption: { type: String, default: null },
    tags: [String],
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    views: { type: Number, default: 0 },
    author: { type: String, default: 'Saffron5 Institute' },
  },
  { timestamps: true }
)

// AUTO GENERATE SLUG AND EXCERPT
blogSchema.pre('save', async function() {
  try {
    // Generate slug
    if (this.isNew || this.isModified('title')) {
      const slug = this.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0900-\u097F\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      this.slug = slug + '-' + Date.now()
      console.log('✅ Slug generated:', this.slug)
    }

    // Generate excerpt
    if (!this.excerpt && this.content) {
      this.excerpt = this.content.substring(0, 200).trim() + '...'
      console.log('✅ Excerpt generated')
    }
  } catch (err) {
    console.error('❌ Pre-save error:', err)
    throw err
  }
})

module.exports = mongoose.model('Blog', blogSchema)