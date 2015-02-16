var ltl = require('../ltl');

describe('@', function () {

  it('sets classes with auto-generated IDs', function () {
    ltl.lastId = 0;
    var template = ltl.compile('input@\ntextarea@');
    var result = template();
    is(result, '<input class="_ltl1"><textarea class="_ltl2"></textarea>');
  });

  it('works with other classes', function () {
    ltl.lastId = 0;
    var template = ltl.compile('input.text@\ntextarea@');
    var result = template();
    is(result, '<input class="text _ltl1"><textarea class="_ltl2"></textarea>');
  });

  it('binds events', function () {
    ltl.lastId = 0;
    var template = ltl.compile('input@change~update\n\n~update\n console.log("update");');
    var result = template();
    is(result, '<input class="_ltl1">');
    is(template.js, 'Jymin.on("._ltl1","change",function(element,event,target){console.log("update");});');
  });

});
