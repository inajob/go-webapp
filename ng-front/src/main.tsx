import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../node_modules/simple-inline-editor/dist/style.css'

function getOpts(){
  let search = document.location.search
  search = search.replace(/^\?/,"")
  const list = search.split("&")
  const ret:Record<string, string> = {}
  list.forEach(function(item){
    const parts = item.split("=")
    ret[parts[0]] = parts[1]
  })
  return ret
}

const opts = getOpts()
console.log(opts)


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App user={opts["user"]} pageId={opts["id"]} />
  </React.StrictMode>,
)
