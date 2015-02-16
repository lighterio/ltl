var ltl = require('../ltl');

describe('Properties', function () {

  it('are set', function () {
    var template = ltl.compile('+js\n  var a = 1;');
    var result = template();
    is(result, '');
    is(template.js, 'var a = 1;');
  });

  it('work after content', function () {
    var template = ltl.compile('.blah\n+js\n  var a = 1;');
    var result = template();
    is(result, '<div class="blah"></div>');
    is(template.js, 'var a = 1;');
  });

  it('support filters', function () {
    var template = ltl.compile('+js:coffee\n  a = 1');
    var result = template();
    is(result, '');
    is.in(template.js, ';');
  });

  it('populate based on target language', function () {
    var template = ltl.compile('+coffee\n  a = 1');
    var result = template();
    is(result, '');
    is.in(template.js, ';');
  });

});
