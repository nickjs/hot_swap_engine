//
//  GameViewController.swift
//  reactor-ios
//
//  Created by Nick Small on 2015-03-06.
//  Copyright (c) 2015 Nick Small. All rights reserved.
//

import UIKit
import QuartzCore
import SceneKit
import JavaScriptCore

@objc protocol PlatformExports : JSExport {
    func initialize()
    func play(level: NSDictionary)
    func createConcrete(node: NSDictionary) -> AnyObject?
    func addToParent(parentchild: NSArray)
    func applyPatch(node: NSDictionary)
    func applyTransform(node: NSDictionary)
    func applyObject(node: NSDictionary)
    
}

let lightTypes: [String: NSString] = ["ambient": SCNLightTypeAmbient, "point": SCNLightTypeOmni, "directional": SCNLightTypeDirectional]

let materialTypes: [String: NSString] = ["basic": SCNLightingModelConstant, "phong": SCNLightingModelPhong, "lambert": SCNLightingModelLambert]

@objc protocol RConcrete {
    func create(node: NSDictionary) -> AnyObject
    optional func update(object: AnyObject, node: NSDictionary)
}

class RScene : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        return SCNNode()
    }
}

class RObject : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        return SCNNode()
    }
}

class RMesh : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        let props = node["properties"] as NSDictionary
        let geometry: SCNGeometry = props["geometry"] as SCNGeometry
        let material: SCNMaterial = props["material"] as SCNMaterial
        let mesh = SCNNode()
        
        geometry.firstMaterial = material
        mesh.geometry = geometry
        
        return mesh
    }
}

class RGeometry : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        let props = node["properties"] as NSDictionary
        switch props["type"] as String {
        case "cube":
            let size: CGFloat = props["size"] as CGFloat
            return SCNBox(width: size, height: size, length: size, chamferRadius: 0.0)
        default:
            return SCNGeometry()
        }
    }
}

class RMaterial : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        let material = SCNMaterial()
        self.update(material, node: node)
        material.specular.contents = UIColor.whiteColor()
        return material
    }
    

    func update(object: AnyObject, node: NSDictionary) {
        let props = node["properties"] as NSDictionary
        let material = object as SCNMaterial

        material.lightingModelName = materialTypes[props["type"] as String]!
        
        if props["color"] != nil {
            material.diffuse.contents = colorFromHexInt(props["color"] as UInt)
        }
    }
}

class RCamera : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        let camera = SCNCamera()
        let camNode = SCNNode()
        camNode.camera = camera
        return camNode
    }
}

class RLight : RConcrete {
    func create(node: NSDictionary) -> AnyObject {
        let light = SCNLight()
        let lightNode = SCNNode()
        lightNode.light = light
        self.update(lightNode, node: node)
        
        return lightNode
    }
    
    func update(object: AnyObject, node: NSDictionary) {
        let props = node["properties"] as NSDictionary
        let light = (object as SCNNode).light!
        
        light.type = lightTypes[props["type"] as String]!
        
        if props["color"] != nil {
            light.color = colorFromHexInt(props["color"] as UInt)
        }
    }
}

let tags: [String: RConcrete] = [
    "SCENE": RScene(),
    "OBJECT": RObject(),
    "MESH": RMesh(),
    "GEOMETRY": RGeometry(),
    "MATERIAL": RMaterial(),
    "CAMERA": RCamera(),
    "LIGHT": RLight()
]

func colorFromHexInt(hex: UInt) -> UIColor {
    return UIColor(
        red: CGFloat((hex & 0xFF0000) >> 16) / 255.0,
        green: CGFloat((hex & 0x00FF00) >> 8) / 255.0,
        blue: CGFloat((hex & 0x0000FF)) / 255.0,
        alpha: CGFloat(1.0)
    )
}

@objc protocol ConsoleP : JSExport {
    func log(message: NSString)
}

