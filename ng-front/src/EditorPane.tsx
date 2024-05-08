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
    const [lines, setLines] = useState(["initializing..."]);
    const [keywords, setKeywords] = useState(["loading keywords..."]);
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
        const req = new Request(API_SERVER + "/page/" + props.user + "/" + props.pageId + "?r=" + r, {
        method: "GET"
        })
        fetch(req).then((response) => {
        response.json().then((obj) => {
            console.log(obj)
            console.log("CHANGE LINE get Page", props.pageId)
            setLines(convertInlineToMD(obj.body.split("\n")))
            lastUpdate.current = obj.meta.lastUpdate;
            setInitialized(false)
        })
        })        
    }, [props.pageId, props.user])

    useEffect(() => {
        console.log("CHANGE LINE", initialized, lines)
        const md = convertMDToInline(lines)
        setKeywords(extractKeywords(md))

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
            <div>
              {keywords.map(((k, i) => <div key={"keyword"+i}>{k}</div>))}
            </div>
        </div>
    </>
}
export default EditorPane