import {mermaidRender} from '../render/mermaid'
import {hljsRender} from '../render/hljs'
import {parse, htmlEncode}  from '../utils/inlineDecorator'
import {previewLine} from '../actions'
import {jsonp}  from './jsonp'
import {create, all} from 'mathjs'

const API_SERVER=process.env.REACT_APP_API_SERVER

function escapeHTML(s){
  return htmlEncode(parse(s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")));
}

export const parseBlock = (text) => {
  if(isBlock(text)){
    let lines = getLines(text);
    let firstLine = lines[0];
    let lastPart = lines.slice(1);
    let parts = firstLine.split(/\s+/);
    if(parts[0] === ">>"){
      return {
        isTyped: true,
        type: parts[1],
        body: lastPart,
      }
    }
    return {
      isTyped: false,
      type: null,
      body: text,
    }
  }
  throw new Error(text + "is not block")
}

export const Render = (name, no, text, dispatch) => {
  // TODO: sanitize!!
  if(isBlock(text)){
    let blockInfo = parseBlock(text)
    let lastPart = blockInfo.body

    let ret = "";
    if(blockInfo.isTyped){
      switch(blockInfo.type){
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
          if(lastPart[0].indexOf("http://")===0 || lastPart[0].indexOf("https://")===0){
            ret += '<img src="' + lastPart[0] + '">'
          }else{
            ret += '<img src="'+
              API_SERVER + '/img/' + lastPart[0] + '">'
          }
        break;
        case "oembed":
          let url = "https://noembed.com/embed";
          var fname = "callback_" + Math.random().toString(36).slice(-8);
          let body = lastPart[0]
          if(body){
            if(body.indexOf("https://twitter.com") !== -1){
              url = "https://api.twitter.com/1/statuses/oembed.json";
            }
            url += "?url="+encodeURIComponent(body.replace(/[\r\n]/g,""))+'&callback=' + fname;
            jsonp(fname, url, function(data){
              var body = '<span class="mode">&gt;&gt; oembed</span><br/>' + data.html;
              dispatch(previewLine(fname, no, body));
              window.twttr.widgets.load() // TODO: global object?
            });
            ret += "oembed..."+body
          }
        break
        case "item":
          ret += "<span class='mode'>&gt;&gt; item</span>";
          ret += '<a href="'+lastPart[0]+'">'
          ret += '<table>'
          ret += '<tr>'
          ret += '<td>'
          ret += '<img src="' + lastPart[1] + '" />'
          ret += '</td>'
          ret += '<td>'
          ret += lastPart[2]
          ret += '</td>'
          ret += '</tr>'
          ret += '</table>'
          ret += '</a>'
        break;
        case "table":
          ret += "<span class='mode'>&gt;&gt; table</span>";
          ret += "<table>";
          lastPart.forEach(function(i){
            ret += "<tr>";
            i.split(",").forEach(function(j){
              ret += "<td>";
              ret += escapeHTML(j);
              ret += "</td>";
            });
            ret += "</tr>";
          });
          ret += "</table>";
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
      return "<div>" + escapeHTML(text) + "<div>"
    }else if(text.indexOf("##") === 0){
      return "<div>" + escapeHTML(text) + "<div>"
    }else if(text.indexOf("#") === 0){
      return "<div>" + escapeHTML(text) + "<div>"
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

