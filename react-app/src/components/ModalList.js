import React from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux'
import { 
  modalListUpdateList,modalListUp, modalListDown, modalListClose, modalListUpdateQuery
} from '../actions'
import {jsonp} from '../inline-editor/utils/jsonp';

class ModalList extends React.Component{
  constructor(props) {
    super(props)
    this.queryRef = React.createRef();
  }
  componentDidUpdate(){
    if(this.props.phase !== "NONE"){
      // TODO: below line doesn't work well. sometimes queryRef is null.
      // if call update, this works well but takes some freeze.
      if(this.queryRef.current){
        this.queryRef.current.focus()
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
         ref={this.queryRef}
         onChange={this.props.onModalQueryChange(this.props.phase, this.props.providers[this.props.providerIndex], this.props.items)}
         value={this.props.query}
         onKeyDown={this.props.onKeyDown(
         this.props.query,
         this.props.phase,
         this.props.items,
         this.props.title,
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
    onModalQueryChange: (phase, provider, items) => (e) =>{
      // TODO: this implementation is ad-hoc
      if(phase === "LIST" && provider.name === "page"){
        let viewList = []
        items.forEach((i)  => {
          if(i.name.indexOf(e.target.value) !== -1){
            viewList.push({
              title: i.name,
              text: "[" + i.name + "]",
            })
          }
        })
        dispatch(modalListUpdateQuery(e.target.value))
        dispatch(modalListUpdateList(viewList))
        return
      }
      dispatch(modalListUpdateQuery(e.target.value))
    },
    onKeyDown: (query, phase, items, title, provider, index, text, onSelectList, onClose) => (e) => {
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
                case "rename":
                  alert("RENAME:" + title + "->"  + query);
                break;
                case "page":
                  let viewList = []
                  console.log(items)
                  items.forEach((i)  => {
                    if(i.name.indexOf(query) !== -1){
                      viewList.push({
                        title: i.name,
                        text: "[" + i.name + "]",
                      })
                    }
                  })
                  dispatch(modalListUpdateList(viewList))
                break;
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
                  jsonp("aliexpress", "http://web.inajob.tk/ali-search/api.php?callback=aliexpress&q=" + encodeURIComponent(query), function(data){
                    let list = []
                    data.items.forEach((i) => {
                      let title = i.product_title.replace(/<[^>]*>/g, "")
                      let image = i.product_main_image_url + "_220x220.jpg"
                      list.push({
                        title: title,
                        image: image,
                        text:  ">> item\n"+i.promotion_link+ "\n" + image  + "\n" + title,
                      })
                    })
                    dispatch(modalListUpdateList(list))
                  })
                  break;
                default:
                  throw new Error("unknown provider",provider.name)
              }
              break;
            case "LIST":
              onSelectList(text, (provider.name === "page")?true:false)
              dispatch(modalListClose())
              onClose()
              e.preventDefault();
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
