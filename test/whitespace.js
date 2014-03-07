var ltl = require('../index');
var assert = require('assert');

describe('Whitespace', function () {
	it('should work with a space', function () {
		var result = ltl.compile('p\n b\n  i')();
		assert.equal(result, '<p><b><i></i></b></p>');
	});
	it('should work with a tab', function () {
		var result = ltl.compile('p\n\tb\n\t\ti')();
		assert.equal(result, '<p><b><i></i></b></p>');
	});
	it('should work with multiple spaces', function () {
		var result = ltl.compile('p\n  b\n    i')();
		assert.equal(result, '<p><b><i></i></b></p>');
	});
	it('should work with multiple tabs', function () {
		var result = ltl.compile('p\n\t\tb\n\t\t\t\ti')();
		assert.equal(result, '<p><b><i></i></b></p>');
	});
});