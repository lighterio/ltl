var ltl = require('../ltl');
var assert = require('assert');

describe('Tags', function () {
  describe('<div> assumption', function () {
    it('should assume <div> when using an ID with no tag', function () {
      var result = ltl.compile('#a')();
      is(result, '<div id="a"></div>');
    });
    it('should assume <div> when using a class with no tag', function () {
      var result = ltl.compile('.b')();
      is(result, '<div class="b"></div>');
    });
    it('should assume <div> when using an ID and class with no tag', function () {
      var result = ltl.compile('#a.b')();
      is(result, '<div id="a" class="b"></div>');
    });
    it('should assume <div> when using multiple classes with no tag', function () {
      var result = ltl.compile('.b.c')();
      is(result, '<div class="b c"></div>');
    });
    it('should assume <div> when using attributes with no tag', function () {
      var result = ltl.compile('(style="color:#f00")')();
      is(result, '<div style="color:#f00"></div>');
    });
    it('should assume <div> when there\'s just a dot', function () {
      var result = ltl.compile('.')();
      is(result, '<div></div>');
    });
    it('should assume <div> when there\'s just a hash', function () {
      var result = ltl.compile('#')();
      is(result, '<div></div>');
    });
    it('should assume <div> when there\'s empty attributes', function () {
      var result = ltl.compile('()')();
      is(result, '<div></div>');
    });
  });
  describe('IDs and classes', function () {
    it('should work with a tag and ID', function () {
      var result = ltl.compile('a#a')();
      is(result, '<a id="a"></a>');
    });
    it('should work with a tag and class', function () {
      var result = ltl.compile('i.icon')();
      is(result, '<i class="icon"></i>');
    });
    it('should work with a tag, id and class', function () {
      var result = ltl.compile('i#save.icon')();
      is(result, '<i id="save" class="icon"></i>');
    });
    it('should work with a class before an id', function () {
      var result = ltl.compile('i.icon#save')();
      is(result, '<i id="save" class="icon"></i>');
    });
  });
  describe('attributes', function () {
    it('should end attributes when they\'re unclosed', function () {
      var result = ltl.compile('(blah')();
      is(result, '<div blah></div>');
    });
    it('should work alone', function () {
      var result = ltl.compile('a(href="/")')();
      is(result, '<a href="/"></a>');
    });
    it('should work with multiple attributes', function () {
      var result = ltl.compile('a(href="/" style="color:#00f;")')();
      is(result, '<a href="/" style="color:#00f;"></a>');
    });
    it('should work with single and double quoted attributes', function () {
      var result = ltl.compile('a(href=\'/\' style="color:#00f;")')();
      is(result, '<a href=\'/\' style="color:#00f;"></a>');
    });
    it('should work with valueless attributes', function () {
      var result = ltl.compile('input(checked)')();
      is(result, '<input checked>');
    });
    it('should work with valued and valueless attributes', function () {
      var result = ltl.compile('input(type="checkbox" checked)')();
      is(result, '<input type="checkbox" checked>');
    });
    it('should work with valueless and valued attributes', function () {
      var result = ltl.compile('input(checked type="checkbox")')();
      is(result, '<input checked type="checkbox">');
    });
    it('should work with escaped single quotes.', function () {
      var result = ltl.compile('img(alt="The \"quoted\" text")')();
      is(result, '<img alt="The \"quoted\" text">');
    });
    it('should work with escaped double quotes.', function () {
      var result = ltl.compile("img(alt='The \'quoted\' text')")();
      is(result, "<img alt='The \'quoted\' text'>");
    });
    it('should ignore crap after attributes.', function () {
      var result = ltl.compile('p(id="p")crap blah')();
      is(result, '<p id="p">blah</p>');
    });
  });
  describe('magic', function () {
    it('should auto-insert <!DOCTYPE html>', function () {
      var result = ltl.compile('html\n head\n  title Title\n body Body')();
      is(result, '<!DOCTYPE html><html><head><title>Title</title></head><body>Body</body></html>');
    });
    it('should allow doctypes other than html', function () {
      var result = ltl.compile('!DOCTYPE(test)\nhtml\n head\n  title Title\n body Body')();
      is(result, '<!DOCTYPE test><html><head><title>Title</title></head><body>Body</body></html>');
    });
    it('should turn ! or doctype into <!DOCTYPE> and assume html', function () {
      var result = ltl.compile('!')();
      is(result, '<!DOCTYPE html>');
      var result = ltl.compile('doctype')();
      is(result, '<!DOCTYPE html>');
    });
    it('should allow other doctypes', function () {
      var result = ltl.compile('!(svg)')();
      is(result, '<!DOCTYPE svg>');
      var result = ltl.compile('!DOCTYPE(svg)')();
      is(result, '<!DOCTYPE svg>');
    });
    it('should omit tag with a tagless block', function () {
      var result = ltl.compile('p\n :\n  hi')();
      is(result, '<p>hi</p>');
    });
  });
});
