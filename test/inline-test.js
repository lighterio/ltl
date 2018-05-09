'use strict'
/* global describe it is */
var ltl = require('../ltl')

describe('Inline JS', function () {
  it('works with a js tag', function () {
    var template = ltl.compile('js\n scope.a = 1;\n: ${a}')
    var result = template({})
    is(result, '1')
  })

  it('works with a coffee tag', function () {
    var template = ltl.compile('coffee\n scope.a = 1\n: ${a}')
    var result = template({})
    is(result, '1')
  })
})

describe('Inline CSS', function () {
  it('works with a css tag', function () {
    var template = ltl.compile('css\n p{color:black}')
    var result = template()
    is(result, '<style>p{color:black}</style>')
  })

  it('works with a less tag', function () {
    var template = ltl.compile('less\n @base: black;\n p {\n  color: @base;\n }')
    var result = template()
    is.in(result, 'black')
    is.notIn(result, 'base')
  })
})
