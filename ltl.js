/**
 * ltl is a template language designed to be simple, beautiful and fast.
 */

var ltl = (function () {

	// Allow leniency with tabs and spaces.
	var tabWidth = 4;

	// Local variable names within outputted template functions.
	var contextVar = 'c';
	var outputVar = 'o';
	var partsVar = 'p';

	// Some HTML tags won't have end tags.
	var selfClosePattern = /^(!DOCTYPE|br|hr|img|input)\b/;

	// Supported control keywords (usage appears like tags).
	var controlPattern = /^(for|if|else|else if)\b/;

	// Supported command keywords.
	var commandPattern = /^(call|get|set)\b/;

	// JavaScript tokens that don't need contextVar prepended for interpolation.
	// TODO: Flesh out this list.
	var jsPattern = /^(true|false|null|NaN|Infinity|Math|window)$/;

	// Stores available single character variable names.
	var vars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

	// Remove starting/ending whitespace.
	function trim(text) {
		return text.replace(/(^\s+|\s+$)/g, '');
	}

	// Escape single quotes with a backslash.
	function escapeSingleQuotes(text) {
		return text.replace(/'/g, "\\'");
	}

	// Escape text with possible line breaks for appending to a string.
	function escapeBlock(text) {
		return escapeSingleQuotes(text).replace(/\n/g, '\\n');
	}

	// Public API.
	var ltl = {

		// Allow users to see what version of ltl they're using.
		version: '0.0.3',

		// Store all of the templates that have been compiled.
		cache: {},

		// Allow users to customize the tab width (default: 4).
		setTabWidth: function (value) {
			tabWidth = value;
		},

		// Allow users to customize the template output variable (default: 'o').
		setOutputVar: function (value) {
			outputVar = value;
			vars = vars.replace(outputVar, '');
		},

		// Allow users to customize the template context argument (default: 'c').
		setContextVar: function (value) {
			contextVar = value;
			vars = vars.replace(contextVar, '');
		},

		// Allow users to customize the template parts argument (default: 'p').
		setPartsVar: function (value) {
			partsVar = value;
			vars = vars.replace(partsVar, '');
		},

		// Create a function that accepts context and returns markup.
		compile: function (code, options) {

			// Prevent variable conflicts.
			this.setOutputVar(outputVar);
			this.setContextVar(contextVar);
			this.setPartsVar(partsVar);


			// Default to empty options.
			options = options || {};

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
			var tabReplacement = Array(tabWidth + 1).join(' ');
			code = code.replace(/\t/g, tabReplacement);

			// We'll auto-detect tab width.
			var currentTabWidth = 0;

			// Initialize the code, and start at level zero with no nesting.
			var lines = code.split('\n');

			var indent = 0;
			var stack = [];
			var mode = 'html';
			var output = 'var ' + outputVar + "='";

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

			function startBlock(filter) {
				blockIndent = indent + 1;
				blockFilter = filter;
				blockLines = [];
			}

			function appendBlock() {
				var text = blockLines.join('\n');

				// Reset the blockage.
				blockIndent = 0;

				// If we're in a "call" block, compile the contents.
				if (blockFilter == 'call') {
					appendText('html', "'+this['" + blockName + "'].call(this," + contextVar + (text ? ',' + ltl.compile(text) : '') + ")+'");
					return;
				}
				// For a "set" block.
				else if (blockFilter == 'set' || blockFilter == 'set:') {
					var block;
					if (blockFilter == 'set') {
						block = ltl.compile(text).toString();
					} else {
						block = "function(){return '" + escapeBlock(text) + "'}";
					}
					blockSets.push("'" + escapeSingleQuotes(blockName) + "':" + block);
					return;
				}
				// If there's a filter, get its module.
				else if (blockFilter) {
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
				}

				// Detect the module's API, and filter the text.
				if (blockFilter.compile) {
					text = blockFilter.compile(text);
				}
				else if (blockFilter.markdown) {
					text = blockFilter.markdown.toHTML(text);
				}
				else if (typeof blockFilter == 'function') {
					text = blockFilter(text);
				}

				appendText('html', escapeBlock(text));
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
								// Do nothing. What follows is un-tagged text.
							}
							else if (tag == '{') {
								appendText('script', '}');
							}
							else if (!selfClosePattern.test(tag)) {
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

			// If we end up in a dot block, remember the starting indent and filter, and gather lines.
			var blockIndent = 0;
			var blockFilter = '';
			var blockLines = [];

			var blockName = '';
			var blockSets = [];
			var hasGets = false;
			var inComment = false;

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

				// Calculate the number of levels of indentation.
				var indent = spaces ? Math.round(spaces / currentTabWidth) : 0;

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
					stack.push('{');
					var code = transformScript(line);
					appendText('script', code);
				}

				// Expression patterns make things append.
				else if (commandPattern.test(line)) {
					var pair = trim(line).split(/\s+/);
					var command = pair[0];
					blockName = pair[1];
					pair = blockName.split(':');
					blockName = pair[0];
					if (command == 'get') {
						appendText('html', "'+" + partsVar + "['" + blockName + "'](" + contextVar + ")+'");
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
								end = rest.search(/([\.\(>:\s]|$)/);
								id = rest.substring(1, end);
								rest = rest.substring(end);
							}

							// If it's a class, read up to the next thing, and save the className.
							else if (character == '.') {
								end = rest.search(/([\(>:\s]|$)/);
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
								startBlock(trim(rest.substring(1)));
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
								tag = rest.substring(0, end);
								rest = rest.substring(end);
							}
						}

						// If it's a comment, set a boolean so we can ignore its contents.
						if (tag == '//') {
							inComment = true;
						}
						// If it's a minus, just insert the content.
						else if (tag == '-') {
							appendText('html', escapeSingleQuotes(content));
						}
						// If it's not a comment, we'll add some HTML.
						else {
							// Default to a <div> if we don't know what tag it is.
							tag = tag || 'div';

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
							html = escapeSingleQuotes('<' + html + '>' + content);
							if (tag == 'html' && !/DOCTYPE/.test(output)) {
								html = '<!DOCTYPE html>' + html;
							}

							// Add the HTML to the template function output.
							appendText('html', html);
						}

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

			// We've reached the end, so unindent all the way.
			indent = 0;
			if (blockIndent) {
				appendBlock();
			}
			backtrackIndent();

			// Add the return statement (ending concatenation, where applicable).
			appendText('script', 'return ' + outputVar);

			if (blockSets.length) {
				return '{' + blockSets.join(',') + '}';
			}

			// Create the function.
			var escapeVar = 0;
			output = output.replace(/([\$=])\{([^\}]+)\}/g, function(match, symbol, code) {
				if (symbol == '$') {
					if (!escapeVar) {
						escapeVar = vars[varIndex++];
					}
					return "'+" + escapeVar + '(' + interpolate(code) + ")+'";
				}
				else {
					return "'+" + interpolate(code) + "+'";
				}
			});
			if (escapeVar) {
				output = "function " + escapeVar + "(t){" +
					"var r={'<':'&lt;','&':'&amp;','>':'&gt;'};" +
					"return (''+t).replace(/[<&>]/g,function(m){return r[m]})};" + output;
			}
			output = 'eval.f=function(' + contextVar + (hasGets ? ',' + partsVar : '') + '){' + output + '}';
			try {
				eval(output);
			}
			catch (e) {
				// Anyone hitting an error here should submit an issue on GitHub.
				/* istanbul ignore next */
				throw "Could not save output as a function: " + output;
			}
			var template = eval.f;

			// If there's a name specified, cache the template with that name.
			if (options.name) {
				this.cache[options.name] = template;
			}

			return template;
		}
	};
	return ltl;
})();

if (typeof window == 'undefined') {
	module.exports = ltl;
}
else {
	window.ltl = ltl;
}