@objc class Console : NSObject, ConsoleP {
    func log(message: NSString) {
        NSLog("JSLog: %@", message)
    }
}

@objc class Platform : NSObject, PlatformExports {
    var context: JSContext!
    let queue = dispatch_queue_create("platform", DISPATCH_QUEUE_SERIAL)
    var viewController: GameViewController!
    
    override init() {
        super.init()
        
        dispatch_async(queue) {
            self.context = JSContext()
            self.context.exceptionHandler = { context, exception in
                println("JS ERROR: \(exception)")
            }
            
            self.context.evaluateScript("window = this;")
            self.context.setObject(self, forKeyedSubscript: "platform")
            self.context.setObject(Console(), forKeyedSubscript: "console")
            
            self.fetchScript("http://localhost:4242/build/engine.js")
            self.context.evaluateScript("r3.platform = platform;")
            
            self.fetchScript("http://localhost:4242/build/game.js")
            self.context.evaluateScript("r3.initialize(); r3.loadLevel(MyLevel); r3.play();")
        }
        
        NSTimer.scheduledTimerWithTimeInterval(3.0, target: self, selector: Selector("refreshScript"), userInfo: nil, repeats: true)
    }
    
    func fetchScript(url: NSString) {
        let request = NSURLRequest(URL: NSURL(string: url)!)
        let data: NSData = NSURLConnection.sendSynchronousRequest(request, returningResponse: nil, error: nil)!
        let script = NSString(data: data, encoding: NSUTF8StringEncoding)
        
        self.context.evaluateScript(script)
    }
    
    func refreshScript() {
        self.fetchScript("http://localhost:4242/build/game.js")
        self.context.evaluateScript("r3.hotSwapComponent()")
    }
    
    func sendTick(time: NSTimeInterval) {
        self.context.evaluateScript("r3.tick()")
    }
    
    func initialize() {
        viewController.initialize()
    }
    
    func play(level: NSDictionary) {
        let scene = SCNScene()
        scene.rootNode.addChildNode(level["concreteRoot"] as SCNNode)
        viewController.scnView.scene = scene
        viewController.scnView.play(self)
    }
    
    func createConcrete(node: NSDictionary) -> AnyObject? {
        let tag = node["tagName"] as String
        let def = tags[tag]!
        
        return def.create(node)
    }
    
    func addToParent(parentchild: NSArray) {
        let parent = parentchild[0] as NSDictionary
        let child = parentchild[1] as NSDictionary
        
        if parent["concrete"] is SCNNode && child["concrete"] is SCNNode {
            (parent["concrete"] as SCNNode).addChildNode(child["concrete"] as SCNNode)
        }
    }
    
    func applyPatch(node: NSDictionary) {
        let tag = node["tagName"] as String
        let def = tags[tag]
        
        def?.update?(node["concrete"]!, node: node)
    }
    
    func applyTransform(node: NSDictionary) {
        let props = node["properties"] as NSDictionary
        let object = node["concrete"] as SCNNode
        
        if props["x"] != nil { object.position.x = props["x"] as Float }
        if props["y"] != nil { object.position.y = props["y"] as Float }
        if props["z"] != nil { object.position.z = props["z"] as Float }
        
        if props["rx"] != nil { object.eulerAngles.x = props["rx"] as Float }
        if props["ry"] != nil { object.eulerAngles.y = props["ry"] as Float }
        if props["rz"] != nil { object.eulerAngles.z = props["rz"] as Float }
        
        if props["sx"] != nil { object.scale.x = props["sx"] as Float }
        if props["sy"] != nil { object.scale.y = props["sy"] as Float }
        if props["sz"] != nil { object.scale.z = props["sz"] as Float }
        
        var lookAt: SCNNode?
        if props["lookAt"] is String {
            lookAt = object.parentNode!.childNodeWithName(props["lookAt"] as String, recursively: true)
        }
        
        if lookAt != nil {
            object.constraints = [SCNLookAtConstraint(target: lookAt!)]
        }
    }
    
