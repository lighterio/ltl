/**
 * Ltl is a template language designed to be simple, beautiful and fast.
 * There is single Ltl reference in the process or window.
 */
var ltl = this.ltl = this.ltl || {

  // The scope is a window or process.
  scope: this,

  // Some HTML tags won't have end tags.
  selfClosePattern: /^(!DOCTYPE|area|base|br|hr|img|input|link|meta|-|\/\/|space|js|css)(\b|$)/,

  // Supported control keywords (usage appears like tags).
  controlPattern: /^(for|if|else|break|continue)\b/,

  // Pattern for assignment.
  assignmentPattern: /^([$A-Za-z_][$A-Za-z_0-9\.\[\]'"]*\s*=[^\{])/,

  // JavaScript tokens that don't need the scope "scope" prepended for interpolation.
  // TODO: Flesh out this list?
  jsPattern: /^(undefined|true|false|null|function|NaN|Infinity|window|location|document|console|new|this|typeof|instanceof|Math|Object|Array|Date|Error|RegExp|JSON|Jymin|scope|state|cache|output|setTimeout|clearTimeout)$/,

  // Register several languages and their targets.
  languages: {
    js: 'js',
    coffee: 'js',
    es6: 'js',
    ts: 'js',
    css: 'css',
    less: 'css',
    scss: 'css',
    styl: 'css'
  },

  // Remove starting/ending whitespace.
  trim: function (text) {
    return text.replace(/(^\s+|\s+$)/g, '')
  },

  // Repeat a string.
  repeat: function (text, times) {
    return times > 0 ? (new Array(times + 1)).join(text) : ''
  },

  // Escape single quotes with a backslash.
  escapeSingleQuotes: function (text) {
    return text.replace(/'/g, '\\\'')
  },

  // Escape text with possible line breaks for appending to a string.
  escapeBlock: function (text) {
    return text.replace(/'/g, '\\\'').replace(/\n/g, '\\n')
  },

  // Get a module for filtering.
  getFilter: function (name) {
    var filters = ltl.filters
    var filter = filters[name]
    if (!filter) {
      filter = filters[name] = ltl.scope[name] || (typeof require !== 'undefined' ? require(name) : null)
    }
    if (!filter) {
      var todo
      var into = ' into function that accepts a string and returns a string.'
      if (ltl.scope.cwd) {
        var cmd = 'cd ' + ltl.scope.cwd() + '; npm install --save ' + name
        todo = 'Run "' + cmd + '", or make require("ltl").filters.' + name
      } else {
        todo = 'Set window.ltl.filters.' + name
      }
      throw new Error('[Ltl] Unknown filter: "' + name + '". ' + todo + into)
    }
    return filter
  },

  // In browsers and istanbul, run JS with `eval`, otherwise run with `vm`.
  run: (
    typeof require === 'function'
      ? require('lighter-vm').run
      : function (src, name) {
        var f
        try {
          /* eslint-disable */
          eval('f=' + src)
          /* eslint-enable */
        } catch (e) {
          e.message = '[Ltl] ' + e.message
          if (name) {
            e.message += '\nTemplate: ' + name
          }
          e.message += '\nFunction: ' + src
          throw e.stack && e
        }
        return f
      }
  ),

  // Store templates that have been compiled.
  cache: new Cache(),

  // Store filter modules, such as "coffee-script" and "marked".
  filters: {
    js: 'js',
    css: 'css'
  },

  // Default compile settings.
  options: {
    tabWidth: 2,
    defaultTag: 'div'
  },

  // Change compile options.
  setOption: function (name, value) {
    this.options[name] = value
  },

  // Create a function that accepts scope and returns markup.
  compile: function (code, options) {
    // Copy the default options.
    var settings = {
      tabWidth: this.options.tabWidth,
      defaultTag: this.options.defaultTag,
      space: this.options.space,
      cache: this.cache
    }
    for (var name in options) {
      settings[name] = options[name]
    }

    if (settings.space) {
      settings.space = ltl.escapeBlock(settings.space)
    }

    // Replace carriage returns for Windows compatibility.
    code = code.replace(/\r/g, '')

    // Be lenient with mixed tabs and spaces.
    var tabReplacement = Array(settings.tabWidth + 1).join(' ')
    code = code.replace(/\t/g, tabReplacement)

    // We'll auto-detect tab width.
    var currentTabWidth = 0

    // Initialize the code, and start at level zero with no nesting.
    var lines = code.split('\n')
    var lineIndex
    var lineCount = lines.length

    var newLine = settings.space ? '\n' : ''

    var globalSpaces = 0
    var indent = 0
    var stack = []
    var mode = 'html'
    var previousTag
    var hasHtmlOutput = false
    var hasContent = false
    var useCache = false
    var tagDepth = 0

    var output = "var output='"

    var varIndex = 0
    var escapeHtmlVar = false
    var encodeUriVar = false
    var escapeCommentVar = false
    var loopVars = []

    // If we end up in a dot block, remember the starting indent and filter, and gather lines.
    var blockIndent = 0
    var blockFilter = ''
    var blockLines = null
    var blockTag = null
    var blockName = ''
    var blockContent = ''
    var blockScope = null
    var inComment = false

    // Support adding properties like "js" to the template function.
    var properties = {}
    var blockProperty
    var blockTarget

    function appendText (textMode, text) {
      if (textMode !== mode) {
        if (mode === 'html') {
          output += "'" + (text === '}' ? '' : ';' + newLine)
        } else {
          output += "output+='"
        }
        mode = textMode
      }
      if (mode === 'html') {
        text = interpolate(text)
      }
      output += text
    }

    function startBlock (filter, content) {
      blockIndent = indent + 1
      blockFilter = filter
      blockLines = []
      if (content) {
        blockLines = blockLines || []
        blockLines.push(content)
      }
    }

    function appendBlock () {
      var text = blockLines.join('\n')

      // Reset the blockage.
      blockIndent = 0

      // Some options should be passed through.
      var blockOptions = {
        space: settings.space,
        enableDebug: settings.enableDebug
      }

      // If we're in a "call" block, call another template with compiled parts.
      if (blockFilter === 'call') {
        if (/\S/.test(text)) {
          blockScope = blockScope || []
          var blockJs = ltl.compile(text, blockOptions).toString()
          blockJs = blockJs.replace(/^.*?\)/, 'function()')
          blockScope.push('block:' + blockJs)
        }
        blockScope = blockScope ? blockScope.join(',') : ''
        appendText('html', "'+cache['" + blockName + "']({" + blockScope + "},state)+'")
        useCache = true
        blockScope = null
        return

      // If there's a filter, get its module.
      } else if (blockFilter) {
        if (blockFilter === 'coffee') {
          blockFilter = 'coffee-script'
        } else if (blockFilter === 'md') {
          blockFilter = 'marked'
        }
        var compiler = ltl.getFilter(blockFilter)

        if (compiler.renderSync) {
          text = compiler.renderSync(text, {
            data: text,
            compressed: true
          })
        } else if (compiler.render) {
          if (blockFilter === 'less') {
            compiler.render(text, function (err, result) {
              if (err) {
                throw err
              }
              text = result.css
            })
          } else {
            text = compiler.render(text)
          }
        } else if (compiler.compile) {
          var nowrap = /^[^A-Z]*NOWRAP/.test(text)
          text = compiler.compile(text)
          if (nowrap) {
            text = text.replace(/(^\(function\(\) \{\s*|\s*\}\)\.call\(this\);\s*$)/g, '')
          }
        } else if (compiler.parse) {
          text = compiler.parse(text)
        } else if (typeof compiler === 'function') {
          text = compiler(text)
        }
      } else {
        blockFilter = 'text'
      }

      text = ltl.trim(text)
      if (settings.space) {
        if (hasHtmlOutput) {
          text = '\n' + text
        }
        text = text.replace(/\n/g, '\n' + ltl.repeat(settings.space, tagDepth))
        if (blockTag) {
          text += '\n' + ltl.repeat(settings.space, tagDepth - 1)
        }
      }

      if (blockProperty) {
        var value = properties[blockProperty]
        value = (value ? value + '\n' : '') + text
        properties[blockProperty] = value
      } else if (blockTarget === 'js') {
        text = text.replace(/;?$/, ';')
        appendText('script', text)
      } else {
        appendText('html', ltl.escapeBlock(text))
      }

      blockTag = null
      blockFilter = null
      blockProperty = null
      blockTarget = null
      blockScope = null
    }

    function backtrackIndent () {
      while (stack.length > indent) {
        var tags = stack.pop()
        if (tags) {
          tags = tags.split(/,/g)
          for (var i = tags.length - 1; i >= 0; i--) {
            var tag = tags[i]
            if (tag === '//') {
              inComment = false
            } else if (tag === '-') {
              appendText('html', '-->')
            } else if (ltl.controlPattern.test(tag)) {
              appendText('script', '}')
              if (tag === 'for') {
                loopVars.pop()
              }
            } else if (!ltl.selfClosePattern.test(tag)) {
              var html = '</' + tag + '>'
              tagDepth--
              if (tag === previousTag) {
                previousTag = null
              } else if (settings.space) {
                html = '\\n' + ltl.repeat(settings.space, tagDepth) + html
              }
              appendText('html', html)
            }
          }
        }
      }
    }

    function transformScript (script) {
      var found = false

      script = script.replace(/^for\s+([$A-Za-z_][$A-Za-z_\d]*)\s+in\s+([$A-Za-z_][$A-Za-z_\d\.]*)\s*$/,
        function (match, item, array) {
          found = true
          var i = 'ltl' + varIndex++
          var l = 'ltl' + varIndex++
          var e = 'ltl' + varIndex++
          loopVars.push([[item, e]])
          return 'for(var ' + e + ',' + i + '=0,' + l + '=scope.' + array + '.length;' +
            i + '<' + l + ';++' + i + ')' + '{' + newLine +
            e + '=scope.' + array + '[' + i + ']' + ';' + newLine
        })

      if (found) {
        stack.push('for')
        return script
      }

      script = script.replace(/^for\s+([$A-Za-z_][$A-Za-z_\d]*)\s*,\s*([$A-Za-z_][$A-Za-z_\d]*)\s+of\s+([$A-Za-z_][$A-Za-z_\d\.]*)\s*$/,
        function (match, key, value, object) {
          found = true
          var k = 'ltl' + varIndex++
          var v = 'ltl' + varIndex++
          loopVars.push([[key, k], [value, v]])
          return 'for(var ' + k + ' in scope.' + object + '){' + newLine +
            'if(!scope.' + object + '.hasOwnProperty(' + k + '))continue;' + newLine +
            v + '=scope.' + object + '[' + k + ']' + ';' + newLine
        })

      if (found) {
        stack.push('for')
        return script
      }

      script = script.replace(/^(else if|else|if)\s*(.*)\s*$/i,
        function (match, keyword, condition) {
          found = true
          return keyword + (condition ? '(' + scopify(condition) + ')' : '') + '{' + newLine
        })

      if (found) {
        stack.push('if')
        return script
      }

      /*
      script = script.replace(/^(break|continue)(\s+.*)$/i,
        function (match, keyword, condition) {
          found = true
          return keyword + (condition ? '(' + scopify(condition) + ')' : '') + '{' + newLine
        })
      */
    }

    /**
     * Give scope to a JavaScript expression by prepending the scope variable "scope".
     * TODO: Parse using acorn so that strings can't be interpreted as vars.
     */
    function scopify (code, unescapeSingleQuotes) {
      // Interpolations got escaped as HTML and must be unescaped to be JS.
      if (unescapeSingleQuotes) {
        code = code.replace(/\\'/g, "'")
      }
      var tokens = code.split(/\b/)
      var isProperty = false
      var isLoopVar = false
      var isInString = false
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i]
        var stringTokens = token.match(/['"]/g)
        if (stringTokens) {
          isInString = ((isInString ? 1 : 0) + stringTokens.length) % 2
        } else if (!isInString) {
          if (/^[a-z_]/i.test(token)) {
            if (!ltl.jsPattern.test(token)) {
              for (var j = 0; j < loopVars.length; j++) {
                for (var k = 0; k < loopVars[j].length; k++) {
                  if (token === loopVars[j][k][0]) {
                    isLoopVar = true
                    tokens[i] = loopVars[j][k][1]
                  }
                }
              }
              if (!isProperty && !isLoopVar) {
                tokens[i] = 'scope.' + token
              }
            }
          }
          isProperty = token[token.length - 1] === '.'
          isLoopVar = false
        }
      }
      code = tokens.join('')
      return code
    }

    /**
     * Find ={...}, ${...} and &{...} interpolations.
     * Turn them into scope-aware insertions unless escaped.
     */
    function interpolate (code) {
      return code.replace(/(\\?)([$=&])\{([^\}]+)\}/g, function (match, backslash, symbol, expression) {
        if (backslash) {
          return symbol + '{' + expression + '}'
        }
        if (expression === 'block') {
          expression = 'scope.block.call(cache,scope)'
          useCache = true
        } else {
          expression = scopify(expression, true)
        }
        if (symbol === '$') {
          if (!escapeHtmlVar) {
            escapeHtmlVar = 'ltl' + varIndex++
          }
          return "'+" + escapeHtmlVar + '(' + expression + ")+'"
        } else if (symbol === '&') {
          if (!encodeUriVar) {
            encodeUriVar = 'ltl' + varIndex++
          }
          return "'+" + encodeUriVar + '(' + expression + ")+'"
        } else {
          return "'+(" + expression + ")+'"
        }
      })
    }

    // Iterate over each line.
    for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      var line = lines[lineIndex]

      // Mitigate recursion past 100 deep.
      var maxT = 1e2

      // If the line is all whitespace, ignore it.
      if (!/\S/.test(line)) {
        if (blockIndent) {
          (blockLines = blockLines || []).push('')
        }
        continue
      }

      // Find the number of leading spaces.
      var spaces = line.search(/[^ ]/)

      // If the first line with content has leading spaces, assume they all do.
      if (!hasContent) {
        globalSpaces = spaces
        hasContent = true
      }

      var adjustedSpaces = Math.max(spaces - globalSpaces, 0)

      // If this is our first time seeing leading spaces, that's our tab width.
      if (adjustedSpaces > 0 && !currentTabWidth) {
        currentTabWidth = adjustedSpaces
      }

      // Calculate the number of levels of indentation.
      indent = adjustedSpaces ? Math.round(adjustedSpaces / currentTabWidth) : 0

      // If we're in a block, we can append or close it.
      if (blockIndent) {
        // If we've gone back to where the block started, close the block.
        if (indent < blockIndent) {
          appendBlock()

        // If we're still in the block, append to the block code.
        } else {
          line = line.substring(Math.min(spaces, currentTabWidth * blockIndent))
          blockLines = blockLines || []
          blockLines.push(line)
          continue
        }
      }

      // Strip the leading spaces.
      line = line.substring(spaces)

      // Backtrack, closing any nested tags that need to be closed.
      backtrackIndent()
      if (inComment) {
        continue
      }

      // Control patterns such as if/else/for must transform into true JavaScript.
      if (ltl.controlPattern.test(line)) {
        var script = transformScript(line)
        appendText('script', script)

      // Assignment patterns just need to be stateified.
      } else if (ltl.assignmentPattern.test(line)) {
        line = scopify(line) + ';'
        appendText('script', line)

      // Expression patterns make things append.
      } else if (line[0] === '@') {
        line.replace(/@([^\s\(\[]+)([\(\[][^\)\]]*[\)\]])?(.*)/, function (match, path, attributes, rest) {
          blockName = path
          blockContent = rest
          if (attributes) {
            blockScope = []
            attributes = attributes.substr(1, attributes.length - 2)
            attributes.replace(/([^\s]+?)(=(['"])?[^'"]*?\3)?(\s|$)/g, function (match, name, value, space) {
              blockScope.push(name + ':' + (value ? scopify(value.substr(1)) : true))
            })
          }
          startBlock('call', blockContent)
        })

      // Tags must be parsed for id/class/attributes/content.
      } else {
        var rest = line
        var t = 0

        // Process the rest of the line recursively.
        while (rest && (++t < maxT)) {
          var tag = ''
          var id = ''
          var classes = []
          var attributes = ''
          var character = ''
          var end = 0
          var content = ''

          // Process the rest of the line recursively.
          while (rest && (++t < maxT)) {
            character = rest[0]

            // If it's an ID, read up to the next thing, and save the ID.
            if (character === '#') {
              end = rest.search(/([\.\(>:\s]|$)/)
              id = id || rest.substring(1, end)
              rest = rest.substring(end)

            // If it's a class, read up to the next thing, and save the class.
            } else if (character === '.') {
              end = rest.search(/([@#\(>:\s]|$)/)
              classes.push(rest.substring(1, end).replace(/\./g, ' '))
              rest = rest.substring(end)

            // If it's the beginning of a list of attributes, iterate through them.
            } else if (character === '(' || character === '[') {
              // Move on from the parentheses.
              rest = rest.substring(1)

              // Build attributes.
              attributes = ''
              while (rest && (++t < maxT)) {
                // Find quoted attributes or the end of the list.
                end = rest.search(/[\)\]"']/)

                // If there's no end, read what's left as attributes.
                if (end < 0) {
                  attributes += rest
                  rest = ''
                  break
                }
                character = rest[end]

                // If it's the end, get any remaining attribute and get out.
                if (character === ')' || character === ']') {
                  attributes += rest.substring(0, end)
                  rest = rest.substring(end + 1)
                  break

                // If it's not the end, read a quoted param.
                } else {
                  // Allow for attributes to be comma separated or not.
                  // Also allow for valueless attributes.
                  attributes += rest.substring(0, end).replace(/[,\s]+/g, ' ')
                  rest = rest.substring(end)

                  // Find the next end quote.
                  // TODO: Deal with backslash-delimited quotes.
                  end = rest.indexOf(character, 1)

                  // Read to the end of the attribute.
                  attributes += rest.substring(0, end + 1)
                  rest = rest.substring(end + 1)
                }
              }

            // If the next character is a greater than symbol, break for inline nesting.
            } else if (character === '>') {
              rest = rest.replace(/^>\s*/, '')
              break

            // If the next character is a colon, enter a filter block.
            } else if (character === ':') {
              blockTag = tag
              rest = rest.substring(1).split(' ')
              startBlock(rest.shift(), rest.join(' '))
              rest = ''
              break

            // If the next character is a plus, store it as a property.
            } else if (character === '+') {
              rest.replace(/^\+([^:\s]+):?(\S*)\s?(.*)$/, function (match, name, filter, content) {
                var target = ltl.languages[name] || name
                blockProperty = target
                blockTag = ''
                filter = (name === target ? '' : name) || filter
                startBlock(filter, content)
              })
              rest = ''
              break

            // If the next character is a space, it's the start of content.
            } else if (character === ' ') {
              content = ltl.trim(rest)
              rest = ''

            // If the next character isn't special, it's part of a tag.
            } else {
              end = rest.search(/([#\.\(>:\s@]|$)/)
              // Prevent overwriting the tag.
              tag = tag || rest.substring(0, end)
              rest = rest.substring(end)
            }
          }

          // If it's a JS/CSS language, start an inline block.
          if (ltl.languages[tag]) {
            blockTarget = ltl.languages[tag]
            var filter = (tag === blockTarget ? '' : tag) || filter
            tag = blockTag = blockTarget === 'css' ? 'style' : '//'
            startBlock(filter, content)
          }

          // If it's a comment, set a boolean so we can ignore its contents.
          if (tag.indexOf('//') === 0) {
            tag = '//'
            inComment = true

          // If it's not a comment, we'll add some HTML.
          } else {
            var className = classes.join(' ')

            // Default to a <div> unless we're in a tagless block.
            if (!tag) {
              var useDefault = (blockTag === null) || id || className || attributes
              if (useDefault) {
                tag = blockTag = settings.defaultTag
              }
            }

            // Convert ! or doctype into !DOCTYPE and assume html.
            if (tag === '!' || tag === 'doctype') {
              tag = '!DOCTYPE'
              attributes = attributes || 'html'
            }

            // Add attributes to the tag.
            var html = tag
            if (id) {
              html += ' id="' + id + '"'
            }
            if (className) {
              html += ' class="' + className + '"'
            }
            if (attributes) {
              html += ' ' + attributes
            }

            // Convert space tag to a space character.
            if (tag === 'space') {
              html = ' ' + content

            // Convert minus to a comment.
            } else if (tag === '-') {
              html = '<!--' + content
            } else {
              html = '<' + html + '>' + content
            }

            html = ltl.escapeSingleQuotes(html)
            if (tag === 'html') {
              // If there's an HTML tag, don't wrap with a scope.
              if (!/DOCTYPE/.test(output)) {
                html = '<!DOCTYPE html>' + (settings.space ? '\\n' : '') + html
              }
            }

            // Prepend whitespace if requested via settings.space.
            if (settings.space) {
              html = ltl.repeat(settings.space, tagDepth) + html
              // Prepend a line break if this isn't the first tag.
              if (hasHtmlOutput) {
                html = '\\n' + html
              }
            }

            // Add the HTML to the template function output.
            if (tag) {
              appendText('html', html)
              hasHtmlOutput = true
            }
          }

          if (tag) {
            // Make sure we can close this tag.
            if (stack[indent]) {
              stack[indent] += ',' + tag
            } else {
              stack[indent] = tag
            }

            // Allow same-line tag open/close in settings.space mode.
            previousTag = tag
            if (!ltl.selfClosePattern.test(tag)) {
              tagDepth++
            }
          }

          tag = ''
          id = ''
          classes = []
          attributes = ''
          content = ''
        }
      }
    }

    // We've reached the end, so unindent all the way.
    indent = 0
    if (blockIndent) {
      appendBlock()
    }
    backtrackIndent()

    // Add the return statement (ending concatenation, where applicable).
    appendText('script', 'return output')

    // Create the function.
    if (escapeCommentVar) {
      output = (settings.name
        ? 'var ' + escapeCommentVar + "=cache['-'];" + newLine
        : ltl.cache['-'].toString().replace(/\(/, escapeCommentVar + '(') + ';' + newLine) + output
      useCache = true
    }
    if (escapeHtmlVar) {
      output = (settings.name
        ? 'var ' + escapeHtmlVar + '=cache.$;' + newLine
        : ltl.cache.$.toString().replace(/\(/, escapeHtmlVar + '(') + ';' + newLine) + output
      useCache = true
    }
    if (encodeUriVar) {
      output = (settings.name
        ? 'var ' + encodeUriVar + "=cache['&'];" + newLine
        : ltl.cache['&'].toString().replace(/\(/, encodeUriVar + '(') + ';' + newLine) + output
      useCache = true
    }
    if (useCache) {
      output = 'var cache=this;' + newLine + output
    }

    var index = 0
    output = output.replace(/state=state\|\|scope;\s*var cache=this;\s*/g, function (match) {
      return index++ ? '' : match
    })

    if (/\bstate\b/.test(output)) {
      output = 'function(scope,state){' + newLine +
        'state=state||scope;' + newLine + output + newLine + '}'
    } else {
      output = 'function(scope){' + newLine + output + newLine + '}'
    }

    // Evaluate the template as a function.
    name = settings.name
    var template
    try {
      template = ltl.run(output, name)
    } catch (e) {
      name = (name ? '"' + name + '"' : 'template')
      e.message = '[Ltl] Failed to compile ' + name + '. ' + e.message
      throw e
    }

    // If there's a name specified, cache it and refer to it.
    if (name) {
      ltl.cache[name] = template
      template.key = name
      template.cache = ltl.cache
    }

    // Add any discovered properties to the template.
    for (name in properties) {
      template[name] = template[name] || properties[name]
    }

    return template
  }
}

/**
 * Return a new cache for ltl templates.
 */
function Cache () {
  this['$'] = function (v) {
      return (!v && v !== 0 ? '' : (typeof v === 'object' ? JSON.stringify(v) || '' : '' + v)).replace(/</g, '&lt;')
  }
  this['&'] = function (v) {
    return encodeURIComponent(!v && v !== 0 ? '' : '' + v)
  }
}

// Export Ltl as a CommonJS module.
if (typeof module !== 'undefined') {
  module.exports = ltl
}
