var ltl = require('../ltl');
var assert = require('assert');

describe('Blocks', function () {
	it('should work in the middle', function () {
		var result = ltl.compile('br\nscript:\n var a = 1;\n var b = 2;\nbr')();
		assert.equal(result, '<br><script>var a = 1;\nvar b = 2;</script><br>');
	});
	it('should work at the beginning and end', function () {
		var result = ltl.compile('script:\n var a = 1;\n var b = 2;')();
		assert.equal(result, '<script>var a = 1;\nvar b = 2;</script>');
	});
	it('should work with markdown', function () {
		var result = ltl.compile('p:markdown\n Heading\n =====')();
		var hasHeading = /<h1>Heading<\/h1>/.test(result);
		assert(hasHeading);
	});
	it('should work without a tag', function () {
		var result = ltl.compile(':markdown\n Heading\n =====')();
		var hasHeading = /<h1>Heading<\/h1>/.test(result);
		assert(hasHeading);
		var startsWithDiv = /^<div>/.test(result);
		assert(startsWithDiv);
	});
	it('should work with CoffeeScript', function () {
		var result = ltl.compile('script:coffee-script\n a = 1')();
		var hasVar = /var/.test(result);
		assert(hasVar);
	});
	it('should work with text with line breaks', function () {
		var result = ltl.compile('p:\n First line.\n Second line.')();
		assert.equal(result, '<p>First line.\nSecond line.</p>');
	});
	it('should remove carriage returns and indentation', function () {
		var result = ltl.compile('p:\n\r First line.\r\n Second line.')();
		assert.equal(result, '<p>First line.\nSecond line.</p>');
	});
	it('should work with attributes', function () {
		var result = ltl.compile('textarea(rows=3 cols=40):\n 1. Collect underpants\n 2. ?\n 3. Profit!')();
		assert.equal(result, '<textarea rows=3 cols=40>1. Collect underpants\n2. ?\n3. Profit!</textarea>');
	});
	it('should work in the browser', function () {
		global.window = {
			document: {body: {tagName: 'BODY'}},
			uppercaser: function (text) {
				return text.toUpperCase();
			}
		};
		var result = ltl.compile('b:uppercaser\n boom')();
		assert.equal(result, '<b>BOOM</b>');
		delete global.window;
	});
	it('should throw an exception for unknown filters', function () {
		var error;
		try {
			ltl.compile('p:OMGWTFBBQ\n text')();
		}
		catch (e) {
			error = e;
		}
		assert(error);
	});
});