import { useState, useEffect, useCallback, useMemo } from 'react'
import {EditorPane} from './EditorPane.tsx'
import { TextFragment, TextChangeRequest } from 'simple-inline-editor/dist/components/TextareaWithMenu'
import './App.css'
import {Dialog, DialogListItem} from './Dialog.tsx'

import 'highlight.js/styles/github-dark-dimmed.min.css';  // choose your style!
import hljs from 'highlight.js'

import mermaid from 'mermaid'


const API_SERVER = import.meta.env.VITE_API_SERVER

function getOpts(){
  let search = document.location.search
  search = search.replace(/^\?/,"")
  const list = search.split("&")
  const ret:Record<string, string> = {}
  list.forEach(function(item){
    const parts = item.split("=")
    ret[parts[0]] = decodeURIComponent(parts[1])
  })
  console.log("getOpts", ret)
  return ret
}
const choice = (l:string[]) => {
  const r = Math.floor(Math.random() * l.length)
  return l[r]
}

export interface AppProps {
  user: string;
  pageId: string;
}

const App: React.FC<AppProps> = (props) =>  {
  const [pageId, setPageId] = useState({user: props.user, pageId: props.pageId});
  const [rightPageId, setRightPageId] = useState({user: props.user, pageId: props.pageId});
  const [keywords, setKeywords] = useState(["test"]);
  const [listInDialog, setListInDialog] = useState<DialogListItem[]>([])
  const [defaultLines, setDefaultLines] = useState<string[]>([""])
  const [openDialog, setOpenDialog] = useState<boolean>(false)

  const showListDialog = (items:DialogListItem[]) => {
    setListInDialog(items.map((i: DialogListItem) => {return {title: i.title, handler: i.handler}}))
    setOpenDialog(true)
  }

  const linkClick = useCallback((id:string, defaultLines?:string[]) => {
    console.log("CHANGE setPageId", id)
    if(defaultLines){
      setDefaultLines(defaultLines)
    }else{
      setDefaultLines([""])
    }
    setPageId({user: pageId.user, pageId: id})
    history.pushState({}, "", "?user=" + pageId.user + "&id=" + encodeURIComponent(id))
    return false
  }, [pageId.user])
  const subLinkClick = useCallback((id:string) => {
    setRightPageId({user: rightPageId.user, pageId: id})
    //history.pushState({}, "", "?user=" + rightPageId.user + "&id=" + id)
  }, [rightPageId.user])

  // == block styles ============================
  const csvToTable = (body: string) => {
    const rows: React.JSX.Element[] = [];
    const lines = body.split(/[\r\n]/);
    lines.forEach((l, tri) => {
      const cellElms: React.JSX.Element[] = [];
      const cells = l.split(/\s*,\s*/);
      cells.forEach((cell, tdi) => {
        cellElms.push(<td key={tdi}>{cell}</td>);
      });
      rows.push(<tr key={tri}>{cellElms}</tr>);
    });
    return <table>{rows}</table>;
  };
  const listBlock = useCallback((body: string) => {
    console.log("body[" + body + "]");
    const r = Math.floor(Math.random()*1000)
    const req = new Request(API_SERVER + "/page/" + props.user + "?r=" + r, {
      method: "GET"
    })
    
    throw fetch(req).then((response) => {
      return response.json()
    }).then((obj) => {
        console.log(obj)
        const keywordCache:string[] = obj.keywords
        return new Promise((resolve) => {
          resolve(
            <div>
              <span className="block-type">list</span>
              <ul className="list-block">
                {keywordCache.filter((k) => k.indexOf(body) == 0)
                .map((k, i) => <li key={i}>
                    <a href="#" onClick={(e) => {
                      linkClick(decodeURIComponent(k)); e.stopPropagation();e.preventDefault(); return false
                    }}>{k}</a>
                    <span className="bracket-icon" onClick={(e) => {
                      subLinkClick(decodeURIComponent(k)); e.stopPropagation();e.preventDefault(); return false
                    }}>[]</span>
                  </li>)}
              </ul>
            </div>
          )
        })
      })
    return <div>
      {keywords.filter((k) => k.indexOf(body) == 0)
      .map((k, i) => <li key={i}><a href="#" onClick={(e) => {linkClick(k); e.stopPropagation()}}>{k}</a></li>)}
      </div>;
  }, [keywords, linkClick, props.user, subLinkClick]);

  const urlBlock = (body:string) => {
    return <div>
        <div><span className="block-type">url</span></div>
        <iframe src={"https://hatenablog.com/embed?url=" + encodeURIComponent(body)}></iframe>
      </div>
  }

  const randompagesBlock = useCallback(() => {
    const r = Math.floor(Math.random()*1000)
    const req = new Request(API_SERVER + "/page/" + props.user + "?r=" + r, {
      method: "GET"
    })
    
    throw fetch(req).then((response) => {
      return response.json()
    }).then((obj) => {
        console.log(obj)
        const keywordCache:string[] = obj.keywords
        const pages:string[] = []
        for(let i = 0; i < 10; i ++){
          pages.push(choice(keywordCache))
        }
        return new Promise((resolve) => {
          resolve(
            <div>
              <span className="block-type">randompages</span>
              <ul className="list-block">
                {pages
                .map((k, i) => <li key={i}>
                    <a href="#" onClick={(e) => {linkClick(k); e.stopPropagation()}}>{k}</a>
                    <span className="bracket-icon" onClick={(e) => {subLinkClick(k); e.stopPropagation()}}>[]</span>
                  </li>)}
              </ul>
            </div>
          )
        })
      })
  }, [linkClick, props.user, subLinkClick])
  const rssBlock = useCallback((body: string) => {
    const lines = body.split(/[\r\n]/);
    let title = ""
    if(lines.length >= 2){
      title = lines[1]
    }
    const req = new Request("https://info-proxy.inajob.freeddns.org/test?rss=" + encodeURIComponent(lines[0]), {
      method: "GET"
    })
    
    throw fetch(req).then((response) => {
      return response.json()
    }).then((obj) => {
        console.log(obj)
        if(title == ""){
          title=obj.title
        }
        return new Promise((resolve) => {
          resolve(
            <div>
              {obj.entries.map((e: { title: string, link: string }, i:number) => <li key={i}>
                <a href="#" onClick={(ev) => {
                  linkClick(title+"-"+e.title, ["", e.link, "[" + title + "]"]);
                  ev.stopPropagation()
                  }}>{title}-{e.title}</a>
                </li>)}
            </div>
          )
        })
      })
  }, [linkClick])
  const codeBlock = (body: string) => {
    console.log("codeBlock", body)
    const result = hljs.highlightAuto(body)
    throw new Promise((resolve) => {
      resolve(<div className="code-block" dangerouslySetInnerHTML={{__html: result.value}}></div>)
    })
  }
const mermaidBlock = (body: string) => {
  const r = Math.floor(Math.random()*1000)
  throw mermaid.render("mermaid-" + r, body).then((o) => {
    console.log("svg", o)
    return <div>
      <span className="block-type">mermaid</span>
      <div dangerouslySetInnerHTML={{__html: o.svg}}></div>
      </div>
  })
}
const itemBlock = (body:string) => {
  const lines = body.split(/[\r\n]/);
  const link = lines[0]
  const img = lines[1]
  const title = lines[2]
  return <div>
      <div><span className="block-type">item</span></div>
      <div className="item-block">
        <a href={link}>
          <div className="item-block-img"><img src={img} /></div>
          <div className="item-block-title">{title}</div>
          </a>
      </div>
    </div>
}
  const blockStyles = useMemo(() => { return {
    list: listBlock,
    table: csvToTable,
    url: urlBlock,
    randompages: randompagesBlock,
    code: codeBlock,
    mermaid: mermaidBlock,
    rss: rssBlock,
    item: itemBlock,
  }
  },[listBlock, randompagesBlock, rssBlock]); // なぜlistBlockだけ？
  
  // 入力補完用keywordを取得
  useEffect(() => {
    const r = Math.floor(Math.random()*1000)
      const req = new Request(API_SERVER + "/keywords/" + props.user + "?detail=1&r=" + r, {
      method: "GET"
    })
    fetch(req).then((response) => {
      return response.json()
    }).then((response) => {
      console.log(response)
      setKeywords(response.keywords.map((k: { keyword: string }) => k.keyword))
    })
  }, [props.user])

  // == Text Popup Handlers ============================
  const onBracket = (select: TextFragment|null) => {
    if(!select){
      throw new Error("select is null")
    }
    const part = select.prefix + "[" + select.selection + "]";
    const change:TextChangeRequest = {
      value: part + select.suffix,
      column: part.length
    };
    return change;
  };
  const textPopupHandlers = [
    { name: "[link]", handler: onBracket },
  ];

  // ブラウザ履歴が変更された
  useEffect(() => {
    window.addEventListener("popstate", function() {
      const opts = getOpts()
      console.log("popstate", "pageId", pageId, "opts", opts) // これが無いと動かない？
      if(pageId.user != opts.user || pageId.pageId != opts.id){
       setPageId({user: opts.user, pageId: opts.id})
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  
  return (
    <>
      <div>
        <div id="controller">
          <div className="button">New Diary</div>
          <div className="button">Delete</div>
          <div className="button">Rename</div>
          <div className="button" onClick={() => {
            alert("Info button")
          }}>Info</div>
        </div>
        <div id="main">
          <div id="left-editor">
            <EditorPane
              textPopupHandlers={textPopupHandlers}
              keywords={keywords}
              blockStyles={blockStyles}
              onLinkClick={linkClick}
              onSubLinkClick={subLinkClick}
              user={pageId.user}
              pageId={pageId.pageId}
              showListDialog={showListDialog}
              defaultLines={defaultLines}
              />
          </div>
          <div id="right-editor">
            <EditorPane
              textPopupHandlers={textPopupHandlers}
              keywords={keywords}
              blockStyles={blockStyles}
              onLinkClick={linkClick}
              onSubLinkClick={subLinkClick}
              user={rightPageId.user}
              pageId={rightPageId.pageId}
              showListDialog={showListDialog}
              defaultLines={defaultLines}
            />
          </div>
        </div>
        <div id="side">
          <EditorPane
              textPopupHandlers={textPopupHandlers}
              keywords={keywords}
              blockStyles={blockStyles}
              onLinkClick={linkClick}
              onSubLinkClick={subLinkClick}
              user={pageId.user}
              pageId={"menu"}
              showListDialog={showListDialog}
              defaultLines={defaultLines}
            />
        </div>
      </div>
      <Dialog listInDialog={listInDialog} isOpen={openDialog} setIsOpen={setOpenDialog} />
    </>
  )
}
export default App
