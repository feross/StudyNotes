const $ = require('jquery')
window.jQuery = window.$ = $

require('transparency')
require('select2')

const cookies = require('cookies-js')

const config = require('../config')
const fastclick = require('fastclick')
const key = require('keymaster')
const notify = require('./notify')
const throttle = require('throttleit')
const url = require('url')
const util = require('../util')

// Configure cookie-js
cookies.defaults.secure = config.isProd
cookies.defaults.expires = 60 * 60 * 24 * 365 // 1 year

// Configure
$.ajaxSetup({
  // Disable caching of XHR GET responses globally
  // (workaround for jQuery callbacks not firing if the response was cached)
  cache: false,

  // Send CSRF token with XHR requests
  beforeSend: function (xhr, settings) {
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
      // Only send the token to relative URLs i.e. locally.
      xhr.setRequestHeader('X-CSRF-Token', $('input[name="_csrf"]').val())
    }
  }
})

$(document).ajaxError(function () {
  notify.big.error('Error contacting the server. Please try again!')
})

// require('./ad-pollfish')
require('./ads')
require('./browse')
require('./Countdown')
require('./editor')
require('./metrics')
require('./order')
require('./search')
require('./share')
require('./socket')
require('./submit')
require('./toolbar')

const EVENT_THROTTLE = 100

// Remove 300ms tap delay on iOS
fastclick(document.body)

const $window = $(window)

// Make external links open in new window
$('a[href^="http:"], a[href^="https:"]')
  .not('a[href^="' + config.siteOrigin + '"]')
  .attr('target', '_blank')
  .attr('rel', 'noopener')

// Logout via XHR POST
$('.logout').on('click', function (e) {
  e.preventDefault()
  $.post('/logout/')
    .done(function () {
      const url = util.addQueryParams(window.location.href, {
        info: 'You are logged out!'
      })
      window.location = url
    })
})

function onResize () {
  window.updateSearchWidth()
  window.toolbarOnScroll()
}
$window.on('resize', throttle(onResize, EVENT_THROTTLE))

/**
 * Browser scroll event
 */
function onScroll () {
  window.toolbarOnScroll()
  window.closeBrowseMenus()
  window.hideAutocomplete()
}
$window.on('scroll', throttle(onScroll, EVENT_THROTTLE))

/**
 * Filter keystrokes from keymaster when user is searching.
 * https://github.com/madrobby/keymaster
 */
const $search = $('.header .search')
key.filter = function () {
  return !$search.hasClass('searching')
}

key('left', function () {
  const $prev = $('.after-content .prev')
  if ($prev.length) {
    window.location = $prev.attr('href')
  }
})
key('right', function () {
  const $next = $('.after-content .next')
  if ($next.length) {
    window.location = $next.attr('href')
  }
})

$window.on('load', function () {
  onResize()
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(function (registration) {
      })
      .catch(function (err) {
        console.error('service worker failed')
        console.error(err)
      })
  }
})

// "Welcome back" message
if (cookies.get('returning') && // this is a returning visitor
    url.parse(document.referrer).host !== window.location.host) { // eslint-disable-line node/no-deprecated-api
  notify.big.info('Welcome back!', { timeout: 2000 })
}

cookies.set('returning', true)

// Page view count
const pageViewCount = Number(cookies.get('page_view_count') || 0)
cookies.set('page_view_count', pageViewCount + 1)

const match = /(success|error|info)=([^?&]+)/g.exec(window.location.search)
const msgType = match && match[1]
const msg = match && match[2]
if (msgType && msg) {
  notify.big[msgType](window.decodeURIComponent(msg))
  window.history.replaceState(null, null, window.location.pathname)
}

$(function () {
  $('.notify').each(function () {
    const $item = $(this)
    if ($item.hasClass('notify-success')) {
      notify.big.success($item.text())
    } else if ($item.hasClass('notify-error')) {
      notify.big.error($item.text())
    } else {
      notify.big.info($item.text())
    }
  })
})

// View-specific code
const className = $('html').attr('class').split(' ')
if (className.indexOf('home') >= 0) require('./views/home')()
if (className.indexOf('admin') >= 0) require('./views/admin')()
if (className.indexOf('essay-review') >= 0) require('./views/essay-review')()
