import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import Search from './components/Search'
import ModalList from './components/ModalList'
import Controller from './components/Controller'
import { connect } from 'react-redux'
import {changeLine, insertLine, setCursor, setReadOnly, setReadWrite} from './inline-editor/actions'
import {Render} from './inline-editor/utils/render'
import { updateKeyword, updateResults, modalListOpen} from './actions'

class App extends React.Component{
  render() {
  return (
  <div>
    <div className="header">
      <div className="logo">
      <h1>inline</h1>
      <div style={{backgroundColor: "#eee", fontSize:"small"}}>"inline" はインライン編集できるWIKIのようなものです</div>
      </div>
      <LoginButton logined={this.props.loginButton.login} user={this.props.loginButton.user} onLoginClick={this.props.onLoginClick} onLogoutClick={this.props.onLogoutClick} />
    </div>
    <div>
      <Controller logined={this.props.loginButton.login} message={this.props.loginButton.message} isError={this.props.loginButton.isError} onNewDiary={this.props.onNewDiary} onNewJunk={this.props.onNewJunk} onDebug={this.props.onDebug} />
    </div>
    <div className={this.props.loginButton.isError?"contents error":"contents"}>
      <div className="main">
        <h1 className="title">{(this.props.title)}</h1>
        <Lines name="main" lines={this.props.lines} cursor={this.props.cursor} onMagic={this.props.onMagic} user={this.props.user} onUpdate={this.props.onUpdate} sendSearch={this.props.sendSearch} sendSearchSchedule={this.props.sendSearchSchedule} list={this.props.list} mermaidRender={this.props.mermaidRender} />

        <div className="instant-search">
          {Object.keys(this.props.instantSearch.results).map((k, j) => (
            <div className="piece" key={j}>
              <div>Search result of '{k}'</div>
              <div className="pages">
              {this.props.instantSearch.results[k].map((r, i) => (
                <li key={i}><div><a href={"?user=" + r.user + "&id=" + r.id}>{r.id}</a></div>
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
      <div className="side">
      <Lines name="side" lines={this.props.sideLines} cursor={this.props.sideCursor} />
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
    <ModalList
      {...this.props.modalList}
      items={this.props.items}
      title={this.props.title}
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
    cursor: state.cursor,
    sideCursor: state.sideCursor,
    items: state.items,
    loginButton: state.loginButton,
    search: state.search,
    instantSearch: state.instantSearch,
    modalList: state.modalList,
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
          document.location.href = '?user=' + user + '&id=' + to
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
    onDebug: () => {
      dispatch(modalListOpen())
    },
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
