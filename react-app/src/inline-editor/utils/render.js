import {mermaidRender} from '../render/mermaid'
import {hljsRender} from '../render/hljs'
import {parse, htmlEncode}  from '../utils/inlineDecorator'
import {create, all} from 'mathjs'

const API_SERVER=process.env.REACT_APP_API_SERVER

export const Render = (no, text) => {
  // TODO: sanitize!!
  if(isBlock(text)){
    let lines = getLines(text);
    let firstLine = lines[0];
    let lastPart = lines.slice(1);
    let parts = firstLine.split(/\s+/);

    let ret = "";
    if(parts[0] === ">>"){
      switch(parts[1]){
        case "calc":
          const math = create(all, {})
          const scope = {}
          ret += "<span class='mode'>&gt;&gt; calc</span>";
          lastPart.forEach((line) => {
            try{
            ret += "<div>" + line + '</div><div style="font-size:small;margin-left:1em;;background-color:#ddd;">&raquo; ' + math.evaluate(line, scope) + "</div>";
            }catch(e){
              // TODO: catch
            }
          })
        break;
        case "pre":
          ret += "<span class='mode'>&gt;&gt; pre</span>";
          ret += "<pre>" + lastPart.join("\n") + "</pre>";
        break;
        case "mermaid":
          ret += "<span class='mode'>&gt;&gt; mermaid</span>";
          ret += mermaidRender(no, lastPart);
        break;
        case "code":
          ret += "<span class='mode'>&gt;&gt; code</span>";
          console.log("CODE PART",lastPart);
          ret += hljsRender(no, lastPart);
        break;
        case "img":
          ret += '<img src="'+
            API_SERVER + '/img/' + lastPart + '">'
        break;
        default:
          ret += "<pre>" + text + "</pre>";
      }
    }else{
      ret += "<pre>" + text + "</pre>";
    }
    return ret;
  }else{
    if(text.indexOf("###") === 0){
      return "<div>" + text + "<div>"
    }else if(text.indexOf("##") === 0){
      return "<div>" + text + "<div>"
    }else if(text.indexOf("#") === 0){
      return "<div>" + text + "<div>"
    }
    return "<div>"+htmlEncode(parse(text))+"</div>"
  }
}

export const isBlock = (text) => {
  return text.indexOf(">>") === 0
}

// sのindex番目がx,yで何番目か調べる
export const getCursorPos = (index, text) => {
  var list = text.split(/[\r\n]/);
  var pos = 0;
  var i;
  for(i = 0; i < list.length; i ++){
    pos += list[i].length + 1;
    if(pos > index){
      // X, Y
      return [index - (pos - list[i].length - 1), i]
    }
  }
  console.log("error getPos")
}
export const getLines = (text) => {
  var list = text.split(/[\r\n]/);
  return list;
}

export const numLines = (s) => {
  return s.split(/[\r\n]/).length
}

