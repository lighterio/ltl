var ltl = require('../ltl');

describe('Blocks', function () {
  it('work in the middle', function () {
    var result = ltl.compile('br\nscript:\n var a = 1;\n var b = 2;\nbr')();
    is(result, '<br><script>var a = 1;\nvar b = 2;</script><br>');
  });
  it('work at the beginning and end', function () {
    var result = ltl.compile('script:\n var a = 1;\n var b = 2;')();
    is(result, '<script>var a = 1;\nvar b = 2;</script>');
  });
  it('work with markdown', function () {
    var result = ltl.compile(':markdown\n # Heading')();
    is('<h1>Heading</h1>', result);
  });
  it('work with marked', function () {
    var result = ltl.compile('p:marked\n # Heading')();
    is.in(result, /<h1 id="heading">Heading<\/h1>/);
  });
  it('work with marked aliased as md', function () {
    var result = ltl.compile('p:md\n Heading\n =====')();
    is.in(result, /<h1 id="heading">Heading<\/h1>/);
  });
  it('include blank lines', function () {
    var result = ltl.compile(':md\n a\n\n b')();
    is(result, '<p>a</p>\n<p>b</p>');
  });
  it('work with CoffeeScript', function () {
    var result = ltl.compile('script:coffee\n a = 1')();
    is.in(result, /var/);
  });
  it('unwrap CoffeeScript with NOWRAP', function () {
    var result = ltl.compile('script:coffee\n # NOWRAP\n a = 1')();
    is.in(result, /var/);
    is.notIn(result, /function/);
    is.notIn(result, /call/);
  });
  it('work with text with line breaks', function () {
    var result = ltl.compile('p:\n First line.\n Second line.')();
    is(result, '<p>First line.\nSecond line.</p>');
  });
  it('remove carriage returns and indentation', function () {
    var result = ltl.compile('p:\n\r First line.\r\n Second line.')();
    is(result, '<p>First line.\nSecond line.</p>');
  });
  it('work with attributes', function () {
    var result = ltl.compile('textarea(rows=3 cols=40):\n 1. Collect underpants\n 2. ?\n 3. Profit!')();
    is(result, '<textarea rows=3 cols=40>1. Collect underpants\n2. ?\n3. Profit!</textarea>');
  });
  it('work in the browser', function () {
    global.window = {
      document: {body: {tagName: 'BODY'}},
      uppercaser: function (text) {
        return text.toUpperCase();
      }
    };
    var result = ltl.compile('b:uppercaser\n boom')();
    is(result, '<b>BOOM</b>');
    delete global.window;
  });
  it('throw an exception for unknown filters', function () {
    var error;
    try {
      ltl.compile('p:OMGWTFBBQ\n text')();
    }
    catch (e) {
      error = e;
    }
    is.truthy(error);
  });
  it('allow filterless blocks', function () {
    var result = ltl.compile('p:\n a\n b')();
    is(result, '<p>a\nb</p>');
  });
  it('add inline content', function () {
    var result = ltl.compile('p: a')();
    is(result, '<p>a</p>');
  });
  it('allow mixed content', function () {
    var result = ltl.compile('p: a\n b')();
    is(result, '<p>a\nb</p>');
  });
});
