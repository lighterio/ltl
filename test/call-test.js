'use strict'
/* global describe it is */
var ltl = require('../ltl')

describe('@', function () {
  it('has a cache object', function () {
    is.object(ltl.cache)
  })

  it('has templates in the cache', function () {
    ltl.compile('b ${text}', {name: 'bold'})
    is.function(ltl.cache.bold)
  })

  it('calls a template from the middle of another template', function () {
    ltl.compile('p\n @common(text=text)', {name: 'temp'})
    ltl.compile('b ${text}', {name: 'common'})
    var result = ltl.cache.temp({text: 'Hi!'})
    is(result, '<p><b>Hi!</b></p>')
  })

  it('allows attributes to be passed', function () {
    ltl.compile('p\n @hi(greet="Hi" name=who)', {name: 'temp'})
    ltl.compile('b ${greet} ${name}!', {name: 'hi'})
    var result = ltl.cache.temp({who: 'Sam'})
    is(result, '<p><b>Hi Sam!</b></p>')
  })

  it('extends a template', function () {
    ltl.compile('@base\n p A', {name: 'temp'})
    ltl.compile('div ={block}', {name: 'base'})
    var result = ltl.cache.temp()
    is(result, '<div><p>A</p></div>')
  })
})
