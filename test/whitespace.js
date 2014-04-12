var ltl = require('../ltl');
var assert = require('assert');

var PBI = '<p><b><i></i></b></p>';
var PBIT = '<p><b><i>text</i></b></p>';

describe('Whitespace', function () {
	it('should work with spaces', function () {
		var result = ltl.compile('p\n b\n  i')();
		assert.equal(result, PBI);
		var result = ltl.compile('p\n  b\n    i')();
		assert.equal(result, PBI);
	});
	it('should work with tabs', function () {
		var result = ltl.compile('p\n\tb\n\t\ti')();
		assert.equal(result, PBI);
		var result = ltl.compile('p\n\t\tb\n\t\t\t\ti')();
		assert.equal(result, PBI);
	});
	it('should work with double and triple line breaks', function () {
		var result = ltl.compile('p\n\n b\n  i')();
		assert.equal(result, PBI);
		var result = ltl.compile('p\n\n\n b\n  i')();
		assert.equal(result, PBI);
	});
	it('should work with carriage returns', function () {
		var result = ltl.compile('p\n\r\n b\n  i')();
		assert.equal(result, PBI);
	});
	it('should work with surrounding whitespace', function () {
		var result = ltl.compile('\np\n\n b\n  i')();
		assert.equal(result, PBI);
		var result = ltl.compile('p\n\n b\n  i\n')();
		assert.equal(result, PBI);
		var result = ltl.compile('\np\n\n b\n  i\n')();
		assert.equal(result, PBI);
	});
	it('should work with mixed tabs and spaces', function () {
		ltl.setTabWidth(2);
		var result = ltl.compile('p\n\n\tb\n    i')();
		assert.equal(result, PBI);
	});
	it('should trim whitespace', function () {
		var result = ltl.compile('p\n\n b\n  i text')();
		assert.equal(result, PBIT);
		var result = ltl.compile('p\n\n b\n  i  text')();
		assert.equal(result, PBIT);
		var result = ltl.compile('p\n\n b\n  i text ')();
		assert.equal(result, PBIT);
		var result = ltl.compile('p\n\n b\n  i  text ')();
		assert.equal(result, PBIT);
		var result = ltl.compile('p\n\n b\n  i \ttext\t')();
		assert.equal(result, PBIT);
		var result = ltl.compile('p\n\n b\n  i\ttext\t')();
		assert.equal(result, PBIT);
	});
	it('should handle extra whitespace', function () {
		var result = ltl.compile('p\n\n b\n      i text')();
		assert.equal(result, PBIT);
	});
});