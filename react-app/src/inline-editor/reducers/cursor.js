function cursor(state = {title: "",col: 0, row: 0, dirty: false, editable: true}, action){
  switch(action.type){
    case 'SET_READONLY':
      console.log("SET_READONLY", action.name)
      return {
        title: state.title,
        row: state.row,
        col: state.col,
        dirty: state.dirty,
        editable: false,
      }
    case 'SET_READWRITE':
      console.log("SET_READWRITE", action.name)
      return {
        title: state.title,
        row: state.row,
        col: state.col,
        dirty: state.dirty,
        editable: true,
      }
    case 'SET_CURSOR':
      return {
        title: state.title,
        row: action.row,
        col: action.col,
        dirty: action.dirty,
        editable: state.editable,
      }
    case 'SET_TITLE':
      console.log("SET_TITLE", action.name)
      return {
        title: action.title,
        row: state.row,
        col: state.col,
        dirty: state.dirty,
        editable: state.editable,
      }

    default:
      // pass
  }
  return state;
}

export default cursor
