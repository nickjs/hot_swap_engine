Geometry = require './geometry'

class CubeGeometry extends Geometry
  @state 'size'

  constructor: ->
    @size = 1

  virtual: ->
    {type: 'Cube', size: @size}

exports = CubeGeometry
