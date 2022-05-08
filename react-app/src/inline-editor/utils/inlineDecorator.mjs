import pkg from 'mathjs'
const {create,all} = pkg

const API_SERVER=process.env.REACT_APP_API_SERVER

/*
  {{link url}}
  {{img img}}
  */
  function newPiece(kind, s){
    return {kind: kind, body: s};
  }

  // multi-target indexOf
  // return minimum index and target
  function capture(body, targets, offset){
    var minPos = -1;
    var minTarget = "";
    targets.forEach(function(target){
      var index = body.indexOf(target, offset);
      if(index !== -1){
        if(minPos === -1 || minPos > index){
          minPos = index;
          minTarget = target;
        }
      }
    });
    return {pos: minPos, target: minTarget}
  }

  export function parse(body){
    var pos = 0;
    function inner(level){
      var out = [];
      let isList = (body.search(/\s*- /) === 0);
      if(pos === 0 && isList){
        let m = body.match(/^(\s*)- /)
        pos += m[0].length - 1
        out.push(newPiece("list", body.slice(0, pos)));
      }
      while(true){
        var cap;
        if(level === 0){
          cap = capture(body, ["{{","}}", "[", "]", "http://", "https://"], pos);
        }else{
          cap = capture(body, ["{{","}}","[", "]"], pos);
        }
        if(cap.target === "{{"){
          out.push(newPiece("text", body.slice(pos, cap.pos)));
          pos = cap.pos + "{{".length;
          out.push(["command"].concat(inner(level + 1)));
        }else if(cap.target === "}}"){
          out.push(newPiece("command", body.slice(pos, cap.pos)));
          pos = cap.pos + "}}".length;
          if(level > 0){
            break;
          }
        }else if(cap.target === "["){
          let capPos = cap.pos;
          out.push(newPiece("text", body.slice(pos, cap.pos)));
          pos = cap.pos + "[".length;
          out.push(["wikilink"].concat(inner(level + 1)));
          if(capPos === 0){
            switch(body[pos]){
              case '!':
              case '@':
              case '~':
              case '-':
              case '+':
                out.push(newPiece("schedule-active", body.slice(pos, pos + 1)));
                pos = pos + ".".length;
                break;
              default:
                break;
            }
          }
        }else if(cap.target === "]"){
          out.push(newPiece("text", body.slice(pos, cap.pos)));
          pos = cap.pos + "]".length;
          if(level > 0){
            break;
          }
        }else if((cap.target==="https://" || cap.target === "http://")){
          if(pos !== cap.pos){
            out.push(newPiece("text", body.slice(pos, cap.pos)));
          }
          var endPos = capture(body, [" ","\r", "\n"], cap.pos + cap.target.length);
          if(endPos.pos !== -1){
            out.push(newPiece("url", body.slice(cap.pos, endPos.pos)));
            pos = endPos.pos;
          }else{
            out.push(newPiece("url", body.slice(cap.pos, body.length)));
            pos = body.length;
            break;
          }
        }else{
          out.push(newPiece("text", body.slice(pos, body.length)));
          pos = body.length;
          break;
        }
      }
      return out;
    };
    return inner(0);
  }

  export function htmlEncode(body, user, keywords){
    var out = [];
    var tmp;
    var list;
    var cmd, remain;
    const math = create(all, {})
    body.forEach(function(v){
      if(Array.isArray(v)){
        switch(v[0]){
          case "command":
            tmp = htmlEncode(v.slice(1), user, keywords);
            list = tmp.split(/\s+/, 2); //  cmd, remain...

            var m = tmp.match(/\s+/);
            if(m){
              var delimiter = m[0];
              cmd = tmp.slice(0, m.index)
              remain = tmp.slice(m.index + delimiter.length)
            }else{
              cmd = "";
            }

            switch(cmd){
              // inline commands
              case "link":
                out.push('<span class="tiny">{{link ')
                let m = remain.match(/\s+/)
                var url
                var label
                if(m){
                  let delimiter = m[0];
                  url = remain.slice(0, m.index)
                  label = remain.slice(m.index + delimiter.length)
                }
                out.push(url) // url
                out.push(" </span><a target='_blank' href='"+ url +"'>"+label+"</a>") // label
                out.push('<span class="tiny">}}</span>')
                break
              case "img":
                out.push('<span class="inline-image">{{')
                out.push('img')
                if(remain.indexOf("http://")===0 || remain.indexOf("https://")===0){
                  out.push('<img src="' +remain+ '">')
                }else{
                  out.push('<img src="'+
                    API_SERVER + '/img/' + remain + '">')
                }
                out.push('}}</span>')
                break;
              case "calc":
                out.push("<span style='background-color:#eef;border-radius:1em;'>{{")
                out.push(tmp);
                out.push("}}")
                try{
                  let result = math.evaluate(remain);
                  out.push("<span style='background-color:#dff;user-select:none;'> = " + result + "</span></span>")
                }catch(e){
                  console.log("math error: " + list[1], e)
                }
                break;
              default:
                out.push("{{")
                out.push(tmp);
                out.push("}}")
            }
            break;
          case "wikilink":
            tmp = htmlEncode(v.slice(1), user, keywords);
            let notFound = true;
            let k = keywords.find((s) => s.keyword === tmp)
            if(k){
              notFound = (k.count <= 1)
            }
            out.push("<span class='label'>")
            out.push("<span class='invisible'>[</span>")
            out.push("<a class='" + (notFound?"not-found":"") + "' href='?&user=" + user + "&id=" + tmp + "' data-jump='"+ tmp +"'>" + tmp + "</a>");
            out.push("<span class='invisible'>]</span><a class='non-select side-link' data-id=" + tmp + ">*</a>")
            out.push("</span>")
            break;
          default:
            throw new Error("unsupported kind: " + v.kind)
        }
      }else{
        switch(v.kind){
          case "command":
            out.push("" + v.body + "");
            break;
          case "list":
            out.push(v.body.replace(/  /g, "<span class='spc'>&nbsp;&nbsp;</span>"));
            break;
          case "text":
            out.push(v.body);
            break;
          case "schedule-active":
            out.push('<span class="schedule-active">'+v.body+'</span>');
            break;

          case "url":
            // todo: escape
            out.push("<a href='" +  v.body + "'>" + v.body + "</a><a href='http://b.hatena.ne.jp/entry/"+ v.body+"' target='_blank'><img src='http://b.hatena.ne.jp/entry/image/" + v.body + "' /></a>");
            break;
          default:
            throw new Error("unsupported kind: " + v.kind);
        }
      }
    });
    return out.join("");
  }

