'use strict'
/* global describe it is */
var ltl = require('../ltl')

describe('Control', function () {
  describe('for..in', function () {
    it('iterates over a list', function () {
      var template = ltl.compile('ul\n for item in list\n  li ${item}')
      var result = template({list: ['a', 'b']})
      is(result, '<ul><li>a</li><li>b</li></ul>')
    })
  })

  describe('for..of', function () {
    it('iterates over an object', function () {
      var template = ltl.compile('ul\n for key, value of object\n  li ${key}: ${value}')
      var result = template({object: {a: 1, b: 2}})
      is(result, '<ul><li>a: 1</li><li>b: 2</li></ul>')
    })
  })

  describe('if..else', function () {
    it('evaluates conditions', function () {
      var template = ltl.compile('if a\n a\nelse if b\n b\nelse\n i')
      var result
      result = template({a: true, b: false})
      is(result, '<a></a>')
      result = template({a: false, b: true})
      is(result, '<b></b>')
      result = template({a: false, b: false})
      is(result, '<i></i>')
    })

    it('works with strings', function () {
      var template = ltl.compile("if a === 'a'\n a\nelse\n i")
      var result
      result = template({a: 'a'})
      is(result, '<a></a>')
      result = template({a: 'b', b: true})
      is(result, '<i></i>')
    })
  })

  describe('break', function () {
    it('adds a break statement', function () {
      var template = ltl.compile('if a\n a\nelse if b\n b\nelse\n i')
      var result
      result = template({a: true, b: false})
      is(result, '<a></a>')
      result = template({a: false, b: true})
      is(result, '<b></b>')
      result = template({a: false, b: false})
      is(result, '<i></i>')
    })
  })
})
