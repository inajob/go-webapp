import React from 'react';

class List extends React.Component{
  render() {
    return (
      <div className="list">
        <ul>
          {this.props.items.sort((a, b) => b.modTime - a.modTime).map((item, index) => (
            <li key={index}><a href={"?user="+ this.props.user +"&id="+item.name}>{item.name}</a></li>
          ))}
        </ul>
      </div>
    )
  }
}

export default List
