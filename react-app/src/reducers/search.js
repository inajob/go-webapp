function search(state = {keyword: "", results:[]}, action){
  let newState;
  switch(action.type){
    case 'SEARCH_UPDATE_KEYWORD':
      console.log(action)
      return {keyword: action.keyword, results: state.results}
    case 'SEARCH_UPDATE_RESULTS':
      return {keyword: state.keyword, results: action.results}
    default:
      return state
  }
  return state
}

export default search
