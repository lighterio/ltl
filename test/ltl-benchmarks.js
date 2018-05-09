var fs = require('fs')
var ltl = require('../ltl')
require('marko/node-require').install()
var dot = require('dot')
var jade = require('jade')
var bench = global.bench || function () {}

var testMarko = 1

describe('Message and 10-item list', function () {
  var templates = {}

  bench('compiling', function () {
    this.timeout(1e4)
    it('Ltl', function () {
      templates.Ltl = ltl.compile(
        'html\n' +
        ' head\n' +
        '  title Hello World\n' +
        ' body\n' +
        '  div#hey.a.b Here\'s my message: ={message}\n' +
        '  ul\n' +
        '   for item in items\n' +
        '    li ={item}')
    })

    it('Marko', function () {
      var path = __dirname + '/benchmarks/template.marko'
      templates.Marko = require(path)
      delete require.cache[path]
    })

    it('doT', function () {
      templates.doT = dot.compile(
        '<!DOCTYPE html><html><head><title>Hello World</title></head>' +
        '<body><div id="hey" class="a b">' +
        'Here\'s my message: {{=it.message}}</div><ul>{{' +
        'var a=it.items;for(var i=0,l=a.length;i<a.length;++i){ }}' +
        '<li>{{=a[i]}}</li>{{ } }}</ul></body></html>')
    })

    it('Jade', function () {
      templates.Jade = jade.compile(
        'doctype html\n' +
        'html\n' +
        ' head\n' +
        '  title Hello World\n' +
        ' body\n' +
        '  div#hey.a.b Here\'s my message: #{message}\n' +
        '  ul\n' +
        '   each item in items\n' +
        '    li #{item}')
    })
  })

  bench('rendering', function () {
    var state = {
      message: 'hello',
      items: ['apples', 'apricots', 'bananas', 'cherries', 'grapes', 'kiwis', 'mangoes', 'oranges', 'pears', 'plums']
    }

    // Localize variables to minimize inner work.
    var ltl = templates.Ltl
    var marko = templates.Marko
    var dot = templates.doT
    var jade = templates.Jade

    // Make sure the templates output the same content.
    var html = ltl(state)
    is(marko.renderSync(state), html)
    is(dot(state), html)
    is(jade(state), html)

    // Render the Ltl template.
    it('Ltl', function () {
      ltl(state)
    })

    // Render the doT template.
    it('doT', function () {
      dot(state)
    })

    // Render the Jade template.
    it('Jade', function () {
      jade(state)
    })

    // Render the Marko template.
    it('Marko', function () {
      marko.renderSync(state)
    })
  })
})
