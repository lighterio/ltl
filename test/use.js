var ltl = require('../lib/ltl');
var assert = require('assert-plus');

describe('Includes', function () {
	it('should have a cache object', function () {
		assert.object(ltl.cache);
	});
	it('should put templates in the cache', function () {
		ltl.compile('b #{text}', {key: 'bold'});
		assert.func(ltl.cache.bold);
	});
	it('should include templates', function () {
		var temp = ltl.compile('p\n use common', {key: 'temp'});
		ltl.compile('b #{text}', {key: 'common'});
		var result = ltl.cache.temp({text: 'Hi!'});
		assert.equal(result, '<p><b>Hi!</b></p>');
	});
	it('should include templates', function () {
		var temp = ltl.compile('use base\n set a\n  p A\n set b\n  p B', {key: 'temp'});
		var base = ltl.compile('div\n get a\n get b', {key: 'base'});
		var result = ltl.cache.temp();
		assert.equal(result, '<div><p>A</p><p>B</p></div>');
	});
});