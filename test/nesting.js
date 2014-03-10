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
	describe('Non-closing tags', function () {
		it('should not close', function () {
			var result = ltl.compile('p\n br\n hr\n img\n input')();
			assert.equal(result, '<p><br><hr><img><input></p>');
		});
	});
	describe('Absent parent', function () {
		it('should just output children', function () {
			var result = ltl.compile('b\nb')();
			assert.equal(result, '<b></b><b></b>');
			var result = ltl.compile('b\n i\nb\n i')();
			assert.equal(result, '<b><i></i></b><b><i></i></b>');
		});
	});
	describe('Inline', function () {
		it('should work with spaces and tabs', function () {
			var result;
			result = ltl.compile('p:b test')();
			assert.equal(result, '<p><b>test</b></p>');
			result = ltl.compile('p: b test')();
			assert.equal(result, '<p><b>test</b></p>');
			result = ltl.compile('p:  b test')();
			assert.equal(result, '<p><b>test</b></p>');
			result = ltl.compile('p:\tb test')();
			assert.equal(result, '<p><b>test</b></p>');
		});
		it('should nest to multiple levels', function () {
			var result;
			result = ltl.compile('p:b:i')();
			assert.equal(result, '<p><b><i></i></b></p>');
		});
		it('should not interfere with other nesting', function () {
			var result;
			result = ltl.compile('.\n p:b\n br\n p:b')();
			assert.equal(result, '<div><p><b></b></p><br><p><b></b></p></div>');
		});
	});
});
	