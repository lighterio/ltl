var ltl = require('../lib/ltl');
var assert = require('assert');

describe('Tags', function () {
	describe('<div> assumption', function () {
		it('should assume <div> when using an ID with no tag', function () {
			var result = ltl.compile('#a')();
			assert.equal(result, '<div id="a"></div>');
		});
		it('should assume <div> when using a class with no tag', function () {
			var result = ltl.compile('.b')();
			assert.equal(result, '<div class="b"></div>');
		});
		it('should assume <div> when using an ID and class with no tag', function () {
			var result = ltl.compile('#a.b')();
			assert.equal(result, '<div id="a" class="b"></div>');
		});
		it('should assume <div> when using multiple classes with no tag', function () {
			var result = ltl.compile('.b.c')();
			assert.equal(result, '<div class="b c"></div>');
		});
		it('should assume <div> when using attributes with no tag', function () {
			var result = ltl.compile('(style="color:#f00")')();
			assert.equal(result, '<div style="color:#f00"></div>');
		});
		it('should assume <div> when there\'s just a dot', function () {
			var result = ltl.compile('.')();
			assert.equal(result, '<div></div>');
		});
		it('should assume <div> when there\'s just a hash', function () {
			var result = ltl.compile('#')();
			assert.equal(result, '<div></div>');
		});
		it('should assume <div> when there\'s empty attributes', function () {
			var result = ltl.compile('()')();
			assert.equal(result, '<div></div>');
		});
		it('should turn ! or doctype into !doctype and assume html', function () {
			var result = ltl.compile('html\n head\n  title Title\n body Body')();
			assert.equal(result, '<!DOCTYPE html><html><head><title>Title</title></head><body>Body</body></html>');
			var result = ltl.compile('!DOCTYPE(test)\nhtml\n head\n  title Title\n body Body')();
			assert.equal(result, '<!DOCTYPE test><html><head><title>Title</title></head><body>Body</body></html>');
		});
	});
	describe('IDs and classes', function () {
		it('should work with a tag and ID', function () {
			var result = ltl.compile('a#a')();
			assert.equal(result, '<a id="a"></a>');
		});
		it('should work with a tag and class', function () {
			var result = ltl.compile('i.icon')();
			assert.equal(result, '<i class="icon"></i>');
		});
		it('should work with a tag, id and class', function () {
			var result = ltl.compile('i#save.icon')();
			assert.equal(result, '<i id="save" class="icon"></i>');
		});
	});
	describe('Attributes', function () {
		it('should fail when attributes are unclosed', function () {
			var failed = false;
			try {
				ltl.compile('(blah');
			}
			catch (e) {
				failed = true;
			}
			assert(failed);
		});
		it('should work alone', function () {
			var result = ltl.compile('a(href="/")')();
			assert.equal(result, '<a href="/"></a>');
		});
		it('should work with multiple attributes', function () {
			var result = ltl.compile('a(href="/" style="color:#00f;")')();
			assert.equal(result, '<a href="/" style="color:#00f;"></a>');
		});
		it('should work with single and double quoted attributes', function () {
			var result = ltl.compile('a(href=\'/\' style="color:#00f;")')();
			assert.equal(result, '<a href=\'/\' style="color:#00f;"></a>');
		});
		it('should work with valueless attributes', function () {
			var result = ltl.compile('input(checked)')();
			assert.equal(result, '<input checked>');
		});
		it('should work with valued and valueless attributes', function () {
			var result = ltl.compile('input(type="checkbox" checked)')();
			assert.equal(result, '<input type="checkbox" checked>');
		});
		it('should work with valueless and valued attributes', function () {
			var result = ltl.compile('input(checked type="checkbox")')();
			assert.equal(result, '<input checked type="checkbox">');
		});
		it('should work with escaped single quotes.', function () {
			var result = ltl.compile('img(alt="The \"quoted\" text")')();
			assert.equal(result, '<img alt="The \"quoted\" text">');
		});
		it('should work with escaped double quotes.', function () {
			var result = ltl.compile("img(alt='The \'quoted\' text')")();
			assert.equal(result, "<img alt='The \'quoted\' text'>");
		});
	});
});