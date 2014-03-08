var ltl = require('../lib/ltl');

describe('API', function(){
	describe('ltl', function(){
		it('should be an object', function() {
			ltl.should.be.an.Object;
		});
	});
	describe('ltl.compile', function(){
		it('should be a function', function() {
			ltl.compile.should.be.a.Function;
		});
	});
	describe('ltl.compile("")', function(){
		it('should return a function', function() {
			ltl.compile('').should.be.a.Function;
		});
	});
});