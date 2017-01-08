var ltl = require('../ltl')

after(function () {
  delete process.ltl
  delete global.window
})

describe('API', function () {

  describe('ltl', function () {
    it('is an object', function () {
      is.object(ltl)
    })
  })

  describe('ltl.setOption("space", string)', function () {
    it('modifies the space variable', function () {
      ltl.setOption('space', '\t')
      var result = ltl.compile('.\n p hi')()
      is(result, '<div>\n\t<p>hi</p>\n</div>')
      delete ltl.options.space
    })
  })

  describe('ltl.compile', function () {
    it('is a function', function () {
      is.function(ltl.compile)
    })
  })

  describe('ltl.compile(string)', function () {
    it('returns a template function', function () {
      is.function(ltl.compile(''))
    })
  })

})
