import React from 'react';
import Modal from 'react-modal';

class ModalList extends React.Component{
  //constructor(props) {
  //  super(props)
  //}
  componentDidUpdate(){
    if(this.props.phase !== "NONE"){
      // TODO: below line doesn't work well.
      if(this.refs["query"]){
        this.refs["query"].focus()
      }
      var target = this.refs["item" + this.props.index];
      if(target){
        target.scrollIntoView()
      }
    }
  }

  render() {
    return (
    <Modal isOpen={this.props.phase !== "NONE"}>
       <input type="text"
         ref="query"
         onChange={this.props.onModalQueryChange}
         value={this.props.query}
         onKeyDown={this.props.onKeyDown(
         this.props.query,
         this.props.phase,
         this.props.providers[this.props.providerIndex],
         this.props.index,
         this.props.list[this.props.index]?this.props.list[this.props.index].text:"",
         this.props.cursor
       )} />

       <div className="modal-list" style={{display: this.props.phase === "PROVIDERS"?"block":"none"}}>
        <h1>ProviderList</h1>
        <ul className="modal-list-ul">
          {this.props.providers.map((item, i) => (
            <li key={i} className={(i===this.props.providerIndex)?"active":"deactive"}>
              <div>{item.name}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="modal-list" style={{display: this.props.phase === "LIST"?"block":"none"}}>
        <h1>List</h1>
        <ul className="modal-list-ul">
          {this.props.list.map((item, i) => (
            <li key={i} ref={"item"+i} className={(i===this.props.index)?"active":"deactive"}>
              <div><img src={item.image} alt="" />{item.title}</div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
    )
  }
}

export default ModalList
