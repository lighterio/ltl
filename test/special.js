var ltl = require('../ltl');
var assert = require('assert');

describe('Single quotes', function () {
	it('should work in content', function () {
		var result = ltl.compile('p I\'m here!')();
		assert.equal(result, '<p>I\'m here!</p>');
	});
	it('should work in an id', function () {
		var result = ltl.compile('p#Hawai\'i Aloha')();
		assert.equal(result, '<p id="Hawai\'i">Aloha</p>');
	});
	it('should work in a class', function () {
		var result = ltl.compile('p.Hawai\'i Aloha')();
		assert.equal(result, '<p class="Hawai\'i">Aloha</p>');
	});
	it('should work in attributes', function () {
		var result = ltl.compile('img(alt="I\'m an image" src="img.png")')();
		assert.equal(result, '<img alt="I\'m an image" src="img.png">');
	});
	it('should work without a tag', function () {
		var result = ltl.compile('- I\'m here!')();
		assert.equal(result, 'I\'m here!');
	});
	it('should work in a block', function () {
		var result = ltl.compile('p:\n I\'m here!')();
		assert.equal(result, '<p>I\'m here!</p>');
	});
});