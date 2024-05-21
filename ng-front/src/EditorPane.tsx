import { useState, useEffect, useCallback, useRef } from 'react'
import {Editor} from 'simple-inline-editor'
import { LinePopupHandler } from 'simple-inline-editor/dist/components/Editor'
import { TextPopupHandler } from 'simple-inline-editor/dist/components/TextareaWithMenu'

const API_SERVER = import.meta.env.VITE_API_SERVER

export interface EditorPaneProps {
    onSubLinkClick: (title: string) => void;
    onLinkClick: (title: string) => void;
    keywords: string[];
    blockStyles: Record<string, (body: string) => React.JSX.Element>;
    linePopupHandlers: LinePopupHandler[];
    textPopupHandlers: TextPopupHandler[];
    user: string;
    pageId: string;
}

const EditorPane: React.FC<EditorPaneProps> = (props) =>  {
    const [lines, setLines] = useState([{body: "initializing...", key: 0}]);
    const [keywords, setKeywords] = useState<string[]>([])
    const [relatedPages, setRelatedPages] = useState<{[key:string]:[{id:string,text:string}]|[]}>({})
    const [initialized, setInitialized] = useState(false)
    const lastUpdate = useRef("");
    const saveTimer = useRef(0);

    const makeDirty = useCallback(() => {
        setInitialized(true)
      }, [])


    function extractKeywords(s: string): string[]{
      const out = []
      let inKeyword = false
      let keyword = ""
      for(let i = 0; i < s.length; i ++){
        if(s[i] == "["){ // ネストには対応していない
          inKeyword = true
        }else if(s[i] == "]"){
          inKeyword = false
          out.push(keyword)
          keyword = ""
        }else{
          if(inKeyword){
            keyword += s[i]
          }
        }
      }
      return out
    }
    function convertInlineToMD(inlineLines:string[]): string[]{
        const mdLines:string[] = []
        let inBlock = false
        let block:string[] = []
        inlineLines.forEach((l) => {
            if(l.indexOf(">>") == 0){
            inBlock = true
            block = []
            l = l.replace(/^>> /,"```") // convert inline block to markdown block
            }
            if(l.indexOf("<<") == 0){
            inBlock = false
            mdLines.push(block.join("\n"))
            return
            }
            if(inBlock){
            block.push(l)
            }else{
            mdLines.push(l)
            }
        })
    return mdLines
    }
    function convertMDToInline(lines: string[]): string{
        const out:string[] = []
        lines.forEach((l) => {
            const bLines = l.split(/[\r\n]/)
            // インデント付きブロック記法はサポート外なのでインデントを消す
            const m = bLines[0].match(/(\s*```)/)
            if(m) {
            const prefix = m[1]
            bLines[0] = ">> " + bLines[0].slice(prefix.length)
            bLines.push("<<")
            out.push(bLines.join("\n"))
            }else if(bLines.length > 1){
            throw "unknown block"
            }else{
            out.push(l)
            }
        })
        return out.join("\n")
    }

    function postPage(user: string, id: string, body: string, lastUpdate:string, image: string){
        const f = new FormData()
    
        if(body.length === 0){
          return
        }
        f.append('body', body)
        f.append('lastUpdate', lastUpdate)
        f.append('cover', image)
        const req = new Request(API_SERVER + "/page/" + user + "/" + id, {
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

      function pageSave(getter: { (): { user: string; id: string; body: string; lastUpdate: string; image: string }; (): void }){
        if(saveTimer.current != 0){
          clearTimeout(saveTimer.current);
        }
        saveTimer.current = setTimeout(() => {
          saveTimer.current = 0;
          const p = getter()
          postPage(p.user, p.id, p.body, p.lastUpdate, p.image)?.then((o) => o.json()).then((o) => {
            // TODO: external function
            lastUpdate.current = o.meta.lastUpdate
          })
        }, 1000 * 3)
      }
    
    // get Page
    useEffect(() => {
        const r = Math.floor(Math.random()*1000)
        console.log("get page", props.user, props.pageId)
        const req = new Request(API_SERVER + "/page/" + props.user + "/" + encodeURIComponent(props.pageId) + "?r=" + r, {
        method: "GET"
        })
        fetch(req).then((response) => {
        response.json().then((obj) => {
            console.log(obj)
            if(obj["error"]){
              setLines([{body: "", key: 0}])
              setKeywords([])
            }else{
              console.log("CHANGE LINE get Page", props.pageId)
              setLines(convertInlineToMD(obj.body.split("\n")).map((l, i) => {return {body: l, key: i}}))
              lastUpdate.current = obj.meta.lastUpdate;
            }
            setInitialized(false)
        })
        })        
    }, [props.pageId, props.user])

    function sendSearch(user:string, keyword:string, noCache:boolean){
      const f = new FormData()
      f.append('keyword', keyword)
      f.append('user', user)
      f.append('noCache', noCache?"1":"0")
      const req = new Request(API_SERVER + "/search", {
        method: "POST",
        credentials: "include", // for save another domain
        headers: {
          'Accept': 'applicatoin/json',
        },
        body: f,
      })
      return fetch(req)
    }
    
    useEffect(() => {
      console.log("recalc related pages", keywords)
      const ks = keywords.filter((k) => k != props.pageId).map((k) => "[" + k +"]")
      ks.push(props.pageId)
      if(ks.length > 0){
        Promise.all(ks.map((k) => sendSearch(props.user, k, false)))
          .then((r) => Promise.all(r.map((o) => o.json())))
          .then((r) => {
            console.log(r)
            const rp:{[key: string]:[{id:string, text:string}]} = {}
            for(let i = 0; i < ks.length; i ++){
              console.log(ks[i], r[i])
              const pages:[{id:string, text:string}] = r[i].lines.filter((l:{[id: string]: string}) => l.id != props.pageId)
              if(pages.length > 0){
                rp[ks[i]] = pages
              }
            }
            setRelatedPages(rp)
          })
      }else{
        console.log("empty related pages")
        setRelatedPages({})
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keywords])

    useEffect(() => {
        console.log("CHANGE LINE", initialized, lines)
        const md = convertMDToInline(lines.map((l) => l.body))
        //const rp:{[key:string]:string[]|[]} = {}
        const ks = extractKeywords(md)
        if(ks.toString() != keywords.toString()){
          setKeywords(ks)
        }

        if(initialized){
        // save
        console.log("CHANGE LINE SAVE", md)
        pageSave(() => {
            return {
            user: props.user,
            id: props.pageId,
            body: md,
            lastUpdate: lastUpdate.current,
            image: ""
            }
        })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines])

    return <>
        <h3>{props.pageId}</h3>
        <div className="container">
            <Editor
                lines={lines}
                setLines={setLines}
                linePopupHandlers={props.linePopupHandlers}
                textPopupHandlers={props.textPopupHandlers}
                keywords={props.keywords}
                blockStyles={props.blockStyles}
                onChange={makeDirty}
                onLinkClick={props.onLinkClick}
                onSubLinkClick={props.onSubLinkClick}
            />
            <div className="related-pages">
              {Object.entries(relatedPages).map((p, i) => <div key={"related-pages-" + i}>
                  <div className="related-page-title">
                    {p[0]}
                  </div>
                  <div className="related-pages-item">{p[1].map((ks:{id:string, text:string}, i) => 
                    <div key={ks.id + i}>
                      <div className="item-title">
                        <a href="#" onClick={(e) => {
                          props.onLinkClick(ks.id)
                          e.preventDefault()
                          return false
                        }}>{ks.id}</a>
                        <span className="bracket-icon" onClick={(e) => {
                          props.onSubLinkClick(ks.id)
                          e.preventDefault()
                          return false
                        }}>[]</span>
                      </div>
                        <div className="item-desc">{ks.text}</div>
                      
                    </div>
                  )}</div>
                </div>)}
            </div>
        </div>
    </>
}
export default EditorPane