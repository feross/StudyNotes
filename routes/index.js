var config = require('../config')
var randomquote = require('../lib/randomquote')
var url = require('url')

module.exports = function (app) {
  require('./admin')(app)
  require('./autocomplete')(app)
  require('./college')(app)
  require('./course')(app)
  require('./essay')(app)
  require('./essay-review')(app)
  require('./home')(app)
  require('./login')(app)
  require('./note')(app)
  require('./notetype')(app)
  require('./order')(app)
  require('./pro')(app)
  require('./redirects')(app)
  require('./search')(app)
  require('./signup')(app)
  require('./static')(app)
  require('./submit')(app)
  require('./user')(app)

  // Error pages -- must be last
  require('./error')(app)

  // Add variables that all templates will expect
  var render = app.render
  app.render = function (view, opts, fn) {
    var req = opts._locals.req

    // Set default template local variables
    opts.view = view
    opts.randomquote = randomquote()
    if (!opts.searchTerm) opts.searchTerm = ''

    opts.loginUrl = '/login/'
    opts.signupUrl = '/signup/'

    if (opts.url) {
      // Make URL absolute
      opts.url = config.siteOrigin + opts.url
      opts.encodedUrl = encodeURIComponent(opts.url)

      // Force trailing slashes in URL
      var u = url.parse(opts.url) // eslint-disable-line node/no-deprecated-api
      if (u.pathname[u.pathname.length - 1] !== '/') {
        u.pathname += '/'
        opts.url = url.format(u)
      }

      var returnTo = '?returnTo=' + encodeURIComponent(opts.url)
      opts.loginUrl += returnTo
      opts.signupUrl += returnTo
    }

    // If rendering a course-related view
    if (opts.course) {
      var tabs = opts.course.notetypes.map(function (notetype) {
        return {
          on: notetype.id === (opts.notetype && opts.notetype.id),
          name: notetype.name,
          url: opts.course.notetypeUrl(notetype)
        }
      })

      opts.hero = {
        image: opts.course.heroImage,
        tabs: tabs,
        title: opts.course.name + ' Notes',
        url: opts.course.url
      }
    } else if ([ 'college', 'college-about', 'essay' ].indexOf(view) !== -1) {
      // If rendering a college-related view
      opts.hero = {
        // desc: 'College Essays That Worked',
        image: opts.college.heroImage,
        tabs: [
          {
            name: opts.college.shortName + ' Essays',
            url: opts.college.url,
            view: ['college', 'essay']
          },
          {
            name: opts.college.shortName + ' Facts',
            url: opts.college.url + 'about/',
            view: 'college-about'
          }
        ],
        title: opts.college.shortName + ' Admissions Essays',
        url: opts.college.url
      }

      if (!req.isAuthenticated() || !req.user.pro) {
        opts.hero.tabs.push({
          name: 'Unlock All Essays',
          url: '/pro/' + opts.college.id + '/'
        })
      }
    } else if (opts.hero && !opts.hero.image) {
      // If rendering any other type of view and heroImage is missing
      opts.hero.image = view + '.jpg'
    }

    opts.cls = opts.cls ? opts.cls + ' ' : ''

    // Add view name as class on <body>
    opts.cls += view + ' ' + req.agent

    // If no hero is on the page, set a special class on <html>
    if (!opts.hero) opts.cls += ' solidHeader'

    // Call the original express render function
    return render.call(this, view, opts, fn)
  }
}
