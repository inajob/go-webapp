function popupMenu(state = {left: 0, top: 0, show: false, items:[]}, action){
  switch(action.type){
    case 'POPUP_SHOW':
      return {left: action.left, top: action.top, show: true, items: state.items}
    case 'POPUP_HIDE':
      return {left: state.left, top: state.top, show: false, items: state.items}
    case 'POPUP_UPDATE_ITEMS':
      return {left: state.left, top: state.top, show: state.show, items: action.items}
    default:
      return state
  }
}

export default popupMenu

