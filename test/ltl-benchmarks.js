'use strict'
/* global describe it bench after */
var ltl = require('../ltl')
var jade = require('jade')
var dot = require('dot')

describe('Message and 10-item list', function () {
  var templates = {}

  bench('compiling', function () {
    it('Ltl', function () {
      templates.Ltl = ltl.compile(
        'html\n' +
        ' head\n' +
        '  title Hello World\n' +
        ' body\n' +
        '  div#hey.a.b(style="display:block; width:100px") Here\'s my message: ={message}\n' +
        '  ul\n' +
        '   for item in items\n' +
        '    li ={item}')
    })

    it('doT', function () {
      templates.doT = dot.compile(
        '<!DOCTYPE html><html><head><title>Hello World</title></head>' +
        '<body><div id="hey" class="a b" style="display:block;width:100px">' +
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
        '  div#hey.a.b(style="display:block; width:100px") Here\'s my message: #{message}\n' +
        '  ul\n' +
        '   each item in items\n' +
        '    li #{item}')
    })

    var i = 0
    after(function () {
      if (!i++) {
        // alert(templates.Ltl.toString())
        // alert(templates.doT.toString())
        // alert(templates.Jade.toString())

        var t = templates.Ltl.toString().replace(/^.*?\{(.*)\}$/, '$1')
        t = t.replace(/scope/g, 's')
        t = t.replace(/ltl0/g, 'a')
        t = t.replace(/ltl1/g, 'b')
        t = t.replace(/ltl2/g, 'c')
        t = t.replace(/output/g, 'o')
        t = t.replace(/o+='([^']*)';return o/, "return o+'$1'")
      }
    })

    /*
    it('JSX', function () {
      templates.JSX = require('jsx').compile(
        '<!DOCTYPE html><html><head><title>Hello World</title></head>' +
        '<body><div id="hey" class="a b" style="display:block;width:100px">' +
        'Here\'s my message: {object.message}</div><ul>\n' +
        'for(var i=0;i<object.items.length;++i){\n' +
        '<li>{object.items[i]}</li>\n' +
        '}\n' +
        '</ul></body></html>')
    })
    */
  })

  bench('rendering', function () {
    var state = {
      message: 'hello',
      items: ['apples', 'apricots', 'bananas', 'cherries', 'grapes', 'kiwis', 'mangoes', 'oranges', 'pears', 'plums']
    }

    it('Ltl', function () {
      templates.Ltl(state)
    })

    it('doT', function () {
      templates.doT(state)
    })

    it('Jade', function () {
      templates.Jade(state)
    })
  })
})
