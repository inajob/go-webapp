import React from 'react';

class List extends React.Component{
  render() {
    return (
      <div className="list">
        <ul>
          {this.props.items.map((item, index) => (
            <li key={index}><a href={"?user="+ this.props.user +"&id="+item.text}>{item.text}</a></li>
          ))}
        </ul>
      </div>
    )
  }
}

export default List
