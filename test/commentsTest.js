var ltl = require('../ltl');
var assert = require('assert');

describe('Ltl comments', function () {
	it('should be omitted', function () {
		var result = ltl.compile('// Comment')();
		assert.equal(result, '');
		var result = ltl.compile('p before\n// Comment\np after')();
		assert.equal(result, '<p>before</p><p>after</p>');
	});
	it('should be omitted as a block', function () {
		var result = ltl.compile('//\n Comment')();
		assert.equal(result, '');
	});
	it('should be omitted as a block with indentation', function () {
		var result = ltl.compile('//\n List\n  * Item 1\n  * Item 2\n\n Blah\n Blah')();
		assert.equal(result, '');
	});
	it('should not treat a URL as a comment', function () {
		var result = ltl.compile('h1 Comments\n// Hidden\np http://lighter.io/ltl\n //\n  block\n  hide')();
		assert.equal(result, '<h1>Comments</h1><p>http://lighter.io/ltl</p>');
	});
});

describe('HTML comments', function () {
	it('should work on a single line', function () {
		var result = ltl.compile('- Comment')();
		assert.equal(result, '<!--Comment-->');
	});
	it('should work on multiple lines', function () {
		var result = ltl.compile('-\n p Hide')();
		assert.equal(result, '<!--<p>Hide</p>-->');
	});
});