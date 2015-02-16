var ltl = require('../ltl');

describe('Debug', function () {

  it('adds whitespace to html', function () {
    var disabled = ltl.compile('p\n br', {enableDebug: false}).toString();
    is(disabled, "function (s){var o='<p><br></p>';return o}");
    var enabled = ltl.compile('p\n br', {enableDebug: true}).toString();
    is(enabled, "function (s){var o='<p>\\n  <br>\\n</p>';return o}");
  });

  it('adds whitespace to JS', function () {
    var template = ltl.compile('br\nif a\n for i in x\n  i Hi', {enableDebug: true});
    is(template.toString(), "function (s){var o='<br>';if(s.a){for(var c,a=0,b=s.x.length;a<b;++a){c=s.x[a];o+='\\n<i>Hi</i>'}}return o}");
  });

  it('throws an error if not enabled', function (done) {
    try {
      ltl.compile('p ={omg!}');
    }
    catch (e) {
      is(e.stack.indexOf('require'), -1);
      is.in(e.message, '[Ltl] Failed to compile template. Unexpected');
      done();
    }
  });

  it('writes a file and throw a more detailed error if enabled', function (done) {
    try {
      ltl.compile('p ={omg!}', {enableDebug: true});
    }
    catch (e) {
      is.in(e.message, '[Ltl] Failed to compile template. Unexpected');
      done();
    }
  });

  it('calls the template by name', function (done) {
    try {
      ltl.compile('p ={omg!}', {name: 'wtf'});
    }
    catch (e) {
      is.in(e.message, '[Ltl] Failed to compile "wtf". Unexpected');
    }
    try {
      ltl.compile('p ={omg!}', {name: 'wtf', enableDebug: true});
    }
    catch (e) {
      is.in(e.message, '[Ltl] Failed to compile "wtf". Unexpected');
      done();
    }
  });

});
