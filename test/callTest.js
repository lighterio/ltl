var ltl = require('../ltl');

describe('Call', function () {
  it('should have a cache object', function () {
    is.object(ltl.cache);
  });
  it('should put templates in the cache', function () {
    ltl.compile('b ${text}', {name: 'bold'});
    is.function(ltl.cache.bold);
  });
  it('should call a template from the middle of another template', function () {
    ltl.compile('p\n call common', {name: 'temp'});
    ltl.compile('b ${text}', {name: 'common'});
    var result = ltl.cache.temp({text: 'Hi!'});
    is(result, '<p><b>Hi!</b></p>');
  });
  it('should extend a template', function () {
    ltl.compile('call base\n set a\n  p A\n set b\n  p B', {name: 'temp'});
    ltl.compile('div\n get a\n get b', {name: 'base'});
    var result = ltl.cache.temp();
    is(result, '<div><p>A</p><p>B</p></div>');
  });
  it('should include block content', function () {
    ltl.compile('call base\n set a:\n  A\n set b:\n  B', {name: 'temp'});
    ltl.compile('div\n p\n  get a\n p\n  get b', {name: 'base'});
    var result = ltl.cache.temp();
    is(result, '<div><p>A</p><p>B</p></div>');
  });
  it('should escape line breaks in block content', function () {
    ltl.compile('call page\n set title:\n  ltl\n set content:\n  ltl\n  fast', {name: 'index'});
    ltl.compile('html\n head\n  title\n   get title\n body\n  get content', {name: 'page'});
    var result = ltl.cache.index();
    is(result, '<!DOCTYPE html><html><head><title>ltl</title></head><body>ltl\nfast</body></html>');
  });
  it('should create get-able values', function () {
    ltl.compile('call hello\n set who: World', {name: 'temp'});
    ltl.compile(': Hello, ${get.who}!', {name: 'hello'});
    var result = ltl.cache.temp();
    is(result, 'Hello, World!');
  });
  it('should create if-able values', function () {
    ltl.compile('call hello\n set who: World', {name: 'known'});
    ltl.compile('call hello\n set who: Nobody', {name: 'unknown'});
    ltl.compile('if get.who == "World"\n : Hello, ${get.who}!\nelse\n : Does not compute.', {name: 'hello'});
    var known = ltl.cache.known();
    is(known, 'Hello, World!');
    var unknown = ltl.cache.unknown();
    is(unknown, 'Does not compute.');
  });
});
