var ltl = require('../ltl');
var assert = require('assert');

var PBI = '<p><b><i></i></b></p>';
var PBIT = '<p><b><i>text</i></b></p>';

describe('Whitespace', function () {
  it('should work with spaces', function () {
    var result = ltl.compile('p\n b\n  i')();
    assert.equal(result, PBI);
    var result = ltl.compile('p\n  b\n    i')();
    assert.equal(result, PBI);
  });
  it('should work with tabs', function () {
    var result = ltl.compile('p\n\tb\n\t\ti')();
    assert.equal(result, PBI);
    var result = ltl.compile('p\n\t\tb\n\t\t\t\ti')();
    assert.equal(result, PBI);
  });
  it('should work with double and triple line breaks', function () {
    var result = ltl.compile('p\n\n b\n  i')();
    assert.equal(result, PBI);
    var result = ltl.compile('p\n\n\n b\n  i')();
    assert.equal(result, PBI);
  });
  it('should work with carriage returns', function () {
    var result = ltl.compile('p\n\r\n b\n  i')();
    assert.equal(result, PBI);
  });
  it('should work with surrounding whitespace', function () {
    var result = ltl.compile('\np\n\n b\n  i')();
    assert.equal(result, PBI);
    var result = ltl.compile('p\n\n b\n  i\n')();
    assert.equal(result, PBI);
    var result = ltl.compile('\np\n\n b\n  i\n')();
    assert.equal(result, PBI);
  });
  it('should work with mixed tabs and spaces', function () {
    ltl.setOption("tabWidth", 2);
    var result = ltl.compile('p\n\n\tb\n    i')();
    assert.equal(result, PBI);
  });
  it('should trim whitespace', function () {
    var result = ltl.compile('p\n\n b\n  i text')();
    assert.equal(result, PBIT);
    var result = ltl.compile('p\n\n b\n  i  text')();
    assert.equal(result, PBIT);
    var result = ltl.compile('p\n\n b\n  i text ')();
    assert.equal(result, PBIT);
    var result = ltl.compile('p\n\n b\n  i  text ')();
    assert.equal(result, PBIT);
    var result = ltl.compile('p\n\n b\n  i \ttext\t')();
    assert.equal(result, PBIT);
    var result = ltl.compile('p\n\n b\n  i\ttext\t')();
    assert.equal(result, PBIT);
  });
  it('should handle extra whitespace', function () {
    var result = ltl.compile('p\n\n b\n      i text')();
    assert.equal(result, PBIT);
  });
  describe('options.space', function () {
    it('should insert spaces', function () {
      var result = ltl.compile('p\n b\n  i text\n br\n', {space: '  '})();
      assert.equal(result, '<p>\n  <b>\n    <i>text</i>\n  </b>\n  <br>\n</p>');
    });
    it('should insert tabs', function () {
      var result = ltl.compile('p\n i text', {space: '\t'})();
      assert.equal(result, '<p>\n\t<i>text</i>\n</p>');
    });
    it('should work with DOCTYPE', function () {
      var result = ltl.compile('html\n head>title Hi\n body Hello', {space: '\t'})();
      assert.equal(result, '<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<title>Hi</title>\n\t</head>\n\t<body>Hello</body>\n</html>');
    });
    it('should work with an opening comment', function () {
      var result = ltl.compile('// comment\np Hello', {space: '\t'})();
      assert.equal(result, '<p>Hello</p>');
    });
    it('should indent blocks', function () {
      var result = ltl.compile('p:\n Hello', {space: '\t'})();
      assert.equal(result, '<p>\n\tHello\n</p>');
    });
    it('should work with tagless blocks', function () {
      var result = ltl.compile(':\n blah', {space: ' '})();
      assert.equal(result, 'blah');
    });
    it('should work with comments', function () {
      var result = ltl.compile('br\n- text\nbr', {space: '  '})();
      assert.equal(result, '<br>\n<!--text-->\n<br>');
    });
  });
});