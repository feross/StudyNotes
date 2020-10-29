const config = require('../config')
const debug = require('debug')('studynotes:email')
const mailchimp = require('mailchimp-api')
const nodemailer = require('nodemailer')
const secret = require('../secret')

const transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: secret.gmail
})

const mc = new mailchimp.Mailchimp(secret.mailchimp.key)

const FROM = 'Study Notes <feross@studynotes.org>'
const TO = 'Feross Aboukhadijeh <feross@studynotes.org>'

/**
 * Send an email message.
 *
 *   var message = {
 *     from: '"Feross Aboukhadijeh" <feross@studynotes.org>',
 *     to: '"Feross Aboukhadijeh" <feross@studynotes.org>',
 *     subject: 'Subject',
 *     text: '',
 *     html:'<p><b>Hello</b> to myself</p>'
 *   }
 *
 * @param  {Object}   message
 * @param  {function=} cb
 */
exports.send = function (message, cb) {
  if (!cb) {
    cb = function (err) {
      if (err) throw err
    }
  }

  message.from = FROM
  if (!message.to) message.to = TO

  // Disable "X-Mailer: nodemailer (2.6.4)" header
  message.xMailer = false

  message.text += '\n\n' + config.emailFooter

  debug('Sending email: ' + message.subject)

  if (!config.isProd) {
    debug('Skipping email (in dev environment)')
    debug(message.text)
    return cb(null)
  }

  transport.sendMail(message, cb)
}

exports.notifyAdmin = function (subject, obj, cb) {
  if (!cb) {
    cb = function (err) {
      if (err) throw err
    }
  }

  const message = {
    to: TO,
    subject: subject,
    text: obj && JSON.stringify(obj, null, '\t')
  }

  if (obj && obj.name) {
    message.subject += ': ' + obj.name
  }

  if (obj && obj.absoluteUrl) {
    message.text = obj.absoluteUrl + '\n\n' + message.text // prepend
  }

  exports.send(message, cb)
}

exports.subscribeUser = function (user, cb) {
  if (!cb) cb = function () {}

  if (!config.isProd) {
    debug('Skipping MailChimp subscribe (in dev environment)')
    debug(user.email)
    return cb(null)
  }

  mc.lists.subscribe({
    id: secret.mailchimp.list,
    email: { email: user.email },
    merge_vars: {
      FNAME: user.firstName,
      LNAME: user.lastName
    },
    double_optin: false
  }, function (data) {
    cb(null)
  },
  function (error) {
    if (error.error) cb(error.error)
    else cb(new Error('There was an error subscribing the user'))
  })
}
