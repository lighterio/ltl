var ltl = require('../lib/ltl');
var assert = require('assert');

describe('Tags', function () {
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
	it('should work with attributes', function () {
		var result = ltl.compile('a(href="/")')();
		assert.equal(result, '<a href="/"></a>');
	});
});