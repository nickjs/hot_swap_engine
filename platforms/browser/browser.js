var r3 = require('../../engine/index')

var platform = {
  initialize() {
    var container = document.getElementById('renderer') || document.body

    var renderer = this.renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setSize(container.scrollWidth, container.scrollHeight)
    renderer.setClearColor(0x000000)
    // renderer.autoClear = false
    renderer.physicallyBasedShading = true
    renderer.shadowMapEnabled = true
    container.appendChild(renderer.domElement)

    var stats = this.stats = new Stats()
    stats.domElement.style.position = 'absolute'
    stats.domElement.style.top = '0px'
    container.appendChild(stats.domElement)

    this.clock = new THREE.Clock
    this.render = this.render.bind(this)
  },

  reloadScript: Date.now(),

  play() {
    this.render()
  },

  render() {
    requestAnimationFrame(this.render)

    r3.tick(this.clock.getDelta())

    this.renderer.render(r3.level.concreteRoot, r3.level.virtualRoot.properties.camera)
    this.stats.update()

    if (Date.now() - this.reloadScript > 3000) {
      console.log('reloading')
      this.reloadScript = Date.now()
      var script = document.createElement('script')
      script.src = '/build/game.js'
      script.onload = () => {
        try {
          r3.hotSwapComponent()
          script.parentNode.removeChild(script)
        } catch (e) {
          console.error(e)
        }
      }

      document.head.appendChild(script)
    }
  },

  createConcrete(node) {
    var def = platform.tags[node.tagName]
    return def.create(node)
  },

  addToParent(parentchild) {
    var parent = parentchild[0]
    var child = parentchild[1]

    if (parent.concrete instanceof THREE.Object3D && child.concrete instanceof THREE.Object3D) {
      parent.concrete.add(child.concrete)
    }
  },

  applyPatch(node) {
    var def = platform.tags[node.tagName]
    if (def.update) def.update(node.concrete, node)
  },

  applyTransform(node) {
    var object = node.concrete
    if (node.properties.x !== undefined) object.position.x = node.properties.x
    if (node.properties.y !== undefined) object.position.y = node.properties.y
    if (node.properties.z !== undefined) object.position.z = node.properties.z

    if (node.properties.rx !== undefined) object.rotation.x = node.properties.rx
    if (node.properties.ry !== undefined) object.rotation.y = node.properties.ry
    if (node.properties.rz !== undefined) object.rotation.z = node.properties.rz

    if (node.properties.sx !== undefined) object.scale.x = node.properties.sx
    if (node.properties.sy !== undefined) object.scale.y = node.properties.sy
    if (node.properties.sz !== undefined) object.scale.z = node.properties.sz

    var lookAt = node.properties.lookAt
    if (lookAt) {
      if (typeof lookAt === 'string') lookAt = object.parent.getObjectByName(lookAt)
      if (lookAt.concrete) lookAt = lookAt.concrete
      if (lookAt.position) lookAt = lookAt.position
      object.lookAt(lookAt)
    }
  },

  applyObject(node) {
    var object = node.concrete
    if (node.properties.name !== undefined) object.name = node.properties.name
    if (node.properties.visible !== undefined) object.visible = node.properties.visible
    if (node.properties.castShadow !== undefined) object.castShadow = node.properties.castShadow
    if (node.properties.receiveShadow !== undefined) object.receiveShadow = node.properties.receiveShadow
  }
}

platform.geometryTypes = {
  cube: THREE.BoxGeometry,
  plane: THREE.PlaneBufferGeometry,
  sphere: THREE.SphereGeometry,
  cylinder: THREE.CylinderGeometry,
  text: THREE.TextGeometry,
  torus: THREE.TorusGeometry,
}

platform.materialTypes = {
  basic: THREE.MeshBasicMaterial,
  lambert: THREE.MeshLambertMaterial,
  phong: THREE.MeshPhongMaterial,
  wireframe: THREE.MeshBasicMaterial,
}

platform.lightTypes = {
  area: THREE.AreaLight,
  ambient: THREE.AmbientLight,
  directional: THREE.DirectionalLight,
  point: THREE.PointLight,
  hemisphere: THREE.HemisphereLight,
  spot: THREE.SpotLight,
}

platform.tags = {
  SCENE: {
    create(node) {
      var scene = new THREE.Scene
      if (node.properties.camera)
        scene.add(node.properties.camera)
      return scene
    },
  },

  OBJECT: {
    create(node) {
      return new THREE.Object3D
    },
  },

  MESH: {
    create(node) {
      var geometry = node.properties.geometry
      var material = node.properties.material
      return new THREE.Mesh(geometry, material)
    },
  },

  GEOMETRY: {
    create(node) {
      var geometry;
      switch (node.properties.type.toLowerCase()) {
        case 'cube':
          var size = node.properties.size || 1
          geometry = new THREE.BoxGeometry(size, size, size)
          break
        case 'sphere':
          var radius = node.properties.radius || 1
          geometry = new THREE.SphereGeometry(radius)
          break
        case 'plane':
          var size = node.properties.size || 1
          geometry = new THREE.PlaneGeometry(size, size)
          break
      }

      return geometry
    },
  },

  MATERIAL: {
    create(node) {
      var type = node.properties.type.toLowerCase()
      var materialClass = platform.materialTypes[type]
      if (!materialClass) throw "Could not find material type " + type

      var material = new materialClass()
      this.update(material, node)

      return material
    },

    update(material, node) {
      var props = {}
      var needsUpdate = true

      r3.tags.MATERIAL.props.forEach(function(prop) {
        var value = node.properties[prop]
        if (value !== undefined && value !== material[prop]) {
          props[prop] = node.properties[prop]
          needsUpdate = true
        }
      })

      if (node.properties.type == 'wireframe') props.wireframe = true

      if (needsUpdate) {
        material.setValues(props)
        material.needsUpdate = true
      }
    },
  },

  CAMERA: {
    create(node) {
      if (node.properties.type == 'orthographic')
        return new THREE.OrthographicCamera()
      else
        return new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    },
  },

  LIGHT: {
    create(node) {
      var type = node.properties.type.toLowerCase()
      var lightClass = platform.lightTypes[type]
      if (!lightClass) throw "Could not find light type " + type

      return new lightClass(node.properties.color, node.properties.intensity, node.properties.distance)
      // for (var key in props)
        // light[key] = props[key]
    },
  },
};

module.exports = platform
r3.platform = platform
window.r3 = r3
