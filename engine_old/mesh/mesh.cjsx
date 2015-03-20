Object3D = require './object3D'

class Mesh extends Object3D
  @component 'geometry', class: 'Geometry'
  @component 'material', class: 'Material'

exports = Mesh
