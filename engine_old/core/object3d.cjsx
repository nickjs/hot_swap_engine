RObject = require './object'

class Object3D extends RObject
  @state 'position'
  @state 'rotation'
  @state 'scale'

  @virtual: ->
    return {
      px: 0
      py: 0
      pz: 0

      rx: 0
      ry: 0
      rz: 0

      sx: 1
      sy: 1
      sz: 1

      components: null
    }

exports = Object3D
