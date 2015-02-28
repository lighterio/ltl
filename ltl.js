/**
 * Ltl is a template language designed to be simple, beautiful and fast.
 * There is single Ltl reference in the process or window.
 */
var ltl = this.ltl = this.ltl || {

  // The scope is a window or process.
  scope: this,

  // Allow users to see what version of Ltl they're using.
  version: '0.2.0',

  // Some HTML tags won't have end tags.
  selfClosePattern: /^(!DOCTYPE|area|base|br|hr|img|input|link|meta|-|\/\/|space|js|css)(\b|$)/,

  // Supported control keywords (usage appears like tags).
  controlPattern: /^(for|if|else)\b/,

  // Pattern for a Jasignment.
  assignmentPattern: /^([$A-Za-z_][$A-Za-z_0-9\.\[\]'"]*\s*=[^\{])/,

  // Supported command keywords.
  commandPattern: /^(call|get|set)\b/,

  // JavaScript tokens that don't need the state "state" prepended for interpolation.
  // TODO: Flesh out this list?
  jsPattern: /^(undefined|true|false|null|function|NaN|Infinity|window|location|document|console|this|Math|Object|Date|Error|RegExp|JSON)$/,

  // Stores available single character variable names.
  vars: 'abcdefghijklmnqrtuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',

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
  trim: function(text) {
    return text.replace(/(^\s+|\s+$)/g, '');
  },

  // Repeat a string.
  repeat: function(text, times) {
    return times > 0 ? (new Array(times + 1)).join(text) : '';
  },

  // Escape single quotes with a backslash.
  escapeSingleQuotes: function(text) {
    return text.replace(/'/g, '\\\'');
  },

  // Escape text with possible line breaks for appending to a string.
  escapeBlock: function(text) {
    return text.replace(/'/g, '\\\'').replace(/\n/g, '\\n');
  },

  // Get a module for filtering.
  getFilter: function(name) {
    var filters = ltl.filters;
    var filter = filters[name];
    if (!filter) {
      filter = filters[name] = ltl.scope[name] || (typeof require != 'undefined' ? require(name) : null);
    }
    if (!filter) {
      var todo;
      var into = ' into function that accepts a string and returns a string.';
      if (ltl.scope.cwd) {
        var cmd = 'cd ' + ltl.scope.cwd() + '; npm install --save ' + name;
        todo = 'Run "' + cmd + '", or make require("ltl").filters.' + name;
      } else {
        todo = 'Set window.ltl.filters.' + name;
      }
      throw new Error('[Ltl] Unknown filter: "' + name + '". ' + todo + into);
    }
    return filter;
  },

  // In browsers and istanbul, run JS with `eval`, otherwise run with `vm`.
  run: (
    (typeof require == 'function') ?
    require('./common/vm/run') :
    function (src, name) {
      var f;
      try {
        eval('f=' + src); // jshint ignore:line
      }
      catch (e) {
        e.message = '[Ltl] ' + e.message;
        if (name) {
          e.message += '\nTemplate: ' + name;
        }
        e.message += '\nFunction: ' + src;
        throw e.stack && e;
      }
      return f;
    }
  ),

  // Store templates that have been compiled.
  // Include 2 built-ins for interpolation.
  cache: {
    '$': function(v){return (!v&&v!==0?'':(typeof v=='object'?JSON.stringify(v)||'':''+v)).replace(/</g,'&lt;');},
    '&': function(v){return encodeURIComponent(!v&&v!==0?'':''+v);}
  },

  // Last value of an auto-incremented ID.
  lastId: 0,

  // Store filter modules, such as "coffee-script" and "marked".
  filters: {
    js: 'js',
    css: 'css'
  },

  // Store tags that evaluate elsewhere.
  tags: {},

  // Default compile settings.
  options: {
    tabWidth: 4,
    enableDebug: false
  },

  // Change compile options.
  setOption: function (name, value) {
    this.options[name] = value;
  },

  // Create a function that accepts state and returns markup.
  compile: function (code, options) {

    // Copy the default options.
    var settings = {
      tabWidth: this.options.tabWidth,
      space: this.options.space,
      enableDebug: this.options.enableDebug
    };
    for (var name in options) {
      settings[name] = options[name];
    }
    if (settings.enableDebug && !settings.space) {
      settings.space = '  ';
    }
    var getPattern = /state\.get\.([$A-Za-z_][$A-Za-z_\d]*)/g;

    if (settings.space) {
      settings.space = ltl.escapeBlock(settings.space);
    }

    // Replace carriage returns for Windows compatibility.
    code = code.replace(/\r/g, '');

    // Be lenient with mixed tabs and spaces, assuming tab width of 4.
    var tabReplacement = Array(settings.tabWidth + 1).join(' ');
    code = code.replace(/\t/g, tabReplacement);

    // We'll auto-detect tab width.
    var currentTabWidth = 0;

    // Initialize the code, and start at level zero with no nesting.
    var lines = code.split('\n');
    var lineIndex;
    var lineCount = lines.length;

    var globalSpaces = 0;
    var indent = 0;
    var stack = [];
    var mode = 'html';
    var previousTag;
    var hasHtmlTag = false;
    var hasHtmlOutput = false;
    var hasAssignments = false;
    var hasContent = false;
    var tagDepth = 0;

    var output = "var o='";

    var varIndex = 0;
    var escapeHtmlVar = false;
    var encodeUriVar = false;
    var escapeCommentVar = false;
    var loopVars = [];

    // If we end up in a dot block, remember the starting indent and filter, and gather lines.
    var blockIndent = 0;
    var blockFilter = '';
    var blockLines = null;
    var blockTag = null;
    var blockName = '';
    var blockContent = '';
    var blockSets = null;
    var hasGets = false;
    var inComment = false;

    // Support adding properties like "js" to the template function.
    var properties = {};
    var blockProperty;
    var blockTarget;
    var eventLanguage;

    // Allow event listeners to be added.
    var bindings = {};

    function appendText(textMode, text) {
      if (textMode != mode) {
        if (mode == 'html') {
          output += "'" + (text == '}' ? '' : ';');
        }
        else {
          output += "o+='";
        }
        mode = textMode;
      }
      if (mode == 'html') {
        text = interpolate(text);
      }
      output += text;
    }

    function startBlock(filter, content) {
      blockIndent = indent + 1;
      blockFilter = filter;
      blockLines = [];
      if (content) {
        (blockLines = blockLines || []).push(content);
      }
    }

    function appendBlock() {
      var text = blockLines.join('\n');

      // Reset the blockage.
      blockIndent = 0;

      // Some options should be passed through.
      var blockOptions = {
        space: settings.space,
        enableDebug: settings.enableDebug
      };

      // If we're in a "call" block, call another template with compiled parts.
      if (blockFilter == 'call') {
        // If there's a key, pass a sub-state.
        // * With a sub-state: this['VIEW'].call((state['KEY']._='KEY')&&state['KEY'])
        // * Without sub-state: this['VIEW'].call(state)
        var key = ltl.trim(blockContent || '');
        var state = key ? "state['" + key + "']" : 'state';
        appendText('html',
          "'+this['" + blockName + "'].call(this," + state +
          (text ? ',' + ltl.compile(text, blockOptions) : '') + ")+'");
        return;
      }
      // For a "set" block, add to the array of "set" block values.
      else if (blockFilter == 'set' || blockFilter == 'set:') {
        var block;
        if (blockFilter == 'set') {
          block = ltl.compile(text, blockOptions).toString();
        } else {
          block = "function(){return '" + ltl.escapeBlock(text) + "'}";
        }
        (blockSets = blockSets || []).push("'" + ltl.escapeSingleQuotes(blockName) + "':" + block);
        return;
      }
      // If there's a filter, get its module.
      else if (blockFilter) {
        if (blockFilter == 'coffee') {
          blockFilter = 'coffee-script';
        }
        else if (blockFilter == 'md') {
          blockFilter = 'marked';
        }
        var compiler = ltl.getFilter(blockFilter);

        if (compiler.renderSync) {
          text = compiler.renderSync(text, {
            data: text,
            compressed: true
          });
        }
        else if (compiler.render) {
          if (blockFilter == 'less') {
            compiler.render(text, function (err, result) {
              if (err) {
                throw err;
              }
              text = result.css;
            });
          }
          else {
            text = compiler.render(text);
          }
        }
        else if (compiler.compile) {
          var nowrap = /^[^A-Z]*NOWRAP/.test(text);
          text = compiler.compile(text);
          if (nowrap) {
            text = text.replace(/(^\(function\(\) \{\s*|\s*\}\)\.call\(this\);\s*$)/g, '');
          }
        }
        else if (compiler.parse) {
          text = compiler.parse(text);
        }
        else if (typeof compiler == 'function') {
          text = compiler(text);
        }
      }
      else {
        blockFilter = 'text';
      }

      text = ltl.trim(text);
      if (settings.space) {
        if (hasHtmlOutput) {
          text = '\n' + text;
        }
        text = text.replace(/\n/g, '\n' + ltl.repeat(settings.space, tagDepth));
        if (blockTag) {
          text += '\n' + ltl.repeat(settings.space, tagDepth - 1);
        }
      }

      if (blockProperty) {
        var value = properties[blockProperty];
        value = (value ? value + '\n' : '') + text;
        properties[blockProperty] = value;
      }
      else if (blockTarget == 'js') {
        appendText('script', text);
      }
      else {
        appendText('html', ltl.escapeBlock(text));
      }

      blockTag = null;
      blockFilter = null;
      blockProperty = null;
      blockTarget = null;
    }

    function backtrackIndent() {
      while (stack.length > indent) {
        var tags = stack.pop();
        if (tags) {
          tags = tags.split(/,/g);
          for (var i = tags.length - 1; i >= 0; i--) {
            var tag = tags[i];
            if (tag == '//') {
              inComment = false;
            }
            else if (tag == '-') {
              appendText('html', '-->');
            }
            else if (ltl.controlPattern.test(tag)) {
              appendText('script', '}');
              if (tag == 'for') {
                loopVars.pop();
              }
            }
            else if (!ltl.selfClosePattern.test(tag)) {
              var html = '</' + tag + '>';
              tagDepth--;
              if (tag == previousTag) {
                previousTag = null;
              }
              else if (settings.space) {
                html = '\\n' + ltl.repeat(settings.space, tagDepth) + html;
              }
              appendText('html', html);
            }
          }
        }
      }
    }

    function transformScript(script) {
      var found = false;

      script = script.replace(/^(for)\s+([$A-Za-z_][$A-Za-z_\d]*)\s+in\s+([$A-Za-z_][$A-Za-z_\d\.]*)\s*$/,
        function(match, keyword, item, array) {
          found = true;
          var i = ltl.vars[varIndex++];
          var l = ltl.vars[varIndex++];
          var e = ltl.vars[varIndex++];
          loopVars.push([[item, e]]);
          return 'for(var ' + e + ',' + i + '=0,' + l + '=state.' + array + '.length;' +
            i + '<' + l + ';++' + i + ')' +
            '{' + e + '=state.' + array + '[' + i + ']' + ';';
        });
      if (found) {
        stack.push('for');
        return script;
      }

      script = script.replace(/^(for)\s+([$A-Za-z_][$A-Za-z_\d]*)\s*,\s*([$A-Za-z_][$A-Za-z_\d]*)\s+of\s+([$A-Za-z_][$A-Za-z_\d\.]*)\s*$/,
        function(match, keyword, key, value, object) {
          found = true;
          var k = ltl.vars[varIndex++];
          var v = ltl.vars[varIndex++];
          loopVars.push([[key, k], [value, v]]);
          return 'for(var ' + k + ' in state.' + object + ')' +
            '{if(!state.' + object + '.hasOwnProperty(' + k + '))continue;' +
            v + '=state.' + object + '[' + k + ']' + ';';
        });

      if (found) {
        stack.push('for');
        return script;
      }

      script = script.replace(/^(else if|else|if)\s*(.*)\s*$/i,
        function(match, keyword, condition) {
          found = true;
          return keyword + (condition ? '(' + prependState(condition) + ')' : '') + '{';
        });

      stack.push('if');
      return script;
    }

    /**
     * Give scope to a JavaScript expression by prepending the state variable "state".
     * TODO: Parse using acorn so that strings can't be interpreted as ltl.vars.
     */
    function prependState(code, unescapeSingleQuotes) {
      // Interpolations got escaped as HTML and must be unescaped to be JS.
      if (unescapeSingleQuotes) {
        code = code.replace(/\\'/g, "'");
      }
      var tokens = code.split(/\b/);
      var isProperty = false;
      var isLoopVar = false;
      var isInString = false;
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var stringTokens = token.match(/['"]/g);
        if (stringTokens) {
          isInString = ((isInString ? 1 : 0 ) + stringTokens.length) % 2;
        }
        else if (!isInString) {
          if (/^[a-z_]/i.test(token)) {
            if (!ltl.jsPattern.test(token)) {
              for (var j = 0; j < loopVars.length; j++) {
                for (var k = 0; k < loopVars[j].length; k++) {
                  if (token == loopVars[j][k][0]) {
                    isLoopVar = true;
                    tokens[i] = loopVars[j][k][1];
                  }
                }
              }
              if (!isProperty && !isLoopVar) {
                tokens[i] = 'state.' + token;
              }
            }
          }
          isProperty = token[token.length - 1] == '.';
          isLoopVar = false;
        }
      }
      code = tokens.join('');
      getPattern = /state\.get\.([$A-Za-z_][$A-Za-z_\d]*)/g;
      code = code.replace(getPattern, function (match, part) {
        hasGets = true;
        return "p['" + part + "'].call(this,state)";
      });
      return code;
    }

    /**
     * Find ={...}, ${...} and &{...} interpolations.
     * Turn them into state-aware insertions unless escaped.
     */
    function interpolate(code) {
      return code.replace(/(\\?)([$=&])\{([^\}]+)\}/g, function(match, backslash, symbol, expression) {
        if (backslash) {
          return symbol + '{' + expression + '}';
        }
        if (symbol == '$') {
          if (!escapeHtmlVar) {
            escapeHtmlVar = ltl.vars[varIndex++];
          }
          return "'+" + escapeHtmlVar + '(' + prependState(expression, true) + ")+'";
        }
        else if (symbol == '&') {
          if (!encodeUriVar) {
            encodeUriVar = ltl.vars[varIndex++];
          }
          return "'+" + encodeUriVar + '(' + prependState(expression, true) + ")+'";
        }
        else {
          return "'+" + prependState(expression, true) + "+'";
        }
      });
    }

    // Iterate over each line.
    for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      var line = lines[lineIndex];

      // Mitigate recursion past 100 deep.
      var maxT = 1e2;

      // If the line is all whitespace, ignore it.
      if (!/\S/.test(line)) {
        if (blockIndent) {
          (blockLines = blockLines || []).push('');
        }
        continue;
      }

      // Find the number of leading spaces.
      var spaces = line.search(/[^ ]/);

      // If the first line with content has leading spaces, assume they all do.
      if (!hasContent) {
        globalSpaces = spaces;
        hasContent = true;
      }

      var adjustedSpaces = Math.max(spaces - globalSpaces, 0);

      // If this is our first time seeing leading spaces, that's our tab width.
      if (adjustedSpaces > 0 && !currentTabWidth) {
        currentTabWidth = adjustedSpaces;
      }

      // Calculate the number of levels of indentation.
      indent = adjustedSpaces ? Math.round(adjustedSpaces / currentTabWidth) : 0;

      // If we're in a block, we can append or close it.
      if (blockIndent) {
        // If we've gone back to where the block started, close the block.
        if (indent < blockIndent) {
          appendBlock();
        }
        // If we're still in the block, append to the block code.
        else {
          line = line.substring(Math.min(spaces, currentTabWidth * blockIndent));
          (blockLines = blockLines || []).push(line);
          continue;
        }
      }

      // Strip the leading spaces.
      line = line.substring(spaces);

      // Backtrack, closing any nested tags that need to be closed.
      backtrackIndent();
      if (inComment) {
        continue;
      }

      // Control patterns such as if/else/for must transform into true JavaScript.
      if (ltl.controlPattern.test(line)) {
        var script = transformScript(line);
        appendText('script', script);
      }

      // Assignment patterns just need to be stateified.
      else if (ltl.assignmentPattern.test(line)) {
        hasAssignments = true;
        line = prependState(line) + ';';
        appendText('script', line);
      }

      // Expression patterns make things append.
      else if (ltl.commandPattern.test(line)) {
        var data = ltl.trim(line).split(/\s+/);
        var command = data.shift();
        blockName = data.shift();
        blockContent = data.join(' ');
        var pair = blockName.split(':');
        blockName = pair[0];
        if (command == 'get') {
          appendText('html', "'+" + "p['" + blockName + "'].call(this,state)+'");
          hasGets = true;
        }
        else {
          if (pair[1] === '') {
            command += ':';
          }
          startBlock(command, blockContent);
        }
      }

      // Tags must be parsed for id/class/attributes/content.
      else {
        var rest = line;
        var t = 0;

        // Process the rest of the line recursively.
        while (rest && (++t < maxT)) {
          var tag = '';
          var id = '';
          var autoClass = '';
          var classes = [];
          var attributes = '';
          var character = '';
          var end = 0;
          var content = '';

          // Process the rest of the line recursively.
          while (rest && (++t < maxT)) {
            character = rest[0];

            // If it's an ID, read up to the next thing, and save the ID.
            if (character == '#') {
              end = rest.search(/([\.\(>:\s]|$)/);
              id = id || rest.substring(1, end);
              rest = rest.substring(end);
            }

            // If it's a class, read up to the next thing, and save the class.
            else if (character == '.') {
              end = rest.search(/([@#\(>:\s]|$)/);
              classes.push(rest.substring(1, end).replace(/\./g, ' '));
              rest = rest.substring(end);
            }

            // If it's the beginning of a list of attributes, iterate through them.
            else if (character == '(') {

              // Move on from the parentheses.
              rest = rest.substring(1);

              // Build attributes.
              attributes = '';
              while (rest && (++t < maxT)) {

                // Find quoted attributes or the end of the list.
                end = rest.search(/[\)"']/);

                // If there's no end, read what's left as attributes.
                if (end < 0) {
                  attributes += rest;
                  rest = '';
                  break;
                }
                character = rest[end];

                // If it's the end, get any remaining attribute and get out.
                if (character == ')') {
                  attributes += rest.substring(0, end);
                  rest = rest.substring(end + 1);
                  break;
                }

                // If it's not the end, read a quoted param.
                else {
                  // Allow for attributes to be comma separated or not.
                  // Also allow for valueless attributes.
                  attributes += rest.substring(0, end).replace(/[,\s]+/g, ' ');
                  rest = rest.substring(end);

                  // Find the next end quote.
                  // TODO: Deal with backslash-delimited quotes.
                  end = rest.indexOf(character, 1);

                  // Read to the end of the attribute.
                  attributes += rest.substring(0, end + 1);
                  rest = rest.substring(end + 1);
                }
              }
            }

            // If the next character is a greater than symbol, break for inline nesting.
            else if (character == '>') {
              rest = rest.replace(/^>\s*/, '');
              break;
            }

            // If the next character is a colon, enter a filter block.
            else if (character == ':') {
              blockTag = tag;
              rest = rest.substring(1).split(' ');
              startBlock(rest.shift(), rest.join(' '));
              rest = '';
              break;
            }

            // If the next character is a plus, store it as a property.
            else if (character == '+') {
              rest.replace(/^\+([^:\s]+):?(\S*)\s?(.*)$/, function (match, name, filter, content) {
                var target = ltl.languages[name] || name;
                blockProperty = target;
                blockTag = '';
                filter = (name == target ? '' : name) || filter;
                startBlock(filter, content);
              });
              rest = '';
              break;
            }

            // If the next character is an "at" symbol, create event listener references.
            else if (character == '@') {
              rest = rest.replace(/^@([$a-z0-9_~@]*)/i, function (match, events) {
                autoClass = autoClass || '_ltl' + (++ltl.lastId);
                classes.push(autoClass);
                var bind = bindings[autoClass] = bindings[autoClass] || {};
                events = events.split('@');
                for (var e = 0; e < events.length; e++) {
                  var listeners = events[e].split('~');
                  var eventName = listeners.shift();
                  var listen = bind[eventName] = bind[eventName] || [];
                  for (var l = 0; l < listeners.length; l++) {
                    listen.push(listeners[l]);
                  }
                }
              });
            }

            // If the next character is a tilde, it's an event listener or language.
            else if (character == '~') {
              rest.replace(/^(~[^:\s]+):?(\S*)\s?(.*)$/, function (match, name, filter, content) {
                var target = ltl.languages[name];
                if (target) {
                  eventLanguage = name;
                }
                else {
                  blockProperty = name;
                  blockTag = '';
                  startBlock(filter || eventLanguage, content);
                }
              });
              rest = '';
              break;
            }

            // If the next character is a space, it's the start of content.
            else if (character == ' ') {
              content = ltl.trim(rest);
              rest = '';
            }

            // If the next character isn't special, it's part of a tag.
            else {
              end = rest.search(/([#\.\(>:\s@]|$)/);
              // Prevent overwriting the tag.
              tag = tag || rest.substring(0, end);
              rest = rest.substring(end);
            }
          }

          // If it's a JS/CSS language, start an inline block.
          if (ltl.languages[tag]) {
            blockTarget = ltl.languages[tag];
            var filter = (tag == blockTarget ? '' : tag) || filter;
            tag = blockTag = blockTarget == 'css' ? 'style' : '//';
            startBlock(filter, content);
          }

          // If it's a comment, set a boolean so we can ignore its contents.
          if (tag.indexOf('//') === 0) {
            tag = '//';
            inComment = true;
          }

          // If it's not a comment, we'll add some HTML.
          else {
            var className = classes.join(' ');

            // Default to a <div> unless we're in a tagless block.
            if (!tag) {
              var useDefault = (blockTag === null) || id || className || attributes;
              if (useDefault) {
                tag = blockTag = 'div';
              }
            }

            // Convert ! or doctype into !DOCTYPE and assume html.
            if (tag == '!' || tag == 'doctype') {
              tag = '!DOCTYPE';
              attributes = attributes || 'html';
            }

            // Add attributes to the tag.
            var html = tag;
            if (id) {
              html += ' id="' + id + '"';
            }
            if (className) {
              html += ' class="' + className + '"';
            }
            if (attributes) {
              html += ' ' + attributes;
            }

            // Convert space tag to a space character.
            if (tag == 'space') {
              html = ' ' + content;
            }
            // Convert minus to a comment.
            else if (tag == '-') {
              html = '<!--' + content;
            }
            else {
              html = '<' + html + '>' + content;
            }

            html = ltl.escapeSingleQuotes(html);
            if (tag == 'html') {
              // If there's an HTML tag, don't wrap with a state.
              hasHtmlTag = true;
              if (!/DOCTYPE/.test(output)) {
                html = '<!DOCTYPE html>' + (settings.space ? '\\n' : '') + html;
              }
            }

            // Prepend whitespace if requested via settings.space.
            if (settings.space) {
              html = ltl.repeat(settings.space, tagDepth) + html;
              // Prepend a line break if this isn't the first tag.
              if (hasHtmlOutput) {
                html = '\\n' + html;
              }
            }

            // Add the HTML to the template function output.
            if (tag) {
              appendText('html', html);
              hasHtmlOutput = true;
            }
          }

          if (tag) {

            // Make sure we can close this tag.
            if (stack[indent]) {
              stack[indent] += ',' + tag;
            }
            else {
              stack[indent] = tag;
            }

            // Allow same-line tag open/close in settings.space mode.
            previousTag = tag;
            if (!ltl.selfClosePattern.test(tag)) {
              tagDepth++;
            }
          }

          tag = '';
          id = '';
          classes = [];
          attributes = '';
          content = '';
        }
      }
    }

    // We've reached the end, so unindent all the way.
    indent = 0;
    if (blockIndent) {
      appendBlock();
    }
    backtrackIndent();

    // Add the return statement (ending concatenation, where applicable).
    appendText('script', 'return o');

    if (blockSets) {
      return '{' + blockSets.join(',') + '}';
    }

    // Create the function.
    if (escapeCommentVar) {
      output = (settings.name ?
        'var ' + escapeCommentVar + "=this['-'];" :
        ltl.cache['-'].toString().replace(/\(/, escapeCommentVar + '(') + ';') + output;
    }
    if (escapeHtmlVar) {
      output = (settings.name ?
        'var ' + escapeHtmlVar + "=this.$;" :
        ltl.cache.$.toString().replace(/\(/, escapeHtmlVar + '(') + ';') + output;
    }
    if (encodeUriVar) {
      output = (settings.name ?
        'var ' + encodeUriVar + "=this['&'];" :
        ltl.cache['&'].toString().replace(/\(/, encodeUriVar + '(') + ';') + output;
    }
    if (hasAssignments) {
      output = 'state=state||{};' + output;
    }
    output = 'function(state' + (hasGets ? ',p' : '') + '){' + output + '}';

    // Evaluate the template as a function.
    name = settings.name;
    var template;
    try {
      template = ltl.run(output, name);
    }
    catch (e) {
      name = (name ? '"' + name + '"' : 'template');
      e.message = '[Ltl] Failed to compile ' + name + '. ' + e.message;
      throw e;
    }

    // If there's a name specified, cache it and refer to it.
    if (name) {
      ltl.cache[name] = template;
      template.key = name;
      template.cache = ltl.cache;
    }

    // Add event bindings to the JS property.
    for (var key in bindings) {
      var events = bindings[key];
      for (var event in events) {
        var listeners = events[event];
        for (var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          var js = properties['~' + listener];
          properties.js = properties.js ? properties.js + '\n' : '';
          properties.js += 'Jymin.on(".' + key + '","' + event + '",' +
            'function(element,event,target){' + js + '});';
        }
      }
    }

    // Add any discovered properties to the template.
    for (name in properties) {
      if (name[0] != '~') {
        template[name] = template[name] || properties[name];
      }
    }

    return template;
  }
};

// Export Ltl as a CommonJS module.
if (typeof module !== 'undefined') {
  module.exports = ltl;
}
