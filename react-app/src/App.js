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
      <div style={{backgroundColor: "#ddd", fontSize:"small"}}>"inline" はインライン編集できるWIKIのようなものです</div>
      </div>
      <LoginButton logined={this.props.loginButton.login} user={this.props.loginButton.user} onLoginClick={this.props.onLoginClick} onLogoutClick={this.props.onLogoutClick} />
    </div>
    <div>
      <Controller logined={this.props.loginButton.login} onNewDiary={this.props.onNewDiary} onNewJunk={this.props.onNewJunk} />
    </div>
    <div className="contents">
      <div className="main">
        <Lines lines={this.props.lines} cursor={this.props.cursor} onUpdate={this.props.onUpdate} />
        <Search onUpdateKeyword={this.props.updateKeyword} onSearch={this.props.onSearch(this.props.sendSearch)} keyword={this.props.search.keyword} results={this.props.search.results} />
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
