import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import { connect } from 'react-redux'

class App extends React.Component{
  render() {
  return (
  <div>

    <div className="header">
      <h1 className="logo">inline</h1>
      <LoginButton logined={this.props.loginButton.login} user={this.props.loginButton.user} onLoginClick={this.props.onLoginClick} onLogoutClick={this.props.onLogoutClick} />
    </div>
    <div className="contents">
      <div className="main">
        <div style={{backgroundColor: "#ddd", fontSize:"small"}}>"inline" はインライン編集できるWIKIのようなものです</div>
        <Lines lines={this.props.lines} cursor={this.props.cursor} onUpdate={this.props.onUpdate} />
      </div>
      <div className="side">
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
  </div>
)
  }}
const mapStateToProps = (state, ownProps) => {
  console.log(state.loginButton)
  return {
    lines: state.lines,
    cursor: state.cursor,
    items: state.items,
    loginButton: state.loginButton,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
