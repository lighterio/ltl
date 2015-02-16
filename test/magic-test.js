var ltl = require('../ltl');

describe('Magic', function () {

  it('auto-inserts <!DOCTYPE html>', function () {
    var result = ltl.compile('html\n head\n  title Title\n body Body')();
    is(result, '<!DOCTYPE html><html><head><title>Title</title></head><body>Body</body></html>');
  });

  it('allows doctypes other than html', function () {
    var result = ltl.compile('!DOCTYPE(test)\nhtml\n head\n  title Title\n body Body')();
    is(result, '<!DOCTYPE test><html><head><title>Title</title></head><body>Body</body></html>');
  });

  it('turns ! or doctype into <!DOCTYPE> and assume html', function () {
    var result;
    result = ltl.compile('!')();
    is(result, '<!DOCTYPE html>');
    result = ltl.compile('doctype')();
    is(result, '<!DOCTYPE html>');
  });

  it('allows other doctypes', function () {
    var result;
    result = ltl.compile('!(svg)')();
    is(result, '<!DOCTYPE svg>');
    result = ltl.compile('!DOCTYPE(svg)')();
    is(result, '<!DOCTYPE svg>');
  });

  it('omits a tags with a tagless blocks', function () {
    var result = ltl.compile('p\n :\n  hi')();
    is(result, '<p>hi</p>');
  });

});
