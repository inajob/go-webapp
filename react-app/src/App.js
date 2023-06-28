import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import Search from './components/Search'
import ModalList from './components/ModalList'
import Controller from './components/Controller'
import { connect } from 'react-redux'
import {changeLine, insertLine, setCursor, setReadOnly, setReadWrite, clearAll, setTitle} from './inline-editor/actions'
import {Render, isBlock} from './inline-editor/utils/render'
import { updateKeyword, updateResults, modalListOpen, clearInstantResults, clearItem} from './actions'

class App extends React.Component{
  render() {
  return (
  <div className="wrap">
    <div className="header">
      <div className="logo">
      <h1>{this.props.cursor.title}</h1>
      <div style={{backgroundColor: "#eee", fontSize:"small"}}>"inline" はインライン編集できるWIKIのようなものです</div>
      </div>
      <LoginButton logined={this.props.loginButton.login} user={this.props.loginButton.user} onLoginClick={this.props.onLoginClick} onLogoutClick={this.props.onLogoutClick} />
    </div>
    <div className="controller">
      <Controller logined={this.props.loginButton.login} message={this.props.loginButton.message} isError={this.props.loginButton.isError} onNewDiary={this.props.onNewDiary} onDelete={this.props.onDelete(this.props.user, this.props.cursor.title)} onNewJunk={this.props.onNewJunk} onDebug={this.props.onDebug(this.props.user, this.props.lines, this.props.context, this.props.opts, this.props.meta, this.props.postPage, this.props.savePromise)} />
    </div>
    <div className="popup" style={{display: this.props.popupMenu.show?"block":"none", top: this.props.popupMenu.top, left: this.props.popupMenu.left}}>
    {this.props.popupMenu.items.map((k) => <div key={k.title}><a href={k.link} target="_blank" rel="noopener noreferrer">{k.title}</a></div>)}
    </div>
    <div className={this.props.loginButton.isError?"contents error":"contents"}>
      <div className="main">
        <div className="editor-container">
          <div className="left-editor">
            <Lines
              name="main"
              lines={this.props.lines}
              cursor={this.props.cursor}
              onMagic={this.props.onMagic}
              user={this.props.user}

              items={this.props.items}
              context={this.props.context}

              render={this.props.render}
              onUpdate={this.props.onUpdate}
              sendSearch={this.props.sendSearch}
              sendSearchSchedule={this.props.sendSearchSchedule}
              mermaidRender={this.props.mermaidRender}
            />
            <div className="instant-search">
              {Object.keys(this.props.instantSearch.results).map((k, j) => (
                <div className="piece" key={j}>
                  <div>Search result of '{k}'</div>
                  <div className="pages">
                  {this.props.instantSearch.results[k].slice(0,20).map((r, i) => (
                    <li key={i}><div><a href={"?user=" + r.user + "&id=" + r.id} data-jump={r.id}>{r.id}</a><a href={"?user=" + r.user + "&id=" + r.id} data-id={r.id}>*</a></div>
                      <div>
                        {(() => {if(r.cover) return <img src={r.cover} alt="cover" />})()}
                        {r.text}
                      </div>
                    </li>
                  ))}
                  </div>
                </div>
              ))}
            </div>
            <Search onUpdateKeyword={this.props.updateKeyword} onSearch={this.props.onSearch(this.props.sendSearch)} keyword={this.props.search.keyword} results={this.props.search.results} />
          </div>
          <div className="right-editor">
            <h1 className="title">{(this.props.rightCursor.title)}</h1>
            <Lines name="right"
              lines={this.props.rightLines}
              cursor={this.props.rightCursor}
              sendSearch={this.props.sendSearch}
              items={this.props.items}
            />
          </div>
        </div>
      </div>
      <div className="side">
        <Lines name="side"
          lines={this.props.sideLines}
          cursor={this.props.sideCursor}
          items={this.props.items}
        />
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
    <ModalList
      {...this.props.modalList}
      items={this.props.items}
      title={this.props.cursor.title}
      onSelectList={this.props.onSelectList(this.props.cursor, this.props.modalList.targetLine)}
      onRename={this.props.onRename(this.props.sendRename, this.props.user)}
      onClose={this.props.onModalListClose}
    />
  </div>
  )
  }}
