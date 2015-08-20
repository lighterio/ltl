/**
 * VM Run is a utility for storing source code, running it, and returning a
 * result. If the result is a function to be executed later, it can be
 * executed knowing that recent source is retrievable when exceptions occur.
 *
 * @origin https://github.com/lighterio/lighter-common/common/vm/run.js
 * @version 0.0.2
 * @import process/cache
 */

var vm = require('vm')
var cache = require('../process/cache')

/**
 * Run a piece of code with an optional path for exception handling.
 *
 * @param  {String} code     A piece of JavaScript code to run.
 * @param  {String} path     An optional path for the file, used for debugging, etc.
 * @param  {Object} context  An optional context to run in.
 * @return {Any}             The value extracted from the scripts context.
 */
var run = module.exports = function (code, path, context) {
  path = (path || 'run' + (++run._id)) + '.vm.js'
  context = context || run._context
  var key = (path[0] === '/') ? path : '/tmp/' + path
  var src = 'var o=' + code.replace(/\[\]/g, 'new Array()')
  cache.set(key, src)
  try {
    vm.runInNewContext(src, context, key)
  } catch (e) {
    e.message += '\n' + src + '\n' + (e instanceof SyntaxError)
    throw e
  }
  return context.o
}

// Override for production.
var env = process.env.NODE_ENV || ''
if (env[0] !== 'd') {
  run = module.exports = function (code) {
    eval('var window={};eval.o=' + code.replace(/\[\]/g, 'new Array()'))
    return eval.o
  }
}

// Enable auto-incrementing of auto-generated code paths.
run._id = 0

// Default context for running code.
run._context = {
  window: {},
  console: console,
  Array: Array
}
