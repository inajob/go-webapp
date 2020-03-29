import React from 'react';

class LoginButton extends React.Component{
  render() {
    if(!this.props.logined){
      return (
        <div className="login-button">
          <button onClick={this.props.onLoginClick}>LOGIN</button>
        </div>
      )
    }else{
      return (
        <div className="login-button">
          <div>Login as {this.props.user}</div>
          <button onClick={this.props.onLogoutClick}>LOGOUT</button>
        </div>
      )
    }
  }
}

export default LoginButton
