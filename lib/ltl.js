/**
 * ltl is a template language designed to be simple, beautiful and fast.
 */

var ltl = module.exports = (function (options) {

	// Allow leniency with tabs and spaces.
	var tabWidth = 4;

	// Local variable names within outputted template functions.
	var contextVar = 'c';
	var outputVar = 'o';

	// Some HTML tags won't have end tags.
	var selfClosePattern = /^(!DOCTYPE|br|hr|img|input)\b/;

	// Supported control keywords (usage appears like tags).
	var controlPattern = /^(for|if|else|else if)\b/;

	// JavaScript tokens that don't need contextVar prepended for interpolation.
	// TODO: Flesh out this list.
	var jsPattern = /^(true|false|null|NaN|Infinity|Math)$/;

	// Stores available single character variable names.
	var vars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

	// Public API.
	return {

		// Allow users to customize the tab width (default: 4).
		setTabWidth: function (value) {
			tabWidth = value;
		},

		// Allow users to customize the template output variable (default: 'o').
		setOutputVar: function (value) {
			outputVar = value;
		},

		// Allow users to customize the template context argument (default: 'c').
		setContextVar: function (value) {
			contextVar = value;
		},

		// Create a function that accepts context and returns markup.
		compile: function (code, options) {

			// Don't reuse the context or output variables.
			vars = vars.replace(contextVar, '').replace(outputVar, '');

			// Replace carriage returns for Windows compatibility.
			code = code.replace(/\r/g, '');

			// Be lenient with mixed tabs and spaces, assuming tab width of 4.
			var tabReplacement = Array(tabWidth + 1).join(' ');
			code = code.replace(/\t/g, tabReplacement);

			// We'll auto-detect tab width.
			var currentTabWidth = 0;

			// Initialize the code, and start at level zero with no nesting.
			var lines = code.split('\n');

			var indent = 0;
			var stack = [];
			var mode = 'html';
			var output = "eval.f=function(" + contextVar + "){var " + outputVar + "='";

			var varIndex = 0;

			function appendText(textMode, text) {
				if (textMode != mode) {
					if (mode == 'html') {
						output += "'" + (text == '}' ? '' : ';');
					} else {
						output += outputVar + "+='";
					}
					mode = textMode;
				}
				output += text;
			}

			function backtrackIndent() {
				while (stack.length > indent) {
					var tags = stack.pop();
					if (tags == '{') {
						appendText('script', '}');
					} else {
						tags = tags.split(/,/g);
						for (var i = tags.length - 1; i >= 0; i--) {
							var tag = tags[i];
							if (!selfClosePattern.test(tag)) {
								appendText('html', '</' + tag + '>');
							}
						}
					}
				}
			}

			function transformScript(script) {
				var c = contextVar;
				var found = false;

				script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s+in\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
					function(match, keyword, item, array) {
						found = true;
						var i = vars[varIndex++];
						var l = vars[varIndex++];
						return 'for(var ' + i + '=0,' + l + '=' + c + '.' + array + '.length;' +
							i + '<' + l + ';++' + i + ')' +
							'{' + c + '.' + item + '=' + c + '.' + array + '[' + i + ']' + ';';
					});
				if (found) {
					return script;
				}

				script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*,\s*([$a-zA-Z_][$a-zA-Z_0-9]*)\s+of\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
					function(match, keyword, key, value, object) {
						found = true;
						var i = vars[varIndex++];
						return 'for(var ' + i + ' in ' + c + '.' + object + ')' +
							'{if(!' + c + '.' + object + '.hasOwnProperty(' + i + '))continue;' +
							c + '.' + key + '=' + i + ';' +
							c + '.' + value + '=' + c + '.' + object + '[' + i + ']' + ';';
					});

				if (found) {
					return script;
				}

				script = script.replace(/^(else if|else|if)\s*(.*)\s*$/i,
					function(match, keyword, condition) {
						found = true;
						return keyword + (condition ? '(' + interpolate(condition) + ')' : '') + '{';
					});

				return script;
			}

			function interpolate(code) {
				var tokens = code.split(/\b/);
				var isProperty = false;
				for (var i = 0; i < tokens.length; i++) {
					var token = tokens[i];
					if (/^[a-z_]/i.test(token)) {
						if (!jsPattern.test(token)) {
							if (!isProperty) {
								tokens[i] = contextVar + '.' + token;
							}
						}
					}
					isProperty = token[token.length - 1] == '.';
				}
				return tokens.join('');
			}

			// Iterate over each line.
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
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

				var indent = spaces ? Math.round(spaces / currentTabWidth) : 0;
				backtrackIndent();

				// Strip the leading spaces.
				line = line.substring(spaces);

				// Control patterns such as if/else/for must transform into true JavaScript.
				if (controlPattern.test(line)) {
					stack.push('{');
					var code = transformScript(line);
					appendText('script', code);
				}

				// Tags must be parsed for id/class/attributes/content.
				else {
					var rest = line;
					var t = 0;

					// Process the rest of the line recursively.
					while (rest && (++t < maxT)) {
						var tag = '';
						var id = '';
						var className = '';
						var attributes = '';
						var content = '';
						var character = '';
						var end = 0;

						// Process the rest of the line recursively.
						while (rest && (++t < maxT)) {
							character = rest[0];

							// If it's an ID, read up to the next thing, and save the ID.
							if (character == '#') {
								end = rest.search(/([\.\(:\s]|$)/);
								id = rest.substring(1, end);
								rest = rest.substring(end);
							}

							// If it's one or more classes, read and save them.
							else if (character == '.') {
								end = rest.search(/([\(:\s]|$)/);
								className = rest.substring(1, end).replace(/\./g, ' ');
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
									if (end < 0) {
										throw new Error('Unclosed tag attributes.');
									}
									character = rest[end];

									// If it's the end, get any remaining attribute and get out.
									if (character == ')') {
										attributes += rest.substring(0, end);
										rest = rest.substring(end + 1);
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

							// If the next character is a colon, break for inline nesting.
							else if (character == ':') {
								rest = rest.replace(/^:\s*/, '');
								break;
							}

							// If the next character is whitespace, it's the start of content.
							else if (character == ' ' || character == '\t') {
								content = rest;
								content = content.replace(/(^\s+|\s+$)/g, '');
								content = content.replace(/'/g, "\\'");
								rest = '';
							}

							// If the next character isn't special, it's part of a tag.
							else {
								end = rest.search(/([#\.\(:\s]|$)/);
								tag = rest.substring(0, end);
								rest = rest.substring(end);
							}
						}

						// Default to a <div> if we don't know what tag it is.
						tag = tag || 'div';
						if (tag == '!') {
							tag = '!DOCTYPE';
							if (!attributes) {
								attributes = 'html';
							}
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
						html = '<' + html + '>' + content;
						html = html.replace(/'/g, "\\'");

						// Add the HTML to the template function output.
						appendText('html', html);

						// Make sure we can close this tag.
						if (stack[indent]) {
							stack[indent] += ',' + tag;
						}
						else {
							stack[indent] = tag;
						}
						tag = '';
						id = '';
						className = '';
						attributes = '';
						content = '';
					}
				}
			}

			indent = 0;
			backtrackIndent();
			appendText('script', "return " + outputVar + "}");
			output = output.replace(/#\{([^\}]+)\}/g, function(match, code) {
				return "'+" + interpolate(code) + "+'";
			});
			eval(output);
			return eval.f;
		}
	}
})();
