# ltl

ltl (pronounced "little") is a lightweight template language for JavaScript
which generates HTML. Its syntax is clean like [Jade](http://jade-lang.com/reference/), and its performance
is amazing like [doT](https://github.com/olado/doT).

### Contributing

Setup is simple: just `git clone` and `npm install`, and you're ready to start.

### Testing

**Performance testing** can be done by running `npm perf`.
The output shows the average time in milliseconds it took to perform each of the operations.

**Unit testing** can be done by running `npm test`. Coverage can be checked via `npm test --coverage` and viewed via `npm run view-coverage`. [Mocha](http://visionmedia.github.io/mocha/) is used for testing this library.