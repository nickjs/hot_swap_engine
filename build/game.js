"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var MyLevel = (function () {
  function MyLevel() {
    _classCallCheck(this, MyLevel);

    this.cubeRotation = 0.5;
    this.lightX = 0;
    this.lightZ = 0;
  }

  _prototypeProperties(MyLevel, null, {
    render: {
      value: function render() {
        return r3.virtual("scene", null, [r3.virtual("mesh", { name: "cube", ry: this.cubeRotation, castShadow: true }, [r3.virtual("geometry", { type: "cube", size: 1 }), r3.virtual("material", { type: "phong", color: 16711680 })]),

        /*<mesh y={-1} receiveShadow={true}>
          <geometry type="plane" size={100} />
          <material type="lambert" color={0xffffff} />
        </mesh>*/

        r3.virtual("camera", { y: 3, z: 5, lookAt: "cube" }), r3.virtual("light", { type: "directional", color: 16777215, z: 10, y: 10 }), r3.virtual("object", { x: this.lightX, z: this.lightZ }, [r3.virtual("light", { type: "point", color: 255, intensity: 15, distance: 10 }), r3.virtual("mesh", null, [r3.virtual("geometry", { type: "cube", size: 0.2 }), r3.virtual("material", { type: "basic", color: 255 })])])]);
      },
      writable: true,
      configurable: true
    },
    tick: {
      value: function tick(delta) {
        this.cubeRotation += 0.05;

        var time = Date.now() * 0.001;
        this.lightX = Math.sin(time * 0.7) * 2;
        this.lightZ = Math.cos(time * 0.7) * 2;
      },
      writable: true,
      configurable: true
    }
  });

  return MyLevel;
})();

window.MyLevel = MyLevel;