const $ = require('jquery')

$('select[name="course"]').on('change', function (e, force) {
  if (!e.added && !force) return

  const course = $('select[name="course"] option:selected').val()
  const $notetype = $('select[name="notetype"]')

  $notetype
    .removeAttr('disabled')
    .children()
    .remove()
    .end()
    .append($('<option>'))

  $('select[name="allNotetypes"] option').each(function (i, opt) {
    const $opt = $(opt)
    if ($opt.data('course') === course) {
      $opt.clone().appendTo($notetype)
    }
  })

  $notetype.trigger('change')
})

$(function () {
  if ($('select[name="course"] option:selected').val()) {
    $('select[name="course"]').trigger('change', true)
  }
})
