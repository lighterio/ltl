'use strict'
/* global describe it is */
var ltl = require('../ltl')

var PBI = '<p><b><i></i></b></p>'
var PBIT = '<p><b><i>text</i></b></p>'

describe('Whitespace', function () {
  it('works with spaces', function () {
    var result
    result = ltl.compile('p\n b\n  i')()
    is(result, PBI)
    result = ltl.compile('p\n  b\n    i')()
    is(result, PBI)
  })

  it('works with tabs', function () {
    var result
    result = ltl.compile('p\n\tb\n\t\ti')()
    is(result, PBI)
    result = ltl.compile('p\n\t\tb\n\t\t\t\ti')()
    is(result, PBI)
  })

  it('works with double and triple line breaks', function () {
    var result
    result = ltl.compile('p\n\n b\n  i')()
    is(result, PBI)
    result = ltl.compile('p\n\n\n b\n  i')()
    is(result, PBI)
  })

  it('works with carriage returns', function () {
    var result = ltl.compile('p\n\r\n b\n  i')()
    is(result, PBI)
  })

  it('works with surrounding whitespace', function () {
    var result
    result = ltl.compile('\np\n\n b\n  i')()
    is(result, PBI)
    result = ltl.compile('p\n\n b\n  i\n')()
    is(result, PBI)
    result = ltl.compile('\np\n\n b\n  i\n')()
    is(result, PBI)
  })

  it('works with mixed tabs and spaces', function () {
    ltl.setOption('tabWidth', 2)
    var result = ltl.compile('p\n\n\tb\n    i')()
    is(result, PBI)
  })

  it('trims whitespace', function () {
    var result
    result = ltl.compile('p\n\n b\n  i text')()
    is(result, PBIT)
    result = ltl.compile('p\n\n b\n  i  text')()
    is(result, PBIT)
    result = ltl.compile('p\n\n b\n  i text ')()
    is(result, PBIT)
    result = ltl.compile('p\n\n b\n  i  text ')()
    is(result, PBIT)
    result = ltl.compile('p\n\n b\n  i \ttext\t')()
    is(result, PBIT)
    result = ltl.compile('p\n\n b\n  i\ttext\t')()
    is(result, PBIT)
  })

  it('handles extra whitespace', function () {
    var result = ltl.compile('p\n\n b\n      i text')()
    is(result, PBIT)
  })
})

describe('options.space', function () {
  it('inserts spaces', function () {
    var result = ltl.compile('p\n b\n  i text\n br\n', {space: '  '})()
    is(result, '<p>\n  <b>\n    <i>text</i>\n  </b>\n  <br>\n</p>')
  })

  it('inserts tabs', function () {
    var result = ltl.compile('p\n i text', {space: '\t'})()
    is(result, '<p>\n\t<i>text</i>\n</p>')
  })

  it('works with DOCTYPE', function () {
    var result = ltl.compile('html\n head>title Hi\n body Hello', {space: '\t'})()
    is(result, '<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<title>Hi</title>\n\t</head>\n\t<body>Hello</body>\n</html>')
  })

  it('works with an opening comment', function () {
    var result = ltl.compile('// comment\np Hello', {space: '\t'})()
    is(result, '<p>Hello</p>')
  })

  it('indents blocks', function () {
    var result = ltl.compile('p:\n Hello', {space: '\t'})()
    is(result, '<p>\n\tHello\n</p>')
  })

  it('works with tagless blocks', function () {
    var result = ltl.compile(':\n blah', {space: ' '})()
    is(result, 'blah')
  })

  it('works with comments', function () {
    var result = ltl.compile('br\n- text\nbr', {space: '  '})()
    is(result, '<br>\n<!--text-->\n<br>')
  })

  it('inserts spaces', function () {
    var result = ltl.compile('p\n b\n  i text\n br\n', {space: '  '})()
    is(result, '<p>\n  <b>\n    <i>text</i>\n  </b>\n  <br>\n</p>')
  })
})

describe('space tag', function () {
  it('inserts a space', function () {
    var result = ltl.compile('space')()
    is(result, ' ')
  })

  it('inserts content after itself', function () {
    var result = ltl.compile('space this')()
    is(result, ' this')
  })

  it('inserts nested content after itself', function () {
    var result = ltl.compile('space\n b bold')()
    is(result, ' <b>bold</b>')
  })

  it('works with inline nesting', function () {
    var result = ltl.compile('space>b bold')()
    is(result, ' <b>bold</b>')
  })

  it('works between tags', function () {
    var result = ltl.compile('a ok\nspace\na ok')()
    is(result, '<a>ok</a> <a>ok</a>')
  })

  it('works under a tag', function () {
    var result = ltl.compile('p\n space')()
    is(result, '<p> </p>')
  })

  it('works with content and nesting', function () {
    var result = ltl.compile('p Hello,\n space\n b ${who}\n : !')({who: 'World'})
    is(result, '<p>Hello, <b>World</b>!</p>')
  })
})