    func applyObject(node: NSDictionary) {
        let props = node["properties"] as NSDictionary
        let object = node["concrete"] as SCNNode
        
        if props["name"] != nil {
            object.name = props["name"] as String?
            NSLog(object.name!)
        }
    }
    
//    func createScene(virtualScene: JSValue) {
//        let root: NSDictionary = virtualScene.toDictionary()
//        let scene: SCNScene = self.concrete(root, parent: nil) as SCNScene
//        
//        viewController.scnView.scene = scene
//        println(scene)
//    }
    /*
    func createConcrete(node: NSDictionary) -> AnyObject? {
        var object: AnyObject? = nil
        var props: NSDictionary = node["properties"] as NSDictionary
        
        let tagName: NSString = node["tagName"] as NSString
//        println(tagName)
//        println(props)
        
        if (tagName == "SCENE") {
            object = SCNScene()
        } else if (tagName == "LIGHT") {
            object = SCNNode()
            applyTransform(object as SCNNode, props)
            
            var light = SCNLight()
            light.type = lightTypes[props["type"] as NSString]!
            (object as SCNNode).light = light
            
            var fakeParent: SCNNode? = nil
            if (parent is SCNScene) {
                fakeParent = (parent as SCNScene).rootNode
            }
            if (fakeParent != nil) {
                fakeParent!.addChildNode(object as SCNNode)
            }

        } else if (tagName == "MESH") {
            object = SCNNode()
            var fakeParent: SCNNode? = nil
            if (parent is SCNScene) {
                fakeParent = (parent as SCNScene).rootNode
            }
            if (fakeParent != nil) {
                fakeParent!.addChildNode(object as SCNNode)
            }
            applyTransform(object as SCNNode, props)
        } else if (tagName == "GEOMETRY") {
            var geo: SCNGeometry;
            if (props["type"] as NSString == "cube") {
                var size: CGFloat = props["size"] as CGFloat
                geo = SCNBox(width: size, height: size, length: size, chamferRadius: 0.0)
            } else {
                geo = SCNGeometry()
            }
            
            (parent as SCNNode).geometry = geo
            object = geo
        } else if (tagName == "MATERIAL") {
            var mat = SCNMaterial()
            mat.lightingModelName = materialTypes[props["type"] as NSString]!
            if props["color"] != nil {
                mat.diffuse.contents = colorFromHexInt(props["color"] as UInt)
            }
            (parent as SCNNode).geometry?.firstMaterial = mat
        }
        
        for child in node["children"] as NSArray {
            self.concrete(child as NSDictionary, parent: object)
        }
        
        return object
    }
    */
}

class GameViewController: UIViewController, SCNSceneRendererDelegate {
    var scnView: SCNView!
    var platform: Platform!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        platform = Platform()
        platform.viewController = self
    }
    
    func initialize() {
        self.scnView = self.view as SCNView;
        scnView.delegate = self;
        
        // allows the user to manipulate the camera
//        self.scnView.allowsCameraControl = true
        
        // show statistics such as fps and timing information
        self.scnView.showsStatistics = true
        
        // configure the view
        self.scnView.backgroundColor = UIColor.blackColor()
        
        // add a tap gesture recognizer
        let tapGesture = UITapGestureRecognizer(target: self, action: "handleTap:")
        let gestureRecognizers = NSMutableArray()
        gestureRecognizers.addObject(tapGesture)
        if let existingGestureRecognizers = scnView.gestureRecognizers {
            gestureRecognizers.addObjectsFromArray(existingGestureRecognizers)
        }
        self.scnView.gestureRecognizers = gestureRecognizers
        
//        self.renderTestScene()
    }
