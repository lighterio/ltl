/**
 * ltl is a template engine designed to be simple, beautiful and fast.
 */

var ltl = module.exports = (function (options) {

	// Allow leniency with tabs and spaces.
	var tabWidth = 4;

	// Some HTML tags won't have end tags;
	var selfClosePattern = /^(br|hr|img|input)\b/;

	// Supported JavaScript keywords.
	var jsPattern = /^(for|if|else|else if)\b/;

	// Stores available single character variable names
	var vars = 'abdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

	// Utility for throwing an exception.
	var throwError = function(msg, line) {
		throw new Error(msg + "\n" + line, 'ltl');
	};

	return {

		setTabWidth: function (value) {
			tabWidth = value;
		},

		compile: function (code, options) {

			// Replace carriage returns for Windows compatibility.
			code = code.replace(/\r/g, '');

			// Be lenient with mixed tabs and spaces, assuming tab width of 4.
			var tabReplacement = Array(tabWidth + 1).join(' ');
			code = code.replace(/\t/g, tabReplacement);

			// Initialize the code, and start at level zero with no nesting.
			var lines = code.split('\n');

			// We'll auto-detect tab width.
			var currentTabWidth = 0;

			var level = 0
			var stack = [];
			var mode = 'html';
			var output = "eval.f=function(c){var o='";

			var varIndex = 0;

			function appendText(textMode, text) {
				if (textMode != mode) {
					if (mode == 'html') {
						output += "'" + (text == '}' ? '' : ';');
					} else {
						output += "o+='";
					}
					mode = textMode;
				}
				output += text;
			}

			function closeLevels(count) {
				for (var i = 0; i < count; i++) {
					var tag = stack.pop();
					if (tag == '{') {
						appendText('script', '}');
					} else if (tag && !selfClosePattern.test(tag)) {
						appendText('html', '</' + tag + '>');
					}
				}
			}

			function transformScript(script) {
				var found = false;

				script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s+in\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
					function(match, keyword, item, array) {
						found = true;
						var i = vars[varIndex++];
						var l = vars[varIndex++];
						return 'for(var ' + i + '=0,' + l + '=c.' + array + '.length;' +
							i + '<' + l + ';++' + i + ')' +
							'{c.' + item + '=c.' + array + '[' + i + ']' + ';'
					});
				if (found) {
					return script;
				}

				script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*,\s*([$a-zA-Z_][$a-zA-Z_0-9]*)\s+of\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
					function(match, keyword, key, value, object) {
						found = true;
						var i = vars[varIndex++];
						return 'for(var ' + i + ' in c.' + object + ')' +
							'{if(!c.' + object + '.hasOwnProperty(' + i + '))continue;' +
							'c.' + key + '=' + i + ';'
							'c.' + value + '=c.' + object + '[' + i + ']' + ';'
					});

				if (found) {
					return script;
				}

				script = script.replace(/^(if|else|else if)\s+(\S.*)$/i,
					function(match, keyword, condition) {
						found = true;
						return keyword + '(' + condition + '){'
					});

				return script;
			}

			function interpolate(code) {
				var tokens = code.split(/\b/);
				var previous = null;
				for (var i = 0; i < tokens.length; i++) {
					var token = tokens[i];
					if (/^[a-z_]/i.test(token) && !jsPattern.test(token) && previous != '.') {
						tokens[i] = 'c.' + token;
					}
					previous = token;
				}
				return tokens.join('');
			}

			// Iterate over each line.
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];

				// If the line is all whitespace, ignore it.
				if (!/\S/.test(line)) {
					continue;
				}

				// Find the number of leading spaces.
				var spaces = line.search(/[^ ]/);

				// If this is our first time seeing leading spaces, it's a single indent.
				if (spaces > 0 && !currentTabWidth) {
					currentTabWidth = spaces;
				} else if (spaces == -1) {
					spaces = 0;
				}

				var indent = spaces ? Math.round(spaces / currentTabWidth) : 0;
				var change = indent - level;
				closeLevels(1 - change);
				level = indent;

				// Strip the leading spaces.
				line = line.substr(spaces);

				if (jsPattern.test(line)) {
					stack.push('{');
					var code = transformScript(line);
					appendText('script', code);
				} else {
					var pattern = /([a-z0-9]*)(#[^ \.\(]*)?(\.[^ \(]*)?(\([^\)]*\))?( .*)?$/;
					var matches = line.match(pattern);
					var tag = matches[1] || 'div';
					var id = matches[2];
					var className = matches[3];
					var attributes = matches[4];
					var content = matches[5];
					stack.push(tag);
					if (id) {
						id = id.replace(/^#/, '');
						if (/['"]/.test(className)) {
							throwError("IDs cannot contain quotes.", line);
						}
						tag += ' id="' + id + '"';
					}
					if (className) {
						className = className.replace(/^\./, '');
						className = className.replace(/\./g, ' ');
						if (/['"]/.test(className)) {
							throwError("Classes cannot contain quotes.", line);
						}
						tag += ' class="' + className + '"';
					}
					if (attributes) {
						attributes = attributes.replace(/^\(/, ' ');
						attributes = attributes.replace(/\)$/, '');
						tag += attributes;
					}
					appendText('html', '<' + tag + '>');
					if (content) {
						content = content.replace(/(^\s+|\s+$)/g, '');
						content = content.replace(/'/g, "\\'");
						output += content;
					}
				}
			}

			closeLevels(level + 1);
			appendText('script', "return o}");
			output = output.replace(/#\{([^\}]+)\}/g, function(match, code) {
				return "'+" + interpolate(code) + "+'";
			});
			eval(output);
			return eval.f;
		}
	}
})();
