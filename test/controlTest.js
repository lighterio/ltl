var ltl = require('../ltl');
var assert = require('assert');

describe('Control', function () {
	describe('for..in', function () {
		it('should iterate over a list', function () {
			var template = ltl.compile('ul\n for item in list\n  li ${item}');
			var result = template({list:['a', 'b']});
			assert.equal(result, '<ul><li>a</li><li>b</li></ul>');
		});
	});
	describe('for..of', function () {
		it('should iterate over an object', function () {
			var template = ltl.compile('ul\n for key, value of object\n  li ${key}: ${value}');
			var result = template({object: {a: 1, b: 2}});
			assert.equal(result, '<ul><li>a: 1</li><li>b: 2</li></ul>');
		});
	});
	describe('if..else', function () {
		it('should evaluate conditions', function () {
			var template = ltl.compile('if a\n a\nelse if b\n b\nelse\n i');
			var result;
			result = template({a: true, b: false});
			assert.equal(result, '<a></a>');
			result = template({a: false, b: true});
			assert.equal(result, '<b></b>');
			result = template({a: false, b: false});
			assert.equal(result, '<i></i>');
		});
		it('should work with strings', function () {
			var template = ltl.compile("if a == 'a'\n a\nelse\n i");
			var result;
			result = template({a: 'a'});
			assert.equal(result, '<a></a>');
			result = template({a: 'b', b: true});
			assert.equal(result, '<i></i>');
		});
	});
});
