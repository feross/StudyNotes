/*jslint node: true */
"use strict";

module.exports = function (app) {
  app.get('/plagiarism', function (req, res) {
    res.render('plagiarism', {
      url: '/plagiarism',
      title: 'Our Stance on Plagiarism',
      hero: {
        title: 'Our Stance on Plagiarism',
        desc: 'Don\'t do it!'
      }
    })
  })
}