const mongoose = require('mongoose')
const plugin = require('./plugin')

const Notetype = new mongoose.Schema({
  _id: {
    type: String
  },
  name: {
    type: String,
    index: true,
    required: true
  },
  singularName: {
    type: String,
    required: true
  },
  shortDesc: String,
  desc: String,
  hasChapters: Boolean
})

Notetype.plugin(plugin.modifyDate)
Notetype.plugin(plugin.createDate)
Notetype.plugin(plugin.slug, { model: 'Notetype' })

module.exports = Notetype
