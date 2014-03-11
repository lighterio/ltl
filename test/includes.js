var ltl = require('../lib/ltl');
var assert = require('assert-plus');

describe('Includes', function () {
	it('should have a cache object', function () {
		assert.object(ltl.cache);
	});
	it('should put templates in the cache', function () {
		ltl.compile('b #{text}', {path: 'bold'});
		assert.func(ltl.cache.bold);
	});
});