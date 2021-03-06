import {hljsRender} from '../render/hljs.mjs'
import {parse, htmlEncode}  from '../utils/inlineDecorator.mjs'
import {previewLine} from '../actions/index.mjs'
import {jsonp}  from './jsonp.mjs'
import pkg from 'mathjs'
const {create, all} = pkg

const API_SERVER=process.env.REACT_APP_API_SERVER

function escapeHTML(s, user){
  return htmlEncode(parse(s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")), user);
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

export const Render = (name, no, text, global, dispatch) => {
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
          ret += global.mermaidRender(no, lastPart);
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
        case "grep":
          ret += "<span class='mode'>&gt;&gt; grep</span>";
          ret += "<div>"
          ret += "Query:" + lastPart[0]
          ret += "</div>"
          global.sendSearch(lastPart[0]).then((resp) => {
            resp.json().then((o) => {
              let body = [];
              body.push("<span class='mode'>&gt;&gt; grep &quot;" + lastPart[0] + "&quot;</span>")
              o.lines.forEach((v)=>{
                body.push("<li>" + v.text + "<span class='tiny'><a href='?user=" + encodeURIComponent(v.user) + "&id=" + encodeURIComponent(v.id) + "'>" + v.user + ":" + v.id + ":" + v.lineNo + "</a></span></li>")
              })
              dispatch(previewLine(name, no, body.join("\n")));
            })
          })
        break;
        case "schedule":
          ret += "<span class='mode'>&gt;&gt; schedule</span>";
          global.sendSearchSchedule().then((resp) => {
            resp.json().then((o) => {

              let body = [];
              body.push("<span class='mode'>&gt;&gt; schedule</span>")
              o.lines.forEach((v)=>{
                let m = v.text.match(/^\[(\d{4})-(\d{2})-(\d{2})\](([@.\-~+!])(\d+|)|)/)
                v.priority = 0
                if(!m || m.length < 5){
                  console.log("invalid schedule", v.text)
                  v.priority = -9999
                  return;
                }
                console.log(m)
                let year = m[1]
                let month = m[2]
                let day = m[3]
                let mark = m[5]
                let number = m[6]
                let date = new Date(year, month -1, day, 0, 0, 0)

                v.date = date

                v.show = true
                v.label = ""
                let today = new Date()
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                today.setMilliseconds(0);
                let oneday = 60*60*24*1000

                v.number = number
                switch(mark){
                  case "": // none
                  case "@": // schedule
                    v.label = "予定";
                    if(!number){
                      number = 1;
                    }

                    // その日に優先度0となる その後は指定日が過ぎたら消える
                    if(today.getTime() <= date.getTime() + oneday * (number - 1)){
                      v.priority = Math.floor((today.getTime() - date.getTime())/oneday);
                    }else{
                      v.priority = -9999;
                    }
                    break;
                  case "!": // deadline
                    v.label = "締切";
                    if(!number){
                      number = 7;
                    }

                    if(today.getTime() >= date.getTime() - oneday * (number)){
                      // その日に向かって上になり、当日が0、その後も優先度が上昇し続ける
                      v.priority = Math.floor((today.getTime() - date.getTime())/oneday);
                    }else{
                      v.priority = -9999;
                    }
                    break;
                  case ".": // done
                    v.label = "完了";
                    v.priority = -9999;
                    break;
                  case "-": // note
                    v.label = "覚書";
                    if(!number){
                      number = 7;
                    }

                    // その日に優先度が0となり X日かけて沈んでいく
                    if(today.getTime() < date.getTime()){ // その日が来るまで現れない
                      v.priority = -9999;
                    }else{
                      // TODO: 指定日以降は現れない

                      v.priority = Math.floor((today.getTime() - date.getTime())/oneday);
                    }
                    break;
                  case "~": // up-down
                    v.label = "浮遊";
                    if(!number){
                        number = 30;
                    }

                    v.priority = Math.floor(number*(-1 + Math.cos(Math.PI*2*(today.getTime() - date.getTime())/oneday/number)));
                    break;
                  case "+": // todo
                    v.label = "ToDo";
                    if(!number){
                      number = 7;
                    }

                    // その日に優先度が0となるように X日かけて上がっていく
                    //if(today.getTime() < date.getTime()){
                    //  v.priority = -9999;
                    //}else{
                      v.priority = Math.floor((today.getTime() - date.getTime())/oneday) - number;
                    //}
                    break;
                  default:
                    v.priority = 9999; // invalid schedule
                }
              })
              o.lines.sort((a,b) => {return b.priority - a.priority})
              let mode = 0;
              o.lines.forEach((v)=>{
                if(mode === 1 && v.priority === -9999){
                  body.push("<hr>")
                  mode = 2;
                }
                if(mode === 0 && v.priority < 0){
                  body.push("<hr>")
                  mode = 1;
                }
                let calcColor = (p) => {
                  if(p > 0){return "255,160,160";}
                  if(p === 0){return "255,255,100";}
                  if(p === -9999){return "120,120,120";}
                  if(p < -7){return "200,200,200";}
                  return "255,255,255";
                }
                if(v.show){
                  body.push("<li><span style='background-color:rgb(" + calcColor(v.priority) + ");'><span class='schedule-label'>"  + v.label + "</span>" + v.text + "</span><span class='tiny'>" +v.priority + " <a href='?user=" + encodeURIComponent(v.user) + "&id=" + encodeURIComponent(v.id) + "'>" + v.user + ":" + v.id + ":" + v.lineNo + "</a></span></li>")
                }
              })
              dispatch(previewLine(name, no, body.join("\n")));
            })
          })
        break;

        case "list":
            ret += "<span class='mode'>&gt;&gt; list</span>";
            ret += global.list.filter((s) => s.indexOf(lastPart[0]) === 0).map((s) => "<li><a href='?&user=" + global.user + "&id=" + encodeURIComponent(s) + "'>" + escapeHTML(s, global.user) + "</a></li>").join("")
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
              dispatch(previewLine(name, no, body));
              window.twttr.widgets.load() // TODO: global object?
            });
            ret += "oembed..."+body
          }
        break
        case "item":
          ret += "<span class='mode'>&gt;&gt; item</span>";
          ret += '<a href="'+lastPart[0]+'">'
          ret += '<table class="item">'
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
              ret += escapeHTML(j, global.user);
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
      return "<div>" + escapeHTML(text, global.user) + "<div>"
    }else if(text.indexOf("##") === 0){
      return "<div>" + escapeHTML(text, global.user) + "<div>"
    }else if(text.indexOf("#") === 0){
      return "<div>" + escapeHTML(text, global.user) + "<div>"
    }
    return "<div>"+htmlEncode(parse(text), global.user)+"</div>"
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

