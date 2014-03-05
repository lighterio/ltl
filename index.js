/**
 * LTL is a template engine designed to be simple, beautiful and fast.
 */

// Allow leniency with tabs and spaces.
exports.tabWidth = 4;

// Self-closing HTML tags.
exports.selfClosePattern = /^(br|hr|img|input)$/;

// Supported JavaScript keywords.
exports.jsPattern = /^(for|each|if|else|else if)$/;

// Utility for throwing an exception.
exports.throwError = function (message, line) {
	throw new Exception(message + '\n' + line);
};

// Compile a template.
exports.compile = function (code, name, options) {

	// Replace carriage returns for Windows compatibility.
	code = code.replace(/\r/g, '');

	// Be lenient with mixed tabs and spaces, assuming tab width of 4.
	var tabReplacement = Array(exports.tabWidth + 1).join(' ');
	code = code.replace(/\t/g, tabReplacement);

	// We'll auto-detect tab width.
	var tabWidth = 0;

	// Initialize the code, and start at level zero with no nesting.
	var lines = code.split('\n');
	var level = 0
	var stack = [];
	var mode = 'html';
	var output = "eval.f=function(c){var o='";
	var vars = 'abdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
	var varIndex = 0;

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
		output += text;
	}

	function closeLevels(count) {
		for (var i = 0; i < count; i++) {
			var tag = stack.pop();
			if (tag == '{') {
				appendText('script', '}');
			}
			else if (tag && !exports.selfClosePattern.test(tag)) {
				appendText('html', '</' + tag + '>');
			}
		}
	}

	function transformScript(script) {
		script = script.replace(/^(for|each) ([$a-zA-Z_0-9]+) in ([$a-zA-Z_0-9]+)/i,
			function (match, keyword, item, array) {
			var i = vars[varIndex++];
			var l = vars[varIndex++];
			return 'for(var ' + i + '=0,' + l + '=c.' + array + '.length;' +
				i + '<' + l + ';++' + i + ')' +
				'{c.' + item + '=c.' + array + '[' + i + ']' + ';'
		});
		return script;
	}

	function interpolate(code) {
		var tokens = code.split(/\b/);
		var previous = null;
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (/^[a-z_]/i.test(token) && !exports.jsPattern.test(token) && previous != '.') {
				tokens[i] = 'c.' + token;
			}
			previous = token;
		}
		return tokens.join('');
	}

	// Iterate over each line.
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		// Find the number of leading spaces.
		var spaces = line.search(/[^ ]/);

		// If this is our first time seeing leading spaces, it's a single indent.
		if (spaces > 0 && !tabWidth) {
			tabWidth = spaces;
		} else if (spaces == -1) {
			spaces = 0;
		}

		var indent = spaces ? Math.round(spaces / tabWidth) : 0;
		var change = indent - level;
		closeLevels(1 - change);
		level = indent;


		// Strip the leading spaces.
		line = line.substr(spaces);
		// Don't do anything with an empty line.
		if (!line) {
			continue;
		}

		var word = line.match(/^([a-z0-9]+|else if)/);
		word = word ? word[0] : 'div';

		if (exports.jsPattern.test(word)) {
			var code = transformScript(line);
			if (exports.jsPattern.test(word)) {
				stack.push('{');
			}
			appendText('script', code);
		}
		else {
			stack.push(word);
			var pattern = /([a-z0-9]*)(#[^ \.\(]*)?(\.[^ \(]*)?(\([^\)]*\))?( .*)?$/;
			var matches = line.match(pattern);
			var tag = matches[1];
			var id = matches[2];
			var className = matches[3];
			var attributes = matches[4];
			var content = matches[5];
			if (id) {
				id = id.replace(/^#/, '');
				if (/['"]/.test(className)) {
					exports.throw("IDs cannot contain quotes.", line);
				}
				tag += ' id="' + id + '"';
			}
			if (className) {
				className = className.replace(/^\./, '');
				className = className.replace(/\./g, ' ');
				if (/['"]/.test(className)) {
					exports.throw("Classes cannot contain quotes.", line);
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
				content = content.replace(/^ /, '');
				content = content.replace(/'/g, "\\'");
				output += content;
			}
		}
	}

	closeLevels(level);
	appendText('script', "return o}");
	output = output.replace(/#\{([^\}]+)\}/g, function (match, code) {
		return "'+" + interpolate(code) + "+'";
	});
	eval(output);
	return eval.f;
};