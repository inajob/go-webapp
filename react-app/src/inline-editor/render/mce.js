var MCL = require("./mce3/mcl.js")
var RenderBase = require("./mce3/render-base.js")
var RenderSVG = require("./mce3/render-svg.js")

export function mceRender(text, f){
  var globalTimer = 0;
  var mouseX,mouseY;
  //var fonts = new RenderBase.Fonts();
  //var sources = new Sources();
  // === Prelude ===
  var prelude = (`
!sqrt = \\(n){
  eval("Math","sqrt",n)
};
!sin = \\(n){
  eval("Math","sin",n * 3.1415 * 2)
};
!cos = \\(n){
  eval("Math","cos",n * 3.1415 * 2)
};
!tan = \\(n){
  eval("Math","tan",n * 3.1415 * 2)
};
!atan2 = \\(y,x){
  eval("Math", "atan2", y, x)/(3.1415*2)
};



!floor = \\(n){
  eval("Math","floor",n)
};

!save = \\(){
  write("save");
  evalAllExtArgs();
  write("restore");
};
!lw = \\(size){
  save(){
    write("lw " + size);
    evalAllExtArgs();
  };
};
!blur = \\(size){
  save(){
    write("blur " + size);
    evalAllExtArgs();
  };
};
!bs = \\(c){
  save(){
    write("bs " + c);
    evalAllExtArgs();
  };
};

!fs = \\(c){
  save(){
    write("fs " + c);
    evalAllExtArgs();
  };
};
!ss = \\(c){
  save(){
    write("ss " + c);
    evalAllExtArgs();
  };
};
!col = \\(c){
  save(){
    write("ss " + c);
    write("fs " + c);
    evalAllExtArgs();
  };
};
!ssfs = \\(c1,c2){
  save(){
    write("ss " + c1);
    write("fs " + c2);
    evalAllExtArgs();
  };
};
!cs = \\(pos, col){
  write("cs " + pos + " " + col);
};
!rgrad = \\(x0,y0,r0,x1,y1,r1){
  write("radialGrad " + x0 + " " + y0 + " " + r0 + " " + x1 + " " + y1 + " " + r1);
  evalAllExtArgs();
};
!lgrad = \\(x0,y0,x1,y1){
  write("linearGrad " + x0 + " " + y0 + " " + x1 + " " + y1);
  evalAllExtArgs();
};
!fsgrad = \\(){
  save(){
    evalExtArg(0);
    write("fsGrad");
    block("a"){
      !a = 1;
      loop(extArgsLength() - 1){
        evalExtArg(a);
        !a = a + 1;
      }
    }
  };
};
!ssgrad = \\(){
  save(){
    evalExtArg(0);
    write("ssGrad");
    block("a"){
      !a = 1;
      loop(extArgsLength() - 1){
        evalExtArg(a);
        !a = a + 1;
      }
    }
  };
};
!skew = \\(t,t2){
  save(){
    write("skew " + t + " " + t2);
    evalAllExtArgs();
  };
};

!rotate = \\(t){
  save(){
    write("rotate " + t);
    evalAllExtArgs();
  };
};
!scale = \\(w,h){
  if(not(h)){
    !h = w;
  };
  save(){
    write("scale " + w + " " + h);
    evalAllExtArgs();
  };
};
!shift = \\(x,y){
  save(){
    write("shift " + x + " " + y);
    evalAllExtArgs();
  };
};
!outerFig = 1;
!fig = \\(closed){
  write("beginPath");
  !outerFig = 0;
  evalAllExtArgs();
  !outerFig = 1;
  if(closed){
    write("closePath");
  };
  write("fill");
  write("stroke");
};
!blockClip = \\(closed){
  write("beginPath");
  !outerFig = 0;
  evalExtArg(0);
  !outerFig = 1;
  if(closed){
    write("closePath");
  };
  write("clip");
  evalExtArg(1);
  write("resetClip");
};

!autoFig = \\(){
  if(outerFig){
    write("beginPath");
  };
  evalAllExtArgs();
  if(outerFig){
    write("closePath");
    write("fill");
    write("stroke");
  };
}
!rect = \\(){
  autoFig(){
    write("moveTo -0.5 -0.5");
    write("lineTo 0.5 -0.5");
    write("lineTo 0.5 0.5");
    write("lineTo -0.5 0.5");
  };
};
!rrect = \\(){
  autoFig(){
    write("moveTo -0.5 -0.5");
    write("lineTo -0.5 0.5");
    write("lineTo 0.5 0.5");
    write("lineTo 0.5 -0.5");
  };
};

!xy0 = \\(x,y){
  write("moveTo " + x + " " + y);
}
!xy = \\(x,y){
  write("lineTo " + x + " " + y);
}
!grid = \\(xx,yy){
  block("aa","bb"){
    !aa = 0;
    !bb = 0;
    loop(xx){
      !bb = 0;
      !aa = aa + 1;
      loop(yy){
        !bb = bb + 1;
        shift(aa - xx/2 - 0.5 ,bb - yy/2 - 0.5){
          evalAllExtArgs();
        }
      }
    }
  }
};

!flower = \\(n){
  block("a"){
    !a = 0;
    loop(n){
      rotate(a/n*2){
        evalAllExtArgs();
      }
      !a = a + 1;
    }
  }
}

!text = \\(s){
  scale(0.1){
    write("fillText " + s);
    write("strokeText " + s);
  }
}
!fillText = \\(s){
  write("fillText " + s);
}
!strokeText = \\(s){
  write("strokeText " + s);
}
!rgb = \\(r,g,b){"rgb(" + r + "," + g + "," + b + ")"};
!rgba = \\(rr,gg,bb,aa){"rgba(" + rr + "," + gg + "," + bb + "," + aa + ")"};

!poly = \\(n, p){
 block("ploya"){
   !polya = 0;
   autoFig(0){
    loop(n){
     !polya = polya + 1;
     rotate((polya*p)/n * 2){
      write("lineTo 0 0.5");
     }
    }
   }
 }
};

!apoly = \\(mode,size){
 block("r2","a"){
  scale(0.3){
   !r2 = 1/cos(1/mode/2)
   fig(1){
    !a = 0
    write('moveTo ' + cos(-1/mode/2) + ' ' + sin(-1/mode/2))
    loop(mode){
     write('arcTo' + ' ' + r2*cos((a*2)/mode/2) + ' ' + r2*sin((a*2)/mode/2) + ' ' + cos((a*2+1)/mode/2) + ' ' + sin((a*2+1)/mode/2) + ' ' + size)
     !a = a + 1
    }
   }
  }
 }
}

!font = \\(name){
  save(){
    write("font " + name);
    evalAllExtArgs();
  }
}
!circle = \\(s){
 block("polyq","n","r2"){
  if(not(s)){
    !s = 1;
  }
  scale(s){
   !polya = 0;
   !n = 8;
   !r2 = 0.5/cos(1/n/2);
   autoFig(){
    write('moveTo 0.5 0')
    loop(n){
     !x1 = 0.5 * cos((polya+1) / n);
     !y1 = 0.5 * sin((polya+1) / n);
     !x2 = r2 * cos(polya / n + 1 / n / 2);
     !y2 = r2 * sin(polya / n + 1 / n / 2);

     write("quadTo " + x2 + " " + y2 + " " + x1 + " " + y1);
     !polya = polya + 1;
    }
   }
  }
 }
}

!rcircle = \\(s){
 block("polyq","n","r2"){
  if(not(s)){
    !s = 1;
  }
  scale(s){
   !polya = 0;
   !n = 8;
   !r2 = 0.5/cos(1/n/2);
   autoFig(){
    write('moveTo 0.5 0')
    loop(n){
     !x1 = 0.5 * cos((n-polya-1) / n);
     !y1 = 0.5 * sin((n-polya-1) / n);
     !x2 = r2 * cos((n-polya) / n - 1 / n / 2);
     !y2 = r2 * sin((n-polya) / n - 1 / n / 2);

     write("quadTo " + x2 + " " + y2 + " " + x1 + " " + y1);
     !polya = polya + 1;
    }
   }
  }
 }
}


`);

  var draw=function(s){
      var mcl = new MCL.MCL();
      var mce = new MCL.MCE();
      //mce.externalVar = externalVars;
      mce.createScope();
      mce.bindVariable('t', globalTimer);
      mce.bindVariable('mx', mouseX);
      mce.bindVariable('my', mouseY);

      // concat prelude
      s = prelude + mcl.preProcess(s);
      var out = mcl.parse(s);
      mce.run(out); // TODO: return value is no use
      var sout = mce.out;
      var p = new RenderBase.SimpleParser();
      var r = new RenderSVG.RendererSVG(/*fonts*/ null);
      var rout = p.parse(sout);
      r.render(rout, 400);
      var svgText = '<svg xmlns="http://www.w3.org/2000/svg" width="50%" height="50%" viewBox="-1,-1,2,2">' + r.svgData.join("\n")+ "</svg>"
      return svgText
  }

  f(draw(text));
}
