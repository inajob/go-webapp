import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import 'highlight.js/styles/github.css';  // choose your style!
import {mermaidAPI} from 'mermaid'

// --- inline editor ---
import rootReducer from './reducers'
import App from './App'
import {insertLine} from './inline-editor/actions'
import {insertItem} from './actions'
import './inline-editor/index.css';
import {Render} from './inline-editor/utils/render'
// -- -- --

const store = createStore(rootReducer)
//const unsubscribe = store.subscribe(() => console.log("state",store.getState()))

mermaidAPI.initialize({startOnLoad: true, theme: 'forest'});

function loadLine(no, text){
  store.dispatch(insertLine(no, text, Render(no,text)))
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

function postPage(user, id, body){
  let f = new FormData()
  f.append('body', body)
  var req = new Request("http://localhost:8088/page/" + user + "/" + id, {
    method: "POST",
    headers: {
      'Accept': 'applicatoin/json',
      'User': user, // this header is deleted by login-proxy but useful for debug
    },
    body: f,
  })
  return fetch(req)
}

function getPage(user, id){
  var req = new Request("http://localhost:8088/page/" + user + "/" + id, {
    method: "GET"
  })
  return fetch(req)
}
function getList(user){
  var req = new Request("http://localhost:8088/page/" + user, {
    method: "GET"
  })
  return fetch(req)
}

let opts = getOpts()
console.log("opts", opts)
getPage(opts.user, opts.id).then(function(resp){
  console.log(resp)
  if(resp.ok == false){
    loadLine(0, "# " + opts.id)
    return
  }
  resp.json().then(function(o){
    console.log(o)
    o.body.split(/[\r\n]/).forEach(function(line, i){
      loadLine(i, line)
    })
  })
})

function save(o){
  let rawLines = store.getState().lines.map((item) => {return item.text}).join("\n")
  console.log(rawLines)
  postPage(opts.user, opts.id, rawLines)
}

var timerID = null
function onUpdate(o){
  if(timerID != null){
    clearTimeout(timerID)
    timerID = null
  }
  timerID = setTimeout(() => (() => {save(o)})(o), 1000)
}

getList(opts.user).then(function(resp){
  resp.json().then(function(o){
    console.log("getList", o.pages)
    o.pages.forEach(function(item){
      store.dispatch(insertItem(item))
    })
  })
})

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
      <App user={opts.user} onUpdate={onUpdate} />
    </div>
  </Provider>,
  document.getElementById('root')
)
