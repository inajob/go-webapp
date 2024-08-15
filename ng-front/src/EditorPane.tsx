import { useState, useEffect, useCallback, useRef } from 'react'
import {Editor, isBlock, parseBlock} from 'simple-inline-editor'
import { BlockStyleHandler } from 'simple-inline-editor/dist/components/Line'
import { LinePopupHandler } from 'simple-inline-editor/dist/components/Editor'
import { TextPopupHandler, Keyword } from 'simple-inline-editor/dist/components/TextareaWithMenu'
import {DialogListItem} from './Dialog.tsx'
import {jsonp} from './jsonp.tsx'
import {sendSearch, sendSearchCache} from './api.ts'
import {convertInlineToMD, convertMDToInline} from './inlineMd.tsx'

const API_SERVER = import.meta.env.VITE_API_SERVER

export interface EditorPaneProps {
    onSubLinkClick: (title: string) => void;
    onLinkClick: (title: string) => void;
    keywords: Keyword[];
    blockStyles: Record<string, BlockStyleHandler>;
    //linePopupHandlers: LinePopupHandler[];
    textPopupHandlers: TextPopupHandler[];
    user: string;
    pageId: string;
    defaultLines: string[];
    showListDialog: (items: DialogListItem[]) => void;
    setStatueMessage: React.Dispatch<React.SetStateAction<string>>;
    setIsError: React.Dispatch<React.SetStateAction<boolean>>;
}

