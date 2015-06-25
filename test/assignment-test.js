var ltl = require('../ltl')

describe('Assigment', function () {

  it('sets keys in a state', function () {
    var template = ltl.compile('x = 1\np ={x}')
    var result = template({})
    is(result, '<p>1</p>')
  })

  it('overwrites keys', function () {
    var template = ltl.compile('x = 2\np ={x}')
    var result = template({x: 1})
    is(result, '<p>2</p>')
  })

  it('sets single-quoted strings', function () {
    var template = ltl.compile("x = 'x'\np ={x}")
    var result = template({})
    is(result, '<p>x</p>')
  })

  it('sets double-quoted strings', function () {
    var template = ltl.compile('x = "x"\np ={x}')
    var result = template({})
    is(result, '<p>x</p>')
  })

  /*
  it('works with empty states', function () {
    var template = ltl.compile('x = 1\np ={x}')
    var result = template()
    is(result, '<p>1</p>')
  })
  */

})
