var jade = require('jade');
var dot = require('dot');
var ltl = require('../index');

var ltlCode =
	'html\n' +
	' head\n' +
	'  title Hello World\n' +
	' body\n' +
	'  div#hey.a.b(style="display:block; width:100px") Here\'s my message: #{message}\n' +
	'  ul\n' +
	'   for item in items\n' +
	'    li #{item}\n';

var jadeCode =
	'html\n' +
	' head\n' +
	'  title Hello World\n' +
	' body\n' +
	'  div#hey.a.b(style="display:block; width:100px") Here\'s my message: #{message}\n' +
	'  ul\n' +
	'   each item in items\n' +
	'    li #{item}\n';

var dotCode = '<html><head><title>Hello World</title></head>' +
	'<body><div id="hey" class="a b" style="display:block;width:100px">' +
	'Here\'s my message: {{=it.message}}</div><ul>{{' +
	'for(var i=0;i<it.items.length;++i){it.item=it.items[i]; }}' +
	'<li>{{=it.item}}</li>{{ } }}</ul></body></html>';

var context = {message: 'hello', items: ['apple', 'banana', 'orange', 'pear']};

console.log('');
console.log('doT:');
console.log(dot.compile(dotCode).toString());
console.log('');
console.log('ltl:');
console.log(ltl.compile(ltlCode).toString());
console.log('');

var i, started, elapsed, result;
var ltlTemplate, jadeTemplate, dotTemplate;

var compileCount = 1e2;
var renderCount = 1e5;

var engines = [
	{name: 'Jade', code: jadeCode, lib: jade},
	{name: 'doT', code: dotCode, lib: dot},
	{name: 'ltl', code: ltlCode, lib: ltl}
];

var operations = [
	{name: 'Compile', count: 1e3},
	{name: 'Render', count: 1e6}
];

operations.forEach(function (operation) {
	console.log('\n' + operation.name + ' x' + operation.count);
	engines.forEach(function (engine) {

		started = new Date();
		for (i = 0; i < operation.count; i++) {
			if (operation.name == 'Compile') {
				engine.template = engine.lib.compile(engine.code);
			}
			else {
				result = engine.template(context);
			}
		}
		elapsed = new Date() - started;
		console.log(engine.name + ': ' + elapsed);

	})
});