# ltl

The ltl template language (pronounced "little") uses a clean
[Jade](http://jade-lang.com/reference/)-like syntax to make JavaScript
generate HTML at [doT](https://github.com/olado/doT)-like speeds.

If you love tight code and fast rendering, you're right at home.

## Getting Started

Install
```bash
$ npm install ltl
```

Use
```javascript
var ltl = require('ltl');
var template = ltl.compile('#hi Hello #{name}!');
var result = template({name: 'World'});
// result: '<div id="hi">Hello World!</div>'
```

## API
### ltl.compile(code, [options])
 * `code` is a string of ltl code.
 * `options` is an object with any of the following properties:
  * `name` will cause the template to cache at `ltl.templates[name]`

### ltl.setTabWidth(numberOfSpaces)
 * `numberOfSpaces` is the default number of spaces to convert a tab
   to for mixed tab/space leniency. (Default: 4)

### ltl.setOutputVar(name)
 * `name` is the name of the variable that ltl concatenates to inside
   template functions. (Default: `o`)

### ltl.setContextVar(name)
 * `name` is the name of the argument that passes the data context
   into a template. (Default: `c`)

### ltl.setPartsVar(name)
 * `name` is the name of the argument that an ltl template receives
   from a template that uses it as an abstract template.
   (Default: `p`)

## Language

### Nesting
Tag nesting is done with whitespace.
```jade
!
html
  head
    title Hello World!
  body
    div Here is some content.
```
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello World!</title>
  </head>
  <body>
    <div>Here is some content.</div>
  </body>
</html>
```
Note: `!` is shorthand for `<!DOCTYPE html>`.

Nesting can also be done with one-liners using `>`.
```jade
div>span Boo!
```
```html
<div><span>Boo!</span></div>
```

### IDs and Classes

HTML id and class attributes are done with `#` and `.`
```jade
div#myId.myClass.myOtherClass Hello
```
```html
<div id="myId" class="myClass myOtherClass">Hello</div>
```

When there is no tag name, div is assumed
```jade
.hi Hello
```
```html
<div class="hi">Hello</div>
```

### Attributes

Attributes are contained in parentheses, and treated like
they would be inside an HTML tag.
```jade
(style="display:none" data-something="peek-a-boo") Hide me
```
```html
<div style="display:none;" data-something="peek-a-boo">Hide me</div>
```
Note: Unlike Jade, ltl does not use commas between attributes.


### Interpolation
You can output the value of a context property with `#{..}`.
```jade
var ltl = require('ltl');
var code = '. Hello #{name}!';
ltl.compile(code, {name: 'Sam'});
```
```
<div>Hello Sam!</div>
```

If you'd like your content to skip HTML encoding (because
you want the HTML tags in your variable to be markup rather
than text, use `={..}`.

Context: `{unsafe: "<script>alert('Gotcha!')</script>"}`
```jade
. ={unsafe}
```
```html
<div><script>alert('Gotcha!')</script></div>
```

### Control
Use `for..in` to iterate over an array inside the context.
 * Context: `{list: ['IPA', 'Porter', 'Stout']}`
```jade
ul
  for item in list
    li #{item}
```
```html
<ul><li>IPA</li><li>Porter</li><li>Stout</li></ul>
```

Use `for..of` to iterate over an object's keys.
```jade
ul
  for field, value of data
    li #{field}: #{value}
```
```html
<ul><li>IPA</li><li>Porter</li><li>Stout</li></ul>
```

Use `if`, `else` or `else if` to show output HTML or not.
The stuff after your control statement and a space will
be executed as JavaScript.
```jade
if Math.random() > 0.5
    p This has a 50/50 chance of showing.
```

## Contributing

Clone the repository
```bash
$ git clone https://github.com/zerious/ltl.git
```

Install dependencies
```bash
$ npm install
```

### Testing

Run all tests
```bash
$ mocha
```

Watch for changes
```bash
$ mocha -w
```

Run individual tests
```bash
$ mocha test/api
$ mocha test/blocks
$ mocha test/control
$ mocha test/interpolation
...
```

Test coverage (100% required)
```bash
$ npm test --coverage
```

View coverage report
```bash
$ npm run view-coverage
```

### Write something awesome and submit a pull request!
