var gulp = require('gulp');
var concat = require('gulp-concat');
var jsx = require('gulp-jsx');
var babel = require('gulp-babel');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var transform = require('vinyl-transform');
var del = require('del');

var paths = {
  engine: ['engine/**/*.jsx', 'engine/**/*.js'],
  game: ['game/**/*.jsx', 'game/**/*.js'],
  browser: ['platforms/browser/**/*.jsx', 'platforms/browser/**/*.js'],
};

var jsxOptions = {
  jsx: 'r3.virtual',
  ignoreDocblock: true,
  tagMethods: false,
  docblockUnknownTags: true,
};

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use all packages available on npm
gulp.task('clean', function(cb) {
  // You can use multiple globbing patterns as you would with `gulp.src`
  del(['build'], cb);
});

gulp.task('game', ['clean'], function() {
  return gulp.src(paths.game)
    .pipe(jsx(jsxOptions))
    .pipe(babel())
    .pipe(concat('game.js'))
  .pipe(gulp.dest('build'))
});

gulp.task('engine', ['clean'], function() {
  var browserified = transform(function(filename) {
    var b = browserify(filename);
    return b.bundle()
  });

  return gulp.src(paths.engine)
    .pipe(browserified)
    // .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(jsx(jsxOptions))
      .pipe(babel())
      .pipe(concat('engine.js'))
    // .pipe(sourcemaps.write())
  .pipe(gulp.dest('build'))
});

gulp.task('browser', ['clean'], function() {
  var browserified = transform(function(filename) {
    var b = browserify(filename);
    return b.bundle()
  });

  return gulp.src(paths.browser)
    .pipe(browserified)
    // .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(jsx(jsxOptions))
      .pipe(babel())
      .pipe(concat('browser.js'))
    // .pipe(sourcemaps.write())
  .pipe(gulp.dest('build'))
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.game, ['game', 'engine', 'browser']);
  gulp.watch(paths.engine, ['game', 'engine', 'browser']);
  gulp.watch(paths.browser, ['game', 'engine', 'browser']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'game', 'engine', 'browser']);
