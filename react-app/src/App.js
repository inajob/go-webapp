import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import Search from './components/Search'
import ModalList from './components/ModalList'
import Controller from './components/Controller'
import { connect } from 'react-redux'
import {insertLine, setReadOnly, setReadWrite} from './inline-editor/actions'
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
        <Search onUpdateKeyword={this.props.updateKeyword} onSearch={this.props.onSearch(this.props.sendSearch)} keyword={this.props.search.keyword} results={this.props.search.results} />

        <Lines name="main" lines={this.props.lines} cursor={this.props.cursor} onMagic={this.props.onMagic} onUpdate={this.props.onUpdate} />

        <div className="instant-search">
          {Object.keys(this.props.instantSearch.results).map((k, j) => (
            <div className="piece" key={j}>
              <div>{k}</div>
              <div className="pages">
              {this.props.instantSearch.results[k].map((r, i) => (
                <li key={i}><div><a href={"?user=" + r.user + "&id=" + r.id}>{r.id}</a></div><div>{r.text}</div></li>
              ))}
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="side">
      <Lines name="side" lines={this.props.sideLines} cursor={this.props.sideCursor} />
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
    <ModalList
      {...this.props.modalList}
      onSelectList={this.props.onSelectList(this.props.cursor)}
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
      sendSearch(keyword).then((resp) => {
        resp.json().then((o) => {
          dispatch(updateResults(o.lines))
        })
      })
    },
    updateKeyword: (keyword) => {
      dispatch(updateKeyword(keyword))
    },
    onSelectList: (cursor) => (text) => {
      dispatch(insertLine("main", cursor.row, text, Render("main", cursor.row, text)))
    },
    onModalListClose: () => {
      dispatch(setReadWrite("main"))
    },
    onMagic: () => {
      dispatch(setReadOnly("main"))
      dispatch(modalListOpen())
    },
    onDebug: () => {
      dispatch(modalListOpen())
    },
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
