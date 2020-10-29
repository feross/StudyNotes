const auto = require('run-auto')
const model = require('../model')
const url = require('url')

/**
 * Middleware to check if a user just signed up for Pro and upgrade their
 * logged in account so their Pro status is permanent.
 */
exports.checkPro = function (req, res, next) {
  if (!req.session.pro) return next()

  if (!req.isAuthenticated()) {
    if (req.url.indexOf('/signup/') !== 0 && req.url.indexOf('/login/') !== 0) {
      // Is there a registered user with the same email used for Stripe?
      // If so, we want them to encourage them to link their account by
      // redirecting to login page. They are still free to sign up for a new
      // account if they want.

      const params = url.parse(req.url, true).search || '' // eslint-disable-line node/no-deprecated-api

      model.User
        .findOne({ email: req.session.pro.email })
        .exec(function (err, user) {
          if (!err && user) res.redirect('/login/' + params)
          else res.redirect('/signup/' + params)
        })
      return
    } else {
      return next()
    }
  }

  auto({
    makeUserPro: function (cb) {
      req.user.pro = true
      req.user.save(cb)
    },

    order: function (cb) {
      model.Order
        .findOne({ _id: req.session.pro.orderId })
        .exec(cb)
    },

    linkOrderToUser: ['order', function (r, cb) {
      r.order.user = req.user.id
      r.order.save(cb)
    }]

  }, function (err) {
    if (err) return next(err)

    delete req.session.pro
    next()
  })
}
