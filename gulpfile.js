const Gulp = require('gulp')
const Nodemon = require('gulp-nodemon')
const Docco = require('gulp-docco')
const Mocha = require('gulp-mocha');

const GetOption = (name) => {
  let i = process.argv.indexOf('--' + name)
  let result
  if (i > -1) {
    result = process.argv[i + 1];
  }
  return result
}

Gulp.task('nodemon', function (done) {
  let called = false;
  return Nodemon({
    script: GetOption('script'),
    ignore: [
      'gulpfile.js',
      'node_modules/',
      '*.test.js'
    ],
    ext: 'js html',
    env: {
      'NODE_ENV': GetOption('node_env'),
      'NODE_PATH': GetOption('node_path'),
      'FILE_NAME': GetOption('target')
    }
  })
  .on('start', function () {
    if (!called) {
      called = true
      done()
    }
  })
})

Gulp.task('annotate', function () {
  gulp.src("./services/*.js")
    .pipe(Docco())
    .pipe(gulp.dest('./doc'))
  gulp.src("./services/lib/*.js")
    .pipe(Docco())
    .pipe(gulp.dest('./doc'))
  gulp.src("./test/*.js")
    .pipe(Docco())
    .pipe(gulp.dest('./doc'))
})

Gulp.task('test', function() {
  return Gulp.src(['tests/*.test.js'], { read: false })
    .pipe(Mocha({
      reporter: 'spec',
      timeout: 10000
    }))
    .once('error', (err) => {
      console.log('[Gulp] error:', err)
      process.exit(1);
    })
    .once('end', () => {
      process.exit();
    })
});