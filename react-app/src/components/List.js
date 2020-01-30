import React from 'react';
import { connect } from 'react-redux'

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
            <li key={index}>[{item.text}]</li>
          ))}
        </ul>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    items: state.lines
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

const ListContainer = connect(mapStateToProps, mapDispatchToProps)(List)

export default ListContainer
