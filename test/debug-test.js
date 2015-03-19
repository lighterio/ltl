var ltl = require('../ltl');

describe('Debug', function () {

  it('adds whitespace to html', function () {
    var disabled = ltl.compile('p\n br', {enableDebug: false}).toString();
    is(disabled, "function (state){var output='<p><br></p>';return output}");
    var enabled = ltl.compile('p\n br', {enableDebug: true}).toString();
    is(enabled, "function (state){var output='<p>\\n  <br>\\n</p>';return output}");
  });

  it('adds whitespace to JS', function () {
    var template = ltl.compile('br\nif a\n for i in x\n  i Hi', {enableDebug: true});
    is(template.toString(), "function (state){var output='<br>';if(state.a){for(var c,a=0,b=state.x.length;a<b;++a){c=state.x[a];output+='\\n<i>Hi</i>'}}return output}");
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
