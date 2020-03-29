function items(state = [], action){
  let newState;
  switch(action.type){
    case 'INSERT_ITEM':
      newState = state.slice()
      newState.push({text: action.text})
      return newState
    default:
      return state
  }
}

export default items
