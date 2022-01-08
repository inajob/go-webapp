// render-svg.js
var rb = require("./render-base.js")

// レンダラ
// SVGを簡単に使うために利用
var RendererSVG = function(fonts){
  this.size = 800; // TODO: default
  this.fonts = fonts;
  this.patternCanv = [];  // パターン塗りつぶし用キャンバス
  this.ctxTmp = null;       // 待避用ctx
  this.ctxId = 0;
  this.imgCache = {};  // 画像のキャッシュ
  this.svgData = []
  this.lineWidth = 1/200;
  this.fillStyle = "transparent";
  this.strokeStyle = "black";
  this.fontName = "";
  this.lastPoint = [0,0];
  this.clipPathId = null;
};
RendererSVG.prototype = {
  afX:function(x,y){return this.affine.calc(parseFloat(x), parseFloat(y))[0];},
  afY:function(x,y){return this.affine.calc(parseFloat(x), parseFloat(y))[1];},
  dist:function(x,y){return Math.sqrt(x*x + y*y)},
  theta:function(theta){return Math.PI * theta},
  skew:function(theta,theta2){
    theta = this.theta(parseFloat(theta));
    theta2 = this.theta(parseFloat(theta2));
    this.affine.mul(new rb.Affine(1,Math.tan(theta),0, Math.tan(theta2),1,0, 0,0,1));
  },
  scale:function(x,y){
    this.affine.mul(new rb.Affine(parseFloat(x),0,0, 0,parseFloat(y),0, 0,0,1));
  },
  shift:function(x,y){
    this.affine.mul(new rb.Affine(1,0,parseFloat(x), 0,1,parseFloat(y), 0,0,1));  // shift
  },
  rotate:function(theta){
    theta = this.theta(parseFloat(theta));
    this.affine.mul(new rb.Affine(Math.cos(theta),-Math.sin(theta),0,
      Math.sin(theta), Math.cos(theta),0,
      0,0,1));  // rotate
  },

  save:function(){
    //this.ctx.save();
    this.stack.push(
      {
        affine: this.affine.clone(),
        lineWidth: this.lineWidth,
        fillStyle: this.fillStyle,
        strokeStyle: this.strokeStyle,
        fontName: this.fontName,
      });
  },
  restore:function(){
    let state = this.stack.pop();
    this.affine = state.affine;
    this.lineWidth = state.lineWidth;
    this.fillStyle = state.fillStyle;
    this.strokeStyle = state.strokeStyle;
    this.fontName = state.fontName;
    //this.ctx.restore();
  },
  beginPath:function(){
    //this.ctx.beginPath();
    this.pathData = []
  },
  lineTo:function(x,y){
    //this.ctx.lineTo(this.afX(x,y), this.afY(x,y));
    let mode = "L";
    if(this.pathData.length === 0){
      mode = "M"
    }
    this.pathData = this.pathData.concat([mode, this.afX(x, y), this.afY(x, y)])
    this.lastPoint = [this.afX(x, y), this.afY(x, y)];
  },
  path: function(){
    this.pathData = this.pathData.concat(Array.prototype.slice.apply(arguments))
  },
  quadTo:function(x,y,x2,y2){
    //this.ctx.quadraticCurveTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2));
    this.pathData = this.pathData.concat(["Q", this.afX(x, y), this.afY(x, y), this.afX(x2, y2), this.afY(x2, y2)])
    this.lastPoint = [this.afX(x2, y2), this.afY(x2, y2)];
  },
  arcTo:function(x,y,x2,y2,r){
    var tx = this.affine.data[0][0];
    var ty = this.affine.data[1][1];
    var d = r * Math.sqrt(tx*tx + ty*ty);
    //this.ctx.arcTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2), d);
    // this.lastPoint
    var p0 = this.lastPoint;
    var p1 = [this.afX(x, y), this.afY(x, y)];
    var p2 = [this.afX(x2,y2), this.afY(x2, y2)];
    var d01 = Math.sqrt((p1[0] - p0[0])*(p1[0] - p0[0]) + (p1[1] - p0[1])*(p1[1] - p0[1]));
    var d12 = Math.sqrt((p1[0] - p2[0])*(p1[0] - p2[0]) + (p1[1] - p2[1])*(p1[1] - p2[1]));
    var p1a = [
      p0[0] + (p1[0] - p0[0]) * ((d01 - d) / d01),
      p0[1] + (p1[1] - p0[1]) * ((d01 - d) / d01),
    ];
    var p2a = [
      p2[0] + (p1[0] - p2[0]) * ((d12 - d) / d12),
      p2[1] + (p1[1] - p2[1]) * ((d12 - d) / d12),
    ];

    /*
      for SVG arc
      Move To p0
      LineTo  p1a
      ArcTo   p2a (p1は通らない）
      LineTo  p2
    */
    /*
    this.svgData.push('<circle cx="' + p1[0] + '" cy="' + p1[1] + '" r="0.03" fill="black" />')
    this.svgData.push('<circle cx="' + p2[0] + '" cy="' + p2[1] + '" r="0.03" fill="gray" />')
    this.svgData.push('<circle cx="' + p1a[0] + '" cy="' + p1a[1] + '" r="0.03" fill="blue" />')
    this.svgData.push('<circle cx="' + p2a[0] + '" cy="' + p2a[1] + '" r="0.03" fill="orange" />')
    */
    this.pathData = this.pathData.concat(["L", p1a[0], p1a[1], "A", d, d, 0, 0, 1, p2a[0], p2a[1], "L", p2[0], p2[1]])

    // simple line
    //this.pathData = this.pathData.concat(["L", this.afX(x, y), this.afY(x, y), "L", this.afX(x2, y2), this.afY(x2, y2)])

    this.lastPoint = [this.afX(x2, y2), this.afY(x2, y2)];
  },
  bezierTo:function(x,y,x2,y2,x3,y3){
    this.ctx.bezierCurveTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2), this.afX(x3,y3), this.afY(x3,y3));
    this.lastPoint = [this.afX(x3, y3), this.afY(x3, y3)];
  },
  moveTo:function(x,y){
    //this.ctx.moveTo(this.afX(x,y), this.afY(x,y));
    this.pathData = this.pathData.concat(["M", this.afX(x, y), this.afY(x, y)])
    this.lastPoint = [this.afX(x, y), this.afY(x, y)];
  },
  closePath:function(){
    //this.ctx.closePath();
    this.pathData = this.pathData.concat(["Z"])
  },
  fill:function(){
    //this.ctx.fill();
    let clipPath = "";
    if(this.clipPathId){
      clipPath = ' clip-path="url(#' + this.clipPathId + ')" '
    }

    //this.svgData.push('<path d="' + this.pathData.join(" ") + '" fill="black" />')
    this.svgData.push('<path d="' + this.pathData.join(" ") + '" stroke="none" fill="' + this.fillStyle + '"'+ clipPath+' />')
  },
  stroke:function(){
    //this.ctx.stroke();
    let clipPath = "";
    if(this.clipPathId){
      clipPath = ' clip-path="url(#' + this.clipPathId + ')" '
    }
    this.svgData.push('<path d="' + this.pathData.join(" ") + '" stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" stroke-linejoin="round"  fill="none"' + clipPath + '/>')
  },
  clip:function(){
    //this.ctx.save();
    //this.ctx.clip();
    let id = "clip-" + Math.floor(Math.random()*1000)
    this.svgData.push('<clipPath id="' + id + '"><path d="' + this.pathData.join(" ") + '" /></clipPath>');
    this.clipPathId = id
  },
  resetClip:function(){
    //this.ctx.restore();
    this.clipPathId = null;
  },

  affine:function(m11, m12, m21, m22, dx, dy){this.ctx.save();this.ctx.transform(m11, m12, m21, m22, dx, dy);},
  resetAffine:function(){this.ctx.restore();},

  fillText:function(text){
    /*
    this.ctx.save();
    this.ctx.transform(
      this.affine.data[0][0], this.affine.data[1][0],
      this.affine.data[0][1], this.affine.data[1][1],
      this.affine.data[0][2], this.affine.data[1][2]
    );

    var m = this.ctx.measureText(text);
    this.ctx.fillText(text, -m.width / 2, 0);
    this.ctx.restore();
    */
    //let t = []
    //for(let i = 0; i < text.length; i ++){
    //  t.push("&#" + text.charCodeAt(i) + ";");
    //}
    //console.log("fillText", t)

    let fontNameWithQuote = "'" + this.fontName + "'"
    this.svgData.push('<text ' +
      'text-anchor="middle" ' +
      'dominant-baseline="central" ' +
      'stroke="none" ' +
      'fill="' + this.fillStyle + '" ' +
      'font-family="' + fontNameWithQuote + '" ' +
      'font-size="12px" ' +
      'transform="matrix(' +
      this.affine.data[0][0] + ',' + this.affine.data[1][0] + ',' +
      this.affine.data[0][1] + ',' + this.affine.data[1][1] + ',' +
      this.affine.data[0][2] + ',' + this.affine.data[1][2] +
      ')">' +
      //t.join("") +
      text + 
      '</text>');
  },
  strokeText:function(text){
    //this.ctx.save();
    //this.ctx.transform(
    //  this.affine.data[0][0], this.affine.data[1][0],
    //  this.affine.data[0][1], this.affine.data[1][1],
    //  this.affine.data[0][2], this.affine.data[1][2]
    //);
    //var m = this.ctx.measureText(text);
    //this.ctx.strokeText(text, -m.width / 2, 0);
    //this.ctx.restore();
    let fontNameWithQuote = "'" + this.fontName + "'"
    this.svgData.push(
      '<g ' +
      'transform="matrix(' +
      this.affine.data[0][0] + ',' + this.affine.data[1][0] + ',' +
      this.affine.data[0][1] + ',' + this.affine.data[1][1] + ',' +
      this.affine.data[0][2] + ',' + this.affine.data[1][2] +
      ')" ' +
      '>' +
      '<text ' +
      'text-anchor="middle" ' +
      'dominant-baseline="central" ' +
      'stroke="' + this.strokeStyle + '" ' +
      'stroke-width="' + this.lineWidth + '" ' +
      'fill="none" ' +
      'font-family="' + fontNameWithQuote + '" ' +
      'font-size="12px" ' +
      '>' +
      text +
      '</text></g>');
  },
  blur:function(s){this.ctx.shadowBlur = s * this.size /400;},
  bs:function(s){this.ctx.shadowColor = s;},
  fs:function(s){
    //this.ctx.fillStyle = s;
    this.fillStyle = s;
  },
  ss:function(s){
    //this.ctx.strokeStyle = s;
    this.strokeStyle = s;
  },
  dlw:function(s){this.ctx.lineWidth = this.affine.scale()* s/200;},
  lw:function(s){
    //this.ctx.lineWidth = s/200;
    this.lineWidth = s/200;
  },
  font:function(s){
    this.fonts.add(s);
    //this.ctx.font = "12px '"+s+"'";
    this.fontName = s
    console.log("FONT", this.font)
  }, // todo: スペースがあれば削る？
  radialGrad:function(x0,y0,r0,x1,y1,r1){this.grad = this.ctx.createRadialGradient(this.afX(x0,y0),this.afY(x0,y0),r0,this.afX(x1,y1),this.afY(x1,y1),r1)},  // 楕円変形がデキないので辛い
  linearGrad:function(x0,y0,x1,y1){this.grad = this.ctx.createLinearGradient(this.afX(x0,y0),this.afY(x0,y0),this.afX(x1,y1), this.afY(x1,y1))},
  cs:function(pos, col){this.grad.addColorStop(pos,col);},
  fsGrad:function(){this.ctx.fillStyle = this.grad;},
  ssGrad:function(){this.ctx.strokeStyle = this.grad;},
  createImage:function(id,w, h){
    id = parseInt(id);
    w = parseInt(w);
    h = parseInt(h);
    this.patternCanv[id] = document.createElement('canvas');
    this.patternCanv[id].width = w;
    this.patternCanv[id].height = h;


    //console.log("create image " + id + ' ' + this.patternCanv[id]);
  },
  setTarget:function(id){
    id = parseInt(id);
    if(id === 0){
      // デフォルトCanvasのコンテキストに戻す
      this.ctx = this.ctxTmp;
    }else{
      // デフォルトCanvasのコンテキストを待避
      if(this.ctxId === 0){
        this.ctxTmp = this.ctx;
      }
      //console.log("set target " + id + ' ' + this.patternCanv[id]);
      this.ctx = this.patternCanv[id].getContext('2d');
      var size = this.patternCanv[id].width;
      this.ctx.setTransform(size/2 , 0, 0, size/2, size/2, size/2);
      this.ctx.clearRect(-1,-1,4,4);
      this.ctx.fillStyle = "transparent";
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = 0.005;
      this.ctx.lineJoin = "miter";
      this.ctx.miterLimit = 10;
      this.ctx.textBaseline = "middle";
      this.ctx.font = "18px '"+ this.fontName +"'";
    }
    this.ctxId = id;
  },
  /*
    fsPattern:function(id, rep){
      id = parseInt(id);
      var pattern = this.ctx.createPattern(this.patternCanv[id], rep);
      this.ctx.fillStyle = pattern;
    },
    */
  drawImage:function(id){
    id = parseInt(id);
    this.ctx.save();
    this.ctx.transform(
      this.affine.data[0][0], this.affine.data[1][0],
      this.affine.data[0][1], this.affine.data[1][1],
      this.affine.data[0][2], this.affine.data[1][2]
    );
    this.ctx.drawImage(this.patternCanv[id], -this.patternCanv[id].width/2, -this.patternCanv[id].height/2);
    this.ctx.restore();
  },
  drawExtImage:function(url){
    this.ctx.save();
    this.scale(0.001, 0.001);
    this.ctx.transform(
      this.affine.data[0][0], this.affine.data[1][0],
      this.affine.data[0][1], this.affine.data[1][1],
      this.affine.data[0][2], this.affine.data[1][2]
    );
    var img = new Image();
    if(this.imgCache[url]){
      img = this.imgCache[url];
    }else{
      img.src = '../imgproxy.php?url=' + encodeURIComponent(url);
      this.imgCache[url] = img;
    }
    this.ctx.drawImage(img, -img.width/2, -img.height/2);
    this.ctx.restore();

    this.ctx.save();
    this.shift(0, img.height/2);
    this.strokeText(url);
    this.fillText(url);
    this.ctx.restore();

  },

  render: function(o, width,height){
    if(!height)height = width;
    var size = Math.max(width,height);
    var target;
    //var j;
    this.size = size;
    // 座標変換
    //this.ctx.setTransform(size/2 , 0, 0, size/2, width/2, height/2);
    //this.ctx.clearRect(-1,-1,4,4);
    //this.ctx.fillStyle = "transparent";
    //this.ctx.strokeStyle = "black";
    //this.ctx.lineWidth = 0.005;
    //this.ctx.lineJoin = "miter";
    //this.ctx.miterLimit = 10;
    //this.ctx.textBaseline = "middle";
    this.fontName = "Sans-Serif";
    //this.ctx.font = "18px '"+ this.fontName +"'";

    this.affine = new rb.Affine();
    this.stack = [];

    for(var i = 0; i < o.length; i ++){
      target = o[i];
      if(!o[i])continue;
      if(this[o[i][0]]){
        this[o[i][0]].apply(this, target.slice(1));
      }else{
        console.log("unknown method [" + o[i][0] + "]");
      }
    }
  }
};
module.exports = {
  RendererSVG: RendererSVG,
}
