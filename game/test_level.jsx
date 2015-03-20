class MyLevel {
  constructor() {
    this.cubeRotation = 0.5
    this.lightX = 0
    this.lightZ = 0
  }

  render() {
    return <scene>
      <mesh name="cube" ry={this.cubeRotation} castShadow={true}>
        <geometry type="cube" size={1} />
        <material type="phong" color={0xff0000} />
      </mesh>

      {/*<mesh y={-1} receiveShadow={true}>
        <geometry type="plane" size={100} />
        <material type="lambert" color={0xffffff} />
      </mesh>*/}

      <camera y={3} z={5} lookAt="cube" />
      <light type="directional" color={0xffffff} z={10} y={10} />

      <object x={this.lightX} z={this.lightZ}>
        <light type="point" color={0x0000ff} intensity={15} distance={10} />
        <mesh>
          <geometry type="cube" size={0.2} />
          <material type="basic" color={0x0000ff} />
        </mesh>
      </object>
    </scene>
  }

  tick(delta) {
    this.cubeRotation += 0.05

    var time = Date.now() * 0.001
    this.lightX = Math.sin(time * 0.7) * 2
    this.lightZ = Math.cos(time * 0.7) * 2
  }
}

window.MyLevel = MyLevel