export const EditorPane: React.FC<EditorPaneProps> = (props) =>  {
    const [lines, setLines] = useState([{body: "initializing...", key: 0}]);
    const [keywords, setKeywords] = useState<string[]>([])
    const [relatedPages, setRelatedPages] = useState<{[key:string]:[{id:string,text:string,cover:string}]|[]}>({})
    const [initialized, setInitialized] = useState(false)
    const lastUpdate = useRef("");
    const saveTimer = useRef(0);
    const saveFunc = useRef(() => {});
    const preKeywords = useRef<string[]>([]); // 削除されたキーワードも更新できるように保存しておく
  
    const makeDirty = useCallback(() => {
        setInitialized(true)
      }, [])


    function extractKeywords(lines: string[]): string[]{
      const out:string[] = []
      let inKeyword = false
      let keyword = ""
      lines.forEach((l) => {
        if(!isBlock(l)){
          inKeyword = false
          keyword = ""
          for(let i = 0; i < l.length; i ++){
            if(l[i] == "["){ // ネストには対応していない
              inKeyword = true
            }else if(l[i] == "]"){
              inKeyword = false
              out.push(keyword)
              keyword = ""
            }else{
              if(inKeyword){
                keyword += l[i]
              }
            }
          }
        }
      })
      
      return out
    }
    function extractImages(lines: string[]): string[]{
      const images:string[] = []
      lines.forEach((l) => {
        if(isBlock(l)){
          const parts = parseBlock(l)
          const typeName = parts[0]
          if(typeName == "img"){
            let img = parts[1]
            if(!(img.indexOf("http://")==0 || img.indexOf("https://")==0)){
              img = "/img/" + img
            }
            images.push(img)
          }else if(typeName == "item" && parts.length > 1){
            const img = parts[1].split("\n")[1]
            images.push(img)
          }
        }
      })
      console.log("extractImages", images)
      return images
    }

    function postPage(user: string, id: string, body: string, lastUpdate:string, image: string){
      const f = new FormData()
  
      if(body.length === 0){
        return
      }
      f.append('body', body)
      f.append('lastUpdate', lastUpdate)
      f.append('cover', image)
      const req = new Request(API_SERVER + "/page/" + user + "/" + encodeURIComponent(id), {
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

    function pageSave(user: string, id: string, body: string, pLastUpdate:string, image: string){
      props.setStatueMessage("saving.." + id)
      return postPage(user, id, body, pLastUpdate, image)?.then((o) => o.json()).then((o) => {
        lastUpdate.current = o.meta.lastUpdate
      }).then(() => {
        props.setStatueMessage("saved:" + id)
        let ks = extractKeywords(lines.map((l) => l.body))
        ks = ks.concat(preKeywords.current)
        const kmap:{[key: string]: boolean} = {}
        ks.forEach((k => {kmap[k] = true}))
        const keywords = Object.keys(kmap)
        const sscs = keywords.map((k) => sendSearchCache(user ,"[" + k + "]"))
        // TODO: ここでpreKeywordsにあったものを消しても良い
        preKeywords.current = keywords
        return Promise.all(sscs)
      }).catch((e) => {
        props.setStatueMessage(e.toString())
        props.setIsError(true)
        console.log(e)
      })
    }

    function delayedPageSave(getter: { (): { user: string; id: string; body: string; lastUpdate: string; image: string }; (): void }){
      if(saveTimer.current != 0){
        clearTimeout(saveTimer.current);
        saveFunc.current = () => {}
      }
      saveFunc.current = () => {
        saveTimer.current = 0;
        const p = getter()
        return pageSave(p.user, p.id, p.body, p.lastUpdate, p.image)
      }
      saveTimer.current = setTimeout(saveFunc.current, 1000 * 3)
    }

    function checkPage(user:string, id:string){
      const r = Math.floor(Math.random()*1000)
      const req = new Request(API_SERVER + "/page/" + user + "/" + encodeURIComponent(id) + "?r=" + r, {
        method: "GET"
        })
      return fetch(req).then((response) => {
        return response.json()
      })
    }
    
    const linePopupHandlers: LinePopupHandler[] = [
      {
        name: "delete",
        handler: (_, range) => {
          if(range == undefined){
            throw "range is undefined"
          }
          setLines((prevLines) => {
            prevLines.splice(range[0], range[1] - range[0] + 1)
            return prevLines
          })
        }
      },
      {
      name: "new page",
      handler: (selectedLines, range) => {
        console.log(selectedLines, range)
        const title = selectedLines[0]
        selectedLines[0] = "from [" + props.pageId + "]"
        const md = convertMDToInline(selectedLines)
        const body = md
        checkPage(props.user, title).then((o) => {
          console.log(o)
          if(o.error){
            // not found
            console.log("page not found")
            const images = extractImages(selectedLines)
            let image = ""
            if(images.length > 0){
              image = images[0]
            }
            return postPage(props.user, title, body, "0", image)
          }
          throw "page found"
        }).then((o) => {
          if(o && o.ok){
            // TODO: 保存する前にlinesを変更していい感じにする
            const l = lines.map((l) => l.body)
            if(range == undefined){
              throw "range is undefined"
            }
            l[range[0]] = "[" + l[range[0]] + "]"
            l.splice(range[0] + 1, range[1] - range[0])
            
            const images = extractImages(l)
            let image = ""
            if(images.length > 0){
              image = images[0]
            }
            const md = convertMDToInline(l)
            return pageSave(props.user, props.pageId, md, lastUpdate.current, image)
          }
          throw "page save failed"
        }).then(() => {
          props.onLinkClick(title)  
        })

        // TODO: remove range and wikilink
      }
      }
    ]

    useEffect(() => {
      window.addEventListener("beforeunload", () => {
        if(saveTimer.current != 0){
          clearTimeout(saveTimer.current);
          saveFunc.current()
          saveFunc.current = () => {}
        }
      });
    }, [])

    // get Page
    useEffect(() => {
        if(saveTimer.current != 0){
          clearTimeout(saveTimer.current);
          saveFunc.current()
          saveFunc.current = () => {}
        }
        const r = Math.floor(Math.random()*1000)
        console.log("get page", props.user, props.pageId)
        const req = new Request(API_SERVER + "/page/" + props.user + "/" + encodeURIComponent(props.pageId) + "?r=" + r, {
        method: "GET"
        })
        fetch(req).then((response) => {
        response.json().then((obj) => {
            console.log(obj)
            if(obj["error"]){
              setLines(props.defaultLines.map((l, i) => {return {body: l, key: i}}))
              setKeywords([])
            }else{
              console.log("CHANGE LINE get Page", props.pageId)
              const ls = convertInlineToMD(obj.body.split("\n")).map((l, i) => {return {body: l, key: i}})
              setLines(ls)
              lastUpdate.current = obj.meta.lastUpdate;

              const ks = extractKeywords(ls.map((l) => l.body))
              setKeywords(ks)
            }
            setInitialized(false)
        })
        })        
    }, [props.pageId, props.user, props.defaultLines])

    
    useEffect(() => {
      console.log("recalc related pages", keywords)
      const ks = keywords.filter((k) => k != props.pageId).map((k) => "[" + k +"]")
      ks.push(props.pageId)
      ks.push("["+ props.pageId +"]")
      if(ks.length > 0){
        Promise.all(ks.map((k) => sendSearch(props.user, k, false)))
          .then((r) => Promise.all(r.map((o) => o.json())))
          .then((r) => {
            console.log(r)
            const rp:{[key: string]:[{id:string, text:string, cover:string}]} = {}
            for(let i = 0; i < ks.length; i ++){
              console.log(ks[i], r[i])
              const pages:[{id:string, text:string, cover:string}] = r[i].lines.filter(
                (l:{[id: string]: string}) => l.id != props.pageId
              ).sort((a:{[id: string]: string}, b:{[id: string]: string}) => {
                const m = a.id.match(/\d{4}-\d{2}-\d{2}/)
                const m2 = b.id.match(/\d{4}-\d{2}-\d{2}/)
                if(m && !m2){return 1}
                if(!m && m2){return -1}
                return (a.modTime > b.modTime)?-1:1
              })
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
        //console.log("CHANGE LINE", initialized, lines)
        const images = extractImages(lines.map((l) => l.body))
        let image = ""
        if(images.length > 0){
          image = images[0]
        }
        const md = convertMDToInline(lines.map((l) => l.body))
        
        if(initialized){
        // save
        //console.log("CHANGE LINE SAVE", md)
        delayedPageSave(() => {
            return {
            user: props.user,
            id: props.pageId,
            body: md,
            lastUpdate: lastUpdate.current,
            image: image
            }
        })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines])

    const onMagicFunc = (row:number) => () => {
      console.log(row)

      props.showListDialog([
        {title: "amazon", handler: (close: () => void) => {
          close()
          jsonp("amazon", "//web.inajob.freeddns.org/ad/amz.php?callback=amazon&q=" + encodeURIComponent(lines[row].body), (data) => {
            console.log("get amz", data)
            props.showListDialog(data.map((d: { handler: (close: () => void) => void; link: string[]; limage: string[]; title: string }) => {
              d.handler = (close: () => void) => {
                setLines(lines.map((l, i) => {
                  if(i == row){
                    return {body: "```item\n" + d.link[0] + "\n" + d.limage[0] + "\n" + d.title, key: l.key}
                  }else{
                    return l
                  }
                }))
                close()
              }
              return d
            }))
          })
        }},
        {title: "ogp", handler: (close: () => void) => {
          close()
          const req = new Request("https://info-proxy.inajob.freeddns.org/ogp?url=" + encodeURIComponent(lines[row].body), {
            method: "GET"
          })
          console.log(req)
          fetch(req).then((response) => {
            console.log(response)
            return response.json()
          }).then((obj) => {
            setLines(lines.map((l, i) => {
              if(i == row){
                return {body: "```item\n" + lines[row].body + "\n" + obj.ogImage[0].url + "\n" + obj.ogTitle, key: l.key}
              }else{
                return l
              }
            }))
            close()
          })
        }}
      ])
    }

    return <>
        <h3>{props.pageId}</h3>
        <div className="container">
            <Editor
                lines={lines}
                setLines={setLines}
                linePopupHandlers={linePopupHandlers}
                textPopupHandlers={props.textPopupHandlers}
                keywords={props.keywords}
                blockStyles={props.blockStyles}
                onChange={makeDirty}
                onLinkClick={props.onLinkClick}
                onSubLinkClick={props.onSubLinkClick}
                onMagicFunc={onMagicFunc}
            />
            <div className="related-pages">
              {Object.entries(relatedPages).map((p, i) => <div key={"related-pages-" + i}>
                  <div className="related-page-title">
                    {p[0]}
                  </div>
                  <div className="related-pages-item">{p[1].map((ks:{id:string, text:string, cover:string}, i) => 
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
                        {ks.cover == ""?
                          (<div className="item-desc">{ks.text}</div>):
                          (<div className="item-desc"><img src={ks.cover} /></div>)}
                    </div>
                  )}</div>
                </div>)}
            </div>
        </div>
    </>
}
