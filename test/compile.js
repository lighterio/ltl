var ltl = require('../lib/ltl');

describe('ltl', function(){
	it('should be an object', function() {
		ltl.should.be.an.Object;
	});
	describe('.compile', function(){
		it('should be a function', function() {
			ltl.compile.should.be.a.Function;
		});
	});
	describe('.compile("")', function(){
		it('should return a function', function() {
			ltl.compile('').should.be.a.Function;
		});
	});
});