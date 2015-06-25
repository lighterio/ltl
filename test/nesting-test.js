var ltl = require('../ltl')

describe('Nesting', function () {

  describe('Two children', function () {

    it('are adjacent', function () {
      var result = ltl.compile('ul\n li\n li')()
      is(result, '<ul><li></li><li></li></ul>')
    })

  })

  describe('Single parents', function() {

    it('each have a child', function() {
      var result = ltl.compile('ul\n li\nul\n li')()
      is(result, '<ul><li></li></ul><ul><li></li></ul>')
    })

  })

  describe('Unbalanced tree', function () {

    it('is unbalanced', function () {
      var result = ltl.compile('ul\n li\nul')()
      is(result, '<ul><li></li></ul><ul></ul>')
    })

  })

  describe('Multiple levels', function () {

    it('are nested', function () {
      var result = ltl.compile('b\n b\n  b\n   b\n')()
      is(result, '<b><b><b><b></b></b></b></b>')
    })

  })

  describe('Non-closing tags', function () {

    it('do not close', function () {
      var result = ltl.compile('p\n br\n hr\n img\n input')()
      is(result, '<p><br><hr><img><input></p>')
    })

  })

  describe('Top-level siblings', function () {

    it('have no parent', function () {
      var result
      result = ltl.compile('b\nb')()
      is(result, '<b></b><b></b>')
      result = ltl.compile('b\n i\nb\n i')()
      is(result, '<b><i></i></b><b><i></i></b>')
    })

  })

  describe('Inline tags', function () {

    it('work with spaces and tabs', function () {
      var result
      result = ltl.compile('p>b test')()
      is(result, '<p><b>test</b></p>')
      result = ltl.compile('p> b test')()
      is(result, '<p><b>test</b></p>')
      result = ltl.compile('p>  b test')()
      is(result, '<p><b>test</b></p>')
      result = ltl.compile('p>\tb test')()
      is(result, '<p><b>test</b></p>')
    })

    it('nest to multiple levels', function () {
      var result
      result = ltl.compile('p>b>i')()
      is(result, '<p><b><i></i></b></p>')
    })

    it('do not interfere with other nesting', function () {
      var result
      result = ltl.compile('.\n p>b\n br\n p>b')()
      is(result, '<div><p><b></b></p><br><p><b></b></p></div>')
    })

  })

})
