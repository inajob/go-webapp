import React from 'react';

class LoginButton extends React.Component{
  constructor(props) {
    super(props)
  }
  render() {
    if(!this.props.logined){
      return (
        <div style={{backgroundColor: "#ffd", marginBottom:"1em"}}>
          <button onClick={this.props.onLoginClick}>LOGIN</button>
        </div>
      )
    }else{
      return (
        <div style={{backgroundColor: "#ffd", marginBottom:"1em"}}>
          <div>Login as {this.props.user}</div>
          <button onClick={this.props.onLogoutClick}>LOGOUT</button>
        </div>
      )
    }
  }
}

export default LoginButton
