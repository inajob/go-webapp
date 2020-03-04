import React from 'react';

class List extends React.Component{
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <div>List Component</div>
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
