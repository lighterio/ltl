var ltl = require('../lib/ltl');
var assert = require('assert-plus');

describe('Call', function () {
	it('should have a cache object', function () {
		assert.object(ltl.cache);
	});
	it('should put templates in the cache', function () {
		ltl.compile('b #{text}', {name: 'bold'});
		assert.func(ltl.cache.bold);
	});
	it('should call a template from the middle of another template', function () {
		ltl.compile('p\n call common', {name: 'temp'});
		ltl.compile('b #{text}', {name: 'common'});
		var result = ltl.cache.temp({text: 'Hi!'});
		assert.equal(result, '<p><b>Hi!</b></p>');
	});
	it('should extend a template', function () {
		ltl.compile('call base\n set a\n  p A\n set b\n  p B', {name: 'temp'});
		ltl.compile('div\n get a\n get b', {name: 'base'});
		var result = ltl.cache.temp();
		assert.equal(result, '<div><p>A</p><p>B</p></div>');
	});
	it('should include block content', function () {
		ltl.compile('call base\n set a:\n  A\n set b:\n  B', {name: 'temp'});
		ltl.compile('div\n p\n  get a\n p\n  get b', {name: 'base'});
		var result = ltl.cache.temp();
		assert.equal(result, '<div><p>A</p><p>B</p></div>');
	});
});