const mapStateToProps = (state, ownProps) => {
  return {
    lines: state.lines,
    sideLines: state.sideLines,
    rightLines: state.rightLines,
    cursor: state.cursor,
    sideCursor: state.sideCursor,
    rightCursor: state.rightCursor,
    items: state.items,
    loginButton: state.loginButton,
    search: state.search,
    instantSearch: state.instantSearch,
    modalList: state.modalList,
    popupMenu: state.popupMenu,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
    onSearch: (sendSearch) => (keyword) => {
      console.log("search", keyword)
      dispatch(updateResults([{text:"loading..."}]))
      sendSearch(keyword).then((resp) => {
        resp.json().then((o) => {
          dispatch(updateResults(o.lines))
        })
      })
    },
    onRename: (sendRename, user) => (from, to) => {
      sendRename(from, to).then((resp) => {
        resp.json().then((o) => {
          // jump to new page
          console.log(o)
          document.location.href = '?user=' + encodeURIComponent(user) + '&id=' + encodeURIComponent(to)
        })
      })
    },
    updateKeyword: (keyword) => {
      dispatch(updateKeyword(keyword))
    },
    onSelectList: (cursor, targetLine) => (text, inline) => {
      if(inline){
        let t1 = targetLine.text.slice(0, targetLine.pos)
        let t2 = targetLine.text.slice(targetLine.pos)
        let nextText = t1 + text + t2
        dispatch(changeLine("main", cursor.row, nextText, Render("main", cursor.row, nextText, global))) // TODO: global is deprecate
        dispatch(setCursor("main", cursor.row, cursor.col + text.length, true))
      }else{
        dispatch(insertLine("main", cursor.row, text, Render("main", cursor.row, text, global))) // TODO: global is deprecate
      }
    },
    onModalListClose: () => {
      dispatch(setReadWrite("main"))
    },
    onMagic: (no, pos, text) => {
      dispatch(setReadOnly("main"))
      dispatch(modalListOpen(no, pos, text))
    },
    onDebug: (user, lines, context, opts, meta, postPage, savePromise) => () => {
      let previousMeta = {...meta};
      let previousOpts = {id: opts.id, user: opts.user}
      //dispatch(modalListOpen())
      let newText = [];
      let out = [];
      let firstLine = true;
      lines.forEach((l) => {
        if(l.selected){
          out.push(l.text)
          if(firstLine){
            newText.push("[" + l.text + "]")
            firstLine = false;
          }
        }else{
          newText.push(l.text)
        }
      })

      // new page
      let id = out[0]
      dispatch(clearInstantResults())
      dispatch(clearAll("main"))
      const url = new URL(window.location)
      url.search = "?user=" + encodeURIComponent(user) + "&id=" + encodeURIComponent(id)
      window.history.pushState({},"", url)
      document.title = id
      opts.id = encodeURIComponent(id) // TODO: replace opts to context
      dispatch(clearItem())

      dispatch(setTitle("main", decodeURIComponent(id)))
      let lineNo = 0
      out.unshift("")
      out[0] = "from [" + decodeURIComponent(previousOpts.id) + "]"
      out[1] = ""
      out.forEach((l) => {
        dispatch(insertLine("main", lineNo, l , Render("main", lineNo, l, context)))
        lineNo ++;
      })
      // save new page
      savePromise().then((o) => {
        Object.assign(meta, o.meta)
        let rawLines = newText.map((line) => {
          if(isBlock(line)){
            return line + "\n<<"
          }else{
            return line
          }
        }).join("\n")
        // save original page
        postPage(previousOpts.user, previousOpts.id, rawLines, previousMeta.lastUpdate, previousMeta.image)
      })
    },
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
