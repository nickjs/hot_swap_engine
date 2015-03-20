RObject = require './object'

class Object3D extends RObject
  @state 'position'
  @state 'rotation'
  @state 'scale'

  virtual: ->
    return {
      px: @position.x
      py: @position.y
      pz: @position.z

      rx: @rotation.x
      ry: @rotation.y
      rz: @rotation.z

      sx: @scale.x
      sy: @scale.y
      sz: @scale.z

      components: null
    }

exports = Object3D
