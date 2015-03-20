var r3 = {
  initialize() {
    r3.platform.initialize()
  },

  play() {
    r3.platform.render()
  },

  tick(delta) {
    if (this.level && this.level.tick) {
      this.level.tick(delta)
      this.level.virtualRoot.isDirty = true // FIXME
    }

    if (this.level && this.level.virtualRoot && this.level.virtualRoot.isDirty) {
      var newVirtual = this.level.render()
      var diff = r3.virtualDiff(this.level.virtualRoot, newVirtual)
      this.patchConcrete(diff)
    }
  },

  loadLevel(levelClass) {
    this.level = new levelClass
    this.level.virtualRoot = this.level.render()

    this.level.concreteRoot = this.createConcrete(this.level.virtualRoot)
    this.postCreate(this.level.virtualRoot)
  },

  createConcrete(node) {
    var tag = node.tagName = node.tagName.toUpperCase()
    var def = r3.tags[tag]

    if (!def)
      return console.error("Invalid tag", tag)

    if (def.children && node.children) {
      node.children.forEach(function(child) {
        if (child.as && def.children.indexOf(child.as.toLowerCase()) != -1) {
          child.madeProp = true
          var concreteChild = r3.createConcrete(child)
          node.properties[child.as.toLowerCase()] = concreteChild
        }

        if (def.children.indexOf(child.tagName.toLowerCase()) != -1) {
          child.madeProp = true
          var concreteChild = r3.createConcrete(child)
          node.properties[child.tagName.toLowerCase()] = concreteChild
        }
      })
    }

    var concrete = r3.platform.createConcrete(node)
    node.concrete = concrete

    if (def.props.indexOf(OBJECT) != -1) {
      r3.platform.applyObject(concrete, node)
    }

    if (node.children) {
      node.children.forEach(function(child) {
        if (!child.madeProp) {
          var concreteChild = r3.createConcrete(child)
          if (concrete.add) concrete.add(concreteChild)
        }
      })
    }

    return concrete
  },

  postCreate(node) {
    var tag = node.tagName
    var def = r3.tags[tag]

    if (def.props.indexOf(TRANSFORM) != -1 || def.props.indexOf(OBJECT) != -1) {
      r3.platform.applyTransform(node.concrete, node)
    }

    if (node.children) {
      node.children.forEach(function(child) {
        r3.postCreate(child)
      })
    }
  },

  patchConcrete(diff) {

  },

  virtual: require('virtual-dom/h'),

  virtualDiff: require('virtual-dom/diff'),
}

const TRANSFORM = 'TRANSFORM'
const OBJECT = 'OBJECT'

r3.tags = {
  TRANSFORM: {props: ['x', 'y', 'z', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz', 'lookAt']},
  OBJECT: {props: [TRANSFORM, 'name', 'visible', 'castShadow', 'receiveShadow']},
  "SCENE": {props: [OBJECT], children: ['camera']},
  "MESH": {props: [OBJECT], children: ['geometry', 'model', 'material']},
  "MODEL": {props: [TRANSFORM, 'file']},
  "GEOMETRY": {props: ['size', 'sx', 'sy', 'sz', 'dx', 'dy', 'dz'], types: ['cube', 'sphere', 'plane', 'cylinder', 'text', 'torus']},
  "MATERIAL": {props: ['color', 'emissive', 'specular', 'shininess', 'metal', 'shading'], children: ['texture', 'bump', 'normal'], types: ['basic', 'lambert', 'phong', 'wireframe']},
  "TEXTURE": {props: ['file', 'mapping', 'wrapS', 'wrapT', 'anisotropy']},
  "CAMERA": {props: [OBJECT], types: ['perspective', 'orthographic']},
  "LIGHT": {props: [OBJECT, 'color', 'intensity', 'distance'], types: ['area', 'directional', 'ambient', 'hemisphere', 'point', 'spot']},
}

module.exports = r3
window.r3 = r3
