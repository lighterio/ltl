var ltl = require('../ltl');
var assert = require('assert-plus');

require('zeriousify').test();

describe('API', function () {
  describe('ltl', function () {
    it('should be an object', function () {
      assert.object(ltl);
    });
  });
  describe('ltl.version', function () {
    it('should expose version', function () {
      assert.ok(/^[0-9]+\.[0-9]+\.[0-9]+$/.test(ltl.version));
      var pkg = require('../package.json');
      is(pkg.version, ltl.version);
    });
  });
  describe('ltl.setOption("tabWidth", int)', function () {
    it('should modify tab/space leniency', function () {
      ltl.setOption("tabWidth", 1);
      var result = ltl.compile('ul\n li\n\tli')();
      is(result, '<ul><li></li><li></li></ul>');
      ltl.setOption("tabWidth", 2);
      result = ltl.compile('ul\n li\n\tli')();
      is(result, '<ul><li><li></li></li></ul>');
      ltl.setOption("tabWidth", 4);
    });
  });
  describe('ltl.setOption("outputVar", string)', function () {
    it('should modify output variable', function () {
      ltl.setOption("outputVar", 'html');
      var code = ltl.compile('p').toString();
      is(code, "function (c){var html='<p></p>';return html}");
      ltl.setOption("outputVar", 'o');
      code = ltl.compile('p').toString();
      is(code, "function (c){var o='<p></p>';return o}");
    });
    it('should override output variable', function () {
      var code = ltl.compile('p', {outputVar: 'out'}).toString();
      is(code, "function (c){var out='<p></p>';return out}");
    });
  });
  describe('ltl.setOption("contextVar", string)', function () {
    it('should modify context variable', function () {
      ltl.setOption("contextVar", 'context');
      var code = ltl.compile('p').toString();
      is(code, "function (context){var o='<p></p>';return o}");
      ltl.setOption("contextVar", 'c');
      code = ltl.compile('p').toString();
      is(code, "function (c){var o='<p></p>';return o}");
    });
  });
  describe('ltl.setOption("partsVar", string)', function () {
    it('should modify parts variable', function () {
      ltl.setOption("partsVar", 'parts');
      ltl.setOption("partsVar", 'p');
    });
  });
  describe('ltl.setOption("space", string)', function () {
    it('should modify space variable', function () {
      ltl.setOption('space', '\t');
      var result = ltl.compile('.\n p hi')();
      is(result, '<div>\n\t<p>hi</p>\n</div>');
      delete ltl._options.space;
    });
  });
  describe('ltl.compile', function () {
    it('should be a function', function () {
      assert.func(ltl.compile);
    });
  });
  describe('ltl.compile(string)', function () {
    it('should return a function', function () {
      assert.func(ltl.compile(''));
    });
  });
  describe('module', function () {
    it('should populate the window object if it exists', function () {
      var cache = {};
      var key;
      for (key in require.cache) {
        cache[key] = require.cache[key];
        delete require.cache[key];
      }
      global.window = {};
      require('../ltl');
      for (key in cache) {
        require.cache[key] = cache[key];
        delete require.cache[key];
      }
      var pkg = require('../package.json');
      is(pkg.version, window.ltl.version);
    });
  });
});
