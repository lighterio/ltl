var ltl = require('../ltl');
var assert = require('assert');

describe('Interpolation', function () {
	it('should not contextify Math', function () {
		var template = ltl.compile('for n in list\n . sqrt(={n}): ={Math.sqrt(n).toFixed(4)}');
		var result = template({list:[1, 2, 3]});
		assert.equal(result, '<div>sqrt(1): 1.0000</div><div>sqrt(2): 1.4142</div><div>sqrt(3): 1.7321</div>');
	});
	it('should support html-escaped output', function () {
		var result = ltl.compile('p ${text}')({text: '<&>'});
		assert.equal(result, '<p>&lt;&></p>');
	});
	it('should support raw output', function () {
		var result = ltl.compile('p ={text}')({text: '<&>'});
		assert.equal(result, '<p><&></p>');
	});
	it('should work in a block', function () {
		var result = ltl.compile('p:\n ${text}')({text: 'Should be <escaped>.'});
		assert.equal(result, '<p>Should be &lt;escaped>.</p>');
		var result = ltl.compile('p:\n ={text}')({text: 'Should be <unescaped>.'});
		assert.equal(result, '<p>Should be <unescaped>.</p>');
	});
	it('should be escapable', function () {
		var result = ltl.compile('code:\n \\${a}\n \\={b}')();
		assert.equal(result, '<code>${a}\n={b}</code>');
	});
});
