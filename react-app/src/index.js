import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux'
import { Provider, batch } from 'react-redux'

import 'highlight.js/styles/dracula.css';  // choose your style!
import {mermaidAPI} from 'mermaid'

// --- inline editor ---
import rootReducer from './reducers'
import App from './App'
import {insertLine, setReadOnly, clearAll, setTitle} from './inline-editor/actions'
import {insertItem, clearItem, logined, updateMessage, error, updateInstantResults,
  clearInstantResults,
  modalListUpdateProviders,
  modalListClose
} from './actions'
import './inline-editor/index.css';
import './index.css';
import {Render, isBlock, parseBlock} from './inline-editor/utils/render'
import {mermaidRender} from './inline-editor/render/mermaid.mjs'
import {parse} from './inline-editor/utils/inlineDecorator'
// -- -- --

const store = createStore(rootReducer)
//const unsubscribe = store.subscribe(() => console.log("state",store.getState()))

const API_SERVER=process.env.REACT_APP_API_SERVER

global.mermaidRender = mermaidRender
mermaidAPI.initialize({startOnLoad: true, theme: 'forest'});

function loadLine(name, no, text){
  store.dispatch(insertLine(name, no, text, Render(name, no, text, global, store.dispatch)))
}

function getOpts(){
  var search = document.location.search
  search = search.replace(/^\?/,"")
  var list = search.split("&")
  var ret = {}
  list.forEach(function(item){
    let parts = item.split("=")
    ret[parts[0]] = parts[1]
  })
  return ret
}

function postPage(user, id, body, lastUpdate, image){
  let f = new FormData()
  f.append('body', body)
  f.append('lastUpdate', lastUpdate)
  f.append('cover', image)
  var req = new Request(API_SERVER + "/page/" + user + "/" + id, {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
      'User': user, // this header is deleted by login-proxy but useful for debug
    },
    body: f,
  })
  return fetch(req)
}

function loginCheck(user){
  let f = new FormData()
  f.append('user', user)
  var req = new Request(API_SERVER + "/loginCheck", {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
      'User': user, // this header is deleted by login-proxy but useful for debug
    },
    body: f,
  })
  return fetch(req)
}

function sendDelete(user, id){
  let f = new FormData()
  f.append('user', user)
  f.append('id', id)
  let req = new Request(API_SERVER + "/delete", {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
      'User': user, // this header is deleted by login-proxy but useful for debug
    },
    body: f,
  })
  return fetch(req)
}

function sendRename(from, to){
  let imgPathChange = (lines) => {
    // TODO: replace img tag
  }
  return savePromise().then(() => {
    let f = new FormData()
    f.append('from', from)
    f.append('to', to)
    f.append('user', global.user) // TODO: global.user
    let req = new Request(API_SERVER + "/rename", {
      method: "POST",
      credentials: "include", // for save another domain
      headers: {
        'Accept': 'applicatoin/json',
        // TODO: global.user
        'User': global.user, // this header is deleted by login-proxy but useful for debug
      },
      body: f,
    })
    return fetch(req)
  })
}

function sendSearch(keyword, noCache){
  let f = new FormData()
  f.append('keyword', keyword)
  f.append('user', global.user)
  f.append('noCache', noCache?"1":"0")
  var req = new Request(API_SERVER + "/search", {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
    },
    body: f,
  })
  return fetch(req)
}
function sendSearchCache(keyword, noCache){
  let f = new FormData()
  f.append('keyword', keyword)
  f.append('user', global.user)
  var req = new Request(API_SERVER + "/search-cache", {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
    },
    body: f,
  })
  return fetch(req)
}

global.sendSearch = sendSearch;

// TODO: cache
function sendSearchSchedule(){
  var req = new Request(API_SERVER + "/search-schedule", {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
    },
  })
  return fetch(req)
}
global.sendSearchSchedule = sendSearchSchedule;



