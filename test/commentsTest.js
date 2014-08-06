var ltl = require('../ltl');
var assert = require('assert');

describe('Ltl comments', function () {
  it('should be omitted', function () {
    var result = ltl.compile('// Comment')();
    is(result, '');
    result = ltl.compile('p before\n// Comment\np after')();
    is(result, '<p>before</p><p>after</p>');
  });
  it('should be omitted as a block', function () {
    var result = ltl.compile('//\n Comment')();
    is(result, '');
  });
  it('should work without a space', function () {
    var result = ltl.compile('//Comment')();
    is(result, '');
  });
  it('should be omitted as a block with indentation', function () {
    var result = ltl.compile('//\n List\n  * Item 1\n  * Item 2\n\n Blah\n Blah')();
    is(result, '');
  });
  it('should not treat a URL as a comment', function () {
    var result = ltl.compile('h1 Comments\n// Hidden\np http://lighter.io/ltl\n //\n  block\n  hide')();
    is(result, '<h1>Comments</h1><p>http://lighter.io/ltl</p>');
  });
});

describe('HTML comments', function () {
  it('should work on a single line', function () {
    var result = ltl.compile('- Comment')();
    is(result, '<!--Comment-->');
  });
  it('should work on multiple lines', function () {
    var result = ltl.compile('-\n p Hide')();
    is(result, '<!--<p>Hide</p>-->');
  });
});
