const model = require('./')
const mongoose = require('mongoose')
const plugin = require('./plugin')
const validate = require('mongoose-validator')
const util = require('../util')

const Essay = new mongoose.Schema({
  _id: {
    type: String
  },
  name: {
    type: String,
    index: true,
    required: 'Your essay needs a title, silly!',
    validate: [
      validate({
        validator: 'isLength',
        arguments: 1,
        message: 'Your essay needs a title, silly!'
      })
    ]
  },
  prompt: String,
  bodyPaywall: String,
  college: {
    type: 'String',
    ref: 'College',
    index: true,
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    index: true,
    required: true
  },
  admitsphere: Boolean,
  anon: Boolean,
  published: Boolean
})

// Trim whitespace
Essay.pre('validate', function (next) {
  const self = this
  if (typeof self.name === 'string') self.name = self.name.trim()
  next()
})

Essay.virtual('url').get(function () {
  const self = this
  const collegeSlug = self.populated('college') || self.college
  return '/' + collegeSlug + '/' + self._id + '/'
})

Essay.virtual('searchDesc').get(function () {
  const self = this
  const collegeSlug = self.populated('college') || self.college
  const college = model.cache.colleges[collegeSlug]

  return college.shortName + ' Admissions Essay'
})

// Sanitize essay to strip bad html before saving
Essay.pre('save', function (next) {
  const self = this
  if (self.isModified('prompt')) self.prompt = util.sanitizeHTML(self.prompt)

  if (self.isModified('body')) {
    const html = util.convertToPaywallText(self.body, 2)
    self.bodyPaywall = html
  }
  next()
})

Essay.plugin(plugin.body, { model: 'Essay' })
Essay.plugin(plugin.modifyDate)
Essay.plugin(plugin.createDate)
Essay.plugin(plugin.absoluteUrl)
Essay.plugin(plugin.slug, { model: 'Essay' })
Essay.plugin(plugin.hits)

module.exports = Essay
