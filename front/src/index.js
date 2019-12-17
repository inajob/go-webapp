const mustache = require('mustache');
import {parse, htmlEncode} from './inlineDecorator';

function get(url){
  return new Promise((resolve) => {
    let req = new Request(url,{
      method: "get"
    })
    fetch(req).then((resp) => {
      if(resp.ok){
        resp.json().then((data) => {
          resolve(data)
        })
      }
    })
  })
}
function post(url, data){
  return new Promise((resolve) => {
    let f = new FormData();
    Object.keys(data).forEach(function(k,i){
      f.append(k, data[k]);
    });
    let req = new Request(url,{
      method: "post",
      body: f,
    })
    fetch(req).then((resp) => {
      if(resp.ok){
        resp.json().then((data) => {
          resolve(data)
        })
      }
    })
  })
}

function getPage(user, id){
  return get('/page/' + user + '/' + id);
}
function getList(user){
  return get('/page/' + user);
}

function postPage(user, id, body){
  return post('/page/' + user + '/' + id, {body: body});
}
function postCheck(){
  return post('/check', {})
}



function getQuery(){
  let s = document.location.search.replace(/^\?/,"")
  let list = s.split("&")
  let ret = {}
  list.forEach(function(v, i){
    let kv = v.split("=")
    ret[kv[0]] = kv[1];
  });
  return ret;
}

function render(text){
  let ret = [];
  let list = text.split(/[\r\n]+/);
  list.forEach(function(l){
    let r = "";
    if(l.indexOf("###") == 0){
      r = "<h3>" + l + "</h3>";
    }else if(l.indexOf("##") == 0){
      r = "<h2>" + l + "</h2>";
    }else if(l.indexOf("#") == 0){
      r = "<h1>" + l + "</h1>";
    }else{
      r = "<div>"+htmlEncode(parse(l))+"</div>";
    }
    ret.push(r);
  });
  return ret.join("\n");
}

window.addEventListener('load', () => {
  let listElm = document.getElementById("list");

  let opts = getQuery()
  let user = opts["user"] || "inajob";
  let id = decodeURIComponent(opts["id"]) || "test";

  let titleElm = document.getElementById("title");
  let titleText = document.createTextNode(id);
  titleElm.appendChild(titleText);
  let idElm =  document.getElementById("page-id");
  let userElm =  document.getElementById("page-user");
  idElm.value = id;
  userElm.value = user;

  let editElm =  document.getElementById("edit");
  editElm.style.display = "none";
  // check
  postCheck().then((res) => {
    console.log("check",res);
    if(res.login != "" && res.login == user){
      editElm.style.display = "block";
    }
  })

  // page
  getPage(user, id).then((d) => {
    let elm =  document.getElementById("page");
    let c = document.createElement("div");
    c.innerHTML = render(d.body);
    elm.appendChild(c);

    let bodyElm = document.getElementById("page-body");

    bodyElm.value = d.body;
  })

  // list
  getList("inajob").then((d) => {
    let listElm =  document.getElementById("list");
    let elm =  document.getElementById("page_list");
    let template = elm.innerHTML;
    let c = document.createElement("div");
    c.innerHTML = mustache.render(template,d)
    listElm.appendChild(c);
  })

  let updateButton = document.getElementById("update-button");
  let junkButton = document.getElementById("junk-button");
  let newButton = document.getElementById("new-button");

  updateButton.addEventListener('click', () =>{
    let user = opts.user
    let id = opts.id
    let bodyElm = document.getElementById("page-body");
    let body = bodyElm.value
    postPage(user, id, body).then((res) => {
      console.log(res)
      //document.location.reload();
    });
  })

  junkButton.addEventListener('click', () =>{
    let d = new Date();
    id = d.getFullYear() +
      ("0" + d.getMonth()).slice(-2) +
      ("0" + d.getDate()).slice(-2) +
      ("0" + d.getHours()).slice(-2) +
      ("0" + d.getMinutes()).slice(-2) +
      ("0" + d.getSeconds()).slice(-2)
     document.location = "?user=inajob&id=" + id;
  })
  newButton.addEventListener('click', () =>{
    let id = prompt("name");
    if(id){
      document.location = "?user=inajob&id=" + id;
    }
  })

})