/*
    var mesh: SCNNode = SCNNode()
    
    func renderTestScene() {
        // create a new scene
        let scene = SCNScene()
        
        mesh.eulerAngles.y = 0.5
        
        let geo = SCNBox(width: 1.0, height: 1.0, length: 1.0, chamferRadius: 0.0)
        mesh.geometry = geo
        
        geo.firstMaterial!.lightingModelName = SCNLightingModelPhong
        geo.firstMaterial!.diffuse.contents = UIColor.redColor()
        geo.firstMaterial!.specular.contents = UIColor.whiteColor()
        println(geo.materials?.count)
        
        scene.rootNode.addChildNode(mesh)
        
        let camera = SCNNode()
        camera.position.y = 3
        camera.position.z = 5
        camera.constraints = [SCNLookAtConstraint(target: mesh)]
        camera.camera = SCNCamera()
        scene.rootNode.addChildNode(camera)
        
        let light = SCNNode()
        light.light = SCNLight()
        light.light?.type = SCNLightTypeSpot
        light.light?.color = UIColor.whiteColor()
        light.position.x = 10
        light.position.y = 10
        light.constraints = [SCNLookAtConstraint(target: mesh)]
        scene.rootNode.addChildNode(light)
        
        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = SCNLightTypeAmbient
        ambient.light?.color = UIColor(white: 0.5, alpha: 0.5)
        scene.rootNode.addChildNode(ambient)
        
        let m2 = SCNNode()
        m2.geometry = SCNBox(width: 0.4, height: 0.4, length: 0.4, chamferRadius: 0.0)
        m2.geometry?.firstMaterial!.diffuse.contents = UIColor.blueColor()
        scene.rootNode.addChildNode(m2)
        m2.position.y = 1

        scnView.scene = scene
    }
*/
    func handleTap(gestureRecognize: UIGestureRecognizer) {
        // retrieve the SCNView
        let scnView = self.view as SCNView
        
        // check what nodes are tapped
        let p = gestureRecognize.locationInView(scnView)
        if let hitResults = scnView.hitTest(p, options: nil) {
            // check that we clicked on at least one object
            if hitResults.count > 0 {
                // retrieved the first clicked object
                let result: AnyObject! = hitResults[0]
                
                // get its material
                let material = result.node!.geometry!.firstMaterial!
                
                // highlight it
                SCNTransaction.begin()
                SCNTransaction.setAnimationDuration(0.5)
                
                // on completion - unhighlight
                SCNTransaction.setCompletionBlock {
                    SCNTransaction.begin()
                    SCNTransaction.setAnimationDuration(0.5)
                    
                    material.emission.contents = UIColor.blackColor()
                    
                    SCNTransaction.commit()
                }
                
                material.emission.contents = UIColor.redColor()
                
                SCNTransaction.commit()
            }
        }
    }
    
    func renderer(aRenderer: SCNSceneRenderer, updateAtTime time: NSTimeInterval) {
//        mesh.eulerAngles.y += 0.01
        platform.sendTick(time)
    }
    
//    var currentAngle: Float = 0.0
    
//    func panGesture(sender: UIPanGestureRecognizer) {
//        let translation = sender.translationInView(sender.view!)
//        var newAngle = (Float)(translation.x) * (Float)(M_PI) / 180.0
//        newAngle += currentAngle
//        
//        camera.transform = SCNMatrix4MakeRotation(newAngle, 0, 1, 0)
//        
//        if (sender.state == UIGestureRecognizerState.Ended) {
//            currentAngle = newAngle
//        }
//    }
    
    override func shouldAutorotate() -> Bool {
        return true
    }
    
    override func prefersStatusBarHidden() -> Bool {
        return true
    }
    
    override func supportedInterfaceOrientations() -> Int {
        if UIDevice.currentDevice().userInterfaceIdiom == .Phone {
            return Int(UIInterfaceOrientationMask.AllButUpsideDown.rawValue)
        } else {
            return Int(UIInterfaceOrientationMask.All.rawValue)
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Release any cached data, images, etc that aren't in use.
    }

}
