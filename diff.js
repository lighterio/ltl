diff --git a/.gitignore b/.gitignore
index ccc322a..e2c67f2 100644
--- a/.gitignore
+++ b/.gitignore
@@ -13,4 +13,5 @@ logs
 results
 
 npm-debug.log
+coverage
 node_modules
diff --git a/.travis.yml b/.travis.yml
new file mode 100644
index 0000000..87f8cd9
--- /dev/null
+++ b/.travis.yml
@@ -0,0 +1,3 @@
+language: node_js
+node_js:
+  - "0.10"
\ No newline at end of file
diff --git a/README.md b/README.md
index 6552c23..4585c8e 100644
--- a/README.md
+++ b/README.md
@@ -1,16 +1,24 @@
 # ltl
 
 ltl (pronounced "little") is a lightweight template language for JavaScript
-which generates HTML. Its syntax is clean like Jade, and its performance
-is amazing like [dot](https://github.com/olado/doT).
+which generates HTML. Its syntax is clean like [Jade](http://jade-lang.com/reference/), and its performance
+is amazing like [doT](https://github.com/olado/doT).
 
-### Testing
+### Contributing
 
-*Performance testing* can be done by running `node perf`.
-The output shows the average time in milliseconds it took to perform each of the operations.
+Setup is simple: just `git clone` and `npm install`, and you're ready to start.
 
+<<<<<<< HEAD
 *Unit testing* can be done by running `npm test`.
+=======
+### Testing
+>>>>>>> e869491cb0e7f68a0183611f13565da97dff0a28
 
-### Contributing
+**Performance testing** can be done by running `npm perf`.
+The output shows the average time in milliseconds it took to perform each of the operations.
 
+<<<<<<< HEAD
 Setup is simple: just `git clone` and `npm install`, and you're ready to start.
+=======
+**Unit testing** can be done by running `npm test`. Coverage can be checked via `npm test --coverage` and viewed via `npm run view-coverage`. [Mocha](http://visionmedia.github.io/mocha/) is used for testing this library.
+>>>>>>> e869491cb0e7f68a0183611f13565da97dff0a28
diff --git a/lib/ltl.js b/lib/ltl.js
index 900719a..d9a4d82 100644
--- a/lib/ltl.js
+++ b/lib/ltl.js
@@ -1,5 +1,5 @@
 /**
- * ltl is a template language designed to be simple, beautiful and fast.
+ * ltl is a template engine designed to be simple, beautiful and fast.
  */
 
 var ltl = module.exports = (function (options) {
@@ -7,40 +7,26 @@ var ltl = module.exports = (function (options) {
 	// Allow leniency with tabs and spaces.
 	var tabWidth = 4;
 
-	// Local variable names within outputted template functions.
-	var contextVar = 'c';
-	var outputVar = 'o';
-
-	// Some HTML tags won't have end tags.
+	// Some HTML tags won't have end tags;
 	var selfClosePattern = /^(br|hr|img|input)\b/;
 
 	// Supported JavaScript keywords.
-	var controlPattern = /^(for|if|else|else if)\b/;
+	var jsPattern = /^(for|if|else|else if)\b/;
+
+	// Stores available single character variable names
+	var vars = 'abdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
 
 	// Utility for throwing an exception.
 	var throwError = function(msg, line) {
 		throw new Error(msg + "\n" + line, 'ltl');
 	};
 
-	// Public API.
 	return {
 
-		// Allow users to customize the tab width (default: 4).
 		setTabWidth: function (value) {
 			tabWidth = value;
 		},
 
-		// Allow users to customize the tab width (default: 4).
-		setOutputVar: function (value) {
-			outputVar = value;
-		},
-
-		// Allow users to customize the tab width (default: 4).
-		setContextVar: function (value) {
-			contextVar = value;
-		},
-
-		// Create a function that accepts context and returns markup.
 		compile: function (code, name, options) {
 
 			// Replace carriage returns for Windows compatibility.
@@ -50,16 +36,17 @@ var ltl = module.exports = (function (options) {
 			var tabReplacement = Array(tabWidth + 1).join(' ');
 			code = code.replace(/\t/g, tabReplacement);
 
+			// Initialize the code, and start at level zero with no nesting.
+			var lines = code.split('\n');
+
 			// We'll auto-detect tab width.
 			var currentTabWidth = 0;
 
-			// Initialize the code, and start at level zero with no nesting.
-			var lines = code.split('\n');
 			var level = 0
 			var stack = [];
 			var mode = 'html';
 			var output = "eval.f=function(c){var o='";
-			var vars = 'abdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
+
 			var varIndex = 0;
 
 			function appendText(textMode, text) {
@@ -87,17 +74,15 @@ var ltl = module.exports = (function (options) {
 
 			function transformScript(script) {
 				var found = false;
-				var c = contextVar;
-				var o = outputVar;
 
 				script = script.replace(/^(for)\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s+in\s+([$a-zA-Z_][$a-zA-Z_0-9]*)\s*$/i,
 					function(match, keyword, item, array) {
 						found = true;
 						var i = vars[varIndex++];
 						var l = vars[varIndex++];
-						return 'for(var ' + i + '=0,' + l + '=' + c + '.' + array + '.length;' +
+						return 'for(var ' + i + '=0,' + l + '=c.' + array + '.length;' +
 							i + '<' + l + ';++' + i + ')' +
-							'{' + c + '.' + item + '=' + c + '.' + array + '[' + i + ']' + ';'
+							'{c.' + item + '=c.' + array + '[' + i + ']' + ';'
 					});
 				if (found) {
 					return script;
@@ -107,10 +92,10 @@ var ltl = module.exports = (function (options) {
 					function(match, keyword, key, value, object) {
 						found = true;
 						var i = vars[varIndex++];
-						return 'for(var ' + i + ' in ' + c + '.' + object + ')' +
-							'{if(!' + c + '.' + object + '.hasOwnProperty(' + i + '))continue;' +
-							c + '.' + key + '=' + i + ';'
-							c + '.' + value + '=' + c + '.' + object + '[' + i + ']' + ';'
+						return 'for(var ' + i + ' in c.' + object + ')' +
+							'{if(!c.' + object + '.hasOwnProperty(' + i + '))continue;' +
+							'c.' + key + '=' + i + ';'
+							'c.' + value + '=c.' + object + '[' + i + ']' + ';'
 					});
 
 				if (found) {
@@ -132,7 +117,7 @@ var ltl = module.exports = (function (options) {
 				for (var i = 0; i < tokens.length; i++) {
 					var token = tokens[i];
 					if (/^[a-z_]/i.test(token) && !jsPattern.test(token) && previous != '.') {
-						tokens[i] = contextVar + '.' + token;
+						tokens[i] = 'c.' + token;
 					}
 					previous = token;
 				}
@@ -163,124 +148,53 @@ var ltl = module.exports = (function (options) {
 				closeLevels(1 - change);
 				level = indent;
 
-
 				// Strip the leading spaces.
-				line = line.substring(spaces);
+				line = line.substr(spaces);
 
-				// Control patterns such as if/else/for must transform into true JavaScript.
-				if (controlPattern.test(line)) {
+				if (jsPattern.test(line)) {
 					stack.push('{');
 					var code = transformScript(line);
 					appendText('script', code);
-
-				// Tags must be parsed for id/class/attributes/content.
 				} else {
-					var rest = line;
-					var tag;
-					var id;
-					var className;
-					var attributes;
-					var content = '';
-					var pos = 0;
-					var end = 0;
-					var character;
-					var quote;
-					var name;
-					var value;
-
-					// Process the rest of the line recursively.
-					while (rest) {
-						var character = rest[pos];
-
-						// If it's an ID, read up to the next thing, and save the ID.
-						if (character == '#') {
-							end = rest.search(/([\.\(:\s]|$)/);
-							id = rest.substring(1, end);
-							rest = rest.substring(end);
-						}
-
-						// If it's one or more classes, read and save them.
-						else if (character == '.') {
-							end = rest.search(/([\(:\s]|$)/);
-							className = rest.substring(1, end).replace(/\./g, ' ');
-							rest = rest.substring(end);
-						}
-
-						// If it's the beginning of a list of attributes, iterate through them.
-						else if (character == '(') {
-
-							// Move on from the parentheses.
-							rest = rest.substring(1);
-
-							// Build attributes.
-							attributes = '';
-							while (true) {
-
-								// Find quoted attributes or the end of the list.
-								end = rest.search(/[\)"']/);
-								if (end < 0) {
-									throwError('Unclosed tag attributes.');
-								}
-								character = rest[end];
-
-								// If it's the end, get any remaining attribute and get out.
-								if (character == ')') {
-									attributes += rest.substring(0, end - 1);
-									rest = rest.substring(end + 1);
-								}
-
-								// If it's not the end, read a quoted param.
-								else {
-									// Allow for attributes to be comma separated or not.
-									// Also allow for valueless attributes.
-									attributes += rest.substring(0, end).replace(/[,\s]+/g, ' ');
-									rest = rest.substring(end);
-
-									// Find the next end quote that isn't backslash delimited.
-									end = rest.indexOf(character, end + 1);
-									while (rest[end - 1] == '\\') {
-										end = rest.indexOf(character, end + 1);
-									}
-
-									// Read to the end of the attribute.
-									attributes += rest.substring(0, end + 1);
-									rest = rest.substring(end + 1);
-								}
-
-								if (character == ')') {
-									break;
-								}
-							}
-						}
-						else if (character == ' ' || character == '\t') {
-							content = rest.replace(/(^\s+|\s+$)/g, '');
-							rest = '';
-						}
-						else {
-							end = rest.search(/([#\.\(:\s]|$)/);
-							tag = rest.substring(0, end);
-							rest = rest.substring(end);
-						}
-					}
-					tag = tag || 'div';
+					var pattern = /([a-z0-9]*)(#[^ \.\(]*)?(\.[^ \(]*)?(\([^\)]*\))?( .*)?$/;
+					var matches = line.match(pattern);
+					var tag = matches[1] || 'div';
+					var id = matches[2];
+					var className = matches[3];
+					var attributes = matches[4];
+					var content = matches[5];
 					stack.push(tag);
-
 					if (id) {
+						id = id.replace(/^#/, '');
+						if (/['"]/.test(className)) {
+							throwError("IDs cannot contain quotes.", line);
+						}
 						tag += ' id="' + id + '"';
 					}
 					if (className) {
+						className = className.replace(/^\./, '');
+						className = className.replace(/\./g, ' ');
+						if (/['"]/.test(className)) {
+							throwError("Classes cannot contain quotes.", line);
+						}
 						tag += ' class="' + className + '"';
 					}
 					if (attributes) {
-						tag += ' ' + attributes;
+						attributes = attributes.replace(/^\(/, ' ');
+						attributes = attributes.replace(/\)$/, '');
+						tag += attributes;
+					}
+					appendText('html', '<' + tag + '>');
+					if (content) {
+						content = content.replace(/(^\s+|\s+$)/g, '');
+						content = content.replace(/'/g, "\\'");
+						output += content;
 					}
-
-					output += '<' + tag + '>' + content;
 				}
 			}
 
 			closeLevels(level + 1);
-			appendText('script', "return " + outputVar + "}");
+			appendText('script', "return o}");
 			output = output.replace(/#\{([^\}]+)\}/g, function(match, code) {
 				return "'+" + interpolate(code) + "+'";
 			});
diff --git a/package.json b/package.json
index bdb5a5c..e8dd117 100644
--- a/package.json
+++ b/package.json
@@ -19,7 +19,11 @@
     "node >= 0.2.6"
   ],
   "scripts": {
-    "test": "mocha"
+    "test": "./node_modules/istanbul/lib/cli.js test ./node_modules/mocha/bin/_mocha",
+    "test-watch": "./node_modules/mocha/bin/mocha --watch",
+    "mocha": "./node_modules/mocha/bin/mocha",
+    "view-coverage": "open coverage/lcov-report/index.html",
+    "perf": "node perf"
   },
   "dependencies": {},
   "devDependencies": {
@@ -27,6 +31,7 @@
     "assert-plus": "~0.1.5",
     "dot": "~1.0.2",
     "mocha": "~1.17.1",
-    "should": "~3.1.3"
+    "should": "~3.1.3",
+    "istanbul": "~0.2.6"
   }
 }
diff --git a/test/api.js b/test/api.js
index ac5addd..b848ff4 100644
--- a/test/api.js
+++ b/test/api.js
@@ -11,7 +11,11 @@ describe('API', function(){
 			ltl.compile.should.be.a.Function;
 		});
 	});
+<<<<<<< HEAD
 	describe('ltl.compile("")', function(){
+=======
+	describe('ltl.compile(string)', function(){
+>>>>>>> e869491cb0e7f68a0183611f13565da97dff0a28
 		it('should return a function', function() {
 			ltl.compile('').should.be.a.Function;
 		});
