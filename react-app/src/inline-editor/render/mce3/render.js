// render.js
var rb = require("./render-base.js")
// レンダラ
// Canvasを簡単に使うために利用
var Renderer = function(ctx, fonts,size){
  this.size = size
  this.ctx = ctx;
  this.fonts = fonts;
  this.patternCanv = [];  // パターン塗りつぶし用キャンバス
  this.ctxTmp = null;       // 待避用ctx
  this.ctxId = 0;
  this.imgCache = {};  // 画像のキャッシュ
};

Renderer.prototype = {
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

  save:function(){this.ctx.save();this.stack.push(this.affine.clone());},
  restore:function(){this.affine = this.stack.pop();this.ctx.restore();},
  beginPath:function(){this.ctx.beginPath();},
  lineTo:function(x,y){this.ctx.lineTo(this.afX(x,y), this.afY(x,y));},
  quadTo:function(x,y,x2,y2){this.ctx.quadraticCurveTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2));},
  arcTo:function(x,y,x2,y2,r){
    var tx = this.affine.data[0][0];
    var ty = this.affine.data[1][1];
    var d = r * Math.sqrt(tx*tx + ty*ty);
    this.ctx.arcTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2), d);
  },
  bezierTo:function(x,y,x2,y2,x3,y3){this.ctx.bezierCurveTo(this.afX(x,y), this.afY(x,y), this.afX(x2,y2), this.afY(x2,y2), this.afX(x3,y3), this.afY(x3,y3));},
  moveTo:function(x,y){this.ctx.moveTo(this.afX(x,y), this.afY(x,y));},
  closePath:function(){this.ctx.closePath();},
  fill:function(){this.ctx.fill();},
  stroke:function(){this.ctx.stroke();},
  clip:function(){this.ctx.save();this.ctx.clip();},
  resetClip:function(){this.ctx.restore();},

  affine:function(m11, m12, m21, m22, dx, dy){this.ctx.save();this.ctx.transform(m11, m12, m21, m22, dx, dy);},
  resetAffine:function(){this.ctx.restore();},

  fillText:function(text){
    this.ctx.save();
    this.ctx.transform(
      this.affine.data[0][0], this.affine.data[1][0],
      this.affine.data[0][1], this.affine.data[1][1],
      this.affine.data[0][2], this.affine.data[1][2]
    );

    var m = this.ctx.measureText(text);
    this.ctx.fillText(text, -m.width / 2, 0);
    this.ctx.restore();
  },
  strokeText:function(text){
    this.ctx.save();
    this.ctx.transform(
      this.affine.data[0][0], this.affine.data[1][0],
      this.affine.data[0][1], this.affine.data[1][1],
      this.affine.data[0][2], this.affine.data[1][2]
    );
    var m = this.ctx.measureText(text);
    this.ctx.strokeText(text, -m.width / 2, 0);
    this.ctx.restore();
  },
  blur:function(s){this.ctx.shadowBlur = s * this.size /400;},
  bs:function(s){this.ctx.shadowColor = s;},
  fs:function(s){this.ctx.fillStyle = s;},
  ss:function(s){this.ctx.strokeStyle = s;},
  dlw:function(s){this.ctx.lineWidth = this.affine.scale()* s/200;},
  lw:function(s){this.ctx.lineWidth = s/200;},
  font:function(s){this.fonts.add(s); this.ctx.font = "12px '"+s+"'";}, // todo: スペースがあれば削る？
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
    if(id == 0){
      // デフォルトCanvasのコンテキストに戻す
      this.ctx = this.ctxTmp;
    }else{
      // デフォルトCanvasのコンテキストを待避
      if(this.ctxId == 0){
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
    var j;
    this.size = size;       
    // 座標変換
    this.ctx.setTransform(size/2 , 0, 0, size/2, width/2, height/2);
    this.ctx.clearRect(-1,-1,4,4);
    this.ctx.fillStyle = "transparent";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 0.005;
    this.ctx.lineJoin = "miter";
    this.ctx.miterLimit = 10;
    this.ctx.textBaseline = "middle";
    this.fontName = "Sans-Serif";
    this.ctx.font = "18px '"+ this.fontName +"'";

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
  Renderer: Renderer,
}
