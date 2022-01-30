function items(state = [], action){
  let newState;
  switch(action.type){
    case 'INSERT_ITEM':
      newState = state.slice()
      newState.push(action.item)
      return newState
    case 'CLEAR_ITEM':
      return []
    default:
      return state
  }
}

export default items
