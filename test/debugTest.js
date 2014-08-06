var ltl = require('../ltl');
var assert = require('assert');

describe('Debug', function () {
  it('should add whitespace to html', function () {
    var disabled = ltl.compile('p\n br', {enableDebug: false}).toString();
    is(disabled, "function (c){var o='<p><br></p>';return o}");
    var enabled = ltl.compile('p\n br', {enableDebug: true}).toString();
    is(enabled, "function (c){var o='<p>\\n  <br>\\n</p>';return o}");
  });
  it('should add whitespace to JS', function () {
    var template = ltl.compile('br\nif a\n for i in x\n  i Hi', {enableDebug: true});
    is(template.toString(), "function (c){var o='<br>';if(c.a){for(var d,a=0,b=c.x.length;a<b;++a){d=c.x[a];o+='\\n<i>Hi</i>'}}return o}");
  });
  it('should throw an error if not enabled', function (done) {
    try {
      ltl.compile('p ={omg!}');
    }
    catch (e) {
      is(e.stack.indexOf('require'), -1);
      is.in('[Ltl] Failed to compile template. Unexpected', e.message);
      done();
    }
  });
  it('should write a file and throw a more detailed error if enabled', function (done) {
    try {
      ltl.compile('p ={omg!}', {enableDebug: true});
    }
    catch (e) {
      is.in('[Ltl] Failed to compile template. Unexpected', e.message);
      done();
    }
  });
  it('should call the template by name', function (done) {
    try {
      ltl.compile('p ={omg!}', {name: 'wtf'});
    }
    catch (e) {
      is.in('[Ltl] Failed to compile "wtf". Unexpected', e.message);
    }
    try {
      ltl.compile('p ={omg!}', {name: 'wtf', enableDebug: true});
    }
    catch (e) {
      is.in('[Ltl] Failed to compile "wtf". Unexpected', e.message);
      done();
    }
  });
});