function getPage(user, id){
  let r = Math.floor(Math.random()*1000)
  var req = new Request(API_SERVER + "/page/" + user + "/" + id + "?r=" + r, {
    method: "GET"
  })
  return fetch(req)
}
function getList(user){
  let r = Math.floor(Math.random()*1000)
  var req = new Request(API_SERVER + "/page/" + user + "?r=" + r, {
    method: "GET"
  })
  return fetch(req)
}

function grepToInstantSearch(grepLines, user, id) {
  let resultMap = {}
  grepLines.forEach((l) => {
    if(resultMap[l.user + "/" + l.id] || (l.user === user && encodeURIComponent(l.id) === id)){
    }else{
      resultMap[l.user + "/" + l.id] = {user: l.user, id: l.id, text: l.text, cover: l.cover}
    }
  })
  let result = []
  Object.keys(resultMap).forEach((k) => {
    result.push(resultMap[k])
  })
  return result;
}

function loadList(){
  return getList(opts.user).then(function(resp){
    resp.json().then(function(o){
      if(o.pages){
        let nameList = o.pages;
        global.list = nameList
        nameList.forEach(function(item){
          item.modTime = new Date(item.modTime);
          store.dispatch(insertItem(item))
        })
      }
    })
  })
}

let opts = getOpts()
let meta = {}
global.user = opts.user // TODO: manage context?
global.list = [] // TODO: manage context?

store.dispatch(modalListUpdateProviders([
  {name: "rename"},
  {name: "page"},
  {name: "amazon"},
  {name: "aliexpress"},
]))
store.dispatch(modalListClose())

loadList().then(function(){
  // Page require List
  function loadPage(name, isMain, user, id){
    getPage(user, id).then(function(resp){
      let keywords = ["[" + decodeURIComponent(id) + "]"] // link search
      console.log(resp)
      if(isMain){
        store.dispatch(clearInstantResults())
      }
      store.dispatch(setTitle(name, decodeURIComponent(id)))
      let instantSearch = () => {
        keywords.forEach((k) => {
          sendSearch(k, false).then((resp) => {
            store.dispatch(updateInstantResults(k, [{text:"loading..."}]))
            resp.json().then((o) => {
              let lines = o.lines
              let is = grepToInstantSearch(lines, user, id)
              store.dispatch(updateInstantResults(k, is))
            })
          })
        })
      }
      if(resp.ok === false){
        keywords.push(decodeURIComponent(id))
        instantSearch()
      }else{
        resp.json().then(function(o){
          console.log(o)
          if(isMain){
            meta = o.meta
          }
          let inBlock = false
          let blockBody;
          let index = 0;
          batch(() => {
          let lines = o.body.split(/[\r\n]/)
          lines.forEach(function(line, i){
            if(inBlock){
              if(line === "<<"){ // end of block
                loadLine(name, index, blockBody)
                inBlock = false
                index ++;
              }else{
                blockBody += "\n" + line
              }
            }else{
              if(isBlock(line)){ // start of block
                inBlock = true
                blockBody = line
              }else{ // not block line
                if(!(i === lines.length - 1 && line.length === 0)){ // skip tail
                  loadLine(name, index, line)
                  index ++;
                }
              }
            }
          })
          if(isMain){
            let result = analysis()
            keywords = keywords.concat(result.keywords.map((k) => "[" + k +"]"))
            keywords.push(decodeURIComponent(id)) // full search
            instantSearch()
          }
          })
        })
      }
    })
  }
  // load side page
  loadPage("side", false, opts.user, "menu")
  // load right page
  loadPage("right", false, opts.user, "menu")
  // load main page
  loadPage("main", true, opts.user, opts.id)

  // for SPA
  document.getElementById('root').addEventListener("click", (e)=> {
    let rightTo = e.srcElement.dataset.id
    let jumpTo = e.srcElement.dataset.jump
    if(rightTo){
      store.dispatch(clearAll("right"))
      loadPage("right", false, opts.user, rightTo)
    }
    if(jumpTo){
      store.dispatch(clearAll("main"))
      const url = new URL(window.location)
      url.search = "?user=" + encodeURIComponent(opts.user) + "&id=" + encodeURIComponent(jumpTo)
      window.history.pushState({},"", url)
      document.title = jumpTo
      opts.id = jumpTo
      store.dispatch(clearItem())
      loadList().then(() => {
        loadPage("main", true, opts.user, jumpTo)
      })
      e.preventDefault()
    }
  }, false)

  // for browser back
  window.onpopstate = function(e){
    let lopts = getOpts()
    opts.id = lopts.id
    store.dispatch(clearAll("main"))
    document.title = decodeURIComponent(opts.id)
    store.dispatch(clearItem())
    loadList().then(function(){
      loadPage("main", true, opts.user, opts.id)
    })
  }
})

