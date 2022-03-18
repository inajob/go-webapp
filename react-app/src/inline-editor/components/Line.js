import React from 'react';
import PropTypes from 'prop-types'
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete"
import "@webscopeio/react-textarea-autocomplete/style.css";

class Line extends React.Component{
  constructor(props) {
    super(props)
    this.dirtyByKeyDown = false;
    this.send = this.send.bind(this);
    this.keyHandler = this.keyHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
  }
  send(e){
    this.props.onChange(this.props.no, e.target.value)

    if(this.props.onUpdate && this.dirtyByKeyDown){
      this.props.onUpdate() // trigger save or something
      this.dirtyByKeyDown = false;
    }
    return;
  }
  keyHandler(e){
    switch(e.keyCode){
      case 9: // tab
      this.props.onTab(this.props.no, this.props.text, e.shiftKey)
      this.props.onUpdate()
      e.preventDefault()
      break
      case 38: //up
      this.props.onUp(this.props.no, e.target.selectionStart, this.props.text)
      break;
      case 40: //down
      this.props.onDown(this.props.no, e.target.selectionStart, this.props.text)
      break;
      case 37: //left
      // when cursor is head
      if(e.target.selectionStart === 0 && e.target.selectionEnd === 0){
        this.props.onLeftUp(this.props.no)
      }else{
      }
      break;
      case 39: //right
      // when cursor is end
      if(e.target.selectionStart === this.props.text.length){
        this.props.onDown(this.props.no, 0, this.props.text)
      }else{
      }
      break;
      case 13: //enter
      let ret = this.props.onEnter(this.props.no, this.props.text, e.target.selectionStart, e.shiftKey)
      if(ret.preventDefault){
        e.preventDefault()
      }
      if(ret.update){
        this.props.onUpdate()
      }
      break;
      case 8: //BS
      // when cursor is head
      if(e.target.selectionStart === 0 && e.target.selectionEnd === 0){
        this.props.onBS(this.props.no, this.props.text)
        e.preventDefault()
      }
      this.props.onUpdate()
      break;
      default:
        // pass
        this.dirtyByKeyDown = true
    }
  }
  clickHandler(e){
    this.props.onClick(this.props.no);
  }
  render() {
    let loadingComponent = () => <span>Loading</span>
    let trigger = {
      "[": {
        dataProvider: token => {
          return this.props.keywords.filter((v) => v.toLowerCase().indexOf(token.toLowerCase()) !== -1).map((v) => {return {"value": "[" + v + "]"}});
        },
        component: ({ entity: { value } }) => <div>{`${value}`}</div>,
        output: (item, trigger) => item.value
      }
    }
    if(this.props.isBlock){
      return (
        <div className={'line ' + this.props.className} onClick={this.clickHandler}>
          <div style={{display: this.props.isFocus?"block":"none"}}>
            <ReactTextareaAutocomplete
              ref="rawInput"
              style={{height: this.props.height}}
              wrap="off"
              onChange={this.send}
              onKeyDown={this.keyHandler}
              loadingComponent={loadingComponent}
              trigger={trigger}
              value={this.props.text}
            />
          </div>
          <div>
            <div dangerouslySetInnerHTML={{__html:this.props.preview}} />
          </div>
        </div>
      )
    }else{
      // inline
      return (
        <div className={'line ' + this.props.className} style={this.props.indent>0?{marginLeft: (this.props.indent * 20)+"px"}:{}} onClick={this.clickHandler}>
          <div style={{display: this.props.isFocus?"block":"none"}}>
            <ReactTextareaAutocomplete
              ref="rawInput"
              style={{height: this.props.height}}
              onChange={this.send}
              onKeyDown={this.keyHandler}
              value={this.props.text}
              loadingComponent={loadingComponent}
              trigger={trigger}
            />
          </div>
          <div style={{display: !this.props.isFocus?"block":"none"}}>
            <div dangerouslySetInnerHTML={{__html:this.props.preview}} />
          </div>
        </div>
      )
    }
  }
  updateFocus(){
    if(this.props.isFocus){
      this.refs.rawInput.textareaRef.focus();
      if(this.props.dirty){
        var that = this;
        setTimeout(function(){
          // FIXME: remove setTimeout
          that.refs.rawInput.textareaRef.setSelectionRange(that.props.column, that.props.column);
          that.props.onRefreshed(that.props.no, that.props.column);
        },10);
      }
    }
  }
  componentDidUpdate(){
    this.updateFocus()
  }
  componentDidMount(){
    this.updateFocus()
  }

}
Line.propTypes = {
  onChange: PropTypes.func.isRequired,
  onUp: PropTypes.func.isRequired,
  onDown: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onLeftUp: PropTypes.func.isRequired,
  onBS: PropTypes.func.isRequired,
  onRefreshed: PropTypes.func.isRequired,
  no: PropTypes.number.isRequired,
  isBlock: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
}

export default Line
