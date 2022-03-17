import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {changeLine, insertLine, deleteLine, setCursor} from '../actions'
import Line from './Line'
import {isBlock, Render, getCursorPos, numLines, getLines} from '../utils/render'

class Lines extends React.Component{
  //constructor(props) {
  //  super(props)
  //}
  render() {
    return (
      <div>
        {this.props.lines.map((line, index) => (
          <Line
                key={index}
                {...line}
                {...calcFocus(this.props.cursor.editable, this.props.cursor.col, this.props.cursor.row, this.props.cursor.dirty, index)}
                no={index}
                height={numLines(line.text)*24 + "px"}
                isBlock={isBlock(line.text)}
                items={this.props.items}
                context={this.props.context}
                className={calcClassName(line.text)}
                indent={calcIndent(line.text)}
                onChange={this.props.onChange(this.props.name)}
                onUpdate={this.props.onUpdate}
                onUp={this.props.onUp(
                        this.props.name,
                        index===0?"":this.props.lines[index - 1])}
                onDown={this.props.onDown(
                        this.props.name,
                        index>=this.props.lines.length - 1?"":this.props.lines[index + 1].text, index >= this.props.lines.length - 1)}
                onEnter={this.props.onEnter(this.props.name, this.props.onMagic)}
                onTab={this.props.onTab(this.props.name)}
                onClick={this.props.onClick(this.props.name)}
                onLeftUp={this.props.onLeftUp(
                        this.props.name,
                        index===0?"":this.props.lines[index - 1].text)}
                onBS={this.props.onBSfunc(
                        this.props.name,
                        index===0?"":this.props.lines[index - 1].text)}
                onRefreshed={this.props.onRefreshed(this.props.name)}
                />
        ))}
      </div>
    )
  }
}
Lines.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onUp: PropTypes.func.isRequired,
  onDown: PropTypes.func.isRequired,
  onEnter: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onBSfunc: PropTypes.func.isRequired,
}

const calcFocus = ((editable, col, row, dirty, index) => {
  if(index === row && editable){
    return {
      isFocus: true,
      column: col,
      dirty: dirty
    }
  }else{
    return {
      isFocus: false
    }
  }
})

const calcClassName = (text) => {
  let className = "normal"
  if(isBlock(text)){
    className = "block"
  }else{
    if(text.indexOf("###") === 0){
      className = "h3"
    }else if(text.indexOf("##") === 0){
      className = "h2"
    }else if(text.indexOf("#") === 0){
      className = "h1"
    }else if(text.indexOf("-") === 0){
      className = "list"
    }else if(text.length === 0){
      className = "empty"
    }
  }
  return className;
}
const calcIndent = (text) => {
  let count = 0;
  if(!isBlock(text)){
    if(text.indexOf("-") === 0){
      while(text.indexOf("-", count) === count){
        count ++;
      }
    }
  }
  return count;
}

const mapStateToProps = (state, ownProps) => {
  return {}
}

function makeGlobal(ownProps){
  return {
    sendSearch: ownProps.sendSearch,
    sendSearchSchedule: ownProps.sendSearchSchedule,
    list: ownProps.items,
    keywords: ownProps.context?ownProps.context.keywords:[], // TODO: why context is undefined?
    user: ownProps.user,
    mermaidRender: ownProps.mermaidRender
  };
}


const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onChange: (name) => (no, text) => {
      dispatch(changeLine(name, no, text, Render(name, no, text, makeGlobal(ownProps), dispatch)))
    },
    onUp: (name, upText) => (no, col, text) => {
      if(no <= 0){
        return;
      }
      let pos = getCursorPos(col,text);
      if(isBlock(text) && pos[1] > 0){
        return;
      }
      if(isBlock(upText.text)){
        let lines = getLines(upText.text);
        lines.pop()
        let firstPart = lines.join("\n");
        dispatch(setCursor(name, no - 1, firstPart.length + col, true))
      }else{
        dispatch(setCursor(name, no - 1, col, true))
      }
    },
    onDown: (name, downText, lastLineFlag) => (no, col, text) => {
      let num = numLines(text);
      let pos = getCursorPos(col,text);
      if(isBlock(text) && pos[1] < num - 1){
        return;
      }
      if(isBlock(downText)){
        let lines = getLines(downText);
        let firstLine = lines[0];
        dispatch(setCursor(name, no + 1, Math.min(col, firstLine.length), true))
      }else{
        if(!lastLineFlag){
          dispatch(setCursor(name, no + 1, col, true))
        }
      }
    },
    onEnter: (name, onMagic) => (no, text, pos, shift) => {
      if(isBlock(text)){
        if(shift){
          dispatch(insertLine(name, no + 1, "", ""))
          dispatch(setCursor(name, no + 1, 0, true))
          return {preventDefault: true, update: true};
        }
        return {preventDefault: false, update: true};
      }else{
        if(shift){
          dispatch(setCursor(name, no, pos, true))
          onMagic(no, pos, text)
          return {preventDefault: false, update: false};
        }else{
          dispatch(setCursor(name, no + 1, 0, true))
          if(text === undefined)text = ""
          let t1 = text.slice(0, pos)
          dispatch(changeLine(name, no, t1, Render(name, no, t1, makeGlobal(ownProps), dispatch)))
          let t2 = text.slice(pos)
          dispatch(insertLine(name, no + 1, t2, Render(name, no + 1, t2, makeGlobal(ownProps), dispatch)))
          return {preventDefault: true, update: true}; // prevent default
        }
      }
    },
    onTab: (name) => (no, text, shift) => {
      if(shift){
        if(text.search(/-+ /) === 0){ // already list
          if(text.indexOf("- ") === 0){
            text = text.slice(2);
          }else{
            text = text.slice(1);
          }
        }else{ // not list
          // none
        }
      }else{
        if(text.search(/-+/) === 0){ // already list
          text = "-" + text
        }else{ // first list
          text = "- " + text
        }
      }
      dispatch(changeLine(name, no, text, Render(name, no, text, makeGlobal(ownProps), dispatch)))
    },
    onLeftUp: (name, pretext) => (no) =>{
      if(no > 0){
        dispatch(setCursor(name, no - 1, pretext.length, true))
      }
    },
    onBSfunc: (name, pretext) => (no, text) =>{
      dispatch(setCursor(name, no - 1, pretext.length, true))
      let t = pretext + text;
      dispatch(changeLine(name, no-1, t, Render(name, no - 1, t, makeGlobal(ownProps), dispatch)))
      dispatch(deleteLine(name, no))
    },
    onClick: (name) => (no) => {
      dispatch(setCursor(name, no, 0, false))
    },
    onRefreshed: (name) => (no, col) => {
      dispatch(setCursor(name, no, col, false))
    }
  }
}

const LinesContainer = connect(mapStateToProps, mapDispatchToProps)(Lines)

export default LinesContainer
