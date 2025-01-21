////////////////////////////////////
//
//  Created and edited from KLE's render.js
//
//  https://git@github.com/ijprest/keyboard-layout-editor/blob/master/render.js
//
////////////////////////////////////

const KLE = {
  // Return an object with all information needed to render a key.
  calc: null,
};

(function() {
  "use strict";

  // Some predefined sizes for our caps:
  // - unit == size of 1 unit, e.g., 0.75", or 19.05mm is standard
  // - keySpacing == distance from edge of unit-square to keycap, e.g., (0.75" - 0.715")/2 (for DCS)
  // - bevelMargin == distance from edge of keycap (at bottom) to edge of keycap (at top), e.g., (0.715" - 0.470")/2 (for DCS)
  // - padding == distance between text & edge of keycap
  // - strokeWidth == thickness of the outline strokes
  // - roundInner/roundOuter == corner roundness for inner/outer borders
  var unitSizes = {
    px : {
      unit : 64,
      strokeWidth: 1,
      "" : { profile: "" , keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 3, bevelOffsetBottom: 3, padding: 3, roundOuter: 5, roundInner: 3 },
      "DCS" : { profile: "DCS", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 3, bevelOffsetBottom: 3, padding: 3, roundOuter: 5, roundInner: 3 },
      "DSA" : { profile: "DSA", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 0, bevelOffsetBottom: 0, padding: 3, roundOuter: 5, roundInner: 8 },
      "SA" :  { profile: "SA", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 2, bevelOffsetBottom: 2, padding: 3, roundOuter: 5, roundInner: 5 },
      "CHICKLET" :  { profile: "CHICKLET", keySpacing: 3, bevelMargin: 1, bevelOffsetTop: 0, bevelOffsetBottom: 2, padding: 4, roundOuter: 4, roundInner: 4 },
      "FLAT" : { profile: "FLAT" , keySpacing: 1, bevelMargin: 1, bevelOffsetTop: 0, bevelOffsetBottom: 0, padding: 4, roundOuter: 5, roundInner: 3 },
    },
    mm : {
      unit: 19.05,
      strokeWidth: 0.20,
      "" : {  profile: "" , keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
      "DCS" : {  profile: "DCS", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
      "DSA" : {  profile: "DSA", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
      "SA" : {  profile: "SA", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
      "CHICKLET" : {  profile: "CHICKLET", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
      "FLAT" : {  profile: "FLAT" , keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
    }
  };
  ["px","mm"].forEach(function(unit) {
    ["","DCS","DSA","SA","CHICKLET","FLAT"].forEach(function(profile) {
      unitSizes[unit][profile].unit = unitSizes[unit].unit;
      unitSizes[unit][profile].strokeWidth = unitSizes[unit].strokeWidth;
    });
    unitSizes[unit].OEM = unitSizes[unit].DCS; // same, for now
  });

  function getProfile(key) {
    return (/\b(SA|DSA|DCS|OEM|CHICKLET|FLAT)\b/.exec(key.profile) || [""])[0];
  }

  function getRenderParms(key, sizes) {
    var parms = {};

    parms.jShaped = (key.width !== key.width2) || (key.height !== key.height2) || key.x2 || key.y2;

    // Overall dimensions of the unit square(s) that the cap occupies
    parms.capwidth   = sizes.unit * key.width;
    parms.capheight  = sizes.unit * key.height;
    parms.capx       = sizes.unit * key.x;
    parms.capy       = sizes.unit * key.y;
    if(parms.jShaped) {
      parms.capwidth2  = sizes.unit * key.width2;
      parms.capheight2 = sizes.unit * key.height2;
      parms.capx2      = sizes.unit * (key.x + key.x2);
      parms.capy2      = sizes.unit * (key.y + key.y2);
    }

    // Dimensions of the outer part of the cap
    parms.outercapwidth   = parms.capwidth   - sizes.keySpacing*2;
    parms.outercapheight  = parms.capheight  - sizes.keySpacing*2;
    parms.outercapx       = parms.capx       + sizes.keySpacing;
    parms.outercapy       = parms.capy       + sizes.keySpacing;
    if(parms.jShaped) {
      parms.outercapy2      = parms.capy2      + sizes.keySpacing;
      parms.outercapx2      = parms.capx2      + sizes.keySpacing;
      parms.outercapwidth2  = parms.capwidth2  - sizes.keySpacing*2;
      parms.outercapheight2 = parms.capheight2 - sizes.keySpacing*2;
    }

    // Dimensions of the top of the cap
    parms.innercapwidth   = parms.outercapwidth   - sizes.bevelMargin*2;
    parms.innercapheight  = parms.outercapheight  - sizes.bevelMargin*2 - (sizes.bevelOffsetBottom-sizes.bevelOffsetTop);
    parms.innercapx       = parms.outercapx       + sizes.bevelMargin;
    parms.innercapy       = parms.outercapy       + sizes.bevelMargin - sizes.bevelOffsetTop;
    if(parms.jShaped) {
      parms.innercapwidth2  = parms.outercapwidth2  - sizes.bevelMargin*2;
      parms.innercapheight2 = parms.outercapheight2 - sizes.bevelMargin*2;
      parms.innercapx2      = parms.outercapx2      + sizes.bevelMargin;
      parms.innercapy2      = parms.outercapy2      + sizes.bevelMargin - sizes.bevelOffsetTop;
    }

    // Dimensions of the text part of the cap
    parms.textcapwidth   = parms.innercapwidth   - sizes.padding*2;
    parms.textcapheight  = parms.innercapheight  - sizes.padding*2;
    parms.textcapx       = parms.innercapx       + sizes.padding;
    parms.textcapy       = parms.innercapy       + sizes.padding;

    parms.darkColor = key.color;

    // Rotation matrix about the origin
    parms.origin_x = sizes.unit * key.rotation_x;
    parms.origin_y = sizes.unit * key.rotation_y;
    var mat = Math.transMatrix(parms.origin_x, parms.origin_y).mult(Math.rotMatrix(key.rotation_angle)).mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));

    // Construct the *eight* corner points, transform them, and determine the transformed bbox.
    parms.rect = { x:parms.capx, y:parms.capy, w:parms.capwidth, h:parms.capheight, x2:parms.capx+parms.capwidth, y2:parms.capy+parms.capheight };
    parms.rect2 = parms.jShaped ? { x:parms.capx2, y:parms.capy2, w:parms.capwidth2, h:parms.capheight2, x2:parms.capx2+parms.capwidth2, y2:parms.capy2+parms.capheight2 } : parms.rect;
    parms.bbox = { x:9999999, y:9999999, x2:-9999999, y2:-9999999 };
    var corners = [
      {x:parms.rect.x, y:parms.rect.y},
      {x:parms.rect.x, y:parms.rect.y2},
      {x:parms.rect.x2, y:parms.rect.y},
      {x:parms.rect.x2, y:parms.rect.y2}
    ];
    if(parms.jShaped) corners.push(
      {x:parms.rect2.x, y:parms.rect2.y},
      {x:parms.rect2.x, y:parms.rect2.y2},
      {x:parms.rect2.x2, y:parms.rect2.y},
      {x:parms.rect2.x2, y:parms.rect2.y2}
    );
    for(var i = 0; i < corners.length; ++i) {
      corners[i] = mat.transformPt(corners[i]);
      parms.bbox.x = Math.min(parms.bbox.x, corners[i].x);
      parms.bbox.y = Math.min(parms.bbox.y, corners[i].y);
      parms.bbox.x2 = Math.max(parms.bbox.x2, corners[i].x);
      parms.bbox.y2 = Math.max(parms.bbox.y2, corners[i].y);
    }
    parms.bbox.w = parms.bbox.x2 - parms.bbox.x;
    parms.bbox.h = parms.bbox.y2 - parms.bbox.y;

    return parms;
  }

  // Given a key, generate the object needed to render it
  KLE.calc = function(key) {
    var sizes = unitSizes.px[getProfile(key)]; // always in pixels
    var parms = getRenderParms(key, sizes);

    // Update the rects & bounding-box of the key (for click-selection purposes)
    key.rect = parms.rect;
    key.rect2 = parms.rect2;
    key.bbox = parms.bbox;

    // Keep an inverse transformation matrix so that we can transform mouse coordinates into key-space.
    key.mat = Math.transMatrix(parms.origin_x, parms.origin_y).mult(Math.rotMatrix(-key.rotation_angle)).mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));

    // Determine the location of the rotation crosshairs for the key
    key.crosshairs = "none";
    if(key.rotation_x || key.rotation_y || key.rotation_angle) {
      key.crosshairs_x = parms.origin_x;
      key.crosshairs_y = parms.origin_y;
      key.crosshairs = "block";
    }

    // Generate the HTML
    return {
      key: key,
      sizes: sizes,
      parms: parms,
    };
  };

  ////////////////////////////////////
  //
  //  KLE's compatibility layer.
  //
  ////////////////////////////////////

  // Extend string objects with a simple String.format() function
  if(!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/\{(\d+)\}/g, function(match, number) { 
        return typeof args[number] !== 'undefined' ? args[number] : match;
      });
    };
  }

  // Extend string objects with trimStart(), trimEnd(), and trim() functions.
  if(!String.prototype.trimStart) {
    String.prototype.trimStart = function() { return this.replace(/^\s\s*/, ''); };
  }
  if(!String.prototype.trimEnd) {
    String.prototype.trimEnd = function() { return this.replace(/\s\s*$/, ''); };
  }
  if(!String.prototype.trim) {
    String.prototype.trim = function() { this.trimStart().trimEnd(); };
  }


  // a c e
  // b d f
  // 0 0 1
  function Matrix(a,b,c,d,e,f) { this.a = a || 1; this.b = b || 0; this.c = c || 0; this.d = d || 1; this.e = e || 0; this.f = f || 0; }
  Matrix.prototype.mult = function(Y) {
    return new Matrix(this.a*Y.a + this.c*Y.b, this.b*Y.a + this.d*Y.b, this.a*Y.c + this.c*Y.d, this.b*Y.c + this.d*Y.d, this.a*Y.e + this.c*Y.f + this.e, this.b*Y.e + this.d*Y.f + this.f);                                    
  };
  Matrix.prototype.transformPt = function(pt) {
    return { x: this.a*pt.x + this.c*pt.y + this.e, y: this.b*pt.x + this.d*pt.y + this.f };
  };
  Math.Matrix = function(a,b,c,d,e,f) { return new Matrix(a,b,c,d,e,f); }
  Math.transMatrix = function(x,y) {
    return new Matrix(1, 0, 0, 1, x, y);
  }
  Math.rotMatrix = function(angleInDegrees) {
    var angleInRad = (angleInDegrees*Math.PI/180.0);
    var cos = Math.cos(angleInRad), sin = Math.sin(angleInRad);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  };


  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }

  // Extend array objects with a last() function that returns the last element 
  // in the array.
  if(!Array.prototype.last) {
    Array.prototype.last = function() {
      return this[this.length-1];
    };
  }

  // Extend array objects with a remove() function that removes elements
  // by value; from: http://stackoverflow.com/questions/3954438
  Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  // Polyfill for HTMLCanvasElement.toBlob, which is currently only available on Firefox
  if (typeof(HTMLCanvasElement) !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (callback, type, quality) {
        var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
            len = binStr.length,
            arr = new Uint8Array(len);
        for (var i=0; i<len; i++ ) {
          arr[i] = binStr.charCodeAt(i);
        }
        callback( new Blob( [arr], {type: type || 'image/png'} ) );
      }
    });
  }

  ////////////////////////////////////
  //
  //  KLE's Serializer + Deserializer.
  //
  ////////////////////////////////////
  "use strict";

  // Helper to copy an object; doesn't handle loops/circular refs, etc.
  function copy(o) {
    if (typeof(o) !== 'object') {
      // primitive value
      return o;
    } else if (o instanceof Array) {
      // array
      var result = [];
      for (var i = 0; i < o.length; i++) {
        result[i] = copy(o[i]);
      }
      return result;
    } else {
      // Object
      var result = {};
      for (var prop in o) {
        result[prop] = copy(o[prop]);
      }
      return result;
    }
  }
  function isEmptyObject(o) {
    for(var prop in o)
      return false;
    return true;
  }
  function extend(target, source) {
    target = target || {};
    for (var prop in source) {
      if (typeof source[prop] === 'object') {
        target[prop] = extend(target[prop], source[prop]);
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }
  // Map from serialized label position to normalized position,
  // depending on the alignment flags.
  var labelMap = [
    //0  1  2  3  4  5  6  7  8  9 10 11   // align flags
    [ 0, 6, 2, 8, 9,11, 3, 5, 1, 4, 7,10], // 0 = no centering
    [ 1, 7,-1,-1, 9,11, 4,-1,-1,-1,-1,10], // 1 = center x
    [ 3,-1, 5,-1, 9,11,-1,-1, 4,-1,-1,10], // 2 = center y
    [ 4,-1,-1,-1, 9,11,-1,-1,-1,-1,-1,10], // 3 = center x & y
    [ 0, 6, 2, 8,10,-1, 3, 5, 1, 4, 7,-1], // 4 = center front (default)
    [ 1, 7,-1,-1,10,-1, 4,-1,-1,-1,-1,-1], // 5 = center front & x
    [ 3,-1, 5,-1,10,-1,-1,-1, 4,-1,-1,-1], // 6 = center front & y
    [ 4,-1,-1,-1,10,-1,-1,-1,-1,-1,-1,-1], // 7 = center front & x & y
  ];
  var disallowedAlignmentForLabels = [
    [1,2,3,5,6,7],	//0
    [2,3,6,7],			//1
    [1,2,3,5,6,7],	//2
    [1,3,5,7],			//3
    [],							//4
    [1,3,5,7],			//5
    [1,2,3,5,6,7],	//6
    [2,3,6,7],			//7
    [1,2,3,5,6,7],	//8
    [4,5,6,7],			//9
    [],							//10
    [4,5,6,7]				//11
  ];

  // function to sort the key array
  KLE.sortKeys = function(keys) {
    keys.sort(function(a,b) {
      return ((a.rotation_angle+360)%360 - (b.rotation_angle+360)%360) ||
        (a.rotation_x - b.rotation_x) ||
        (a.rotation_y - b.rotation_y) ||
        (a.y - b.y) ||
        (a.x - b.x);
    });
  };

  var _defaultKeyProps = {
    x: 0, y: 0, x2: 0, y2: 0,                         // position
    width: 1, height: 1, width2: 1, height2: 1,       // size
    rotation_angle: 0, rotation_x: 0, rotation_y: 0,  // rotation
    labels:[], textColor: [], textSize: [],           // label properties
    default: { textColor: "#000000", textSize: 3 },   // label defaults
    color: "#cccccc", profile: "", nub: false,        // cap appearance
    ghost: false, stepped: false, decal: false,       // miscellaneous options
    sm: "", sb:"", st:""                              // switch
  };

  var _defaultMetaData = { backcolor: '#eeeeee', name: '', author: '', notes: '', background: undefined, radii: '', switchMount: '', switchBrand: '', switchType: '' };
  KLE.defaultKeyProps = function() { return copy(_defaultKeyProps); };
  KLE.defaultMetaData = function() { return copy(_defaultMetaData); };

  function reorderLabels(key,current) {
    // Possible alignment flags in order of preference (this is fairly
    // arbitrary, but hoped to reduce raw data size).
    var align = [7,5,6,4,3,1,2,0];

    // remove impossible flag combinations
    for(var i = 0; i < key.labels.length; ++i) {
      if(key.labels[i]) {
        align.remove.apply(align, disallowedAlignmentForLabels[i]);
      }
    }

    // For the chosen alignment, generate the label array in the correct order
    var ret = {
      align: align[0],
      labels: ["","","","","","","","","","","",""],
      textColor: ["","","","","","","","","","","",""],
      textSize: []
    };
    for(var i = 0; i < 12; ++i) {
      var ndx = labelMap[ret.align].indexOf(i);
      if(ndx >= 0) {
        if(key.labels[i]) ret.labels[ndx] = key.labels[i];
        if(key.textColor[i]) ret.textColor[ndx] = key.textColor[i];
        if(key.textSize[i]) ret.textSize[ndx] = key.textSize[i];
      }
    }
    // Clean up
    for(var i = 0; i < ret.textSize.length; ++i) {
      if(!ret.labels[i])
        ret.textSize[i] = current.textSize[i];
      if(!ret.textSize[i] || ret.textSize[i] == key.default.textSize)
        ret.textSize[i] = 0;
    }
    return ret;
  }

  function compareTextSizes(current,key,labels) {
    if(typeof(current) === "number")
      current = [current];
    for(var i = 0; i < 12; ++i) {
      if( labels[i] && ((!!current[i] !== !!key[i]) || (current[i] && current[i] !== key[i])) )
        return false;
    }
    return true;
  }

  // Convert between our in-memory format & our serialized format
  function serializeProp(props, nname, val, defval) { if(val !== defval) { props[nname] = val; } return val; }
  KLE.serialize = function(keyboard) {
    var keys = keyboard.keys;
    var rows = [], row = [];
    var current = KLE.defaultKeyProps();
    current.textColor = current.default.textColor;
    current.align = 4;
    var cluster = {r:0, rx:0, ry:0};

    // Serialize metadata
    var meta = {};
    for(var metakey in keyboard.meta) {
      serializeProp(meta, metakey, keyboard.meta[metakey], _defaultMetaData[metakey]);
    }
    if(!isEmptyObject(meta)) {
      rows.push(meta);
    }

    var newRow = true;
    current.y--; // will be incremented on first row

    // Serialize row/key-data
    KLE.sortKeys(keys);
    keys.forEach(function(key) {
      var props = {};
      var ordered = reorderLabels(key,current);

      // start a new row when necessary
      var clusterChanged = (key.rotation_angle != cluster.r || key.rotation_x != cluster.rx || key.rotation_y != cluster.ry);
      var rowChanged = (key.y !== current.y);
      if(row.length>0 && (rowChanged || clusterChanged)) {
        // Push the old row
        rows.push(row);
        row = [];
        newRow = true;
      }

      if(newRow) {
        // Set up for the new row
        current.y++;

        // 'y' is reset if *either* 'rx' or 'ry' are changed
        if(key.rotation_y != cluster.ry || key.rotation_x != cluster.rx)
          current.y = key.rotation_y;
        current.x = key.rotation_x; // always reset x to rx (which defaults to zero)

        // Update current cluster
        cluster.r = key.rotation_angle;
        cluster.rx = key.rotation_x;
        cluster.ry = key.rotation_y;

        newRow = false;
      }

      current.rotation_angle = serializeProp(props, "r", key.rotation_angle, current.rotation_angle);
      current.rotation_x = serializeProp(props, "rx", key.rotation_x, current.rotation_x);
      current.rotation_y = serializeProp(props, "ry", key.rotation_y, current.rotation_y);
      current.y += serializeProp(props, "y", key.y-current.y, 0);
      current.x += serializeProp(props, "x", key.x-current.x, 0) + key.width;
      current.color = serializeProp(props, "c", key.color, current.color);
      if(!ordered.textColor[0]) {
        ordered.textColor[0] = key.default.textColor;
      } else {
        for(var i = 2; i < 12; ++i) {
          if(!ordered.textColor[i] && ordered.textColor[i] !== ordered.textColor[0]) {
            ordered.textColor[i] !== key.default.textColor;
          }
        }
      }
      current.textColor = serializeProp(props, "t", ordered.textColor.join("\n").trimEnd(), current.textColor);
      current.ghost = serializeProp(props, "g", key.ghost, current.ghost);
      current.profile = serializeProp(props, "p", key.profile, current.profile);
      current.sm = serializeProp(props, "sm", key.sm, current.sm);
      current.sb = serializeProp(props, "sb", key.sb, current.sb);
      current.st = serializeProp(props, "st", key.st, current.st);
      current.align = serializeProp(props, "a", ordered.align, current.align);
      current.default.textSize = serializeProp(props, "f", key.default.textSize, current.default.textSize);
      if(props.f) current.textSize = [];
      if(!compareTextSizes(current.textSize, ordered.textSize, ordered.labels)) {
        if(ordered.textSize.length == 0) {
          serializeProp(props, "f", key.default.textSize, -1); // Force 'f' to be written
        } else {
          var optimizeF2 = !ordered.textSize[0];
          for(var i = 2; i < ordered.textSize.length && optimizeF2; ++i) {
            optimizeF2 = (ordered.textSize[i] == ordered.textSize[1]);
          }
          if(optimizeF2) {
            var f2 = ordered.textSize[1];
            current.f2 = serializeProp(props, "f2", f2, -1);
            current.textSize = [0,f2,f2,f2,f2,f2,f2,f2,f2,f2,f2,f2];
          } else {
            current.f2 = undefined;
            current.textSize = serializeProp(props, "fa", ordered.textSize, []);
          }
        }
      }
      serializeProp(props, "w", key.width, 1);
      serializeProp(props, "h", key.height, 1);
      serializeProp(props, "w2", key.width2, key.width);
      serializeProp(props, "h2", key.height2, key.height);
      serializeProp(props, "x2", key.x2, 0);
      serializeProp(props, "y2", key.y2, 0);
      serializeProp(props, "n", key.nub || false, false);
      serializeProp(props, "l", key.stepped || false, false);
      serializeProp(props, "d", key.decal || false, false);
      if(!isEmptyObject(props)) { row.push(props); }
      current.labels = ordered.labels;
      row.push(ordered.labels.join("\n").trimEnd());
    });
    if(row.length>0) {
      rows.push(row);
    }
    return rows;
  };

  function reorderLabelsIn(labels, align, skipdefault) {
    var ret = [];
    for(var i = skipdefault ? 1 : 0; i < labels.length; ++i) {
      ret[labelMap[align][i]] = labels[i];
    }
    return ret;
  }

  KLE.deserialize = function(rows) {
    // Initialize with defaults
    var current = KLE.defaultKeyProps();
    var meta = KLE.defaultMetaData();
    var keys = [];
    var cluster = { x: 0, y: 0 };
    var align = 4;
    for(var r = 0; r < rows.length; ++r) {
      if(rows[r] instanceof Array) {
        for(var k = 0; k < rows[r].length; ++k) {
          var key = rows[r][k];
          if(typeof key === 'string') {
            var newKey = copy(current);
            newKey.width2 = newKey.width2 === 0 ? current.width : current.width2;
            newKey.height2 = newKey.height2 === 0 ? current.height : current.height2;
            newKey.labels = reorderLabelsIn(key.split('\n'), align);
            newKey.textSize = reorderLabelsIn(newKey.textSize, align);

            // Clean up the data
            for(var i = 0; i < 12; ++i) {
              if(!newKey.labels[i]) {
                newKey.textSize[i] = undefined;
                newKey.textColor[i] = undefined;
              }
              if(newKey.textSize[i] == newKey.default.textSize)
                newKey.textSize[i] = undefined;
              if(newKey.textColor[i] == newKey.default.textColor)
                newKey.textColor[i] = undefined;
            }

            // Add the key!
            keys.push(newKey);

            // Set up for the next key
            current.x += current.width;
            current.width = current.height = 1;
            current.x2 = current.y2 = current.width2 = current.height2 = 0;
            current.nub = current.stepped = current.decal = false;

          } else {
            if(key.r != null) { if(k!=0) {deserializeError("'r' can only be used on the first key in a row", key);} current.rotation_angle = key.r; }
            if(key.rx != null) { if(k!=0) {deserializeError("'rx' can only be used on the first key in a row", key);} current.rotation_x = cluster.x = key.rx; extend(current, cluster); }
            if(key.ry != null) { if(k!=0) {deserializeError("ry' can only be used on the first key in a row", key);} current.rotation_y = cluster.y = key.ry; extend(current, cluster); }
            if(key.a != null) { align = key.a; }
            if(key.f) { current.default.textSize = key.f; current.textSize = []; }
            if(key.f2) { for(var i = 1; i < 12; ++i) { current.textSize[i] = key.f2; } }
            if(key.fa) { current.textSize = key.fa; }
            if(key.p) { current.profile = key.p; }
            if(key.c) { current.color = key.c; }
            if(key.t) {
              var split = key.t.split('\n');
              current.default.textColor = split[0];
              current.textColor = reorderLabelsIn(split, align);
            }
            if(key.x) { current.x += key.x; }
            if(key.y) { current.y += key.y; }
            if(key.w) { current.width = current.width2 = key.w; }
            if(key.h) { current.height = current.height2 = key.h; }
            if(key.x2) { current.x2 = key.x2; }
            if(key.y2) { current.y2 = key.y2; }
            if(key.w2) { current.width2 = key.w2; }
            if(key.h2) { current.height2 = key.h2; }
            if(key.n) { current.nub = key.n; }
            if(key.l) { current.stepped = key.l; }
            if(key.d) { current.decal = key.d; }
            if(key.g != null) { current.ghost = key.g; }
            if(key.sm) { current.sm = key.sm; }
            if(key.sb) { current.sb = key.sb; }
            if(key.st) { current.st = key.st; }
          }
        }

        // End of the row
        current.y++;
      } else if(typeof rows[r] === 'object') {
        if(r != 0) { throw "Error: keyboard metadata must the be first element:\n  "+KLE.toJsonL(rows[r]); }
        extend(meta, rows[r]);
      }
      current.x = current.rotation_x;
    }
    return { meta:meta, keys:keys };
  };

  ////////////////////////////////////
  //
  //  Deserialize and convert to kbinfo keylayout
  //
  ////////////////////////////////////
  KLE.deserializeToKeylayout = function(kbinfo, rows) {
    const keylayout = {};
    const deserialized = KLE.deserialize(rows);
    const meta = deserialized.meta;
    const dkeys = deserialized.keys;
    for (let i = 0; i < dkeys.length; i++) {
      const key = dkeys[i];
      let [row, col] = key.labels[0].split(',');
      row = parseInt(row);
      col = parseInt(col);
      key.row = row;
      key.col = col;
      keylayout[row * kbinfo.cols + col] = Object.assign({}, meta, key);
    }
    return keylayout;
  };
})();
