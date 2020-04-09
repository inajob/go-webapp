import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import Search from './components/Search'
import Controller from './components/Controller'
import { connect } from 'react-redux'
import { updateKeyword, updateResults } from './actions'

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
      <Controller logined={this.props.loginButton.login} onNewDiary={this.props.onNewDiary} onNewJunk={this.props.onNewJunk} />
    </div>
    <div className="contents">
      <div className="main">
        <Search onUpdateKeyword={this.props.updateKeyword} onSearch={this.props.onSearch(this.props.sendSearch)} keyword={this.props.search.keyword} results={this.props.search.results} />

        <Lines lines={this.props.lines} cursor={this.props.cursor} onUpdate={this.props.onUpdate} />

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
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
  </div>
  )
  }}
const mapStateToProps = (state, ownProps) => {
  return {
    lines: state.lines,
    cursor: state.cursor,
    items: state.items,
    loginButton: state.loginButton,
    search: state.search,
    instantSearch: state.instantSearch,
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
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
