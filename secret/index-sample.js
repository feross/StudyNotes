//
// REMEMBER TO MANUALLY UPLOAD THIS TO THE SERVER
//

exports.cookieSecret = 'TODO'

exports.gmail = {
  user: 'TODO',
  pass: 'TODO'
}

// Keep here, because circular dep
const config = require('../config')

exports.stripe = config.isProd
  ? 'TODO'
  : 'TODO'

exports.mongo = {
  host: config.isProd ? 'TODO' : 'TODO',
  port: 'TODO',
  database: 'TODO'
}

exports.mailchimp = {
  key: 'TODO',
  list: 'TODO'
}

exports.rollbar = {
  accessToken: 'TODO'
}
