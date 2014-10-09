var ltl = require('../ltl');

describe('Ltl comments', function () {
  it('are omitted', function () {
    var result = ltl.compile('// Comment')();
    is(result, '');
    result = ltl.compile('p before\n// Comment\np after')();
    is(result, '<p>before</p><p>after</p>');
  });
  it('are omitted as a block', function () {
    var result = ltl.compile('//\n Comment')();
    is(result, '');
  });
  it('work without a space', function () {
    var result = ltl.compile('//Comment')();
    is(result, '');
  });
  it('are omitted as a block with indentation', function () {
    var result = ltl.compile('//\n List\n  * Item 1\n  * Item 2\n\n Blah\n Blah')();
    is(result, '');
  });
  it('do not treat a URL as a comment', function () {
    var result = ltl.compile('h1 Comments\n// Hidden\np http://lighter.io/ltl\n //\n  block\n  hide')();
    is(result, '<h1>Comments</h1><p>http://lighter.io/ltl</p>');
  });
});

describe('HTML comments', function () {
  it('work on a single line', function () {
    var result = ltl.compile('- Comment')();
    is(result, '<!--Comment-->');
  });
  it('work on multiple lines', function () {
    var result = ltl.compile('-\n p Hide')();
    is(result, '<!--<p>Hide</p>-->');
  });
});
