var ltl = require('../ltl');
var assert = require('assert');

describe('Debug', function () {
  it('should add whitespace to html', function () {
    var disabled = ltl.compile('p\n br', {enableDebug: false}).toString();
    assert.equal(disabled, "function (c){var o='<p><br></p>';return o}");
    var enabled = ltl.compile('p\n br', {enableDebug: true}).toString();
    assert.equal(enabled, "function (c){var o='<p>\\n  <br>\\n</p>';return o}");
  });
  it('should add whitespace to JS', function () {
    var template = ltl.compile('br\nif a\n for i in x\n  i Hi', {enableDebug: true});
    assert.equal(template.toString(), "function (c){var o='<br>';if(c.a){for(var d,a=0,b=c.x.length;a<b;++a){d=c.x[a];o+='\\n<i>Hi</i>'}}return o}");
  });
  it('should throw an error if not enabled', function (done) {
    try {
      ltl.compile('p ={omg!}');
    }
    catch (e) {
      assert.equal(e.stack.indexOf('require'), -1);
      assert.equal(e.message, '[Ltl] Failed to compile template. Unexpected token !');
      done();
    }
  });
  it('should write a file and throw a more detailed error if enabled', function (done) {
    try {
      ltl.compile('p ={omg!}', {enableDebug: true});
    }
    catch (e) {
      assert.equal(e.stack.indexOf('require') > 0, true);
      assert.equal(e.message, '[Ltl] Failed to compile template. Unexpected token !');
      done();
    }
  });
  it('should call the template by name', function (done) {
      try {
        ltl.compile('p ={omg!}', {name: 'wtf'});
      }
      catch (e) {
        assert.equal(e.message, '[Ltl] Failed to compile "wtf". Unexpected token !');
      }
      try {
        ltl.compile('p ={omg!}', {name: 'wtf', enableDebug: true});
      }
      catch (e) {
        assert.equal(e.message, '[Ltl] Failed to compile "wtf". Unexpected token !');
        done();
      }
  });
});
