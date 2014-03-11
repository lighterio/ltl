var ltl = require('../lib/ltl');
var assert = require('assert-plus');

describe('Includes', function () {
	it('should have a templates object', function () {
		assert.object(ltl.templates);
	});
	it('should put templates at paths', function () {
		ltl.compile('b #{text}', {path: 'bold'});
		assert.func(ltl.templates.bold);
	});
});