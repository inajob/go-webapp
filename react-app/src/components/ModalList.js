import React from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux'
import { 
  modalListUpdateList,modalListUp, modalListDown, modalListClose, modalListUpdateQuery
} from '../actions'
import {jsonp} from '../inline-editor/utils/jsonp';

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
    <Modal appElement={document.getElementById('root')} isOpen={this.props.phase !== "NONE"}>
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
         this.props.onSelectList,
         this.props.onClose,
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

const mapDispatchToProps = (dispatch) => {

  return {
    onModalQueryChange: (e) =>{
      dispatch(modalListUpdateQuery(e.target.value))
    },
    onKeyDown: (query, phase, provider, index, text, onSelectList, onClose) => (e) => {
      switch(e.keyCode){
        case 27: // esc
        dispatch(modalListClose())
        onClose()
        break;
        case 38: // up
        dispatch(modalListUp())
        break;
        case 40: // down
        dispatch(modalListDown())
        break;
        case 13: // enter
          switch(phase){
            case "PROVIDERS":
              switch(provider.name){
                case "amazon":
                jsonp("amazon", "http://web.inajob.tk/ad/amz.php?callback=amazon&q=" + encodeURIComponent(query), function(data){
                  let list = []
                  data.forEach((i) => {
                    list.push({
                      title: i.title,
                      image: i.mimage[0],
                      text:  ">> item\n"+i.link[0]+ "\n" +i.mimage[0] + "\n" + i.title,
                    })
                  })
                  dispatch(modalListUpdateList(list))
                })
                break
                case "aliexpress":
                  throw new Error("not implemented yet")
                default:
                  throw new Error("unknown provider",provider.name)
              }
              break;
            case "LIST":
              onSelectList(text)
              dispatch(modalListClose())
              onClose()
              break;
            default:
              throw new Error("unknown phase", phase)
          }
        break;
        default:
      }
    },

  }
}
const ModalListContainer = connect(()=>{return {}}, mapDispatchToProps)(ModalList)
export default ModalListContainer