try{
  document.getElementById("body").style.display = "none"
}catch(e){
  console.log(e)
}

loginCheck(opts.user).then(function(resp){
  resp.json().then(function(o){
    if(!o.editable){
      store.dispatch(setReadOnly("main"))
    }
    if(o.login){
      store.dispatch(logined(o.user))
    }
  })
})

function analysis(){
  let keywords = []
  let images = []
  // TODO: nested wiki link
  store.getState().lines.forEach((item) => {
    if(!isBlock(item.text)){
      let parsed = parse(item.text)
      parsed.forEach((l) => {
        if(Array.isArray(l)){
          if(l[0] === "wikilink"){
            keywords.push(l[1].body)
          }
        }
      })
    }else{
      //
      let blockInfo = parseBlock(item.text)
      if(blockInfo.type === "img"){
          if(blockInfo.body[0].indexOf("http://")===0 || blockInfo.body[0].indexOf("https://")===0){
            images.push(blockInfo.body[0])
          }else{
            images.push(API_SERVER + '/img/' + blockInfo.body[0])
          }
      }else if(blockInfo.type === "item"){
        images.push(blockInfo.body[1]);
      }
    }
  })
  console.log("Analysis", images)
  return {
    keywords,
    images,
  }
}

function savePromise(filter){
  let result = analysis()
  let images = result.images;
  let lines = store.getState().lines
  if(filter){
    lines = filter(lines);
  }
  let rawLines = lines.map((item) => {
    if(isBlock(item.text)){
      return item.text + "\n<<"
    }else{
      return item.text
    }
  }).join("\n")
  console.log(rawLines)
  let lastUpdate = ""
  let image = ""
  if(meta && meta.lastUpdate){lastUpdate = meta.lastUpdate}
  if(images.length > 0){image = images[0]}
  return postPage(opts.user, opts.id, rawLines, lastUpdate, image).then(function(resp){
    if(resp.ok){
      store.dispatch(updateMessage("Save OK, update Cache"))
      return resp.json()
    }else{
      store.dispatch(updateMessage("Save Error"))
      store.dispatch(error())
    }
  })
}

let saving = false;
let waiting = false;
function save(){
  saving = true;
  savePromise().then(async (o) => {
    meta = o.meta // update meta

    // update Search cache
    let result = analysis()
    let keywords = ["[" + decodeURIComponent(opts.id) + "]"] // link search
    keywords = keywords.concat(result.keywords.map((k) => "[" + k +"]"))
    let instantSearch = async () => {
      await Promise.all(
      keywords.map(async k => {
        await sendSearchCache(k, true).then((resp) => {
          resp.text().then((o) => {
            console.log("search cache queue length",o)
          })
        })
      })
      )
    }
    saving = false; // TODO: this cause server overload, but fast user interaction
    await instantSearch();
    store.dispatch(updateMessage("Update Cache OK"))
  })
}

var timerID = null
var firstOnUpdate = true
function onUpdate(o){
  if(firstOnUpdate){ // ReactTextareaAutocomplete trigger first unknown onUpdate
    firstOnUpdate = false;
    return
  }
  if(timerID != null){
    clearTimeout(timerID)
    timerID = null
  }
  if(waiting){return} // waiting queue length == 1

  let waitAndSave = () => {
    if(saving === false){
      waiting = false;
      timerID = setTimeout(save, 1000)
    }else{
      // now in saving
      waiting = true
      setTimeout(() => {
        waitAndSave()
      }, 1000);
    }
  }
  waitAndSave();
}

