"use strict"

var connect = require('connect')
var morgan = require('morgan')
var serveStatic = require('serve-static')

var gulp = require('gulp')
var concat = require('gulp-concat')
var jsx = require('gulp-jsx')

var fs = require('fs')

var jsxOptions = {
  jsx: 'h',
  ignoreDocblock: true,
  tagMethods: false,
  docblockUnknownTags: true,
}

var app = connect()

app.use(morgan('combined'))

app.use('/browser', serveStatic('platforms/browser'))
app.use('/editor', serveStatic('platforms/editor'))
app.use('/build', serveStatic('build'))
app.use('/lib', serveStatic('lib'))

// app.use('/dev', function(req, res, next) {
//   var bundle = req.url.substr(1)
//   bundle = bundle.split('.')[0]

//   fs.readFile('build/' + bundle + '.js', function(err, data) {
//     res.end(data)
//   })
// })

// app.use(webpackMiddleware(webpack({
//   entry:
// },
// {
//   publicPath: '/dev/',
//   lazy: true
// })))

app.listen(4242)
console.log("Now listening on http://localhost:4242")
