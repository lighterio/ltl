/**
 * ltl is a template language designed to be simple, beautiful and fast.
 */

(function () {

  var isBrowser = (typeof window == 'object');

  // Some HTML tags won't have end tags.
  var selfClosePattern = /^(!DOCTYPE|area|base|br|hr|img|input|link|meta|-|\/\/)(\b|$)/;

  // Supported control keywords (usage appears like tags).
  var controlPattern = /^(for|if|else|else if)\b/;

  // Supported command keywords.
  var commandPattern = /^(call|get|set)\b/;

  // JavaScript tokens that don't need contextVar prepended for interpolation.
  // TODO: Flesh out this list?
  var jsPattern = /^(true|false|null|NaN|Infinity|window|location|Math|console)$/;

  // Stores available single character variable names.
  var varCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

  // Remove starting/ending whitespace.
  function trim(text) {
    return text.replace(/(^\s+|\s+$)/g, '');
  }

  // Remove starting/ending whitespace.
  function repeat(text, times) {
    return (new Array(times + 1)).join(text);
  }

  // Escape single quotes with a backslash.
  function escapeSingleQuotes(text) {
    return text.replace(/'/g, "\\'");
  }

  // Escape text with possible line breaks for appending to a string.
  function escapeBlock(text) {
    return escapeSingleQuotes(text).replace(/\n/g, '\\n');
  }

  // When compilation fails, we can re-run in debug mode.
  function debug(output, settings) {
    var fs = require('fs');
    var dir = process.cwd() + '/.debug';
    var name = (settings.name || 'template').replace(/[\/\\]/g, '__');
    try {
      fs.mkdirSync(dir);
    }
    catch (e) {
      // Probably already exists.
    }
    fs.writeFileSync(dir + '/' + name + '.js', 'module.exports=' + output);
    try {
      require(dir + '/' + name);
    }
    catch (e) {
      name = (settings.name ? '"' + settings.name + '"' : 'template');
      e.message = '[Ltl] Failed to compile ' + name + '. ' + e.message;
      throw e;
    }
  }

  // Public API.
  var ltl = {

    // Allow users to see what version of ltl they're using.
    version: '0.1.14',

    // Store all of the templates that have been compiled.
    cache: {},

    // Default compile settings.
    _options: {
      tabWidth: 4,
      outputVar: 'o',
      contextVar: 'c',
      partsVar: 'p',
      enableDebug: false
    },

    // Change compile options.
    setOption: function (name, value) {
      this._options[name] = value;
    },

    // Create a function that accepts context and returns markup.
    compile: function (code, options) {

      // Copy the default options.
      var settings = {
        tabWidth: this._options.tabWidth,
        outputVar: this._options.outputVar,
        contextVar: this._options.contextVar,
        partsVar: this._options.partsVar,
        space: this._options.space,
        enableDebug: this._options.enableDebug
      };
      for (var name in options) {
        settings[name] = options[name];
      }
      if (settings.enableDebug && !settings.space) {
        settings.space = '  ';
      }

      // Don't allow context/output/parts vars to become user vars.
      var vars = varCharacters;
      vars = vars.replace(settings.contextVar, '');
      vars = vars.replace(settings.outputVar, '');
      vars = vars.replace(settings.partsVar, '');

      if (settings.space) {
        settings.space = escapeBlock(settings.space);
      }

      // Find out if we're in the browser.
      var inBrowser = false;
      try {
        inBrowser = window.document.body.tagName == 'BODY';
      }
      catch (e) {
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

      var indent = 0;
      var stack = [];
      var mode = 'html';
      var previousTag;
      var hasHtmlOutput = false;
      var tagDepth = 0;
      var output = 'var ' + settings.outputVar + "='";

      var varIndex = 0;
      var escapeHtmlVar = false;
      var encodeUriVar = false;
      var loopVars = [];

      function appendText(textMode, text) {
        if (textMode != mode) {
          if (mode == 'html') {
            output += "'" + (text == '}' ? '' : ';');
          } else {
            output += settings.outputVar + "+='";
          }
          mode = textMode;
        }
        if (mode == 'html') {
          text = interpolate(text);
        }
        output += text;
      }

      function startBlock(filter) {
        blockIndent = indent + 1;
        blockFilter = filter;
        blockLines = [];
      }

      function appendBlock() {
        var text = blockLines.join('\n');

        // Reset the blockage.
        blockIndent = 0;

        // Some options should be passed through.
        var blockOptions = {
          outputVar: settings.outputVar,
          contextVar: settings.contextVar,
          partsVar: settings.partsVar,
          space: settings.space,
          enableDebug: settings.enableDebug
        };

        // If we're in a "call" block, compile the contents.
        if (blockFilter == 'call') {
          appendText('html',
            "'+this['" + blockName + "'].call(this," + settings.contextVar +
            (text ? ',' + ltl.compile(text, blockOptions) : '') + ")+'");
          return;
        }
        // For a "set" block.
        else if (blockFilter == 'set' || blockFilter == 'set:') {
          var block;
          if (blockFilter == 'set') {
            block = ltl.compile(text, blockOptions).toString();
          } else {
            block = "function(){return '" + escapeBlock(text) + "'}";
          }
          blockSets.push("'" + escapeSingleQuotes(blockName) + "':" + block);
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
          try {
            if (inBrowser) {
              blockFilter = window[blockFilter];
            }
            else {
              blockFilter = require(blockFilter);
            }
          }
          catch (e) {
            throw new Error('Unknown filter "' + blockFilter + '". Try "npm install ' + blockFilter + '" first.');
          }
        } else {
          blockFilter = 'text';
        }

        // Detect the module's API, and filter the text.
        if (blockFilter.compile) {
          var nowrap = /^[^A-Z]*NOWRAP/.test(text);
          text = blockFilter.compile(text);
          if (nowrap) {
            text = text.replace(/(^\(function\(\) \{\s*|\s*\}\)\.call\(this\);\s*$)/g, '');
          }
        }
        else if (blockFilter.parse) {
          text = blockFilter.parse(text);
        }
        else if (typeof blockFilter == 'function') {
          text = blockFilter(text);
        }

        text = trim(text);
        if (settings.space) {
          if (hasHtmlOutput) {
            text = '\n' + text;
          }
          text = text.replace(/\n/g, '\n' + repeat(settings.space, tagDepth));
          if (blockTag) {
            text += '\n' + repeat(settings.space, tagDepth - 1);
          }
        }

        appendText('html', escapeBlock(text));

        blockTag = null;
        blockFilter = null;
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
              else if (controlPattern.test(tag)) {
                appendText('script', '}');
                if (tag == 'for') {
                  loopVars.pop();
                }
              }
              else if (!selfClosePattern.test(tag)) {
                var html = '</' + tag + '>';
                tagDepth--;
                if (tag == previousTag) {
                  previousTag = null;
                }
                else if (settings.space) {
                  html = '\\n' + repeat(settings.space, tagDepth) + html;
                }
                appendText('html', html);
              }
            }
          }
        }
      }

      function transformScript(script) {
        var c = settings.contextVar;
        var found = false;

        script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s+in\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
          function(match, keyword, item, array) {
            found = true;
            var i = vars[varIndex++];
            var l = vars[varIndex++];
            var e = vars[varIndex++];
            loopVars.push([[item, e]]);
            return 'for(var ' + e + ',' + i + '=0,' + l + '=' + c + '.' + array + '.length;' +
              i + '<' + l + ';++' + i + ')' +
              '{' + e + '=' + c + '.' + array + '[' + i + ']' + ';';
          });
        if (found) {
          stack.push('for');
          return script;
        }

        script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*,\s*([$a-zA-Z_][$a-zA-Z_0-9]*)\s+of\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
          function(match, keyword, key, value, object) {
            found = true;
            var k = vars[varIndex++];
            var v = vars[varIndex++];
            loopVars.push([[key, k], [value, v]]);
            return 'for(var ' + k + ' in ' + c + '.' + object + ')' +
              '{if(!' + c + '.' + object + '.hasOwnProperty(' + k + '))continue;' +
              v + '=' + c + '.' + object + '[' + k + ']' + ';';
          });

        if (found) {
          stack.push('for');
          return script;
        }

        script = script.replace(/^(else if|else|if)\s*(.*)\s*$/i,
          function(match, keyword, condition) {
            found = true;
            return keyword + (condition ? '(' + contextify(condition) + ')' : '') + '{';
          });

        stack.push('if');
        return script;
      }

      /**
       * Convert a JavaScripty expression to a scoped expression using contextVar.
       * TODO: Actually parse JavaScript so that strings can't be interpreted as vars.
       */
      function contextify(code) {
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
              if (!jsPattern.test(token)) {
                for (var j = 0; j < loopVars.length; j++) {
                  for (var k = 0; k < loopVars[j].length; k++) {
                    if (token == loopVars[j][k][0]) {
                      isLoopVar = true;
                      tokens[i] = loopVars[j][k][1];
                    }
                  }
                }
                if (!isProperty && !isLoopVar) {
                  tokens[i] = settings.contextVar + '.' + token;
                }
              }
            }
            isProperty = token[token.length - 1] == '.';
            isLoopVar = false;
          }
        }
        return tokens.join('');
      }

      /**
       * Find ${...}, &{...} and ={...} and turn them into contextified insertions unless escaped.
       */
      function interpolate(code) {
        return code.replace(/(\\?)([$=&])\{([^\}]+)\}/g, function(match, backslash, symbol, expression) {
          if (backslash) {
            return symbol + '{' + expression + '}';
          }
          if (symbol == '$') {
            if (!escapeHtmlVar) {
              escapeHtmlVar = vars[varIndex++];
            }
            return "'+" + escapeHtmlVar + '(' + contextify(expression) + ")+'";
          }
          else if (symbol == '&') {
            if (!encodeUriVar) {
              encodeUriVar = vars[varIndex++];
            }
            return "'+" + encodeUriVar + '(' + contextify(expression) + ")+'";
          }
          else {
            return "'+" + contextify(expression) + "+'";
          }
        });
      }

      // If we end up in a dot block, remember the starting indent and filter, and gather lines.
      var blockIndent = 0;
      var blockFilter = '';
      var blockLines = [];
      var blockTag = null;

      var blockName = '';
      var blockSets = [];
      var hasGets = false;
      var inComment = false;

      // Iterate over each line.
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Mitigate recursion past 100 deep.
        var maxT = 1e2;

        // If the line is all whitespace, ignore it.
        if (!/\S/.test(line)) {
          continue;
        }

        // Find the number of leading spaces.
        var spaces = line.search(/[^ ]/);

        // If this is our first time seeing leading spaces, that's our tab width.
        if (spaces > 0 && !currentTabWidth) {
          currentTabWidth = spaces;
        }

        // Calculate the number of levels of indentation.
        indent = spaces ? Math.round(spaces / currentTabWidth) : 0;

        // If we're in a block, we can append or close it.
        if (blockIndent) {
          // If we've gone back to where the block started, close the block.
          if (indent < blockIndent) {
            appendBlock();
          }
          // If we're still in the block, append to the block code.
          else {
            line = line.substring(Math.min(spaces, currentTabWidth * blockIndent));
            blockLines.push(line);
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
        if (controlPattern.test(line)) {
          var script = transformScript(line);
          appendText('script', script);
        }

        // Expression patterns make things append.
        else if (commandPattern.test(line)) {
          var pair = trim(line).split(/\s+/);
          var command = pair[0];
          blockName = pair[1];
          pair = blockName.split(':');
          blockName = pair[0];
          if (command == 'get') {
            appendText('html', "'+" + settings.partsVar + "['" + blockName + "'].call(this," + settings.contextVar + ")+'");
            hasGets = true;
          }
          else {
            if (pair[1] === '') {
              command += ':';
            }
            startBlock(command);
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
            var classes = [];
            var attributes = '';
            var content = '';
            var character = '';
            var end = 0;

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
                end = rest.search(/([#\(>:\s]|$)/);
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

              // If the next character is a colon, enter a block.
              else if (character == ':') {
                blockTag = tag;
                rest = rest.substring(1).split(' ');
                startBlock(rest.shift());
                if (rest.length > 0) {
                  blockLines.push(rest.join(' '));
                }
                rest = '';
                break;
              }

              // If the next character is a space, it's the start of content.
              else if (character == ' ') {
                content = trim(rest);
                rest = '';
              }

              // If the next character isn't special, it's part of a tag.
              else {
                end = rest.search(/([#\.\(>:\s]|$)/);
                // Prevent overwriting the tag.
                tag = tag || rest.substring(0, end);
                rest = rest.substring(end);
              }
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

              // Convert minus to a comment.
              if (tag == '-') {
                html = '<!--' + content;
              }
              else {
                html = '<' + html + '>' + content;
              }

              html = escapeSingleQuotes(html);
              if (tag == 'html' && !/DOCTYPE/.test(output)) {
                html = '<!DOCTYPE html>' + (settings.space ? '\\n' : '') + html;
              }

              // Prepend whitespace if requested via settings.space.
              if (settings.space) {
                html = repeat(settings.space, tagDepth) + html;
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
              if (!selfClosePattern.test(tag)) {
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
      appendText('script', 'return ' + settings.outputVar);

      if (blockSets.length) {
        return '{' + blockSets.join(',') + '}';
      }

      // Create the function.
      if (escapeHtmlVar) {
        output = "function " + escapeHtmlVar + "(t){return (t==null?'':''+t).replace(/</g,'&lt;')};" + output;
      }
      if (encodeUriVar) {
        output = "function " + encodeUriVar + "(t){return (encodeURIComponent||escape)(t==null?'':''+t)};" + output;
      }
      output = 'function(' + settings.contextVar + (hasGets ? ',' + settings.partsVar : '') + '){' + output + '}';

      // Evaluate the template as a function.
      try {
        eval('eval.f=' + output); // jshint ignore:line
      }
      catch (e) {
        // If we failed in a dev environment in Node, we can try to debug it.
        if (process && settings.enableDebug) {
          debug(output, settings);
        }
        // Otherwise, just fail.
        else {
          var name = (settings.name ? '"' + settings.name + '"' : 'template');
          e.message = '[Ltl] Failed to compile ' + name + '. ' + e.message;
          throw e;
        }
      }
      var template = eval.f;

      // If there's a name specified, cache the template with that name.
      if (settings.name) {
        this.cache[settings.name] = template;
      }

      return template;
    }
  };

  if (isBrowser) {
    window.ltl = ltl;
  }
  else {
    module.exports = ltl;
  }

})();
