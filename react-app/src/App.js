import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import { connect } from 'react-redux'

class App extends React.Component{
  render() {
  return (
  <div>
    <div style={{paddingLeft:"100px"}}>
      <Lines lines={this.props.lines} cursor={this.props.cursor} onUpdate={this.props.onUpdate} />
    </div>

    <div style={{position:"absolute",top:"0px",left:"0px",backgroundColor:"#ddd",width:"100px"}}>
      <List items={this.props.items} user={this.props.user} />
    </div>

  </div>
)
  }}
const mapStateToProps = (state, ownProps) => {
  return {
    lines: state.lines,
    cursor: state.cursor,
    items: state.items,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
