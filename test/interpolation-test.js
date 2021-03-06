var ltl = require('../ltl')

describe('Interpolation', function () {
  it('does not stateify Math', function () {
    var template = ltl.compile('for n in list\n . sqrt(={n}): ={Math.sqrt(n).toFixed(4)}')
    var result = template({list:[1, 2, 3]})
    is(result, '<div>sqrt(1): 1.0000</div><div>sqrt(2): 1.4142</div><div>sqrt(3): 1.7321</div>')
  })

  it('supports html-escaped output', function () {
    var result = ltl.compile('p ${text}')({text: '<&>'})
    is(result, '<p>&lt;&></p>')
  })

  it('supports uri-encoded output', function () {
    var result = ltl.compile('a(href="?q=&{query}") ${query}\np &{query}')({query: 'ltl templates'})
    is(result, '<a href="?q=ltl%20templates">ltl templates</a><p>ltl%20templates</p>')
  })

  it('supports raw output', function () {
    var result = ltl.compile('p ={text}')({text: '<&>'})
    is(result, '<p><&></p>')
  })

  it('works in a block', function () {
    var result = ltl.compile('p:\n ${text}')({text: 'Should be <escaped>.'})
    is(result, '<p>Should be &lt;escaped>.</p>')
    result = ltl.compile('p:\n ={text}')({text: 'Should be <unescaped>.'})
    is(result, '<p>Should be <unescaped>.</p>')
  })

  it('is be escapable', function () {
    var result = ltl.compile('code:\n \\${a}\n \\={b}')()
    is(result, '<code>${a}\n={b}</code>')
  })
})
