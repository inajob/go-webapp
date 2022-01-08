// Render言語のとても簡単なパーサ
var SimpleParser = function(){
  this.pathData = [];
};
SimpleParser.prototype = {
  parse: function(s) { 
    var lines = s.split(/[\r\n]+/);
    var ls;
    var out = [];
    for(var i = 0; i < lines.length; i ++){
      ls = lines[i].split(/\s+/);
      out.push(this.proc(ls));
    }
    return out;
  },
  proc : function(t){
    var tmp = [];
    switch(t[0]){
      case 'fillText':
      case 'strokeText':
      case 'font':
        tmp[0] = t[0];
        tmp[1] = t.slice(1).join(" ");
        return tmp;
      case 'scale':
      case 'shift':
      case 'rotate':
      case 'skew':
      case 'blur':
      case 'bs':
      case 'save':
      case 'restore':
      case 'beginPath':
      case 'lineTo':
      case 'quadTo':
      case 'path':
      case 'arcTo':
      case 'bezierTo':
      case 'moveTo':
      case 'closePath':
      case 'fill':
      case 'stroke':
      case 'clip':
      case 'resetClip':
      case 'affine':
      case 'resetAffine':
      case 'fs':
      case 'ss':
      case 'lw':
      case 'dlw':
      case 'radialGrad':
      case 'linearGrad':
      case 'cs':
      case 'fsGrad':
      case 'ssGrad':
      case 'createImage':
      case 'drawImage':
      case 'setTarget':
      case 'drawExtImage':
        //case 'fsPattern':
        return t;
      default:
    }
  }
}


function Affine(){
  this.data=[[1,0,0],[0,1,0],[0,0,1]];
  if(arguments.length === 9){
    this.data = [
      [arguments[0],arguments[1],arguments[2]],
      [arguments[3],arguments[4],arguments[5]],
      [arguments[6],arguments[7],arguments[8]]
    ];
  }else if(arguments.length === 0){
  }else{
    throw new Error("arguments size error");
  }
}

Affine.prototype = {
  mul:function(a){


    var tmp = 0;
    var next = [];
    for(var i = 0; i < 3; i++){
      for(var j = 0; j < 3; j++){
        tmp = 0;
        for(var k = 0; k < 3; k++){
          tmp += this.data[i][k] * a.data[k][j];
          //tmp += a.data[i][k] * this.data[k][j]
        }


        if(next[i] === undefined)next[i] = [];
        next[i].push(tmp);
      }
    }
    this.data = next;

  },
  dist:function(x,y){return Math.sqrt(x*x + y*y)},
  scale:function(){
    return this.dist(this.data[0][0], this.data[1][1])/Math.sqrt(2);
  },
  calc:function(x,y){
    var tmp = 0;
    var ans = [];
    var a = [x, y, 1];
    for(var i = 0; i < 3; i++){
      tmp = 0;
      for(var j = 0; j < 3; j++){
        tmp += this.data[i][j] * a[j]
      }
      ans.push(tmp);
    }
    return ans;
  },
  clone:function(){
    var o = new Affine();
    for(var i = 0; i < 3; i++){
      for(var j = 0; j < 3; j++){
        o.data[i][j] = this.data[i][j]
      }
    }
    return o;
  }
}


// web fontの設定

var WebFontConfig = {
  google: { families: [ 'Tangerine', 'Cantarell' ] },
  custom: { families:[], urls:[]},
  loading:function(){},
  fontloading:function(){},
  fontactivate:function(family,fontDescription){

  },
  fontinacive:function(family,fontDescription){
    //fail
  },
  active:function(){
    // here!! all fonts loaded!
    //alert("loaded");
  },
  inactive:function(){
    //doesnot support webfont
  }
};

// フォントクラス
function Fonts(){
  this.cache = "";
  this.fontScript =null;
  this.fonts=['Yesteryear']; // 何か読み込まないとダメっぽい
  this.local=[];
}
Fonts.prototype={
  add:function(fn){
    if(fn.length===0)return;
    if(fn instanceof Array)return;

    for(var i=0;i<this.fonts.length;i++){
      if(this.fonts[i] === fn)return;
    }
    // ホスティングしているフォントの読み込み
    var localFonts =
      ['TanukiMagic', 'DejimaMincho', 'Hakidame','Mikachan','JiyunoTsubasa','AoyagiReisyoSimo',
        'UmeGothic', 'HanazonoMincho','IPAMincho', 'IPAGothic','RoundM+', 'M+Thin', 'M+Black', 'LogoTypeGothic',
        'Haranyan', 'KokuGothic', 'KokuMincho', 'MagicRing', 'TOA', 'Ikamodoki'
      ];
    var localFlg = false;
    for(let i = 0; i < localFonts.length; i ++){
      if(localFonts[i] === fn){
        localFlg = true;
        break;
      }
    }
    if(localFlg){
      for(let i=0;i<this.local.length;i++){
        if(this.local[i] === fn)return;
      }
      this.local.push(fn);
    }else{
      this.fonts.push(fn);
    }
    this.load();

  },
  load:function(){
    var s = this.fonts.join("\n") + this.local.join('\n');

    if(this.cache === s)return;
    this.cache = s;
    if(this.fontScript!=null){
      this.fontScript.parentNode.removeChild(this.fontScript);
    }
    WebFontConfig.google.families = this.fonts;
    WebFontConfig.custom.families = this.local;
    WebFontConfig.custom.urls = ['css/fonts.css'];

    //WebFont.load(WebFontConfig); // TODO: uncomment
  }
}
module.exports = {
  SimpleParser: SimpleParser,
  Affine: Affine,
}
