var ltl = require('../ltl')

describe('Single quotes', function () {

  it('work in content', function () {
    var result = ltl.compile('p I\'m here!')()
    is(result, '<p>I\'m here!</p>')
  })

  it('work in an id', function () {
    var result = ltl.compile('p#Hawai\'i Aloha')()
    is(result, '<p id="Hawai\'i">Aloha</p>')
  })

  it('work in a class', function () {
    var result = ltl.compile('p.Hawai\'i Aloha')()
    is(result, '<p class="Hawai\'i">Aloha</p>')
  })

  it('work in attributes', function () {
    var result = ltl.compile('img(alt="I\'m an image" src="img.png")')()
    is(result, '<img alt="I\'m an image" src="img.png">')
  })

  it('work without a tag', function () {
    var result = ltl.compile(': I\'m here!')()
    is(result, 'I\'m here!')
  })

  it('work in a block', function () {
    var result = ltl.compile('p:\n I\'m here!')()
    is(result, '<p>I\'m here!</p>')
  })

  it('work in interpolation', function () {
    var result = ltl.compile("p ${'string'}")()
    is(result, '<p>string</p>')
  })

  it('work in interpolated attributes', function () {
    var template = ltl.compile('a(name="${names[\'0\']}") hi')
    var result = template({names: ['hi']})
    is(result, '<a name="hi">hi</a>')
  })

})
