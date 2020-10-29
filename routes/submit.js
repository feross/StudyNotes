const auth = require('../lib/auth')
const auto = require('run-auto')
const mail = require('../lib/mail')
const model = require('../model')

module.exports = function (app) {
  app.get('/submit/essay', auth.ensureAuth, function (req, res) {
    res.render('submit-essay', {
      hero: {
        title: 'Add an essay to Study Notes',
        desc: 'Help everyone write a powerful essay, regardless of their background.',
        image: 'amjed.jpg',
        url: '#'
      },
      title: 'Submit an essay',
      url: '/submit/essay',
      searchFocus: false,

      essay: req.flash('essay')[0],
      errors: req.flash('error')
    })
  })

  app.post('/submit/essay', auth.ensureAuth, function (req, res, next) {
    const college = model.cache.colleges[req.body.college]
    if (!college) {
      req.flash('error', 'Please select a university from the list.')
      req.flash('essay', req.body)
      return res.redirect('/submit/essay/')
    }
    const isEdit = req.body._id

    auto({
      essay: function (cb) {
        if (isEdit) {
          model.Essay
            .findById(req.body._id)
            .exec(cb)
        } else {
          cb(null, new model.Essay())
        }
      },
      permission: ['essay', function (r, cb) {
        if (!r.essay) return cb(new Error('No essay with id ' + req.body._id))

        if (!r.essay.user || // new note, no permission needed
            r.essay.user.id === req.user.id || // same user
            req.user.admin) { // admin
          cb(null)
        } else {
          cb(new Error('Cannot edit another user\'s essay'))
        }
      }],
      save: ['permission', function (r, cb) {
        const essay = r.essay

        essay.name = req.body.name
        essay.prompt = req.body.prompt
        essay.body = req.body.body
        essay.college = college._id
        essay.anon = !!req.body.anon

        essay.user = essay.user || req.user._id

        essay.save(cb)
      }]
    }, function (err, r) {
      if (err && err.name === 'ValidationError') {
        Object.values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('essay', req.body)
        res.redirect('/submit/essay/')
      } else if (err) {
        next(err)
      } else {
        res.redirect(r.essay.url)
        if (!isEdit) mail.notifyAdmin('New essay', r.essay)
      }
    })
  })

  app.get('/submit/note', auth.ensureAuth, function (req, res) {
    res.render('submit-note', {
      hero: {
        title: 'Add a note to Study Notes',
        desc: 'Help future generations of AP students. Share your notes.',
        image: 'clouds.jpg',
        url: '#'
      },
      title: 'Submit a note',
      url: '/submit/note',
      searchFocus: false,

      note: req.flash('note')[0],
      errors: req.flash('error')
    })
  })

  app.post('/submit/note', auth.ensureAuth, function (req, res, next) {
    const course = model.cache.courses[req.body.course]
    if (!course) {
      req.flash('error', 'Please select a course from the list.')
      req.flash('note', req.body)
      return res.redirect('/submit/note/')
    }
    const notetype = course.notetypes.filter(function (n) {
      return n.id === req.body.notetype
    })[0]
    if (!notetype) {
      req.flash('error', 'Please select a note type from the list.')
      req.flash('note', req.body)
      return res.redirect('/submit/note/')
    }
    const isEdit = req.body._id

    auto({
      note: function (cb) {
        if (isEdit) {
          model.Note
            .findById(req.body._id)
            .exec(cb)
        } else {
          cb(null, new model.Note())
        }
      },
      permission: ['note', function (r, cb) {
        if (!r.note) return cb(new Error('No note with id ' + req.body._id))

        if (!r.note.user || // new note, no permission needed
            r.note.user.id === req.user.id || // same user
            req.user.admin) { // admin
          cb(null)
        } else {
          cb(new Error('Cannot edit another user\'s note'))
        }
      }],
      save: ['permission', function (r, cb) {
        const note = r.note

        note.name = req.body.name
        note.body = req.body.body
        note.course = course.id
        note.notetype = notetype.id
        note.anon = !!req.body.anon

        note.user = note.user || req.user.id

        note.save(cb)
      }]
    }, function (err, r) {
      if (err && err.name === 'ValidationError') {
        Object.values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('note', req.body)
        res.redirect('/submit/note/')
      } else if (err) {
        next(err)
      } else {
        if (isEdit) {
          res.redirect(r.note.url)
        } else {
          req.flash('note', {
            course: r.note.course,
            notetype: r.note.notetype
          })
          res.redirect('/submit/note/')
          mail.notifyAdmin('New note', r.note)
        }
      }
    })
  })
}
