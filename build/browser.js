"use strict";

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) {
                    return a(o, !0);
                }if (i) {
                    return i(o, !0);
                }var f = new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
        var r3 = {
            initialize: function initialize() {
                r3.platform.initialize();
            },

            play: function play() {
                r3.platform.render();
            },

            tick: function tick(delta) {
                if (this.level && this.level.tick) {
                    this.level.tick(delta);
                    this.level.virtualRoot.isDirty = true // FIXME
                    ;
                }

                if (this.level && this.level.virtualRoot && this.level.virtualRoot.isDirty) {
                    var newVirtual = this.level.render();
                    var diff = r3.virtualDiff(this.level.virtualRoot, newVirtual);
                    this.patchConcrete(diff);
                }
            },

            loadLevel: function loadLevel(levelClass) {
                this.level = new levelClass();
                this.level.virtualRoot = this.level.render();

                this.level.concreteRoot = this.createConcrete(this.level.virtualRoot);
                this.postCreate(this.level.virtualRoot);
            },

            createConcrete: function createConcrete(node) {
                var tag = node.tagName = node.tagName.toUpperCase();
                var def = r3.tags[tag];

                if (!def) {
                    return console.error("Invalid tag", tag);
                }if (def.children && node.children) {
                    node.children.forEach(function (child) {
                        if (child.as && def.children.indexOf(child.as.toLowerCase()) != -1) {
                            child.madeProp = true;
                            var concreteChild = r3.createConcrete(child);
                            node.properties[child.as.toLowerCase()] = concreteChild;
                        }

                        if (def.children.indexOf(child.tagName.toLowerCase()) != -1) {
                            child.madeProp = true;
                            var concreteChild = r3.createConcrete(child);
                            node.properties[child.tagName.toLowerCase()] = concreteChild;
                        }
                    });
                }

                var concrete = r3.platform.createConcrete(node);
                node.concrete = concrete;

                if (def.props.indexOf(OBJECT) != -1) {
                    r3.platform.applyObject(concrete, node);
                }

                if (node.children) {
                    node.children.forEach(function (child) {
                        if (!child.madeProp) {
                            var concreteChild = r3.createConcrete(child);
                            if (concrete.add) concrete.add(concreteChild);
                        }
                    });
                }

                return concrete;
            },

            postCreate: function postCreate(node) {
                var tag = node.tagName;
                var def = r3.tags[tag];

                if (def.props.indexOf(TRANSFORM) != -1 || def.props.indexOf(OBJECT) != -1) {
                    r3.platform.applyTransform(node.concrete, node);
                }

                if (node.children) {
                    node.children.forEach(function (child) {
                        r3.postCreate(child);
                    });
                }
            },

            patchConcrete: function patchConcrete(diff) {},

            virtual: require("virtual-dom/h"),

            virtualDiff: require("virtual-dom/diff") };

        var TRANSFORM = "TRANSFORM";
        var OBJECT = "OBJECT";

        r3.tags = {
            TRANSFORM: { props: ["x", "y", "z", "rx", "ry", "rz", "sx", "sy", "sz", "lookAt"] },
            OBJECT: { props: [TRANSFORM, "name", "visible", "castShadow", "receiveShadow"] },
            SCENE: { props: [OBJECT], children: ["camera"] },
            MESH: { props: [OBJECT], children: ["geometry", "model", "material"] },
            MODEL: { props: [TRANSFORM, "file"] },
            GEOMETRY: { props: ["size", "sx", "sy", "sz", "dx", "dy", "dz"], types: ["cube", "sphere", "plane", "cylinder", "text", "torus"] },
            MATERIAL: { props: ["color", "emissive", "specular", "shininess", "metal", "shading"], children: ["texture", "bump", "normal"], types: ["basic", "lambert", "phong", "wireframe"] },
            TEXTURE: { props: ["file", "mapping", "wrapS", "wrapT", "anisotropy"] },
            CAMERA: { props: [OBJECT], types: ["perspective", "orthographic"] },
            LIGHT: { props: [OBJECT, "color", "intensity", "distance"], types: ["area", "directional", "ambient", "hemisphere", "point", "spot"] } };

        module.exports = r3;
        window.r3 = r3;
    }, { "virtual-dom/diff": 2, "virtual-dom/h": 3 }], 2: [function (require, module, exports) {
        var diff = require("./vtree/diff.js");

        module.exports = diff;
    }, { "./vtree/diff.js": 25 }], 3: [function (require, module, exports) {
        var h = require("./virtual-hyperscript/index.js");

        module.exports = h;
    }, { "./virtual-hyperscript/index.js": 12 }], 4: [function (require, module, exports) {
        /*!
         * Cross-Browser Split 1.1.1
         * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
         * Available under the MIT License
         * ECMAScript compliant, uniform cross-browser split method
         */

        /**
         * Splits a string into an array of strings using a regex or string separator. Matches of the
         * separator are not included in the result array. However, if `separator` is a regex that contains
         * capturing groups, backreferences are spliced into the result each time `separator` is matched.
         * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
         * cross-browser.
         * @param {String} str String to split.
         * @param {RegExp|String} separator Regex or string to use for separating the string.
         * @param {Number} [limit] Maximum number of items to include in the result array.
         * @returns {Array} Array of substrings.
         * @example
         *
         * // Basic use
         * split('a b c d', ' ');
         * // -> ['a', 'b', 'c', 'd']
         *
         * // With limit
         * split('a b c d', ' ', 2);
         * // -> ['a', 'b']
         *
         * // Backreferences in result array
         * split('..word1 word2..', /([a-z]+)(\d+)/i);
         * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
         */
        module.exports = (function split(undef) {

            var nativeSplit = String.prototype.split,
                compliantExecNpcg = /()??/.exec("")[1] === undef,

            // NPCG: nonparticipating capturing group
            self;

            self = function (str, separator, limit) {
                // If `separator` is not a regex, use `nativeSplit`
                if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
                    return nativeSplit.call(str, separator, limit);
                }
                var output = [],
                    flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + (separator.sticky ? "y" : ""),

                // Firefox 3+
                lastLastIndex = 0,

                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator = new RegExp(separator.source, flags + "g"),
                    separator2,
                    match,
                    lastIndex,
                    lastLength;
                str += ""; // Type-convert
                if (!compliantExecNpcg) {
                    // Doesn't need flags gy, but they don't hurt
                    separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
                }
                /* Values for `limit`, per the spec:
                 * If undefined: 4294967295 // Math.pow(2, 32) - 1
                 * If 0, Infinity, or NaN: 0
                 * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
                 * If negative number: 4294967296 - Math.floor(Math.abs(limit))
                 * If other: Type-convert, then use the above rules
                 */
                limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
                limit >>> 0; // ToUint32(limit)
                while (match = separator.exec(str)) {
                    // `separator.lastIndex` is not reliable cross-browser
                    lastIndex = match.index + match[0].length;
                    if (lastIndex > lastLastIndex) {
                        output.push(str.slice(lastLastIndex, match.index));
                        // Fix browsers whose `exec` methods don't consistently return `undefined` for
                        // nonparticipating capturing groups
                        if (!compliantExecNpcg && match.length > 1) {
                            match[0].replace(separator2, function () {
                                for (var i = 1; i < arguments.length - 2; i++) {
                                    if (arguments[i] === undef) {
                                        match[i] = undef;
                                    }
                                }
                            });
                        }
                        if (match.length > 1 && match.index < str.length) {
                            Array.prototype.push.apply(output, match.slice(1));
                        }
                        lastLength = match[0].length;
                        lastLastIndex = lastIndex;
                        if (output.length >= limit) {
                            break;
                        }
                    }
                    if (separator.lastIndex === match.index) {
                        separator.lastIndex++; // Avoid an infinite loop
                    }
                }
                if (lastLastIndex === str.length) {
                    if (lastLength || !separator.test("")) {
                        output.push("");
                    }
                } else {
                    output.push(str.slice(lastLastIndex));
                }
                return output.length > limit ? output.slice(0, limit) : output;
            };

            return self;
        })();
    }, {}], 5: [function (require, module, exports) {
        "use strict";

        var OneVersionConstraint = require("individual/one-version");

        var MY_VERSION = "7";
        OneVersionConstraint("ev-store", MY_VERSION);

        var hashKey = "__EV_STORE_KEY@" + MY_VERSION;

        module.exports = EvStore;

        function EvStore(elem) {
            var hash = elem[hashKey];

            if (!hash) {
                hash = elem[hashKey] = {};
            }

            return hash;
        }
    }, { "individual/one-version": 7 }], 6: [function (require, module, exports) {
        (function (global) {
            "use strict";

            /*global window, global*/

            var root = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};

            module.exports = Individual;

            function Individual(key, value) {
                if (key in root) {
                    return root[key];
                }

                root[key] = value;

                return value;
            }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {}], 7: [function (require, module, exports) {
        "use strict";

        var Individual = require("./index.js");

        module.exports = OneVersion;

        function OneVersion(moduleName, version, defaultValue) {
            var key = "__INDIVIDUAL_ONE_VERSION_" + moduleName;
            var enforceKey = key + "_ENFORCE_SINGLETON";

            var versionValue = Individual(enforceKey, version);

            if (versionValue !== version) {
                throw new Error("Can only have one copy of " + moduleName + ".\n" + "You already have version " + versionValue + " installed.\n" + "This means you cannot install version " + version);
            }

            return Individual(key, defaultValue);
        }
    }, { "./index.js": 6 }], 8: [function (require, module, exports) {
        "use strict";

        module.exports = function isObject(x) {
            return typeof x === "object" && x !== null;
        };
    }, {}], 9: [function (require, module, exports) {
        var nativeIsArray = Array.isArray;
        var toString = Object.prototype.toString;

        module.exports = nativeIsArray || isArray;

        function isArray(obj) {
            return toString.call(obj) === "[object Array]";
        }
    }, {}], 10: [function (require, module, exports) {
        "use strict";

        var EvStore = require("ev-store");

        module.exports = EvHook;

        function EvHook(value) {
            if (!(this instanceof EvHook)) {
                return new EvHook(value);
            }

            this.value = value;
        }

        EvHook.prototype.hook = function (node, propertyName) {
            var es = EvStore(node);
            var propName = propertyName.substr(3);

            es[propName] = this.value;
        };

        EvHook.prototype.unhook = function (node, propertyName) {
            var es = EvStore(node);
            var propName = propertyName.substr(3);

            es[propName] = undefined;
        };
    }, { "ev-store": 5 }], 11: [function (require, module, exports) {
        "use strict";

        module.exports = SoftSetHook;

        function SoftSetHook(value) {
            if (!(this instanceof SoftSetHook)) {
                return new SoftSetHook(value);
            }

            this.value = value;
        }

        SoftSetHook.prototype.hook = function (node, propertyName) {
            if (node[propertyName] !== this.value) {
                node[propertyName] = this.value;
            }
        };
    }, {}], 12: [function (require, module, exports) {
        "use strict";

        var isArray = require("x-is-array");

        var VNode = require("../vnode/vnode.js");
        var VText = require("../vnode/vtext.js");
        var isVNode = require("../vnode/is-vnode");
        var isVText = require("../vnode/is-vtext");
        var isWidget = require("../vnode/is-widget");
        var isHook = require("../vnode/is-vhook");
        var isVThunk = require("../vnode/is-thunk");

        var parseTag = require("./parse-tag.js");
        var softSetHook = require("./hooks/soft-set-hook.js");
        var evHook = require("./hooks/ev-hook.js");

        module.exports = h;

        function h(tagName, properties, children) {
            var childNodes = [];
            var tag, props, key, namespace;

            if (!children && isChildren(properties)) {
                children = properties;
                props = {};
            }

            props = props || properties || {};
            tag = parseTag(tagName, props);

            // support keys
            if (props.hasOwnProperty("key")) {
                key = props.key;
                props.key = undefined;
            }

            // support namespace
            if (props.hasOwnProperty("namespace")) {
                namespace = props.namespace;
                props.namespace = undefined;
            }

            // fix cursor bug
            if (tag === "INPUT" && !namespace && props.hasOwnProperty("value") && props.value !== undefined && !isHook(props.value)) {
                props.value = softSetHook(props.value);
            }

            transformProperties(props);

            if (children !== undefined && children !== null) {
                addChild(children, childNodes, tag, props);
            }

            return new VNode(tag, props, childNodes, key, namespace);
        }

        function addChild(c, childNodes, tag, props) {
            if (typeof c === "string") {
                childNodes.push(new VText(c));
            } else if (isChild(c)) {
                childNodes.push(c);
            } else if (isArray(c)) {
                for (var i = 0; i < c.length; i++) {
                    addChild(c[i], childNodes, tag, props);
                }
            } else if (c === null || c === undefined) {
                return;
            } else {
                throw UnexpectedVirtualElement({
                    foreignObject: c,
                    parentVnode: {
                        tagName: tag,
                        properties: props
                    }
                });
            }
        }

        function transformProperties(props) {
            for (var propName in props) {
                if (props.hasOwnProperty(propName)) {
                    var value = props[propName];

                    if (isHook(value)) {
                        continue;
                    }

                    if (propName.substr(0, 3) === "ev-") {
                        // add ev-foo support
                        props[propName] = evHook(value);
                    }
                }
            }
        }

        function isChild(x) {
            return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
        }

        function isChildren(x) {
            return typeof x === "string" || isArray(x) || isChild(x);
        }

        function UnexpectedVirtualElement(data) {
            var err = new Error();

            err.type = "virtual-hyperscript.unexpected.virtual-element";
            err.message = "Unexpected virtual child passed to h().\n" + "Expected a VNode / Vthunk / VWidget / string but:\n" + "got:\n" + errorString(data.foreignObject) + ".\n" + "The parent vnode is:\n" + errorString(data.parentVnode);
            "\n" + "Suggested fix: change your `h(..., [ ... ])` callsite.";
            err.foreignObject = data.foreignObject;
            err.parentVnode = data.parentVnode;

            return err;
        }

        function errorString(obj) {
            try {
                return JSON.stringify(obj, null, "    ");
            } catch (e) {
                return String(obj);
            }
        }
    }, { "../vnode/is-thunk": 15, "../vnode/is-vhook": 16, "../vnode/is-vnode": 17, "../vnode/is-vtext": 18, "../vnode/is-widget": 19, "../vnode/vnode.js": 21, "../vnode/vtext.js": 23, "./hooks/ev-hook.js": 10, "./hooks/soft-set-hook.js": 11, "./parse-tag.js": 13, "x-is-array": 9 }], 13: [function (require, module, exports) {
        "use strict";

        var split = require("browser-split");

        var classIdSplit = /([\.#]?[a-zA-Z0-9_:-]+)/;
        var notClassId = /^\.|#/;

        module.exports = parseTag;

        function parseTag(tag, props) {
            if (!tag) {
                return "DIV";
            }

            var noId = !props.hasOwnProperty("id");

            var tagParts = split(tag, classIdSplit);
            var tagName = null;

            if (notClassId.test(tagParts[1])) {
                tagName = "DIV";
            }

            var classes, part, type, i;

            for (i = 0; i < tagParts.length; i++) {
                part = tagParts[i];

                if (!part) {
                    continue;
                }

                type = part.charAt(0);

                if (!tagName) {
                    tagName = part;
                } else if (type === ".") {
                    classes = classes || [];
                    classes.push(part.substring(1, part.length));
                } else if (type === "#" && noId) {
                    props.id = part.substring(1, part.length);
                }
            }

            if (classes) {
                if (props.className) {
                    classes.push(props.className);
                }

                props.className = classes.join(" ");
            }

            return props.namespace ? tagName : tagName.toUpperCase();
        }
    }, { "browser-split": 4 }], 14: [function (require, module, exports) {
        var isVNode = require("./is-vnode");
        var isVText = require("./is-vtext");
        var isWidget = require("./is-widget");
        var isThunk = require("./is-thunk");

        module.exports = handleThunk;

        function handleThunk(a, b) {
            var renderedA = a;
            var renderedB = b;

            if (isThunk(b)) {
                renderedB = renderThunk(b, a);
            }

            if (isThunk(a)) {
                renderedA = renderThunk(a, null);
            }

            return {
                a: renderedA,
                b: renderedB
            };
        }

        function renderThunk(thunk, previous) {
            var renderedThunk = thunk.vnode;

            if (!renderedThunk) {
                renderedThunk = thunk.vnode = thunk.render(previous);
            }

            if (!(isVNode(renderedThunk) || isVText(renderedThunk) || isWidget(renderedThunk))) {
                throw new Error("thunk did not return a valid node");
            }

            return renderedThunk;
        }
    }, { "./is-thunk": 15, "./is-vnode": 17, "./is-vtext": 18, "./is-widget": 19 }], 15: [function (require, module, exports) {
        module.exports = isThunk;

        function isThunk(t) {
            return t && t.type === "Thunk";
        }
    }, {}], 16: [function (require, module, exports) {
        module.exports = isHook;

        function isHook(hook) {
            return hook && (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") || typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"));
        }
    }, {}], 17: [function (require, module, exports) {
        var version = require("./version");

        module.exports = isVirtualNode;

        function isVirtualNode(x) {
            return x && x.type === "VirtualNode" && x.version === version;
        }
    }, { "./version": 20 }], 18: [function (require, module, exports) {
        var version = require("./version");

        module.exports = isVirtualText;

        function isVirtualText(x) {
            return x && x.type === "VirtualText" && x.version === version;
        }
    }, { "./version": 20 }], 19: [function (require, module, exports) {
        module.exports = isWidget;

        function isWidget(w) {
            return w && w.type === "Widget";
        }
    }, {}], 20: [function (require, module, exports) {
        module.exports = "2";
    }, {}], 21: [function (require, module, exports) {
        var version = require("./version");
        var isVNode = require("./is-vnode");
        var isWidget = require("./is-widget");
        var isThunk = require("./is-thunk");
        var isVHook = require("./is-vhook");

        module.exports = VirtualNode;

        var noProperties = {};
        var noChildren = [];

        function VirtualNode(tagName, properties, children, key, namespace) {
            this.tagName = tagName;
            this.properties = properties || noProperties;
            this.children = children || noChildren;
            this.key = key != null ? String(key) : undefined;
            this.namespace = typeof namespace === "string" ? namespace : null;

            var count = children && children.length || 0;
            var descendants = 0;
            var hasWidgets = false;
            var hasThunks = false;
            var descendantHooks = false;
            var hooks;

            for (var propName in properties) {
                if (properties.hasOwnProperty(propName)) {
                    var property = properties[propName];
                    if (isVHook(property) && property.unhook) {
                        if (!hooks) {
                            hooks = {};
                        }

                        hooks[propName] = property;
                    }
                }
            }

            for (var i = 0; i < count; i++) {
                var child = children[i];
                if (isVNode(child)) {
                    descendants += child.count || 0;

                    if (!hasWidgets && child.hasWidgets) {
                        hasWidgets = true;
                    }

                    if (!hasThunks && child.hasThunks) {
                        hasThunks = true;
                    }

                    if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                        descendantHooks = true;
                    }
                } else if (!hasWidgets && isWidget(child)) {
                    if (typeof child.destroy === "function") {
                        hasWidgets = true;
                    }
                } else if (!hasThunks && isThunk(child)) {
                    hasThunks = true;
                }
            }

            this.count = count + descendants;
            this.hasWidgets = hasWidgets;
            this.hasThunks = hasThunks;
            this.hooks = hooks;
            this.descendantHooks = descendantHooks;
        }

        VirtualNode.prototype.version = version;
        VirtualNode.prototype.type = "VirtualNode";
    }, { "./is-thunk": 15, "./is-vhook": 16, "./is-vnode": 17, "./is-widget": 19, "./version": 20 }], 22: [function (require, module, exports) {
        var version = require("./version");

        VirtualPatch.NONE = 0;
        VirtualPatch.VTEXT = 1;
        VirtualPatch.VNODE = 2;
        VirtualPatch.WIDGET = 3;
        VirtualPatch.PROPS = 4;
        VirtualPatch.ORDER = 5;
        VirtualPatch.INSERT = 6;
        VirtualPatch.REMOVE = 7;
        VirtualPatch.THUNK = 8;

        module.exports = VirtualPatch;

        function VirtualPatch(type, vNode, patch) {
            this.type = Number(type);
            this.vNode = vNode;
            this.patch = patch;
        }

        VirtualPatch.prototype.version = version;
        VirtualPatch.prototype.type = "VirtualPatch";
    }, { "./version": 20 }], 23: [function (require, module, exports) {
        var version = require("./version");

        module.exports = VirtualText;

        function VirtualText(text) {
            this.text = String(text);
        }

        VirtualText.prototype.version = version;
        VirtualText.prototype.type = "VirtualText";
    }, { "./version": 20 }], 24: [function (require, module, exports) {
        var isObject = require("is-object");
        var isHook = require("../vnode/is-vhook");

        module.exports = diffProps;

        function diffProps(a, b) {
            var diff;

            for (var aKey in a) {
                if (!(aKey in b)) {
                    diff = diff || {};
                    diff[aKey] = undefined;
                }

                var aValue = a[aKey];
                var bValue = b[aKey];

                if (aValue === bValue) {
                    continue;
                } else if (isObject(aValue) && isObject(bValue)) {
                    if (getPrototype(bValue) !== getPrototype(aValue)) {
                        diff = diff || {};
                        diff[aKey] = bValue;
                    } else if (isHook(bValue)) {
                        diff = diff || {};
                        diff[aKey] = bValue;
                    } else {
                        var objectDiff = diffProps(aValue, bValue);
                        if (objectDiff) {
                            diff = diff || {};
                            diff[aKey] = objectDiff;
                        }
                    }
                } else {
                    diff = diff || {};
                    diff[aKey] = bValue;
                }
            }

            for (var bKey in b) {
                if (!(bKey in a)) {
                    diff = diff || {};
                    diff[bKey] = b[bKey];
                }
            }

            return diff;
        }

        function getPrototype(value) {
            if (Object.getPrototypeOf) {
                return Object.getPrototypeOf(value);
            } else if (value.__proto__) {
                return value.__proto__;
            } else if (value.constructor) {
                return value.constructor.prototype;
            }
        }
    }, { "../vnode/is-vhook": 16, "is-object": 8 }], 25: [function (require, module, exports) {
        var isArray = require("x-is-array");

        var VPatch = require("../vnode/vpatch");
        var isVNode = require("../vnode/is-vnode");
        var isVText = require("../vnode/is-vtext");
        var isWidget = require("../vnode/is-widget");
        var isThunk = require("../vnode/is-thunk");
        var handleThunk = require("../vnode/handle-thunk");

        var diffProps = require("./diff-props");

        module.exports = diff;

        function diff(a, b) {
            var patch = { a: a };
            walk(a, b, patch, 0);
            return patch;
        }

        function walk(a, b, patch, index) {
            if (a === b) {
                return;
            }

            var apply = patch[index];
            var applyClear = false;

            if (isThunk(a) || isThunk(b)) {
                thunks(a, b, patch, index);
            } else if (b == null) {

                // If a is a widget we will add a remove patch for it
                // Otherwise any child widgets/hooks must be destroyed.
                // This prevents adding two remove patches for a widget.
                if (!isWidget(a)) {
                    clearState(a, patch, index);
                    apply = patch[index];
                }

                apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b));
            } else if (isVNode(b)) {
                if (isVNode(a)) {
                    if (a.tagName === b.tagName && a.namespace === b.namespace && a.key === b.key) {
                        var propsPatch = diffProps(a.properties, b.properties);
                        if (propsPatch) {
                            apply = appendPatch(apply, new VPatch(VPatch.PROPS, a, propsPatch));
                        }
                        apply = diffChildren(a, b, patch, apply, index);
                    } else {
                        apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                        applyClear = true;
                    }
                } else {
                    apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                    applyClear = true;
                }
            } else if (isVText(b)) {
                if (!isVText(a)) {
                    apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
                    applyClear = true;
                } else if (a.text !== b.text) {
                    apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
                }
            } else if (isWidget(b)) {
                if (!isWidget(a)) {
                    applyClear = true;
                }

                apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b));
            }

            if (apply) {
                patch[index] = apply;
            }

            if (applyClear) {
                clearState(a, patch, index);
            }
        }

        function diffChildren(a, b, patch, apply, index) {
            var aChildren = a.children;
            var orderedSet = reorder(aChildren, b.children);
            var bChildren = orderedSet.children;

            var aLen = aChildren.length;
            var bLen = bChildren.length;
            var len = aLen > bLen ? aLen : bLen;

            for (var i = 0; i < len; i++) {
                var leftNode = aChildren[i];
                var rightNode = bChildren[i];
                index += 1;

                if (!leftNode) {
                    if (rightNode) {
                        // Excess nodes in b need to be added
                        apply = appendPatch(apply, new VPatch(VPatch.INSERT, null, rightNode));
                    }
                } else {
                    walk(leftNode, rightNode, patch, index);
                }

                if (isVNode(leftNode) && leftNode.count) {
                    index += leftNode.count;
                }
            }

            if (orderedSet.moves) {
                // Reorder nodes last
                apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, orderedSet.moves));
            }

            return apply;
        }

        function clearState(vNode, patch, index) {
            // TODO: Make this a single walk, not two
            unhook(vNode, patch, index);
            destroyWidgets(vNode, patch, index);
        }

        // Patch records for all destroyed widgets must be added because we need
        // a DOM node reference for the destroy function
        function destroyWidgets(vNode, patch, index) {
            if (isWidget(vNode)) {
                if (typeof vNode.destroy === "function") {
                    patch[index] = appendPatch(patch[index], new VPatch(VPatch.REMOVE, vNode, null));
                }
            } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
                var children = vNode.children;
                var len = children.length;
                for (var i = 0; i < len; i++) {
                    var child = children[i];
                    index += 1;

                    destroyWidgets(child, patch, index);

                    if (isVNode(child) && child.count) {
                        index += child.count;
                    }
                }
            } else if (isThunk(vNode)) {
                thunks(vNode, null, patch, index);
            }
        }

        // Create a sub-patch for thunks
        function thunks(a, b, patch, index) {
            var nodes = handleThunk(a, b);
            var thunkPatch = diff(nodes.a, nodes.b);
            if (hasPatches(thunkPatch)) {
                patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch);
            }
        }

        function hasPatches(patch) {
            for (var index in patch) {
                if (index !== "a") {
                    return true;
                }
            }

            return false;
        }

        // Execute hooks when two nodes are identical
        function unhook(vNode, patch, index) {
            if (isVNode(vNode)) {
                if (vNode.hooks) {
                    patch[index] = appendPatch(patch[index], new VPatch(VPatch.PROPS, vNode, undefinedKeys(vNode.hooks)));
                }

                if (vNode.descendantHooks || vNode.hasThunks) {
                    var children = vNode.children;
                    var len = children.length;
                    for (var i = 0; i < len; i++) {
                        var child = children[i];
                        index += 1;

                        unhook(child, patch, index);

                        if (isVNode(child) && child.count) {
                            index += child.count;
                        }
                    }
                }
            } else if (isThunk(vNode)) {
                thunks(vNode, null, patch, index);
            }
        }

        function undefinedKeys(obj) {
            var result = {};

            for (var key in obj) {
                result[key] = undefined;
            }

            return result;
        }

        // List diff, naive left to right reordering
        function reorder(aChildren, bChildren) {
            // O(M) time, O(M) memory
            var bChildIndex = keyIndex(bChildren);
            var bKeys = bChildIndex.keys;
            var bFree = bChildIndex.free;

            if (bFree.length === bChildren.length) {
                return {
                    children: bChildren,
                    moves: null
                };
            }

            // O(N) time, O(N) memory
            var aChildIndex = keyIndex(aChildren);
            var aKeys = aChildIndex.keys;
            var aFree = aChildIndex.free;

            if (aFree.length === aChildren.length) {
                return {
                    children: bChildren,
                    moves: null
                };
            }

            // O(MAX(N, M)) memory
            var newChildren = [];

            var freeIndex = 0;
            var freeCount = bFree.length;
            var deletedItems = 0;

            // Iterate through a and match a node in b
            // O(N) time,
            for (var i = 0; i < aChildren.length; i++) {
                var aItem = aChildren[i];
                var itemIndex;

                if (aItem.key) {
                    if (bKeys.hasOwnProperty(aItem.key)) {
                        // Match up the old keys
                        itemIndex = bKeys[aItem.key];
                        newChildren.push(bChildren[itemIndex]);
                    } else {
                        // Remove old keyed items
                        itemIndex = i - deletedItems++;
                        newChildren.push(null);
                    }
                } else {
                    // Match the item in a with the next free item in b
                    if (freeIndex < freeCount) {
                        itemIndex = bFree[freeIndex++];
                        newChildren.push(bChildren[itemIndex]);
                    } else {
                        // There are no free items in b to match with
                        // the free items in a, so the extra free nodes
                        // are deleted.
                        itemIndex = i - deletedItems++;
                        newChildren.push(null);
                    }
                }
            }

            var lastFreeIndex = freeIndex >= bFree.length ? bChildren.length : bFree[freeIndex];

            // Iterate through b and append any new keys
            // O(M) time
            for (var j = 0; j < bChildren.length; j++) {
                var newItem = bChildren[j];

                if (newItem.key) {
                    if (!aKeys.hasOwnProperty(newItem.key)) {
                        // Add any new keyed items
                        // We are adding new items to the end and then sorting them
                        // in place. In future we should insert new items in place.
                        newChildren.push(newItem);
                    }
                } else if (j >= lastFreeIndex) {
                    // Add any leftover non-keyed items
                    newChildren.push(newItem);
                }
            }

            var simulate = newChildren.slice();
            var simulateIndex = 0;
            var removes = [];
            var inserts = [];
            var simulateItem;

            for (var k = 0; k < bChildren.length;) {
                var wantedItem = bChildren[k];
                simulateItem = simulate[simulateIndex];

                // remove items
                while (simulateItem === null && simulate.length) {
                    removes.push(remove(simulate, simulateIndex, null));
                    simulateItem = simulate[simulateIndex];
                }

                if (!simulateItem || simulateItem.key !== wantedItem.key) {
                    // if we need a key in this position...
                    if (wantedItem.key) {
                        if (simulateItem && simulateItem.key) {
                            // if an insert doesn't put this key in place, it needs to move
                            if (bKeys[simulateItem.key] !== k + 1) {
                                removes.push(remove(simulate, simulateIndex, simulateItem.key));
                                simulateItem = simulate[simulateIndex];
                                // if the remove didn't put the wanted item in place, we need to insert it
                                if (!simulateItem || simulateItem.key !== wantedItem.key) {
                                    inserts.push({ key: wantedItem.key, to: k });
                                }
                                // items are matching, so skip ahead
                                else {
                                    simulateIndex++;
                                }
                            } else {
                                inserts.push({ key: wantedItem.key, to: k });
                            }
                        } else {
                            inserts.push({ key: wantedItem.key, to: k });
                        }
                        k++;
                    }
                    // a key in simulate has no matching wanted key, remove it
                    else if (simulateItem && simulateItem.key) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key));
                    }
                } else {
                    simulateIndex++;
                    k++;
                }
            }

            // remove all the remaining nodes from simulate
            while (simulateIndex < simulate.length) {
                simulateItem = simulate[simulateIndex];
                removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key));
            }

            // If the only moves we have are deletes then we can just
            // let the delete patch remove these items.
            if (removes.length === deletedItems && !inserts.length) {
                return {
                    children: newChildren,
                    moves: null
                };
            }

            return {
                children: newChildren,
                moves: {
                    removes: removes,
                    inserts: inserts
                }
            };
        }

        function remove(arr, index, key) {
            arr.splice(index, 1);

            return {
                from: index,
                key: key
            };
        }

        function keyIndex(children) {
            var keys = {};
            var free = [];
            var length = children.length;

            for (var i = 0; i < length; i++) {
                var child = children[i];

                if (child.key) {
                    keys[child.key] = i;
                } else {
                    free.push(i);
                }
            }

            return {
                keys: keys, // A hash of key name to index
                free: free };
        }

        function appendPatch(apply, patch) {
            if (apply) {
                if (isArray(apply)) {
                    apply.push(patch);
                } else {
                    apply = [apply, patch];
                }

                return apply;
            } else {
                return patch;
            }
        }
    }, { "../vnode/handle-thunk": 14, "../vnode/is-thunk": 15, "../vnode/is-vnode": 17, "../vnode/is-vtext": 18, "../vnode/is-widget": 19, "../vnode/vpatch": 22, "./diff-props": 24, "x-is-array": 9 }], 26: [function (require, module, exports) {
        var r3 = require("../../engine/index");

        var platform = {
            initialize: function initialize() {
                var container = document.getElementById("renderer") || document.body;

                var renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(container.scrollWidth, container.scrollHeight);
                renderer.setClearColor(0);
                // renderer.autoClear = false
                renderer.physicallyBasedShading = true;
                renderer.shadowMapEnabled = true;
                container.appendChild(renderer.domElement);

                var stats = this.stats = new Stats();
                stats.domElement.style.position = "absolute";
                stats.domElement.style.top = "0px";
                container.appendChild(stats.domElement);

                this.clock = new THREE.Clock();
                this.render = this.render.bind(this);
            },

            render: function render() {
                requestAnimationFrame(this.render);

                r3.tick(this.clock.getDelta());

                this.renderer.render(r3.level.concreteRoot, r3.level.virtualRoot.properties.camera);
                this.stats.update();
            },

            createConcrete: function createConcrete(node) {
                return platform.tags[node.tagName](node);
            },

            // applyPatch(diff) {
            //   for (var index in diff) {
            //     if (index === 'a') continue
            //     var info = diff[index],
            //         patch = info.patch,
            //         node = info.vNode,
            //         shouldApplyTransform = false

            //     for (var key in patch) {
            //       node.properties[key] = patch[key]
            //       if (r3.transformKeys.indexOf(key) !== -1)
            //         shouldApplyTransform = true
            //     }

            //     if (shouldApplyTransform)
            //       applyTransform(node.concrete, node)
            //   }
            // },

            applyTransform: function applyTransform(object, node) {
                if (node.properties.x !== undefined) object.position.x = node.properties.x;
                if (node.properties.y !== undefined) object.position.y = node.properties.y;
                if (node.properties.z !== undefined) object.position.z = node.properties.z;

                if (node.properties.rx !== undefined) object.rotation.x = node.properties.rx;
                if (node.properties.ry !== undefined) object.rotation.y = node.properties.ry;
                if (node.properties.rz !== undefined) object.rotation.z = node.properties.rz;

                if (node.properties.sx !== undefined) object.scale.x = node.properties.sx;
                if (node.properties.sy !== undefined) object.scale.y = node.properties.sy;
                if (node.properties.sz !== undefined) object.scale.z = node.properties.sz;

                var lookAt = node.properties.lookAt;
                if (lookAt) {
                    if (typeof lookAt === "string") lookAt = object.parent.getObjectByName(lookAt);
                    if (lookAt.concrete) lookAt = lookAt.concrete;
                    if (lookAt.position) lookAt = lookAt.position;
                    object.lookAt(lookAt);
                }
            },

            applyObject: function applyObject(object, node) {
                if (node.properties.name !== undefined) object.name = node.properties.name;
                if (node.properties.visible !== undefined) object.visible = node.properties.visible;
                if (node.properties.castShadow !== undefined) object.castShadow = node.properties.castShadow;
                if (node.properties.receiveShadow !== undefined) object.receiveShadow = node.properties.receiveShadow;
            }
        };

        platform.geometryTypes = {
            cube: THREE.BoxGeometry,
            plane: THREE.PlaneBufferGeometry,
            sphere: THREE.SphereGeometry,
            cylinder: THREE.CylinderGeometry,
            text: THREE.TextGeometry,
            torus: THREE.TorusGeometry };

        platform.materialTypes = {
            basic: THREE.MeshBasicMaterial,
            lambert: THREE.MeshLambertMaterial,
            phong: THREE.MeshPhongMaterial,
            wireframe: THREE.MeshBasicMaterial };

        platform.lightTypes = {
            area: THREE.AreaLight,
            ambient: THREE.AmbientLight,
            directional: THREE.DirectionalLight,
            point: THREE.PointLight,
            hemisphere: THREE.HemisphereLight,
            spot: THREE.SpotLight };

        platform.tags = {
            SCENE: function SCENE(node) {
                var scene = new THREE.Scene();
                if (node.properties.camera) scene.add(node.properties.camera);
                return scene;
            },

            OBJECT: function OBJECT(node) {
                return new THREE.Object3D();
            },

            MESH: function MESH(node) {
                var geometry = node.properties.geometry;
                var material = node.properties.material;
                return new THREE.Mesh(geometry, material);
            },

            GEOMETRY: function GEOMETRY(node) {
                var geometry;
                switch (node.properties.type.toLowerCase()) {
                    case "cube":
                        var size = node.properties.size || 1;
                        geometry = new THREE.BoxGeometry(size, size, size);
                        break;
                    case "sphere":
                        var radius = node.properties.radius || 1;
                        geometry = new THREE.SphereGeometry(radius);
                        break;
                    case "plane":
                        var size = node.properties.size || 1;
                        geometry = new THREE.PlaneGeometry(size, size);
                        break;
                }

                return geometry;
            },

            MATERIAL: function MATERIAL(node) {
                var props = {};

                r3.tags.MATERIAL.props.forEach(function (prop) {
                    if (node.properties[prop] !== undefined) props[prop] = node.properties[prop];
                });

                var type = node.properties.type.toLowerCase();
                if (type == "wireframe") props.wireframe = true;

                var materialClass = platform.materialTypes[type];
                if (!materialClass) throw "Could not find material type " + type;

                return new materialClass(props);
            },

            CAMERA: function CAMERA(node) {
                if (node.properties.type == "orthographic") {
                    return new THREE.OrthographicCamera();
                } else {
                    return new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                }
            },

            LIGHT: function LIGHT(node) {
                var type = node.properties.type.toLowerCase();
                var lightClass = platform.lightTypes[type];
                if (!lightClass) throw "Could not find light type " + type;

                return new lightClass(node.properties.color, node.properties.intensity, node.properties.distance)
                // for (var key in props)
                // light[key] = props[key]
                ;
            }
        };

        module.exports = platform;
        r3.platform = platform;
        window.r3 = r3;
    }, { "../../engine/index": 1 }] }, {}, [26]);
// Proposed for ES6
// An array of unkeyed item indices