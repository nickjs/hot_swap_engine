var vdom = require('virtual-dom')
var jsx = require('jsx-transform')

global.h = vdom.h
global.diff = vdom.diff

var options = {
  jsx: 'r3.make',
  ignoreDocblock: true,
  tagMethods: false,
  docblockUnknownTags: true,
}

console.log(jsx.transformFile('game/test_level.jsx', options))
