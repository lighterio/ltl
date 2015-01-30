# <a href="http://lighter.io/ltl" style="font-size:40px;text-decoration:none;color:#000"><img src="https://cdn.rawgit.com/lighterio/lighter.io/master/public/ltl.svg" style="width:90px;height:90px"> Ltl</a>
[![NPM Version](https://img.shields.io/npm/v/ltl.svg)](https://npmjs.org/package/ltl)
[![Downloads](https://img.shields.io/npm/dm/ltl.svg)](https://npmjs.org/package/ltl)
[![Build Status](https://img.shields.io/travis/lighterio/ltl.svg)](https://travis-ci.org/lighterio/ltl)
[![Code Coverage](https://img.shields.io/coveralls/lighterio/ltl/master.svg)](https://coveralls.io/r/lighterio/ltl)
[![Dependencies](https://img.shields.io/david/lighterio/ltl.svg)](https://david-dm.org/lighterio/ltl)
[![Support](https://img.shields.io/gratipay/Lighter.io.svg)](https://gratipay.com/Lighter.io/)


The [Ltl](http://lighter.io/ltl) template language (pronounced "little") uses a clean
[Jade](http://jade-lang.com/reference/)-like syntax to generate
HTML at [doT](https://github.com/olado/doT)-like speeds.

If you love tight code and fast rendering, you'll be right at home with Ltl.


## Quick Start

Add `ltl` to your project:
```bash
npm install --save ltl
```

Compile and render templates:
```javascript
var ltl = require("ltl");
var template = ltl.compile("#hi Hello ${who}!");
var result = template({who: "World"});
```
```html
<div id="hi">Hello World!</div>
```


## API

### ltl.compile(code, [options])
 * `code` is a string of Ltl code.
 * `options` is an object with any of the following properties:
 * `name` will cause the template to cache at `ltl.templates[name]`
 * `space` causes HTML to be indented, using `space` as indentation.

### ltl.setOption(name, value)
 * `name` is the name of a compiler option.
 * `value` is the default value you'd like to set it to.

Supported options:
 * `outputVar` is the name of the variable that Ltl concatenates to. (Default: "o")
 * `contextVar` is the name of the argument that passes context into a template. (Default: "c")
 * `partsVar` is the name of the argument that a Ltl template receives from callers. (Default: "p")
 * `tabWidth` is the number of spaces that tabs are converted to before compilation. (Default: 4)


## Language

### Nesting
Tag nesting is done with whitespace. You can use tabs or spaces,
and Ltl can detect the number of spaces you're using.
```jade
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

`<!DOCTYPE html>` is automagically inserted before an `<html>` tag.  If you would like to specify a custom doctype, you can use the shorthand `doctype` or `!` syntax.
```jade
!(svg)
```

```html
<!DOCTYPE svg>
```

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
**Note:** Unlike Jade, Ltl does not use commas between attributes.

### Untagged Lines

If you want to insert a line of text without wrapping it in a tag,
just start the line with a minus.

```jade
h1
  img(src="/logo.png")
  - Hello!
```
```html
<h1><img src="/logo.png">Hello!</h1>
```

### Blocks

You can output blocks of content as plain text, using `:`.
```jade
#blah:
  Bob Loblaw's Law Blog asks, "Why should YOU go
  to jail for a crime someone else noticed?"
```
```html
<div id="blah">
  Bob Loblaw's Law Blog asks, "Why should YOU go
  to jail for a crime someone else noticed?"
</div>
```

Blocks can also be passed through filters, such as `markdown`.
```jade
:markdown
  # Ltl
  It's a recursive acronym for "Ltl Template Language".
```
```html
<h1>ltl</h1><p>It's a recursive acronym for "Ltl Template Language".</p>
```

If a filter is unrecognized, Ltl will attempt to load it in the following ways:
* **Client-side:** use `window['FILTER_NAME']`
* **Server-side:** use `require('FILTER_NAME')`

A filter must have a function named `compile` or `parse` which accepts a context
and returns a string, or it can be such a function itself.

### Comments

Ltl comments are added by using `//` as a tag, and they do not output any
HTML. The `//` tag can be used on one line or as a block.
```jade
h1 Comments
// No one will see this.
p Hello from http://lighter.io/ltl
//
  This won't be shown.
  Neither will this.
```
```html
<h1>Comments</h1><p>Hello from http://lighter.io/ltl</p>
```

HTML comments are add by using `-` as a tag.
```jade
- Begin page
p Hello
- End page
-
  p Delete me
```
```html
<!--Begin page--><p>Hello</p><!--End page--><!--<p>Delete me</p>-->
```

### Interpolation

You can output the value of a context property with `${..}`,
and special HTML characters will be escaped for you to
prevent silly little XSS attacks.
```javascript
var code = '. Hello ${name}!';
var template = ltl.compile(code)
template({name: 'Sam'});
```
```
<div>Hello Sam!</div>
```

To encode for a URL rather than HTML, use `&{}`.

Context: `{query: "good brewpubs"}`
```jade
a(href="?q=&{query}")
```
```html
<a href="?q=good%20brewpubs">good brewpubs</a>
```

If you'd like your content to skip encoding (because
you want your expression to output raw HTML tags rather
than safely escaped text), use `={..}`.

Context: `{unsafe: "<script>alert('Gotcha!')</script>"}`
```jade
. ={unsafe}
```
```html
<div><script>alert('Gotcha!')</script></div>
```

If you want to show `${..}`, `&{..}` or `={..}` blocks in your output,
you can escape with a backslash.
```jade
code \${escaped} or \={raw}
```
```html
<code>${escaped} or ={raw}
```

### Variable Assignment

You can assign a value to a variable in the template context using `=`.
```jade
who = 'World'
. Hello ${who}!
```
```html
<p>Hello World!</p>
```

### Control
Use `for..in` to iterate over an array inside the context.

*Context:* `{list: ['IPA', 'Porter', 'Stout']}`

```jade
ul
  for item in list
    li #{item}
```
```html
<ul><li>IPA</li><li>Porter</li><li>Stout</li></ul>
```

Use `for..of` to iterate over an object's keys.

*Context:* `{pairings: {Coffee: 'coding', Beer: 'bloviating'}}`
```jade
for drink, activity of pairings
  . #{field} is for #{value}.
```
```html
<div>Coffee is for coding.</div><div>Beer is for bloviating</div>
```

### Conditionals

Use `if`, `else` or `else if` to render conditionally.
The control statement's inline content gets evaluated
as JavaScript.
```jade
if username == 'root'
  . Do as you please.
else if username
  . Do as you can.
else
  . Don't.
```

You can use builtin JavaScript objects and whatnot.
```jade
if Math.random() > 0.5
    p This has a 50/50 chance of showing.
```


### Using templates within templates

A template can call another template with `call`. To accomplish
this, you must compile your templates with `options.name`, and
they will be stored in `ltl.cache`. The template that's being
called can access the data context.
```jade
var temp = ltl.compile('p\n call bold', {name: 'temp'});
var bold = ltl.compile('b #{text}', {name: 'bold'});
ltl.cache.temp({text: 'Hi!'});
```
```
<p><b>Hi!</b></p>
```

With `set` and `get`, a template can get content from a
template that calls it. The calling template declares what
it will pass using `set` blocks, and the called template
reads data with `get` blocks.
```jade
var layout = ltl.compile('#nav\n get nav\n#content\n get content', {name: 'layout'});
var page = ltl.compile('call layout\n set nav\n  . Nav\n set content\n  . Content', {name: 'page'});
ltl.cache.page();
```
```
<div id="nav">Nav</div><div id="content">Content</div>
```


## Acknowledgements

We would like to thank all of the amazing people who use, support,
promote, enhance, document, patch, and submit comments & issues.
Ltl couldn't exist without you.

Additionally, huge thanks go to [TUNE](http://www.tune.com) for employing
and supporting [Ltl](http://lighter.io/ltl) project maintainers,
and for being an epically awesome place to work (and play).


## MIT License

Copyright (c) 2014 Sam Eubank

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## How to Contribute

We welcome contributions from the community and are happy to have them.
Please follow this guide when logging issues or making code changes.

### Logging Issues

All issues should be created using the
[new issue form](https://github.com/lighterio/ltl/issues/new).
Please describe the issue including steps to reproduce. Also, make sure
to indicate the version that has the issue.

### Changing Code

Code changes are welcome and encouraged! Please follow our process:

1. Fork the repository on GitHub.
2. Fix the issue ensuring that your code follows the
   [style guide](http://lighter.io/style-guide).
3. Add tests for your new code, ensuring that you have 100% code coverage.
   (If necessary, we can help you reach 100% prior to merging.)
   * Run `npm test` to run tests quickly, without testing coverage.
   * Run `npm run cover` to test coverage and generate a report.
   * Run `npm run report` to open the coverage report you generated.
4. [Pull requests](http://help.github.com/send-pull-requests/) should be made
   to the [master branch](https://github.com/lighterio/ltl/tree/master).

### Contributor Code of Conduct

As contributors and maintainers of Ltl, we pledge to respect all
people who contribute through reporting issues, posting feature requests,
updating documentation, submitting pull requests or patches, and other
activities.

If any participant in this project has issues or takes exception with a
contribution, they are obligated to provide constructive feedback and never
resort to personal attacks, trolling, public or private harassment, insults, or
other unprofessional conduct.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, edits, issues, and other contributions
that are not aligned with this Code of Conduct. Project maintainers who do
not follow the Code of Conduct may be removed from the project team.

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by opening an issue or contacting one or more of the project
maintainers.

We promise to extend courtesy and respect to everyone involved in this project
regardless of gender, gender identity, sexual orientation, ability or
disability, ethnicity, religion, age, location, native language, or level of
experience.
