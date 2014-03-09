var ltl = require('../lib/ltl');
var assert = require('assert');

describe('API', function () {
	describe('ltl', function () {
		it('should be an object', function () {
			ltl.should.be.an.Object;
		});
	});
	describe('ltl.compile', function () {
		it('should be a function', function () {
			ltl.compile.should.be.a.Function;
		});
	});
	describe('ltl.compile(string)', function () {
		it('should return a function', function () {
			ltl.compile('').should.be.a.Function;
		});
	});
	describe('ltl.setTabWidth(int)', function () {
		it('should modify tab/space leniency', function () {
			ltl.setTabWidth(1);
			var result = ltl.compile('ul\n li\n\tli')();
			assert.equal(result, '<ul><li></li><li></li></ul>');
			ltl.setTabWidth(2);
			var result = ltl.compile('ul\n li\n\tli')();
			assert.equal(result, '<ul><li><li></li></li></ul>');
			ltl.setTabWidth(4);
		});
	});
	describe('ltl.setOutputVar(string)', function () {
		it('should modify output variable', function () {
			ltl.setOutputVar('html');
			var code = ltl.compile('p').toString();
			assert.equal(code, "function (c){var html='<p></p>';return html}");
			ltl.setOutputVar('o');
			var code = ltl.compile('p').toString();
			assert.equal(code, "function (c){var o='<p></p>';return o}");
		});
	});
	describe('ltl.setContextVar(string)', function () {
		it('should modify context variable', function () {
			ltl.setContextVar('context');
			var code = ltl.compile('p').toString();
			assert.equal(code, "function (context){var o='<p></p>';return o}");
			ltl.setContextVar('c');
			var code = ltl.compile('p').toString();
			assert.equal(code, "function (c){var o='<p></p>';return o}");
		});
	});
});