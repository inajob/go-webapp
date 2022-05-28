let lineIndex = 1;
function lines(state = [{text:"", index: 0}], action){
  let newState;
  switch(action.type){
    case 'PREVIEW_LINE':
      //console.log("PREVIEW_LINE", action.no, action.preview)
      return state.map((item, index) => {
        if(index !== action.no){
          return item
        }
        return {
          text: item.text,
          index: item.index,
          preview: action.preview
        }
      })
    case 'CHANGE_LINE':
      //console.log("CHANGE_LINE", action.no, action.text)
      return state.map((item, index) => {
        if(index !== action.no){
          return item
        }
        return {
          text: action.text,
          index: item.index,
          preview: action.preview
        }
      })
    case 'INSERT_LINE':
      //console.log("INSERT_LINE", action.no, action.text)
      newState = state.slice()
      newState.splice(action.no, 0, {
        text: action.text,
        index: lineIndex ++,
        preview: action.preview
      })
      return newState
    case 'DELETE_LINE':
      //console.log("DELETE_LINE", action.no)
      newState = state.slice()
      newState.splice(action.no, 1)
      return newState
    case 'CLEAR_ALL':
      //console.log("CLEAR_ALL")
      return [{text:"", index: lineIndex ++}]

    default:
      // pass
  }
  return state
}

export default lines