function onLoginClick(){
  document.location.href = API_SERVER + "/auth/login"
}
function onLogoutClick(){
  console.log("click logout")
  document.location.href = API_SERVER + "/auth/logout"
}
function onNewDiary(){
  let d = new Date();
  let id = "" + d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
  document.location.href = "?user=" + opts.user + "&id=" + id
}
function onNewJunk(){
  let d = new Date();
  let id = "" + d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + "-" + ("0" + d.getHours()).slice(-2) +  ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2)
  document.location.href = "?user=" + opts.user + "&id=" + id
}
function onDelete(user, id){
  return () => {
    sendDelete(user, id)
      .then(resp => resp.json())
      .then((o) => {
      console.log(o)
      document.location = "?user=" + user + "&id=FrontPage"
    })
  }
}

function uploadFile(file){
  let f = new FormData()
  f.append('img', file)
  var req = new Request(API_SERVER + "/img/" + opts.user + "/" + opts.id, {
    method: "POST",
    credentials: "include", // for save another domain
    headers: {
      'Accept': 'applicatoin/json',
      'User': opts.user, // this header is deleted by login-proxy but useful for debug
    },
    body: f,
  })
  return fetch(req)
}

store.dispatch(setReadOnly("side"))
store.dispatch(setReadOnly("right"))
/*
loadLine(0, "# React.jsで作ったインラインマークダウンエディタ")
loadLine(1, "インラインで編集ができる書式付きエディタです。")
loadLine(2, "http://inajob.hatenablog.jp URL自動リンクに対応しました。")
loadLine(3, "ブロック記法に対応しました")
loadLine(4, "## 整形済みテキスト")
loadLine(5, ">> pre\n　 ∧,,∧\n 　( `･ω･)\n 　/　∽ |")
loadLine(6, "## シンタックスハイライト")
loadLine(7, ">> code\n//ソースコードみたいなの\nfunction hoge(){\n  alert('Hello World');\n}")
loadLine(8, "## mermaidによる作画")
loadLine(9, ">> mermaid\ngraph LR\n図も描けます\nPlugin --> Pre\n Plugin --> Mermaid")
loadLine(10, "# 作った人")
loadLine(11, "https://twitter.com/ina_ani")
loadLine(12, "# GitHub")
loadLine(13, "https://github.com/inajob/inline-editor")
*/

ReactDOM.render(
  <Provider store={store}>
    <div>
      <App title={decodeURIComponent(opts.id)} user={opts.user} onUpdate={onUpdate} onLoginClick={onLoginClick} onLogoutClick={onLogoutClick} onNewDiary={onNewDiary} onNewJunk={onNewJunk} onDelete={onDelete(opts.user,decodeURIComponent(opts.id))} sendSearch={sendSearch} sendSearchSchedule={sendSearchSchedule} sendRename={sendRename} list={global.list} />
    </div>
  </Provider>,
  document.getElementById('root')
)

function setupPaste(){
  console.log("setupPaste");
  // --- only supports chrome/edge ---
  document.addEventListener("paste", function(event){
    console.log("paste");
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    console.log(items.length);
    for(let i = 0; i < items.length; i ++){
      console.log(items[i]);
      if(items[i].type.indexOf("image") !== -1){
        // find image
        console.log("capture image");
        var blob = items[i].getAsFile();

        uploadFile(blob).then(function(resp){
          resp.json().then(function(o){
            let no = store.getState().cursor.row;
            let imgId = o.imgId
            let line = ">> img\n" + opts.user + '/'+ opts.id + '/' + imgId
            store.dispatch(insertLine("main", no,line , Render("main", no, line, global)))
            save()
          })
        })
        return false;
      }
    }
    //event.preventDefault();
    return true;
  });
}
setupPaste();


