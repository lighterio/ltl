var ltl = require('../lib/ltl');
var assert = require('assert');

describe('Nesting', function () {
	describe('Two children', function () {
		it('should be adjacent', function () {
			var result = ltl.compile('ul\n li\n li')();
			assert.equal(result, '<ul><li></li><li></li></ul>');
		});
	});
	describe('Single parents', function() {
		it('should each have a child', function() {
			var result = ltl.compile('ul\n li\nul\n li')();
			assert.equal(result, '<ul><li></li></ul><ul><li></li></ul>');
		});
	});
	describe('Unbalanced tree', function () {
		it('should be unbalanced', function () {
			var result = ltl.compile('ul\n li\nul')();
			assert.equal(result, '<ul><li></li></ul><ul></ul>');
		});
	});
	describe('Many levels', function () {
		it('should be nested', function () {
			var result = ltl.compile('b\n b\n  b\n   b\n')();
			assert.equal(result, '<b><b><b><b></b></b></b></b>');
		});
	});
});