const config = require('../config')
const mongoose = require('mongoose')
const slug = require('slug')
const util = require('../util')
const validate = require('mongoose-validator')

slug.defaults.mode = 'studynotes'
slug.defaults.modes.studynotes = {
  replacement: '-',
  symbols: true,
  remove: /[.]/g,
  lower: true,
  charmap: slug.charmap,
  multicharmap: slug.multicharmap
}

/**
 * Mongoose plugins
 */

exports.modifyDate = function (schema, opts) {
  schema.add({ modifyDate: Date })

  schema.pre('save', function (next) {
    this.modifyDate = new Date()
    next()
  })

  if (opts && opts.index) {
    schema.path('modifyDate').index(opts.index)
  }
}

exports.createDate = function (schema, opts) {
  schema.add({ createDate: Date })

  schema.pre('save', function (next) {
    if (!this.createDate) this.createDate = new Date()
    next()
  })

  if (opts && opts.index) {
    schema.path('createDate').index(opts.index)
  }
}

exports.hits = function (schema) {
  schema.add({ hits: { type: Number, default: 0, index: true } })

  schema.pre('save', function (next) {
    if (!this.hits) this.hits = 0
    next()
  })

  // Update hit count, asyncronously
  schema.methods.hit = function (cb) {
    cb || (cb = function () {})
    this.updateOne({ $inc: { hits: 1 } }, { upsert: true }, cb)
  }
}

exports.absoluteUrl = function (schema) {
  if (schema.virtualpath('url')) {
    schema.virtual('absoluteUrl').get(function () {
      return config.siteOrigin + this.url
    })
  } else {
    throw new Error('Missing url path, so cannot use plugin.absolutePath')
  }
}

/**
 * Automatic slug generation.
 *
 * Pre-save hook to check for existence of an _id. When no _id is set at save
 * time, we automatically generate one which acts as the slug.
 */
exports.slug = function (schema, opts) {
  if (!opts || !opts.model) throw new Error('missing `model` option')
  schema.pre('save', function (next) {
    const self = this
    if (self._id) return next()

    let initialSlug = slug(self.name)
    if (initialSlug.length === 0) initialSlug = 'unicode'

    // Remove words from the end of the slug until the length is okay
    while (initialSlug.length > config.maxSlugLength) {
      initialSlug = initialSlug.replace(/-([^-]*)$/, '')
    }

    let num = 0 // number to append to slug to try to make it unique
    checkSlug(initialSlug)

    function checkSlug (potentialSlug) {
      mongoose.model(opts.model)
        .countDocuments({ _id: potentialSlug })
        .exec(function (err, count) {
          if (err) return next(err)

          if (count === 0) {
            self._id = potentialSlug
            next()
          } else {
            // If slug is taken, try appending a number to end
            num += 1
            checkSlug(initialSlug + '-' + num)
          }
        })
    }
  })
}

exports.body = function (schema, opts) {
  if (!opts || !opts.model) throw new Error('missing `model` option')
  schema.add({
    body: {
      type: String,
      validate: [
        validate({
          validator: 'isLength',
          arguments: 100,
          message: 'You forgot to include the ' + opts.model.toLowerCase() + '.'
        })
      ]
    }
  })
  schema.add({ bodyTruncate: String })

  schema.pre('save', function (next) {
    if (this.isModified('body')) {
      this.body = util.sanitizeHTML(this.body)
      this.bodyTruncate = util.truncate(util.sanitizeHTML(this.body, ['p']), 300).trim()
    }
    next()
  })
}
