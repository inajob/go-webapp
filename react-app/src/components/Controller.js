import React from 'react';

class Controller extends React.Component{
  render() {
    if(!this.props.logined){
      return (
        <div>
        </div>
      )
    }else{
      return (
        <div className={this.props.isError?"controller error":"controller"}>
          {/*
          <button>New Page</button>
          */}
          <span>{this.props.message}</span>
          <button onClick={this.props.onNewDiary}>New Diary</button>
          <button onClick={this.props.onNewJunk}>New Junk</button>
          <button onClick={this.props.onDelete}>Delete</button>
          <button onClick={this.props.onDebug}>onDebug</button>
          {/*
          <button>Rename</button>
          <button>Delete</button>
          */}
        </div>
      )
    }
  }
}

export default Controller
