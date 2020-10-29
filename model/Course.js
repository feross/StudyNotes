const mongoose = require('mongoose')
const plugin = require('./plugin')

const Course = new mongoose.Schema({
  _id: {
    type: String
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  shortName: {
    type: String,
    required: true,
    index: true
  },
  searchName: {
    type: String,
    index: true
  },
  desc: String,
  examDate: Date,
  textbook: String, // TODO: support multiple textbooks
  notetypes: [{
    type: String,
    ref: 'Notetype'
  }]
})

Course.virtual('url').get(function () {
  return '/' + this._id + '/'
})

Course.virtual('searchDesc').get(function () {
  return 'Course'
})

Course.virtual('heroImage').get(function () {
  return this._id + '.jpg'
})

Course.methods.notetypeUrl = function (notetypeId) {
  // Support passing in the whole notetype object
  if (notetypeId.id) notetypeId = notetypeId.id

  return '/' + this._id + '/' + notetypeId + '/'
}

Course.plugin(plugin.modifyDate)
Course.plugin(plugin.createDate)
Course.plugin(plugin.absoluteUrl)
Course.plugin(plugin.slug, { model: 'Course' })
Course.plugin(plugin.hits)

module.exports = Course
