function create(__helpers) {
  var str = __helpers.s,
      empty = __helpers.e,
      notEmpty = __helpers.ne,
      forLoop = __helpers.fl;

  return function render(data, out) {
    out.w('<!DOCTYPE html><html><head><title>Hello World</title></head><body><div id="hey" class="a b">Here\'s my message: ' +
      str(data.message) +
      '</div><ul>');

    forLoop(data.items, function(__array,__index,__length,item) {
      for (;__index<__length;__index++) {
        item=__array[__index];

        out.w('<li>' +
          str(item) +
          '</li>');
      }
    });

    out.w('</ul></body></html>');
  };
}
(module.exports = require("marko").c(__filename)).c(create);