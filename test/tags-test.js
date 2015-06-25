var ltl = require('../ltl')

describe('Tags', function () {

  describe('<div> assumption', function () {

    it('assumes <div> when using an ID with no tag', function () {
      var result = ltl.compile('#a')()
      is(result, '<div id="a"></div>')
    })

    it('assumes <div> when using a class with no tag', function () {
      var result = ltl.compile('.b')()
      is(result, '<div class="b"></div>')
    })

    it('assumes <div> when using an ID and class with no tag', function () {
      var result = ltl.compile('#a.b')()
      is(result, '<div id="a" class="b"></div>')
    })

    it('assumes <div> when using multiple classes with no tag', function () {
      var result = ltl.compile('.b.c')()
      is(result, '<div class="b c"></div>')
    })

    it('assumes <div> when using attributes with no tag', function () {
      var result = ltl.compile('(style="color:#f00")')()
      is(result, '<div style="color:#f00"></div>')
    })

    it('assumes <div> when there\'s just a dot', function () {
      var result = ltl.compile('.')()
      is(result, '<div></div>')
    })

    it('assumes <div> when there\'s just a hash', function () {
      var result = ltl.compile('#')()
      is(result, '<div></div>')
    })

    it('assumes <div> when there\'s empty attributes', function () {
      var result = ltl.compile('()')()
      is(result, '<div></div>')
    })
  })

  describe('IDs and classes', function () {

    it('work with a tag and ID', function () {
      var result = ltl.compile('a#a')()
      is(result, '<a id="a"></a>')
    })

    it('work with a tag and class', function () {
      var result = ltl.compile('i.icon')()
      is(result, '<i class="icon"></i>')
    })

    it('work with a tag, id and class', function () {
      var result = ltl.compile('i#save.icon')()
      is(result, '<i id="save" class="icon"></i>')
    })

    it('work with a class before an id', function () {
      var result = ltl.compile('i.icon#save')()
      is(result, '<i id="save" class="icon"></i>')
    })

  })

  describe('attributes', function () {

    it('end automagically when they\'re unclosed', function () {
      var result = ltl.compile('(blah')()
      is(result, '<div blah></div>')
    })

    it('work alone', function () {
      var result = ltl.compile('a(href="/")')()
      is(result, '<a href="/"></a>')
    })

    it('work with multiple attributes', function () {
      var result = ltl.compile('a(href="/" style="color:#00f;")')()
      is(result, '<a href="/" style="color:#00f;"></a>')
    })

    it('work with single and double quoted attributes', function () {
      var result = ltl.compile('a(href=\'/\' style="color:#00f;")')()
      is(result, '<a href=\'/\' style="color:#00f;"></a>')
    })

    it('work with valueless attributes', function () {
      var result = ltl.compile('input(checked)')()
      is(result, '<input checked>')
    })

    it('work with valued and valueless attributes', function () {
      var result = ltl.compile('input(type="checkbox" checked)')()
      is(result, '<input type="checkbox" checked>')
    })

    it('work with valueless and valued attributes', function () {
      var result = ltl.compile('input(checked type="checkbox")')()
      is(result, '<input checked type="checkbox">')
    })

    it('work with escaped single quotes.', function () {
      var result = ltl.compile('img(alt="The \"quoted\" text")')()
      is(result, '<img alt="The \"quoted\" text">')
    })

    it('work with escaped double quotes.', function () {
      var result = ltl.compile("img(alt='The \'quoted\' text')")()
      is(result, "<img alt='The \'quoted\' text'>")
    })

    it('ignore stuff after attributes.', function () {
      var result = ltl.compile('p(id="p")stuff blah')()
      is(result, '<p id="p">blah</p>')
    })

  })

})
